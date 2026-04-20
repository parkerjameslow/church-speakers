export const dynamic = 'force-dynamic'
import db from '@/lib/db'
import { getCategory, getDueStatus, getNextDueDate, formatDateShort } from '@/lib/utils'
import PrintButton from '@/components/PrintButton'

export default async function PrintMembersPage() {
  const rows = db
    .prepare(
      `SELECT m.*, h.name as household_name,
        sr.date as last_spoke_date, sr.topic as last_topic,
        (SELECT COUNT(*) FROM speaking_records WHERE member_id = m.id) as speaking_count
       FROM members m
       LEFT JOIN households h ON h.id = m.household_id
       LEFT JOIN speaking_records sr ON sr.id = (
         SELECT id FROM speaking_records WHERE member_id = m.id ORDER BY date DESC LIMIT 1
       )
       WHERE m.is_active = 1
       ORDER BY m.name`
    )
    .all() as any[]

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 print:p-0">
      <div className="flex items-center justify-between mb-6 print:mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Member Roster</h1>
        <PrintButton />
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-2 pr-3 font-semibold text-gray-700">Name</th>
            <th className="text-left py-2 pr-3 font-semibold text-gray-700">Cat.</th>
            <th className="text-left py-2 pr-3 font-semibold text-gray-700">Last Spoke</th>
            <th className="text-left py-2 pr-3 font-semibold text-gray-700">Next Due</th>
            <th className="text-left py-2 pr-3 font-semibold text-gray-700">Status</th>
            <th className="text-left py-2 font-semibold text-gray-700">Talks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any, i: number) => {
            const category = getCategory(r.birth_date)
            const status = getDueStatus(r.last_spoke_date, r.cadence_months)
            const nextDue = getNextDueDate(r.last_spoke_date, r.cadence_months)
            const statusColor = status === 'overdue' ? 'text-red-600' : status === 'due-soon' ? 'text-amber-600' : 'text-green-600'
            return (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-1.5 pr-3 font-medium text-gray-900">{r.name}</td>
                <td className="py-1.5 pr-3 text-gray-500 capitalize">{category}</td>
                <td className="py-1.5 pr-3 text-gray-600">{r.last_spoke_date ? formatDateShort(r.last_spoke_date) : '—'}</td>
                <td className="py-1.5 pr-3 text-gray-600">{nextDue ? formatDateShort(nextDue.toISOString().split('T')[0]) : '—'}</td>
                <td className={`py-1.5 pr-3 font-medium ${statusColor} capitalize`}>{status}</td>
                <td className="py-1.5 text-gray-500">{r.speaking_count}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-4">Printed {new Date().toLocaleDateString()}</p>
    </div>
  )
}
