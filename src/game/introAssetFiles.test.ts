/// <reference types="node" />

import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

describe('deployable intro asset files', () => {
  it('pass the production dimension, grid, and audio checks', () => {
    const output = execFileSync(process.execPath, ['tools/intro/validate-assets.mjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
    })

    expect(output).toContain('3 sprite sheets valid')
    expect(output).toContain('53.040-second audio valid')
  })
})
