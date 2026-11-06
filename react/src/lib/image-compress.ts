// Client-side image compression before upload.
//
// The API rejects request bodies over 8 MB (the whole POST, not per file), and
// an observation can carry several photos. Lowering JPEG quality alone can't
// guarantee a size, so we also downscale:
// - files up to TARGET_BYTES are sent untouched;
// - larger ones are scaled so the longest side is at most MAX_DIMENSION and
//   re-encoded as JPEG, lowering quality step by step until under TARGET_BYTES;
// - if that's still not enough, the dimensions are reduced further.
// If the browser can't decode the file (e.g. HEIC outside Safari) or encoding
// fails, the original is returned; the caller's total-size check is the backstop.

/** Max request body accepted by the API. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
/** Leave headroom below the API limit for the other fields and multipart overhead. */
export const SAFE_UPLOAD_BYTES = MAX_UPLOAD_BYTES - 512 * 1024

const TARGET_BYTES = 1024 * 1024 // 1 MB per photo
const MAX_DIMENSION = 2048
const MIN_DIMENSION = 1024
const QUALITIES = [0.85, 0.75, 0.65, 0.55]

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not decode image')) }
    img.src = url
  })
}

function encode(img: HTMLImageElement, maxSide: number, quality: number): Promise<Blob | null> {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  // JPEG has no alpha: paint white so transparent PNGs don't turn black.
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  // Modern browsers apply EXIF orientation when drawing an <img> to canvas.
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}

export async function compressImage(file: File): Promise<File> {
  if (file.size <= TARGET_BYTES) return file
  if (!file.type.startsWith('image/')) return file

  try {
    const img = await loadImage(file)
    let best: Blob | null = null

    for (let side = MAX_DIMENSION; side >= MIN_DIMENSION; side = Math.round(side * 0.75)) {
      for (const quality of QUALITIES) {
        const blob = await encode(img, side, quality)
        if (!blob) continue
        if (!best || blob.size < best.size) best = blob
        if (blob.size <= TARGET_BYTES) break
      }
      if (best && best.size <= TARGET_BYTES) break
    }

    if (!best || best.size >= file.size) return file
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([best], name, { type: 'image/jpeg', lastModified: file.lastModified })
  } catch {
    return file
  }
}

/** Rough size of a multipart body: file sizes plus text field lengths. */
export function estimateFormDataBytes(fd: FormData): number {
  let total = 0
  for (const [, value] of fd.entries()) {
    total += typeof value === 'string' ? new Blob([value]).size : value.size
  }
  return total
}
