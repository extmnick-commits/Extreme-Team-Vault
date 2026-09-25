import type { Metadata } from 'next'
import { CalendarClock, CalendarPlus, Globe, VideoOff } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Live Trainings & Opp Night | Extreme Team Vault',
}

type ScheduleEvent = {
  id: string
  title: string
  day: string
  time: string
  byDay: 'TU' | 'SA'
  // First occurrence in Pacific Time, formatted for Google Calendar (YYYYMMDDTHHMMSS).
  start: string
  end: string
}

const SCHEDULE: ScheduleEvent[] = [
  {
    id: 'opp-night',
    title: 'Opportunity Night',
    day: 'Tuesdays',
    time: '7:00 PM PST',
    byDay: 'TU',
    start: '20260106T190000',
    end: '20260106T200000',
  },
  {
    id: 'team-training',
    title: 'Leadership & Team Training',
    day: 'Saturdays',
    time: '10:00 AM PST',
    byDay: 'SA',
    start: '20260110T100000',
    end: '20260110T110000',
  },
]

function googleCalendarUrl(event: ScheduleEvent) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Extreme Team: ${event.title}`,
    dates: `${event.start}/${event.end}`,
    ctz: 'America/Los_Angeles',
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${event.byDay}`,
    details: 'Join live from the Extreme Team Vault portal.',
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

export default function LivePage() {
  const wherebyUrl = process.env.NEXT_PUBLIC_WHEREBY_URL

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 rounded-2xl border border-line bg-linear-to-r from-white via-red-50/40 to-white p-5 shadow-sm sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold tracking-widest text-red-600">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
          </span>
          LIVE
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Live Trainings &amp; Opp Night
          </h1>
          <p className="text-sm text-ink-muted sm:text-base">
            The room is open. Join with your camera and mic, or just watch.
          </p>
        </div>
      </header>

      <div className="h-[75svh] w-full overflow-hidden rounded-2xl border border-line bg-zinc-950 shadow-sm sm:h-[85vh]">
        {wherebyUrl ? (
          <iframe
            src={wherebyUrl}
            title="Live training room"
            allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
            width="100%"
            height="100%"
            className="block border-0"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center">
            <VideoOff className="size-8 text-zinc-500" aria-hidden="true" />
            <p className="font-medium text-zinc-100">Live room not configured</p>
            <p className="max-w-sm text-sm text-zinc-400">
              Set <code className="text-zinc-200">NEXT_PUBLIC_WHEREBY_URL</code>{' '}
              to your Whereby room URL and restart the server.
            </p>
          </div>
        )}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-ink">Weekly Schedule</h2>

        <ul className="grid gap-4 sm:grid-cols-2">
          {SCHEDULE.map((event) => (
            <li
              key={event.id}
              className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                <CalendarClock className="size-5" aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-semibold text-ink">{event.title}</span>
                <span className="text-sm text-ink-muted">
                  {event.day} @ {event.time}
                </span>
                <a
                  href={googleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 -ml-2 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-violet-600 transition-colors hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                >
                  <CalendarPlus className="size-4" aria-hidden="true" />
                  Add to Calendar
                </a>
              </div>
            </li>
          ))}
        </ul>

        <p className="flex items-center gap-2 text-sm text-ink-subtle">
          <Globe className="size-4 shrink-0" aria-hidden="true" />
          All times are Pacific Time. Calendar invites adjust to your local time
          zone automatically.
        </p>
      </section>
    </div>
  )
}
