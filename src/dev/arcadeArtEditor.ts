/** Native controls for reversible, local gym art correction recipes. */
import { ART_REGIONS, applyArtOperations, applyArtOperationsWithReport, colorHex, measureArt, parseArtOperations, referencePalette, type ArtArea, type ArtOperation, type ArtPixels } from './arcadeArt'
import { marsArcadeAnimationKey, parseMarsArcadeAnimations, type MarsArcadeAnimation, type MarsArcadeAnimationFrame, type MarsArcadeAnimationsFile } from '../game/marsArcadeAnimations'
import { decodeArtPng } from './arcadeArtPng'

interface ArtEditorHooks {
  selection(): { entry: MarsArcadeAnimation; frame: MarsArcadeAnimationFrame; file: MarsArcadeAnimationsFile }
  baseFile(): MarsArcadeAnimationsFile
  previews(images: Map<string, HTMLCanvasElement>, reference: HTMLCanvasElement | null): void
  saved(file: MarsArcadeAnimationsFile, key: string): void
}
const DRAFT_KEY = 'mars-arcade-gym-art-v1'
const SELECTION_KEY = 'mars-arcade-gym-selection-v1'
interface Source { pixels: ArtPixels; hash: string }
const sources = new Map<string, Promise<Source>>()
async function source(src: string): Promise<Source> {
  const existing = sources.get(src)
  if (existing) return existing
  const pending = (async () => {
    const response = await fetch(src)
    if (!response.ok) throw new Error(`Drawing unavailable (${response.status}): ${src}`)
    const bytes = await response.arrayBuffer()
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    const hash = [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
    return { pixels: await decodeArtPng(new Uint8Array(bytes)), hash }
  })()
  sources.set(src, pending)
  try { return await pending } catch (error) { sources.delete(src); throw error }
}
function canvasOf(p: ArtPixels): HTMLCanvasElement {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128
  canvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(p.data), 128, 128), 0, 0)
  return canvas
}

