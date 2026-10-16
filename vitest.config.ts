import { defineConfig } from 'vitest/config'

// Config aparte: los tests son de lógica pura y no necesitan @cloudflare/vite-plugin
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
})
