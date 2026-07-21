import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'tools/**/*.test.mjs'],
    coverage: {
      reporter: ['text', 'json-summary'],
      include: ['src/game/**/*.ts'],
    },
  },
})
