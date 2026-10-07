import { useTranslation } from 'react-i18next'

import adminLogoSrc from '@/assets/Geonity Admin Logo.png'

import { VersionLabel } from '@/components/VersionLabel'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
// PopoverHeader/Title/Description still used by notifications popover
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { LANGUAGES, LOCALE_MAP, setLanguage, type Language } from '@/i18n'
import type { ProjectInvitation, ProjectOptionItem } from '@/types/project'
import { Bell, Code2, Columns3, Crown, Download, Globe, Info, LogOut, Plus, RefreshCw, ShieldCheck, Upload, UserRound } from 'lucide-react'

function projectRoleIcon(role: ProjectOptionItem['role']) {
  if (role === 'creador') return <Crown className="h-4 w-4 text-amber-500" />
  if (role === 'administrador') return <ShieldCheck className="h-4 w-4 text-brand-300" />
  return null
}

type AppHeaderProps = {
  projectOptions: ProjectOptionItem[]
  selectedProjectId: string
  isLoadingProjects: boolean
  projectsError: string | null
  currentUserLabel: string
  currentUserEmail?: string
  pendingInvitations: ProjectInvitation[]
  pendingInvitationsError: string | null
  isLoadingPendingInvitations: boolean
  acceptingInvitationId: string | null
  rejectingInvitationId: string | null
  onProjectChange: (projectId: string) => void
  onAcceptInvitation: (invitationId: string) => void
  onRejectInvitation: (invitationId: string) => void
  onRefreshPendingInvitations: () => void
  onOpenProjectInfo: () => void
  onLogout: () => void
  // Observation actions
  observationCount: number
  hasObservations: boolean
  canImport: boolean
  canCreateColumn: boolean
  canOpenColumnCreator: boolean
  onExport: () => void
  onImportClick: () => void
  onOpenRawJson: () => void
  onOpenColumnCreator: () => void
  focusMode: boolean
  onToggleFocusMode: () => void
}

