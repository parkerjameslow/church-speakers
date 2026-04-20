export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getSession, canEdit } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(params.id) as any
  if (!meeting) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const assignments = db
    .prepare(
      `SELECT ma.*, mem.name as member_name FROM meeting_assignments ma
       JOIN members mem ON mem.id = ma.member_id
       WHERE ma.meeting_id = ? ORDER BY ma.order_num`
    )
    .all(params.id)

  return NextResponse.json({ ...meeting, assignments })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || !canEdit(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { date, notes, assignments } = await req.json()

  db.prepare('UPDATE meetings SET date=?, notes=? WHERE id=?').run(date, notes || null, params.id)

  if (assignments !== undefined) {
    db.prepare('DELETE FROM meeting_assignments WHERE meeting_id = ?').run(params.id)
    if (assignments.length) {
      const insert = db.prepare(
        'INSERT INTO meeting_assignments (meeting_id, member_id, order_num, topic) VALUES (?, ?, ?, ?)'
      )
      assignments.forEach((a: any, i: number) => {
        insert.run(params.id, a.member_id, a.order_num ?? i, a.topic || null)
      })
    }
  }

  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(params.id) as any
  const assigns = db
    .prepare(
      `SELECT ma.*, mem.name as member_name FROM meeting_assignments ma
       JOIN members mem ON mem.id = ma.member_id
       WHERE ma.meeting_id = ? ORDER BY ma.order_num`
    )
    .all(params.id)

  return NextResponse.json({ ...meeting, assignments: assigns })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || !canEdit(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  db.prepare('DELETE FROM meetings WHERE id = ?').run(params.id)
  return NextResponse.json({ ok: true })
}
