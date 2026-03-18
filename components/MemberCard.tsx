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

function Toggle({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string | number }[]
  value: string | number
  onChange: (v: any) => void
}) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden shrink-0">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(opt.value) }}
          className={`px-3 py-1.5 text-xs font-semibold transition ${
            value === opt.value
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

const CADENCE_OPTIONS = [
  { label: '6 mo', value: 6 },
  { label: '12 mo', value: 12 },
]
const CATEGORY_OPTIONS = [
  { label: 'Adult', value: 'adult' },
  { label: 'Youth', value: 'youth' },
]

export default function MemberCard({ member, onLogSpeaking, onSaved, canEdit }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [cadence, setCadence] = useState(member.cadence_months)
  const [category, setCategory] = useState<Category>(
    (member.category_override ?? member.category ?? 'adult') as Category
  )
  const [isActive, setIsActive] = useState(member.is_active !== false)
  const [isMoved, setIsMoved] = useState(!!member.is_moved)
  const [savedLabel, setSavedLabel] = useState(false)
  const lastTalk = member.recent_talks?.[0] ?? null
  const [form, setForm] = useState({
    name: member.name,
    talk_date: lastTalk?.date ?? '',
    talk_topic: lastTalk?.topic ?? '',
  })
  const [saving, setSaving] = useState(false)

  const status = member.due_status ?? 'never'

  async function patchMember(patch: Record<string, unknown>) {
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
        cadence_months: cadence,
        is_active: isActive,
        is_moved: isMoved,
        category_override: category,
        ...patch,
      }),
    })
    setSavedLabel(true)
    setTimeout(() => setSavedLabel(false), 2000)
    onSaved?.()
  }

  async function saveEdit() {
    setSaving(true)
    // Save name if changed
    if (form.name !== member.name) {
      await fetch(`/api/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          birth_date: member.birth_date,
          phone: member.phone,
          email: member.email,
          household_id: member.household_id,
          notes: member.notes,
          cadence_months: cadence,
          is_active: member.is_active,
          is_moved: member.is_moved,
          category_override: category,
        }),
      })
    }
    // Save most recent talk if it exists and was changed
    if (lastTalk && (form.talk_date !== lastTalk.date || form.talk_topic !== (lastTalk.topic ?? ''))) {
      await fetch(`/api/speaking-records/${lastTalk.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.talk_date,
          topic: form.talk_topic || null,
          duration_minutes: null,
          notes: null,
        }),
      })
    }
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
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-semibold text-gray-900 leading-tight">{member.name}</span>
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
              {category === 'youth' ? 'Youth' : 'Adult'}
            </span>
            <StatusBadge status={status} />
          </div>

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
      </div>

      {/* Expandable detail section */}
      <div
        style={{ maxHeight: expanded ? '600px' : '0px', opacity: expanded ? 1 : 0 }}
        className="overflow-hidden transition-all duration-300 ease-in-out"
      >
        <div className="border-t border-gray-100 px-4 pb-4">
          {!editing ? (
            <div className="space-y-3 pt-3">
              {/* Cadence + Category toggle */}
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Speaking Cadence
                </div>
                {canEdit ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Toggle
                      options={CADENCE_OPTIONS}
                      value={cadence}
                      onChange={(v) => { setCadence(v); patchMember({ cadence_months: v }) }}
                    />
                    <Toggle
                      options={CATEGORY_OPTIONS}
                      value={category}
                      onChange={(v) => { setCategory(v); patchMember({ category_override: v }) }}
                    />
                    {savedLabel && <span className="text-xs text-green-500 font-medium">Saved ✓</span>}
                  </div>
                ) : (
                  <div className="text-sm text-gray-700">
                    Every {cadence} months · {category === 'youth' ? 'Youth' : 'Adult'}
                  </div>
                )}
              </div>

              {/* Talk history */}
              {member.recent_talks && member.recent_talks.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Talk History
                  </div>
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
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={!isActive}
                        onChange={(e) => {
                          const val = !e.target.checked
                          setIsActive(val)
                          patchMember({ is_active: val })
                        }}
                      />
                      Inactive
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={isMoved}
                        onChange={(e) => {
                          setIsMoved(e.target.checked)
                          patchMember({ is_moved: e.target.checked })
                        }}
                      />
                      Moved
                    </label>
                  </div>
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
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {lastTalk && (
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                    Most Recent Talk
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      className={inputCls}
                      value={form.talk_date}
                      onChange={(e) => setForm({ ...form, talk_date: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="Topic…"
                      className={inputCls}
                      value={form.talk_topic}
                      onChange={(e) => setForm({ ...form, talk_topic: e.target.value })}
                    />
                  </div>
                </div>
              )}

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