export function AppHeader({
  projectOptions,
  selectedProjectId,
  isLoadingProjects,
  projectsError,
  currentUserLabel,
  pendingInvitations,
  pendingInvitationsError,
  isLoadingPendingInvitations,
  acceptingInvitationId,
  rejectingInvitationId,
  onProjectChange,
  onAcceptInvitation,
  onRejectInvitation,
  onRefreshPendingInvitations,
  onOpenProjectInfo,
  onLogout,
  observationCount,
  hasObservations,
  canImport,
  canCreateColumn,
  canOpenColumnCreator,
  onExport,
  onImportClick,
  onOpenRawJson,
  onOpenColumnCreator,
  focusMode,
  onToggleFocusMode,
}: AppHeaderProps) {
  const { t, i18n } = useTranslation()

  const placeholderValue = '__none__'
  const placeholderLabel = isLoadingProjects ? t('header.projectLoading') : projectOptions.length === 0 ? t('header.noProjects') : t('header.selectProject')
  const selectItems = [
    { value: placeholderValue, label: placeholderLabel },
    ...projectOptions,
  ]
  const selectedProject = projectOptions.find((project) => project.value === selectedProjectId) ?? null

  return (
    <div className="flex-none bg-brand-900">
      <div className="flex items-center gap-3 px-4 py-2">

        {/* Logo */}
        <img src={adminLogoSrc} alt="Geonity" className="h-7 w-auto shrink-0" />

        <div className="h-5 w-px bg-white/20 shrink-0" />

        {/* Project selector */}
        <div className="flex items-center gap-2 min-w-0">
          <Select
            items={selectItems}
            value={selectedProjectId || placeholderValue}
            onValueChange={(value) => onProjectChange(!value || value === placeholderValue ? '' : value)}
            disabled={isLoadingProjects || projectOptions.length === 0}
          >
            <SelectTrigger id="project" className="w-48 border-white/20 bg-white/10 text-white hover:bg-white/15 focus:ring-white/30 [&_svg]:text-white/70">
              <SelectValue placeholder={placeholderLabel}>
                {selectedProject ? (
                  <span className="flex items-center gap-2">
                    {projectRoleIcon(selectedProject.role)}
                    <span className="truncate">{selectedProject.label}</span>
                  </span>
                ) : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" className="w-[var(--anchor-width)]">
              <SelectItem value={placeholderValue}>
                {placeholderLabel}
              </SelectItem>
              {projectOptions.map((project) => (
                <SelectItem key={project.value || project.label} value={project.value}>
                  {projectRoleIcon(project.role)}
                  <span>{project.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="button" variant="ghost" size="sm" className="shrink-0 px-2 text-white/70 hover:text-white hover:bg-white/10" onClick={onOpenProjectInfo} disabled={!selectedProjectId}>
            <Info className="h-4 w-4" />
          </Button>
        </div>

        {projectsError ? (
          <Alert variant="destructive" className="px-3 py-1 h-auto">
            <AlertDescription className="text-xs">{projectsError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="h-5 w-px bg-white/20 shrink-0" />

        {/* Center: obs count */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {selectedProjectId ? (
            <span className="text-sm text-white/80 shrink-0 tabular-nums">
              {t('header.obsCount', { count: observationCount })}
            </span>
          ) : null}
        </div>

        {/* Right: column creator + CSV + import + JSON + language + notifications + user */}
        <div className="flex items-center gap-2 shrink-0">
          {canCreateColumn ? (
            <Button variant="ghost" size="sm" className="gap-1.5 shrink-0 text-white/70 hover:text-white hover:bg-white/10" onClick={onOpenColumnCreator} disabled={!canOpenColumnCreator}>
              <Plus className="h-3.5 w-3.5" />
              {t('header.addColumn')}
            </Button>
          ) : null}

          {hasObservations ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className={focusMode
                      ? 'gap-1.5 text-white bg-white/15 hover:text-white hover:bg-white/20'
                      : 'gap-1.5 text-white/70 hover:text-white hover:bg-white/10'}
                    onClick={onToggleFocusMode}
                  />
                }>
                  <Columns3 className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>{focusMode ? t('header.showAllColumns') : t('header.focusAdminColumns')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}

          {hasObservations ? (
            <Button variant="ghost" size="sm" onClick={onExport} className="gap-1.5 text-white/70 hover:text-white hover:bg-white/10">
              <Download className="h-3.5 w-3.5" />
              {t('header.exportCSV')}
            </Button>
          ) : null}

          {canImport ? (
            <Button variant="ghost" size="sm" className="gap-1.5 text-white/70 hover:text-white hover:bg-white/10" onClick={onImportClick}>
              <Upload className="h-3.5 w-3.5" />
              {t('header.import')}
            </Button>
          ) : null}

          {hasObservations ? (
            <Button variant="ghost" size="sm" className="gap-1.5 text-white/70 hover:text-white hover:bg-white/10" onClick={onOpenRawJson}>
              <Code2 className="h-3.5 w-3.5" />
              {t('header.json')}
            </Button>
          ) : null}

          <div className="h-5 w-px bg-white/20" />

          {/* Language selector */}
          <div className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5 text-white/50 shrink-0" />
            <Select
              value={i18n.language}
              onValueChange={(value) => setLanguage(value as Language)}
            >
              <SelectTrigger className="h-8 w-[4.5rem] border-0 bg-transparent px-1 text-xs text-white/70 shadow-none hover:text-white focus:ring-0 [&_svg]:text-white/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {LOCALE_MAP[lang] ? t(`lang.${lang}`) : lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-5 w-px bg-white/20" />

          <Popover>
            <PopoverTrigger render={<Button type="button" variant="ghost" size="sm" className="relative gap-2 text-white/70 hover:text-white hover:bg-white/10" />}>
              <Bell className="h-4 w-4" />
              {pendingInvitations.length > 0 ? (
                <span className="absolute -top-1 -right-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white">
                  {pendingInvitations.length}
                </span>
              ) : null}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96">
              <PopoverHeader>
                <PopoverTitle>{t('header.notifications.title')}</PopoverTitle>
                <PopoverDescription>
                  {t('header.notifications.description')}
                </PopoverDescription>
              </PopoverHeader>

              <div className="flex justify-end">
                <Button type="button" variant="ghost" size="sm" className="h-7 gap-2 px-2" onClick={onRefreshPendingInvitations} disabled={isLoadingPendingInvitations}>
                  <RefreshCw className={isLoadingPendingInvitations ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
                  {t('header.notifications.reload')}
                </Button>
              </div>

              {pendingInvitationsError ? (
                <Alert variant="destructive">
                  <AlertDescription>{pendingInvitationsError}</AlertDescription>
                </Alert>
              ) : null}

              {pendingInvitations.length > 0 ? (
                <div className="space-y-2">
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="rounded-md border p-3">
                      <div className="text-sm font-medium">{invitation.projectName ?? t('header.notifications.projectFallback')}</div>
                      <div className="text-xs text-muted-foreground">{invitation.email}</div>
                      <div className="mt-2 flex justify-end">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7"
                            onClick={() => onRejectInvitation(invitation.id)}
                            disabled={rejectingInvitationId === invitation.id || acceptingInvitationId === invitation.id}
                          >
                            {rejectingInvitationId === invitation.id ? t('header.notifications.rejecting') : t('header.notifications.reject')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="h-7"
                            onClick={() => onAcceptInvitation(invitation.id)}
                            disabled={acceptingInvitationId === invitation.id || rejectingInvitationId === invitation.id}
                          >
                            {acceptingInvitationId === invitation.id ? t('header.notifications.accepting') : t('header.notifications.accept')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isLoadingPendingInvitations ? t('header.notifications.loading') : t('header.notifications.empty')}
                </p>
              )}
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger render={<Button type="button" variant="ghost" size="sm" className="gap-2 text-white/70 hover:text-white hover:bg-white/10" />}>
              <UserRound className="h-4 w-4" />
              <span className="max-w-[140px] truncate">{currentUserLabel || t('header.user.fallback')}</span>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48">
              <Button type="button" variant="outline" size="sm" className="w-full justify-start gap-2" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
                {t('header.user.logout')}
              </Button>
              <VersionLabel className="mt-2 block text-right text-[11px] tabular-nums text-muted-foreground" />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}
