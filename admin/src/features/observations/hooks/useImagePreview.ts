import * as React from 'react'

export function useImagePreview() {
  const [imagePreview, setImagePreview] = React.useState<null | { url: string; top: number; left: number }>(null)
  const [imagePreviewLoading, setImagePreviewLoading] = React.useState(false)
  const [imagePreviewError, setImagePreviewError] = React.useState<string | null>(null)

  const showImagePreview = React.useCallback((url: string, anchor: HTMLElement) => {
    const rect = anchor.getBoundingClientRect()
    const width = 360
    const height = 240
    const pad = 12
    const left = Math.max(pad, Math.min(rect.left, window.innerWidth - width - pad))
    const top = Math.max(pad, Math.min(rect.top - height - 10, window.innerHeight - height - pad))

    setImagePreview({ url, top, left })
    setImagePreviewLoading(true)
    setImagePreviewError(null)
  }, [])

  const hideImagePreview = React.useCallback(() => {
    setImagePreview(null)
    setImagePreviewLoading(false)
    setImagePreviewError(null)
  }, [])

  const handlePreviewLoad = React.useCallback(() => {
    setImagePreviewLoading(false)
  }, [])

  const handlePreviewError = React.useCallback(() => {
    setImagePreviewLoading(false)
    setImagePreviewError('No se pudo cargar la imagen')
  }, [])

  return {
    imagePreview,
    imagePreviewLoading,
    imagePreviewError,
    showImagePreview,
    hideImagePreview,
    handlePreviewLoad,
    handlePreviewError,
  }
}
