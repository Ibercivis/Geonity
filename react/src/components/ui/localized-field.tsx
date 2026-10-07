import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { LOCALIZED_LANGS, type LocalizedLang } from '@/lib/languages'

interface LocalizedFieldProps {
  label: string
  value: Record<string, string>
  onChange: (lang: string, val: string) => void
  multiline?: boolean
  rows?: number
  placeholder?: string
  activeLang?: LocalizedLang
  onLangChange?: (lang: LocalizedLang) => void
  hideLangTabs?: boolean
}

export function LocalizedField({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  placeholder,
  activeLang,
  onLangChange,
  hideLangTabs = false,
}: LocalizedFieldProps) {
  const [localLang, setLocalLang] = useState<LocalizedLang>('default')
  const lang = activeLang ?? localLang
  const setLang = (l: LocalizedLang) => { setLocalLang(l); onLangChange?.(l) }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        {label && <Label className="text-sm shrink-0">{label}</Label>}
        {!hideLangTabs && (
          <Tabs value={lang} onValueChange={(v) => setLang(v as LocalizedLang)}>
            <TabsList className="h-6 p-0.5 gap-0 flex-wrap">
              {LOCALIZED_LANGS.map((l) => (
                <TabsTrigger key={l} value={l} className="h-5 px-1.5 text-xs rounded-sm">
                  {l === 'default' ? '⭐' : l.toUpperCase()}
                  {value[l] && (
                    <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-primary inline-block align-middle" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>
      {multiline ? (
        <RichTextEditor
          value={value[lang] ?? ''}
          onChange={(v) => onChange(lang, v)}
          rows={rows}
          placeholder={placeholder ?? `(${lang})`}
        />
      ) : (
        <Input
          value={value[lang] ?? ''}
          onChange={(e) => onChange(lang, e.target.value)}
          placeholder={placeholder ?? `(${lang})`}
        />
      )}
    </div>
  )
}
