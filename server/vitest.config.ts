import { defineConfig } from 'vitest/config'

// Egen config her hindrer vitest fra å lete oppover og finne rot-repoets vite.config.ts,
// som importerer frontend-only plugins ikke installert i server/node_modules.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['**/node_modules/**', 'src/**/*.test.ts', 'src/scripts/**', '**/*.config.ts'],
    },
  },
})
