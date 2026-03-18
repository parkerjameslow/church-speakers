'use client'
import { useState, useEffect, useCallback } from 'react'
import MemberCard from '@/components/MemberCard'
import MemberModal from '@/components/MemberModal'
import SpeakingRecordModal from '@/components/SpeakingRecordModal'
import { Member } from '@/types'

type FilterType = 'all' | 'adult' | 'youth'
type SortDir = 'desc' | 'asc'

export default function HomePage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [logTarget, setLogTarget] = useState<Member | null>(null)
  const [addModal, setAddModal] = useState(false)
  const [neverExpanded, setNeverExpanded] = useState(false)
  const [inactiveExpanded, setInactiveExpanded] = useState(false)
  const [movedExpanded, setMovedExpanded] = useState(false)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/members')
    if (res.ok) setMembers(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const inactiveMembers = members.filter((m) => (m.is_active === false || m.is_active === 0) && !m.is_moved)
  const movedMembers = members.filter((m) => !!m.is_moved)
  const activeMembers = members.filter((m) => m.is_active !== false && m.is_active !== 0 && !m.is_moved)

  const neverSpokenMembers = activeMembers.filter((m) => m.due_status === 'never')

  const filteredMembers = activeMembers
    .filter((m) => m.due_status !== 'never')
    .filter((m) => filter === 'all' || m.category === filter)
    .filter((m) => search === '' || m.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aDays = a.days_since_last_talk ?? 999999
      const bDays = b.days_since_last_talk ?? 999999
      return sortDir === 'desc' ? bDays - aDays : aDays - bDays
    })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900 tracking-tight">
              Speaker Tracker
            </span>
            <button
              onClick={() => setAddModal(true)}
              className="text-xs font-medium bg-gray-900 text-white px-3 py-1.5 rounded-md hover:bg-gray-700 transition"
            >
              + Add Member
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading && (
          <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
        )}

        {!loading && (
          <div>
            {/* Never Spoken collapsible section */}
            {neverSpokenMembers.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setNeverExpanded((x) => !x)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-100 text-sm font-medium text-gray-500 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <span>Never Spoken</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                      {neverSpokenMembers.length}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${neverExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {neverExpanded && (
                  <div className="mt-1 bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {neverSpokenMembers.map((m, i) => (
                      <div
                        key={m.id}
                        className={`px-4 py-3 text-sm text-gray-800 ${
                          i < neverSpokenMembers.length - 1 ? 'border-b border-gray-50' : ''
                        }`}
                      >
                        {m.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Inactive collapsible section */}
            {inactiveMembers.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setInactiveExpanded((x) => !x)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-100 text-sm font-medium text-gray-500 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <span>Inactive</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                      {inactiveMembers.length}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${inactiveExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {inactiveExpanded && (
                  <div className="mt-1 space-y-3">
                    {inactiveMembers.map((m) => (
                      <MemberCard key={m.id} member={m} onLogSpeaking={setLogTarget} canEdit onSaved={load} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Moved collapsible section */}
            {movedMembers.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setMovedExpanded((x) => !x)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-100 text-sm font-medium text-gray-500 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <span>Moved</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                      {movedMembers.length}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${movedExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {movedExpanded && (
                  <div className="mt-1 space-y-3">
                    {movedMembers.map((m) => (
                      <MemberCard key={m.id} member={m} onLogSpeaking={setLogTarget} canEdit onSaved={load} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search */}
            <input
              type="search"
              placeholder="Search members…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white mb-3"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* Filter + Sort */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {(['all', 'adult', 'youth'] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                      filter === f
                        ? 'bg-white shadow-sm text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'adult' ? 'Adults' : 'Youth'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition"
              >
                Days Since Talk
                <svg
                  className={`w-3 h-3 transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Member count label */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Since Last Talk
              </h2>
              <span className="text-xs text-gray-400">{filteredMembers.length} speakers</span>
            </div>

            {filteredMembers.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                {search ? 'No members match your search.' : 'No speaking records yet. Log a talk to get started.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMembers.map((m) => (
                  <MemberCard key={m.id} member={m} onLogSpeaking={setLogTarget} canEdit onSaved={load} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {addModal && (
        <MemberModal
          onClose={() => setAddModal(false)}
          onSaved={() => {
            setAddModal(false)
            load()
          }}
        />
      )}

      {logTarget && (
        <SpeakingRecordModal
          member={logTarget}
          onClose={() => setLogTarget(null)}
          onSaved={() => {
            setLogTarget(null)
            load()
          }}
        />
      )}
    </div>
  )
}
