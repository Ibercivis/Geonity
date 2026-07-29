import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { MapboxMap } from '@/components/MapboxMap'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Toast, ToastViewport } from '@/components/ui/toast'
import { BulkImportDialog } from '@/features/bulk-import/components/BulkImportDialog'
import { useBulkImport } from '@/features/bulk-import/hooks/useBulkImport'
import { ConsentGate } from '@/features/auth/components/ConsentGate'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ImagePreviewOverlay } from '@/features/observations/components/ImagePreviewOverlay'
import { ObservationEmailLogsDialog } from '@/features/observations/components/ObservationEmailLogsDialog'
import { ObservationsTable } from '@/features/observations/components/ObservationsTable'
import { SendObservationEmailDialog } from '@/features/observations/components/SendObservationEmailDialog'
import { useImagePreview } from '@/features/observations/hooks/useImagePreview'
import { useObservations } from '@/features/observations/hooks/useObservations'
import { ProjectObservationFieldModal } from '@/features/project-fields/components/ProjectObservationFieldModal'
import { useProjectObservationFields } from '@/features/project-fields/hooks/useProjectObservationFields'
import { AppHeader } from '@/features/projects/components/AppHeader'
import { ProjectInfoDialog } from '@/features/projects/components/ProjectInfoDialog'
import { useProjects } from '@/features/projects/hooks/useProjects'
import type { ObservationRow } from '@/types/observation'
import type { ProjectInvitation } from '@/types/project'
import {
  acceptProjectInvitation,
  createProjectInvitation,
  fetchPendingProjectInvitations,
  fetchProjectInvitations,
  removeProjectAdministrator,
  rejectProjectInvitation,
} from '@/lib/api/projects'

type AppToast = {
  title: string
  description?: string | null
  variant?: 'default' | 'destructive' | 'success'
}

function preferredLocales(): string[] {
  const locales = new Set<string>(['es', 'en'])

  if (typeof document !== 'undefined' && typeof document.documentElement?.lang === 'string') {
    const lang = document.documentElement.lang.trim().toLowerCase()
    if (lang) {
      locales.add(lang)
      locales.add(lang.split('-')[0])
    }
  }

  if (typeof navigator !== 'undefined' && typeof navigator.language === 'string') {
    const lang = navigator.language.trim().toLowerCase()
    if (lang) {
      locales.add(lang)
      locales.add(lang.split('-')[0])
    }
  }

  return Array.from(locales)
}

function localizedTextFromRecord(record: Record<string, unknown>): string {
  for (const locale of preferredLocales()) {
    const value = record[locale]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  for (const value of Object.values(record)) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return ''
}

function normalizeLocalizedText(value: unknown): string | null {
  if (!value) return null

  if (typeof value === 'object' && !Array.isArray(value)) {
    const normalized = localizedTextFromRecord(value as Record<string, unknown>)
    return normalized || null
  }

  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  if (!(trimmed.startsWith('{') && trimmed.endsWith('}'))) return trimmed

  try {
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return localizedTextFromRecord(parsed as Record<string, unknown>) || trimmed
    }
  } catch {
    return trimmed
  }

  return trimmed
}

