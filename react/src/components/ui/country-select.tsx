import { useMemo, useRef, useState } from 'react'
import countries, { type LocaleData } from 'i18n-iso-countries'
import enLocale from 'i18n-iso-countries/langs/en.json'
import esLocale from 'i18n-iso-countries/langs/es.json'
import ptLocale from 'i18n-iso-countries/langs/pt.json'
import itLocale from 'i18n-iso-countries/langs/it.json'
import frLocale from 'i18n-iso-countries/langs/fr.json'
import deLocale from 'i18n-iso-countries/langs/de.json'
import nlLocale from 'i18n-iso-countries/langs/nl.json'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { SUPPORTED_LANGS, toSupportedLang, type SupportedLang } from '@/lib/languages'

/** Country-name locales, one per supported UI language (see `src/lib/languages.ts`). */
const COUNTRY_LOCALES: Record<SupportedLang, LocaleData> = {
  en: enLocale,
  es: esLocale,
  pt: ptLocale,
  it: itLocale,
  fr: frLocale,
  de: deLocale,
  nl: nlLocale,
}

for (const lang of SUPPORTED_LANGS) countries.registerLocale(COUNTRY_LOCALES[lang])

interface Props {
  value: string
  onChange: (code: string) => void
  placeholder?: string
  exclude?: string[]
  lang?: string
}

export function CountrySelect({ value, onChange, placeholder, exclude = [], lang = 'en' }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const supportedLang = toSupportedLang(lang)

  const options = useMemo(() => {
    const names = countries.getNames(supportedLang, { select: 'official' })
    return Object.entries(names)
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [supportedLang])

  const filtered = useMemo(() => {
    const base = exclude.length ? options.filter((o) => !exclude.includes(o.code)) : options
    const q = search.toLowerCase()
    return q
      ? base.filter((o) => o.name.toLowerCase().includes(q) || o.code.toLowerCase().includes(q))
      : base
  }, [options, search, exclude])

  const selectedName = value
    ? (countries.getName(value, supportedLang) ?? value)
    : ''

  const handleOpen = () => {
    setOpen(true)
    setSearch('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSelect = (code: string) => {
    onChange(code)
    setOpen(false)
    setSearch('')
  }

  const handleBlur = (e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setOpen(false)
      setSearch('')
    }
  }

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring',
          !selectedName && 'text-muted-foreground'
        )}
      >
        <span className="truncate">{selectedName || (placeholder ?? 'Select country…')}</span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <div className="p-1 border-b">
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">No results</p>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.code}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(o.code)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground',
                    o.code === value && 'bg-accent text-accent-foreground font-medium'
                  )}
                >
                  <span className="text-muted-foreground text-xs w-7 shrink-0">{o.code}</span>
                  {o.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
