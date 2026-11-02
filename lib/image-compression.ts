"use client"

interface CompressOptions {
  /** Longest side in pixels after resizing */
  maxDimension?: number
  /** JPEG quality between 0 and 1 */
  quality?: number
  /** Files at or below this size (and within maxDimension) are left as-is */
  skipBelowBytes?: number
}

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("No se pudo leer la imagen"))
    }
    img.src = url
  })

/**
 * Resizes and re-encodes an image as JPEG in the browser.
 * Phone camera photos (often 3-10MB) usually end up around 200-600KB.
 * GIFs are returned untouched so animations are kept.
 */
export async function compressImage(
  file: File,
  { maxDimension = 1600, quality = 0.82, skipBelowBytes = 1024 * 1024 }: CompressOptions = {}
): Promise<File> {
  if (file.type === "image/gif") return file

  const img = await loadImage(file)
  const { naturalWidth: width, naturalHeight: height } = img
  const scale = Math.min(1, maxDimension / Math.max(width, height))

  if (scale === 1 && file.size <= skipBelowBytes && file.type !== "") {
    return file
  }

  const canvas = document.createElement("canvas")
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)

  const ctx = canvas.getContext("2d")
  if (!ctx) return file

  // White background so transparent PNGs don't turn black as JPEG
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  )
  if (!blob || blob.size >= file.size) return file

  const baseName = file.name.replace(/\.[^.]+$/, "") || "foto"
  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  })
}