function normalizeProjectInvitations(data: unknown): ProjectInvitation[] {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { results?: unknown[] }).results)
      ? ((data as { results?: unknown[] }).results ?? [])
      : data && typeof data === 'object' && Array.isArray((data as { invitations?: unknown[] }).invitations)
        ? ((data as { invitations?: unknown[] }).invitations ?? [])
        : []

  return list
    .map<ProjectInvitation | null>((item) => {
      if (!item || typeof item !== 'object') return null

      const row = item as Record<string, unknown>
      const idValue = row.id ?? row.invitation_id ?? row.invitationId
      const emailValue = row.email ?? row.invited_email ?? row.invitedEmail ?? row.recipient ?? row.user_email ?? row.userEmail
      const statusValue = row.status ?? row.state
      const createdAtValue = row.created_at ?? row.createdAt ?? row.sent_at ?? row.sentAt
      const acceptedAtValue = row.accepted_at ?? row.acceptedAt

      const id =
        typeof idValue === 'string' || typeof idValue === 'number'
          ? String(idValue)
          : typeof emailValue === 'string'
            ? `${emailValue}:${typeof createdAtValue === 'string' ? createdAtValue : ''}`
            : ''
      const email = typeof emailValue === 'string' ? emailValue.trim() : ''
      if (!id || !email) return null

      return {
        id,
        email,
        status: typeof statusValue === 'string' ? statusValue : null,
        createdAt: typeof createdAtValue === 'string' ? createdAtValue : null,
        acceptedAt: typeof acceptedAtValue === 'string' ? acceptedAtValue : null,
        projectId:
          typeof (row.project_id ?? row.projectId) === 'string' || typeof (row.project_id ?? row.projectId) === 'number'
            ? String(row.project_id ?? row.projectId)
            : typeof row.project === 'object' && row.project && !Array.isArray(row.project) && (typeof (row.project as Record<string, unknown>).id === 'string' || typeof (row.project as Record<string, unknown>).id === 'number')
              ? String((row.project as Record<string, unknown>).id)
              : null,
        projectName:
          normalizeLocalizedText(row.project_name) ??
          normalizeLocalizedText(row.projectName) ??
          (typeof row.project === 'object' && row.project && !Array.isArray(row.project)
            ? normalizeLocalizedText((row.project as Record<string, unknown>).name)
            : null),
      }
    })
    .filter((invitation): invitation is ProjectInvitation => invitation !== null)
}

