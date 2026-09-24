import type { Metadata } from 'next'
import { FileText } from 'lucide-react'
import SectionPlaceholder from '../components/SectionPlaceholder'

export const metadata: Metadata = {
  title: 'PDF Documents | Extreme Team Vault',
}

export default function DocumentsPage() {
  return (
    <SectionPlaceholder
      icon={FileText}
      title="PDF Documents"
      description="Guides, scripts, and reference documents to download."
    />
  )
}
