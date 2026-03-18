import { DatabaseSync } from 'node:sqlite'

const db = new DatabaseSync('./data/church.db')

// Ensure migration columns exist
try { db.exec(`ALTER TABLE members ADD COLUMN is_moved INTEGER NOT NULL DEFAULT 0`) } catch {}
try { db.exec(`ALTER TABLE members ADD COLUMN is_stake INTEGER NOT NULL DEFAULT 0`) } catch {}

// 2024 speaking records — date is 1st of each month (no specific Sunday dates provided)
const records = [
  // January 2024
  { date: '2024-01-01', name: 'Breanna Dennis' },
  { date: '2024-01-01', name: 'Jacob Ericksen' },
  { date: '2024-01-01', name: 'Taylor Heckel' },
  { date: '2024-01-01', name: 'Stephanie Ricks' },
  { date: '2024-01-01', name: 'Ryker Son' },
  { date: '2024-01-01', name: 'Peyton Erickson' },
  // February 2024
  { date: '2024-02-01', name: 'Kyndal Green' },
  { date: '2024-02-01', name: 'Carolyn Pack' },
  { date: '2024-02-01', name: 'Rhonda Paul' },
  { date: '2024-02-01', name: 'Austin Clegg' },
  { date: '2024-02-01', name: 'Neelys' },
  // March 2024
  { date: '2024-03-01', name: 'Caden Potts' },
  { date: '2024-03-01', name: 'Brianna Hollberg' },
  { date: '2024-03-01', name: 'Joy Laudie' },
  { date: '2024-03-01', name: 'Dee Riggs' },
  { date: '2024-03-01', name: 'Seth Hilton' },
  { date: '2024-03-01', name: 'Chris Egbert' },
  { date: '2024-03-01', name: 'Hannah Lloyd' },
  { date: '2024-03-01', name: 'Kevin Miles' },
  { date: '2024-03-01', name: 'Tyler Goff' },
  // April 2024 (skipping "HC Speaker" — not a specific person)
  { date: '2024-04-01', name: 'Bryson Siefert' },
  { date: '2024-04-01', name: 'Amanda Russell' },
  { date: '2024-04-01', name: 'Kruse Warnick' },
  // May 2024
  { date: '2024-05-01', name: 'Janessa Lloyd' },
  { date: '2024-05-01', name: 'Howard Little' },
  { date: '2024-05-01', name: 'Marci Clegg' },
  { date: '2024-05-01', name: 'Karen Ericksen' },
  { date: '2024-05-01', name: 'Nate Pyfer' },
  { date: '2024-05-01', name: 'Chase Warnick' },
  { date: '2024-05-01', name: 'Tammy Starr' },
  { date: "2024-05-01", name: "K'Anne Carlson" },
  { date: '2024-05-01', name: 'Joseph Beck' },
  { date: '2024-05-01', name: 'Steven Johnson' },
  { date: '2024-05-01', name: 'Heather Wilkins' },
  // June 2024
  { date: '2024-06-01', name: 'Jon May' },
  { date: '2024-06-01', name: 'Mike Southam' },
  { date: '2024-06-01', name: 'Chase Warnick' },
  { date: '2024-06-01', name: 'Anne Bates' },
  { date: '2024-06-01', name: 'Andrea Beck' },
  { date: '2024-06-01', name: 'Heather Wilkins' },
  { date: '2024-06-01', name: 'Marie Egbert' },
  { date: '2024-06-01', name: 'Sherrie Goff' },
  { date: '2024-06-01', name: 'Danny Mann' },
  { date: '2024-06-01', name: 'Paul Ricks' },
  { date: '2024-06-01', name: 'Phobe Egbert' },
  { date: '2024-06-01', name: 'Ruby Pifer' },
  { date: '2024-06-01', name: 'Addie Low' },
  { date: '2024-06-01', name: 'Shale Goff' },
  // July 2024
  { date: '2024-07-01', name: 'Stratton Nielsen' },
  { date: '2024-07-01', name: 'Brenda Miles' },
  { date: '2024-07-01', name: 'Alissa Reynolds' },
  { date: '2024-07-01', name: 'Paul Ricks' },
  { date: '2024-07-01', name: 'Jerom Beck' },
  { date: '2024-07-01', name: 'David Moon' },
  { date: '2024-07-01', name: 'Brad Mason' },
  { date: '2024-07-01', name: 'Colby Paul' },
  { date: '2024-07-01', name: 'Katelyn Green' },
  { date: '2024-07-01', name: 'Haylee Southam' },
  // August 2024
  { date: '2024-08-01', name: 'Sara Paul' },
  { date: '2024-08-01', name: 'Ryan Goff' },
  { date: '2024-08-01', name: 'Colby Paul' },
  { date: '2024-08-01', name: 'Kristen Durrant' },
  { date: '2024-08-01', name: 'Paul Sperry' },
  { date: '2024-08-01', name: 'Ryker Son' },
  // September 2024
  { date: '2024-09-01', name: 'Libby Mickleson' },
  { date: '2024-09-01', name: 'Afton Southam' },
  { date: '2024-09-01', name: 'Majorie Mann' },
  { date: '2024-09-01', name: 'Bruce Roden' },
  { date: '2024-09-01', name: 'Sister Fairbanks' },
  { date: '2024-09-01', name: 'Adylee Low' },
  { date: '2024-09-01', name: 'Joshua Beck' },
  { date: '2024-09-01', name: 'Shaylee Goff' },
  // October 2024
  { date: '2024-10-01', name: 'Brenda Callister' },
  { date: '2024-10-01', name: 'Spencer Bates' },
  { date: '2024-10-01', name: 'Sister Potts' },
  { date: '2024-10-01', name: 'Dallin Durrant' },
  // November 2024
  { date: '2024-11-01', name: 'Camille Hadley' },
  { date: '2024-11-01', name: 'Ray Webb' },
  { date: '2024-11-01', name: 'Marlee Bloomquist' },
  { date: '2024-11-01', name: 'Nik Mickleson' },
  { date: '2024-11-01', name: 'Macee Tueller' },
  { date: '2024-11-01', name: 'Ryan Mann' },
  { date: '2024-11-01', name: 'Cameron Green' },
  // December 2024
  { date: '2024-12-01', name: 'Valerie Durrant' },
  { date: '2024-12-01', name: 'Shalana Robinson' },
  { date: '2024-12-01', name: 'Lisa Tueller' },
  { date: '2024-12-01', name: 'Kyle Bloomquist' },
  { date: '2024-12-01', name: 'Dave Carlson' },
  { date: '2024-12-01', name: 'Jackson Whitehead' },
]

