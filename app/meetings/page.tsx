'use client'
import { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import { Meeting } from '@/types'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<(Meeting & { assignments: any[] })[]>([])

  const load = useCallback(async () => {
    const mRes = await fetch('/api/meetings?limit=100')
    if (mRes.ok) setMeetings(await mRes.json())
  }, [])

  useEffect(() => { load() }, [load])

  const editable = true

  const today = new Date().toISOString().split('T')[0]
  const upcoming = meetings.filter((m) => m.date >= today)
  const past = meetings.filter((m) => m.date < today)

  return (
    <div className="md:pl-56 pb-20 md:pb-0 min-h-screen">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Meetings</h1>
          {editable && (
            <Link
              href="/meetings/new"
              className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              + Plan Meeting
            </Link>
          )}
        </div>

        {meetings.length === 0 && (
          <div className="text-center py-16 text-gray-400">No meetings yet.</div>
        )}

        {upcoming.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Upcoming</h2>
            <div className="space-y-2">
              {upcoming.map((m) => (
                <MeetingRow key={m.id} meeting={m} />
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Past</h2>
            <div className="space-y-2">
              {past.map((m) => (
                <MeetingRow key={m.id} meeting={m} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function MeetingRow({ meeting }: { meeting: Meeting & { assignments: any[] } }) {
  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className="block bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-gray-200 transition"
    >
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-900">{formatDate(meeting.date)}</div>
        <span className="text-xs text-gray-400">{meeting.assignments.length} speaker{meeting.assignments.length !== 1 ? 's' : ''}</span>
      </div>
      {meeting.assignments.length > 0 && (
        <div className="mt-1 text-sm text-gray-500">
          {meeting.assignments.map((a: any, i: number) => (
            <span key={a.id}>
              {a.member_name}{a.topic ? ` — ${a.topic}` : ''}
              {i < meeting.assignments.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}
      {meeting.notes && <div className="text-xs text-gray-400 mt-1">{meeting.notes}</div>}
    </Link>
  )
}
