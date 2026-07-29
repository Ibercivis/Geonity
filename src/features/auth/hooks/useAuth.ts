import * as React from 'react'

import { fetchCurrentUser, loginWithCredentials, loginWithGoogleCode, logoutWithAuthKey, postConsent } from '@/lib/api/auth'

export function useAuth() {
  const [email, setEmail] = React.useState(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem('geonity.userEmail') ?? ''
  })
  const [password, setPassword] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [userLabel, setUserLabel] = React.useState(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem('geonity.userLabel') ?? ''
  })
  const [authKey, setAuthKey] = React.useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem('geonity.authKey')
  })

  const [needsConsent, setNeedsConsent] = React.useState(false)
  const [isCheckingConsent, setIsCheckingConsent] = React.useState(() => {
    if (typeof window === 'undefined') return false
    return Boolean(window.localStorage.getItem('geonity.authKey'))
  })
  const [isAcceptingConsent, setIsAcceptingConsent] = React.useState(false)
  const [consentError, setConsentError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    if (authKey) window.localStorage.setItem('geonity.authKey', authKey)
    else window.localStorage.removeItem('geonity.authKey')
  }, [authKey])

  // On mount: check consent if authKey already present (covers Google OAuth redirect)
  React.useEffect(() => {
    const key = typeof window !== 'undefined' ? window.localStorage.getItem('geonity.authKey') : null
    if (!key) {
      setIsCheckingConsent(false)
      return
    }

    let cancelled = false
    fetchCurrentUser(key)
      .then((user) => {
        if (!cancelled) setNeedsConsent(user.terms_accepted_at === null)
      })
      .catch(() => {
        if (!cancelled) setNeedsConsent(false)
      })
      .finally(() => {
        if (!cancelled) setIsCheckingConsent(false)
      })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    if (email) window.localStorage.setItem('geonity.userEmail', email)
    else window.localStorage.removeItem('geonity.userEmail')
  }, [email])

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    if (userLabel) window.localStorage.setItem('geonity.userLabel', userLabel)
    else window.localStorage.removeItem('geonity.userLabel')
  }, [userLabel])

  const submitCredentials = React.useCallback(async ({
    email,
    password,
  }: {
    email: string
    password: string
  }) => {
    setEmail(email)
    setPassword(password)
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const { authKey: key, userLabel, userEmail } = await loginWithCredentials({ email, password })
      if (key) {
        setAuthKey(key)
        setIsCheckingConsent(true)
        try {
          const user = await fetchCurrentUser(key)
          setNeedsConsent(user.terms_accepted_at === null)
        } catch {
          setNeedsConsent(false)
        } finally {
          setIsCheckingConsent(false)
        }
      }
      setEmail(userEmail || email)
      setUserLabel(userLabel)
      setPassword('')
      setSuccess('Login correcto')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const submitGoogleCode = React.useCallback(async ({
    code,
    redirectUri,
  }: {
    code: string
    redirectUri: string
  }) => {
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const { authKey: key, userLabel, userEmail } = await loginWithGoogleCode({ code, redirectUri })
      if (key) {
        setAuthKey(key)
        setIsCheckingConsent(true)
        try {
          const user = await fetchCurrentUser(key)
          setNeedsConsent(user.terms_accepted_at === null)
        } catch {
          setNeedsConsent(false)
        } finally {
          setIsCheckingConsent(false)
        }
      }
      setEmail(userEmail)
      setUserLabel(userLabel)
      setPassword('')
      setSuccess('Login con Google correcto')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const acceptConsent = React.useCallback(async () => {
    if (!authKey) return
    setIsAcceptingConsent(true)
    setConsentError(null)
    try {
      await postConsent(authKey)
      setNeedsConsent(false)
    } catch (err) {
      setConsentError(err instanceof Error ? err.message : 'Error al registrar el consentimiento')
    } finally {
      setIsAcceptingConsent(false)
    }
  }, [authKey])

  const clearAuth = React.useCallback(async () => {
    const currentAuthKey = authKey

    try {
      if (currentAuthKey) {
        await logoutWithAuthKey(currentAuthKey)
      }
      return { ok: true as const, error: null }
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : 'Error inesperado cerrando sesión' }
    } finally {
      setAuthKey(null)
      setEmail('')
      setPassword('')
      setUserLabel('')
      setError(null)
      setSuccess(null)
      setNeedsConsent(false)
      setIsCheckingConsent(false)
      setConsentError(null)
    }
  }, [authKey])

  return {
    email,
    setEmail,
    password,
    setPassword,
    isSubmitting,
    error,
    success,
    userLabel,
    setUserLabel,
    authKey,
    setAuthKey,
    submitCredentials,
    submitGoogleCode,
    clearAuth,
    needsConsent,
    isCheckingConsent,
    isAcceptingConsent,
    consentError,
    acceptConsent,
  }
}
