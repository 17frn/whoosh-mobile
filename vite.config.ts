import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'WHOOSH',
        short_name: 'WHOOSH',
        description: 'Jejak Langkah & Galeri Perjalanan Anda',
        theme_color: '#101010',
        background_color: '#ffffff',
        icons: [
          {
            src: 'whoosh-icon.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: 'whoosh-icon.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      }
    })
  ],
  server: {
    host: true,   // Mengizinkan HP mengakses server di jaringan lokal
    port: 3000,   // Menggunakan port 3000 sesuai default Capacitor
  }
})

