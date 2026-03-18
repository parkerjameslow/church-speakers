'use client'
import { useState } from 'react'
import { Member, Category, DueStatus } from '@/types'
import { formatDateShort } from '@/lib/utils'

interface Props {
  member: Member
  onLogSpeaking?: (member: Member) => void
  onSaved?: () => void
  canEdit?: boolean
}

function StatusBadge({ status }: { status: DueStatus }) {
  if (status === 'overdue')
    return (
      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 whitespace-nowrap">
        Overdue
      </span>
    )
  if (status === 'due-soon')
    return (
      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 whitespace-nowrap">
        Due Soon
      </span>
    )
  if (status === 'never')
    return (
      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-gray-200 whitespace-nowrap">
        Never Spoken
      </span>
    )
  return (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100 whitespace-nowrap">
      On Target
    </span>
  )
}

export default function MemberCard({ member, onLogSpeaking, onSaved, canEdit }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [cadence, setCadence] = useState(member.cadence_months)
  const [cadenceSaved, setCadenceSaved] = useState(false)
  const [form, setForm] = useState({
    category: (member.category_override ?? member.category ?? 'adult') as Category,
    name: member.name,
    phone: member.phone ?? '',
    email: member.email ?? '',
    cadence_months: member.cadence_months.toString(),
    is_active: member.is_active !== false,
  })
  const [saving, setSaving] = useState(false)

  const status = member.due_status ?? 'never'

  async function saveCadence(value: number) {
    setCadence(value)
    await fetch(`/api/members/${member.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: member.name,
        birth_date: member.birth_date,
        phone: member.phone,
        email: member.email,
        household_id: member.household_id,
        notes: member.notes,
        cadence_months: value,
        is_active: member.is_active,
        category_override: member.category_override ?? null,
      }),
    })
    setCadenceSaved(true)
    setTimeout(() => setCadenceSaved(false), 2000)
    onSaved?.()
  }

  async function saveEdit() {
    setSaving(true)
    await fetch(`/api/members/${member.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        birth_date: member.birth_date,
        phone: form.phone || null,
        email: form.email || null,
        household_id: member.household_id,
        notes: member.notes,
        cadence_months: parseInt(form.cadence_months),
        is_active: form.is_active,
        category_override: form.category,
      }),
    })
    setSaving(false)
    setEditing(false)
    onSaved?.()
  }

  const inputCls =
    'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white'

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Card header — click to expand */}
      <div
        className="p-4 cursor-pointer select-none"
        onClick={() => !editing && setExpanded((v) => !v)}
      >
        {/* Row 1: Name + category + status badge | days since talk + Add Talk button */}
        <div className="flex items-center justify-between gap-3 mb-3">
          {/* Left: name, category, status */}
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-semibold text-gray-900 leading-tight">{member.name}</span>
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
              {member.category === 'youth' ? 'Youth' : 'Adult'}
            </span>
            <StatusBadge status={status} />
          </div>

          {/* Right: days since talk + Add Talk button */}
          <div className="flex items-center gap-3 shrink-0">
            {member.days_since_last_talk != null && (
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-2xl font-bold text-gray-900 leading-none">
                  {member.days_since_last_talk}
                </span>
                <span className="text-[10px] text-gray-400 whitespace-nowrap">days since last talk</span>
              </div>
            )}
            {onLogSpeaking && (
              <button
                onClick={(e) => { e.stopPropagation(); onLogSpeaking(member) }}
                className="flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition shadow-sm shrink-0 self-stretch"
                title="Log a talk"
              >
                <span className="text-base font-medium leading-none">+</span>
                <span className="text-[10px] font-semibold tracking-wide">Add Talk</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Most Recent Talk bordered box */}
        {member.recent_talks && member.recent_talks.length > 0 && (
          <div className="border border-gray-100 rounded-lg p-2.5 bg-gray-50">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Most Recent Talk and Topic
            </div>
            <div className="space-y-1">
              {member.recent_talks.map((talk, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <span className="font-medium text-gray-700 whitespace-nowrap shrink-0">
                    {formatDateShort(talk.date)}
                  </span>
                  <span className="text-gray-300">—</span>
                  {talk.topic ? (
                    <span className="text-gray-500 truncate">{talk.topic}</span>
                  ) : (
                    <span className="text-gray-300 italic">No topic</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expandable detail section */}
      <div
        style={{ maxHeight: expanded ? '520px' : '0px', opacity: expanded ? 1 : 0 }}
        className="overflow-hidden transition-all duration-300 ease-in-out"
      >
        <div className="border-t border-gray-100 px-4 pb-4">
          {!editing ? (
            <div className="space-y-3 pt-3">
              {/* Contact */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Phone</div>
                  <div className="text-gray-700">{member.phone ?? <span className="text-gray-300">—</span>}</div>
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Email</div>
                  <div className="text-gray-700 truncate">{member.email ?? <span className="text-gray-300">—</span>}</div>
                </div>
              </div>

              {/* Cadence */}
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Speaking Cadence</div>
                {canEdit ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={cadence}
                      onChange={(e) => saveCadence(parseInt(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white"
                    >
                      <option value={6}>Every 6 months</option>
                      <option value={12}>Every 12 months</option>
                      <option value={24}>Every 24 months</option>
                    </select>
                    {cadenceSaved && <span className="text-xs text-green-500 font-medium">Saved ✓</span>}
                  </div>
                ) : (
                  <div className="text-sm text-gray-700">Every {cadence} months</div>
                )}
              </div>

              {/* Full talk history */}
              {member.recent_talks && member.recent_talks.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Talk History</div>
                  <div className="space-y-1">
                    {member.recent_talks.map((talk, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-sm">
                        <span className="font-medium text-gray-800 whitespace-nowrap shrink-0">
                          {formatDateShort(talk.date)}
                        </span>
                        <span className="text-gray-300">—</span>
                        {talk.topic ? (
                          <span className="text-gray-500">{talk.topic}</span>
                        ) : (
                          <span className="text-gray-300 italic">No topic</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canEdit && (
                <div className="flex justify-end">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(true) }}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-700 hover:bg-gray-100 px-2.5 py-1 rounded-lg transition"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Edit form */
            <div className="space-y-3 pt-3" onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Category</label>
                  <select
                    className={inputCls}
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                  >
                    <option value="adult">Adult</option>
                    <option value="youth">Youth</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cadence</label>
                  <select
                    className={inputCls}
                    value={form.cadence_months}
                    onChange={(e) => setForm({ ...form, cadence_months: e.target.value })}
                  >
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="24">24 months</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name</label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Phone</label>
                  <input
                    type="tel"
                    className={inputCls}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email</label>
                  <input
                    type="email"
                    className={inputCls}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: !e.target.checked })}
                  className="rounded"
                />
                Mark as inactive
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex-1 bg-gray-900 hover:bg-gray-700 text-white py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
