export type VideoCategory = 'training' | 'archive'

export type VideoItem = {
  id: string
  title: string
  description: string
  bunnyVideoId: string
  libraryId: string
  duration: string
  category: VideoCategory
  thumbnailUrl?: string
}

export type AudioItem = {
  id: string
  title: string
  description: string
  duration: string
  cdnUrl: string
}

export type DocumentFileType = 'PDF' | 'DOCX' | 'XLSX'

export type DocumentItem = {
  id: string
  title: string
  description: string
  fileType: DocumentFileType
  fileSize: string
  cdnUrl: string
}

const LIBRARY_ID = '123456'
const THUMBNAIL_HOST = 'https://vz-a1b2c3d4-e5f.b-cdn.net'
const FILE_CDN = 'https://extreme-team-vault.b-cdn.net'

const thumbnail = (bunnyVideoId: string) =>
  `${THUMBNAIL_HOST}/${bunnyVideoId}/thumbnail.jpg`

export const videos: VideoItem[] = [
  {
    id: 'vid-001',
    title: 'Getting Started: Your First 7 Days',
    description: 'Set up your back office, define your why, and book your first conversations.',
    bunnyVideoId: '6f1c2a3e-1b4d-4c8e-9a0f-1d2e3f4a5b01',
    libraryId: LIBRARY_ID,
    duration: '18:42',
    category: 'training',
    thumbnailUrl: thumbnail('6f1c2a3e-1b4d-4c8e-9a0f-1d2e3f4a5b01'),
  },
  {
    id: 'vid-002',
    title: 'Building Your Contact List',
    description: 'A simple framework for listing, sorting, and prioritizing your warm market.',
    bunnyVideoId: '6f1c2a3e-1b4d-4c8e-9a0f-1d2e3f4a5b02',
    libraryId: LIBRARY_ID,
    duration: '24:10',
    category: 'training',
    thumbnailUrl: thumbnail('6f1c2a3e-1b4d-4c8e-9a0f-1d2e3f4a5b02'),
  },
  {
    id: 'vid-003',
    title: 'The Invitation Script',
    description: 'Word-for-word invites that feel natural and get people to show up.',
    bunnyVideoId: '6f1c2a3e-1b4d-4c8e-9a0f-1d2e3f4a5b03',
    libraryId: LIBRARY_ID,
    duration: '15:05',
    category: 'training',
    thumbnailUrl: thumbnail('6f1c2a3e-1b4d-4c8e-9a0f-1d2e3f4a5b03'),
  },
  {
    id: 'vid-004',
    title: 'Handling Objections with Confidence',
    description: 'The most common objections and how to respond without being pushy.',
    bunnyVideoId: '6f1c2a3e-1b4d-4c8e-9a0f-1d2e3f4a5b04',
    libraryId: LIBRARY_ID,
    duration: '32:48',
    category: 'training',
    thumbnailUrl: thumbnail('6f1c2a3e-1b4d-4c8e-9a0f-1d2e3f4a5b04'),
  },
  {
    id: 'vid-005',
    title: 'Three-Way Calls That Close',
    description: 'How to edify your upline and hand off a prospect the right way.',
    bunnyVideoId: '6f1c2a3e-1b4d-4c8e-9a0f-1d2e3f4a5b05',
    libraryId: LIBRARY_ID,
    duration: '21:37',
    category: 'training',
    thumbnailUrl: thumbnail('6f1c2a3e-1b4d-4c8e-9a0f-1d2e3f4a5b05'),
  },
  {
    id: 'vid-006',
    title: 'Social Media Prospecting',
    description: 'Content habits and DM approaches that start real conversations online.',
    bunnyVideoId: '6f1c2a3e-1b4d-4c8e-9a0f-1d2e3f4a5b06',
    libraryId: LIBRARY_ID,
    duration: '27:59',
    category: 'training',
  },
  {
    id: 'vid-101',
    title: 'Opportunity Night — August 2026',
    description: 'Full replay of the August opportunity night with leadership panel Q&A.',
    bunnyVideoId: '6f1c2a3e-1b4d-4c8e-9a0f-1d2e3f4a5c01',
    libraryId: LIBRARY_ID,
    duration: '1:12:30',
    category: 'archive',
    thumbnailUrl: thumbnail('6f1c2a3e-1b4d-4c8e-9a0f-1d2e3f4a5c01'),
  },
  {
    id: 'vid-102',
    title: 'Live Training: Goal Setting for Q4',
    description: 'Planning your fourth quarter: targets, daily method of operation, and tracking.',
    bunnyVideoId: '6f1c2a3e-1b4d-4c8e-9a0f-1d2e3f4a5c02',
    libraryId: LIBRARY_ID,
    duration: '58:14',
    category: 'archive',
    thumbnailUrl: thumbnail('6f1c2a3e-1b4d-4c8e-9a0f-1d2e3f4a5c02'),
  },
  {
    id: 'vid-103',
    title: 'Opportunity Night — July 2026',
    description: 'Replay of the July opportunity night featuring new rank advancements.',
    bunnyVideoId: '6f1c2a3e-1b4d-4c8e-9a0f-1d2e3f4a5c03',
    libraryId: LIBRARY_ID,
    duration: '1:05:47',
    category: 'archive',
    thumbnailUrl: thumbnail('6f1c2a3e-1b4d-4c8e-9a0f-1d2e3f4a5c03'),
  },
  {
    id: 'vid-104',
    title: 'Live Training: Leadership Fundamentals',
    description: 'Duplicating yourself and supporting new builders on your team.',
    bunnyVideoId: '6f1c2a3e-1b4d-4c8e-9a0f-1d2e3f4a5c04',
    libraryId: LIBRARY_ID,
    duration: '49:22',
    category: 'archive',
  },
]

