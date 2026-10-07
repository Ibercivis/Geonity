import { useTranslation } from 'react-i18next'
import { Layers } from 'lucide-react'

/** Placeholder: intentionally empty for now (title and description only). Tools will be added later. */
export function ManageToolsCard() {
  const { t } = useTranslation()
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold">{t('manageToolsTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('manageToolsText')}</p>
        </div>
      </div>
    </div>
  )
}
