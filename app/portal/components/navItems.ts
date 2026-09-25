import {
  Archive,
  FileText,
  FolderCog,
  Headphones,
  Radio,
  Video,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  description: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/portal/live',
    label: 'Live Trainings & Opp Night',
    description: 'Join upcoming live trainings and opportunity nights.',
    icon: Radio,
  },
  {
    href: '/portal/videos',
    label: 'Training Videos',
    description: 'On-demand video trainings for the team.',
    icon: Video,
  },
  {
    href: '/portal/audio',
    label: 'Audio Trainings',
    description: 'Listen to trainings on the go.',
    icon: Headphones,
  },
  {
    href: '/portal/documents',
    label: 'PDF Documents',
    description: 'Guides, scripts, and reference documents to download.',
    icon: FileText,
  },
  {
    href: '/portal/archive',
    label: 'Archived Streams',
    description: 'Replays of past live trainings and opportunity nights.',
    icon: Archive,
  },
]

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    href: '/portal/admin/files',
    label: 'Manage Files',
    description: 'Upload, organize, and edit documents, audio, and videos.',
    icon: FolderCog,
  },
]
