export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getSession, canEdit } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '50')

  const meetings = db
    .prepare('SELECT * FROM meetings ORDER BY date DESC LIMIT ?')
    .all(limit) as any[]

  const result = meetings.map((m) => {
    const assignments = db
      .prepare(
        `SELECT ma.*, mem.name as member_name FROM meeting_assignments ma
         JOIN members mem ON mem.id = ma.member_id
         WHERE ma.meeting_id = ? ORDER BY ma.order_num`
      )
      .all(m.id)
    return { ...m, assignments }
  })

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !canEdit(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { date, notes, assignments } = await req.json()
  if (!date) return NextResponse.json({ error: 'Date required' }, { status: 400 })

  const existing = db.prepare('SELECT id FROM meetings WHERE date = ?').get(date)
  if (existing) return NextResponse.json({ error: 'Meeting already exists for this date' }, { status: 409 })

  const result = db.prepare('INSERT INTO meetings (date, notes) VALUES (?, ?)').run(date, notes || null)
  const meetingId = result.lastInsertRowid

  if (assignments?.length) {
    const insert = db.prepare(
      'INSERT INTO meeting_assignments (meeting_id, member_id, order_num, topic) VALUES (?, ?, ?, ?)'
    )
    assignments.forEach((a: any, i: number) => {
      insert.run(meetingId, a.member_id, a.order_num ?? i, a.topic || null)
    })
  }

  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(meetingId) as any
  const assigns = db
    .prepare(
      `SELECT ma.*, mem.name as member_name FROM meeting_assignments ma
       JOIN members mem ON mem.id = ma.member_id
       WHERE ma.meeting_id = ? ORDER BY ma.order_num`
    )
    .all(meetingId)

  return NextResponse.json({ ...meeting, assignments: assigns }, { status: 201 })
}
