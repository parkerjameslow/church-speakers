import { DueStatus, Category } from '@/types'

export function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate + 'T00:00:00')
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function getCategory(birthDate: string | null): Category {
  const age = calculateAge(birthDate)
  if (age === null) return 'adult'
  return age < 18 ? 'youth' : 'adult'
}

export function getNextDueDate(lastSpokeDate: string | null, cadenceMonths: number): Date | null {
  if (!lastSpokeDate) return null
  const date = new Date(lastSpokeDate + 'T00:00:00')
  date.setMonth(date.getMonth() + cadenceMonths)
  return date
}

export function getDueStatus(lastSpokeDate: string | null, cadenceMonths: number): DueStatus {
  if (!lastSpokeDate) return 'never'
  const nextDue = getNextDueDate(lastSpokeDate, cadenceMonths)!
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  nextDue.setHours(0, 0, 0, 0)
  const days = Math.floor((nextDue.getTime() - today.getTime()) / 86400000)
  if (days < 0) return 'overdue'
  if (days <= 30) return 'due-soon'
  if (days <= 60) return 'coming-up'
  return 'ok'
}

export function getDaysOverdue(lastSpokeDate: string, cadenceMonths: number): number {
  const nextDue = getNextDueDate(lastSpokeDate, cadenceMonths)!
  const today = new Date()
  return Math.max(0, Math.floor((today.getTime() - nextDue.getTime()) / 86400000))
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function sortByUrgency(a: { due_status?: DueStatus; days_overdue?: number; last_spoke_date?: string | null }, b: { due_status?: DueStatus; days_overdue?: number; last_spoke_date?: string | null }) {
  const order: Record<DueStatus, number> = { overdue: 0, 'due-soon': 1, 'coming-up': 2, never: 3, ok: 4 }
  const aOrder = order[a.due_status ?? 'ok']
  const bOrder = order[b.due_status ?? 'ok']
  if (aOrder !== bOrder) return aOrder - bOrder
  // Within same status, sort by most overdue / earliest due date
  if (a.due_status === 'overdue' && b.due_status === 'overdue') {
    return (b.days_overdue ?? 0) - (a.days_overdue ?? 0)
  }
  return 0
}
