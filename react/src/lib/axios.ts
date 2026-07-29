import axios from 'axios'
import i18n from '@/lib/i18n'
import { config } from '@/config/env'
import { getApiError } from '@/lib/api-error'
import { toast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/auth'

export const api = axios.create({
  baseURL: config.apiUrl,
})

api.interceptors.request.use((req) => {
  const token = localStorage.getItem('auth_token')
  if (token) req.headers.Authorization = `Token ${token}`
  // Send the app's active language so the backend resolves translations correctly.
  // resolvedLanguage gives the base code ('es') even when i18n.language is 'es-ES'.
  req.headers['Accept-Language'] = i18n.resolvedLanguage ?? i18n.language ?? 'en'
  return req
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // Show the actual server error message for everything else
    toast({
      title: `Error ${status ?? ''}`,
      description: getApiError(error),
      variant: 'destructive',
    })

    return Promise.reject(error)
  }
)
