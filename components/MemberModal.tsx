'use client'
import { useState, useEffect } from 'react'
import { Member, Household } from '@/types'

interface Props {
  member?: Member | null
  onClose: () => void
  onSaved: () => void
}

const CADENCE_OPTIONS = [3, 6, 9, 12, 18, 24, 36]

export default function MemberModal({ member, onClose, onSaved }: Props) {
  const [households, setHouseholds] = useState<Household[]>([])
  const [newHousehold, setNewHousehold] = useState('')
  const [form, setForm] = useState({
    name: member?.name ?? '',
    birth_date: member?.birth_date ?? '',
    phone: member?.phone ?? '',
    email: member?.email ?? '',
    household_id: member?.household_id?.toString() ?? '',
    notes: member?.notes ?? '',
    cadence_months: member?.cadence_months?.toString() ?? '12',
    is_active: member?.is_active !== false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/households')
      .then((r) => r.json())
      .then(setHouseholds)
  }, [])

  async function addHousehold() {
    if (!newHousehold.trim()) return
    const res = await fetch('/api/households', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newHousehold.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setHouseholds((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setForm((f) => ({ ...f, household_id: data.id.toString() }))
      setNewHousehold('')
    }
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
      household_id: form.household_id ? parseInt(form.household_id) : null,
      notes: form.notes || null,
      cadence_months: parseInt(form.cadence_months),
      is_active: form.is_active,
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
    onSaved()
  }

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{member ? 'Edit Member' : 'Add Member'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birth Date <span className="text-gray-400 font-normal">(for youth/adult)</span>
              </label>
              <input type="date" className={inputClass} value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Speaking Cadence</label>
              <select className={inputClass} value={form.cadence_months} onChange={(e) => setForm({ ...form, cadence_months: e.target.value })}>
                {CADENCE_OPTIONS.map((n) => (
                  <option key={n} value={n}>Every {n} months</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Household</label>
            <select className={inputClass} value={form.household_id} onChange={(e) => setForm({ ...form, household_id: e.target.value })}>
              <option value="">— None —</option>
              {households.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                placeholder="New household name…"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400"
                value={newHousehold}
                onChange={(e) => setNewHousehold(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHousehold())}
              />
              <button type="button" onClick={addHousehold} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition">
                Add
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} placeholder="Availability, preferences, special notes…" className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          {member && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
              Active member (include in queue)
            </label>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-medium py-2 rounded-lg text-sm hover:bg-gray-50 transition">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-gray-900 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm transition disabled:opacity-50">
              {saving ? 'Saving…' : member ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
