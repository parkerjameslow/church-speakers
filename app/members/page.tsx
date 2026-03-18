'use client'
import { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import MemberCard from '@/components/MemberCard'
import MemberModal from '@/components/MemberModal'
import SpeakingRecordModal from '@/components/SpeakingRecordModal'
import { Member } from '@/types'
import { sortByUrgency } from '@/lib/utils'

function NeverSpokenSection({ members }: { members: Member[] }) {
  const [open, setOpen] = useState(false)
  if (members.length === 0) return null
  return (
    <div className="mb-4 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">Never Spoken</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
            {members.length}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-4 py-3">
          <ul className="space-y-1.5">
            {members.map((m) => (
              <li key={m.id} className="text-sm text-gray-700">{m.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

type TabType = 'adult' | 'youth'
type SortType = 'name' | 'urgency'

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [tab, setTab] = useState<TabType>('adult')
  const [sort, setSort] = useState<SortType>('urgency')
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [logTarget, setLogTarget] = useState<Member | null>(null)

  const load = useCallback(async () => {
    const memRes = await fetch(`/api/members?includeInactive=${showInactive}`)
    if (memRes.ok) setMembers(await memRes.json())
  }, [showInactive])

  useEffect(() => { load() }, [load])

  const editable = true

  const neverSpoken = members
    .filter((m) => m.category === tab && m.due_status === 'never' && m.is_active !== false)
    .sort((a, b) => a.name.localeCompare(b.name))

  const filtered = members
    .filter((m) => m.category === tab)
    .filter((m) =>
      search === '' || m.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sort === 'urgency' ? sortByUrgency(a, b) : a.name.localeCompare(b.name)
    )

  const adultCount = members.filter((m) => m.category === 'adult').length
  const youthCount = members.filter((m) => m.category === 'youth').length

  return (
    <div className="md:pl-56 pb-20 md:pb-0 min-h-screen">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Members</h1>
          {editable && (
            <button
              onClick={() => setAddModal(true)}
              className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              + Add Member
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab('adult')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
              tab === 'adult' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Adults ({adultCount})
          </button>
          <button
            onClick={() => setTab('youth')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
              tab === 'youth' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Youth ({youthCount})
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            type="search"
            placeholder="Search by name…"
            className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
          >
            <option value="urgency">Sort: Most Overdue First</option>
            <option value="name">Sort: Name A–Z</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            Show inactive
          </label>
        </div>

        <NeverSpokenSection members={neverSpoken} />

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {search ? 'No members match your search.' : 'No members yet. Add one above!'}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((m) => (
              <MemberCard
                key={m.id}
                member={m}
                canEdit={editable}
                onLogSpeaking={setLogTarget}
                onSaved={load}
              />
            ))}
          </div>
        )}
      </main>

      {addModal && (
        <MemberModal
          onClose={() => setAddModal(false)}
          onSaved={() => { setAddModal(false); load() }}
        />
      )}

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
