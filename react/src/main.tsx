import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// After a deploy, a tab that still holds the previous index.html asks for lazy chunks
// whose hashed names no longer exist (rsync --delete removes them). Reload once so the
// browser picks up the new manifest instead of showing "Failed to fetch dynamically imported module".
window.addEventListener('vite:preloadError', (event) => {
  const key = 'geonity:reloaded-after-preload-error'
  if (sessionStorage.getItem(key)) return // already tried once; let the error surface
  sessionStorage.setItem(key, '1')
  event.preventDefault()
  window.location.reload()
})
window.addEventListener('load', () => sessionStorage.removeItem('geonity:reloaded-after-preload-error'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
