/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // API-kall skal ALDRI caches av service worker (unngår stale/lekket data mellom brukere).
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkOnly',
          },
        ],
      },
      manifest: {
        name: 'Timeplan - SFS 2213',
        short_name: 'Timeplan',
        description: 'Årsplan- og timeplanverktøy for avdelingsledere, basert på SFS 2213',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1a56db',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    // Ekskluder server/ - egne tester der kjøres med sin egen vitest.config.ts og andre avhengigheter.
    exclude: ['**/node_modules/**', 'server/**'],
  },
})
