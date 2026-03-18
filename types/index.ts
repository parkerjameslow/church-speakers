export type Role = 'bishop' | 'counselor' | 'clerk'
export type DueStatus = 'overdue' | 'due-soon' | 'coming-up' | 'ok' | 'never'
export type Category = 'adult' | 'youth'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  created_at: string
}

export interface Household {
  id: number
  name: string
  created_at: string
}

export interface Member {
  id: number
  name: string
  birth_date: string | null
  phone: string | null
  email: string | null
  household_id: number | null
  household_name?: string | null
  notes: string | null
  cadence_months: number
  is_active: number | boolean
  is_moved: number | boolean
  is_stake: number | boolean
  created_at: string
  updated_at: string
  // Joined / computed
  last_spoke_date?: string | null
  last_topic?: string | null
  next_due_date?: string | null
  due_status?: DueStatus
  days_overdue?: number
  days_since_last_talk?: number | null
  category?: Category
  category_override?: Category | null
  speaking_count?: number
  recent_talks?: { id: number; date: string; topic: string | null }[]
}

export interface SpeakingRecord {
  id: number
  member_id: number
  member_name?: string
  date: string
  topic: string | null
  duration_minutes: number | null
  notes: string | null
  created_at: string
}

export interface Meeting {
  id: number
  date: string
  notes: string | null
  created_at: string
  assignments?: MeetingAssignment[]
}

export interface MeetingAssignment {
  id: number
  meeting_id: number
  member_id: number
  member_name?: string
  order_num: number
  topic: string | null
  created_at: string
}
