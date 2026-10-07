import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { suggestOrgs, orgName } from '@/api/orgExplore'
import { SearchCombobox } from '@/components/shared/SearchCombobox'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import type { Organization } from '@/types'
import type { OrgType } from '@/api/organizations'
import { orgCountryLabel, orgTypeNames } from './org-meta'
import { useTranslation } from 'react-i18next'

interface OrgSearchBoxProps {
  value: string
  onValueChange: (value: string) => void
  onSubmit: (query: string) => void
  placeholder: string
  orgs: Organization[]
  types: OrgType[]
}

/** Organization search with autocomplete. Picking a suggestion opens the organization. */
export function OrgSearchBox({ orgs, types, placeholder, value, onValueChange, onSubmit }: OrgSearchBoxProps) {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const navigate = useNavigate()
  const found = useMemo(() => suggestOrgs(orgs, value), [orgs, value])

  return (
    <SearchCombobox
      value={value}
      onValueChange={onValueChange}
      onSubmit={onSubmit}
      placeholder={placeholder}
      suggestions={found.map((o) => ({
        key: o.id,
        title: orgName(o),
        subtitle: [orgTypeNames(o, types).join(', '), orgCountryLabel(o, lang, t('orgGlobal'))].filter(Boolean).join(' · '),
      }))}
      onPick={(i) => navigate(`/organizations/${found[i].id}`)}
    />
  )
}
