import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./client', import.meta.url)),
    },
  },
  test: {
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      include: ['client/**', 'server/**'],
      exclude: ['**/*.test.ts', 'server/scripts/**', 'server/index.ts', 'client/main.ts'],
    },
    projects: [
      {
        extends: true,
        test: { name: 'client', environment: 'jsdom', include: ['client/**/*.test.ts'] },
      },
      {
        extends: true,
        test: { name: 'server', environment: 'node', include: ['server/**/*.test.ts'] },
      },
    ],
  },
})
