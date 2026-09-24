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
      <header className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-linear-to-r from-zinc-900 via-zinc-950 to-zinc-900 p-6 sm:flex-row sm:items-center sm:gap-6">
        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold tracking-widest text-red-400">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
          </span>
          LIVE
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Live Trainings &amp; Opp Night
          </h1>
          <p className="text-zinc-400">
            The room is open. Join with your camera and mic, or just watch.
          </p>
        </div>
      </header>

      <div className="h-[85vh] w-full overflow-hidden rounded-xl border border-zinc-800 bg-black">
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
            <VideoOff className="size-8 text-zinc-600" aria-hidden="true" />
            <p className="font-medium text-zinc-200">Live room not configured</p>
            <p className="max-w-sm text-sm text-zinc-500">
              Set <code className="text-zinc-300">NEXT_PUBLIC_WHEREBY_URL</code>{' '}
              to your Whereby room URL and restart the server.
            </p>
          </div>
        )}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-zinc-50">Weekly Schedule</h2>

        <ul className="grid gap-4 sm:grid-cols-2">
          {SCHEDULE.map((event) => (
            <li
              key={event.id}
              className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300">
                <CalendarClock className="size-5" aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-medium text-zinc-100">{event.title}</span>
                <span className="text-sm text-zinc-400">
                  {event.day} @ {event.time}
                </span>
                <a
                  href={googleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
                >
                  <CalendarPlus className="size-4" aria-hidden="true" />
                  Add to Calendar
                </a>
              </div>
            </li>
          ))}
        </ul>

        <p className="flex items-center gap-2 text-sm text-zinc-500">
          <Globe className="size-4 shrink-0" aria-hidden="true" />
          All times are Pacific Time. Calendar invites adjust to your local time
          zone automatically.
        </p>
      </section>
    </div>
  )
}
