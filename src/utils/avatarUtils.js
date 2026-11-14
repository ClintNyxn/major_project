export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

export function validateAvatarFile(file) {
  if (!file) {
    return { valid: false, error: 'Please choose an image file to upload.' }
  }

  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Please select a valid JPG, PNG, or WebP image.',
    }
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
    return {
      valid: false,
      error: `File size (${sizeMb} MB) exceeds the 2 MB limit. Please select a smaller image.`,
    }
  }

  return { valid: true, error: null }
}

export function cropAndResizeImage(file, targetSize = 256, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      try {
        const canvas = document.createElement('canvas')
        canvas.width = targetSize
        canvas.height = targetSize

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context could not be created.'))
          return
        }

        // Center-crop calculation: extract square from center of image
        const naturalWidth = img.naturalWidth || img.width
        const naturalHeight = img.naturalHeight || img.height
        const minDim = Math.min(naturalWidth, naturalHeight)
        const srcX = (naturalWidth - minDim) / 2
        const srcY = (naturalHeight - minDim) / 2

        ctx.drawImage(
          img,
          srcX,
          srcY,
          minDim,
          minDim,
          0,
          0,
          targetSize,
          targetSize
        )

        // Try WebP first; fallback to JPEG if unsupported
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const dataUrl = canvas.toDataURL('image/webp', quality)
              resolve({ blob, dataUrl, mimeType: 'image/webp' })
            } else {
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) {
                    const dataUrl = canvas.toDataURL('image/jpeg', quality)
                    resolve({ blob: jpegBlob, dataUrl, mimeType: 'image/jpeg' })
                  } else {
                    reject(new Error('Could not convert cropped image to blob.'))
                  }
                },
                'image/jpeg',
                quality
              )
            }
          },
          'image/webp',
          quality
        )
      } catch (err) {
        reject(err)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to read the selected image file.'))
    }

    img.src = objectUrl
  })
}

export function formatAvatarError(error) {
  if (!error) return 'An unexpected error occurred while updating the profile picture.'
  const message = error.message || String(error)
  const lower = message.toLowerCase()

  if (lower.includes('bucket') || lower.includes('not found')) {
    return 'The "avatars" storage bucket was not found in Supabase. Please run migration 002_avatars.sql in the Supabase SQL Editor.'
  }
  if (lower.includes('policy') || lower.includes('row-level security') || lower.includes('violates row-level') || lower.includes('permission denied')) {
    return 'Permission denied: Please ensure storage policies from migration 002_avatars.sql are applied to the "avatars" bucket.'
  }
  if (lower.includes('network') || lower.includes('failed to fetch') || lower.includes('offline')) {
    return 'Network connection error. Please check your internet connection and try again.'
  }

  return message
}

