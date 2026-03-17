import { DueStatus } from '@/types'

const config: Record<DueStatus, { label: string; classes: string }> = {
  overdue: { label: 'Overdue', classes: 'bg-red-100 text-red-700 border border-red-300' },
  'due-soon': { label: 'Due Soon', classes: 'bg-amber-100 text-amber-700 border border-amber-300' },
  'coming-up': { label: 'Coming Up', classes: 'bg-blue-100 text-blue-700 border border-blue-300' },
  ok: { label: 'Active', classes: 'bg-green-100 text-green-700 border border-green-300' },
  never: { label: 'Not Yet Spoken', classes: 'bg-gray-100 text-gray-600 border border-gray-300' },
}

export function DueBadge({ status }: { status: DueStatus }) {
  const { label, classes } = config[status]
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${classes}`}>
      {label}
    </span>
  )
}

export function borderColor(status: DueStatus): string {
  const map: Record<DueStatus, string> = {
    overdue: 'border-l-red-500',
    'due-soon': 'border-l-amber-500',
    'coming-up': 'border-l-blue-400',
    ok: 'border-l-green-500',
    never: 'border-l-gray-300',
  }
  return map[status]
}
