import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { router } from './router'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/api/auth'
import '@/lib/i18n'

const GOOGLE_CLIENT_ID = '196939700044-j34i5tlj0j4sof9i10ir43rfgjcpfplm.apps.googleusercontent.com'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 2,
    },
  },
})

function AuthBootstrap() {
  const { token, user, setUser, setProfile, logout } = useAuthStore()

  // Initial bootstrap: load user data if token exists but user not yet in memory
  useEffect(() => {
    if (!token || user) return
    authApi.getUser()
      .then((u) => {
        setUser(u)
        return authApi.getProfile()
      })
      .then(setProfile)
      .catch(() => logout())
  }, [token])

  // Revalidate token and refresh all queries when the tab comes back into focus
  // or when the browser comes back online. This covers:
  //   - Token expired while the tab was in the background
  //   - Data gone stale during a network outage
  useEffect(() => {
    if (!token) return

    const revalidate = () => {
      authApi.getUser()
        .then((u) => {
          setUser(u)
          queryClient.invalidateQueries()
        })
        .catch(() => {
          // 401 is handled by the axios interceptor (logout + redirect to /login)
        })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') revalidate()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', revalidate)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', revalidate)
    }
  }, [token])

  return null
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthBootstrap />
          <RouterProvider router={router} />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  )
}
