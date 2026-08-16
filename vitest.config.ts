import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Layout tests spawn headless Chrome and paginate real documents.
    testTimeout: 240_000,
    hookTimeout: 240_000,
  },
})
