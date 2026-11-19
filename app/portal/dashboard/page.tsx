import type { Metadata } from 'next'
import DashboardHub from '../components/DashboardHub'
import { getDashboardPayload } from '@/lib/vaultCatalog'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Home | Extreme Team Vault',
}

export default async function DashboardPage() {
  const data = await getDashboardPayload()
  return <DashboardHub data={data} />
}
