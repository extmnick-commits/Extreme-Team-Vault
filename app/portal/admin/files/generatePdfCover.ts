'use client'

const MAX_COVER_WIDTH = 1200

let workerReady: Promise<void> | null = null

async function ensurePdfWorker() {
  if (!workerReady) {
    workerReady = (async () => {
      const pdfjs = await import('pdfjs-dist')
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
    })()
  }
  await workerReady
}

export async function renderPdfCover(source: File | ArrayBuffer): Promise<Blob> {
  await ensurePdfWorker()
  const pdfjs = await import('pdfjs-dist')

  const data = source instanceof File ? await source.arrayBuffer() : source.slice(0)
  const loadingTask = pdfjs.getDocument({ data })
  const pdf = await loadingTask.promise

  try {
    const page = await pdf.getPage(1)
    const baseViewport = page.getViewport({ scale: 1 })
    const scale = Math.min(2, MAX_COVER_WIDTH / baseViewport.width)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not render preview.')

    await page.render({ canvasContext: context, viewport, canvas }).promise

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) =>
          result ? resolve(result) : reject(new Error('Could not create cover image.')),
        'image/webp',
        0.85,
      )
    })
    return blob
  } finally {
    await loadingTask.destroy()
  }
}

export function pdfCoverErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (/password/i.test(error.message)) return 'PDF is password-protected.'
    return error.message
  }
  return 'Could not generate preview from PDF.'
}