const memberCache = {}

function getMemberId(name) {
  const key = name.toLowerCase()
  if (memberCache[key]) return memberCache[key]
  const existing = db.prepare('SELECT id FROM members WHERE LOWER(name) = ?').get(key)
  if (existing) { memberCache[key] = existing.id; return existing.id }
  const result = db.prepare(
    `INSERT INTO members (name, cadence_months, is_active, is_moved, is_stake, created_at, updated_at)
     VALUES (?, 12, 1, 0, 0, datetime('now'), datetime('now'))`
  ).run(name)
  memberCache[key] = result.lastInsertRowid
  console.log(`  Created new member: ${name}`)
  return result.lastInsertRowid
}

const insertRecord = db.prepare(
  `INSERT INTO speaking_records (member_id, date, created_at) VALUES (?, ?, datetime('now'))`
)

let added = 0
let skipped = 0

for (const r of records) {
  const memberId = getMemberId(r.name)
  // Skip if this member already has a record in the same month
  const monthStart = r.date.slice(0, 7)
  const existing = db.prepare(
    `SELECT id FROM speaking_records WHERE member_id = ? AND date LIKE ?`
  ).get(memberId, `${monthStart}%`)
  if (existing) {
    skipped++
    continue
  }
  insertRecord.run(memberId, r.date)
  added++
}

console.log(`\nDone. Added ${added} speaking records, skipped ${skipped} duplicates.`)
console.log(`Members created or found: ${Object.keys(memberCache).length}`)
