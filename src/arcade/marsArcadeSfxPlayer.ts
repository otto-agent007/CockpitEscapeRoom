import { MARS_ARCADE_SOUNDS, isArcadeVoice, marsArcadeSoundUrl, type ArcadeSoundSettings, type MarsArcadeSoundCue } from '../game/marsArcadeSfx'

export type ArcadeAudioStatus = 'loading' | 'ready' | 'partial' | 'blocked' | 'unavailable'

/** One audio owner per earned arcade iframe. Gameplay never awaits this player. */
export class MarsArcadeSfxPlayer {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private bus: DynamicsCompressorNode | null = null
  private buffers = new Map<string, AudioBuffer>()
  private loads = new Map<string, Promise<AudioBuffer | null>>()
  private failed = new Set<string>()
  private sources = new Set<AudioBufferSourceNode>()
  private voice: AudioBufferSourceNode | null = null
  private variation = new Map<string, number>()
  private active = false
  private disposed = false
  private epoch = 0
  private voiceEpoch = 0
  private resuming: Promise<void> | null = null
  private blocked = false
  private settings: ArcadeSoundSettings

  constructor(settings: ArcadeSoundSettings, private readonly report: (status: ArcadeAudioStatus) => void) {
    this.settings = { ...settings }
  }

  /** Decode during player selection; resume only from Start or another native gesture. */
  prepare(): void {
    if (this.disposed) return
    if (!this.context) {
      try {
        const Constructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Constructor) { this.report('unavailable'); return }
        this.context = new Constructor()
        this.master = this.context.createGain()
        this.master.gain.value = this.settings.muted ? 0 : this.settings.volume
        this.bus = this.context.createDynamicsCompressor()
        this.bus.threshold.value = -3
        this.bus.knee.value = 3
        this.bus.ratio.value = 20
        this.bus.attack.value = .001
        this.bus.release.value = .12
        this.bus.connect(this.master)
        this.master.connect(this.context.destination)
      } catch {
        if (this.context) void this.context.close().catch(() => {})
        this.context = null
        this.master = null
        this.bus = null
        this.report('unavailable')
        return
      }
    }
    this.report('loading')
    this.failed.clear()
    const urls = Object.values(MARS_ARCADE_SOUNDS).flat().map(marsArcadeSoundUrl)
    void Promise.all(urls.map(url => this.load(url))).then(() => {
      if (!this.disposed) this.report(this.blocked ? 'blocked' : this.failed.size ? 'partial' : 'ready')
    })
  }

  private load(url: string): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(url)
    if (cached) return Promise.resolve(cached)
    const existing = this.loads.get(url)
    if (existing) return existing
    if (this.failed.has(url)) return Promise.resolve(null)
    const context = this.context
    if (!context || this.disposed) return Promise.resolve(null)
    const request = (async () => {
      try {
        const response = await fetch(url)
        if (!response.ok) throw new Error('Sound unavailable')
        const buffer = await context.decodeAudioData(await response.arrayBuffer())
        if (this.disposed) return null
        this.buffers.set(url, buffer)
        this.failed.delete(url)
        return buffer
      } catch {
        if (!this.disposed) { this.failed.add(url); this.report('partial') }
        return null
      } finally { this.loads.delete(url) }
    })()
    this.loads.set(url, request)
    return request
  }

  unlock(): void {
    if (this.disposed || this.settings.muted || this.settings.volume === 0) return
    if (!this.context) this.prepare()
    const context = this.context
    if (!context || context.state === 'closed' || context.state === 'running' || this.resuming) return
    this.resuming = context.resume().then(() => {
      this.blocked = context.state !== 'running'
      if (!this.disposed) this.report(this.blocked ? 'blocked' : this.failed.size ? 'partial' : 'ready')
    }).catch(() => { this.blocked = true; if (!this.disposed) this.report('blocked') }).finally(() => { this.resuming = null })
  }

  setSettings(settings: ArcadeSoundSettings): void {
    this.settings = { ...settings }
    if (settings.muted || settings.volume === 0) this.stop()
    if (this.context && this.master) this.master.gain.setTargetAtTime(settings.muted ? 0 : settings.volume, this.context.currentTime, .01)
  }

  setActive(active: boolean): void {
    if (this.active === active) return
    this.active = active
    if (!active) this.stop()
  }

  stop(): void {
    this.epoch++
    this.voiceEpoch++
    for (const source of this.sources) {
      try { source.stop() } catch { /* Already ended. */ }
      source.disconnect()
    }
    this.sources.clear()
    this.voice = null
  }

  play(cue: MarsArcadeSoundCue): void {
    const context = this.context
    if (!context || this.disposed || !this.active || this.settings.muted || this.settings.volume === 0 || document.hidden) return
    // Never accumulate silent events behind a browser's autoplay gate.
    if (context.state !== 'running') {
      if (cue.sound === 'round' && this.resuming) {
        const epoch = this.epoch, requested = performance.now()
        void this.resuming.then(() => {
          if (this.epoch === epoch && performance.now() - requested < 200) this.play(cue)
        })
      }
      return
    }
    const choices = MARS_ARCADE_SOUNDS[cue.sound]
    const index = this.variation.get(cue.sound) ?? 0
    this.variation.set(cue.sound, index + 1)
    const url = marsArcadeSoundUrl(choices[index % choices.length]!)
    const epoch = this.epoch
    const voice = isArcadeVoice(cue.sound)
    const voiceEpoch = voice ? ++this.voiceEpoch : this.voiceEpoch
    const due = context.currentTime + (cue.delay ?? 0)
    const start = (buffer: AudioBuffer | null) => {
      if (!buffer || this.disposed || !this.active || this.settings.muted || this.epoch !== epoch
        || document.hidden || context.state !== 'running' || (voice && this.voiceEpoch !== voiceEpoch)) return
      // Slow downloads must not replay an old impact or an out-of-date announcement.
      if (context.currentTime - due > (cue.sound === 'round' ? .2 : .12)) return
      if (voice && this.voice) {
        this.voice.stop()
        this.sources.delete(this.voice)
        this.voice.disconnect()
      }
      while (this.sources.size >= 8) {
        const oldest = this.sources.values().next().value
        if (!oldest) break
        oldest.stop(); oldest.disconnect(); this.sources.delete(oldest)
      }
      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(this.bus!)
      source.onended = () => {
        this.sources.delete(source)
        source.disconnect()
        if (this.voice === source) this.voice = null
      }
      this.sources.add(source)
      if (voice) this.voice = source
      source.start(Math.max(context.currentTime, due))
    }
    const buffer = this.buffers.get(url)
    if (buffer) start(buffer)
    else void this.load(url).then(start)
  }

  dispose(): void {
    this.disposed = true
    this.stop()
    if (this.context) void this.context.close().catch(() => {})
    this.context = null
  }
}
