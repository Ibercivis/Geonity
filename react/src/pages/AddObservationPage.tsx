import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import DOMPurify from 'dompurify'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ObservationForm } from '@/components/observation-form/ObservationForm'
import { projectsApi } from '@/api/projects'
import { resolveLocalized } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { useTranslationLang } from '@/hooks/use-translation-lang'

export function AddObservationPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const lang = useTranslationLang()

  const qc = useQueryClient()
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [modalDismissed, setModalDismissed] = useState(false)

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

  if (isLoading || !fieldForm) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">{t('loading')}</div>
  }

  return (
    <>
      <ObservationForm
        fieldFormId={fieldForm.id}
        questions={fieldForm.questions}
        lang={lang}
        onBack={() => navigate(-1)}
        isSubmitting={submitMutation.isPending}
        onSubmit={(fd) => submitMutation.mutate(fd)}
      />

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
    </>
  )
}
