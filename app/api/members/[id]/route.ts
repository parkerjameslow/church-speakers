import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getSession, canEdit } from '@/lib/auth'
import { getDueStatus, getDaysOverdue, getCategory, getNextDueDate } from '@/lib/utils'

function enrichMember(row: any) {
  const category = getCategory(row.birth_date)
  const dueStatus = getDueStatus(row.last_spoke_date, row.cadence_months)
  const nextDue = getNextDueDate(row.last_spoke_date, row.cadence_months)
  return {
    ...row,
    is_active: row.is_active === 1,
    category,
    due_status: dueStatus,
    next_due_date: nextDue ? nextDue.toISOString().split('T')[0] : null,
    days_overdue: dueStatus === 'overdue' ? getDaysOverdue(row.last_spoke_date, row.cadence_months) : 0,
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const row = db
    .prepare(
      `SELECT m.*, h.name as household_name,
        sr.date as last_spoke_date, sr.topic as last_topic,
        (SELECT COUNT(*) FROM speaking_records WHERE member_id = m.id) as speaking_count
       FROM members m
       LEFT JOIN households h ON m.household_id = h.id
       LEFT JOIN speaking_records sr ON sr.id = (
         SELECT id FROM speaking_records WHERE member_id = m.id ORDER BY date DESC, id DESC LIMIT 1
       )
       WHERE m.id = ?`
    )
    .get(params.id) as any

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(enrichMember(row))
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || !canEdit(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { name, birth_date, phone, email, household_id, notes, cadence_months, is_active } = body

  db.prepare(
    `UPDATE members SET name=?, birth_date=?, phone=?, email=?, household_id=?,
     notes=?, cadence_months=?, is_active=?, updated_at=datetime('now')
     WHERE id=?`
  ).run(
    name,
    birth_date || null,
    phone || null,
    email || null,
    household_id || null,
    notes || null,
    cadence_months || 12,
    is_active ? 1 : 0,
    params.id
  )

  const row = db
    .prepare(
      `SELECT m.*, h.name as household_name,
        sr.date as last_spoke_date, sr.topic as last_topic,
        (SELECT COUNT(*) FROM speaking_records WHERE member_id = m.id) as speaking_count
       FROM members m
       LEFT JOIN households h ON m.household_id = h.id
       LEFT JOIN speaking_records sr ON sr.id = (
         SELECT id FROM speaking_records WHERE member_id = m.id ORDER BY date DESC, id DESC LIMIT 1
       )
       WHERE m.id = ?`
    )
    .get(params.id) as any

  return NextResponse.json(enrichMember(row))
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'bishop') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  db.prepare('DELETE FROM members WHERE id = ?').run(params.id)
  return NextResponse.json({ ok: true })
}
