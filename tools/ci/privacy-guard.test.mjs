import { describe, expect, it } from 'vitest'
import { scanPackage, scanRepo, scanText } from './privacy-guard.mjs'

describe('privacy guard', () => {
  it('passes the repository as it stands', () => {
    expect(scanRepo('.')).toEqual([])
  })

  it('catches tracking snippets and network APIs', () => {
    for (const code of ['gtag("config","G-1")', 'fbq("track")', 'navigator.sendBeacon(u, d)', 'new WebSocket(url)', 'new EventSource(u)', '<script src="https://www.googletagmanager.com/gtm.js">']) {
      expect(scanText('x.ts', code).length, code).toBeGreaterThan(0)
    }
  })

  it('catches remote URLs but not XML namespaces', () => {
    expect(scanText('x.ts', 'fetch("https://api.example.com/save")')).toHaveLength(1)
    expect(scanText('x.ts', 'createElementNS("http://www.w3.org/2000/svg","svg")')).toEqual([])
  })

  it('catches tracking packages in any dependency section', () => {
    expect(scanPackage({ dependencies: { '@vercel/analytics': '1' } })).toHaveLength(1)
    expect(scanPackage({ devDependencies: { '@sentry/react': '1' } })).toHaveLength(1)
    expect(scanPackage({ dependencies: { react: '19', three: '0.180' } })).toEqual([])
  })
})
