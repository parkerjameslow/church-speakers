import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getSession, canEdit } from '@/lib/auth'
import { getDueStatus, getDaysOverdue, getCategory, getNextDueDate } from '@/lib/utils'
import { Member, Category } from '@/types'

function enrichMember(row: any): Member {
  const category: Category = (row.category_override as Category) || getCategory(row.birth_date)
  const dueStatus = getDueStatus(row.last_spoke_date, row.cadence_months)
  const nextDue = getNextDueDate(row.last_spoke_date, row.cadence_months)
  const daysOverdue =
    dueStatus === 'overdue'
      ? getDaysOverdue(row.last_spoke_date, row.cadence_months)
      : 0
  return {
    ...row,
    is_active: row.is_active === 1,
    is_moved: row.is_moved === 1,
    is_stake: row.is_stake === 1,
    category,
    due_status: dueStatus,
    next_due_date: nextDue ? nextDue.toISOString().split('T')[0] : null,
    days_overdue: daysOverdue,
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const search = searchParams.get('search') || ''
  const includeInactive = searchParams.get('includeInactive') === 'true'

  const rows = db
    .prepare(
      `SELECT m.*,
        h.name as household_name,
        sr.date as last_spoke_date,
        sr.topic as last_topic,
        (SELECT COUNT(*) FROM speaking_records WHERE member_id = m.id) as speaking_count
      FROM members m
      LEFT JOIN households h ON m.household_id = h.id
      LEFT JOIN speaking_records sr ON sr.id = (
        SELECT id FROM speaking_records WHERE member_id = m.id ORDER BY date DESC, id DESC LIMIT 1
      )
      WHERE (? = '' OR m.name LIKE ?)
      ORDER BY m.name`
    )
    .all(search, `%${search}%`) as any[]

  // Batch fetch up to 3 recent talks per member
  let talksByMember: Record<number, { id: number; date: string; topic: string | null }[]> = {}
  if (rows.length > 0) {
    const ids = rows.map((r: any) => r.id)
    const placeholders = ids.map(() => '?').join(',')
    const allTalks = db
      .prepare(
        `SELECT id, member_id, date, topic FROM speaking_records
         WHERE member_id IN (${placeholders})
         ORDER BY date DESC, id DESC`
      )
      .all(...ids) as any[]

    for (const t of allTalks) {
      if (!talksByMember[t.member_id]) talksByMember[t.member_id] = []
      if (talksByMember[t.member_id].length < 3) {
        talksByMember[t.member_id].push({ id: t.id, date: t.date, topic: t.topic })
      }
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let members = rows.map((row) => {
    const enriched = enrichMember(row)
    const daysSince = row.last_spoke_date
      ? Math.floor(
          (today.getTime() - new Date(row.last_spoke_date + 'T00:00:00').getTime()) / 86400000
        )
      : null
    return {
      ...enriched,
      recent_talks: talksByMember[row.id] || [],
      days_since_last_talk: daysSince,
    }
  })

  if (category) {
    members = members.filter((m) => m.category === category)
  }

  return NextResponse.json(members)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !canEdit(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { name, birth_date, phone, email, household_id, notes, cadence_months } = body
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const result = db
    .prepare(
      `INSERT INTO members (name, birth_date, phone, email, household_id, notes, cadence_months)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      name,
      birth_date || null,
      phone || null,
      email || null,
      household_id || null,
      notes || null,
      cadence_months || 12
    )

  const member = db
    .prepare('SELECT m.*, h.name as household_name FROM members m LEFT JOIN households h ON m.household_id = h.id WHERE m.id = ?')
    .get(result.lastInsertRowid) as any

  return NextResponse.json(enrichMember({ ...member, last_spoke_date: null, last_topic: null, speaking_count: 0 }), { status: 201 })
}
