import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useForm, Controller } from 'react-hook-form'
import {
  ArrowLeft, MapPin, Type, Hash, Calendar, Image, ChevronDown,
  CheckSquare, QrCode, File, Camera, X,
} from 'lucide-react'
import DOMPurify from 'dompurify'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProjectMap } from '@/components/map/ProjectMap'
import { projectsApi } from '@/api/projects'
import { resolveLocalized } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { useIsMobile } from '@/hooks/use-is-mobile'
import type { AnswerType } from '@/types'

export function AddObservationPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const lang = useTranslationLang()

  const qc = useQueryClient()
  const isMobile = useIsMobile()
  const [pickedLocation, setPickedLocation] = useState<[number, number] | null>(null)
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [modalDismissed, setModalDismissed] = useState(false)
  const [mobileTab, setMobileTab] = useState<'form' | 'map'>('form')

  useEffect(() => {
    if (modalDismissed) navigate(`/projects/${projectId}`, { replace: true })
  }, [modalDismissed])

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId),
  })

  const { data: fieldForm, isLoading } = useQuery({
    queryKey: ['field-form', project?.field_form],
    queryFn: () => projectsApi.getFieldForm(project!.field_form!, lang),
    enabled: !!project?.field_form,
  })

  const { control, handleSubmit, register } = useForm<Record<string, unknown>>()

  const submitMutation = useMutation({
    mutationFn: (formData: FormData) => projectsApi.createObservation(formData),
    onSuccess: () => {
      const ffId = project?.field_form
      if (project?.show_post_message) {
        setShowSuccessModal(true)
      } else {
        toast({ title: t('observationSubmitted') })
        navigate(`/projects/${projectId}`, { flushSync: true })
      }
      qc.invalidateQueries({ queryKey: ['map-points', ffId] })
      qc.invalidateQueries({ queryKey: ['my-observations', ffId] })
      qc.invalidateQueries({ queryKey: ['hex-observations', ffId] })
      qc.invalidateQueries({ queryKey: ['project', projectId] })
    },
    onError: (err) => {
      const detail =
        (err as { response?: { data?: { detail?: string; geoposition?: string[] } } })
          ?.response?.data
      const msg = detail?.detail ?? detail?.geoposition?.[0] ?? null
      toast({ title: t('error'), description: msg ?? undefined, variant: 'destructive' })
    },
  })

  const onSubmit = (data: Record<string, unknown>) => {
    if (!pickedLocation) {
      toast({ title: t('error'), description: t('selectLocation'), variant: 'destructive' })
      return
    }
    if (!fieldForm) return

    const fd = new FormData()
    fd.append('field_form', String(fieldForm.id))
    fd.append('geoposition', JSON.stringify({ type: 'Point', coordinates: [pickedLocation[0], pickedLocation[1]] }))
    fd.append('timestamp', new Date().toISOString())

    const obsData: { key: string; value: unknown }[] = []
    for (const question of fieldForm.questions) {
      const key = String(question.id)
      const value = data[key]
      if (value !== undefined && value !== null && value !== '') {
        // Handle image/file fields separately
        if ((question.answer_type === 'IMG' || question.answer_type === 'IMAGE' || question.answer_type === 'FILE') && value instanceof FileList) {
          if (value[0]) fd.append(`image_${key}`, value[0])
        } else if (question.answer_type === 'MCHOICE' && Array.isArray(value) && value.length === 0) {
          // skip empty multi-choice
        } else {
          obsData.push({ key, value })
        }
      }
    }
    fd.append('data', JSON.stringify(obsData))
    submitMutation.mutate(fd)
  }

  if (isLoading || !fieldForm) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">{t('loading')}</div>
  }

  const handleLocationPick = (lon: number, lat: number) => {
    setPickedLocation([lon, lat])
    if (isMobile) setMobileTab('form')
  }

  const handleManualCoords = (lon: number, lat: number, fly: boolean) => {
    setPickedLocation([lon, lat])
    if (fly) setFlyTo([lon, lat])
  }

  const formHeader = (
    <div className="flex items-center gap-2 px-4 py-3 border-b">
      <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <h2 className="font-semibold">{t('addObservation')}</h2>
    </div>
  )

  const formBody = (
    <div className="flex-1 overflow-y-auto p-4">
      <form id="obs-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <button
          type="button"
          onClick={() => isMobile && setMobileTab('map')}
          className="w-full text-left"
        >
          <Alert variant={pickedLocation ? 'success' : 'default'} className="border-dashed">
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              {pickedLocation
                ? `${pickedLocation[1].toFixed(5)}, ${pickedLocation[0].toFixed(5)}`
                : t('selectLocation')}
            </AlertDescription>
          </Alert>
        </button>

        <CoordinateInputs location={pickedLocation} onChange={handleManualCoords} />

        {fieldForm.questions
          .sort((a, b) => a.order - b.order)
          .map((question) => {
            const label = resolveLocalized(question.question_text, lang)
            const helpText = question.question_help ? resolveLocalized(question.question_help, lang) : undefined
            return (
              <div key={question.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label>
                    {label}
                    {question.mandatory && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <AnswerTypeBadge type={question.answer_type} />
                </div>
                {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
                <ObservationField
                  questionId={String(question.id)}
                  answerType={question.answer_type}
                  choices={question.choices}
                  allowOther={question.allow_other}
                  required={question.mandatory}
                  lang={lang}
                  control={control}
                  register={register}
                />
              </div>
            )
          })}
      </form>
    </div>
  )

  const formFooter = (
    <div className="p-4 border-t">
      <Button type="submit" form="obs-form" className="w-full" disabled={submitMutation.isPending}>
        {submitMutation.isPending ? t('loading') : t('submitObservation')}
      </Button>
    </div>
  )

  const mapPanel = (
    <ProjectMap
      pickingMode
      pickedLocation={pickedLocation}
      onLocationPick={handleLocationPick}
      flyTo={flyTo}
    />
  )

  const successDialog = (
    <Dialog open={showSuccessModal} onOpenChange={(open) => { if (!open) { setShowSuccessModal(false); setModalDismissed(true) } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('observationSubmitted')}</DialogTitle>
        </DialogHeader>
        <div
          className="text-sm text-muted-foreground prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(resolveLocalized(project?.post_observation_message ?? '', lang))
          }}
        />
        <DialogFooter>
          <Button onClick={() => { setShowSuccessModal(false); setModalDismissed(true) }}>{t('close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  if (isMobile) {
    return (
      <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as 'form' | 'map')} className="flex flex-col h-full">
        {formHeader}
        <TabsList className="grid w-full grid-cols-2 rounded-none border-b shrink-0 h-11 bg-background p-0">
          <TabsTrigger value="form" className="rounded-none h-full data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
            {t('form') !== 'form' ? t('form') : 'Form'}
          </TabsTrigger>
          <TabsTrigger value="map" className="rounded-none h-full data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
            <MapPin className="h-4 w-4 mr-1" />
            {pickedLocation ? `${pickedLocation[1].toFixed(3)}, ${pickedLocation[0].toFixed(3)}` : t('selectLocation')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="form" className="flex-1 flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden" forceMount>
          {formBody}
          {formFooter}
        </TabsContent>
        <TabsContent value="map" className="flex-1 relative mt-0 data-[state=inactive]:hidden" forceMount>
          {mapPanel}
        </TabsContent>
        {successDialog}
      </Tabs>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-96 shrink-0 flex flex-col border-r">
        {formHeader}
        {formBody}
        {formFooter}
      </div>
      <div className="flex-1 relative">
        {mapPanel}
      </div>
      {successDialog}
    </div>
  )
}

// ─── Manual coordinate inputs ────────────────────────────────────────────────
// Accepts comma as decimal separator. Updates the picked location live while
// typing (when both values are valid) and flies the map there on blur/Enter.

function parseCoord(s: string): number | null {
  const trimmed = s.trim()
  if (!trimmed) return null
  const n = Number(trimmed.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function CoordinateInputs({ location, onChange }: {
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

// ─── Normalize choices ────────────────────────────────────────────────────────
// Backend may return choices in several shapes:
//   { id, value, label }           ← standard
//   { "default": "Uno" }           ← legacy / raw (no explicit id/value)
//   ["Uno", "Dos"]                 ← simple array of strings
// We normalize everything to { id, value, label } so the field renderers are uniform.

interface NormalizedChoice { id: number; value: string; label: unknown }

function normalizeChoices(raw: unknown[]): NormalizedChoice[] {
  return raw.map((c, i) => {
    if (typeof c === 'string') return { id: i, value: c, label: c }
    if (c && typeof c === 'object') {
      const obj = c as Record<string, unknown>
      // Standard shape
      if ('value' in obj) {
        const v = String(obj.value) || `option_${i}`
        return { id: (obj.id as number) ?? i, value: v, label: obj.label ?? obj.value }
      }
      // Legacy shape: { "default": "...", "es": "...", ... } — use the whole object as label so resolveLocalized can pick the right key
      return { id: i, value: String(obj['default'] ?? i), label: obj }
    }
    return { id: i, value: String(c), label: String(c) }
  })
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
  FILE:    { label: 'Archivo',    icon: File,        color: 'bg-purple-50 text-purple-600 border-purple-200' },
  CHOICE:  { label: 'Selección',  icon: ChevronDown, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  MCHOICE: { label: 'Múltiple',   icon: CheckSquare, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  QR:      { label: 'QR / Código', icon: QrCode,   color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  BARCODE: { label: 'Código barras', icon: QrCode, color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  BOOL:    { label: 'Sí / No',    icon: CheckSquare, color: 'bg-gray-50 text-gray-600 border-gray-200' },
}

function AnswerTypeBadge({ type }: { type: AnswerType }) {
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

function SingleChoiceField({ choices, allowOther, lang, value, onChange }: SingleChoiceFieldProps) {
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

function MultiChoiceField({ choices, allowOther, lang, value: selected, onChange }: MultiChoiceFieldProps) {
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

// ─── Image field with preview ────────────────────────────────────────────────

function ImageField({ questionId, register, required }: {
  questionId: string
  register: ReturnType<typeof useForm>['register']
  required: boolean
}) {
  const [preview, setPreview] = useState<string | null>(null)
  const { ref, onChange, ...rest } = register(questionId, { required })
  return (
    <div className="space-y-2">
      <Input
        type="file"
        accept="image/*"
        ref={ref}
        onChange={(e) => {
          onChange(e)
          const file = e.target.files?.[0]
          if (file) {
            const url = URL.createObjectURL(file)
            setPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return url })
          } else {
            setPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
          }
        }}
        {...rest}
      />
      {preview && (
        <img src={preview} alt="preview" className="rounded-md max-h-48 w-full object-cover border" />
      )}
    </div>
  )
}

// ─── Barcode / QR scanner field ──────────────────────────────────────────────

function BarcodeScanner({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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

function ObservationField({ questionId, answerType, choices, allowOther, required, lang, control, register }: ObservationFieldProps) {
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
      return <ImageField questionId={questionId} register={register} required={required} />
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
