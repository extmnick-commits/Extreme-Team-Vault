import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Activity } from 'lucide-react'
import { isAdmin } from '@/app/lib/session'
import { buildAdminActivityReport } from '@/lib/adminMemberActivity'
import PageHeader from '../../components/PageHeader'
import ActivityAdminPanel from './ActivityAdminPanel'

export const metadata: Metadata = {
  title: 'Member Activity | Extreme Team Vault',
}

export const dynamic = 'force-dynamic'

export default async function AdminActivityPage() {
  if (!(await isAdmin())) redirect('/portal')

  const report = await buildAdminActivityReport()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        icon={Activity}
        title="Member activity"
        description="Who is in the vault right now and what they are watching, listening to, or reading."
      />
      <ActivityAdminPanel initial={report} />
    </div>
  )
}