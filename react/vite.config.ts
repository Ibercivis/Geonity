import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Where the dev server's `/api-proxy` and `/media-proxy` point. Unset, it is the
  // server this file has always named, so nothing changes for anyone who does not
  // set it. Set to `http://localhost:8000`, the dev server talks to an API running
  // on the machine — which is the only way to do that, because the API sends no
  // CORS headers and the browser would block a cross-origin call.
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://geonity.ibercivis.es:10003'
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
