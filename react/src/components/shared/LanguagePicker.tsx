import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SUPPORTED_LANGS, toSupportedLang } from '@/lib/languages'

/**
 * Compact language switcher for public pages (no navbar). Same look as the
 * picker on PublicMapPage. `align` controls where the menu opens.
 */
export function LanguagePicker({ className, align = 'up' }: { className?: string; align?: 'up' | 'down' }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const current = toSupportedLang(i18n.resolvedLanguage ?? i18n.language)

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow text-xs text-gray-600 hover:bg-white/95 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="font-medium uppercase">{current}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div
          className={cn(
            'absolute right-0 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[80px] z-20',
            align === 'up' ? 'bottom-full mb-1' : 'top-full mt-1',
          )}
          role="listbox"
        >
          {SUPPORTED_LANGS.map((lng) => (
            <button
              key={lng}
              type="button"
              role="option"
              aria-selected={current === lng}
              className={cn(
                'w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors',
                current === lng ? 'font-semibold text-primary' : 'text-gray-700',
              )}
              onClick={() => { i18n.changeLanguage(lng); setOpen(false) }}
            >
              {lng.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
