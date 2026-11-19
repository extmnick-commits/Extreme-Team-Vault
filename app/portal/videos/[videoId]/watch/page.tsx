import { notFound } from 'next/navigation'
import { enrichVideoList } from '@/lib/enrichVideosWithDocuments'
import { getTrainingLibraryVideoSections, getVideos } from '@/lib/bunnyStream'
import PortalDeviceWatch from '../../../components/PortalDeviceWatch'

type WatchPageProps = {
  params: Promise<{ videoId: string }>
  searchParams: Promise<{ from?: string }>
}

async function findPortalVideo(videoId: string) {
  const decoded = decodeURIComponent(videoId)
  const training = await getTrainingLibraryVideoSections()
  let video =
    training.flatMap((section) => section.videos).find(
      (item) => item.bunnyVideoId === decoded || item.id === decoded,
    ) ?? null

  if (!video) {
    const archive = await getVideos('archive')
    video =
      archive.find((item) => item.bunnyVideoId === decoded || item.id === decoded) ?? null
  }

  if (!video) return null
  const [enriched] = await enrichVideoList([video])
  return enriched ?? video
}

export default async function VideoWatchPage({ params, searchParams }: WatchPageProps) {
  const { videoId } = await params
  const { from } = await searchParams
  const video = await findPortalVideo(videoId)
  if (!video) notFound()

  const backHref = from === 'archive' ? '/portal/archive' : '/portal/videos'

  return <PortalDeviceWatch video={video} backHref={backHref} />
}
