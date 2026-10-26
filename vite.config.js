import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/cost-soft/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'favicon.svg'],
      manifest: {
        name: '有数',
        short_name: '有数',
        description: '本地资产管理与日均成本记录',
        lang: 'zh-CN',
        theme_color: '#f2f3ee',
        background_color: '#f2f3ee',
        display: 'standalone',
        start_url: '/cost-soft/',
        scope: '/cost-soft/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: '/cost-soft/index.html'
      }
    })
  ]
})
