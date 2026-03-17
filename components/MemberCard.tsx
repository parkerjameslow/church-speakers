'use client'
import Link from 'next/link'
import { Member } from '@/types'
import { DueBadge, borderColor } from './DueBadge'
import { formatDateShort } from '@/lib/utils'

interface Props {
  member: Member
  onLogSpeaking?: (member: Member) => void
  canEdit?: boolean
}

export default function MemberCard({ member, onLogSpeaking, canEdit }: Props) {
  const status = member.due_status ?? 'never'

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${borderColor(status)} p-4 flex flex-col gap-2`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link href={`/members/${member.id}`} className="font-semibold text-gray-900 hover:text-gray-600 truncate block">
            {member.name}
          </Link>
          {member.household_name && (
            <span className="text-xs text-gray-400">{member.household_name} family</span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <DueBadge status={status} />
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
            {member.category === 'youth' ? 'Youth' : 'Adult'}
          </span>
        </div>
      </div>

      <div className="text-xs text-gray-500 space-y-0.5">
        <div>
          <span className="text-gray-400">Last spoke:</span>{' '}
          {member.last_spoke_date ? (
            <span className="text-gray-700">
              {formatDateShort(member.last_spoke_date)}
              {member.last_topic && <span className="text-gray-400"> — {member.last_topic}</span>}
            </span>
          ) : (
            <span className="italic text-gray-400">Never</span>
          )}
        </div>
        {member.next_due_date && (
          <div>
            <span className="text-gray-400">Next due:</span>{' '}
            <span className={status === 'overdue' ? 'text-red-500 font-medium' : 'text-gray-700'}>
              {formatDateShort(member.next_due_date)}
              {status === 'overdue' && member.days_overdue
                ? ` (${member.days_overdue}d overdue)`
                : ''}
            </span>
          </div>
        )}
        <div>
          <span className="text-gray-400">Cadence:</span>{' '}
          <span className="text-gray-600">every {member.cadence_months} months</span>
        </div>
        {member.speaking_count !== undefined && (
          <div>
            <span className="text-gray-400">Total talks:</span>{' '}
            <span className="text-gray-600">{member.speaking_count}</span>
          </div>
        )}
      </div>

      {canEdit && onLogSpeaking && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onLogSpeaking(member)}
            className="flex-1 text-xs bg-gray-900 hover:bg-gray-700 text-white font-medium py-1.5 rounded-lg transition"
          >
            + Log Speaking
          </button>
          <Link
            href={`/members/${member.id}`}
            className="flex-1 text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium py-1.5 rounded-lg transition text-center border border-gray-200"
          >
            View Profile
          </Link>
        </div>
      )}
    </div>
  )
}
