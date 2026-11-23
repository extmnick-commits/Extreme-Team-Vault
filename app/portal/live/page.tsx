import type { Metadata } from 'next'
import { Radio } from 'lucide-react'
import { readLiveRoomSettings } from '@/lib/liveRoomStore'
import PageHeader from '../components/PageHeader'
import ZoomLinkCard from '../components/ZoomLinkCard'

export const metadata: Metadata = {
  title: 'Live Trainings & Opp Night | Extreme Team Vault',
}

const TITLE = 'Live Trainings & Opp Night'
const DESCRIPTION = 'Copy the Zoom link to join live trainings and opportunity night.'

export default async function LivePage() {
  const settings = await readLiveRoomSettings()
  const zoomUrl = settings.zoomEmbedUrl.trim()

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <PageHeader icon={Radio} title={TITLE} description={DESCRIPTION} />
      <ZoomLinkCard zoomUrl={zoomUrl} />
    </div>
  )
}