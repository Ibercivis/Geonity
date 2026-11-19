import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ConsentGate } from '@/components/ConsentGate'
import { authApi } from '@/api/auth'
import { TERMS_VERSION, PRIVACY_VERSION } from '@/config/consent'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/hooks/use-toast'

/**
 * What happens once the API has answered a sign-in with a token, whichever way in
 * it was: store the token, load the user, and ask a new user for consent before
 * going home. Render `consentGate` wherever the page wants the dialog.
 */
export function useCompleteSignIn() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setToken, setUser, logout } = useAuthStore()
  const [showConsentGate, setShowConsentGate] = useState(false)
  const pendingNavigate = useRef<() => Promise<void>>(async () => {})

  const finalizeAuth = () => {
    pendingNavigate.current().catch(() =>
      toast({ title: t('error'), description: 'Could not record consent', variant: 'destructive' })
    )
  }

  const cancelConsent = () => {
    setShowConsentGate(false)
    logout()
    navigate('/login', { replace: true })
  }

  const completeSignIn = async (key: string) => {
    setToken(key)
    const user = await authApi.getUser()
    setUser(user)

    if (!user.terms_accepted_at) {
      // New user — show consent gate before navigating
      pendingNavigate.current = async () => {
        await authApi.recordConsent(TERMS_VERSION, PRIVACY_VERSION)
        setShowConsentGate(false)
        navigate('/')
      }
      setShowConsentGate(true)
    } else {
      navigate('/')
    }
  }

  const consentGate = showConsentGate
    ? <ConsentGate onAccept={finalizeAuth} onCancel={cancelConsent} />
    : null

  return { completeSignIn, consentGate }
}
