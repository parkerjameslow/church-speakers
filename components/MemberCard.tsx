'use client'
import { useState } from 'react'
import { Member, Category, DueStatus } from '@/types'
import { formatDateShort } from '@/lib/utils'

interface Props {
  member: Member
  onLogSpeaking?: (member: Member) => void
  onSaved?: () => void
  onDeleted?: () => void
  canEdit?: boolean
}

function StatusBadge({ status }: { status: DueStatus }) {
  if (status === 'overdue')
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-500 border border-red-100 whitespace-nowrap">
        Overdue
      </span>
    )
  if (status === 'due-soon')
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 whitespace-nowrap">
        Due Soon
      </span>
    )
  if (status === 'never')
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 border border-gray-200 whitespace-nowrap">
        Never Spoken
      </span>
    )
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-100 whitespace-nowrap">
      On Target
    </span>
  )
}

function PillToggle({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string | number }[]
  value: string | number
  onChange: (v: any) => void
}) {
  return (
    <div className="flex items-center gap-2">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(opt.value) }}
          className={`px-5 py-2 text-sm font-semibold rounded-full transition-all ${
            value === opt.value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
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

export default function MemberCard({ member, onLogSpeaking, onSaved, onDeleted, canEdit }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [cadence, setCadence] = useState(member.cadence_months)
  const [category, setCategory] = useState<Category>(
    (member.category_override ?? member.category ?? 'adult') as Category
  )
  const [isActive, setIsActive] = useState(member.is_active !== false)
  const [isMoved, setIsMoved] = useState(!!member.is_moved)
  const [isStake, setIsStake] = useState(!!member.is_stake)
  const [savedLabel, setSavedLabel] = useState(false)
  const lastTalk = member.recent_talks?.[0] ?? null
  const [form, setForm] = useState({
    name: member.name,
    talk_date: lastTalk?.date ?? '',
    talk_topic: lastTalk?.topic ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

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
        is_stake: isStake,
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

  async function deleteMember() {
    await fetch(`/api/members/${member.id}`, { method: 'DELETE' })
    onDeleted?.()
  }

  const inputCls =
    'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Card header */}
      <div
        className="px-5 py-4 cursor-pointer select-none"
        onClick={() => !editing && setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xl font-bold text-gray-900 leading-tight">{member.name}</span>
            <span className="text-sm text-gray-400 font-medium whitespace-nowrap">
              {category === 'youth' ? 'Youth' : 'Adult'}
            </span>
            <StatusBadge status={status} />
          </div>

          {member.days_since_last_talk != null && (
            <div className="flex flex-col items-end shrink-0">
              <span className="text-4xl font-bold text-gray-900 leading-none">
                {member.days_since_last_talk}
              </span>
              <span className="text-[11px] text-gray-400 whitespace-nowrap mt-0.5">days since last talk</span>
            </div>
          )}
        </div>
      </div>

      {/* Expandable detail section */}
      <div
        style={{ maxHeight: expanded ? '700px' : '0px', opacity: expanded ? 1 : 0 }}
        className="overflow-hidden transition-all duration-300 ease-in-out"
      >
        <hr className="border-gray-100" />

        {!editing ? (
          <div className="px-5 py-4 space-y-3">
            {/* Two-column panels */}
            <div className="flex gap-3">
              {/* Cadence + Member Type panel */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shrink-0">
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">
                  Cadence
                </div>
                {canEdit ? (
                  <>
                    <PillToggle
                      options={CADENCE_OPTIONS}
                      value={cadence}
                      onChange={(v) => { setCadence(v); patchMember({ cadence_months: v }) }}
                    />
                    <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-4 mb-2">
                      Member Type
                    </div>
                    <PillToggle
                      options={CATEGORY_OPTIONS}
                      value={category}
                      onChange={(v) => { setCategory(v); patchMember({ category_override: v }) }}
                    />
                    {savedLabel && <span className="block text-xs text-green-500 font-medium mt-2">Saved ✓</span>}
                  </>
                ) : (
                  <div className="text-sm text-gray-700">
                    Every {cadence} months · {category === 'youth' ? 'Youth' : 'Adult'}
                  </div>
                )}
              </div>

              {/* Talk History panel */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex-1 min-w-0">
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">
                  Talk History
                </div>
                {member.recent_talks && member.recent_talks.length > 0 ? (
                  <div className="space-y-1.5">
                    {member.recent_talks.map((talk, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-gray-800 whitespace-nowrap shrink-0">
                          {formatDateShort(talk.date)}
                        </span>
                        <span className="text-blue-200">—</span>
                        {talk.topic ? (
                          <span className="text-gray-500 truncate">{talk.topic}</span>
                        ) : (
                          <span className="text-blue-400 italic">No topic</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-blue-300 italic">No talks recorded</span>
                )}
              </div>
            </div>

            {/* Bottom action bar */}
            {canEdit && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer select-none">
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
                  <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer select-none">
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
                  <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={isStake}
                      onChange={(e) => {
                        setIsStake(e.target.checked)
                        patchMember({ is_stake: e.target.checked })
                      }}
                    />
                    Stake
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  {onLogSpeaking && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onLogSpeaking(member) }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      <span>+</span> Add Talk
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditing(true) }}
                    className="px-3.5 py-1.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Edit
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Edit form */
          <div className="px-5 py-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div>
              <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
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
                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
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
                onClick={() => { setEditing(false); setConfirmDelete(false) }}
                className="flex-1 border border-gray-200 text-gray-600 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg text-sm font-semibold transition disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>

            {onDeleted && (
              <div className="pt-1 border-t border-gray-100">
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full text-xs font-semibold text-red-400 hover:text-red-600 hover:bg-red-50 py-1.5 rounded-lg transition"
                  >
                    Delete Member
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 flex-1">Are you sure?</span>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition"
                    >
                      No
                    </button>
                    <button
                      onClick={deleteMember}
                      className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition"
                    >
                      Yes, Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
