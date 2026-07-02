import { readFileAsDataUrl } from './utils'
import { logger } from './logger'

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.85

/**
 * Downscale and re-encode an image before embedding it as a base64 data URL.
 * This keeps localStorage small — a full-resolution photo can be 3–5 MB, which
 * would otherwise blow the browser's storage quota when inlined.
 * Falls back to the original data URL if anything goes wrong.
 */
export async function compressImage(file: File): Promise<string> {
  // GIFs (often animated) and SVGs are passed through untouched.
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return readFileAsDataUrl(file)
  }

  try {
    const dataUrl = await readFileAsDataUrl(file)
    const image = await loadImage(dataUrl)

    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height))
    // Small images that don't need scaling are returned as-is.
    if (scale === 1 && file.size < 400_000) return dataUrl

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.width * scale)
    canvas.height = Math.round(image.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return dataUrl
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    // Preserve transparency for PNGs, otherwise use JPEG for much smaller files.
    const useJpeg = file.type !== 'image/png'
    return canvas.toDataURL(useJpeg ? 'image/jpeg' : 'image/png', useJpeg ? JPEG_QUALITY : undefined)
  } catch (error) {
    logger.warn('Image compression failed; embedding original', error)
    return readFileAsDataUrl(file)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not decode image'))
    img.src = src
  })
}
