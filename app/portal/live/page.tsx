import type { Metadata } from 'next'
import { Radio } from 'lucide-react'
import SectionPlaceholder from '../components/SectionPlaceholder'

export const metadata: Metadata = {
  title: 'Live Trainings & Opp Night | Extreme Team Vault',
}

export default function LivePage() {
  return (
    <SectionPlaceholder
      icon={Radio}
      title="Live Trainings & Opp Night"
      description="Join upcoming live trainings and opportunity nights."
    />
  )
}
