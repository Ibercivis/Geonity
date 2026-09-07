import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import DOMPurify from 'dompurify'
import { CheckCircle2, ListChecks, Loader2, LogIn, QrCode, ShieldCheck, TimerOff, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ObservationForm } from '@/components/observation-form/ObservationForm'
import { LanguagePicker } from '@/components/shared/LanguagePicker'
import { anonymousApi, AnonymousApiError, type AnonymousProject } from '@/api/anonymous'
import { getAnonymousId } from '@/lib/anonymous-id'
import { resolveLocalized, mediaUrl } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import logo from '@/assets/logo.webp'

// Public page reached by scanning a project's QR. No session, no navbar.
// Flow: landing → form → done. The optional ?src=<label> in the QR URL is
// forwarded with each observation so several posters per project can be told apart.

type Step = 'landing' | 'form' | 'done'

function coverUrl(cover: AnonymousProject['cover']): string | null {
  if (!cover) return null
  if (typeof cover === 'string') return mediaUrl(cover)
  if (Array.isArray(cover)) return cover[0]?.image ? mediaUrl(cover[0].image) : null
  return cover.image ? mediaUrl(cover.image) : null
}

function sourceStorageKey(token: string) {
  return `geonity_contribute_src_${token}`
}

export function ContributePage() {
  const { token = '' } = useParams<{ token: string }>()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
  const lang = useTranslationLang()

  const [step, setStep] = useState<Step>('landing')
  // Bumped after each submission so "send another" mounts a fresh form
  const [formKey, setFormKey] = useState(0)

  // Poster label from the QR (?src=). Kept in sessionStorage so it survives
  // internal navigation between steps and a reload.
  const source = useMemo(() => {
    const fromUrl = searchParams.get('src')?.trim().slice(0, 64) || null
    try {
      if (fromUrl) sessionStorage.setItem(sourceStorageKey(token), fromUrl)
      return fromUrl ?? sessionStorage.getItem(sourceStorageKey(token))
    } catch {
      return fromUrl
    }
  }, [searchParams, token])

  const { persisted: idPersisted } = useMemo(() => getAnonymousId(), [])

  // The backend resolves name/description/question_text by Accept-Language, so refetch on language change.
  const { data: project, isLoading, error } = useQuery({
    queryKey: ['anonymous-project', token, lang],
    queryFn: () => anonymousApi.getProject(token),
    enabled: !!token,
    retry: (count, err) => !(err instanceof AnonymousApiError && (err.status === 404 || err.status === 429)) && count < 1,
  })

  const projectName = project ? resolveLocalized(project.name, lang) : ''

  useEffect(() => {
    const prev = document.title
    if (projectName) document.title = `${projectName} · Geonity`
    return () => { document.title = prev }
  }, [projectName])

  const submitMutation = useMutation({
    mutationFn: (fd: FormData) => anonymousApi.createObservation(token, fd, source),
    onSuccess: () => setStep('done'),
    onError: (err) => {
      if (err instanceof AnonymousApiError) {
        if (err.status === 429) {
          toast({ title: t('contribute.tooManyTitle'), description: t('contribute.tooManyDesc'), variant: 'destructive' })
          return
        }
        if (err.status === 404) {
          toast({ title: t('contribute.notAvailableTitle'), variant: 'destructive' })
          return
        }
        toast({ title: t('error'), description: err.detail ?? undefined, variant: 'destructive' })
        return
      }
      toast({ title: t('error'), variant: 'destructive' })
    },
  })

  // ── Loading / error states ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Shell>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </Shell>
    )
  }

  if (error || !project) {
    const status = error instanceof AnonymousApiError ? error.status : 0
    const tooMany = status === 429
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
          {tooMany
            ? <TimerOff className="h-10 w-10 text-muted-foreground" />
            : <Unlink className="h-10 w-10 text-muted-foreground" />}
          <h1 className="text-lg font-semibold">
            {tooMany ? t('contribute.tooManyTitle') : t('contribute.notAvailableTitle')}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            {tooMany ? t('contribute.tooManyDesc') : t('contribute.notAvailableDesc')}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-2">
            <Link to="/">Geonity</Link>
          </Button>
        </div>
      </Shell>
    )
  }

  // ── Form ────────────────────────────────────────────────────────────────────

  if (step === 'form') {
    return (
      <div className="h-dvh bg-background">
        <ObservationForm
          key={formKey}
          fieldFormId={project.field_form}
          questions={project.questions}
          lang={lang}
          title={projectName}
          onBack={() => setStep('landing')}
          headerExtra={<LanguagePicker align="down" />}
          isSubmitting={submitMutation.isPending}
          onSubmit={(fd) => submitMutation.mutate(fd)}
          mobileLayout="stacked"
          autoLocate
          allowManualCoordinates={false}
        />
      </div>
    )
  }

  // ── Done ────────────────────────────────────────────────────────────────────

  if (step === 'done') {
    const message = project.show_post_message && project.post_observation_message
      ? resolveLocalized(project.post_observation_message, lang)
      : ''
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-4">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
          <h1 className="text-xl font-semibold">{t('observationSubmitted')}</h1>
          {message ? (
            <div
              className="text-sm text-muted-foreground prose prose-sm max-w-sm text-left"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message) }}
            />
          ) : (
            <p className="text-sm text-muted-foreground max-w-xs">{t('contribute.thanks', { project: projectName })}</p>
          )}
          <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
            <Button onClick={() => { setFormKey((k) => k + 1); setStep('form') }}>
              {t('contribute.sendAnother')}
            </Button>
            <Button variant="ghost" onClick={() => setStep('landing')}>
              {t('back')}
            </Button>
          </div>
        </div>
      </Shell>
    )
  }

  // ── Landing ─────────────────────────────────────────────────────────────────

  const cover = coverUrl(project.cover)
  const description = resolveLocalized(project.description, lang)
  const questionCount = project.questions.length

  return (
    <Shell>
      <div className="flex-1 overflow-y-auto">
        {cover ? (
          <div className="relative h-48 md:h-64 w-full bg-muted">
            <img src={cover} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <h1 className="absolute bottom-4 left-4 right-4 text-white text-2xl font-bold drop-shadow">
              {projectName}
            </h1>
          </div>
        ) : (
          <div className="px-4 pt-6">
            <h1 className="text-2xl font-bold">{projectName}</h1>
          </div>
        )}

        <div className="px-4 py-5 space-y-5 max-w-lg mx-auto w-full">
          {project.organizations && project.organizations.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {project.organizations.map((o) => o.principalName).filter(Boolean).join(' · ')}
            </p>
          )}

          {description && (
            <div
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
            />
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ListChecks className="h-4 w-4 shrink-0" />
            <span>{t('contribute.questionsCount', { count: questionCount })}</span>
          </div>

          <Button size="lg" className="w-full h-12 text-base" onClick={() => setStep('form')}>
            <QrCode className="h-5 w-5 mr-2" />
            {t('contribute.participate')}
          </Button>

          <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1.5">
            <p className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                {t('contribute.privacyNote')}{' '}
                <Link to="/privacy-policy" className="underline hover:text-foreground">{t('privacyPolicyLink')}</Link>
              </span>
            </p>
            {!idPersisted && <p className="pl-6">{t('contribute.storageWarning')}</p>}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            {t('contribute.haveAccount')}{' '}
            <Link to="/login" className="inline-flex items-center gap-1 text-primary hover:underline">
              <LogIn className="h-3 w-3" />
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </Shell>
  )
}

/** Minimal mobile shell: logo bar + language picker, no navbar. */
function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col h-dvh bg-background">
      <header className="flex items-center justify-between px-4 h-12 border-b shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Geonity" className="h-7" />
        </Link>
        <LanguagePicker align="down" />
      </header>
      {children}
      <footer className="shrink-0 px-4 py-2 text-center text-[11px] text-muted-foreground border-t">
        {t('poweredBy')}{' '}
        <a href="https://ibercivis.es" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
          Ibercivis
        </a>
      </footer>
    </div>
  )
}
