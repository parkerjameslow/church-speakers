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
      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-500 border border-red-100 whitespace-nowrap">
        Overdue
      </span>
    )
  if (status === 'due-soon')
    return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 whitespace-nowrap">
        Due Soon
      </span>
    )
  if (status === 'never')
    return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 border border-gray-200 whitespace-nowrap">
        Never Spoken
      </span>
    )
  return (
    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-accent/20 text-[#5a7a00] border border-accent/30 whitespace-nowrap">
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
    <div className="flex items-center gap-1.5">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(opt.value) }}
          className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
            value === opt.value
              ? 'bg-accent text-[#111111] shadow-sm'
              : 'bg-white/10 text-gray-400 hover:text-white border border-white/10'
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
  const [form, setForm] = useState({
    name: member.name,
  })
  const [talks, setTalks] = useState(
    (member.recent_talks ?? []).map((t) => ({ id: t.id, date: t.date, topic: t.topic ?? '' }))
  )
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
    const originalTalks = member.recent_talks ?? []
    await Promise.all(
      talks.map((t) => {
        const orig = originalTalks.find((o) => o.id === t.id)
        if (!orig || t.date !== orig.date || t.topic !== (orig.topic ?? '')) {
          return fetch(`/api/speaking-records/${t.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: t.date, topic: t.topic || null, duration_minutes: null, notes: null }),
          })
        }
      })
    )
    setSaving(false)
    setEditing(false)
    onSaved?.()
  }

  async function deleteMember() {
    await fetch(`/api/members/${member.id}`, { method: 'DELETE' })
    onDeleted?.()
  }

  const inputCls =
    'w-full bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent'

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Card header */}
      <div
        className="px-5 py-4 cursor-pointer select-none"
        onClick={() => !editing && setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-base font-bold text-[#111111] leading-tight">{member.name}</span>
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
              {category === 'youth' ? 'Youth' : 'Adult'}
            </span>
            <StatusBadge status={status} />
          </div>

          {member.days_since_last_talk != null && (
            <div className="flex items-baseline gap-1 shrink-0">
              <span className="text-xl font-black text-[#111111] leading-none">
                {member.days_since_last_talk}
              </span>
              <span className="text-[10px] text-gray-400 whitespace-nowrap">days</span>
            </div>
          )}
        </div>
      </div>

      {/* Expandable detail section */}
      <div
        style={{ maxHeight: expanded ? '700px' : '0px', opacity: expanded ? 1 : 0 }}
        className="overflow-hidden transition-all duration-300 ease-in-out"
      >
        <div className="bg-[#111111] mx-3 mb-3 rounded-xl overflow-hidden">
          {!editing ? (
            <div className="p-4 space-y-3">
              {/* Two-column panels */}
              <div className="flex gap-3">
                {/* Cadence + Member Type panel */}
                <div className="shrink-0">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Cadence
                  </div>
                  {canEdit ? (
                    <>
                      <PillToggle
                        options={CADENCE_OPTIONS}
                        value={cadence}
                        onChange={(v) => { setCadence(v); patchMember({ cadence_months: v }) }}
                      />
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-3 mb-2">
                        Member Type
                      </div>
                      <PillToggle
                        options={CATEGORY_OPTIONS}
                        value={category}
                        onChange={(v) => { setCategory(v); patchMember({ category_override: v }) }}
                      />
                      {savedLabel && <span className="block text-xs text-accent font-bold mt-2">Saved ✓</span>}
                    </>
                  ) : (
                    <div className="text-sm text-gray-300">
                      Every {cadence} months · {category === 'youth' ? 'Youth' : 'Adult'}
                    </div>
                  )}
                </div>

                {/* Talk History panel */}
                <div className="flex-1 min-w-0 border-l border-white/10 pl-3">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Talk History
                  </div>
                  {member.recent_talks && member.recent_talks.length > 0 ? (
                    <div className="space-y-1.5">
                      {member.recent_talks.map((talk, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-gray-300 whitespace-nowrap shrink-0">
                            {formatDateShort(talk.date)}
                          </span>
                          <span className="text-white/20">—</span>
                          {talk.topic ? (
                            <span className="text-gray-500 truncate">{talk.topic}</span>
                          ) : (
                            <span className="text-gray-600 italic">No topic</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600 italic">No talks recorded</span>
                  )}
                </div>
              </div>

              {/* Bottom action bar */}
              {canEdit && (
                <div className="border-t border-white/10 pt-3 flex items-center justify-between gap-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-3">
                    {[
                      { label: 'Inactive', checked: !isActive, onChange: (e: React.ChangeEvent<HTMLInputElement>) => { const val = !e.target.checked; setIsActive(val); patchMember({ is_active: val }) } },
                      { label: 'Moved', checked: isMoved, onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setIsMoved(e.target.checked); patchMember({ is_moved: e.target.checked }) } },
                      { label: 'Stake', checked: isStake, onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setIsStake(e.target.checked); patchMember({ is_stake: e.target.checked }) } },
                    ].map(({ label, checked, onChange }) => (
                      <label key={label} className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                        <input type="checkbox" className="rounded accent-[#AAFF00]" checked={checked} onChange={onChange} />
                        {label}
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {onLogSpeaking && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onLogSpeaking(member) }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-[#111111] text-xs font-bold hover:bg-accent/90 transition"
                      >
                        + Talk
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditing(true) }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition"
                    >
                      Edit
                    </button>
                    {onDeleted && (
                      !confirmDelete ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/10 transition"
                        >
                          Delete
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-500">Sure?</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(false) }}
                            className="text-xs font-bold text-gray-500 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition"
                          >
                            No
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteMember() }}
                            className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition"
                          >
                            Yes
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Edit form */
            <div className="p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {talks.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Talk History
                  </div>
                  <div className="space-y-2">
                    {talks.map((t, i) => (
                      <div key={t.id} className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          className={inputCls}
                          value={t.date}
                          onChange={(e) => setTalks(talks.map((x, j) => j === i ? { ...x, date: e.target.value } : x))}
                        />
                        <input
                          type="text"
                          placeholder="Topic…"
                          className={inputCls}
                          value={t.topic}
                          onChange={(e) => setTalks(talks.map((x, j) => j === i ? { ...x, topic: e.target.value } : x))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setEditing(false); setConfirmDelete(false) }}
                  className="flex-1 bg-white/10 text-gray-300 py-2 rounded-lg text-xs font-bold hover:bg-white/20 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex-1 bg-accent text-[#111111] py-2 rounded-lg text-xs font-bold hover:bg-accent/90 transition disabled:opacity-50"
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
