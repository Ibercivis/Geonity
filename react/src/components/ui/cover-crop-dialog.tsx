import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

async function getCroppedImage(
  imageSrc: string,
  pixelCrop: Area,
  outW: number,
  outH: number,
  fileName: string,
): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')!

  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, outW, outH)

  return new Promise<File>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error('Canvas is empty')); return }
      resolve(new File([blob], fileName, { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  })
}

interface CoverCropDialogProps {
  src: string
  title?: string
  aspect?: number
  outputWidth?: number
  outputHeight?: number
  fileName?: string
  maxWidth?: string
  onConfirm: (file: File) => void
  onCancel: () => void
}

export function CoverCropDialog({
  src,
  title = 'Crop image',
  aspect = 600 / 400,
  outputWidth = 600,
  outputHeight = 400,
  fileName = 'image.jpg',
  maxWidth = 'sm:max-w-lg',
  onConfirm,
  onCancel,
}: CoverCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedArea) return
    const file = await getCroppedImage(src, croppedArea, outputWidth, outputHeight, fileName)
    onConfirm(file)
  }

  const previewH = Math.round((outputHeight / outputWidth) * 100)

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent className={maxWidth}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="relative w-full" style={{ paddingBottom: `${previewH}%` }}>
          <div className="absolute inset-0 rounded overflow-hidden bg-black">
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              classes={{ containerClassName: 'rounded' }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 px-1">
          <span className="text-xs text-muted-foreground w-10 shrink-0">Zoom</span>
          <input
            type="range" min={1} max={3} step={0.05} value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-muted-foreground w-10 text-right shrink-0">{zoom.toFixed(2)}×</span>
        </div>

        <p className="text-xs text-muted-foreground text-center -mt-1">
          Output: {outputWidth} × {outputHeight} px
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleConfirm}>Apply crop</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
