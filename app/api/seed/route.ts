export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import db from '@/lib/db'

// POST /api/seed — inserts ~65 fake members + talk history for testing
export async function POST() {
  const today = new Date()

  function daysAgo(n: number) {
    const d = new Date(today)
    d.setDate(d.getDate() - n)
    return d.toISOString().split('T')[0]
  }

  const adults: Array<{
    name: string; phone: string | null; email: string | null
    cadence: number; lastTalk: string | null; topic: string | null
    extraTalks?: Array<{ date: string; topic: string }>
  }> = [
    { name: 'James Anderson',    phone: '801-555-0101', email: 'j.anderson@email.com',  cadence: 12, lastTalk: daysAgo(420), topic: 'Faith in Jesus Christ',       extraTalks: [{ date: daysAgo(790), topic: 'The Atonement' }] },
    { name: 'Sarah Williams',    phone: '801-555-0102', email: 's.williams@email.com',  cadence: 12, lastTalk: daysAgo(45),  topic: 'Gratitude',                   extraTalks: [{ date: daysAgo(410), topic: 'Prayer' }] },
    { name: 'Michael Johnson',   phone: '801-555-0103', email: null,                    cadence: 12, lastTalk: daysAgo(395), topic: 'The Sabbath Day',             extraTalks: [] },
    { name: 'Emily Davis',       phone: '801-555-0104', email: 'e.davis@email.com',     cadence: 12, lastTalk: daysAgo(22),  topic: 'Following the Prophet',       extraTalks: [{ date: daysAgo(390), topic: 'Tithing' }] },
    { name: 'Robert Martinez',   phone: null,           email: 'r.martinez@email.com',  cadence: 24, lastTalk: daysAgo(800), topic: 'Eternal Families',            extraTalks: [] },
    { name: 'Jennifer Garcia',   phone: '801-555-0106', email: null,                    cadence: 12, lastTalk: daysAgo(340), topic: 'The Book of Mormon',          extraTalks: [{ date: daysAgo(700), topic: 'Scripture Study' }] },
    { name: 'David Wilson',      phone: '801-555-0107', email: 'd.wilson@email.com',    cadence: 12, lastTalk: daysAgo(18),  topic: 'Missionary Work',             extraTalks: [] },
    { name: 'Lisa Thompson',     phone: '801-555-0108', email: 'l.thompson@email.com',  cadence: 12, lastTalk: daysAgo(380), topic: 'Repentance',                  extraTalks: [{ date: daysAgo(750), topic: 'Forgiveness' }] },
    { name: 'Christopher White', phone: null,           email: null,                    cadence: 24, lastTalk: daysAgo(900), topic: 'Priesthood Blessings',        extraTalks: [] },
    { name: 'Amanda Harris',     phone: '801-555-0110', email: 'a.harris@email.com',    cadence: 12, lastTalk: daysAgo(55),  topic: 'Covenant Keeping',            extraTalks: [] },
    { name: 'Matthew Lewis',     phone: '801-555-0111', email: null,                    cadence: 12, lastTalk: daysAgo(400), topic: 'Honoring the Sabbath',        extraTalks: [] },
    { name: 'Jessica Robinson',  phone: '801-555-0112', email: 'j.robinson@email.com',  cadence: 6,  lastTalk: daysAgo(210), topic: 'Service',                     extraTalks: [{ date: daysAgo(390), topic: 'Charity' }] },
    { name: 'Daniel Clark',      phone: '801-555-0113', email: 'd.clark@email.com',     cadence: 12, lastTalk: daysAgo(350), topic: 'Temple Worthiness',           extraTalks: [] },
    { name: 'Nicole Rodriguez',  phone: null,           email: 'n.rodriguez@email.com', cadence: 12, lastTalk: daysAgo(30),  topic: 'The Holy Ghost',              extraTalks: [{ date: daysAgo(400), topic: 'Baptism' }] },
    { name: 'Andrew Lee',        phone: '801-555-0115', email: null,                    cadence: 12, lastTalk: daysAgo(410), topic: 'Jesus Christ Our Savior',     extraTalks: [] },
    { name: 'Megan Walker',      phone: '801-555-0116', email: 'm.walker@email.com',    cadence: 12, lastTalk: null,         topic: null },
    { name: 'Joshua Hall',       phone: '801-555-0117', email: null,                    cadence: 24, lastTalk: daysAgo(750), topic: 'General Conference',          extraTalks: [] },
    { name: 'Stephanie Allen',   phone: '801-555-0118', email: 's.allen@email.com',     cadence: 12, lastTalk: daysAgo(60),  topic: 'Spiritual Gifts',             extraTalks: [] },
    { name: 'Ryan Young',        phone: '801-555-0119', email: null,                    cadence: 12, lastTalk: daysAgo(445), topic: 'Personal Revelation',         extraTalks: [] },
    { name: 'Brittany Hernandez',phone: '801-555-0120', email: 'b.hernandez@email.com', cadence: 12, lastTalk: null,         topic: null },
    { name: 'Kevin King',        phone: '801-555-0121', email: 'k.king@email.com',      cadence: 12, lastTalk: daysAgo(200), topic: 'Ministering',                 extraTalks: [{ date: daysAgo(565), topic: 'Home Teaching' }] },
    { name: 'Rachel Wright',     phone: null,           email: 'r.wright@email.com',    cadence: 12, lastTalk: daysAgo(370), topic: 'The Plan of Salvation',       extraTalks: [] },
    { name: 'Brandon Scott',     phone: '801-555-0123', email: null,                    cadence: 12, lastTalk: daysAgo(90),  topic: 'Humility',                    extraTalks: [] },
    { name: 'Samantha Green',    phone: '801-555-0124', email: 's.green@email.com',     cadence: 12, lastTalk: daysAgo(330), topic: 'Living the Law of Chastity',  extraTalks: [] },
    { name: 'Tyler Adams',       phone: '801-555-0125', email: 't.adams@email.com',     cadence: 12, lastTalk: daysAgo(415), topic: 'Enduring to the End',         extraTalks: [] },
    { name: 'Katherine Baker',   phone: null,           email: null,                    cadence: 24, lastTalk: daysAgo(500), topic: 'Sacrament',                   extraTalks: [] },
    { name: 'Aaron Nelson',      phone: '801-555-0127', email: 'a.nelson@email.com',    cadence: 12, lastTalk: daysAgo(28),  topic: 'Obedience',                   extraTalks: [{ date: daysAgo(398), topic: 'Integrity' }] },
    { name: 'Lauren Carter',     phone: '801-555-0128', email: null,                    cadence: 12, lastTalk: daysAgo(385), topic: 'Families Can Be Together',    extraTalks: [] },
    { name: 'Nathan Mitchell',   phone: '801-555-0129', email: 'n.mitchell@email.com',  cadence: 12, lastTalk: null,         topic: null },
    { name: 'Heather Perez',     phone: '801-555-0130', email: 'h.perez@email.com',     cadence: 12, lastTalk: daysAgo(75),  topic: 'The Atonement of Jesus Christ', extraTalks: [] },
    { name: 'Justin Roberts',    phone: null,           email: null,                    cadence: 12, lastTalk: daysAgo(440), topic: 'Preach My Gospel',            extraTalks: [] },
    { name: 'Amber Turner',      phone: '801-555-0132', email: 'a.turner@email.com',    cadence: 12, lastTalk: daysAgo(15),  topic: 'Gratitude to God',            extraTalks: [] },
    { name: 'Patrick Phillips',  phone: '801-555-0133', email: null,                    cadence: 24, lastTalk: daysAgo(600), topic: 'Fasting and Prayer',          extraTalks: [] },
    { name: 'Danielle Campbell', phone: '801-555-0134', email: 'd.campbell@email.com',  cadence: 12, lastTalk: daysAgo(360), topic: 'Heavenly Father\'s Love',     extraTalks: [] },
    { name: 'Steven Parker',     phone: '801-555-0135', email: 's.parker@email.com',    cadence: 12, lastTalk: daysAgo(50),  topic: 'Sharing the Gospel',          extraTalks: [] },
    { name: 'Melissa Evans',     phone: null,           email: 'm.evans@email.com',     cadence: 12, lastTalk: null,         topic: null },
    { name: 'Timothy Edwards',   phone: '801-555-0137', email: 't.edwards@email.com',   cadence: 12, lastTalk: daysAgo(430), topic: 'The Gift of the Holy Ghost',  extraTalks: [] },
    { name: 'Diana Collins',     phone: '801-555-0138', email: null,                    cadence: 12, lastTalk: daysAgo(42),  topic: 'Come Follow Me',              extraTalks: [] },
    { name: 'Jeremy Stewart',    phone: '801-555-0139', email: 'j.stewart@email.com',   cadence: 12, lastTalk: daysAgo(375), topic: 'Light of the World',          extraTalks: [] },
    { name: 'Tiffany Sanchez',   phone: null,           email: 't.sanchez@email.com',   cadence: 12, lastTalk: daysAgo(100), topic: 'Finding Peace',               extraTalks: [] },
    { name: 'Gregory Morris',    phone: '801-555-0141', email: null,                    cadence: 24, lastTalk: daysAgo(850), topic: 'Resurrection',                extraTalks: [] },
    { name: 'Crystal Rogers',    phone: '801-555-0142', email: 'c.rogers@email.com',    cadence: 12, lastTalk: daysAgo(355), topic: 'Integrity and Honesty',       extraTalks: [] },
    { name: 'Sean Reed',         phone: '801-555-0143', email: null,                    cadence: 12, lastTalk: daysAgo(8),   topic: 'Discipleship',                extraTalks: [] },
    { name: 'Vanessa Cook',      phone: '801-555-0144', email: 'v.cook@email.com',      cadence: 12, lastTalk: null,         topic: null },
    { name: 'Marcus Bailey',     phone: null,           email: null,                    cadence: 12, lastTalk: daysAgo(365), topic: 'Joseph Smith\'s Legacy',      extraTalks: [] },
  ]

  const youth: Array<{
    name: string; phone: string | null; cadence: number
    lastTalk: string | null; topic: string | null
  }> = [
    { name: 'Ethan Anderson',   phone: null,           cadence: 12, lastTalk: daysAgo(390), topic: 'Strength of Youth' },
    { name: 'Olivia Williams',  phone: null,           cadence: 12, lastTalk: daysAgo(25),  topic: 'Being a Good Example' },
    { name: 'Noah Johnson',     phone: null,           cadence: 12, lastTalk: daysAgo(410), topic: 'The Book of Mormon' },
    { name: 'Emma Davis',       phone: '801-555-0202', cadence: 12, lastTalk: null,         topic: null },
    { name: 'Liam Martinez',    phone: null,           cadence: 12, lastTalk: daysAgo(50),  topic: 'Prayer' },
    { name: 'Ava Garcia',       phone: null,           cadence: 12, lastTalk: daysAgo(420), topic: 'Honesty' },
    { name: 'Mason Wilson',     phone: null,           cadence: 12, lastTalk: daysAgo(60),  topic: 'Gratitude' },
    { name: 'Sophia Thompson',  phone: '801-555-0208', cadence: 12, lastTalk: daysAgo(380), topic: 'Repentance' },
    { name: 'Lucas White',      phone: null,           cadence: 12, lastTalk: null,         topic: null },
    { name: 'Isabella Harris',  phone: null,           cadence: 12, lastTalk: daysAgo(30),  topic: 'Faith' },
    { name: 'Aiden Lewis',      phone: null,           cadence: 12, lastTalk: daysAgo(400), topic: 'Missionary Prep' },
    { name: 'Mia Robinson',     phone: '801-555-0212', cadence: 12, lastTalk: daysAgo(10),  topic: 'Come Follow Me' },
    { name: 'Jackson Clark',    phone: null,           cadence: 12, lastTalk: null,         topic: null },
    { name: 'Charlotte Lee',    phone: null,           cadence: 12, lastTalk: daysAgo(435), topic: 'Holy Ghost' },
    { name: 'Elijah Rodriguez', phone: null,           cadence: 12, lastTalk: daysAgo(80),  topic: 'Priesthood Duties' },
    { name: 'Amelia Walker',    phone: '801-555-0216', cadence: 12, lastTalk: daysAgo(390), topic: 'Service' },
    { name: 'Carter Hall',      phone: null,           cadence: 12, lastTalk: null,         topic: null },
    { name: 'Harper Allen',     phone: null,           cadence: 12, lastTalk: daysAgo(20),  topic: 'The Savior' },
    { name: 'Sebastian Young',  phone: null,           cadence: 12, lastTalk: daysAgo(450), topic: 'Temple Preparation' },
    { name: 'Evelyn King',      phone: '801-555-0220', cadence: 12, lastTalk: daysAgo(45),  topic: 'Testimony' },
  ]

  // Clear existing seed data to avoid duplicates (skip if non-seeded)
  // We insert with a note in 'notes' field to identify seed data
  db.prepare(`DELETE FROM speaking_records WHERE member_id IN (
    SELECT id FROM members WHERE notes LIKE '%[seed]%'
  )`).run()
  db.prepare(`DELETE FROM members WHERE notes LIKE '%[seed]%'`).run()

  const insertMember = db.prepare(
    `INSERT INTO members (name, phone, email, cadence_months, is_active, notes, category_override, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, '[seed]', ?, datetime('now'), datetime('now'))`
  )

  const insertTalk = db.prepare(
    `INSERT INTO speaking_records (member_id, date, topic, created_at)
     VALUES (?, ?, ?, datetime('now'))`
  )

  let inserted = 0

  for (const a of adults) {
    const res = insertMember.run(a.name, a.phone, a.email, a.cadence, 'adult')
    const id = res.lastInsertRowid
    if (a.lastTalk) {
      insertTalk.run(id, a.lastTalk, a.topic)
      for (const extra of a.extraTalks ?? []) {
        insertTalk.run(id, extra.date, extra.topic)
      }
    }
    inserted++
  }

  for (const y of youth) {
    const res = insertMember.run(y.name, y.phone, null, y.cadence, 'youth')
    const id = res.lastInsertRowid
    if (y.lastTalk) {
      insertTalk.run(id, y.lastTalk, y.topic)
    }
    inserted++
  }

  return NextResponse.json({ ok: true, inserted })
}
