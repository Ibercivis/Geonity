import { useTranslation } from 'react-i18next'
import { Separator } from '@/components/ui/separator'
import { SiteFooter } from '@/components/shared/SiteFooter'

const CONTACT_EMAIL = 'ethics@ibercivis.es'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 text-foreground">{title}</h2>
      <div className="space-y-3 text-foreground/80 leading-relaxed text-sm">{children}</div>
    </section>
  )
}

export function PrivacyPolicyPage() {
  const { t } = useTranslation()

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-10">
          <p className="text-sm text-muted-foreground mb-2">{t('pp.updated')}</p>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('pp.title')}</h1>
          <p className="text-muted-foreground">{t('pp.developer')}</p>
        </div>

        <p className="text-foreground/80 leading-relaxed mb-10">{t('pp.intro')}</p>

        <Separator className="mb-10" />

        <Section title={t('pp.s1title')}>
          <p>{t('pp.s1body')}</p>
          <ul className="space-y-1.5 pl-4">
            {([1,2,3,4,5] as const).map(n => (
              <li key={n} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                {t(`pp.s1item${n}`)}
              </li>
            ))}
          </ul>
        </Section>

        <Separator className="mb-10" />

        <Section title={t('pp.s2title')}>
          <p>{t('pp.s2body')}</p>
          <ul className="space-y-1.5 pl-4">
            {([1,2,3,4] as const).map(n => (
              <li key={n} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                {t(`pp.s2item${n}`)}
              </li>
            ))}
          </ul>
        </Section>

        <Separator className="mb-10" />

        <Section title={t('pp.s3title')}>
          <p>{t('pp.s3body')}</p>
        </Section>

        <Separator className="mb-10" />

        <Section title={t('pp.s4title')}>
          <p>{t('pp.s4body')}</p>
        </Section>

        <Separator className="mb-10" />

        <Section title={t('pp.s5title')}>
          <p>{t('pp.s5body')}</p>
          <ul className="space-y-1.5 pl-4">
            {([1,2,3,4,5] as const).map(n => (
              <li key={n} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                {t(`pp.s5item${n}`)}
              </li>
            ))}
          </ul>
        </Section>

        <Separator className="mb-10" />

        <Section title={t('pp.s6title')}>
          <p>{t('pp.s6body')}</p>
        </Section>

        <Separator className="mb-10" />

        <Section title={t('pp.s7title')}>
          <p>{t('pp.s7body')}</p>
        </Section>

        <Separator className="mb-10" />

        <Section title={t('pp.s8title')}>
          <p>{t('pp.s8body')}</p>
        </Section>

        <Separator className="mb-10" />

        {/* Contact */}
        <section className="mb-10 bg-muted rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-2">{t('pp.contactTitle')}</h2>
          <p className="text-sm text-foreground/80 mb-2">{t('pp.contactBody')}</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary text-sm font-medium hover:underline">
            {CONTACT_EMAIL}
          </a>
          <p className="text-xs text-muted-foreground mt-1">Ibercivis Foundation · Zaragoza, Spain</p>
        </section>

      </main>
      <SiteFooter />
    </div>
  )
}
