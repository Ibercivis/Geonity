import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const isDev = mode === 'development'

  // Proxy específico para el endpoint nuevo de columnas (si vive en otro puerto / sin https)
  // Ej: http://geonity.ibercivis.es:10003
  const columnsProxyTarget = env.VITE_API_COLUMNS_PROXY_TARGET || ''
  const columnsProxyIsHttps = columnsProxyTarget.startsWith('https://')

  // Algunos endpoints “admin” pueden vivir en el mismo backend/puerto que las columnas.
  // Permite configurar uno distinto, con fallback al de columnas.
  const adminFieldsProxyTarget = env.VITE_API_ADMIN_FIELDS_PROXY_TARGET || columnsProxyTarget
  const adminFieldsProxyIsHttps = adminFieldsProxyTarget.startsWith('https://')

  // Proxy principal para /api:
  // - Si defines VITE_API_PROXY_TARGET, se usa tal cual.
  // - Si NO lo defines y estás en development, hacemos fallback a VITE_API_COLUMNS_PROXY_TARGET
  //   para evitar “defaults” a https (y así no ir endpoint a endpoint).
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET || (isDev ? columnsProxyTarget || adminFieldsProxyTarget : '') || 'https://geonity.ibercivis.es'
  const apiProxyIsHttps = apiProxyTarget.startsWith('https://')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        ...(columnsProxyTarget
          ? {
              '^/api/(projects|project)/\\d+/observation[-_]fields(/\\d+)?/?$': {
                target: columnsProxyTarget,
                changeOrigin: true,
                secure: columnsProxyIsHttps,
              },
              '^/api/projects/\\d+/observation-admin-values/?$': {
                target: columnsProxyTarget,
                changeOrigin: true,
                secure: columnsProxyIsHttps,
              },
            }
          : {}),
        ...(adminFieldsProxyTarget
          ? {
              '^/api/observations/\\d+/admin-fields/?$': {
                target: adminFieldsProxyTarget,
                changeOrigin: true,
                secure: adminFieldsProxyIsHttps,
              },
            }
          : {}),
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: apiProxyIsHttps,
        },
      },
    },
  }
})
