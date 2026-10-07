import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface ProjectSliderProps {
  children: ReactNode
  /** Tailwind width classes of each slide, so the number visible per breakpoint is set by the caller. */
  slideClassName: string
}

/** Horizontal scroll-snap slider. Arrows appear only when there is something to scroll to. */
export function ProjectSlider({ children, slideClassName }: ProjectSliderProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [update, children])

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  const arrow = 'absolute top-1/2 -translate-y-1/2 z-10 hidden md:flex h-9 w-9 items-center justify-center rounded-full border bg-background shadow-md hover:bg-accent transition-colors'

  return (
    <div className="relative">
      {canPrev && (
        <button type="button" aria-label={t('previous')} onClick={() => scrollBy(-1)} className={cn(arrow, '-left-4')}>
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      <div
        ref={ref}
        onScroll={update}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Array.isArray(children)
          ? children.map((child, i) => (
              <div key={i} className={cn('snap-start shrink-0', slideClassName)}>{child}</div>
            ))
          : children}
      </div>
      {canNext && (
        <button type="button" aria-label={t('next')} onClick={() => scrollBy(1)} className={cn(arrow, '-right-4')}>
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
