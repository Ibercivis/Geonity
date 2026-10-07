import { useId, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface Suggestion {
  key: string | number
  title: string
  subtitle?: string
  trailing?: ReactNode
}

interface SearchComboboxProps {
  value: string
  onValueChange: (value: string) => void
  /** Enter or the Search button. */
  onSubmit: (query: string) => void
  suggestions: Suggestion[]
  /** A suggestion was chosen (click or Enter on the highlighted one). */
  onPick: (index: number) => void
  placeholder: string
}

/** Search box with an autocomplete list. Presentational: the caller supplies the suggestions. */
export function SearchCombobox({ value, onValueChange, onSubmit, suggestions, onPick, placeholder }: SearchComboboxProps) {
  const { t } = useTranslation()
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const showList = open && suggestions.length > 0

  const pick = (index: number) => {
    setOpen(false)
    onPick(index)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && suggestions.length) {
      e.preventDefault()
      setOpen(true)
      setActive((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp' && suggestions.length) {
      e.preventDefault()
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (showList && active >= 0) pick(active)
      else {
        setOpen(false)
        onSubmit(value.trim())
      }
    }
  }

  return (
    <div className="relative max-w-3xl">
      <div className="flex items-center gap-2 rounded-xl border bg-background p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-ring">
        <Search className="h-5 w-5 ml-2 shrink-0 text-muted-foreground" aria-hidden />
        <input
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          value={value}
          onChange={(e) => {
            onValueChange(e.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
          autoComplete="off"
          className="flex-1 min-w-0 bg-transparent px-1 py-2 text-base outline-none placeholder:text-muted-foreground"
        />
        <Button type="button" onClick={() => { setOpen(false); onSubmit(value.trim()) }}>
          {t('search')}
        </Button>
      </div>

      {showList && (
        <ul id={listId} role="listbox" className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border bg-background shadow-lg">
          {suggestions.map((s, i) => (
            <li
              key={s.key}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown (not click) so the input's blur doesn't close the list first
              onMouseDown={(e) => { e.preventDefault(); pick(i) }}
              onMouseEnter={() => setActive(i)}
              className={cn('flex items-center gap-3 px-4 py-2.5 cursor-pointer', i === active && 'bg-accent')}
            >
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{s.title}</span>
                {s.subtitle && <span className="block truncate text-xs text-muted-foreground">{s.subtitle}</span>}
              </span>
              {s.trailing}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