export function startGymArtEditor(root: HTMLElement, hooks: ArtEditorHooks) {
  const panel = root.querySelector<HTMLElement>('#gym-art')!
  const field = <T extends HTMLElement>(id: string) => panel.querySelector<T>(`#gym-art-${id}`)!
  const refSelect = field<HTMLSelectElement>('reference'), currentView = field<HTMLCanvasElement>('current'), referenceView = field<HTMLCanvasElement>('reference-view')
  const status = field<HTMLElement>('status'), metrics = field<HTMLElement>('metrics'), operationsView = field<HTMLElement>('operations')
  let drafts = new Map<string, ArtOperation[]>(), previews = new Map<string, HTMLCanvasElement>()
  const history: string[] = []
  let reference = '', fighter = '', version = 0, signature = '', rendering = 0, busy = false
  let lastFileLength = 0
  try {
    const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? '{}') as Record<string, unknown>
    for (const [src, operations] of Object.entries(saved)) {
      if (!src.startsWith('/art-source/arcade/') || src.includes('..')) continue
      const parsed = parseArtOperations(operations)
      if (parsed.length) drafts.set(src, parsed)
    }
  } catch { status.textContent = 'Local art draft could not be recovered; originals are available.' }
  const store = () => {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(Object.fromEntries(drafts))) } catch { status.textContent = 'Browser storage is full; keep this tab open until your copy is saved.' }
  }
  const checkpoint = () => { history.push(JSON.stringify(Object.fromEntries(drafts))); if (history.length > 40) history.shift() }
  const area = (): ArtArea => ({ x: Number(field<HTMLInputElement>('area-x').value), y: Number(field<HTMLInputElement>('area-y').value), width: Number(field<HTMLInputElement>('area-w').value), height: Number(field<HTMLInputElement>('area-h').value) })
  const scopeSources = () => {
    const selected = hooks.selection()
    return [...new Set(field<HTMLSelectElement>('scope').value === 'clip' ? selected.entry.frames.map(f => f.src) : [selected.frame.src])]
  }
  const message = (error: unknown) => { status.textContent = String(error instanceof Error ? error.message : error) }
  const showOriginal = () => field<HTMLInputElement>('original').checked
  function draw(canvas: HTMLCanvasElement, pixels: ArtPixels, selection?: ArtArea) {
    const ctx = canvas.getContext('2d')!
    ctx.putImageData(new ImageData(new Uint8ClampedArray(pixels.data), 128, 128), 0, 0)
    ctx.strokeStyle = '#8170aa'; ctx.lineWidth = .5
    ctx.beginPath(); ctx.moveTo(64, 0); ctx.lineTo(64, 128); ctx.moveTo(0, 119.5); ctx.lineTo(128, 119.5); ctx.stroke()
    if (selection) { ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = .5; ctx.strokeRect(selection.x + .25, selection.y + .25, selection.width - .5, selection.height - .5) }
  }
  function rebuildReferences() {
    const selected = hooks.selection(), changed = fighter !== selected.entry.fighter
    if (!changed && lastFileLength === selected.file.animations.length) return
    fighter = selected.entry.fighter; lastFileLength = selected.file.animations.length
    refSelect.replaceChildren()
    const seen = new Set<string>()
    for (const entry of selected.file.animations.filter(e => e.fighter === fighter)) entry.frames.forEach((frame, index) => {
      if (seen.has(frame.src)) return
      seen.add(frame.src)
      const option = document.createElement('option'); option.value = frame.src; option.textContent = `${entry.animation} · ${index + 1} ${frame.pose}`; refSelect.append(option)
    })
    const idle = selected.file.animations.find(e => e.fighter === fighter && e.animation === 'idle')?.frames[0]?.src
    if (changed || !seen.has(reference)) reference = idle ?? selected.frame.src
    refSelect.value = reference
  }
  function controls() {
    panel.querySelectorAll<HTMLButtonElement>('button[data-art-action]').forEach(button => { button.disabled = busy })
    field<HTMLButtonElement>('undo').disabled = busy || !history.length
    field<HTMLButtonElement>('save').disabled = busy || !hooks.selection().entry.frames.some(f => drafts.has(f.src))
  }
  async function paint() {
    const stamp = ++rendering, selected = hooks.selection(), src = selected.frame.src, chosenReference = reference
    panel.setAttribute('aria-busy', 'true')
    try {
      const [original, ref] = await Promise.all([source(src), source(chosenReference)])
      const corrected = applyArtOperations(original.pixels, drafts.get(src) ?? [])
      if (stamp !== rendering) return
      draw(currentView, showOriginal() ? original.pixels : corrected, area())
      draw(referenceView, ref.pixels, area())
      const a = measureArt(corrected), b = measureArt(ref.pixels)
      metrics.textContent = `Current: height ${a?.height ?? 'empty'}, body x ${a?.torsoBack ?? '–'}, feet ${a?.bottom ?? '–'}, foot center ${a?.footCenter ?? '–'}\nReference: height ${b?.height ?? 'empty'}, body x ${b?.torsoBack ?? '–'}, feet ${b?.bottom ?? '–'}, foot center ${b?.footCenter ?? '–'}\nBody difference ${a && b ? a.torsoBack - b.torsoBack : '–'}px · foot pivot 64 (tolerance 1px)\n${drafts.get(src)?.length ?? 0} corrections on this drawing · ${drafts.size} draft drawings`
      operationsView.textContent = (drafts.get(src) ?? []).map((o, i) => `${i + 1}. ${o.type}${o.type === 'palette' || o.type === 'color' ? ` in x${o.area.x} y${o.area.y}, ${o.area.width}×${o.area.height}${o.type === 'palette' && o.includeDistant ? ' · all colors' : ''}` : o.type === 'height' ? ` ${o.pixels}px` : o.type === 'shift' ? ` ${o.x}, ${o.y}` : ` body x${o.torsoBack}, feet ${o.bottom}`}`).join('\n') || 'Original drawing — no corrections'
      // Drafts recovered after reload also participate in actual stage playback.
      const next = new Map(previews)
      for (const drawing of new Set(selected.entry.frames.map(f => f.src))) {
        const ops = drafts.get(drawing)
        if (!ops) { next.delete(drawing); continue }
        next.set(drawing, canvasOf(applyArtOperations((await source(drawing)).pixels, ops)))
      }
      if (stamp !== rendering) return
      previews = next
      hooks.previews(showOriginal() ? new Map() : previews, field<HTMLInputElement>('overlay').checked ? canvasOf(ref.pixels) : null)
      panel.setAttribute('aria-busy', 'false')
      controls()
    } catch (error) { if (stamp === rendering) { panel.setAttribute('aria-busy', 'false'); message(error); controls() } }
  }
  function refresh() {
    rebuildReferences()
    const selected = hooks.selection()
    const next = `${selected.entry.fighter}:${selected.entry.animation}|${selected.frame.src}|${reference}|${version}`
    try { sessionStorage.setItem(SELECTION_KEY, JSON.stringify({ key: marsArcadeAnimationKey(selected.entry.fighter, selected.entry.animation), src: selected.frame.src })) } catch { /* Selection is optional recovery data. */ }
    if (next !== signature) { signature = next; void paint() }
  }
  async function apply(factory: () => Promise<ArtOperation> | ArtOperation) {
    if (busy) return
    busy = true; controls()
    const drawings = scopeSources()
    try {
      const operation = (await factory()), parsed = parseArtOperations([operation])[0]!
      const pending = await Promise.all(drawings.map(async src => {
        const ops = [...(drafts.get(src) ?? []), parsed]
        const before = applyArtOperations((await source(src)).pixels, drafts.get(src) ?? [])
        const result = applyArtOperationsWithReport(before, [parsed])
        return { src, ops, changed: result.changed, skipped: result.skipped }
      }))
      const changed = pending.reduce((sum, p) => sum + p.changed, 0), skipped = pending.reduce((sum, p) => sum + p.skipped, 0)
      const skippedText = skipped ? `; ${skipped} pixels outside tolerance skipped${parsed.type === 'palette' ? ' — enable “Match all colors” to include them' : ''}` : ''
      const detail = `${changed} pixels changed${skippedText}.`
      if (!changed) { status.textContent = `No pixels changed${skippedText}. Draft unchanged.`; return }
      pending.forEach(p => parseArtOperations(p.ops))
      checkpoint()
      pending.forEach(({ src, ops }) => drafts.set(src, ops))
      store(); version++; status.textContent = `Preview updated on ${drawings.length} drawing${drawings.length === 1 ? '' : 's'}; ${detail} Original files unchanged.`
    } catch (error) { message(error) } finally { busy = false; controls(); refresh() }
  }
  function undo() {
    const previous = history.pop()
    if (!previous || busy) return
    drafts = new Map(Object.entries(JSON.parse(previous) as Record<string, ArtOperation[]>)); previews.clear()
    store(); version++; status.textContent = 'Art correction undone'; refresh(); controls()
  }
  field('undo').addEventListener('click', undo)
  field('reset').addEventListener('click', () => {
    const drawings = scopeSources()
    checkpoint(); drawings.forEach(src => { drafts.delete(src); previews.delete(src) }); store(); version++
    status.textContent = 'Original artwork restored for the chosen scope'; refresh(); controls()
  })
  field('palette').addEventListener('click', () => { void apply(async () => {
    const selectedArea = area(), colors = referencePalette((await source(reference)).pixels, selectedArea)
    return { type: 'palette', area: selectedArea, colors, tolerance: Number(field<HTMLInputElement>('tolerance').value), includeDistant: field<HTMLInputElement>('all-colors').checked }
  }) })
  field('replace').addEventListener('click', () => { void apply(() => ({ type: 'color', area: area(), from: field<HTMLInputElement>('from').value, to: field<HTMLInputElement>('to').value, tolerance: Number(field<HTMLInputElement>('tolerance').value), shading: field<HTMLInputElement>('shading').checked })) })
  field('height-apply').addEventListener('click', () => { void apply(() => ({ type: 'height', pixels: Number(field<HTMLInputElement>('height').value) })) })
  field('height-match').addEventListener('click', () => { void apply(async () => {
    const measured = measureArt((await source(reference)).pixels)
    if (!measured) throw new Error('Reference artwork is empty')
    field<HTMLInputElement>('height').value = String(measured.height)
    return { type: 'height', pixels: measured.height }
  }) })
  field('align').addEventListener('click', () => { void apply(async () => {
    const measured = measureArt((await source(reference)).pixels)
    if (!measured) throw new Error('Reference artwork is empty')
    return { type: 'align', torsoBack: measured.torsoBack, bottom: measured.bottom }
  }) })
  field('shift').addEventListener('click', () => { void apply(() => ({ type: 'shift', x: Number(field<HTMLInputElement>('shift-x').value), y: Number(field<HTMLInputElement>('shift-y').value) })) })
  field<HTMLSelectElement>('region').addEventListener('change', () => {
    const a = ART_REGIONS[field<HTMLSelectElement>('region').value]
    if (a) { field<HTMLInputElement>('area-x').value = String(a.x); field<HTMLInputElement>('area-y').value = String(a.y); field<HTMLInputElement>('area-w').value = String(a.width); field<HTMLInputElement>('area-h').value = String(a.height) }
    version++; refresh()
  })
  for (const id of ['area-x', 'area-y', 'area-w', 'area-h', 'original', 'overlay']) field(id).addEventListener('change', () => { version++; refresh() })
  refSelect.addEventListener('change', () => { reference = refSelect.value; version++; refresh() })

  async function sample(kind: 'from' | 'to', x: number, y: number) {
    try {
      if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x > 127 || y > 127) throw new Error('Sample coordinates must be 0–127')
      const src = kind === 'to' ? reference : hooks.selection().frame.src
      const original = (await source(src)).pixels
      const pixels = kind === 'to' || showOriginal() ? original : applyArtOperations(original, drafts.get(src) ?? [])
      const i = (y * 128 + x) * 4
      if (!pixels.data[i + 3]) throw new Error('Choose a visible pixel to sample')
      field<HTMLInputElement>(kind).value = colorHex(pixels.data.subarray(i, i + 3))
      field<HTMLInputElement>('sample-x').value = String(x); field<HTMLInputElement>('sample-y').value = String(y)
      status.textContent = `${kind === 'from' ? 'Source' : 'Reference'} color sampled at ${x},${y}`
    } catch (error) { message(error) }
  }
  for (const [canvas, kind] of [[currentView, 'from'], [referenceView, 'to']] as const) canvas.addEventListener('click', event => {
    const rect = canvas.getBoundingClientRect()
    void sample(kind, Math.min(127, Math.floor((event.clientX - rect.left) * 128 / rect.width)), Math.min(127, Math.floor((event.clientY - rect.top) * 128 / rect.height)))
  })
  for (const kind of ['from', 'to'] as const) field(`sample-${kind}`).addEventListener('click', () => { void sample(kind, Number(field<HTMLInputElement>('sample-x').value), Number(field<HTMLInputElement>('sample-y').value)) })
  panel.addEventListener('keydown', event => {
    // Form buttons keep native Space/Enter behavior instead of toggling gym playback.
    event.stopPropagation()
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !(event.target instanceof HTMLInputElement)) { event.preventDefault(); undo() }
  })
  field('save').addEventListener('click', () => { void (async () => {
    if (busy) return
    const selected = hooks.selection(), drawings = [...new Set(selected.entry.frames.map(f => f.src))].filter(src => drafts.has(src))
    if (!drawings.length) return
    busy = true; controls(); status.textContent = 'Validating and saving a corrected copy…'
    try {
      const edits = await Promise.all(drawings.map(async src => ({ src, sourceHash: (await source(src)).hash, operations: drafts.get(src)! })))
      const referenceHash = (await source(reference)).hash
      const response = await fetch('/__gym/art', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ baseFile: hooks.baseFile(), key: marsArcadeAnimationKey(selected.entry.fighter, selected.entry.animation), reference: { src: reference, hash: referenceHash }, edits }) })
      if (!response.ok) throw new Error(await response.text())
      const result = await response.json() as { file: unknown; key: string }
      const file = parseMarsArcadeAnimations(result.file)
      drawings.forEach(src => { drafts.delete(src); previews.delete(src) }); history.length = 0; store(); version++
      hooks.saved(file, result.key)
      status.textContent = 'Corrected copy saved and selected. Original clip retained; new boxes await review.'
    } catch (error) { message(error) } finally { busy = false; controls(); refresh() }
  })() })
  controls()
  return { refresh, hasDrafts: () => drafts.size > 0 }
}

export function recoveredGymSelection(): { key: string; src: string } | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(SELECTION_KEY) ?? 'null')
    return value && typeof value.key === 'string' && typeof value.src === 'string' ? value : null
  } catch { return null }
}
