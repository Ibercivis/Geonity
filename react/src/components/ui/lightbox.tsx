import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'



interface LightboxProps {
  images: string[]
  initialIndex?: number
  onClose: () => void
}

export function Lightbox({ images, initialIndex = 0, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex)

  const hasPrev = index > 0
  const hasNext = index < images.length - 1

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const next = useCallback(() => setIndex((i) => Math.min(images.length - 1, i + 1)), [images.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, prev, next])

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center">
      {/* Close */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-white border border-white/20"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Counter */}
      {images.length > 1 && (
        <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/70 text-sm tabular-nums bg-black/40 px-3 py-1 rounded-full pointer-events-none">
          {index + 1} / {images.length}
        </span>
      )}

      {/* Prev */}
      <Button
        variant="ghost"
        size="icon"
        disabled={!hasPrev}
        className="absolute left-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-white border border-white/20 disabled:opacity-30 disabled:pointer-events-none"
        onClick={prev}
      >
        <ChevronLeft className="h-7 w-7" />
      </Button>

      {/* Image */}
      <img
        src={images[index]}
        alt=""
        className="max-h-[88vh] max-w-[88vw] object-contain rounded-lg shadow-2xl select-none"
        draggable={false}
      />

      {/* Next */}
      <Button
        variant="ghost"
        size="icon"
        disabled={!hasNext}
        className="absolute right-4 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white hover:text-white border border-white/20 disabled:opacity-30 disabled:pointer-events-none"
        onClick={next}
      >
        <ChevronRight className="h-7 w-7" />
      </Button>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={cn(
                'h-12 w-12 rounded overflow-hidden border-2 transition-all',
                i === index ? 'border-white opacity-100' : 'border-white/30 opacity-50 hover:opacity-80'
              )}
            >
              <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  )
}
