import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icon.svg', 'pwa-icon-192.png', 'pwa-icon-512.png', 'favicon.svg'],
      manifest: {
        name: 'BolãoCopa 2026',
        short_name: 'BolãoCopa',
        description: 'Bolão da Copa do Mundo 2026',
        theme_color: '#00c853',
        background_color: '#00c853',
        display: 'standalone',
        start_url: '/soccer-pool/',
        scope: '/soccer-pool/',
        icons: [
          {
            src: 'pwa-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        importScripts: ['custom-sw.js'], // handlers de Web Push (notificações)
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // SPA: serve o app shell em navegações de rota interna (deep links,
        // refresh e o app instalado abrindo em start_url), sem depender do
        // hack de 404 do GitHub Pages. Não intercepta arquivos (com extensão).
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/\/[^/?]+\.[^/?]+$/],
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
