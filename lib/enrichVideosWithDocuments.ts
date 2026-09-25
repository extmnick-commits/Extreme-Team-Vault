import 'server-only'
import { getLibrary } from './bunnyStorage'
import {
  attachmentsForVideo,
  buildDocumentLookup,
  readVideoResources,
  resolveLinkedDocuments,
  type DocumentLookup,
} from './videoResources'
import type { TrainingVideoSection, VideoItem } from './videoTypes'

type VideoResourcesStore = Awaited<ReturnType<typeof readVideoResources>>

function enrichVideo(
  video: VideoItem,
  store: VideoResourcesStore,
  lookup: DocumentLookup,
): VideoItem {
  const entries = attachmentsForVideo(store, video.bunnyVideoId)
  const linkedDocuments = resolveLinkedDocuments(entries, lookup)
  if (linkedDocuments.length === 0) return video
  return { ...video, linkedDocuments }
}

export async function enrichVideoList(videos: VideoItem[]): Promise<VideoItem[]> {
  if (videos.length === 0) return videos

  const [documents, resources] = await Promise.all([
    getLibrary('documents'),
    readVideoResources(),
  ])
  const lookup = buildDocumentLookup(documents)

  return videos.map((video) => enrichVideo(video, resources, lookup))
}

export async function enrichTrainingVideoSections(
  sections: TrainingVideoSection[],
): Promise<TrainingVideoSection[]> {
  const videoCount = sections.reduce((total, section) => total + section.videos.length, 0)
  if (videoCount === 0) return sections

  const [documents, resources] = await Promise.all([
    getLibrary('documents'),
    readVideoResources(),
  ])
  const lookup = buildDocumentLookup(documents)

  return sections.map((section) => ({
    ...section,
    videos: section.videos.map((video) => enrichVideo(video, resources, lookup)),
  }))
}