export const audio: AudioItem[] = [
  {
    id: 'aud-001',
    title: 'Morning Mindset',
    description: 'A short daily listen to start the day focused and intentional.',
    duration: '12:30',
    cdnUrl: `${FILE_CDN}/audio/morning-mindset.mp3`,
  },
  {
    id: 'aud-002',
    title: 'The Power of Consistency',
    description: 'Why small daily actions compound into big results over time.',
    duration: '28:15',
    cdnUrl: `${FILE_CDN}/audio/power-of-consistency.mp3`,
  },
  {
    id: 'aud-003',
    title: 'Prospecting on the Go',
    description: 'Practical tips for starting conversations wherever you are.',
    duration: '19:48',
    cdnUrl: `${FILE_CDN}/audio/prospecting-on-the-go.mp3`,
  },
  {
    id: 'aud-004',
    title: 'Leadership Roundtable',
    description: 'Top leaders share lessons from building large, lasting teams.',
    duration: '45:02',
    cdnUrl: `${FILE_CDN}/audio/leadership-roundtable.mp3`,
  },
  {
    id: 'aud-005',
    title: 'Follow-Up Fundamentals',
    description: 'How to follow up without chasing, and when to move on.',
    duration: '22:36',
    cdnUrl: `${FILE_CDN}/audio/follow-up-fundamentals.mp3`,
  },
]

export const documents: DocumentItem[] = [
  {
    id: 'doc-001',
    title: 'New Member Quick Start Guide',
    description: 'Everything you need to set up and take action in your first week.',
    fileType: 'PDF',
    fileSize: '2.4 MB',
    cdnUrl: `${FILE_CDN}/docs/quick-start-guide.pdf`,
  },
  {
    id: 'doc-002',
    title: 'Invitation & Follow-Up Scripts',
    description: 'Proven scripts for texts, calls, and DMs.',
    fileType: 'PDF',
    fileSize: '860 KB',
    cdnUrl: `${FILE_CDN}/docs/invitation-scripts.pdf`,
  },
  {
    id: 'doc-003',
    title: 'Compensation Plan Overview',
    description: 'A plain-language breakdown of ranks, bonuses, and qualifications.',
    fileType: 'PDF',
    fileSize: '3.1 MB',
    cdnUrl: `${FILE_CDN}/docs/compensation-plan.pdf`,
  },
  {
    id: 'doc-004',
    title: 'Product Reference Sheet',
    description: 'Key product details and talking points for customer conversations.',
    fileType: 'PDF',
    fileSize: '1.2 MB',
    cdnUrl: `${FILE_CDN}/docs/product-reference.pdf`,
  },
  {
    id: 'doc-005',
    title: '90-Day Action Plan Worksheet',
    description: 'Map out your goals and daily activities for the next three months.',
    fileType: 'PDF',
    fileSize: '540 KB',
    cdnUrl: `${FILE_CDN}/docs/90-day-action-plan.pdf`,
  },
]
