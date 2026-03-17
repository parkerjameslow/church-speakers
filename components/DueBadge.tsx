import { DueStatus } from '@/types'

const config: Record<DueStatus, { label: string; classes: string }> = {
  overdue:    { label: 'Overdue',         classes: 'bg-red-50 text-red-600 border border-red-200' },
  'due-soon': { label: 'Due Soon',        classes: 'bg-amber-50 text-amber-600 border border-amber-200' },
  'coming-up':{ label: 'Coming Up',       classes: 'bg-gray-100 text-gray-600 border border-gray-200' },
  ok:         { label: 'Active',          classes: 'bg-gray-100 text-gray-500 border border-gray-200' },
  never:      { label: 'Not Yet Spoken',  classes: 'bg-gray-100 text-gray-400 border border-gray-200' },
}

export function DueBadge({ status }: { status: DueStatus }) {
  const { label, classes } = config[status]
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${classes}`}>
      {label}
    </span>
  )
}

export function borderColor(status: DueStatus): string {
  const map: Record<DueStatus, string> = {
    overdue:     'border-l-red-400',
    'due-soon':  'border-l-amber-400',
    'coming-up': 'border-l-gray-300',
    ok:          'border-l-gray-200',
    never:       'border-l-gray-200',
  }
  return map[status]
}
