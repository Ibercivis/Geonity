import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, Download, MoreHorizontal, UserPlus } from 'lucide-react'
import { projectsApi } from '@/api/projects'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub,
  DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ProjectStatsViewLazy } from '@/pages/StatsPagesLazy'
import { toast } from '@/hooks/use-toast'
import { resolveLocalized } from '@/lib/utils'
import { useTranslationLang } from '@/hooks/use-translation-lang'
import type { ManageProject } from '@/api/manage'
import { InviteAdminDialog } from './InviteAdminDialog'

const FORMATS = ['csv', 'xlsx', 'ods'] as const

export function ProjectActionsMenu({ project }: { project: ManageProject }) {
  const { t } = useTranslation()
  const lang = useTranslationLang()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)

  const hasData = !project.draft && project.observations > 0

  const download = async (format: (typeof FORMATS)[number]) => {
    try {
      const blob = await projectsApi.downloadObservations(project.id, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `project-${project.id}-observations.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      toast({
        title: t('error'),
        description: status === 404 || status === 400
          ? t('downloadFormatUnsupported', { format: format.toUpperCase() })
          : t('downloadFailed'),
        variant: 'destructive',
      })
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label={t('manageMoreActions')} className="h-10 w-10 shrink-0">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={!hasData}>
              <Download className="mr-2 h-4 w-4" />
              {t('manageDownloadData')}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {FORMATS.map((f) => (
                <DropdownMenuItem key={f} onSelect={() => download(f)}>{f.toUpperCase()}</DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {!project.draft && (
            <DropdownMenuItem onSelect={() => setStatsOpen(true)}>
              <BarChart3 className="mr-2 h-4 w-4" />
              {t('stats')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => setInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t('inviteAdmin')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <InviteAdminDialog
        projectId={project.id}
        projectName={resolveLocalized(project.name, lang)}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />

      {/* Mounted only while open, so the stats chunk and request load on demand. */}
      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">{t('stats')}</DialogTitle>
          <DialogDescription className="sr-only">{resolveLocalized(project.name, lang)}</DialogDescription>
          {statsOpen && <ProjectStatsViewLazy projectId={project.id} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
