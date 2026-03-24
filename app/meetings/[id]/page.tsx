'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { Meeting, Member } from '@/types'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Assignment {
  member_id: number
  member_name: string
  topic: string
  order_num: number
}

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [meeting, setMeeting] = useState<(Meeting & { assignments: any[] }) | null>(null)
  const [editing, setEditing] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const mRes = await fetch(`/api/meetings/${id}`)
    if (mRes.ok) {
      const m = await mRes.json()
      setMeeting(m)
      setDate(m.date)
      setNotes(m.notes ?? '')
      setAssignments(m.assignments.map((a: any) => ({
        member_id: a.member_id,
        member_name: a.member_name,
        topic: a.topic ?? '',
        order_num: a.order_num,
      })))
    } else {
      router.push('/meetings')
    }
  }, [id, router])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (editing) {
      fetch('/api/members').then((r) => r.json()).then(setMembers)
    }
  }, [editing])

  const editable = true

  const filteredMembers = members.filter(
    (m) =>
      search.length > 0 &&
      m.name.toLowerCase().includes(search.toLowerCase()) &&
      !assignments.find((a) => a.member_id === m.id)
  )

  function addSpeaker(m: Member) {
    setAssignments((prev) => [...prev, { member_id: m.id, member_name: m.name, topic: '', order_num: prev.length }])
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

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/meetings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, notes, assignments }),
    })
    if (res.ok) { await load(); setEditing(false) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this meeting?')) return
    await fetch(`/api/meetings/${id}`, { method: 'DELETE' })
    router.push('/meetings')
  }

  if (!meeting) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>

  return (
    <div className="md:pl-[60px] pb-20 md:pb-0 min-h-screen">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Link href="/meetings" className="text-sm text-gray-600 hover:underline flex items-center gap-1 mb-4">
          ← Back to Meetings
        </Link>

        {!editing ? (
          <>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{formatDate(meeting.date)}</h1>
                {meeting.notes && <p className="text-gray-500 mt-1 text-sm">{meeting.notes}</p>}
              </div>
              {editable && (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(true)} className="text-sm border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">Edit</button>
                  <button onClick={handleDelete} className="text-sm text-red-400 hover:text-red-600 px-3 py-1.5 transition">Delete</button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Speakers</h2>
              {meeting.assignments.length === 0 ? (
                <p className="text-sm text-gray-400">No speakers assigned.</p>
              ) : (
                <ol className="space-y-3">
                  {meeting.assignments.map((a: any, i: number) => (
                    <li key={a.id} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-gray-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div>
                        <Link href={`/members/${a.member_id}`} className="font-medium text-gray-900 hover:text-gray-700">
                          {a.member_name}
                        </Link>
                        {a.topic && <div className="text-sm text-gray-500">{a.topic}</div>}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-5">
            <h1 className="text-xl font-bold text-gray-900">Edit Meeting</h1>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Speakers</h2>
              <div className="space-y-2 mb-4">
                {assignments.map((a, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs">▲</button>
                      <button type="button" onClick={() => move(idx, 1)} disabled={idx === assignments.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs">▼</button>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{a.member_name}</div>
                      <input type="text" placeholder="Topic…" className="w-full text-xs border border-gray-200 rounded px-2 py-1 mt-1 focus:outline-none focus:ring-1 focus:ring-gray-400" value={a.topic} onChange={(e) => updateTopic(idx, e.target.value)} />
                    </div>
                    <button type="button" onClick={() => removeAssignment(idx)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                  </div>
                ))}
              </div>
              <div className="relative">
                <input type="search" placeholder="Add a speaker…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" value={search} onChange={(e) => setSearch(e.target.value)} />
                {filteredMembers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto mt-1">
                    {filteredMembers.slice(0, 8).map((m) => (
                      <button key={m.id} type="button" onClick={() => addSpeaker(m)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">{m.name}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setEditing(false); load() }} className="flex-1 border border-gray-300 text-gray-600 font-medium py-2 rounded-xl text-sm hover:bg-gray-50 transition">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-gray-900 hover:bg-gray-700 text-white font-semibold py-2 rounded-xl text-sm transition disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
