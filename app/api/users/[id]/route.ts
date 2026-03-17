import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import db from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'bishop') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { name, email, password, role } = await req.json()
  if (password) {
    const hash = await bcrypt.hash(password, 12)
    db.prepare('UPDATE users SET name=?, email=?, password_hash=?, role=? WHERE id=?').run(
      name, email, hash, role, params.id
    )
  } else {
    db.prepare('UPDATE users SET name=?, email=?, role=? WHERE id=?').run(
      name, email, role, params.id
    )
  }

  const user = db
    .prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?')
    .get(params.id)
  return NextResponse.json(user)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'bishop') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const count = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c
  if (count <= 1) {
    return NextResponse.json({ error: 'Cannot delete the last user' }, { status: 400 })
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(params.id)
  return NextResponse.json({ ok: true })
}
