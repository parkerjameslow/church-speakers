'use client'
import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'

const CADENCE_OPTIONS = [6, 12, 24]

export default function SettingsPage() {
  const [adultCadence, setAdultCadence] = useState('12')
  const [youthCadence, setYouthCadence] = useState('12')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setAdultCadence(localStorage.getItem('default_adult_cadence') ?? '12')
    setYouthCadence(localStorage.getItem('default_youth_cadence') ?? '12')
  }, [])

  function saveDefaults() {
    localStorage.setItem('default_adult_cadence', adultCadence)
    localStorage.setItem('default_youth_cadence', youthCadence)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="md:pl-[60px] pb-20 md:pb-0 min-h-screen">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>

        {/* Default Cadence */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Default Speaking Cadence</h2>
          <p className="text-sm text-gray-400 mb-4">
            Applied automatically when adding a new member.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50">
              <div>
                <div className="text-sm font-semibold text-gray-800">Adults</div>
                <div className="text-xs text-gray-400 mt-0.5">Default cadence for adult members</div>
              </div>
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
                value={adultCadence}
                onChange={(e) => setAdultCadence(e.target.value)}
              >
                {CADENCE_OPTIONS.map((n) => (
                  <option key={n} value={n}>Every {n} months</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50">
              <div>
                <div className="text-sm font-semibold text-gray-800">Youth</div>
                <div className="text-xs text-gray-400 mt-0.5">Default cadence for youth members</div>
              </div>
              <select
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
                value={youthCadence}
                onChange={(e) => setYouthCadence(e.target.value)}
              >
                {CADENCE_OPTIONS.map((n) => (
                  <option key={n} value={n}>Every {n} months</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={saveDefaults}
              className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              Save Defaults
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
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
