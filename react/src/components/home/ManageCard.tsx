import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ManageSummary } from '@/api/home'

export function ManageCard({ summary }: { summary?: ManageSummary }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold">{t('homeManageTitle')}</h2>
          {summary && (
            <p className="text-sm text-muted-foreground">
              {t('homeActiveCount', { count: summary.active })} · {t('homeDraftCount', { count: summary.drafts })}
            </p>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{t('homeManageText')}</p>
      <Button asChild variant="outline" className="w-full text-primary border-primary/40">
        <Link to="/gestionar">
          {t('homeGoManage')} <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </Button>
    </div>
  )
}
