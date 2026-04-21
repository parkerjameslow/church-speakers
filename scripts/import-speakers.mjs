import Database from 'better-sqlite3'
import XLSX from 'xlsx'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const wb = XLSX.readFile('Sacrament Speaker Schedule .xlsx')
const db = new Database('./data/church.db')

const TODAY = '2026-03-18'

// XLSX parses these serials as 2024 dates; just swap the year to the tab name
function serialToDate(serial, tabYear) {
  const p = XLSX.SSF.parse_date_code(serial)
  return `${tabYear}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`
}

const SKIP_LABELS = [
  'fast sunday', 'stake conference', 'general conference', 'ward conference',
  'primary program', 'temple dedication', 'conference'
]

function isSpecialSunday(row) {
  const v = String(row[1] || '').toLowerCase().trim()
  return SKIP_LABELS.some(w => v === w || v.startsWith(w))
}

const SKIP_NAMES_CONTAINS = [
  'stake conference', 'full time missionaries', 'ysa leader', 'high council',
  "pack's baby blessing", 'chairperson', 'stake topic'
]
const SKIP_NAMES_EXACT = ['bishop', '.', '-', 'missionaries', 'primary', 'choir', 'congregational']

function cleanName(raw) {
  if (!raw) return null
  let s = String(raw).trim().replace(/^[.\s]+/, '').trim()
  if (!s || s === '.' || s === '-') return null
  const lower = s.toLowerCase()
  if (SKIP_NAMES_EXACT.includes(lower)) return null
  if (SKIP_NAMES_CONTAINS.some(n => lower.includes(n))) return null
  return s
}

const records = []

for (const tabYear of ['2025', '2026']) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[tabYear], { header: 1 })
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || !row[0] || typeof row[0] !== 'number') continue
    if (isSpecialSunday(row)) continue

    const date = serialToDate(row[0], tabYear)
    if (date > TODAY) continue

    // [1]=youthA name, [2]=youthA topic, [3]=youthB name, [4]=youthB topic,
    // [5]=mainA name,  [6]=mainA topic,  [7]=mainB name,  [8]=mainB topic
    const speakers = [
      { name: cleanName(row[1]), topic: row[2] || null, category: 'youth' },
      { name: cleanName(row[3]), topic: row[4] || null, category: 'youth' },
      { name: cleanName(row[5]), topic: row[6] || null, category: 'adult' },
      { name: cleanName(row[7]), topic: row[8] || null, category: 'adult' },
    ]

    for (const sp of speakers) {
      if (!sp.name) continue
      records.push({ date, name: sp.name, topic: sp.topic ? String(sp.topic).trim() : null, category: sp.category })
    }
  }
}

console.log(`Parsed ${records.length} speaking records from Excel`)

// Wipe old data
db.exec('DELETE FROM speaking_records')
db.exec('DELETE FROM members')
console.log('Cleared old speaking_records and members')

// Find or create member by name
const memberCache = {}

function getMemberId(name, category) {
  const key = name.toLowerCase()
  if (memberCache[key]) return memberCache[key]
  const existing = db.prepare('SELECT id FROM members WHERE LOWER(name) = ?').get(key)
  if (existing) { memberCache[key] = existing.id; return existing.id }
  const result = db.prepare(
    `INSERT INTO members (name, category_override, cadence_months, is_active, created_at, updated_at)
     VALUES (?, ?, 12, 1, datetime('now'), datetime('now'))`
  ).run(name, category)
  memberCache[key] = result.lastInsertRowid
  return result.lastInsertRowid
}

const insertRecord = db.prepare(
  `INSERT INTO speaking_records (member_id, date, topic, created_at)
   VALUES (?, ?, ?, datetime('now'))`
)

for (const r of records) {
  insertRecord.run(getMemberId(r.name, r.category), r.date, r.topic)
}

console.log(`Imported ${records.length} speaking records for ${Object.keys(memberCache).length} members`)

// Preview
const preview = db.prepare(`
  SELECT m.name, sr.date, sr.topic
  FROM speaking_records sr JOIN members m ON m.id = sr.member_id
  ORDER BY sr.date DESC LIMIT 15
`).all()
console.log('\nMost recent 15 records:')
preview.forEach(r => console.log(` ${r.date} | ${r.name} | ${(r.topic || '(no topic)').slice(0, 60)}`))
