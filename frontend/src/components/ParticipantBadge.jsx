import React from 'react'

export default function ParticipantBadge({ role, status, participantName, isYou }) {
  const normalizedRole = role === 'organizer' ? 'organizer' : 'participant'

  const getRoleColor = (role) => {
    switch(role) {
      case 'organizer': return { bg: '#fff0f5', text: 'var(--pink)' }
      case 'participant': return { bg: '#e3f2fd', text: 'var(--blue)' }
      default: return { bg: 'var(--border)', text: 'var(--text-light)' }
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'accepted': return '✓'
      case 'pending': return '⏳'
      case 'declined': return '✗'
      default: return '●'
    }
  }

  const getRoleEmoji = (role) => {
    switch(role) {
      case 'organizer': return '👑'
      case 'participant': return '👥'
      default: return '●'
    }
  }

  const colors = getRoleColor(normalizedRole)

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      background: colors.bg,
      color: colors.text,
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      whiteSpace: 'nowrap',
      border: `1px solid ${colors.text}33`
    }}>
      <span>{getRoleEmoji(normalizedRole)}</span>
      <span>{normalizedRole}</span>
      {status && (
        <span style={{ opacity: 0.7 }} title={status}>
          {getStatusIcon(status)}
        </span>
      )}
      {isYou && (
        <span style={{
          background: colors.text,
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          marginLeft: '4px',
          fontSize: '10px'
        }}>
          You
        </span>
      )}
    </div>
  )
}
