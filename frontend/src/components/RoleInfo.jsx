import React, { useState } from 'react'

export default function RoleInfo() {
  const [showInfo, setShowInfo] = useState(false)

  const roles = [
    {
      name: 'Organizer',
      emoji: '👑',
      color: 'var(--pink)',
      permissions: [
        'Create and edit events/trips',
        'Delete events/trips',
        'Invite family members',
        'Change participant roles',
        'Manage all details'
      ]
    },
    {
      name: 'Participant',
      emoji: '👥',
      color: 'var(--blue)',
      permissions: [
        'RSVP to events',
        'View all details',
        'Add tasks and expenses',
        'Send messages',
        'Accept invitations'
      ]
    }
  ]

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowInfo(!showInfo)}
        style={{
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 'bold',
          color: 'var(--text-light)',
          transition: 'all 200ms'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'var(--blue-light)'
          e.currentTarget.style.borderColor = 'var(--blue)'
          e.currentTarget.style.color = 'var(--blue)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.color = 'var(--text-light)'
        }}
        title="Learn about roles"
      >
        ?
      </button>

      {showInfo && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1001
          }}
          onClick={() => setShowInfo(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: 'var(--shadow-lg)',
              animation: 'slideUp 300ms ease-out'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--text)'
              }}>
                🏷️ Understanding Roles
              </h2>
              <button
                onClick={() => setShowInfo(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--text-light)'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{
              margin: '0 0 24px 0',
              color: 'var(--text-light)',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              Each family member invited to an event or trip gets a role that determines what they can do. 
              Choose the right role based on their level of involvement.
            </p>

            <div style={{ display: 'grid', gap: '16px' }}>
              {roles.map(role => (
                <div
                  key={role.name}
                  style={{
                    background: 'var(--bg-light)',
                    border: `2px solid ${role.color}33`,
                    borderRadius: '12px',
                    padding: '16px',
                    transition: 'all 200ms'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = role.color
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = `${role.color}33`
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <span style={{ fontSize: '28px' }}>{role.emoji}</span>
                    <h3 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '700',
                      color: role.color
                    }}>
                      {role.name}
                    </h3>
                  </div>

                  <ul style={{
                    margin: '0',
                    paddingLeft: '24px',
                    fontSize: '13px',
                    color: 'var(--text-light)',
                    lineHeight: '1.8'
                  }}>
                    {role.permissions.map((permission, idx) => (
                      <li key={idx}>
                        <span style={{ color: role.color, marginRight: '6px' }}>✓</span>
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div style={{
              background: '#f0f9ff',
              border: '1px solid #c0e0ff',
              borderRadius: '12px',
              padding: '14px',
              marginTop: '20px',
              fontSize: '13px',
              color: 'var(--blue)',
              lineHeight: '1.6'
            }}>
              <span style={{ fontWeight: '700' }}>💡 Tip:</span> You can change someone's role at any time 
              by updating the event/trip details. Just keep in mind that organizers have full control, 
              so assign that role carefully!
            </div>

            <button
              onClick={() => setShowInfo(false)}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 200ms'
              }}
              onMouseEnter={e => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = 'var(--shadow-md)'
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
