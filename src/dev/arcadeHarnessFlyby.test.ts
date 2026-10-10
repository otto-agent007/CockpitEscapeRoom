import {afterEach, describe, expect, it, vi} from 'vitest'
import {advanceMarsArcade, createMarsArcadeRound, NEUTRAL_MARS_ARCADE_INPUT} from '../game/marsArcade'
import {marsArcadeFighter} from '../game/marsArcadeFighters'
import {captainFlybyLook, drawCaptainFlybys, loadCaptainFlybyEffects} from './arcadeHarnessFlyby'

afterEach(() => vi.unstubAllGlobals())

describe('Captain aircraft image contract', () => {
  function images() {
    const instances: Array<{src: string; naturalWidth: number; naturalHeight: number; onload?: () => void; onerror?: () => void}> = []
    class FakeImage {
      src = ''; naturalWidth = 320; naturalHeight = 96
      onload?: () => void; onerror?: () => void
      constructor() {instances.push(this)}
    }
    vi.stubGlobal('Image', FakeImage)
    return instances
  }
  it('accepts all four320x96 effect cells', () => {
    const made = images(), loader = loadCaptainFlybyEffects()
    expect(made).toHaveLength(4)
    made.forEach(image => image.onload!())
    expect(loader.status()).toBe('4/4 flyby effects ready')
    for (const frame of [0,1,2,3] as const) expect(loader.get(frame)).toBe(made[frame])
  })
  it('rejects wrong-size and missing cells without throwing or pretending they are ready', () => {
    const made = images(), loader = loadCaptainFlybyEffects()
    expect(made).toHaveLength(4)
    made[0]!.onload!(); made[1]!.onload!()
    made[2]!.naturalWidth = 319; made[2]!.onload!(); made[3]!.onerror!()
    expect(loader.get(2)).toBeUndefined(); expect(loader.get(3)).toBeUndefined()
    expect(loader.status()).toContain('2/4 flyby effects')
    expect(loader.status()).toContain('wrong size'); expect(loader.status()).toContain('not found')
  })

  it('draws an available cell when frame zero and the requested cell are missing', () => {
    const made = images(), loader = loadCaptainFlybyEffects()
    made[0]!.onerror!(); made[1]!.onload!(); made[2]!.onerror!(); made[3]!.onerror!()
    const ctx = {save:vi.fn(), restore:vi.fn(), translate:vi.fn(), scale:vi.fn(), drawImage:vi.fn(), imageSmoothingEnabled:true}
    const state = createMarsArcadeRound('captain', 'booster'); state.phase = 'fight'
    Object.assign(state.fighters[0], {activity:'attack', activeButton:'special', moveFrame:0})
    drawCaptainFlybys(ctx as unknown as CanvasRenderingContext2D, state, loader, false, 3)
    expect(ctx.drawImage).toHaveBeenCalledExactlyOnceWith(made[1], -160, 0)
    expect(ctx.translate).toHaveBeenCalledWith(96, 84)
    expect(ctx.restore).toHaveBeenCalledOnce()
    ctx.drawImage.mockClear()
    const empty = {get:() => undefined, status:() => '0/4 flyby effects'}
    drawCaptainFlybys(ctx as unknown as CanvasRenderingContext2D, state, empty, false, 3)
    expect(ctx.drawImage).not.toHaveBeenCalled()
  })
})

describe('Captain flyby effect clock', () => {
  it('flies for the full special, about one second, while retaining static reduced motion on both sides', () => {
    const state = createMarsArcadeRound('captain', 'captain'); state.phase = 'fight'
    const move = marsArcadeFighter('captain').moves.special
    for (const side of [0,1] as const) for (const facing of [1,-1] as const) {
      Object.assign(state.fighters[side], {activity:'attack', activeButton:'special', facing})
      const duration=move.startupFrames+move.activeFrames+move.recoveryFrames
      expect(duration/60).toBeCloseTo(1,0)
      for (let tick=0; tick<=duration; tick++) {
        state.fighters[side].moveFrame=tick
        const before=structuredClone(state)
        const look=captainFlybyLook(state,side,false)
        const reduced=captainFlybyLook(state,side,true)
        if(tick<duration){
          expect(look?.frame).toBe(Math.min(3,Math.floor(tick*4/duration)))
          expect(look?.centerX).toBeCloseTo(facing===1?32+256*tick/(duration-1):288-256*tick/(duration-1))
          expect(look?.topRow).toBe(28)
          expect(look?.mirrored).toBe(facing===-1)
          expect(reduced).toEqual({frame:1, centerX:160, topRow:28, mirrored:facing===-1})
        }else{expect(look).toBeNull();expect(reduced).toBeNull()}
        expect(state).toEqual(before)
      }
    }
  })

  it('follows a real special, freezes through hit stop and preserves timing, damage and meter cost', () => {
    let state=createMarsArcadeRound('captain','booster');state.phase='fight';state.fighters[0].meter=70
    let landed=false
    for(let tick=0;tick<80;tick++){
      const next=advanceMarsArcade(state,[{...NEUTRAL_MARS_ARCADE_INPUT,special:tick===0},NEUTRAL_MARS_ARCADE_INPUT],1/60)
      state=next.state
      if(next.events.some(e=>e.type==='hit')){
        landed=true;expect(state.fighters[0].moveFrame).toBe(26);expect(state.fighters[0].meter).toBe(0)
        expect(state.fighters[1].health).toBe(70)
        const frozen=captainFlybyLook(state,0,false);expect(frozen).not.toBeNull()
        while(state.hitstop){state=advanceMarsArcade(state,[NEUTRAL_MARS_ARCADE_INPUT,NEUTRAL_MARS_ARCADE_INPUT],1/60).state;expect(captainFlybyLook(state,0,false)).toEqual(frozen)}
      }
    }
    expect(landed).toBe(true);expect(captainFlybyLook(state,0,false)).toBeNull()
  })

  it('disappears on interruption or terminal phase and never appears for other fighters', () => {
    const state=createMarsArcadeRound('captain','booster');state.phase='fight'
    Object.assign(state.fighters[0],{activity:'attack',activeButton:'special',moveFrame:26})
    expect(captainFlybyLook(state,0,false)).not.toBeNull()
    for(const phase of ['intro','ko','timeOver'] as const){state.phase=phase;expect(captainFlybyLook(state,0,false)).toBeNull()}
    state.phase='fight';state.fighters[0].activity='hitstun';expect(captainFlybyLook(state,0,false)).toBeNull()
    Object.assign(state.fighters[1],{activity:'attack',activeButton:'special',moveFrame:26});expect(captainFlybyLook(state,1,false)).toBeNull()
  })
})
