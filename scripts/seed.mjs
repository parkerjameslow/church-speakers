// Run with: node scripts/seed.mjs
import { DatabaseSync } from 'node:sqlite'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'data')
const DB_PATH = path.join(DATA_DIR, 'church.db')
const TALKS_PATH = path.join(ROOT, 'parsed_talks.json')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const db = new DatabaseSync(DB_PATH)
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

// Ensure schema + category_override column
db.exec(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    birth_date TEXT,
    phone TEXT,
    email TEXT,
    household_id INTEGER,
    notes TEXT,
    cadence_months INTEGER NOT NULL DEFAULT 12,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS speaking_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    topic TEXT,
    duration_minutes INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)
try { db.exec(`ALTER TABLE members ADD COLUMN category_override TEXT`) } catch {}

// Clear existing data
db.exec('DELETE FROM speaking_records')
db.exec('DELETE FROM members')
db.exec("UPDATE sqlite_sequence SET seq=0 WHERE name='members'")
db.exec("UPDATE sqlite_sequence SET seq=0 WHERE name='speaking_records'")

const talks = JSON.parse(fs.readFileSync(TALKS_PATH, 'utf8'))

const ACTIVE_CUTOFF = '2022-01-01'
const BAD_NAMES = new Set([
  'Bishop Beck', 'Bishop Whitehead', 'Christmas Program',
  'President Argyle', 'President Arnesen', 'President Deborah Doxey',
  'President Porter', 'President Veenker', 'President Whitehead',
])

const insertMember = db.prepare(
  'INSERT INTO members (name, cadence_months, is_active, category_override) VALUES (?,?,?,?)'
)
const insertTalk = db.prepare(
  'INSERT INTO speaking_records (member_id, date, topic) VALUES (?,?,?)'
)

let memberCount = 0, talkCount = 0

for (const [name, tlist] of Object.entries(talks)) {
  if (BAD_NAMES.has(name)) continue

  const sorted = [...tlist].sort((a, b) => a.date.localeCompare(b.date))
  const lastDate = sorted[sorted.length - 1].date
  const recentCats = sorted.filter(t => t.category && t.date >= '2020-01-01').map(t => t.category)
  const allCats = sorted.filter(t => t.category).map(t => t.category)
  const cat = (recentCats.length ? recentCats : allCats).at(-1) ?? null
  const isActive = lastDate >= ACTIVE_CUTOFF ? 1 : 0
  const cadence = cat === 'youth' ? 6 : 12

  const { lastInsertRowid: mid } = insertMember.run(name, cadence, isActive, cat)
  memberCount++

  for (const t of sorted) {
    insertTalk.run(mid, t.date, t.topic ?? null)
    talkCount++
  }
}

console.log(`✓ Imported ${memberCount} members and ${talkCount} speaking records into ${DB_PATH}`)
