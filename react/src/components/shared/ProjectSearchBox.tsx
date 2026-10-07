import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'
import { suggestProjects } from '@/api/explore'
import { useAllProjects } from '@/hooks/use-all-projects'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { SearchCombobox } from './SearchCombobox'

interface ProjectSearchBoxProps {
  value: string
  onValueChange: (value: string) => void
  /** Enter or the Search button. */
  onSubmit: (query: string) => void
  placeholder: string
}

/** Project search with autocomplete. Picking a suggestion opens the project; Enter runs the search. */
export function ProjectSearchBox({ value, onValueChange, onSubmit, placeholder }: ProjectSearchBoxProps) {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const navigate = useNavigate()
  const { data: projects = [] } = useAllProjects()
  const found = useMemo(() => suggestProjects(projects, value, lang), [projects, value, lang])

  return (
    <SearchCombobox
      value={value}
      onValueChange={onValueChange}
      onSubmit={onSubmit}
      placeholder={placeholder}
      suggestions={found.map((s) => ({
        key: s.id,
        title: s.name,
        subtitle: s.organization,
        trailing: s.ended ? <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-label={t('ended')} /> : null,
      }))}
      onPick={(i) => navigate(`/projects/${found[i].id}`)}
    />
  )
}
