'use client'
import { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import MemberCard from '@/components/MemberCard'
import SpeakingRecordModal from '@/components/SpeakingRecordModal'
import { Member, Meeting } from '@/types'
import { formatDateShort } from '@/lib/utils'
import Link from 'next/link'

interface DashboardData {
  stats: {
    totalAdults: number
    totalYouth: number
    meetingsThisYear: number
    recordsThisYear: number
    overdueCount: number
    dueSoonCount: number
  }
  queue: {
    overdue: Member[]
    dueSoon: Member[]
    comingUp: Member[]
    neverSpoken: Member[]
  }
  recentMeetings: (Meeting & { assignments: any[] })[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)
  const [logTarget, setLogTarget] = useState<Member | null>(null)
  const [activeTab, setActiveTab] = useState<'overdue' | 'due-soon' | 'never'>('overdue')

  const load = useCallback(async () => {
    const [dashRes, userRes] = await Promise.all([
      fetch('/api/dashboard'),
      fetch('/api/auth/me'),
    ])
    if (dashRes.ok) setData(await dashRes.json())
    if (userRes.ok) setUser(await userRes.json())
  }, [])

  useEffect(() => { load() }, [load])

  const editable = user?.role === 'bishop' || user?.role === 'counselor'

  if (!data || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading…</div>
      </div>
    )
  }

  const queueSections = [
    { id: 'overdue' as const, label: `Overdue (${data.queue.overdue.length})`, color: 'text-red-600', members: data.queue.overdue },
    { id: 'due-soon' as const, label: `Due Soon (${data.queue.dueSoon.length})`, color: 'text-amber-600', members: data.queue.dueSoon },
    { id: 'never' as const, label: `Never Spoken (${data.queue.neverSpoken.length})`, color: 'text-gray-500', members: data.queue.neverSpoken },
  ]

  return (
    <div className="md:pl-56 pb-20 md:pb-0 min-h-screen">
      <Navigation userName={user.name} role={user.role} />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <Link
            href="/meetings/new"
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Plan Meeting
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Active Adults', value: data.stats.totalAdults, color: 'text-blue-700' },
            { label: 'Active Youth', value: data.stats.totalYouth, color: 'text-purple-700' },
            { label: 'Meetings This Year', value: data.stats.meetingsThisYear, color: 'text-green-700' },
            { label: 'Talks This Year', value: data.stats.recordsThisYear, color: 'text-gray-700' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alert bar */}
        {(data.stats.overdueCount > 0 || data.stats.dueSoonCount > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <span className="text-sm text-amber-800">
              {data.stats.overdueCount > 0 && (
                <strong>{data.stats.overdueCount} speaker{data.stats.overdueCount > 1 ? 's' : ''} overdue. </strong>
              )}
              {data.stats.dueSoonCount > 0 && (
                <span>{data.stats.dueSoonCount} speaker{data.stats.dueSoonCount > 1 ? 's' : ''} due within 30 days.</span>
              )}
            </span>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Queue */}
          <div className="md:col-span-2">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Speaker Queue</h2>

            {/* Tabs */}
            <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-1">
              {queueSections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveTab(s.id)}
                  className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${
                    activeTab === s.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {queueSections.map((s) =>
              activeTab === s.id ? (
                <div key={s.id} className="space-y-3">
                  {s.members.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
                      No speakers in this category
                    </div>
                  ) : (
                    s.members.map((m) => (
                      <MemberCard
                        key={m.id}
                        member={m}
                        canEdit={editable}
                        onLogSpeaking={setLogTarget}
                      />
                    ))
                  )}
                </div>
              ) : null
            )}
          </div>

          {/* Recent Meetings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Recent Meetings</h2>
              <Link href="/meetings" className="text-xs text-blue-600 hover:underline">See all</Link>
            </div>
            <div className="space-y-2">
              {data.recentMeetings.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
                  No meetings yet
                </div>
              ) : (
                data.recentMeetings.map((m) => (
                  <Link
                    key={m.id}
                    href={`/meetings/${m.id}`}
                    className="block bg-white rounded-xl border border-gray-100 shadow-sm p-3 hover:border-blue-200 transition"
                  >
                    <div className="font-medium text-sm text-gray-900">{formatDateShort(m.date)}</div>
                    {m.assignments.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {m.assignments.map((a: any) => a.member_name).join(', ')}
                      </div>
                    )}
                  </Link>
                ))
              )}
            </div>
            <Link
              href="/meetings/new"
              className="mt-3 block text-center text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-xl py-3 transition"
            >
              + Plan a meeting
            </Link>
          </div>
        </div>
      </main>

      {logTarget && (
        <SpeakingRecordModal
          member={logTarget}
          onClose={() => setLogTarget(null)}
          onSaved={() => { setLogTarget(null); load() }}
        />
      )}
    </div>
  )
}
