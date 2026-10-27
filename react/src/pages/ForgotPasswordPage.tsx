import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi } from '@/api/auth'
import logoSrc from '@/assets/logo.webp'

const schema = z.object({
  email: z.string().email(),
})
type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  // The backend answers 200 whether or not the email exists (anti-enumeration),
  // so success only means the request went through. Errors are toasted by the axios interceptor.
  const resetMutation = useMutation({
    mutationFn: (data: FormData) => authApi.requestPasswordReset(data.email),
    onSuccess: () => setSent(true),
  })

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <Card className="w-full max-w-sm border-0 shadow-none md:shadow md:border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            {sent
              ? <MailCheck className="h-8 w-8 text-primary" />
              : <img src={logoSrc} alt="Geonity" className="h-16 w-16 rounded-xl" />}
          </div>
          <CardTitle className="text-2xl">{t('forgotPasswordTitle')}</CardTitle>
          {!sent && <CardDescription>{t('forgotPasswordDescription')}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
          {sent ? (
            <p className="text-sm text-muted-foreground text-center">{t('forgotPasswordSuccess')}</p>
          ) : (
            <form onSubmit={handleSubmit((data) => resetMutation.mutate(data))} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">{t('email')}</Label>
                <Input id="email" type="email" autoFocus {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={resetMutation.isPending}>
                {resetMutation.isPending ? t('loading') : t('forgotPasswordSubmit')}
              </Button>
            </form>
          )}

          <div className="text-center text-sm">
            <Link to="/login" className="text-primary hover:underline">
              {t('backToLogin')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
