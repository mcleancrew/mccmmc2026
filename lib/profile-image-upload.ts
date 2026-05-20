import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { storage } from "@/lib/firebase"

const MAX_DIMENSION = 512
const JPEG_QUALITY = 0.82

export function isImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true
  return /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.name)
}

async function loadImageSource(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file)
    } catch {
      // Fall through — some iOS HEIC picks need the Image() path
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Could not load image. Try a JPEG or PNG photo."))
    }
    img.src = url
  })
}

function getSourceSize(source: ImageBitmap | HTMLImageElement): { width: number; height: number } {
  if (source instanceof ImageBitmap) {
    return { width: source.width, height: source.height }
  }
  return { width: source.naturalWidth, height: source.naturalHeight }
}

/** Resize and compress for Firestore-friendly storage (JPEG blob). */
export async function prepareProfileImageBlob(file: File): Promise<Blob> {
  const source = await loadImageSource(file)
  const { width, height } = getSourceSize(source)

  if (!width || !height) {
    if (source instanceof ImageBitmap) source.close()
    throw new Error("Invalid image dimensions")
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height))
  const targetWidth = Math.max(1, Math.round(width * scale))
  const targetHeight = Math.max(1, Math.round(height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    if (source instanceof ImageBitmap) source.close()
    throw new Error("Could not process image")
  }

  ctx.drawImage(source, 0, 0, targetWidth, targetHeight)
  if (source instanceof ImageBitmap) source.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  })

  if (!blob) {
    throw new Error("Failed to compress image")
  }

  return blob
}

export async function uploadProfileImage(userId: string, file: File): Promise<string> {
  const blob = await prepareProfileImageBlob(file)
  const storageRef = ref(storage, `profile_images/${userId}.jpg`)
  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" })
  return getDownloadURL(storageRef)
}

/** Local preview only — does not upload. */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error("Could not read image file"))
    reader.readAsDataURL(file)
  })
}
