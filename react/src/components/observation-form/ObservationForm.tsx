import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Loader2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProjectMap } from '@/components/map/ProjectMap'
import { resolveLocalized } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { useIsMobile } from '@/hooks/use-is-mobile'
import type { ObservationQuestion } from '@/types'
import { AnswerTypeBadge, CoordinateInputs, ObservationField } from './fields'
import { buildObservationFormData } from './build-form-data'

interface ObservationFormProps {
  fieldFormId: number
  questions: ObservationQuestion[]
  lang: string
  /** Header title. Defaults to t('addObservation'). */
  title?: string
  /** Back button handler. Omit to hide the back button. */
  onBack?: () => void
  /** Extra content rendered in the header, right of the title. */
  headerExtra?: ReactNode
  isSubmitting: boolean
  onSubmit: (formData: FormData) => void
  /**
   * Mobile arrangement. 'tabs' (default): [Form | Map] tabs. 'stacked': map on top,
   * form below — better for one-shot QR contributions where the location is "here".
   */
  mobileLayout?: 'tabs' | 'stacked'
  /** Ask for the device position on mount and pre-fill the location with it. */
  autoLocate?: boolean
  /** Show the manual lat/lon inputs. Default true; off for anonymous QR contributions to reduce input errors. */
  allowManualCoordinates?: boolean
}

/**
 * Observation form + location picker. Mobile (< md): Tabs [Form | Map] with
 * both panes mounted so state survives switching. Desktop: form sidebar + map.
 */
export function ObservationForm({
  fieldFormId, questions, lang, title, onBack, headerExtra, isSubmitting, onSubmit,
  mobileLayout = 'tabs', autoLocate = false, allowManualCoordinates = true,
}: ObservationFormProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const [pickedLocation, setPickedLocation] = useState<[number, number] | null>(null)
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null)
  const [mobileTab, setMobileTab] = useState<'form' | 'map'>('form')
  const [locating, setLocating] = useState(autoLocate && typeof navigator !== 'undefined' && 'geolocation' in navigator)

  const { control, handleSubmit, register } = useForm<Record<string, unknown>>()

  // Pre-fill with the device position. Silent on denial/timeout: the user can
  // still tap the map or type coordinates.
  useEffect(() => {
    if (!autoLocate || !('geolocation' in navigator)) return
    let cancelled = false
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return
        const loc: [number, number] = [pos.coords.longitude, pos.coords.latitude]
        setPickedLocation((prev) => prev ?? loc)
        setFlyTo(loc)
        setLocating(false)
      },
      () => { if (!cancelled) setLocating(false) /* denied or unavailable: fall back to manual pick */ },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
    return () => { cancelled = true }
  }, [autoLocate])

  const submit = (answers: Record<string, unknown>) => {
    if (!pickedLocation) {
      toast({ title: t('error'), description: t('selectLocation'), variant: 'destructive' })
      return
    }
    onSubmit(buildObservationFormData(fieldFormId, questions, pickedLocation, answers))
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
      {onBack && (
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}
      <h2 className="font-semibold flex-1 min-w-0 truncate">{title ?? t('addObservation')}</h2>
      {headerExtra}
    </div>
  )

  const formBody = (
    <div className="flex-1 min-h-0 overflow-y-auto p-4">
      <form id="obs-form" onSubmit={handleSubmit(submit)} className="space-y-4">
        <button
          type="button"
          onClick={() => isMobile && setMobileTab('map')}
          className="w-full text-left"
        >
          <Alert variant={pickedLocation ? 'success' : 'default'} className="border-dashed">
            {locating && !pickedLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
            <AlertDescription>
              {pickedLocation
                ? <>{`${pickedLocation[1].toFixed(5)}, ${pickedLocation[0].toFixed(5)}`}<span className="ml-2 text-xs text-muted-foreground">{t('tapToAdjust')}</span></>
                : locating ? t('locating') : t('selectLocation')}
            </AlertDescription>
          </Alert>
        </button>

        {allowManualCoordinates && <CoordinateInputs location={pickedLocation} onChange={handleManualCoords} />}

        {questions
          .slice()
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
    <div className="p-4 border-t shrink-0 bg-background pb-[max(1rem,env(safe-area-inset-bottom))]">
      <Button type="submit" form="obs-form" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t('loading') : t('submitObservation')}
      </Button>
    </div>
  )

  const mapPanel = (
    <ProjectMap
      pickingMode
      pickingHint={pickedLocation ? t('tapToAdjust') : locating ? t('locating') : undefined}
      pickedLocation={pickedLocation}
      onLocationPick={handleLocationPick}
      flyTo={flyTo}
    />
  )

  if (isMobile && mobileLayout === 'stacked') {
    return (
      <div className="flex flex-col h-full">
        {formHeader}
        <div className="relative h-[38dvh] shrink-0 border-b">
          {mapPanel}
        </div>
        {formBody}
        {formFooter}
      </div>
    )
  }

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
            {pickedLocation ? `${pickedLocation[1].toFixed(3)}, ${pickedLocation[0].toFixed(3)}` : locating ? t('locating') : t('selectLocation')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="form" className="flex-1 flex flex-col overflow-hidden mt-0 data-[state=inactive]:hidden" forceMount>
          {formBody}
          {formFooter}
        </TabsContent>
        <TabsContent value="map" className="flex-1 relative mt-0 data-[state=inactive]:hidden" forceMount>
          {mapPanel}
        </TabsContent>
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
    </div>
  )
}
