import React, { useState } from 'react'

export default function FeatureShowcase() {
  const [activeTab, setActiveTab] = useState('invitations')

  const features = {
    invitations: {
      title: '👥 Invite Family Members',
      icon: '📤',
      description: 'Send personalized invitations to family members with role assignment',
      steps: [
        '1️⃣ Click "👥 Invite Members" button',
        '2️⃣ Enter family member\'s email address',
        '3️⃣ Select their role (Organizer or Participant)',
        '4️⃣ Add optional personal message',
        '5️⃣ Click "✓ Send Invitation"'
      ],
      benefits: [
        '✓ Personalized messages',
        '✓ Role-based permissions',
        '✓ Auto-expiring invitations',
        '✓ Tracking of responses'
      ]
    },
    roles: {
      title: '🏷️ Role-Based Access Control',
      icon: '👑',
      description: 'Control what each family member can do with granular role assignments',
      roles: [
        {
          emoji: '👑',
          name: 'Organizer',
          desc: 'Full control - Create, edit, delete, manage roles'
        },
        {
          emoji: '👥',
          name: 'Participant',
          desc: 'Active participant - RSVP, view, contribute tasks/expenses'
        }
      ]
    },
    notifications: {
      title: '🔔 Stay Informed',
      icon: '📬',
      description: 'Receive real-time updates about events, trips, and family activities',
      types: [
        '👥 Invitation received',
        '📅 Event updated',
        '✈️ Trip updated',
        '✓ RSVP response received',
        '✎ Task assigned to you',
        '💰 Expense recorded',
        '💬 New message from family'
      ]
    }
  }

  const feature = features[activeTab]

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      maxWidth: '800px',
      margin: '0 auto',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--border)'
    }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '32px',
        borderBottom: '2px solid var(--border)',
        paddingBottom: '12px'
      }}>
        {Object.entries(features).map(([key, value]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: '10px 16px',
              background: activeTab === key 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : 'transparent',
              color: activeTab === key ? 'white' : 'var(--text-light)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              transition: 'all 150ms'
            }}
            onMouseEnter={e => {
              if (activeTab !== key) {
                e.target.style.background = 'var(--bg-light)'
              }
            }}
            onMouseLeave={e => {
              if (activeTab !== key) {
                e.target.style.background = 'transparent'
              }
            }}
          >
            {value.icon} {value.title.split(' ')[1]}
          </button>
        ))}
      </div>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{
          margin: '0 0 8px 0',
          fontSize: '24px',
          fontWeight: '700',
          color: 'var(--text)'
        }}>
          {feature.title}
        </h2>
        <p style={{
          margin: 0,
          color: 'var(--text-light)',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          {feature.description}
        </p>
      </div>

      {/* Content - Invitations */}
      {activeTab === 'invitations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{
              margin: '0 0 12px 0',
              fontSize: '14px',
              fontWeight: '700',
              color: 'var(--text)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              📋 How It Works:
            </h3>
            <ol style={{
              margin: 0,
              paddingLeft: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {feature.steps.map((step, idx) => (
                <li key={idx} style={{
                  fontSize: '13px',
                  color: 'var(--text-light)',
                  lineHeight: '1.6'
                }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 style={{
              margin: '12px 0 12px 0',
              fontSize: '14px',
              fontWeight: '700',
              color: 'var(--text)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              ✨ Key Benefits:
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px'
            }}>
              {feature.benefits.map((benefit, idx) => (
                <div key={idx} style={{
                  padding: '8px 12px',
                  background: 'var(--bg-light)',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: 'var(--text-light)'
                }}>
                  {benefit}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content - Roles */}
      {activeTab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {feature.roles.map((role, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-light)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '14px',
                transition: 'all 150ms'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--blue)'
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '6px'
              }}>
                <span style={{ fontSize: '24px' }}>{role.emoji}</span>
                <h4 style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: '700',
                  color: 'var(--text)'
                }}>
                  {role.name}
                </h4>
              </div>
              <p style={{
                margin: '0 0 0 34px',
                fontSize: '13px',
                color: 'var(--text-light)',
                lineHeight: '1.5'
              }}>
                {role.desc}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Content - Notifications */}
      {activeTab === 'notifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{
            margin: '0 0 12px 0',
            fontSize: '13px',
            color: 'var(--text-light)',
            lineHeight: '1.6'
          }}>
            You'll receive notifications for these events:
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px'
          }}>
            {feature.types.map((type, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-light)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: 'var(--text)',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>{type}</span>
              </div>
            ))}
          </div>
          <div style={{
            background: '#f0f9ff',
            border: '1px solid #c0e0ff',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '12px',
            fontSize: '12px',
            color: 'var(--blue)',
            lineHeight: '1.6'
          }}>
            <span style={{ fontWeight: '700' }}>💡 Pro Tip:</span> Click the 🔔 bell icon to see all your notifications. 
            You can mark them as read or delete them individually.
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: 'var(--text-light)'
      }}>
        <span>✅ All features are production-ready</span>
        <a href="#" style={{
          color: 'var(--blue)',
          textDecoration: 'none',
          fontWeight: '600'
        }}>
          Learn more →
        </a>
      </div>
    </div>
  )
}
