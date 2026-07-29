import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { useGoogleLogin } from '@react-oauth/google'
import { CheckCircle2, Smartphone, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ConsentGate } from '@/components/ConsentGate'
import { authApi } from '@/api/auth'
import { TERMS_VERSION, PRIVACY_VERSION } from '@/config/consent'
import logoSrc from '@/assets/logo.webp'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/hooks/use-toast'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
type FormData = z.infer<typeof schema>

// Google "G" icon SVG
function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}


export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setToken, setUser, logout } = useAuthStore()
  const [showConsentGate, setShowConsentGate] = useState(false)
  const pendingNavigate = useRef<() => Promise<void>>(async () => {})

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const finalizeAuth = () => {
    pendingNavigate.current().catch(() =>
      toast({ title: t('error'), description: 'Could not record consent', variant: 'destructive' })
    )
  }

  const cancelConsent = () => {
    setShowConsentGate(false)
    logout()
  }

  const afterAuth = async (key: string) => {
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

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      try { await afterAuth(data.key) } catch {
        toast({ title: t('error'), description: 'Login failed, please try again', variant: 'destructive' })
      }
    },
    onError: () => {
      toast({ title: t('error'), description: 'Invalid email or password', variant: 'destructive' })
    },
  })

  const googleMutation = useMutation({
    mutationFn: (accessToken: string) => authApi.loginWithGoogle(accessToken),
    onSuccess: async (data) => {
      try { await afterAuth(data.key) } catch {
        toast({ title: t('error'), description: 'Google login failed, please try again', variant: 'destructive' })
      }
    },
    onError: () => {
      toast({ title: t('error'), description: 'Google login failed', variant: 'destructive' })
    },
  })

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => googleMutation.mutate(tokenResponse.access_token),
    onError: () => toast({ title: t('error'), description: 'Google login cancelled', variant: 'destructive' }),
  })

  const isLoading = loginMutation.isPending || googleMutation.isPending

  const features = [
    t('platformFeature1'),
    t('platformFeature2'),
    t('platformFeature3'),
    t('platformFeature4'),
  ]

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {showConsentGate && (
        <ConsentGate onAccept={finalizeAuth} onCancel={cancelConsent} />
      )}

      {/* Left: platform pitch */}
      <div className="flex-1 bg-brand-dark text-white flex flex-col justify-between p-6 md:p-16">
        <div>
          <div className="mb-6 md:mb-12">
            <img src={logoSrc} alt="Geonity" className="h-24 w-24 md:h-48 md:w-48 rounded-2xl md:rounded-3xl" />
          </div>

          <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-4">
            {t('platformTagline')}
          </h1>
          <p className="text-white/70 text-base leading-relaxed mb-8 max-w-md">
            {t('platformDescription')}
          </p>

          <ul className="space-y-3 mb-8">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-white/85">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>

          <Link to="/about">
            <Button
              size="lg"
              className="bg-white text-brand-dark hover:bg-white/90 font-semibold w-full sm:w-auto"
            >
              {t('learnMore')}
            </Button>
          </Link>
        </div>

        {/* Links */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <a
            href="https://play.google.com/store/apps/details?id=es.ibercivis.geonity"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/8 hover:bg-white/14 transition-colors flex-1"
          >
            <Smartphone className="h-5 w-5 shrink-0 text-white/50" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">{t('mobileApp')}</p>
              <p className="text-xs text-white/50 truncate">Google Play</p>
            </div>
          </a>
          <a
            href="https://geonity-backend.ibercivis.es/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/8 hover:bg-white/14 transition-colors flex-1"
          >
            <LayoutDashboard className="h-5 w-5 shrink-0 text-white/50" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">{t('adminPanel')}</p>
              <p className="text-xs text-white/50 truncate">{t('adminPanelDesc')}</p>
            </div>
          </a>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex items-center justify-center p-8 md:w-[420px] shrink-0 bg-background">
        <Card className="w-full max-w-sm border-0 shadow-none md:shadow md:border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('login')}</CardTitle>
            <CardDescription>Geonity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => googleLogin()}
              disabled={isLoading}
            >
              <GoogleIcon />
              {t('loginWithGoogle')}
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>

            <form onSubmit={handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">{t('email')}</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">{t('password')}</Label>
                <Input id="password" type="password" {...register('password')} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {loginMutation.isPending ? t('loading') : t('login')}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              {t('noAccount')}{' '}
              <Link to="/register" className="text-primary hover:underline">
                {t('register')}
              </Link>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2 text-xs text-muted-foreground/50">
              <Link to="/privacy-policy" className="hover:text-muted-foreground hover:underline">
                {t('pp.title')}
              </Link>
              <span>·</span>
              <Link to="/delete-account" className="hover:text-muted-foreground hover:underline">
                {t('dap.badge')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