export default function AppShell() {
  const { t } = useTranslation()
  const {
    email, password, isSubmitting, error, success, authKey, userLabel,
    submitCredentials, clearAuth,
    needsConsent, isCheckingConsent, isAcceptingConsent, consentError, acceptConsent,
  } = useAuth()
  const {
    projectsError,
    isLoadingProjects,
    selectedProjectId,
    setSelectedProjectId,
    selectedProject,
    projectOptions,
    reloadProjects,
    clearProjects,
  } = useProjects(authKey)

  const [selectedObservationId, setSelectedObservationId] = React.useState<string | number | null>(null)
  const [isRawJsonOpen, setIsRawJsonOpen] = React.useState(false)
  const [focusMode, setFocusMode] = React.useState(false)
  const [toast, setToast] = React.useState<AppToast | null>(null)
  const toastTimeoutRef = React.useRef<number | null>(null)

  const showToast = React.useCallback((nextToast: AppToast) => {
    setToast(nextToast)

    if (typeof window !== 'undefined') {
      if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current)
      toastTimeoutRef.current = window.setTimeout(() => {
        setToast(null)
        toastTimeoutRef.current = null
      }, 3500)
    }
  }, [])

  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current)
      }
    }
  }, [])

  const selectedProjectRole = selectedProject?.role ?? ''
  const canManageProjectObservationField = selectedProjectRole === 'creador'
  const canCreateProjectObservationField = canManageProjectObservationField
  const canManageProjectParticipants = selectedProjectRole === 'creador' || selectedProjectRole === 'administrador'
  const canRemoveProjectAdministrators = selectedProjectRole === 'creador'
  const [isProjectInfoOpen, setIsProjectInfoOpen] = React.useState(false)
  const [projectInvitations, setProjectInvitations] = React.useState<ProjectInvitation[]>([])
  const [isLoadingProjectInvitations, setIsLoadingProjectInvitations] = React.useState(false)
  const [projectInvitationsError, setProjectInvitationsError] = React.useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = React.useState('')
  const [isSendingProjectInvitation, setIsSendingProjectInvitation] = React.useState(false)
  const [removingAdministratorId, setRemovingAdministratorId] = React.useState<string | null>(null)
  const [pendingInvitations, setPendingInvitations] = React.useState<ProjectInvitation[]>([])
  const [isLoadingPendingInvitations, setIsLoadingPendingInvitations] = React.useState(false)
  const [pendingInvitationsError, setPendingInvitationsError] = React.useState<string | null>(null)
  const [acceptingInvitationId, setAcceptingInvitationId] = React.useState<string | null>(null)
  const [rejectingInvitationId, setRejectingInvitationId] = React.useState<string | null>(null)

  const loadPendingInvitations = React.useCallback(async () => {
    if (!authKey) {
      setPendingInvitations([])
      setPendingInvitationsError(null)
      return
    }

    setIsLoadingPendingInvitations(true)
    setPendingInvitationsError(null)

    try {
      const response = await fetchPendingProjectInvitations(authKey)
      setPendingInvitations(normalizeProjectInvitations(response).filter((invitation) => !invitation.acceptedAt))
    } catch (error) {
      setPendingInvitationsError(error instanceof Error ? error.message : t('shell.pendingInvitationsError'))
    } finally {
      setIsLoadingPendingInvitations(false)
    }
  }, [authKey])

  React.useEffect(() => {
    if (!authKey) {
      setPendingInvitations([])
      setPendingInvitationsError(null)
      return
    }

    void loadPendingInvitations()
  }, [authKey, loadPendingInvitations])

  const handleAcceptInvitation = React.useCallback(async (invitationId: string) => {
    if (!authKey || !invitationId) return

    setAcceptingInvitationId(invitationId)
    setPendingInvitationsError(null)

    try {
      await acceptProjectInvitation({ sessionKey: authKey, invitationId })
      showToast({
        title: t('shell.invitationAccepted'),
        description: t('shell.invitationAcceptedDesc'),
        variant: 'success',
      })
      await Promise.all([loadPendingInvitations(), Promise.resolve(reloadProjects())])
    } catch (error) {
      setPendingInvitationsError(error instanceof Error ? error.message : t('shell.acceptInvitationError'))
    } finally {
      setAcceptingInvitationId(null)
    }
  }, [authKey, loadPendingInvitations, reloadProjects, showToast])

  const handleRejectInvitation = React.useCallback(async (invitationId: string) => {
    if (!authKey || !invitationId) return

    setRejectingInvitationId(invitationId)
    setPendingInvitationsError(null)

    try {
      await rejectProjectInvitation({ sessionKey: authKey, invitationId })
      showToast({
        title: t('shell.invitationRejected'),
        description: t('shell.invitationRejectedDesc'),
        variant: 'success',
      })
      await loadPendingInvitations()
    } catch (error) {
      setPendingInvitationsError(error instanceof Error ? error.message : t('shell.rejectInvitationError'))
    } finally {
      setRejectingInvitationId(null)
    }
  }, [authKey, loadPendingInvitations, showToast])

  const loadProjectInvitations = React.useCallback(async () => {
    if (!authKey || !selectedProjectId || !canManageProjectParticipants) {
      setProjectInvitations([])
      setProjectInvitationsError(null)
      return
    }

    setIsLoadingProjectInvitations(true)
    setProjectInvitationsError(null)

    try {
      const response = await fetchProjectInvitations(authKey, selectedProjectId)
      setProjectInvitations(normalizeProjectInvitations(response))
    } catch (error) {
      setProjectInvitationsError(error instanceof Error ? error.message : t('shell.loadInvitationsError'))
    } finally {
      setIsLoadingProjectInvitations(false)
    }
  }, [authKey, canManageProjectParticipants, selectedProjectId])

  React.useEffect(() => {
    if (!isProjectInfoOpen) return
    void loadProjectInvitations()
  }, [isProjectInfoOpen, loadProjectInvitations])

  React.useEffect(() => {
    setProjectInvitations([])
    setProjectInvitationsError(null)
    setInviteEmail('')
    setIsSendingProjectInvitation(false)
  }, [selectedProjectId])

  const handleSendProjectInvitation = React.useCallback(async () => {
    if (!authKey || !selectedProjectId || !canManageProjectParticipants) return

    const email = inviteEmail.trim()
    if (!email) return

    setIsSendingProjectInvitation(true)
    setProjectInvitationsError(null)

    try {
      await createProjectInvitation({
        sessionKey: authKey,
        projectId: selectedProjectId,
        email,
      })

      setInviteEmail('')
      showToast({
        title: t('shell.invitationSent'),
        description: email,
        variant: 'success',
      })
      await loadProjectInvitations()
    } catch (error) {
      setProjectInvitationsError(error instanceof Error ? error.message : t('shell.sendInvitationError'))
    } finally {
      setIsSendingProjectInvitation(false)
    }
  }, [authKey, canManageProjectParticipants, inviteEmail, loadProjectInvitations, selectedProjectId, showToast])

  const handleRemoveAdministrator = React.useCallback(async (participant: { id?: string | number; label: string }) => {
    if (!authKey || !selectedProjectId || !canRemoveProjectAdministrators || participant.id === undefined) return

    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm(t('shell.confirmRemoveAdmin', { name: participant.label }))

    if (!confirmed) return

    const userId = String(participant.id)
    setRemovingAdministratorId(userId)
    setProjectInvitationsError(null)

    try {
      await removeProjectAdministrator({
        sessionKey: authKey,
        projectId: selectedProjectId,
        userId,
      })

      showToast({
        title: t('shell.adminRemoved'),
        description: participant.label,
        variant: 'success',
      })
      reloadProjects()
    } catch (error) {
      setProjectInvitationsError(error instanceof Error ? error.message : t('shell.removeAdminError'))
    } finally {
      setRemovingAdministratorId(null)
    }
  }, [authKey, canRemoveProjectAdministrators, reloadProjects, selectedProjectId, showToast])

  const {
    imagePreview,
    imagePreviewLoading,
    imagePreviewError,
    showImagePreview,
    hideImagePreview,
    handlePreviewLoad,
    handlePreviewError,
  } = useImagePreview()

  const {
    projectObservationFields,
    projectObservationFieldsCollectionPath,
    editingProjectObservationFieldId,
    currentProjectObservationField,
    isSavingProjectObservationField,
    saveProjectObservationFieldError,
    isColumnModalOpen,
    closeProjectObservationFieldModal,
    openProjectObservationFieldCreator,
    openProjectObservationFieldEditor,
    saveProjectObservationField,
    deleteProjectObservationField,
    clearProjectObservationFields,
  } = useProjectObservationFields({
    authKey,
    selectedProjectId,
    canManageProjectObservationField,
    showToast,
  })

  const {
    questions,
    observations,
    observationsError,
    isLoadingObservations,
    cellDrafts,
    setCellDrafts,
    cellSaving,
    cellSaveError,
    normalizedObservationRows,
    sortedObservationRows,
    normalizeObservations,
    extractLatLon,
    displayValueForQuestion,
    rawValueForProjectField,
    projectFieldMetaForObservation,
    ensureAdminFieldsLoadedForObservation,
    saveProjectFieldValue,
    emailLogsOpen,
    emailLogsObservationId,
    emailLogs,
    isLoadingEmailLogs,
    emailLogsError,
    openObservationEmailLogs,
    closeObservationEmailLogs,
    sendEmailOpen,
    sendEmailObservationId,
    sendEmailInitialDraft,
    isSendingObservationEmail,
    sendObservationEmailError,
    openObservationEmailComposer,
    closeObservationEmailComposer,
    submitObservationEmail,
    sendObservationEmailForObservation,
    toggleSort,
    sortIndicatorFor,
    exportToCSV,
    clearObservations,
    reloadObservations,
  } = useObservations({
    authKey,
    selectedProjectId,
    selectedProjectEmailSubject: selectedProject?.emailSubject,
    selectedProjectEmailIntro: selectedProject?.emailIntro,
    projectObservationFields,
    showToast,
  })

  const answerFor = React.useCallback((observation: ObservationRow, questionId: number): React.ReactNode => {
    const images = Array.isArray(observation?.images) ? (observation.images as Array<Record<string, unknown>>) : []
    const image = images.find((item) => String(item?.question) === String(questionId))
    if (image?.image && typeof image.image === 'string') {
      return (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto px-0 py-0 text-xs font-normal underline"
          onMouseEnter={(event) => showImagePreview(image.image as string, event.currentTarget)}
          onMouseLeave={hideImagePreview}
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.open(image.image as string, '_blank', 'noopener,noreferrer')
            }
          }}
        >
          {t('shell.viewImage')}
        </Button>
      )
    }

    const value = displayValueForQuestion(observation, questionId)
    if (value === null || value === undefined) return '—'
    return value
  }, [displayValueForQuestion, hideImagePreview, showImagePreview])

  const {
    bulkDialogOpen,
    setBulkDialogOpen,
    bulkStep,
    setBulkStep,
    bulkRawRows,
    bulkHasHeader,
    setBulkHasHeader,
    bulkJoinCsvCol,
    setBulkJoinCsvCol,
    bulkJoinOptions,
    bulkJoinTarget,
    setBulkJoinTarget,
    bulkJoinValueForObservation,
    bulkMappings,
    setBulkMappings,
    bulkProgress,
    bulkRunning,
    bulkFinished,
    bulkUnmatched,
    bulkParseError,
    bulkSendEmailUpdates,
    setBulkSendEmailUpdates,
    bulkEmailSubject,
    setBulkEmailSubject,
    bulkEmailIntro,
    setBulkEmailIntro,
    bulkFileInputRef,
    handleBulkFileChange,
    runBulkImport,
    clearBulkState,
  } = useBulkImport({
    authKey,
    observations,
    questions,
    projectObservationFields,
    defaultEmailSubject: selectedProject?.emailSubject,
    defaultEmailIntro: selectedProject?.emailIntro,
    normalizeObservations,
    displayValueForQuestion,
    rawValueForProjectField,
    saveProjectFieldValue,
    sendObservationEmailForObservation,
    showToast,
  })

  const handleLogout = React.useCallback(async () => {
    const result = await clearAuth()
    clearProjects()
    clearProjectObservationFields()
    clearObservations()
    clearBulkState()
    setIsProjectInfoOpen(false)
    setPendingInvitations([])
    setPendingInvitationsError(null)
    setAcceptingInvitationId(null)
    setRejectingInvitationId(null)
    setSelectedObservationId(null)
    if (!result.ok && result.error) {
      console.warn(result.error)
    }
  }, [clearAuth, clearBulkState, clearObservations, clearProjectObservationFields, clearProjects])

  // Bug fix 1: auto-logout when any API call returns 401
  React.useEffect(() => {
    function onUnauthorized() {
      void handleLogout()
    }
    window.addEventListener('geonity:unauthorized', onUnauthorized)
    return () => window.removeEventListener('geonity:unauthorized', onUnauthorized)
  }, [handleLogout])

  // Bug fix 2 & 3: reload data when tab becomes visible again (after ≥60 s hidden) or network reconnects
  const hiddenAtRef = React.useRef<number | null>(null)
  React.useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = Date.now()
        return
      }
      const hiddenMs = hiddenAtRef.current !== null ? Date.now() - hiddenAtRef.current : 0
      hiddenAtRef.current = null
      if (!authKey || hiddenMs < 60_000) return
      reloadProjects()
      reloadObservations()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [authKey, reloadObservations, reloadProjects])

  React.useEffect(() => {
    function onOnline() {
      if (!authKey) return
      reloadProjects()
      reloadObservations()
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [authKey, reloadObservations, reloadProjects])

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
  const mapObservations = React.useMemo(() => normalizeObservations(observations), [normalizeObservations, observations])

  if (!authKey) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground">
        <LoginForm
          defaultValues={{ email, password }}
          isSubmitting={isSubmitting}
          error={error}
          success={success}
          onSubmit={submitCredentials}
        />
      </div>
    )
  }

  if (isCheckingConsent) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
      </div>
    )
  }

  if (needsConsent) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground">
        <ConsentGate
          isAccepting={isAcceptingConsent}
          error={consentError}
          onAccept={acceptConsent}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <ImagePreviewOverlay
        imagePreview={imagePreview}
        imagePreviewLoading={imagePreviewLoading}
        imagePreviewError={imagePreviewError}
        onLoad={handlePreviewLoad}
        onError={handlePreviewError}
      />

      <ObservationEmailLogsDialog
        open={emailLogsOpen}
        observationId={emailLogsObservationId}
        logs={emailLogs}
        isLoading={isLoadingEmailLogs}
        error={emailLogsError}
        onClose={closeObservationEmailLogs}
      />

      <SendObservationEmailDialog
        open={sendEmailOpen}
        observationId={sendEmailObservationId}
        initialDraft={sendEmailInitialDraft}
        isSending={isSendingObservationEmail}
        error={sendObservationEmailError}
        onClose={closeObservationEmailComposer}
        onSubmit={submitObservationEmail}
      />

      <ProjectInfoDialog
        open={isProjectInfoOpen}
        project={selectedProject}
        canManageParticipants={canManageProjectParticipants}
        canRemoveAdministrators={canRemoveProjectAdministrators}
        invitations={projectInvitations}
        isLoadingInvitations={isLoadingProjectInvitations}
        invitationsError={projectInvitationsError}
        inviteEmail={inviteEmail}
        onInviteEmailChange={setInviteEmail}
        isSendingInvitation={isSendingProjectInvitation}
        removingAdministratorId={removingAdministratorId}
        onRemoveAdministrator={handleRemoveAdministrator}
        onSendInvitation={handleSendProjectInvitation}
        onRefreshInvitations={() => {
          void loadProjectInvitations()
        }}
        onClose={() => setIsProjectInfoOpen(false)}
      />

      <ResizablePanelGroup orientation="vertical" className="min-h-screen">
        <ResizablePanel defaultSize={40} minSize={20}>
          <div className="flex h-full flex-col">
            <AppHeader
              projectOptions={projectOptions}
              selectedProjectId={selectedProjectId}
              isLoadingProjects={isLoadingProjects}
              projectsError={projectsError}
              currentUserLabel={userLabel || email || t('header.user.fallback')}
              currentUserEmail={email || undefined}
              pendingInvitations={pendingInvitations}
              pendingInvitationsError={pendingInvitationsError}
              isLoadingPendingInvitations={isLoadingPendingInvitations}
              acceptingInvitationId={acceptingInvitationId}
              rejectingInvitationId={rejectingInvitationId}
              onProjectChange={(projectId) => {
                setSelectedProjectId(projectId)
                setSelectedObservationId(null)
              }}
              onAcceptInvitation={(invitationId) => {
                void handleAcceptInvitation(invitationId)
              }}
              onRejectInvitation={(invitationId) => {
                void handleRejectInvitation(invitationId)
              }}
              onRefreshPendingInvitations={() => {
                void loadPendingInvitations()
              }}
              onOpenProjectInfo={() => setIsProjectInfoOpen(true)}
              onLogout={() => {
                void handleLogout()
              }}
              observationCount={normalizedObservationRows.length}
              hasObservations={normalizedObservationRows.length > 0}
              canImport={projectObservationFields.length > 0}
              canCreateColumn={canCreateProjectObservationField}
              canOpenColumnCreator={Boolean(projectObservationFieldsCollectionPath)}
              onExport={exportToCSV}
              onImportClick={() => bulkFileInputRef.current?.click()}
              onOpenRawJson={() => setIsRawJsonOpen(true)}
              onOpenColumnCreator={openProjectObservationFieldCreator}
              focusMode={focusMode}
              onToggleFocusMode={() => setFocusMode((prev) => !prev)}
            />

            <Input
              ref={bulkFileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleBulkFileChange}
            />

            {(observationsError || bulkParseError) ? (
              <div className="flex-none px-4 pt-2 space-y-1">
                {observationsError ? (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription>{observationsError}</AlertDescription>
                  </Alert>
                ) : null}
                {bulkParseError ? (
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription>{bulkParseError}</AlertDescription>
                  </Alert>
                ) : null}
              </div>
            ) : null}

            {(isLoadingProjects || isLoadingObservations) && !observations ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
              </div>
            ) : null}

            {observations ? (
              <div className="flex-1 overflow-hidden px-4 pt-2">
                <ObservationsTable
                  rows={sortedObservationRows}
                  questions={questions}
                  projectObservationFields={projectObservationFields}
                  selectedObservationId={selectedObservationId}
                  onSelectObservation={setSelectedObservationId}
                  toggleSort={toggleSort}
                  sortIndicatorFor={sortIndicatorFor}
                  answerFor={answerFor}
                  extractLatLon={extractLatLon}
                  rawValueForProjectField={rawValueForProjectField}
                  projectFieldMetaForObservation={projectFieldMetaForObservation}
                  ensureAdminFieldsLoadedForObservation={ensureAdminFieldsLoadedForObservation}
                  onOpenEmailLogs={openObservationEmailLogs}
                  onOpenSendEmail={openObservationEmailComposer}
                  saveProjectFieldValue={saveProjectFieldValue}
                  cellSaving={cellSaving}
                  cellSaveError={cellSaveError}
                  cellDrafts={cellDrafts}
                  setCellDrafts={setCellDrafts}
                  canManageProjectObservationField={canManageProjectObservationField}
                  onEditField={openProjectObservationFieldEditor}
                  onDeleteField={deleteProjectObservationField}
                  focusMode={focusMode}
                />
              </div>
            ) : null}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={60} minSize={20}>
          <div className="h-full bg-muted/20">
            {mapboxToken ? (
              <MapboxMap
                accessToken={mapboxToken}
                observations={mapObservations}
                selectedObservationId={selectedObservationId}
                onObservationSelect={setSelectedObservationId}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-6 text-sm text-muted-foreground">
                {t('shell.missingMapboxToken')}
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <BulkImportDialog
        open={bulkDialogOpen}
        bulkStep={bulkStep}
        setBulkStep={setBulkStep}
        bulkHasHeader={bulkHasHeader}
        setBulkHasHeader={setBulkHasHeader}
        bulkJoinCsvCol={bulkJoinCsvCol}
        setBulkJoinCsvCol={setBulkJoinCsvCol}
        bulkJoinOptions={bulkJoinOptions}
        bulkJoinTarget={bulkJoinTarget}
        setBulkJoinTarget={setBulkJoinTarget}
        bulkJoinValueForObservation={bulkJoinValueForObservation}
        bulkMappings={bulkMappings}
        setBulkMappings={setBulkMappings}
        bulkRawRows={bulkRawRows}
        bulkProgress={bulkProgress}
        bulkRunning={bulkRunning}
        bulkFinished={bulkFinished}
        bulkUnmatched={bulkUnmatched}
        bulkSendEmailUpdates={bulkSendEmailUpdates}
        setBulkSendEmailUpdates={setBulkSendEmailUpdates}
        bulkEmailSubject={bulkEmailSubject}
        setBulkEmailSubject={setBulkEmailSubject}
        bulkEmailIntro={bulkEmailIntro}
        setBulkEmailIntro={setBulkEmailIntro}
        projectObservationFields={projectObservationFields}
        observations={observations}
        normalizeObservations={normalizeObservations}
        onClose={() => setBulkDialogOpen(false)}
        runBulkImport={runBulkImport}
      />

      <ProjectObservationFieldModal
        open={isColumnModalOpen}
        editingProjectObservationFieldId={editingProjectObservationFieldId}
        projectObservationField={currentProjectObservationField}
        projectObservationFieldsCollectionPath={projectObservationFieldsCollectionPath}
        isSavingProjectObservationField={isSavingProjectObservationField}
        saveProjectObservationFieldError={saveProjectObservationFieldError}
        canManageProjectObservationField={canManageProjectObservationField}
        onClose={closeProjectObservationFieldModal}
        onSubmit={saveProjectObservationField}
      />

      <Dialog open={isRawJsonOpen} onOpenChange={setIsRawJsonOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('shell.rawJsonTitle')}</DialogTitle>
            <DialogDescription>
              {t('shell.rawJsonDesc')}
            </DialogDescription>
          </DialogHeader>
          <pre className="max-h-[70vh] overflow-auto rounded-md border bg-muted/30 p-4 text-xs">
            {JSON.stringify(observations, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>

      <ToastViewport>
        <Toast
          open={Boolean(toast)}
          title={toast?.title ?? ''}
          description={toast?.description}
          variant={toast?.variant}
          onClose={() => setToast(null)}
        />
      </ToastViewport>
    </div>
  )
}
