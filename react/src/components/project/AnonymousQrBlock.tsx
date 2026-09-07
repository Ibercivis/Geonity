import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import { Copy, Download, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { projectsApi } from '@/api/projects'
import { toast } from '@/hooks/use-toast'

// Shown under the "Anonymous contribution" switch in the project settings once
// the project exists (the token comes from the server). Renders the QR for the
// public /contribute/<token> URL, lets admins download it for posters, add an
// optional poster label (?src=) and rotate the token.

const QR_DISPLAY_PX = 176
const QR_EXPORT_PX = 1024

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

interface Props {
  projectId: number
  projectName: string
  token: string | null | undefined
}

export function AnonymousQrBlock({ projectId, projectName, token }: Props) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [label, setLabel] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const svgHostRef = useRef<HTMLDivElement>(null)

  const regenerate = useMutation({
    mutationFn: () => projectsApi.regenerateAnonymousToken(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] })
      qc.invalidateQueries({ queryKey: ['project-raw', projectId] })
      toast({ title: t('linkRegenerated') })
      setConfirmOpen(false)
    },
  })

  if (!token) {
    return (
      <p className="pl-[calc(2.5rem+1rem)] text-xs text-muted-foreground">{t('saveToGetQr')}</p>
    )
  }

  const slug = slugify(label)
  const url = `${window.location.origin}/contribute/${token}${slug ? `?src=${encodeURIComponent(slug)}` : ''}`
  const fileBase = `geonity-qr-${slugify(projectName) || projectId}${slug ? `-${slug}` : ''}`

  const copyUrl = () => {
    navigator.clipboard.writeText(url)
    toast({ title: t('copied') })
  }

  const downloadPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => { if (blob) downloadBlob(blob, `${fileBase}.png`) }, 'image/png')
  }

  const downloadSvg = () => {
    const svg = svgHostRef.current?.querySelector('svg')
    if (!svg) return
    const xml = new XMLSerializer().serializeToString(svg)
    downloadBlob(new Blob([xml], { type: 'image/svg+xml' }), `${fileBase}.svg`)
  }

  return (
    <div className="pl-[calc(2.5rem+1rem)] space-y-3">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Displayed QR. Backing store is 1024px so the PNG export is print-quality. */}
        <div className="shrink-0 rounded-lg border bg-white p-2 self-start">
          <QRCodeCanvas
            ref={canvasRef}
            value={url}
            size={QR_EXPORT_PX}
            level="M"
            marginSize={2}
            style={{ width: QR_DISPLAY_PX, height: QR_DISPLAY_PX }}
          />
          {/* Hidden SVG twin used for the vector download */}
          <div ref={svgHostRef} className="hidden" aria-hidden>
            <QRCodeSVG value={url} size={QR_EXPORT_PX} level="M" marginSize={2} />
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t('qrLinkUrl')}</Label>
            <div className="flex gap-1.5">
              <Input readOnly value={url} className="text-xs font-mono h-8" onFocus={(e) => e.currentTarget.select()} />
              <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" title={t('copyLink')} onClick={copyUrl}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button asChild type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" title={t('openLink')}>
                <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="qr-poster-label" className="text-xs text-muted-foreground">{t('posterLabel')}</Label>
            <Input
              id="qr-poster-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('posterLabelPlaceholder')}
              className="h-8 text-sm"
              maxLength={40}
            />
            <p className="text-[11px] text-muted-foreground">{t('posterLabelHint')}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={downloadPng}>
              <Download className="h-3.5 w-3.5 mr-1" />{t('downloadPng')}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={downloadSvg}>
              <Download className="h-3.5 w-3.5 mr-1" />{t('downloadSvg')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />{t('regenerateLink')}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('regenerateLinkTitle')}</DialogTitle>
            <DialogDescription>{t('regenerateLinkDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>{t('cancel')}</Button>
            <Button type="button" variant="destructive" disabled={regenerate.isPending} onClick={() => regenerate.mutate()}>
              {regenerate.isPending ? t('loading') : t('regenerateLinkConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
