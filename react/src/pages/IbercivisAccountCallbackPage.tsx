import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi } from '@/api/auth'
import { finishIbercivisAccountSignIn } from '@/lib/ibercivis-account'
import { useCompleteSignIn } from '@/hooks/use-complete-sign-in'
import logoSrc from '@/assets/logo.webp'

/** The API refuses an address another account here already uses, under `email`. */
function isAddressInUse(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 400 && Boolean(error.response.data?.email)
}

/** Where the Ibercivis sign-in service sends the person back to. */
export function IbercivisAccountCallbackPage() {
  const { t } = useTranslation()
  const { completeSignIn, consentGate } = useCompleteSignIn()
  const [failure, setFailure] = useState<string | null>(null)
  // The code and its verifier are good once, and StrictMode runs effects twice.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    ;(async () => {
      try {
        const code = await finishIbercivisAccountSignIn(new URL(window.location.href))
        const { key } = await authApi.loginWithIbercivis(code)
        await completeSignIn(key)
      } catch (error) {
        setFailure(isAddressInUse(error) ? t('ibercivisAccount.emailInUse') : t('ibercivisAccount.failed'))
      }
    })()
  }, [completeSignIn, t])

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      {consentGate}
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <img src={logoSrc} alt="Geonity" className="h-16 w-16 rounded-xl mx-auto mb-2" />
          <CardTitle className="text-xl">Geonity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center text-sm">
          {failure ? (
            <>
              <p role="alert" className="text-destructive">{failure}</p>
              <Link to="/login" replace className="text-primary hover:underline">
                {t('ibercivisAccount.backToLogin')}
              </Link>
            </>
          ) : (
            <p className="text-muted-foreground">{t('ibercivisAccount.signingIn')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
