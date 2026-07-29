import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { loginWithGoogleCode } from '@/lib/api/auth'
import { consumeExpectedGoogleState, getGoogleRedirectUri } from '@/features/auth/google'

export function GoogleAuthCallbackPage() {
  const { t } = useTranslation()
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function completeGoogleLogin() {
      const params = new URLSearchParams(window.location.search)
      const providerError = params.get('error')
      const code = params.get('code')
      const state = params.get('state') ?? ''
      const expectedState = consumeExpectedGoogleState()

      if (providerError) {
        if (!cancelled) setError(`Google OAuth: ${providerError}`)
        return
      }

      if (!code) {
        if (!cancelled) setError(t('google.errorNoCode'))
        return
      }

      if (expectedState && state !== expectedState) {
        if (!cancelled) setError(t('google.errorStateMismatch'))
        return
      }

      try {
        const { authKey, userEmail, userLabel } = await loginWithGoogleCode({
          code,
          redirectUri: getGoogleRedirectUri(),
        })

        if (!authKey) throw new Error(t('google.errorNoToken'))

        window.localStorage.setItem('geonity.authKey', authKey)
        if (userEmail) window.localStorage.setItem('geonity.userEmail', userEmail)
        else window.localStorage.removeItem('geonity.userEmail')
        if (userLabel) window.localStorage.setItem('geonity.userLabel', userLabel)
        else window.localStorage.removeItem('geonity.userLabel')

        if (!cancelled) window.location.replace('/')
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t('google.errorUnexpected'))
      }
    }

    void completeGoogleLogin()

    return () => {
      cancelled = true
    }
  }, [t])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>{t('google.title')}</CardTitle>
          <CardDescription>{t('google.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <p className="text-sm text-muted-foreground text-center">{t('google.processing')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
