import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Where the dev server's `/api-proxy` and `/media-proxy` point. Unset, it is the
  // API that this repository's local environment runs — see LOCAL-DEV.md. The old
  // default was `http://geonity.ibercivis.es:10003`; nothing listens on that port
  // on that host, so it could not reach anything, which is why repointing it costs
  // nobody a working setup. Whatever it names, it has to be reached through this
  // proxy: the API sends no CORS headers, so the browser blocks a cross-origin
  // call before it is made.
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8000'
  const secure = proxyTarget.startsWith('https://')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api-proxy': {
          target: proxyTarget,
          changeOrigin: true,
          secure,
          rewrite: (p) => p.replace(/^\/api-proxy/, ''),
        },
        '/media-proxy': {
          target: proxyTarget,
          changeOrigin: true,
          secure,
          rewrite: (p) => p.replace(/^\/media-proxy/, ''),
        },
      },
    },
  }
})
