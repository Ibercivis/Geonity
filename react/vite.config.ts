import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api-proxy': {
        target: 'http://geonity.ibercivis.es:10003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, ''),
      },
      '/media-proxy': {
        target: 'http://geonity.ibercivis.es:10003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/media-proxy/, ''),
      },
    },
  },
})
