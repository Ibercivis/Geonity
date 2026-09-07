import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCodeCanvas } from 'qrcode.react'
import { Copy, Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'

// Large QR for a project's anonymous-contribution link. Opened from the QR badge
// on the project detail page so admins can show it on screen or download it.

const EXPORT_PX = 1024

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string
  projectName: string
}

export function AnonymousQrDialog({ open, onOpenChange, token, projectName }: Props) {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const url = `${window.location.origin}/contribute/${token}`

  const copy = () => {
    navigator.clipboard.writeText(url)
    toast({ title: t('copied') })
  }

  const download = () => {
    const safe = projectName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `geonity-qr-${safe || 'project'}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(a.href)
    }, 'image/png')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('anonymousContribution')}</DialogTitle>
          <DialogDescription className="truncate">{projectName}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          <div className="rounded-xl border bg-white p-3">
            <QRCodeCanvas
              ref={canvasRef}
              value={url}
              size={EXPORT_PX}
              level="M"
              marginSize={2}
              style={{ width: 'min(70vw, 280px)', height: 'min(70vw, 280px)' }}
            />
          </div>
        </div>
        <p className="text-[11px] font-mono text-muted-foreground break-all text-center">{url}</p>
        <div className="grid grid-cols-3 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={copy}>
            <Copy className="h-3.5 w-3.5 mr-1" />{t('copyLink')}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={download}>
            <Download className="h-3.5 w-3.5 mr-1" />PNG
          </Button>
          <Button asChild type="button" variant="outline" size="sm">
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1" />{t('openLink')}
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
