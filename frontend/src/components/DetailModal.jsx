import React from 'react'
import { formatDate } from '../utils/date'
import ParticipantBadge from './ParticipantBadge'

export default function DetailModal({ open, onClose, title='Details', data }){
  if (!open) return null

  // Helper to check if value is a MongoDB ObjectID
  const isObjectId = (value) => {
    return typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)
  }

  // Helper to get user name from nested object or return the ID
  const getDisplayName = (value) => {
    if (!value) return '—'
    if (typeof value === 'object' && value.name) return value.name
    if (typeof value === 'string') return value
    return String(value)
  }

  const formatValue = (value) => {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'boolean') return value ? '✓ Yes' : '✗ No'
    if (typeof value === 'string' && (value.includes('T') && value.includes('Z') || value.match(/^\d{4}-\d{2}-\d{2}/))) {
      // Format ISO dates - simple and memorable
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        const weekday = date.toLocaleString('en-US', { weekday: 'short' })
        const month = date.toLocaleString('en-US', { month: 'short' })
        const day = date.getDate()
        const year = date.getFullYear()
        const time = date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        return `${weekday}, ${month} ${day}, ${year} • ${time}`
      }
    }
    if (value instanceof Date) {
      const weekday = value.toLocaleString('en-US', { weekday: 'short' })
      const month = value.toLocaleString('en-US', { month: 'short' })
      const day = value.getDate()
      const year = value.getFullYear()
      const time = value.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      return `${weekday}, ${month} ${day}, ${year} • ${time}`
    }
    if (typeof value === 'object' && Array.isArray(value)) {
      return `[${value.length} item${value.length !== 1 ? 's' : ''}]`
    }
    if (typeof value === 'object' && value !== null && value.name) {
      return value.name
    }
    if (isObjectId(value)) return `ID: ${value.substring(0, 8)}...`
    if (typeof value === 'object') return '[Object]'
    return String(value)
  }

  const renderField = (key, value) => {
    const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    
    // Special handling for trip places (array of strings)
    if (key === 'places' && Array.isArray(value)) {
      return (
        <div key={key} style={{
          padding: '16px',
          background: 'var(--bg-light)',
          borderRadius: '10px',
          border: '1px solid var(--border)'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '700',
            color: 'var(--blue)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '14px' }}>📍</span>
            <span>{displayKey}</span>
          </div>
          {value.length ? (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {value.map((place, idx) => (
                <span key={idx} style={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '999px',
                  padding: '6px 12px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text)'
                }}>
                  {String(place)}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No places specified</div>
          )}
        </div>
      )
    }

    // Special handling for itinerary
    if (key === 'itinerary' && Array.isArray(value) && value.length > 0) {
      return (
        <div key={key} style={{
          gridColumn: '1 / -1',
          padding: '16px',
          background: 'var(--bg-light)',
          borderRadius: '10px',
          border: '1px solid var(--border)'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '700',
            color: 'var(--blue)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px'
          }}>
            🗺️ {displayKey}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '12px'
          }}>
            {value.map((item, idx) => (
              <div key={idx} style={{
                background: 'white',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '13px'
              }}>
                <div style={{ fontWeight: '600', color: 'var(--blue)', marginBottom: '10px', fontSize: '14px' }}>
                  📅 Day {item.day || idx + 1}
                </div>
                {Array.isArray(item.activities) && item.activities.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text)' }}>
                    {item.activities.map((activity, aIdx) => (
                      <li key={aIdx} style={{ marginBottom: '6px', lineHeight: '1.5' }}>{activity}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ color: 'var(--text-light)', fontStyle: 'italic' }}>No activities</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Special handling for participants and attendees
    if ((key === 'participants' || key === 'attendees') && Array.isArray(value) && value.length > 0) {
      return (
        <div key={key} style={{
          gridColumn: '1 / -1',
          padding: '16px',
          background: 'var(--bg-light)',
          borderRadius: '10px',
          border: '1px solid var(--border)'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '700',
            color: 'var(--blue)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '14px' }}>👥</span>
            <span>{displayKey}</span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '12px'
          }}>
            {value.map((item, idx) => (
              <div key={idx} style={{
                background: 'white',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '13px'
              }}>
                <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span>{getDisplayName(item.userId)}</span>
                  {item.role && item.status && (
                    <ParticipantBadge role={item.role} status={item.status} />
                  )}
                </div>
                {item.joinedAt && (
                  <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                    Joined: {formatDate(item.joinedAt)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }
    
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      return (
        <div key={key} style={{
          gridColumn: value.length > 2 ? '1 / -1' : 'auto',
          padding: '16px',
          background: 'var(--bg-light)',
          borderRadius: '10px',
          border: '1px solid var(--border)'
        }}>
          
          <div style={{
            fontSize: '12px',
            fontWeight: '700',
            color: 'var(--blue)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontSize: '14px' }}>📋</span>
            <span>{displayKey}</span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: value.length > 2 ? 'repeat(auto-fit, minmax(250px, 1fr))' : '1fr',
            gap: '12px'
          }}>
            {value.map((item, idx) => (
              <div key={idx} style={{
                background: 'white',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                fontSize: '13px'
              }}>
                <div style={{ color: 'var(--blue)', fontSize: '12px', fontWeight: '600', marginBottom: '10px' }}>
                  Item {idx + 1}
                </div>
                {typeof item === 'string' ? (
                  <div style={{ color: 'var(--text)' }}>{item}</div>
                ) : (
                  <div>
                    {Object.entries(item).map(([k, v]) => (
                      <div key={k} style={{ fontSize: '12px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-light)' }}>{k}: </span>
                        <span style={{ color: 'var(--text)' }}>{formatValue(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Special handling for createdBy - show only name and mobile/email
      if (key === 'createdBy') {
        return (
          <div key={key} style={{
            padding: '16px',
            background: 'var(--bg-light)',
            borderRadius: '10px',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '700',
              color: 'var(--blue)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '12px'
            }}>
              👤 {displayKey}
            </div>
            <div style={{
              background: 'white',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid var(--border)'
            }}>
              {value.name && (
                <div key="name" style={{ fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-light)' }}>Name: </span>
                  <span style={{ color: 'var(--text)', fontWeight: '500' }}>{value.name}</span>
                </div>
              )}
              {(value.mobile || value.phone) && (
                <div key="mobile" style={{ fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-light)' }}>Mobile: </span>
                  <span style={{ color: 'var(--text)', fontWeight: '500' }}>{value.mobile || value.phone}</span>
                </div>
              )}
              {!value.mobile && !value.phone && value.email && (
                <div key="email" style={{ fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-light)' }}>Email: </span>
                  <span style={{ color: 'var(--text)', fontWeight: '500' }}>{value.email}</span>
                </div>
              )}
            </div>
          </div>
        )
      }

      // General object handling for other nested objects
      return (
        <div key={key} style={{
          padding: '16px',
          background: 'var(--bg-light)',
          borderRadius: '10px',
          border: '1px solid var(--border)'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '700',
            color: 'var(--blue)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px'
          }}>
            🔹 {displayKey}
          </div>
          <div style={{
            background: 'white',
            padding: '14px',
            borderRadius: '8px',
            border: '1px solid var(--border)'
          }}>
            {Object.entries(value).map(([k, v]) => {
              const innerDisplayKey = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
              return (
                <div key={k} style={{ fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-light)' }}>{innerDisplayKey}: </span>
                  <span style={{ color: 'var(--text)', fontWeight: '500' }}>
                    {k === 'name' || k.includes('name') ? getDisplayName(v) : formatValue(v)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    let icon = '📄'
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) icon = '📅'
    if (key.toLowerCase().includes('email')) icon = '📧'
    if (key.toLowerCase().includes('phone') || key.toLowerCase().includes('mobile')) icon = '📱'
    if (key.toLowerCase().includes('location') || key.toLowerCase().includes('address')) icon = '📍'
    if (key.toLowerCase().includes('status')) icon = '🏷'
    if (key.toLowerCase().includes('name') || key.toLowerCase().includes('title')) icon = '✏️'
    if (key.toLowerCase().includes('count') || key.toLowerCase().includes('number')) icon = '🔢'
    if (key.toLowerCase().includes('description') || key.toLowerCase().includes('note')) icon = '📝'
    if (key === 'createdBy' || key.includes('createdBy')) icon = '👤'

    const isDateField = key.toLowerCase().includes('date') || key.toLowerCase().includes('time')
    // For createdBy or user reference fields, try to show the name if available
    let displayValue = (key === 'createdBy' || key.includes('userId')) ? getDisplayName(value) : formatValue(value)

    return (
      <div key={key} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px',
        background: 'var(--bg-light)',
        borderRadius: '10px',
        border: '1px solid var(--border)',
        transition: 'all 200ms',
        cursor: 'pointer',
        minHeight: '80px'
      }} onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)'
        e.currentTarget.style.borderColor = 'var(--blue)'
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
      }} onMouseLeave={e => {
        e.currentTarget.style.background = 'var(--bg-light)'
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '700',
          color: 'var(--text-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          <span>{icon}</span>
          <span>{displayKey}</span>
        </div>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--text)',
          wordBreak: 'break-word',
          lineHeight: '1.5',
          flex: 1,
          display: 'flex',
          alignItems: 'center'
        }}>
          {displayValue}
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            fontSize: '28px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '10px',
            transition: 'all 200ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            color: 'var(--text-light)',
            lineHeight: '1'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'
            e.currentTarget.style.transform = 'scale(1.15) rotate(90deg)'
            e.currentTarget.style.color = 'var(--blue)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
            e.currentTarget.style.color = 'var(--text-light)'
          }}
          title="Close (Esc)"
        >
          ✕
        </button>

        <h3>{title}</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {data && Object.entries(data).map(([key, value]) => {
            if (key.startsWith('_') || key === '__v' || key === 'isPublic' || key === 'color') return null
            return renderField(key, value)
          })}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '2px solid var(--border)',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <button 
            className="btn" 
            onClick={onClose} 
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
              padding: '12px 32px',
              fontSize: '15px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              minWidth: '130px',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }} 
            onMouseEnter={e => {
              e.target.style.transform = 'translateY(-3px)'
              e.target.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.4)'
            }} 
            onMouseLeave={e => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          >
            ✓ Close
          </button>
        </div>
      </div>
    </div>
  )
}