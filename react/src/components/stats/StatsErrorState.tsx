import { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { Alert, AlertDescription } from '@/components/ui/alert'

/** Turns the three expected failures (401 is handled globally) into a readable message. */
export function StatsErrorState({ error }: { error: unknown }) {
  const { t } = useTranslation()
  const status = error instanceof AxiosError ? error.response?.status : undefined
  const message =
    status === 403 ? t('statsForbidden')
    : status === 404 ? t('statsNotFound')
    : status === 429 ? t('statsRateLimited')
    : t('error')
  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
