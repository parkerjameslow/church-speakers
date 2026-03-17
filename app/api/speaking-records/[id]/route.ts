import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { getSession, canEdit } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || !canEdit(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { date, topic, duration_minutes, notes } = await req.json()
  db.prepare(
    'UPDATE speaking_records SET date=?, topic=?, duration_minutes=?, notes=? WHERE id=?'
  ).run(date, topic || null, duration_minutes || null, notes || null, params.id)

  const row = db
    .prepare(
      `SELECT sr.*, m.name as member_name FROM speaking_records sr
       JOIN members m ON m.id = sr.member_id WHERE sr.id = ?`
    )
    .get(params.id)

  return NextResponse.json(row)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || !canEdit(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  db.prepare('DELETE FROM speaking_records WHERE id = ?').run(params.id)
  return NextResponse.json({ ok: true })
}
