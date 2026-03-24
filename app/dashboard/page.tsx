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
  const [logTarget, setLogTarget] = useState<Member | null>(null)
  const [activeTab, setActiveTab] = useState<'overdue' | 'due-soon'>('overdue')
  const [neverExpanded, setNeverExpanded] = useState(false)

  const load = useCallback(async () => {
    const dashRes = await fetch('/api/dashboard')
    if (dashRes.ok) setData(await dashRes.json())
  }, [])

  useEffect(() => { load() }, [load])

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F0F0]">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    )
  }

  const queueSections = [
    { id: 'overdue' as const, label: `Overdue (${data.queue.overdue.length})`, members: data.queue.overdue },
    { id: 'due-soon' as const, label: `Due Soon (${data.queue.dueSoon.length})`, members: data.queue.dueSoon },
  ]

  return (
    <div className="md:pl-[60px] pb-20 md:pb-0 min-h-screen bg-[#F0F0F0]">
      <Navigation />

      <main className="max-w-5xl mx-auto px-5 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-black text-[#1C1C1E]">Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">Sacrament Speaker Tracker</p>
          </div>
          <Link
            href="/meetings/new"
            className="bg-[#1C1C1E] text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-black transition"
          >
            + Plan Meeting
          </Link>
        </div>

        {/* Stats grid — bento style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium mb-1">Active Adults</p>
            <p className="text-3xl font-black text-[#1C1C1E]">{data.stats.totalAdults}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium mb-1">Active Youth</p>
            <p className="text-3xl font-black text-[#1C1C1E]">{data.stats.totalYouth}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium mb-1">Meetings This Year</p>
            <p className="text-3xl font-black text-[#1C1C1E]">{data.stats.meetingsThisYear}</p>
          </div>
          {/* Highlighted stat — lime green tint like the image */}
          <div className="bg-[#AAFF00]/20 rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-[#4a7000] font-medium mb-1">Talks This Year</p>
            <p className="text-3xl font-black text-[#1C1C1E]">{data.stats.recordsThisYear}</p>
          </div>
        </div>

        {/* Alert bar */}
        {(data.stats.overdueCount > 0 || data.stats.dueSoonCount > 0) && (
          <div className="bg-white rounded-2xl p-4 mb-5 flex items-center gap-3 shadow-sm border-l-4 border-red-400">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-red-400">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <span className="text-sm text-gray-600">
              {data.stats.overdueCount > 0 && <strong className="text-[#1C1C1E]">{data.stats.overdueCount} speaker{data.stats.overdueCount > 1 ? 's' : ''} overdue. </strong>}
              {data.stats.dueSoonCount > 0 && <span>{data.stats.dueSoonCount} speaker{data.stats.dueSoonCount > 1 ? 's' : ''} due within 30 days.</span>}
            </span>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-5">
          {/* Queue */}
          <div className="md:col-span-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Speaker Queue</p>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 shadow-sm">
              {queueSections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveTab(s.id)}
                  className={`flex-1 text-xs font-bold py-2 rounded-lg transition ${
                    activeTab === s.id ? 'bg-[#1C1C1E] text-white' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {queueSections.map((s) =>
              activeTab === s.id ? (
                <div key={s.id} className="space-y-2.5">
                  {s.id === 'overdue' && data.queue.neverSpoken.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      <button
                        onClick={() => setNeverExpanded((v) => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <span className="text-sm font-bold text-[#1C1C1E]">Never Spoken</span>
                        <div className="flex items-center gap-2">
                          <span className="bg-[#1C1C1E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{data.queue.neverSpoken.length}</span>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform ${neverExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      {neverExpanded && (
                        <div className="p-3 space-y-2 border-t border-gray-50">
                          {data.queue.neverSpoken.map((m) => (
                            <MemberCard key={m.id} member={m} canEdit onLogSpeaking={setLogTarget} onSaved={load} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {s.members.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-2xl shadow-sm">
                      No speakers in this category
                    </div>
                  ) : (
                    s.members.map((m) => (
                      <MemberCard key={m.id} member={m} canEdit onLogSpeaking={setLogTarget} onSaved={load} />
                    ))
                  )}
                </div>
              ) : null
            )}
          </div>

          {/* Recent Meetings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recent Meetings</p>
              <Link href="/meetings" className="text-xs text-gray-400 hover:text-[#1C1C1E] font-medium transition">See all</Link>
            </div>
            <div className="space-y-2">
              {data.recentMeetings.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm bg-white rounded-2xl shadow-sm">No meetings yet</div>
              ) : (
                data.recentMeetings.map((m) => (
                  <Link key={m.id} href={`/meetings/${m.id}`} className="block bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition">
                    <div className="font-bold text-sm text-[#1C1C1E]">{formatDateShort(m.date)}</div>
                    {m.assignments.length > 0 && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">{m.assignments.map((a: any) => a.member_name).join(', ')}</div>
                    )}
                  </Link>
                ))
              )}
            </div>
            <Link
              href="/meetings/new"
              className="mt-3 block text-center text-xs font-bold text-[#1C1C1E] bg-[#AAFF00] hover:bg-[#99ee00] rounded-2xl py-3 transition"
            >
              + Plan a Meeting
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
