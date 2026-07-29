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

function BulletList({ keys, prefix }: { keys: number[]; prefix: string }) {
  const { t } = useTranslation()
  return (
    <ul className="space-y-1.5 pl-4">
      {keys.map(n => (
        <li key={n} className="flex items-start gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
          {t(`${prefix}${n}`)}
        </li>
      ))}
    </ul>
  )
}

export function TermsOfUsePage() {
  const { t } = useTranslation()

  return (
    <div className="h-full overflow-y-auto bg-background">
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-10">
          <p className="text-sm text-muted-foreground mb-2">{t('tou.updated')}</p>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('tou.title')}</h1>
          <p className="text-muted-foreground">Geonity · Ibercivis Foundation</p>
        </div>

        <p className="text-foreground/80 leading-relaxed mb-10">{t('tou.intro')}</p>

        <Separator className="mb-10" />

        <Section title={t('tou.s1title')}>
          <p>{t('tou.s1body')}</p>
        </Section>

        <Separator className="mb-10" />

        <Section title={t('tou.s2title')}>
          <p>{t('tou.s2body')}</p>
          <BulletList keys={[1, 2, 3, 4, 5]} prefix="tou.s2item" />
        </Section>

        <Separator className="mb-10" />

        <Section title={t('tou.s3title')}>
          <p>{t('tou.s3body')}</p>
        </Section>

        <Separator className="mb-10" />

        <Section title={t('tou.s4title')}>
          <p>{t('tou.s4body')}</p>
          <BulletList keys={[1, 2, 3, 4]} prefix="tou.s4item" />
        </Section>

        <Separator className="mb-10" />

        <Section title={t('tou.s5title')}>
          <p>{t('tou.s5body')}</p>
        </Section>

        <Separator className="mb-10" />

        <section className="mb-10 bg-muted rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-2">{t('tou.contactTitle')}</h2>
          <p className="text-sm text-foreground/80 mb-2">{t('tou.contactBody')}</p>
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
