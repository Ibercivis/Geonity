import { useTranslation } from 'react-i18next'

type ImagePreviewOverlayProps = {
  imagePreview: { url: string; top: number; left: number } | null
  imagePreviewLoading: boolean
  imagePreviewError: string | null
  onLoad: () => void
  onError: () => void
}

export function ImagePreviewOverlay({
  imagePreview,
  imagePreviewLoading,
  imagePreviewError,
  onLoad,
  onError,
}: ImagePreviewOverlayProps) {
  const { t } = useTranslation()

  if (!imagePreview) return null

  return (
    <div
      className="pointer-events-none fixed z-50 overflow-hidden rounded-md border bg-background"
      style={{ top: imagePreview.top, left: imagePreview.left, width: 360, height: 240 }}
    >
      {imagePreviewLoading ? (
        <div className="flex h-full w-full items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          {t('imagePreview.loading')}
        </div>
      ) : null}
      {imagePreviewError ? (
        <div className="flex h-full w-full items-center justify-center p-3 text-xs text-destructive">{imagePreviewError}</div>
      ) : null}
      <img
        src={imagePreview.url}
        alt={t('imagePreview.alt')}
        className={imagePreviewLoading ? 'hidden' : 'block h-full w-full object-contain'}
        onLoad={onLoad}
        onError={onError}
      />
    </div>
  )
}
