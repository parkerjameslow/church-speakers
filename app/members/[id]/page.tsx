'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import MemberModal from '@/components/MemberModal'
import SpeakingRecordModal from '@/components/SpeakingRecordModal'
import { DueBadge } from '@/components/DueBadge'
import { Member, SpeakingRecord } from '@/types'
import { formatDate, formatDateShort } from '@/lib/utils'
import Link from 'next/link'

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [records, setRecords] = useState<SpeakingRecord[]>([])
  const [editModal, setEditModal] = useState(false)
  const [logModal, setLogModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    const [memRes, recRes] = await Promise.all([
      fetch(`/api/members/${id}`),
      fetch(`/api/speaking-records?memberId=${id}`),
    ])
    if (memRes.ok) setMember(await memRes.json())
    else router.push('/members')
    if (recRes.ok) setRecords(await recRes.json())
  }, [id, router])

  useEffect(() => { load() }, [load])

  const editable = true

  async function deleteRecord(recId: number) {
    if (!confirm('Delete this speaking record?')) return
    await fetch(`/api/speaking-records/${recId}`, { method: 'DELETE' })
    load()
  }

  async function deleteMember() {
    if (!confirm(`Delete ${member?.name}? This cannot be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/members')
    else setDeleting(false)
  }

  if (!member) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>

  const status = member.due_status ?? 'never'

  return (
    <div className="md:pl-[60px] pb-20 md:pb-0 min-h-screen">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Back */}
        <Link href="/members" className="text-sm text-gray-600 hover:underline flex items-center gap-1 mb-4">
          ← Back to Members
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{member.name}</h1>
              {member.household_name && (
                <div className="text-sm text-gray-500 mt-0.5">{member.household_name} family</div>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <DueBadge status={status} />
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                  member.category === 'youth'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-sky-50 text-sky-700 border-sky-200'
                }`}>
                  {member.category === 'youth' ? 'Youth' : 'Adult'}
                </span>
                {!member.is_active && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">
                    Inactive
                  </span>
                )}
              </div>
            </div>
            {editable && (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setEditModal(true)}
                  className="text-sm border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => setLogModal(true)}
                  className="text-sm bg-gray-900 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition"
                >
                  + Log Speaking
                </button>
              </div>
            )}
          </div>

          {/* Details grid */}
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 mt-4 text-sm">
            {member.phone && (
              <div><span className="text-gray-400">Phone: </span><a href={`tel:${member.phone}`} className="text-gray-600">{member.phone}</a></div>
            )}
            {member.email && (
              <div><span className="text-gray-400">Email: </span><a href={`mailto:${member.email}`} className="text-gray-600">{member.email}</a></div>
            )}
            <div>
              <span className="text-gray-400">Cadence: </span>
              <span className="text-gray-700">every {member.cadence_months} months</span>
            </div>
            <div>
              <span className="text-gray-400">Total talks: </span>
              <span className="text-gray-700">{member.speaking_count}</span>
            </div>
            {member.last_spoke_date && (
              <div>
                <span className="text-gray-400">Last spoke: </span>
                <span className="text-gray-700">{formatDate(member.last_spoke_date)}</span>
              </div>
            )}
            {member.next_due_date && (
              <div>
                <span className="text-gray-400">Next due: </span>
                <span className={status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-700'}>
                  {formatDate(member.next_due_date)}
                  {status === 'overdue' && member.days_overdue ? ` (${member.days_overdue} days overdue)` : ''}
                </span>
              </div>
            )}
          </div>

          {member.notes && (
            <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
              <span className="font-medium text-gray-700">Notes: </span>{member.notes}
            </div>
          )}
        </div>

        {/* Speaking History */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Speaking History</h2>
          {records.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No speaking records yet.</div>
          ) : (
            <div className="space-y-3">
              {records.map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="font-medium text-sm text-gray-900">{formatDateShort(r.date)}</div>
                    {r.topic && <div className="text-sm text-gray-600 mt-0.5">{r.topic}</div>}
                    <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                      {r.duration_minutes && <span>{r.duration_minutes} min</span>}
                      {r.notes && <span>{r.notes}</span>}
                    </div>
                  </div>
                  {editable && (
                    <button
                      onClick={() => deleteRecord(r.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition shrink-0"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {editable && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={deleteMember}
              disabled={deleting}
              className="text-sm text-red-500 hover:text-red-700 transition"
            >
              {deleting ? 'Deleting…' : 'Delete member'}
            </button>
          </div>
        )}
      </main>

      {editModal && (
        <MemberModal
          member={member}
          onClose={() => setEditModal(false)}
          onSaved={() => { setEditModal(false); load() }}
        />
      )}
      {logModal && (
        <SpeakingRecordModal
          member={member}
          onClose={() => setLogModal(false)}
          onSaved={() => { setLogModal(false); load() }}
        />
      )}
    </div>
  )
}
