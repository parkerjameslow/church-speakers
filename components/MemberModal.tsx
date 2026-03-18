'use client'
import { useState, useEffect } from 'react'
import { Member } from '@/types'

interface Props {
  member?: Member | null
  onClose: () => void
  onSaved: () => void
}

const CADENCE_OPTIONS = [6, 12, 24]

function getDefaultCadence(category: 'adult' | 'youth'): string {
  if (typeof window === 'undefined') return '12'
  return localStorage.getItem(`default_${category}_cadence`) ?? '12'
}

export default function MemberModal({ member, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: member?.name ?? '',
    birth_date: member?.birth_date ?? '',
    phone: member?.phone ?? '',
    email: member?.email ?? '',
    notes: member?.notes ?? '',
    cadence_months: member?.cadence_months?.toString() ?? '12',
    category: (member?.category_override ?? member?.category ?? 'adult') as 'adult' | 'youth',
    is_active: member?.is_active !== false,
    last_talk_date: '',
    last_talk_topic: '',
    is_moved: !!member?.is_moved,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // On mount for new members, apply saved defaults
  useEffect(() => {
    if (!member) {
      setForm((f) => ({ ...f, cadence_months: getDefaultCadence(f.category) }))
    }
  }, [member])

  // When category changes for new members, re-apply the default cadence
  function handleCategoryChange(cat: 'adult' | 'youth') {
    setForm((f) => ({
      ...f,
      category: cat,
      cadence_months: member ? f.cadence_months : (localStorage.getItem(`default_${cat}_cadence`) ?? '12'),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const body = {
      name: form.name,
      birth_date: form.birth_date || null,
      phone: form.phone || null,
      email: form.email || null,
      household_id: null,
      notes: form.notes || null,
      cadence_months: parseInt(form.cadence_months),
      is_active: form.is_active,
      is_moved: form.is_moved,
      category_override: form.category,
    }

    const url = member ? `/api/members/${member.id}` : '/api/members'
    const method = member ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Failed to save')
      setSaving(false)
      return
    }

    // If adding a new member with a last talk date, log the speaking record
    if (!member && form.last_talk_date) {
      const newMember = await res.json()
      await fetch('/api/speaking-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: newMember.id,
          date: form.last_talk_date,
          topic: form.last_talk_topic || null,
        }),
      })
    }

    onSaved()
  }

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{member ? 'Edit Member' : 'Add Member'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Cadence + Category toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Speaking Cadence</label>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex rounded-lg border border-gray-200 overflow-hidden shrink-0">
                {([6, 12] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm({ ...form, cadence_months: String(n) })}
                    className={`px-3 py-2 text-sm font-semibold transition ${
                      form.cadence_months === String(n)
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {n} mo
                  </button>
                ))}
              </div>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden shrink-0">
                {(['adult', 'youth'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-3 py-2 text-sm font-semibold capitalize transition ${
                      form.category === cat
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {cat === 'adult' ? 'Adult' : 'Youth'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Birth date (optional, for age-based auto-category) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birth Date <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              className={inputClass}
              value={form.birth_date}
              onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Availability, preferences, special notes…"
              className={inputClass}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-4">
            {member && (
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: !e.target.checked })}
                  className="rounded"
                />
                Inactive
              </label>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_moved}
                onChange={(e) => setForm({ ...form, is_moved: e.target.checked })}
                className="rounded"
              />
              Moved
            </label>
          </div>

          {!member && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Last Talk (optional)</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.last_talk_date}
                    onChange={(e) => setForm({ ...form, last_talk_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                  <input
                    type="text"
                    placeholder="Talk topic…"
                    className={inputClass}
                    value={form.last_talk_topic}
                    onChange={(e) => setForm({ ...form, last_talk_topic: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 font-medium py-2 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gray-900 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50"
            >
              {saving ? 'Saving…' : member ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
