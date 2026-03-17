'use client'
import { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import { User } from '@/types'

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string; userId: number } | null>(null)
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'counselor' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    const [uRes, meRes] = await Promise.all([fetch('/api/users'), fetch('/api/auth/me')])
    if (uRes.ok) setUsers(await uRes.json())
    if (meRes.ok) setCurrentUser(await meRes.json())
  }, [])

  useEffect(() => { load() }, [load])

  const isBishop = currentUser?.role === 'bishop'

  async function addUser(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Failed to add user')
      setSaving(false)
      return
    }
    setNewUser({ name: '', email: '', password: '', role: 'counselor' })
    setShowAddUser(false)
    setSuccess('User added successfully.')
    setSaving(false)
    load()
  }

  async function deleteUser(userId: number, name: string) {
    if (!confirm(`Remove ${name}'s access?`)) return
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
    if (res.ok) { setSuccess('User removed.'); load() }
    else {
      const d = await res.json()
      setError(d.error || 'Failed to remove user')
    }
  }

  if (!currentUser) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>

  return (
    <div className="md:pl-56 pb-20 md:pb-0 min-h-screen">
      <Navigation userName={currentUser.name} role={currentUser.role} />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Settings</h1>

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl p-3">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
            {error}
          </div>
        )}

        {/* User Management */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">User Access</h2>
            {isBishop && (
              <button
                onClick={() => setShowAddUser(!showAddUser)}
                className="text-sm bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg transition"
              >
                + Add User
              </button>
            )}
          </div>

          {showAddUser && isBishop && (
            <form onSubmit={addUser} className="mb-4 bg-gray-50 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-700">New User</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Name</label>
                  <input type="text" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Role</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                    <option value="bishop">Bishop</option>
                    <option value="counselor">Counselor</option>
                    <option value="clerk">Clerk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Email</label>
                  <input type="email" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Password</label>
                  <input type="password" required minLength={8} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddUser(false)} className="flex-1 border border-gray-300 text-gray-600 text-sm py-1.5 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-700 hover:bg-blue-800 text-white text-sm py-1.5 rounded-lg transition disabled:opacity-50">{saving ? 'Adding…' : 'Add User'}</button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <div className="font-medium text-sm text-gray-900 flex items-center gap-2">
                    {u.name}
                    {u.id === currentUser.userId && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">You</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{u.email} · <span className="capitalize">{u.role}</span></div>
                </div>
                {isBishop && u.id !== currentUser.userId && (
                  <button
                    onClick={() => deleteUser(u.id, u.name)}
                    className="text-xs text-red-400 hover:text-red-600 transition"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Role info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Role Permissions</h2>
          <div className="space-y-2 text-sm">
            {[
              { role: 'Bishop', desc: 'Full access — add/edit/delete members, meetings, users, and records.' },
              { role: 'Counselor', desc: 'Can add/edit members, log speaking records, and plan meetings. Cannot delete members or manage users.' },
              { role: 'Clerk', desc: 'Read-only access. Can view all data but cannot make changes.' },
            ].map((r) => (
              <div key={r.role} className="flex gap-3">
                <span className="font-medium text-gray-700 w-24 shrink-0">{r.role}</span>
                <span className="text-gray-500">{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
