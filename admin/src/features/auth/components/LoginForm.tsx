import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import logoSrc from '@/assets/Geonity Admin Logo.png'
import bgSrc from '@/assets/Geonity Admin BG.png'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { VersionLabel } from '@/components/VersionLabel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { beginGoogleLoginRedirect, getGoogleClientId } from '@/features/auth/google'

type LoginFormValues = {
  email: string
  password: string
}

type LoginFormProps = {
  isSubmitting: boolean
  error: string | null
  success: string | null
  defaultValues?: Partial<LoginFormValues>
  onSubmit: (values: LoginFormValues) => Promise<void> | void
}

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

export function LoginForm({
  isSubmitting,
  error,
  success,
  defaultValues,
  onSubmit,
}: LoginFormProps) {
  const { t } = useTranslation()
  const hasGoogleClientId = Boolean(getGoogleClientId())

  const loginSchema = z.object({
    email: z.string().trim().email(t('login.emailError')),
    password: z.string().min(1, t('login.passwordError')),
  })

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: defaultValues?.email ?? '',
      password: defaultValues?.password ?? '',
    },
  })

  const features = t('login.features', { returnObjects: true }) as string[]

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Left: platform pitch */}
      <div className="flex-1 text-white flex flex-col justify-between p-10 md:p-16 bg-cover bg-center relative" style={{ backgroundImage: `url(${bgSrc})` }}>
        <div className="absolute inset-0 bg-brand-dark/60 pointer-events-none" />
        <div className="relative z-10">
          <div className="mb-12">
            <img src={logoSrc} alt="Geonity" className="h-48 w-auto rounded-3xl" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
            {t('login.title')}
          </h1>
          <p className="text-white/85 text-base leading-relaxed mb-8 max-w-md">
            {t('login.subtitle')}
          </p>

          <ul className="space-y-3 mb-8">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-white/85">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 relative z-10 space-y-1">
          <p className="text-xs text-white/50">
            {t('login.footer')}
          </p>
          <VersionLabel className="block text-[11px] tabular-nums text-white/40" />
          <p className="text-xs text-white/50">
            {t('login.footerParticipant')}{' '}
            <a
              href="https://geonity.ibercivis.es"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white/80 transition-colors"
            >
              geonity.ibercivis.es
            </a>
          </p>
        </div>
      </div>

      {/* Right: login form */}
      <div className="flex items-center justify-center p-8 md:w-[420px] shrink-0 bg-background">
        <Card className="w-full max-w-sm border-0 shadow-none md:shadow md:border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('login.cardTitle')}</CardTitle>
            <CardDescription>{t('login.cardDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasGoogleClientId ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={() => beginGoogleLoginRedirect()}
                >
                  <GoogleIcon />
                  {t('login.continueWithGoogle')}
                </Button>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">{t('login.or')}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </>
            ) : null}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(async (values) => onSubmit(values))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.emailLabel')}</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.passwordLabel')}</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t('login.submitting') : t('login.submit')}
                </Button>

                {error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
                {success ? (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                ) : null}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
