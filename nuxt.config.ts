// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: ['@nuxt/icon'],
  devServer: {
    port: 3500,
    host: '0.0.0.0'
  },
  vite: {
    server: {
      allowedHosts: true
    },
    optimizeDeps: {
      include: [],
      exclude: ['oxc-parser']
    }
  },
  typescript: {
    typeCheck: false
  },
  experimental: {
    payloadExtraction: false
  },
  build: {
    transpile: []
  },
  app: {
    head: {
      title: 'KFC Church Attendance System',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: 'Church attendance tracking and member management system' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'Church Attendance' },
        { name: 'theme-color', content: '#667eea' },
        { name: 'msapplication-TileColor', content: '#667eea' },
        { name: 'msapplication-config', content: '/browserconfig.xml' }
      ],
      link: [
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
        { rel: 'apple-touch-icon', href: '/icon-192x192.png' },
        { rel: 'mask-icon', href: '/icon.svg', color: '#667eea' }
      ]
    }
  }
})
