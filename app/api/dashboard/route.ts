export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import db from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getDueStatus, getDaysOverdue, getCategory, getNextDueDate } from '@/lib/utils'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const members = db
    .prepare(
      `SELECT m.*, h.name as household_name,
        sr.date as last_spoke_date, sr.topic as last_topic
       FROM members m
       LEFT JOIN households h ON m.household_id = h.id
       LEFT JOIN speaking_records sr ON sr.id = (
         SELECT id FROM speaking_records WHERE member_id = m.id ORDER BY date DESC, id DESC LIMIT 1
       )
       WHERE m.is_active = 1`
    )
    .all() as any[]

  const enriched = members.map((m) => {
    const category = getCategory(m.birth_date)
    const due_status = getDueStatus(m.last_spoke_date, m.cadence_months)
    const nextDue = getNextDueDate(m.last_spoke_date, m.cadence_months)
    return {
      ...m,
      category,
      due_status,
      next_due_date: nextDue ? nextDue.toISOString().split('T')[0] : null,
      days_overdue: due_status === 'overdue' ? getDaysOverdue(m.last_spoke_date, m.cadence_months) : 0,
    }
  })

  const adults = enriched.filter((m) => m.category === 'adult')
  const youth = enriched.filter((m) => m.category === 'youth')

  const overdue = enriched.filter((m) => m.due_status === 'overdue')
    .sort((a, b) => b.days_overdue - a.days_overdue)
  const dueSoon = enriched.filter((m) => m.due_status === 'due-soon')
    .sort((a, b) => (a.next_due_date ?? '').localeCompare(b.next_due_date ?? ''))
  const comingUp = enriched.filter((m) => m.due_status === 'coming-up')
    .sort((a, b) => (a.next_due_date ?? '').localeCompare(b.next_due_date ?? ''))
  const neverSpoken = enriched.filter((m) => m.due_status === 'never')

  const year = new Date().getFullYear()
  const meetingsThisYear = (
    db.prepare(`SELECT COUNT(*) as c FROM meetings WHERE date LIKE '${year}%'`).get() as { c: number }
  ).c
  const recordsThisYear = (
    db.prepare(`SELECT COUNT(*) as c FROM speaking_records WHERE date LIKE '${year}%'`).get() as { c: number }
  ).c

  const recentMeetings = db
    .prepare('SELECT * FROM meetings ORDER BY date DESC LIMIT 5')
    .all() as any[]

  const recentMeetingsWithAssignments = recentMeetings.map((m) => ({
    ...m,
    assignments: db
      .prepare(
        `SELECT ma.*, mem.name as member_name FROM meeting_assignments ma
         JOIN members mem ON mem.id = ma.member_id
         WHERE ma.meeting_id = ? ORDER BY ma.order_num`
      )
      .all(m.id),
  }))

  return NextResponse.json({
    stats: {
      totalAdults: adults.length,
      totalYouth: youth.length,
      meetingsThisYear,
      recordsThisYear,
      overdueCount: overdue.length,
      dueSoonCount: dueSoon.length,
    },
    queue: { overdue, dueSoon, comingUp, neverSpoken },
    recentMeetings: recentMeetingsWithAssignments,
  })
}
