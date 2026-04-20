export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getCategory } from '@/lib/utils'

function escape(val: string | null | undefined): string {
  if (val == null) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'records'

  let csv = ''

  if (type === 'records') {
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

    csv = 'Date,Name,Category,Household,Topic,Duration (min),Notes\n'
    csv += rows
      .map((r) => [
        escape(r.date),
        escape(r.member_name),
        escape(getCategory(r.birth_date)),
        escape(r.household_name),
        escape(r.topic),
        escape(r.duration_minutes),
        escape(r.notes),
      ].join(','))
      .join('\n')
  } else if (type === 'members') {
    const rows = db
      .prepare(
        `SELECT m.name, m.birth_date, m.phone, m.email, h.name as household_name,
          m.cadence_months, m.is_active, m.notes,
          sr.date as last_spoke_date, sr.topic as last_topic,
          (SELECT COUNT(*) FROM speaking_records WHERE member_id = m.id) as total_talks
         FROM members m
         LEFT JOIN households h ON h.id = m.household_id
         LEFT JOIN speaking_records sr ON sr.id = (
           SELECT id FROM speaking_records WHERE member_id = m.id ORDER BY date DESC LIMIT 1
         )
         ORDER BY m.name`
      )
      .all() as any[]

    csv = 'Name,Category,Birth Date,Phone,Email,Household,Cadence (months),Active,Last Spoke,Last Topic,Total Talks,Notes\n'
    csv += rows
      .map((r) => [
        escape(r.name),
        escape(getCategory(r.birth_date)),
        escape(r.birth_date),
        escape(r.phone),
        escape(r.email),
        escape(r.household_name),
        escape(r.cadence_months),
        r.is_active ? 'Yes' : 'No',
        escape(r.last_spoke_date),
        escape(r.last_topic),
        escape(r.total_talks),
        escape(r.notes),
      ].join(','))
      .join('\n')
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${type}-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
