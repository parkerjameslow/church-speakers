import db from '@/lib/db'
import { getCategory } from '@/lib/utils'
import PrintButton from '@/components/PrintButton'

export default async function PrintRecordsPage() {
  const rows = db
    .prepare(
      `SELECT sr.date, m.name as member_name, m.birth_date, sr.topic,
        sr.duration_minutes, sr.notes, h.name as household_name
       FROM speaking_records sr
       JOIN members m ON m.id = sr.member_id
       LEFT JOIN households h ON h.id = m.household_id
       ORDER BY sr.date DESC, m.name`
    )
    .all() as any[]

  return (
    <div className="max-w-4xl mx-auto px-8 py-8 print:p-0">
      <div className="flex items-center justify-between mb-6 print:mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Speaking History</h1>
        <PrintButton />
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-2 pr-4 font-semibold text-gray-700">Date</th>
            <th className="text-left py-2 pr-4 font-semibold text-gray-700">Name</th>
            <th className="text-left py-2 pr-4 font-semibold text-gray-700">Category</th>
            <th className="text-left py-2 pr-4 font-semibold text-gray-700">Topic</th>
            <th className="text-left py-2 font-semibold text-gray-700">Duration</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any, i: number) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-1.5 pr-4 text-gray-600 whitespace-nowrap">{r.date}</td>
              <td className="py-1.5 pr-4 font-medium text-gray-900">{r.member_name}</td>
              <td className="py-1.5 pr-4 text-gray-500 capitalize">{getCategory(r.birth_date)}</td>
              <td className="py-1.5 pr-4 text-gray-600">{r.topic ?? '—'}</td>
              <td className="py-1.5 text-gray-500">{r.duration_minutes ? `${r.duration_minutes}m` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-400 mt-4">Printed {new Date().toLocaleDateString()}</p>
    </div>
  )
}
