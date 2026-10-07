import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

/** 1 … 4 5 [6] 7 8 … 20 — always first, last and the neighbours of the current page. */
function pagesToShow(page: number, count: number): (number | 'gap')[] {
  const wanted = new Set([1, count, page - 1, page, page + 1].filter((n) => n >= 1 && n <= count))
  const sorted = [...wanted].sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push('gap')
    out.push(n)
  })
  return out
}

export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  const { t } = useTranslation()
  if (pageCount <= 1) return null

  return (
    <nav aria-label={t('pagination')} className="flex items-center justify-center gap-1 pt-4 pb-6">
      <Button variant="outline" size="icon" className="h-9 w-9" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label={t('previous')}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {pagesToShow(page, pageCount).map((n, i) =>
        n === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-muted-foreground" aria-hidden>…</span>
        ) : (
          <Button
            key={n}
            variant={n === page ? 'default' : 'outline'}
            size="icon"
            className="h-9 w-9"
            aria-current={n === page ? 'page' : undefined}
            onClick={() => onChange(n)}
          >
            {n}
          </Button>
        ),
      )}
      <Button variant="outline" size="icon" className="h-9 w-9" disabled={page >= pageCount} onClick={() => onChange(page + 1)} aria-label={t('next')}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}
