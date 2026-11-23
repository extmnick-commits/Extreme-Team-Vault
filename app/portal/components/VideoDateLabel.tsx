import { Calendar } from 'lucide-react'
import { formatVideoDisplayDate } from '@/lib/bunnyDates'

export default function VideoDateLabel({
  dateUploaded,
  displayDate,
  className = 'text-xs text-ink-subtle tabular-nums',
  showIcon = false,
}: {
  dateUploaded?: string
  displayDate?: string
  className?: string
  showIcon?: boolean
}) {
  const label = displayDate ?? formatVideoDisplayDate(dateUploaded)
  if (!label) return null
  return (
    <span className={showIcon ? `${className} inline-flex items-center gap-1` : className}>
      {showIcon ? <Calendar className="size-3.5 shrink-0" aria-hidden="true" /> : null}
      <time dateTime={dateUploaded}>{label}</time>
    </span>
  )
}