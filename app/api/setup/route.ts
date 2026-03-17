import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import db from '@/lib/db'

export async function GET() {
  const count = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c
  return NextResponse.json({ needsSetup: count === 0 })
}

export async function POST(req: NextRequest) {
  const count = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c
  if (count > 0) {
    return NextResponse.json({ error: 'Setup already complete' }, { status: 400 })
  }

  const { name, email, password } = await req.json()
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 12)
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, email, hash, 'bishop')

  return NextResponse.json({ id: result.lastInsertRowid })
}
