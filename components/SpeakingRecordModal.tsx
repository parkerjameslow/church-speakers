'use client'
import { useState } from 'react'
import { Member } from '@/types'

interface Props {
  member: Member
  onClose: () => void
  onSaved: () => void
}

export default function SpeakingRecordModal({ member, onClose, onSaved }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ date: today, topic: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/speaking-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        member_id: member.id,
        date: form.date,
        topic: form.topic || null,
        duration_minutes: null,
        notes: form.notes || null,
      }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Failed to save')
      setSaving(false)
      return
    }
    onSaved()
  }

  const inputCls = 'w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#AAFF00]'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50">
          <div>
            <h2 className="font-black text-[#1C1C1E] text-sm">Log Speaking Record</h2>
            <p className="text-xs text-gray-400 mt-0.5">{member.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-[#1C1C1E] transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date *</label>
            <input type="date" required className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Topic</label>
            <input type="text" placeholder="e.g. Faith, Prayer, Gratitude…" className={inputCls} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Notes</label>
            <textarea rows={2} className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-600 font-bold py-2.5 rounded-xl text-sm hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#AAFF00] text-[#1C1C1E] font-bold py-2.5 rounded-xl text-sm hover:bg-[#99ee00] transition disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
