import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.svg', 'favicon.svg'],
      manifest: {
        name: 'Soccer Pool 2026',
        short_name: 'SoccerPool',
        description: 'World Cup 2026 Prediction Game',
        theme_color: '#00c853',
        background_color: '#0a0a0a',
        display: 'standalone',
        start_url: '/soccer-pool/',
        scope: '/soccer-pool/',
        icons: [
          {
            src: 'pwa-icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'pwa-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  base: command === 'build' ? '/soccer-pool/' : '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('/react-dom') || id.includes('/react-router-dom') || (id.includes('/react/') && !id.includes('/react-i18next'))) return 'react-vendor'
          if (id.includes('/@supabase/')) return 'supabase'
          if (id.includes('/framer-motion/')) return 'framer'
          if (id.includes('/recharts/') || id.includes('/d3-') || id.includes('/victory-')) return 'charts'
          if (id.includes('/i18next') || id.includes('/react-i18next')) return 'i18n'
          if (id.includes('/html2canvas/') || id.includes('/canvas-confetti/')) return 'canvas'
        },
      },
    },
  },
}))
