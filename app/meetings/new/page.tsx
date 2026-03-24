'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { Member } from '@/types'

interface Assignment {
  member_id: number
  member_name: string
  topic: string
  order_num: number
}

export default function NewMeetingPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [date, setDate] = useState(nextSunday())
  const [notes, setNotes] = useState('')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/members').then(async (mRes) => {
      if (mRes.ok) setMembers(await mRes.json())
    })
  }, [])

  function nextSunday(): string {
    const d = new Date()
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7))
    return d.toISOString().split('T')[0]
  }

  const filteredMembers = members.filter(
    (m) =>
      search.length > 0 &&
      m.name.toLowerCase().includes(search.toLowerCase()) &&
      !assignments.find((a) => a.member_id === m.id)
  )

  function addSpeaker(m: Member) {
    setAssignments((prev) => [
      ...prev,
      { member_id: m.id, member_name: m.name, topic: '', order_num: prev.length },
    ])
    setSearch('')
  }

  function removeAssignment(idx: number) {
    setAssignments((prev) => prev.filter((_, i) => i !== idx).map((a, i) => ({ ...a, order_num: i })))
  }

  function updateTopic(idx: number, topic: string) {
    setAssignments((prev) => prev.map((a, i) => (i === idx ? { ...a, topic } : a)))
  }

  function move(idx: number, dir: -1 | 1) {
    const next = idx + dir
    if (next < 0 || next >= assignments.length) return
    const arr = [...assignments]
    ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
    setAssignments(arr.map((a, i) => ({ ...a, order_num: i })))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, notes, assignments }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Failed to save')
      setSaving(false)
      return
    }
    const data = await res.json()
    router.push(`/meetings/${data.id}`)
  }

  return (
    <div className="md:pl-[60px] pb-20 md:pb-0 min-h-screen">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-sm text-gray-600 hover:underline">← Back</button>
          <h1 className="text-xl font-bold text-gray-900">Plan Meeting</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Date *</label>
              <input
                type="date"
                required
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={2}
                placeholder="Theme, special occasion, fast Sunday…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Speakers */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Speakers</h2>

            {assignments.length === 0 && (
              <p className="text-sm text-gray-400 mb-3">No speakers assigned yet.</p>
            )}

            <div className="space-y-2 mb-4">
              {assignments.map((a, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs leading-none">▲</button>
                    <button type="button" onClick={() => move(idx, 1)} disabled={idx === assignments.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs leading-none">▼</button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{a.member_name}</div>
                    <input
                      type="text"
                      placeholder="Topic (optional)…"
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 mt-1 focus:outline-none focus:ring-1 focus:ring-gray-400"
                      value={a.topic}
                      onChange={(e) => updateTopic(idx, e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAssignment(idx)}
                    className="text-red-400 hover:text-red-600 text-sm shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Add speaker search */}
            <div className="relative">
              <input
                type="search"
                placeholder="Search and add a speaker…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {filteredMembers.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto mt-1">
                  {filteredMembers.slice(0, 10).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => addSpeaker(m)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span>{m.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        m.due_status === 'overdue' ? 'bg-red-50 text-red-600' :
                        m.due_status === 'due-soon' ? 'bg-amber-50 text-amber-600' :
                        m.due_status === 'never' ? 'bg-gray-100 text-gray-500' :
                        'bg-gray-100 text-gray-600'
                      }`}>{m.due_status}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gray-900 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Meeting'}
          </button>
        </form>
      </main>
    </div>
  )
}
