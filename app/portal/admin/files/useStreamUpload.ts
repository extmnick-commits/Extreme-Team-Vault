'use client'

import { useCallback } from 'react'
import * as tus from 'tus-js-client'
import type { VideoCategory } from '@/lib/videoTypes'
import { contentTypeForVideo } from '@/lib/videoTypes'
import { createStreamUpload, deleteVideo, refreshVideos } from './videoActions'

const TUS_ENDPOINT = 'https://video.bunnycdn.com/tusupload'

/**
 * Creates a Stream video on the server, then uploads the file from the browser
 * with TUS so large training videos never pass through Vercel.
 */
export function useStreamUpload() {
  return useCallback(
    async (
      file: File,
      options: { title: string; category: VideoCategory },
      onProgress?: (percentage: number) => void,
    ): Promise<void> => {
      const created = await createStreamUpload({
        title: options.title,
        category: options.category,
      })
      if (!created.ok) throw new Error(created.error)

      try {
        await new Promise<void>((resolve, reject) => {
          const upload = new tus.Upload(file, {
            endpoint: TUS_ENDPOINT,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            headers: {
              AuthorizationSignature: created.signature,
              AuthorizationExpire: String(created.expire),
              VideoId: created.videoId,
              LibraryId: created.libraryId,
            },
            metadata: {
              filename: file.name,
              filetype: contentTypeForVideo(file),
              title: options.title,
            },
            onError: (error) => reject(error),
            onProgress: (sent, total) => {
              if (total > 0) onProgress?.((sent / total) * 100)
            },
            onSuccess: () => resolve(),
          })
          upload.start()
        })
        await refreshVideos()
      } catch (error) {
        await deleteVideo(created.videoId).catch(() => undefined)
        throw error
      }
    },
    [],
  )
}
