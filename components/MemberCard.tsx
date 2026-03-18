'use client'
import { useState } from 'react'
import { Member, Category } from '@/types'
import { formatDateShort } from '@/lib/utils'

interface Props {
  member: Member
  onLogSpeaking?: (member: Member) => void
  onSaved?: () => void
  canEdit?: boolean
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? ''
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
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
  const isOverdue = status === 'overdue'
  const isNever = status === 'never'

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

  function handleCardClick() {
    if (!editing) setExpanded((v) => !v)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header — always visible, click to expand */}
      <div className="p-4 cursor-pointer select-none" onClick={handleCardClick}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-sm font-semibold text-blue-400">
              {getInitials(member.name)}
            </span>
          </div>

          {/* Name/badges + Recent talks, side by side */}
          <div className="flex-1 min-w-0 flex gap-3">
            {/* Name + badges */}
            <div className="min-w-0 flex-[1.2]">
              <div className="font-bold text-gray-900 text-base leading-tight truncate">
                {member.name}
              </div>
              {member.household_name && (
                <div className="text-xs text-gray-400 mt-0.5">The {member.household_name}</div>
              )}
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
                  {member.category === 'youth' ? 'Youth' : 'Adult'}
                </span>
                {isOverdue && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-400">
                    Overdue
                  </span>
                )}
                {isNever && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                    Never Spoken
                  </span>
                )}
              </div>
            </div>

            {/* Recent talks to the right of name */}
            {member.recent_talks && member.recent_talks.length > 0 && (
              <div className="flex-1 min-w-0 space-y-1 pt-0.5">
                {member.recent_talks.map((talk, i) => (
                  <div key={i} className="leading-tight">
                    <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
                      {formatDateShort(talk.date)}
                    </div>
                    {talk.topic ? (
                      <div className="text-xs text-gray-400 truncate">{talk.topic}</div>
                    ) : (
                      <div className="text-xs text-gray-300 italic">No topic</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Days since talk + + button */}
          <div className="shrink-0 flex flex-col items-end gap-2">
            {member.days_since_last_talk != null && (
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 leading-none">
                  {member.days_since_last_talk}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">days since talk</div>
              </div>
            )}
            {onLogSpeaking && (
              <button
                onClick={(e) => { e.stopPropagation(); onLogSpeaking(member) }}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center text-lg leading-none font-light transition"
                title="Log speaking"
              >
                +
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expandable section */}
      <div
        style={{ maxHeight: expanded ? '600px' : '0px', opacity: expanded ? 1 : 0 }}
        className="overflow-hidden transition-all duration-300 ease-in-out"
      >
        <div className="border-t border-gray-50 px-4 pb-4">
          {!editing ? (
            <div className="space-y-3 pt-3">
              {/* Contact info */}
              <div className="flex gap-4 text-sm">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Phone</div>
                  <div className="text-gray-700">{member.phone || <span className="text-gray-300">—</span>}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Email</div>
                  <div className="text-gray-700 truncate">{member.email || <span className="text-gray-300">—</span>}</div>
                </div>
              </div>

              {/* Cadence */}
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Speaking Cadence
                </div>
                {canEdit ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={cadence}
                      onChange={(e) => saveCadence(parseInt(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
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

              {/* Talk history */}
              {member.recent_talks && member.recent_talks.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Talk History
                  </div>
                  <div className="space-y-1">
                    {member.recent_talks.map((talk, i) => (
                      <div key={i} className="text-sm text-gray-700">
                        <span className="font-medium">{formatDateShort(talk.date)}</span>
                        {talk.topic
                          ? <span className="text-gray-500"> — {talk.topic}</span>
                          : <span className="text-gray-300 italic"> — No topic</span>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); setEditing(true) }}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition border border-gray-100"
                >
                  Edit Member
                </button>
              )}
            </div>
          ) : (
            /* Inline edit form */
            <div className="space-y-3 pt-3" onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                  >
                    <option value="adult">Adult</option>
                    <option value="youth">Youth</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cadence</label>
                  <select
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
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
                <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: !e.target.checked })}
                  className="rounded"
                />
                Mark as inactive
              </label>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex-1 bg-gray-900 hover:bg-gray-700 text-white py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50"
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
