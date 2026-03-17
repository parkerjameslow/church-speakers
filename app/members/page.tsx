'use client'
import { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import MemberCard from '@/components/MemberCard'
import MemberModal from '@/components/MemberModal'
import SpeakingRecordModal from '@/components/SpeakingRecordModal'
import { Member } from '@/types'
import { sortByUrgency } from '@/lib/utils'

type TabType = 'adult' | 'youth'
type SortType = 'name' | 'urgency'

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)
  const [tab, setTab] = useState<TabType>('adult')
  const [sort, setSort] = useState<SortType>('urgency')
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [logTarget, setLogTarget] = useState<Member | null>(null)

  const load = useCallback(async () => {
    const [memRes, userRes] = await Promise.all([
      fetch(`/api/members?includeInactive=${showInactive}`),
      fetch('/api/auth/me'),
    ])
    if (memRes.ok) setMembers(await memRes.json())
    if (userRes.ok) setUser(await userRes.json())
  }, [showInactive])

  useEffect(() => { load() }, [load])

  const editable = user?.role === 'bishop' || user?.role === 'counselor'

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

  if (!user) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>

  return (
    <div className="md:pl-56 pb-20 md:pb-0 min-h-screen">
      <Navigation userName={user.name} role={user.role} />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Members</h1>
          {editable && (
            <button
              onClick={() => setAddModal(true)}
              className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
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
            className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
