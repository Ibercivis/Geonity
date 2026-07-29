import { useTranslation } from 'react-i18next'
import { Trash2, Mail, ShieldCheck, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SiteFooter } from '@/components/shared/SiteFooter'

const CONTACT_EMAIL = 'ethics@ibercivis.es'

export function DeleteAccountPage() {
  const { t } = useTranslation()

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">

        {/* Title */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive text-sm font-medium px-3 py-1.5 rounded-full mb-4">
            <Trash2 className="h-3.5 w-3.5" />
            {t('dap.badge')}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('dap.title')}</h1>
          <p className="text-muted-foreground">{t('dap.developer')}</p>
        </div>

        <p className="text-foreground/80 leading-relaxed mb-10">{t('dap.intro')}</p>

        <Separator className="mb-10" />

        {/* Steps */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white text-xs font-bold">1</span>
            {t('dap.stepsTitle')}
          </h2>
          <ol className="space-y-4">
            {([1, 2, 3, 4] as const).map((n) => (
              <li key={n} className="flex gap-4">
                <span className="flex items-center justify-center h-7 w-7 shrink-0 rounded-full border-2 border-primary/30 text-primary text-sm font-semibold mt-0.5">
                  {n}
                </span>
                <p className="text-foreground/80 leading-relaxed pt-0.5">{t(`dap.step${n}`)}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Email alternative */}
        <div className="bg-muted rounded-xl p-6 mb-10">
          <h3 className="font-semibold mb-1 flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            {t('dap.altTitle')}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">{t('dap.altDesc')}</p>
          <Button asChild variant="outline" size="sm">
            <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(t('dap.emailSubject'))}`}>
              {CONTACT_EMAIL}
            </a>
          </Button>
        </div>

        <Separator className="mb-10" />

        {/* Data section */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white text-xs font-bold">2</span>
            {t('dap.dataTitle')}
          </h2>

          {/* Deleted data */}
          <div className="mb-6">
            <h3 className="font-semibold text-destructive flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4" />
              {t('dap.deletedTitle')}
            </h3>
            <ul className="space-y-2">
              {([1, 2, 3, 4] as const).map((n) => (
                <li key={n} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive/70" />
                  {t(`dap.deletedItem${n}`)}
                </li>
              ))}
            </ul>
          </div>

          {/* Retained data */}
          <div>
            <h3 className="font-semibold text-primary flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4" />
              {t('dap.retainedTitle')}
            </h3>
            <ul className="space-y-2">
              {([1, 2] as const).map((n) => (
                <li key={n} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  {t(`dap.retainedItem${n}`)}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Separator className="mb-10" />

        {/* Retention period */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">{t('dap.retentionTitle')}</h2>
          <p className="text-foreground/80 leading-relaxed">{t('dap.retentionDesc')}</p>
        </section>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground pt-6 border-t">
          <p>
            {t('dap.contact')}{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
              {CONTACT_EMAIL}
            </a>
          </p>
        </footer>
      </main>
      <SiteFooter />
    </div>
  )
}
