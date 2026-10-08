'use client'

import { uploadAudioAlbumCover } from './actions'

export async function postAudioAlbumCoverFile(sectionId: string, file: File) {
  const formData = new FormData()
  formData.set('sectionId', sectionId)
  formData.set('cover', file)
  return uploadAudioAlbumCover(formData)
}

/** Warn when the image is far from square; does not block upload. */
export function albumArtworkAspectHint(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { naturalWidth: w, naturalHeight: h } = img
      if (w <= 0 || h <= 0) {
        resolve(undefined)
        return
      }
      const ratio = w / h
      if (ratio < 0.85 || ratio > 1.15) {
        resolve('For best results, use a square (1:1) image.')
      } else {
        resolve(undefined)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(undefined)
    }
    img.src = url
  })
}
