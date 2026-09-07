import { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import {
  Type, Hash, Calendar, Image, ChevronDown, CheckSquare, QrCode, File as FileIcon, Camera, X,
} from 'lucide-react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { resolveLocalized } from '@/lib/utils'
import type { AnswerType } from '@/types'
import { normalizeChoices, type NormalizedChoice } from './normalize-choices'

// Shared field renderers for the observation form. Used by the authenticated
// AddObservationPage and by the anonymous ContributePage.

// ─── Manual coordinate inputs ────────────────────────────────────────────────
// Accepts comma as decimal separator. Updates the picked location live while
// typing (when both values are valid) and flies the map there on blur/Enter.

function parseCoord(s: string): number | null {
  const trimmed = s.trim()
  if (!trimmed) return null
  const n = Number(trimmed.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function CoordinateInputs({ location, onChange }: {
  location: [number, number] | null
  onChange: (lon: number, lat: number, fly: boolean) => void
}) {
  const { t } = useTranslation()
  const [latText, setLatText] = useState('')
  const [lonText, setLonText] = useState('')

  // Reflect picks made on the map, without clobbering the user's own typing
  useEffect(() => {
    if (!location) return
    const [lon, lat] = location
    if (parseCoord(latText) !== lat) setLatText(String(Number(lat.toFixed(6))))
    if (parseCoord(lonText) !== lon) setLonText(String(Number(lon.toFixed(6))))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location])

  const apply = (latS: string, lonS: string, fly: boolean) => {
    const lat = parseCoord(latS)
    const lon = parseCoord(lonS)
    if (lat !== null && lon !== null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      onChange(lon, lat, fly)
    }
  }

  const latVal = parseCoord(latText)
  const lonVal = parseCoord(lonText)
  const latInvalid = latText.trim() !== '' && (latVal === null || Math.abs(latVal) > 90)
  const lonInvalid = lonText.trim() !== '' && (lonVal === null || Math.abs(lonVal) > 180)

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{t('enterCoordinates')}</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="obs-lat" className="text-xs text-muted-foreground">{t('latitude')}</Label>
          <Input
            id="obs-lat"
            type="text"
            inputMode="decimal"
            placeholder="40.41678"
            value={latText}
            onChange={(e) => { setLatText(e.target.value); apply(e.target.value, lonText, false) }}
            onBlur={() => apply(latText, lonText, true)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(latText, lonText, true) } }}
            className={latInvalid ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
        </div>
        <div>
          <Label htmlFor="obs-lon" className="text-xs text-muted-foreground">{t('longitude')}</Label>
          <Input
            id="obs-lon"
            type="text"
            inputMode="decimal"
            placeholder="-3.70379"
            value={lonText}
            onChange={(e) => { setLonText(e.target.value); apply(latText, e.target.value, false) }}
            onBlur={() => apply(latText, lonText, true)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(latText, lonText, true) } }}
            className={lonInvalid ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Answer type badge ────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  STR:     { label: 'Texto',      icon: Type,        color: 'bg-blue-50 text-blue-600 border-blue-200' },
  NUM:     { label: 'Número',     icon: Hash,        color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  INT:     { label: 'Número',     icon: Hash,        color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  FLOAT:   { label: 'Decimal',    icon: Hash,        color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  DATE:    { label: 'Fecha',      icon: Calendar,    color: 'bg-orange-50 text-orange-600 border-orange-200' },
  IMG:     { label: 'Imagen',     icon: Image,       color: 'bg-purple-50 text-purple-600 border-purple-200' },
  IMAGE:   { label: 'Imagen',     icon: Image,       color: 'bg-purple-50 text-purple-600 border-purple-200' },
  FILE:    { label: 'Archivo',    icon: FileIcon,    color: 'bg-purple-50 text-purple-600 border-purple-200' },
  CHOICE:  { label: 'Selección',  icon: ChevronDown, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  MCHOICE: { label: 'Múltiple',   icon: CheckSquare, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  QR:      { label: 'QR / Código', icon: QrCode,   color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  BARCODE: { label: 'Código barras', icon: QrCode, color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  BOOL:    { label: 'Sí / No',    icon: CheckSquare, color: 'bg-gray-50 text-gray-600 border-gray-200' },
}

export function AnswerTypeBadge({ type }: { type: AnswerType }) {
  const meta = TYPE_META[type] ?? { label: type, icon: Type, color: 'bg-gray-50 text-gray-500 border-gray-200' }
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${meta.color}`}>
      <Icon className="h-2.5 w-2.5" />
      {meta.label}
    </span>
  )
}

// ─── SingleChoiceField ───────────────────────────────────────────────────────

interface SingleChoiceFieldProps {
  choices: NormalizedChoice[]
  allowOther: boolean
  lang: string
  value: string
  onChange: (v: string) => void
  required?: boolean
}

export function SingleChoiceField({ choices, allowOther, lang, value, onChange }: SingleChoiceFieldProps) {
  const knownValues = choices.map((c) => c.value)
  const isOtherValue = value !== '' && value !== null && value !== undefined && !knownValues.includes(value)
  const [showOther, setShowOther] = useState(isOtherValue)
  const [otherText, setOtherText] = useState(isOtherValue ? value : '')

  const selectValue = showOther ? '__other__' : (value ?? '')

  return (
    <div className="space-y-2">
      <Select
        value={selectValue}
        onValueChange={(v) => {
          if (v === '__other__') {
            setShowOther(true)
            onChange(otherText)
          } else {
            setShowOther(false)
            setOtherText('')
            onChange(v)
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Elige una opción" />
        </SelectTrigger>
        <SelectContent>
          {choices.map((c) => (
            <SelectItem key={c.id} value={c.value}>
              {resolveLocalized(c.label as never, lang)}
            </SelectItem>
          ))}
          {allowOther && <SelectItem value="__other__">Otro…</SelectItem>}
        </SelectContent>
      </Select>
      {allowOther && showOther && (
        <Input
          placeholder="Escribe tu respuesta"
          value={otherText}
          autoFocus
          onChange={(e) => { setOtherText(e.target.value); onChange(e.target.value) }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setShowOther(false); setOtherText(''); onChange('') }
          }}
        />
      )}
    </div>
  )
}

// ─── MultiChoiceField (needs own state, can't use hooks inside Controller render) ──

interface MultiChoiceFieldProps {
  choices: NormalizedChoice[]
  allowOther: boolean
  lang: string
  value: string[]
  onChange: (v: string[]) => void
}

export function MultiChoiceField({ choices, allowOther, lang, value: selected, onChange }: MultiChoiceFieldProps) {
  const knownValues = choices.map((c) => c.value)
  const otherValue = selected.find((v) => !knownValues.includes(v))
  const [showOtherInput, setShowOtherInput] = useState(!!otherValue)
  const [otherText, setOtherText] = useState(otherValue ?? '')

  const available = choices.filter((c) => !selected.includes(c.value))
  const remove = (val: string) => onChange(selected.filter((v) => v !== val))
  const add = (val: string) => { if (!selected.includes(val)) onChange([...selected, val]) }
  const commitOther = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const withoutOther = selected.filter((v) => knownValues.includes(v))
    onChange([...withoutOther, trimmed])
  }

  return (
    <div className="space-y-2">
      <Select value="" onValueChange={(v) => v === '__other__' ? setShowOtherInput(true) : add(v)}>
        <SelectTrigger>
          <SelectValue placeholder={available.length || (allowOther && !showOtherInput) ? 'Añadir opción…' : 'Todas seleccionadas'} />
        </SelectTrigger>
        <SelectContent>
          {available.map((c) => (
            <SelectItem key={c.id} value={c.value}>
              {resolveLocalized(c.label as never, lang)}
            </SelectItem>
          ))}
          {allowOther && !showOtherInput && (
            <SelectItem value="__other__">Otro…</SelectItem>
          )}
        </SelectContent>
      </Select>

      {allowOther && showOtherInput && (
        <div className="flex gap-2">
          <Input
            placeholder="Escribe tu respuesta"
            value={otherText}
            autoFocus
            onChange={(e) => setOtherText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commitOther(otherText); setShowOtherInput(false) }
              if (e.key === 'Escape') { setShowOtherInput(false); setOtherText('') }
            }}
          />
          <Button type="button" size="sm" onClick={() => { commitOther(otherText); setShowOtherInput(false) }}>
            +
          </Button>
        </div>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((val) => {
            const choice = choices.find((c) => c.value === val)
            const isOtherChip = !knownValues.includes(val)
            return (
              <span
                key={val}
                className={`inline-flex items-center gap-1 text-xs border rounded-full px-2.5 py-0.5 ${
                  isOtherChip
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-primary/10 text-primary border-primary/20'
                }`}
              >
                {choice ? resolveLocalized(choice.label as never, lang) : val}
                <button type="button" onClick={() => remove(val)} className="hover:text-destructive leading-none" aria-label="Eliminar">
                  ×
                </button>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Image field: camera or gallery, with preview ────────────────────────────
// Two hidden inputs: one with capture="environment" (opens the rear camera
// directly on phones) and one without (gallery / files). Both feed the same
// react-hook-form value, which is a File.

export function ImageField({ value, onChange }: {
  value: File | null
  onChange: (file: File | null) => void
}) {
  const { t } = useTranslation()
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const preview = useMemo(() => (value ? URL.createObjectURL(value) : null), [value])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (file) onChange(file)
    // allow re-selecting the same file
    e.target.value = ''
  }

  const clear = () => {
    onChange(null)
    if (cameraRef.current) cameraRef.current.value = ''
    if (galleryRef.current) galleryRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={pick} />
      {preview ? (
        <div className="relative">
          <img src={preview} alt="" className="rounded-md max-h-56 w-full object-cover border" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 bg-black/50 text-white hover:bg-black/70 hover:text-white"
            onClick={clear}
            aria-label={t('removePhoto')}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" className="h-11" onClick={() => cameraRef.current?.click()}>
          <Camera className="h-4 w-4 mr-2" />{preview ? t('retakePhoto') : t('takePhoto')}
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={() => galleryRef.current?.click()}>
          <Image className="h-4 w-4 mr-2" />{t('chooseFromGallery')}
        </Button>
      </div>
    </div>
  )
}

// ─── Barcode / QR scanner field ──────────────────────────────────────────────

export function BarcodeScanner({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!scanning) return
    const reader = new BrowserMultiFormatReader()
    let stopped = false
    let controls: { stop: () => void } | null = null

    reader.decodeFromConstraints(
      { video: { facingMode: 'environment' } },
      videoRef.current!,
      (result, err) => {
        if (stopped) return
        if (result) {
          stopped = true
          onChange(result.getText())
          setScanning(false)
        }
        if (err && err.name !== 'NotFoundException') console.warn(err)
      }
    ).then((c) => { controls = c }).catch(() => { if (!stopped) setScanning(false) })

    return () => { stopped = true; controls?.stop() }
  }, [scanning, onChange])

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            className="pr-8"
            placeholder="Escanea o escribe el código"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <QrCode className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        <Button type="button" variant="outline" size="icon" onClick={() => setScanning(true)} title="Abrir cámara">
          <Camera className="h-4 w-4" />
        </Button>
      </div>

      {scanning && (
        <div className="relative rounded-lg overflow-hidden border bg-black aspect-video">
          <video ref={videoRef} className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-white/70 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
            onClick={() => setScanning(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/80">
            Apunta la cámara al código
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Field renderer ───────────────────────────────────────────────────────────

interface ObservationFieldProps {
  questionId: string
  answerType: AnswerType
  choices: unknown[]
  allowOther: boolean
  required: boolean
  lang: string
  control: ReturnType<typeof useForm>['control']
  register: ReturnType<typeof useForm>['register']
}

export function ObservationField({ questionId, answerType, choices, allowOther, required, lang, control, register }: ObservationFieldProps) {
  const normalizedChoices = normalizeChoices(choices ?? [])
  switch (answerType) {
    case 'STR':
      return <Textarea {...register(questionId, { required })} rows={2} />
    case 'NUM':
    case 'INT':
    case 'FLOAT':
      return <Input type="number" step="any" {...register(questionId, { required })} />
    case 'DATE':
      return <Input type="date" {...register(questionId, { required })} />
    case 'BOOL':
      return (
        <Controller
          name={questionId}
          control={control}
          render={({ field }) => (
            <Switch checked={!!field.value} onCheckedChange={field.onChange} />
          )}
        />
      )
    case 'CHOICE':
      return (
        <Controller
          name={questionId}
          control={control}
          rules={{ required }}
          render={({ field }) => (
            <SingleChoiceField
              choices={normalizedChoices}
              allowOther={allowOther}
              lang={lang}
              value={String(field.value ?? '')}
              onChange={field.onChange}
            />
          )}
        />
      )
    case 'MCHOICE':
      return (
        <Controller
          name={questionId}
          control={control}
          defaultValue={[]}
          rules={{ required }}
          render={({ field }) => (
            <MultiChoiceField
              choices={normalizedChoices}
              allowOther={allowOther}
              lang={lang}
              value={Array.isArray(field.value) ? field.value : []}
              onChange={field.onChange}
            />
          )}
        />
      )
    case 'IMG':
    case 'IMAGE':
      return (
        <Controller
          name={questionId}
          control={control}
          defaultValue={null}
          rules={{ required }}
          render={({ field }) => (
            <ImageField value={field.value instanceof File ? (field.value as File) : null} onChange={field.onChange} />
          )}
        />
      )
    case 'FILE':
      return <Input type="file" {...register(questionId)} />
    case 'QR':
    case 'BARCODE':
      return (
        <Controller
          name={questionId}
          control={control}
          defaultValue=""
          rules={{ required }}
          render={({ field }) => (
            <BarcodeScanner value={String(field.value ?? '')} onChange={field.onChange} />
          )}
        />
      )
    default:
      return <Input {...register(questionId, { required })} />
  }
}
