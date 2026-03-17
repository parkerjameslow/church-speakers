import db from '@/lib/db'
import { getCategory, getDueStatus, getDaysOverdue, getNextDueDate, formatDateShort } from '@/lib/utils'
import PrintButton from '@/components/PrintButton'

export default async function PrintQueuePage() {
  const rows = db
    .prepare(
      `SELECT m.*, h.name as household_name,
        sr.date as last_spoke_date, sr.topic as last_topic
       FROM members m
       LEFT JOIN households h ON h.id = m.household_id
       LEFT JOIN speaking_records sr ON sr.id = (
         SELECT id FROM speaking_records WHERE member_id = m.id ORDER BY date DESC LIMIT 1
       )
       WHERE m.is_active = 1`
    )
    .all() as any[]

  const enriched = rows.map((m) => ({
    ...m,
    category: getCategory(m.birth_date),
    due_status: getDueStatus(m.last_spoke_date, m.cadence_months),
    next_due_date: getNextDueDate(m.last_spoke_date, m.cadence_months),
    days_overdue: getDaysOverdue(m.last_spoke_date || '', m.cadence_months),
  }))

  const overdue = enriched.filter((m) => m.due_status === 'overdue').sort((a, b) => b.days_overdue - a.days_overdue)
  const dueSoon = enriched.filter((m) => m.due_status === 'due-soon')
  const comingUp = enriched.filter((m) => m.due_status === 'coming-up')
  const never = enriched.filter((m) => m.due_status === 'never')

  const sections = [
    { title: 'Overdue', members: overdue, color: 'text-red-600' },
    { title: 'Due Within 30 Days', members: dueSoon, color: 'text-amber-600' },
    { title: 'Due Within 60 Days', members: comingUp, color: 'text-gray-600' },
    { title: 'Never Spoken', members: never, color: 'text-gray-500' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-8 py-8 print:p-0">
      <div className="flex items-center justify-between mb-6 print:mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Speaker Queue</h1>
        <PrintButton />
      </div>

      {sections.map((s) =>
        s.members.length > 0 ? (
          <section key={s.title} className="mb-6">
            <h2 className={`text-sm font-bold uppercase tracking-wide mb-2 ${s.color}`}>{s.title} ({s.members.length})</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1 pr-4 text-gray-600 font-medium">Name</th>
                  <th className="text-left py-1 pr-4 text-gray-600 font-medium">Category</th>
                  <th className="text-left py-1 pr-4 text-gray-600 font-medium">Last Spoke</th>
                  <th className="text-left py-1 text-gray-600 font-medium">Next Due</th>
                </tr>
              </thead>
              <tbody>
                {s.members.map((m: any) => (
                  <tr key={m.id} className="border-b border-gray-50">
                    <td className="py-1 pr-4 font-medium text-gray-900">{m.name}</td>
                    <td className="py-1 pr-4 text-gray-500 capitalize">{m.category}</td>
                    <td className="py-1 pr-4 text-gray-600">{m.last_spoke_date ? formatDateShort(m.last_spoke_date) : '—'}</td>
                    <td className="py-1 text-gray-600">{m.next_due_date ? formatDateShort(m.next_due_date.toISOString().split('T')[0]) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null
      )}
      <p className="text-xs text-gray-400 mt-4">Printed {new Date().toLocaleDateString()}</p>
    </div>
  )
}
