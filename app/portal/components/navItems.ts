import {
  Archive,
  BookOpen,
  FileText,
  FolderCog,
  Headphones,
  Home,
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

export const HOME_NAV_ITEM: NavItem = {
  href: '/portal/dashboard',
  label: 'Home',
  description: 'Pick up where you left off.',
  icon: Home,
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
    href: '/portal/books',
    label: 'PDF Books',
    description: 'Team books and long-form guides to read online.',
    icon: BookOpen,
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
