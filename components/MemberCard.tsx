'use client'
import { Member } from '@/types'
import { formatDateShort } from '@/lib/utils'

interface Props {
  member: Member
  onLogSpeaking?: (member: Member) => void
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? ''
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function MemberCard({ member, onLogSpeaking }: Props) {
  const status = member.due_status ?? 'never'
  const isOverdue = status === 'overdue'
  const isNever = status === 'never'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-blue-400">
            {getInitials(member.name)}
          </span>
        </div>

        {/* Name + household + badges */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 text-base leading-tight">{member.name}</div>
          {member.household_name && (
            <div className="text-sm text-gray-400 mb-1.5">The {member.household_name}</div>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-500">
              {member.category === 'youth' ? 'Youth' : 'Adult'}
            </span>
            {isOverdue && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-50 text-red-400">
                Overdue
              </span>
            )}
            {isNever && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
                Never Spoken
              </span>
            )}
          </div>
        </div>

        {/* Days since talk */}
        {member.days_since_last_talk != null && (
          <div className="text-right shrink-0">
            <div className="text-3xl font-bold text-gray-900 leading-none">
              {member.days_since_last_talk}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">days since talk</div>
          </div>
        )}
      </div>

      {/* Recent talks */}
      {member.recent_talks && member.recent_talks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
          {member.recent_talks.map((talk, i) => (
            <div key={i} className="flex items-baseline gap-1.5 text-xs">
              <span className="text-gray-400 font-medium whitespace-nowrap shrink-0">
                {formatDateShort(talk.date)}
              </span>
              {talk.topic ? (
                <span className="text-gray-400 truncate">— {talk.topic}</span>
              ) : (
                <span className="text-gray-300 italic">— No topic</span>
              )}
            </div>
          ))}
        </div>
      )}

      {onLogSpeaking && (
        <button
          onClick={() => onLogSpeaking(member)}
          className="mt-3 w-full text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-100 py-2 rounded-xl transition"
        >
          + Log Speaking
        </button>
      )}
    </div>
  )
}
