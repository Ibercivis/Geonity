import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHero } from '@/components/shared/PageHero'
import { ProjectSearchBox } from '@/components/shared/ProjectSearchBox'

export function HomeHero() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  return (
    <PageHero size="lg" title={t('homeHeroTitle')} subtitle={t('homeHeroSubtitle')}>
      <ProjectSearchBox
        value={query}
        onValueChange={setQuery}
        onSubmit={(q) => navigate(q ? `/explorar?search=${encodeURIComponent(q)}` : '/explorar')}
        placeholder={t('homeSearchPlaceholder')}
      />
    </PageHero>
  )
}
