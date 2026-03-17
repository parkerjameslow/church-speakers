'use client'
import Navigation from '@/components/Navigation'

export default function SettingsPage() {
  return (
    <div className="md:pl-56 pb-20 md:pb-0 min-h-screen">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Settings</h1>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">About</h2>
          <p className="text-sm text-gray-500">
            Sacrament Speaker Tracker — helps you manage who has spoken in sacrament meeting,
            track cadence, and plan upcoming meetings.
          </p>
          <p className="text-sm text-gray-400 mt-3">
            Data is stored locally in <code className="bg-gray-100 px-1 rounded">data/church.db</code> on your machine.
          </p>
        </div>
      </main>
    </div>
  )
}
