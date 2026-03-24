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
  const [stakeExpanded, setStakeExpanded] = useState(false)

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

  const inactiveMembers = members.filter((m) => (m.is_active === false || m.is_active === 0) && !m.is_moved && !m.is_stake)
  const movedMembers = members.filter((m) => !!m.is_moved && !m.is_stake)
  const stakeMembers = members.filter((m) => !!m.is_stake)
  const activeMembers = members.filter((m) => m.is_active !== false && m.is_active !== 0 && !m.is_moved && !m.is_stake)

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
    <div className="min-h-screen bg-[#F2F2F2]">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#111111] flex items-center justify-center">
              <span className="text-accent font-black text-[10px]">ST</span>
            </div>
            <span className="text-sm font-bold text-[#111111] tracking-tight">Speaker Tracker</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading && (
          <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
        )}

        {!loading && (
          <div>
            {/* Search */}
            <div className="relative mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Search members…"
                className="w-full bg-white border-0 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter + Sort */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm">
                  {(['all', 'adult', 'youth'] as FilterType[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                        filter === f
                          ? 'bg-[#111111] text-white shadow-sm'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {f === 'all' ? 'All' : f === 'adult' ? 'Adults' : 'Youth'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setAddModal(true)}
                  className="text-xs font-bold bg-accent text-[#111111] px-3 py-1.5 rounded-xl hover:bg-accent/90 transition shadow-sm"
                >
                  + Add Member
                </button>
              </div>
              <button
                onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#111111] px-2 py-1.5 rounded-lg hover:bg-white transition"
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
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Since Last Talk
              </h2>
              <span className="text-xs text-gray-400 font-medium">{filteredMembers.length} speakers</span>
            </div>

            {filteredMembers.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                {search ? 'No members match your search.' : 'No speaking records yet. Log a talk to get started.'}
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {filteredMembers.map((m) => (
                  <MemberCard key={m.id} member={m} onLogSpeaking={setLogTarget} canEdit onSaved={load} onDeleted={load} />
                ))}
              </div>
            )}

            {/* Collapsible sections */}
            {[
              { label: 'Never Spoken', count: neverSpokenMembers.length, expanded: neverExpanded, toggle: () => setNeverExpanded(x => !x), members: neverSpokenMembers, simple: true },
              { label: 'Stake', count: stakeMembers.length, expanded: stakeExpanded, toggle: () => setStakeExpanded(x => !x), members: stakeMembers, simple: false },
              { label: 'Inactive', count: inactiveMembers.length, expanded: inactiveExpanded, toggle: () => setInactiveExpanded(x => !x), members: inactiveMembers, simple: false },
              { label: 'Moved', count: movedMembers.length, expanded: movedExpanded, toggle: () => setMovedExpanded(x => !x), members: movedMembers, simple: false },
            ].filter(s => s.count > 0).map(s => (
              <div key={s.label} className="mb-3">
                <button
                  onClick={s.toggle}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-2xl shadow-sm text-sm font-bold text-[#111111] hover:shadow-md transition"
                >
                  <div className="flex items-center gap-2">
                    <span>{s.label}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#111111] text-white">
                      {s.count}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${s.expanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {s.expanded && (
                  <div className="mt-2">
                    {s.simple ? (
                      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        {s.members.map((m, i) => (
                          <div
                            key={m.id}
                            className={`px-4 py-3 text-sm font-medium text-[#111111] ${
                              i < s.members.length - 1 ? 'border-b border-gray-50' : ''
                            }`}
                          >
                            {m.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {s.members.map((m) => (
                          <MemberCard key={m.id} member={m} onLogSpeaking={setLogTarget} canEdit onSaved={load} onDeleted={load} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
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
