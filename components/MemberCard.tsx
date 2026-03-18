'use client'
import { Member } from '@/types'
import { formatDateShort } from '@/lib/utils'

interface Props {
  member: Member
  onLogSpeaking?: (member: Member) => void
}

export default function MemberCard({ member, onLogSpeaking }: Props) {
  const status = member.due_status ?? 'never'
  const isOverdue = status === 'overdue'
  const isNever = status === 'never'

  return (
    <div
      className={`bg-white rounded-xl border p-4 ${
        isOverdue ? 'border-red-100' : 'border-gray-100'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{member.name}</h3>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {member.category === 'youth' ? 'Youth' : 'Adult'}
          </span>
          {isOverdue && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
              Overdue
            </span>
          )}
          {isNever && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-gray-200">
              Never Spoken
            </span>
          )}
        </div>
      </div>

      {/* Days since last talk */}
      {member.days_since_last_talk != null ? (
        <div className="mb-3">
          <span className={`text-2xl font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
            {member.days_since_last_talk}
          </span>
          <span className="text-xs text-gray-400 ml-1.5">days since last talk</span>
        </div>
      ) : (
        <div className="text-sm text-gray-400 italic mb-3">No talks recorded</div>
      )}

      {/* Recent talks */}
      {member.recent_talks && member.recent_talks.length > 0 && (
        <div className="space-y-1 mb-3 border-t border-gray-50 pt-3">
          {member.recent_talks.map((talk, i) => (
            <div key={i} className="flex items-baseline gap-1.5 text-xs">
              <span className="text-gray-500 font-medium whitespace-nowrap shrink-0">
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
          className="w-full text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 py-2 rounded-lg transition"
        >
          + Log Speaking
        </button>
      )}
    </div>
  )
}
