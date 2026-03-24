'use client'
import Navigation from '@/components/Navigation'

export default function ReportsPage() {
  function download(url: string, filename: string) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  return (
    <div className="md:pl-16 pb-20 md:pb-0 min-h-screen">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Reports & Exports</h1>

        <div className="space-y-4">
          <ReportCard
            title="Speaking History"
            description="All speaking records with dates, topics, and speaker details."
            actions={[
              {
                label: 'Download CSV',
                icon: '📄',
                onClick: () => download('/api/export/csv?type=records', 'speaking-history.csv'),
              },
              {
                label: 'Print / PDF',
                icon: '🖨️',
                onClick: () => window.open('/print/records', '_blank'),
              },
            ]}
          />

          <ReportCard
            title="Member Roster"
            description="Full member list with contact info, cadence settings, and last spoke dates."
            actions={[
              {
                label: 'Download CSV',
                icon: '📄',
                onClick: () => download('/api/export/csv?type=members', 'member-roster.csv'),
              },
              {
                label: 'Print / PDF',
                icon: '🖨️',
                onClick: () => window.open('/print/members', '_blank'),
              },
            ]}
          />

          <ReportCard
            title="Speaker Queue"
            description="Printable view of the current speaking queue sorted by due status."
            actions={[
              {
                label: 'Print / PDF',
                icon: '🖨️',
                onClick: () => window.open('/print/queue', '_blank'),
              },
            ]}
          />
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-xl text-sm text-gray-700">
          <strong>Tip:</strong> Use your browser's Print dialog (Ctrl+P / Cmd+P) on any print page to save as PDF.
        </div>
      </main>
    </div>
  )
}

function ReportCard({
  title,
  description,
  actions,
}: {
  title: string
  description: string
  actions: { label: string; icon: string; onClick: () => void }[]
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-1 mb-4">{description}</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 transition"
          >
            <span>{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}
