import { useState, useEffect } from 'react'
import { Trash2, Calendar, MapPin, X, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { Lightbox } from '@/components/ui/lightbox'
import { projectsApi } from '@/api/projects'
import { resolveLocalized, mediaUrl, parseGeoposition, cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { config } from '@/config/env'
import type { FieldForm, Observation } from '@/types'

interface GeoPlace { country?: string; region?: string; place?: string }
const GEOCODE_CACHE_MAX = 100
const geocodeCache = new Map<string, GeoPlace>()
function geocodeCacheSet(key: string, value: GeoPlace) {
  if (geocodeCache.size >= GEOCODE_CACHE_MAX) {
    geocodeCache.delete(geocodeCache.keys().next().value!)
  }
  geocodeCache.set(key, value)
}

interface ObservationPanelProps {
  observation: Observation | null
  open: boolean
  fieldForm?: FieldForm
  projectId: number
  onClose: () => void
  observations?: Observation[]
  onNavigate?: (obs: Observation) => void
}

export function ObservationPanel({
  observation,
  open,
  fieldForm,
  projectId: _projectId,
  onClose,
  observations = [],
  onNavigate,
}: ObservationPanelProps) {
  const { t, i18n } = useTranslation()
  const lang = useTranslationLang()
  const qc = useQueryClient()
  const isMobile = useIsMobile()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [geoPlace, setGeoPlace] = useState<GeoPlace | null>(null)

  const i18nLang = i18n.language?.split('-')[0] ?? 'en'

  const deleteMutation = useMutation({
    mutationFn: (obsId: number) => projectsApi.deleteObservation(obsId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['observations'] })
      qc.invalidateQueries({ queryKey: ['map-points'] })
      toast({ title: t('observationDeleted') })
      onClose()
    },
    onError: () => toast({ title: t('error'), variant: 'destructive' }),
  })

  useEffect(() => {
    const coords = observation ? parseGeoposition(observation.geoposition) : null
    if (!coords) { setGeoPlace(null); return }
    const key = `${coords[0].toFixed(5)},${coords[1].toFixed(5)}`
    if (geocodeCache.has(key)) { setGeoPlace(geocodeCache.get(key)!); return }
    setGeoPlace(null)
    const controller = new AbortController()
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords[0]},${coords[1]}.json?types=country,region,place&language=${i18nLang}&access_token=${config.mapboxToken}`
    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const features: { place_type: string[]; text: string }[] = data.features ?? []
        const get = (type: string) => features.find((f) => f.place_type.includes(type))?.text
        const result: GeoPlace = { country: get('country'), region: get('region'), place: get('place') }
        geocodeCacheSet(key, result)
        setGeoPlace(result)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error('[Geocoding]', err)
      })
    return () => controller.abort()
  }, [observation?.id, i18nLang, config.mapboxToken])

  const currentIndex = observation ? observations.findIndex((o) => o.id === observation.id) : -1
  const canNav = observations.length > 1 && onNavigate
  const isFirst = currentIndex <= 0
  const isLast = currentIndex >= observations.length - 1

  const coords = observation ? parseGeoposition(observation.geoposition) : null
  const date = observation ? new Date(observation.timestamp || observation.created_at) : null

  const rawDataEntries: { key: string; value: unknown }[] = observation
    ? Array.isArray(observation.data)
      ? observation.data
      : Object.entries(observation.data as Record<string, unknown>).map(([key, value]) => ({ key, value }))
    : []

  // Split data entries into:
  //  - isOtherMap:    { questionId → boolean }  (true when user picked "Other")
  //  - otherTextMap:  { questionId → string }   (the free text typed for "Other")
  //  - dataEntries:                              the actual answers to render
  // Backend may serialize booleans as either real booleans or strings ("true"/"false"),
  // so we coerce explicitly to avoid treating "false" as truthy.
  const isOtherMap = new Map<string, boolean>()
  const otherTextMap = new Map<string, string>()
  const dataEntries: { key: string; value: unknown }[] = []
  for (const entry of rawDataEntries) {
    const isOtherMatch = entry.key.match(/^(\d+)_is_other$/)
    if (isOtherMatch) {
      const v = entry.value
      const truthy = v === true || v === 1 || v === '1' || (typeof v === 'string' && v.toLowerCase() === 'true')
      isOtherMap.set(isOtherMatch[1], truthy)
      continue
    }
    const otherTextMatch = entry.key.match(/^(\d+)_other_text$/)
    if (otherTextMatch) {
      otherTextMap.set(otherTextMatch[1], String(entry.value ?? ''))
      continue
    }
    dataEntries.push(entry)
  }

  const labelFor = (key: string) => {
    if (!fieldForm) return key
    const q = fieldForm.questions.find((q) => String(q.id) === key)
    return q ? resolveLocalized(q.question_text, lang) : key
  }

  /** Resolve a stored choice value into its localized label, falling back to the raw value. */
  const resolveChoiceValue = (questionId: string, value: string): string => {
    if (!fieldForm) return value
    const q = fieldForm.questions.find((q) => String(q.id) === questionId)
    if (!q || !Array.isArray(q.choices) || q.choices.length === 0) return value
    // Choices may have shape { value, label } | string | { default: '...' }
    for (const c of q.choices as unknown[]) {
      if (typeof c === 'string') {
        if (c === value) return c
        continue
      }
      if (c && typeof c === 'object') {
        const obj = c as Record<string, unknown>
        const cValue = 'value' in obj ? String(obj.value) : String(obj['default'] ?? '')
        if (cValue === value) {
          const label = 'label' in obj ? obj.label : obj
          return resolveLocalized(label as never, lang)
        }
      }
    }
    return value
  }

  /** Render a stored value (handles single/multi choice, booleans, etc.) */
  const formatValue = (key: string, value: unknown): string => {
    if (typeof value === 'boolean') return value ? '✓ Yes' : '✗ No'
    const str = String(value)
    // Comma-separated multi-choice
    if (str.includes(',')) {
      return str.split(',').map((v) => resolveChoiceValue(key, v.trim())).join(', ')
    }
    return resolveChoiceValue(key, str)
  }

  const images = observation
    ? (observation.images ?? []).flatMap((img) => {
        const url = typeof img === 'string' ? mediaUrl(img) : mediaUrl((img as { image: string }).image)
        return url ? [url] : []
      })
    : []

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }} modal={false}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          hideOverlay
          hideClose
          className={cn(
            'flex flex-col p-0 shadow-xl',
            isMobile ? 'border-t h-[75dvh]' : 'border-l'
          )}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          {isMobile && (
            <div className="mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-muted-foreground/30 shrink-0" />
          )}
          <SheetHeader className="shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <SheetTitle className="truncate">Observation #{observation?.id}</SheetTitle>
                {observation?.is_mine && (
                  <Badge variant="secondary" className="text-xs shrink-0">{t('mine')}</Badge>
                )}
              </div>
              <SheetClose asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
            {canNav && (
              <div className="flex items-center gap-1 pt-1">
                <Button
                  variant="outline" size="icon" className="h-7 w-7"
                  disabled={isFirst}
                  onClick={() => onNavigate!(observations[0])}
                  title={t('firstObservation')}
                >
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline" size="icon" className="h-7 w-7"
                  disabled={isFirst}
                  onClick={() => onNavigate!(observations[currentIndex - 1])}
                  title={`Observation #${observations[currentIndex - 1]?.id}`}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="flex-1 text-center text-xs text-muted-foreground tabular-nums">
                  {currentIndex + 1} / {observations.length}
                </span>
                <Button
                  variant="outline" size="icon" className="h-7 w-7"
                  disabled={isLast}
                  onClick={() => onNavigate!(observations[currentIndex + 1])}
                  title={`Observation #${observations[currentIndex + 1]?.id}`}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline" size="icon" className="h-7 w-7"
                  disabled={isLast}
                  onClick={() => onNavigate!(observations[observations.length - 1])}
                  title={t('lastObservation')}
                >
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Meta */}
            <div className="space-y-1.5 text-sm text-muted-foreground">
              {date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>{date.toLocaleString()}</span>
                </div>
              )}
              {coords && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-mono text-xs">
                      {coords[1].toFixed(5)}, {coords[0].toFixed(5)}
                    </span>
                    {geoPlace && (
                      <p className="text-xs leading-snug">
                        {[geoPlace.place, geoPlace.region, geoPlace.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Images */}
            {images.length > 0 && (
              <div className="space-y-2">
                {images.map((url, i) => (
                  <button key={i} className="w-full block" onClick={() => setLightboxIndex(i)} type="button">
                    <img
                      src={url}
                      alt={`Image ${i + 1}`}
                      className="w-full rounded-md object-cover max-h-48 hover:opacity-90 transition-opacity cursor-zoom-in"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Data fields */}
            {dataEntries.length > 0 && (
              <div className="space-y-3">
                <Separator />
                {dataEntries.map(({ key, value }) => {
                  const isOther = isOtherMap.get(key) === true
                  const otherText = otherTextMap.get(key)
                  // When user picked "Other", the meaningful answer is in *_other_text.
                  const effectiveValue = isOther && otherText ? otherText : value
                  if (effectiveValue === null || effectiveValue === undefined || effectiveValue === '') return null
                  const label = labelFor(key)
                  const displayValue = isOther && otherText ? otherText : formatValue(key, value)
                  return (
                    <div key={key} className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {label}
                        </p>
                        {isOther && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal bg-amber-50 text-amber-700 border-amber-200">
                            {t('otherAnswer')}
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm ${isOther ? 'italic' : ''}`}>
                        {displayValue}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Admin values */}
            {(observation?.admin_values?.length ?? 0) > 0 && (
              <div className="space-y-3">
                <Separator />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t('adminValues')}
                </p>
                {observation!.admin_values.map((av) => (
                  <div key={av.key} className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">{av.label}</p>
                    <p className="text-sm">{String(av.value)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {observation?.is_mine && (
            <div className="p-4 border-t shrink-0">
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => observation && deleteMutation.mutate(observation.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('delete')}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
