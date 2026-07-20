import { describe, expect, it } from 'vitest'
import {
  INTRO_EVIDENCE_TIMES,
  createIntroEvidenceFileName,
} from './introEvidence'

describe('intro evidence contract', () => {
  it('captures the ident midpoint and every production scene boundary', () => {
    expect(INTRO_EVIDENCE_TIMES).toEqual([0, 3, 6, 12, 16, 22, 28, 35, 42, 48, 51, 53])
  })

  it('uses sortable deterministic PNG names', () => {
    expect(createIntroEvidenceFileName(0, 'tmb2-ident')).toBe('00-00.00-tmb2-ident.png')
    expect(createIntroEvidenceFileName(9, 'catch')).toBe('09-48.00-catch.png')
  })
})
