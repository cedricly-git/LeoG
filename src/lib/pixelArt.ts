export const IMPORTED_PIXEL_ART_CATEGORIES = new Set([
  'Pig',
  'Horse',
  'Bovine',
])

function colorDistance(a: Uint8ClampedArray | number[], b: Uint8ClampedArray | number[]) {
  const dr = Number(a[0]) - Number(b[0])
  const dg = Number(a[1]) - Number(b[1])
  const db = Number(a[2]) - Number(b[2])
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function getCornerSamples(data: Uint8ClampedArray, width: number, height: number) {
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ]

  const samples: number[][] = []
  for (const [x, y] of corners) {
    const idx = (y * width + x) * 4
    samples.push([data[idx], data[idx + 1], data[idx + 2], data[idx + 3]])
  }

  return samples
}

function buildProcessedCanvas(img: HTMLImageElement) {
  const source = document.createElement('canvas')
  source.width = img.naturalWidth
  source.height = img.naturalHeight
  const sourceCtx = source.getContext('2d', { willReadFrequently: true })
  if (!sourceCtx) return null

  sourceCtx.drawImage(img, 0, 0)
  const frame = sourceCtx.getImageData(0, 0, source.width, source.height)
  const { data, width, height } = frame
  const corners = getCornerSamples(data, width, height)
  const tolerance = 30

  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      if (data[idx + 3] === 0) continue

      const pixel = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]]
      const isBackground = corners.some(corner => colorDistance(pixel, corner) <= tolerance)
      if (isBackground) {
        data[idx + 3] = 0
        continue
      }

      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }

  sourceCtx.putImageData(frame, 0, 0)

  if (maxX < minX || maxY < minY) return source

  const cropped = document.createElement('canvas')
  cropped.width = maxX - minX + 1
  cropped.height = maxY - minY + 1
  const croppedCtx = cropped.getContext('2d')
  if (!croppedCtx) return source
  croppedCtx.imageSmoothingEnabled = false
  croppedCtx.drawImage(
    source,
    minX,
    minY,
    cropped.width,
    cropped.height,
    0,
    0,
    cropped.width,
    cropped.height,
  )

  return cropped
}

const rawImageCache = new Map<string, HTMLImageElement>()
const processedImageCache = new Map<string, HTMLCanvasElement>()

function getRawImage(url: string) {
  const cached = rawImageCache.get(url)
  if (cached) return cached

  const img = new Image()
  img.src = url
  img.onload = () => {
    const processed = buildProcessedCanvas(img)
    if (processed) processedImageCache.set(url, processed)
  }
  rawImageCache.set(url, img)
  return img
}

export function preloadPixelArt(url: string) {
  const img = getRawImage(url)
  if (img.complete && img.naturalWidth > 0 && !processedImageCache.has(url)) {
    const processed = buildProcessedCanvas(img)
    if (processed) processedImageCache.set(url, processed)
  }
}

export function getPixelArtDrawable(url: string) {
  preloadPixelArt(url)
  return processedImageCache.get(url) ?? rawImageCache.get(url)
}

export function shouldUseImportedPixelArt(category: string) {
  return IMPORTED_PIXEL_ART_CATEGORIES.has(category)
}
