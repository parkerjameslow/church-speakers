export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('memberId')
  const limit = parseInt(searchParams.get('limit') || '100')

  const rows = memberId
    ? db
        .prepare(
          `SELECT sr.*, m.name as member_name FROM speaking_records sr
           JOIN members m ON m.id = sr.member_id
           WHERE sr.member_id = ? ORDER BY sr.date DESC LIMIT ?`
        )
        .all(memberId, limit)
    : db
        .prepare(
          `SELECT sr.*, m.name as member_name FROM speaking_records sr
           JOIN members m ON m.id = sr.member_id
           ORDER BY sr.date DESC LIMIT ?`
        )
        .all(limit)

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { member_id, date, topic, duration_minutes, notes } = await req.json()
  if (!member_id || !date) {
    return NextResponse.json({ error: 'member_id and date required' }, { status: 400 })
  }

  const result = db
    .prepare(
      `INSERT INTO speaking_records (member_id, date, topic, duration_minutes, notes)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(member_id, date, topic || null, duration_minutes || null, notes || null)

  // If there's a meeting on this date, also create assignment if not exists
  const meeting = db.prepare('SELECT id FROM meetings WHERE date = ?').get(date) as any
  if (meeting) {
    const existing = db
      .prepare('SELECT id FROM meeting_assignments WHERE meeting_id = ? AND member_id = ?')
      .get(meeting.id, member_id)
    if (!existing) {
      const maxOrder = (
        db
          .prepare('SELECT MAX(order_num) as m FROM meeting_assignments WHERE meeting_id = ?')
          .get(meeting.id) as any
      ).m ?? -1
      db.prepare(
        'INSERT INTO meeting_assignments (meeting_id, member_id, order_num, topic) VALUES (?, ?, ?, ?)'
      ).run(meeting.id, member_id, maxOrder + 1, topic || null)
    }
  }

  const row = db
    .prepare(
      `SELECT sr.*, m.name as member_name FROM speaking_records sr
       JOIN members m ON m.id = sr.member_id WHERE sr.id = ?`
    )
    .get(result.lastInsertRowid)

  return NextResponse.json(row, { status: 201 })
}
