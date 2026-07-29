import { useForm, type FieldValues, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConsentCheckboxes } from '@/components/ConsentCheckboxes'

const schema = z.object({
  consentPrivacy: z.literal(true, { message: 'required' }),
  consentTerms: z.literal(true, { message: 'required' }),
})
type FormData = z.infer<typeof schema>

interface Props {
  onAccept: () => void
  onCancel: () => void
}

export function ConsentGate({ onAccept, onCancel }: Props) {
  const { t } = useTranslation()

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-background border rounded-xl shadow-xl p-8 space-y-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{t('consent.gateTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t('consent.gateDesc')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onAccept)} className="space-y-6">
          <ConsentCheckboxes
            control={control as unknown as Control<FieldValues>}
            errors={errors}
          />

          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" className="w-full">
              {t('consent.gateCta')}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
              {t('consent.gateCancel')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
