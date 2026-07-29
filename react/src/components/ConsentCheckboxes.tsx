import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Controller, type Control, type FieldErrors, type FieldValues } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export interface ConsentFields {
  consentPrivacy: boolean
  consentTerms: boolean
}

interface Props {
  control: Control<FieldValues>
  errors: FieldErrors<ConsentFields>
}

function ConsentRow({
  id,
  control,
  error,
  children,
}: {
  id: 'consentPrivacy' | 'consentTerms'
  control: Control<FieldValues>
  error?: boolean
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2.5">
        <Controller
          name={id}
          control={control}
          render={({ field }) => (
            <Checkbox
              id={id}
              checked={!!field.value}
              onCheckedChange={field.onChange}
              className="mt-0.5 shrink-0"
            />
          )}
        />
        <Label htmlFor={id} className="text-sm font-normal leading-snug cursor-pointer">
          {children}
        </Label>
      </div>
      {error && (
        <p className="text-xs text-destructive pl-7">{t('consent.required')}</p>
      )}
    </div>
  )
}

export function ConsentCheckboxes({ control, errors }: Props) {
  const { t } = useTranslation()
  const privacyAfter = t('consent.privacyAfter')

  return (
    <div className="space-y-3 pt-1">
      <ConsentRow id="consentPrivacy" control={control} error={!!errors.consentPrivacy}>
        {t('consent.privacyBefore')}{' '}
        <Link to="/privacy-policy" target="_blank" className="text-primary hover:underline font-medium">
          {t('pp.title')}
        </Link>
        {privacyAfter ? ` ${privacyAfter}` : ''}
      </ConsentRow>

      <ConsentRow id="consentTerms" control={control} error={!!errors.consentTerms}>
        {t('consent.termsBefore')}{' '}
        <Link to="/terms-of-use" target="_blank" className="text-primary hover:underline font-medium">
          {t('tou.title')}
        </Link>
        {' '}{t('consent.termsAfter')}
      </ConsentRow>
    </div>
  )
}
