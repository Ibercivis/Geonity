import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { formatDate, formatNumber } from './format'
import type { PerProjectStats } from '@/api/stats'

export function PerProjectTable({ rows }: { rows: PerProjectStats[] }) {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const sorted = [...rows].sort((a, b) => b.observations - a.observations)

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground border-b">
            <th className="text-left font-medium py-2 pr-3">{t('statsProjectName')}</th>
            <th className="text-left font-medium py-2 pr-3 hidden sm:table-cell">{t('statsPublishedAt')}</th>
            <th className="text-right font-medium py-2 pr-3">{t('observations')}</th>
            <th className="text-left font-medium py-2 pr-3 hidden md:table-cell">{t('statsLastObservation')}</th>
            <th className="text-left font-medium py-2">{t('statsActive30d')}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.id} className={`border-b last:border-0 ${p.active_30d ? '' : 'text-muted-foreground'}`}>
              <td className="py-2 pr-3">
                <Link to={`/projects/${p.id}/stats`} className="font-medium hover:underline">{p.name}</Link>
                <span className="ml-2 inline-flex gap-1">
                  {p.draft && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{t('draft')}</Badge>}
                  {p.ended && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t('ended')}</Badge>}
                </span>
              </td>
              <td className="py-2 pr-3 hidden sm:table-cell tabular-nums">{formatDate(p.published_at, lang)}</td>
              <td className="py-2 pr-3 text-right tabular-nums font-medium">{formatNumber(p.observations, lang)}</td>
              <td className="py-2 pr-3 hidden md:table-cell tabular-nums">{formatDate(p.last_observation, lang)}</td>
              <td className="py-2">
                {p.active_30d
                  ? <Badge className="text-[10px] px-1.5 py-0">{t('statsActive')}</Badge>
                  : <Badge variant="outline" className="text-[10px] px-1.5 py-0">{t('statsInactive')}</Badge>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
