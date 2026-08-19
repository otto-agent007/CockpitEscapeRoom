import { dc9LegacyFlow } from '../../game/config'
import { DC9_INSTRUMENTS, type Dc9InstrumentId } from '../../game/dc9FlightDeck'
import {
  DC9_INSTRUMENT_SCAN_ORDER,
  dc9InstrumentScanPrompt,
  dc9InstrumentScanShowsFinalSupport,
  type Dc9InstrumentScanProgress,
} from '../../game/dc9InstrumentScan'
import type { Dc9HotspotScreenPositions } from '../../scenes/PrototypeScene'

interface InstrumentScanPanelProps {
  progress: Dc9InstrumentScanProgress
  hotspots: Dc9HotspotScreenPositions
  projectionReady: boolean
  onIdentify: (instrument: Dc9InstrumentId) => void
}

export function InstrumentScanPanel({
  progress,
  hotspots,
  projectionReady,
  onIdentify,
}: InstrumentScanPanelProps) {
  const copy = dc9LegacyFlow.instrumentScan
  const prompt = dc9InstrumentScanPrompt(progress)
  const identified = new Set(progress.identified)
  const finalSupport = dc9InstrumentScanShowsFinalSupport(progress)

  return (
    <>
      {DC9_INSTRUMENT_SCAN_ORDER.map((instrumentId) => {
        const projection = hotspots[`dc9.gauge.${instrumentId}`]
        if (!projectionReady || !projection?.visible) return null
        const isIdentified = identified.has(instrumentId)
        return (
          <button
            key={instrumentId}
            type="button"
            className={`dc9-gauge-target${isIdentified ? ' is-identified' : ''}${finalSupport && instrumentId === prompt ? ' is-final-hint' : ''}`}
            // The list below offers the same action, so this one names its location to
            // keep the two apart for anyone reading the page by accessible name.
            aria-label={`${DC9_INSTRUMENTS[instrumentId].label} on the instrument panel${isIdentified ? ', identified' : ''}`}
            data-gauge={instrumentId}
            data-projection="mesh"
            style={{
              left: projection.x,
              top: projection.y,
              width: projection.width,
              height: projection.height,
            }}
            disabled={isIdentified}
            onClick={() => onIdentify(instrumentId)}
          />
        )
      })}

      <section className="dc9-instrument-scan" aria-labelledby="dc9-instrument-scan-title">
        <header>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="dc9-instrument-scan-title">{copy.title}</h2>
        </header>

        <p className="dc9-instrument-scan__intro">{copy.intro}</p>

        <p className="dc9-instrument-scan__question" aria-live="polite" aria-atomic="true">
          {prompt ? copy.prompts[prompt].question : copy.completionText}
        </p>
        <p className="dc9-document__note">{copy.instruction}</p>

        <ul className="dc9-instrument-scan__list" aria-label="Right-seat instruments">
          {DC9_INSTRUMENT_SCAN_ORDER.map((instrumentId) => {
            const isIdentified = identified.has(instrumentId)
            const highlighted = finalSupport && instrumentId === prompt
            return (
              <li key={instrumentId}>
                <button
                  type="button"
                  className={`dc9-instrument-choice${isIdentified ? ' is-identified' : ''}${highlighted ? ' is-final-hint' : ''}`}
                  aria-pressed={isIdentified}
                  disabled={isIdentified || prompt === null}
                  onClick={() => onIdentify(instrumentId)}
                >
                  <strong>{DC9_INSTRUMENTS[instrumentId].label}</strong>
                  <small>{isIdentified ? copy.prompts[instrumentId].reading : 'Not yet identified'}</small>
                </button>
              </li>
            )
          })}
        </ul>

        <p className="dc9-instrument-scan__progress">
          {progress.identified.length} of {DC9_INSTRUMENT_SCAN_ORDER.length} identified.
        </p>
        <small className="dc9-instrument-scan__disclaimer">{copy.disclaimer}</small>
      </section>
    </>
  )
}
