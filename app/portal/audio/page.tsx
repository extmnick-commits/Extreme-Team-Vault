import type { Metadata } from 'next'
import { Headphones } from 'lucide-react'
import SectionPlaceholder from '../components/SectionPlaceholder'

export const metadata: Metadata = {
  title: 'Audio Trainings | Extreme Team Vault',
}

export default function AudioPage() {
  return (
    <SectionPlaceholder
      icon={Headphones}
      title="Audio Trainings"
      description="Listen to trainings on the go."
    />
  )
}
