import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, Smartphone, LayoutDashboard, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConsentCheckboxes } from '@/components/ConsentCheckboxes'
import { type Control, type FieldValues } from 'react-hook-form'
import { authApi } from '@/api/auth'
import { TERMS_VERSION, PRIVACY_VERSION } from '@/config/consent'
import logoSrc from '@/assets/logo.webp'
import { toast } from '@/hooks/use-toast'

const schema = z
  .object({
    email: z.string().email(),
    password1: z.string().min(8, 'Password must be at least 8 characters'),
    password2: z.string(),
    consentPrivacy: z.literal(true, { message: 'required' }),
    consentTerms: z.literal(true, { message: 'required' }),
  })
  .refine((d) => d.password1 === d.password2, {
    message: 'Passwords do not match',
    path: ['password2'],
  })

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const { t } = useTranslation()
  const [registered, setRegistered] = useState(false)

  const { register, control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const registerMutation = useMutation({
    mutationFn: ({ email, password1, password2 }: Pick<FormData, 'email' | 'password1' | 'password2'>) =>
      authApi.register({ email, password1, password2, terms_version: TERMS_VERSION, privacy_version: PRIVACY_VERSION }),
    onSuccess: () => {
      setRegistered(true)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      const detail = msg ? Object.values(msg).flat().join(' ') : t('error')
      toast({ title: t('error'), description: detail, variant: 'destructive' })
    },
  })

  const features = [
    t('platformFeature1'),
    t('platformFeature2'),
    t('platformFeature3'),
    t('platformFeature4'),
  ]

  const leftPanel = (
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
  )

  if (registered) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        {leftPanel}
        <div className="flex items-center justify-center p-8 md:w-[420px] shrink-0 bg-background">
          <Card className="w-full max-w-sm border-0 shadow-none md:shadow md:border">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                <MailCheck className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Geonity</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">{t('checkEmailVerification')}</p>
              <Link to="/login" className="text-primary hover:underline text-sm">
                {t('login')}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {leftPanel}

      <div className="flex items-center justify-center p-8 md:w-[420px] shrink-0 bg-background">
        <Card className="w-full max-w-sm border-0 shadow-none md:shadow md:border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('register')}</CardTitle>
            <CardDescription>Geonity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={handleSubmit(({ email, password1, password2 }) =>
                registerMutation.mutate({ email, password1, password2 })
              )}
              className="space-y-4"
            >
              <div className="space-y-1">
                <Label htmlFor="email">{t('email')}</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="password1">{t('password')}</Label>
                <Input id="password1" type="password" {...register('password1')} />
                {errors.password1 && <p className="text-xs text-destructive">{errors.password1.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="password2">{t('confirmPassword')}</Label>
                <Input id="password2" type="password" {...register('password2')} />
                {errors.password2 && <p className="text-xs text-destructive">{errors.password2.message}</p>}
              </div>

              <ConsentCheckboxes
                control={control as unknown as Control<FieldValues>}
                errors={errors}
              />

              <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? t('loading') : t('register')}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              {t('hasAccount')}{' '}
              <Link to="/login" className="text-primary hover:underline">
                {t('login')}
              </Link>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2 text-xs text-muted-foreground/50">
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
