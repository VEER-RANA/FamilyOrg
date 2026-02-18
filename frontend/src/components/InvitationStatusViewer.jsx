import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { formatDate } from '../utils/date'

export default function InvitationStatusViewer({ itemType = 'event', itemId, open, onClose }) {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, pending, accepted, declined

  const normalizeRole = (role) => (role === 'organizer' ? 'organizer' : 'participant')
  const getRoleEmoji = (role) => (normalizeRole(role) === 'organizer' ? '👑' : '👥')

  useEffect(() => {
    if (open && itemId) {
      fetchInvitations()
    }
  }, [open, itemId])

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/invitations/item/${itemType}/${itemId}`)
      setInvitations(response.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load invitation details')
      console.error('Error fetching invitations:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredInvitations = invitations.filter(inv => {
    if (filter === 'all') return true
    return inv.status === filter
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return '✅'
      case 'declined': return '❌'
      case 'pending': return '⏳'
      case 'cancelled': return '🚫'
      default: return '❓'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return { bg: '#d4edda', color: '#155724', border: '#c3e6cb' }
      case 'declined': return { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' }
      case 'pending': return { bg: '#fff3cd', color: '#856404', border: '#ffeeba' }
      case 'cancelled': return { bg: '#e2e3e5', color: '#383d41', border: '#d6d8db' }
      default: return { bg: '#f8f9fa', color: '#6c757d', border: '#dee2e6' }
    }
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '16px',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        animation: 'fadeIn 300ms ease-out',
        overflow: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '88vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'slideUpScale 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.9)'
        }}
        onClick={e => e.stopPropagation()}
      >
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
            transition: 'all 200ms ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#f5f5f5'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            margin: 0,
            fontSize: '26px',
            fontWeight: '700',
            color: 'var(--text)',
            marginBottom: '8px'
          }}>
            📊 Invitation Status
          </h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--text-light)'
          }}>
            View all invitations and responses
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          {['all', 'pending', 'accepted', 'declined'].map(status => {
            const count = status === 'all' 
              ? invitations.length 
              : invitations.filter(inv => inv.status === status).length
            
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                style={{
                  padding: '8px 16px',
                  background: filter === status 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'white',
                  color: filter === status ? 'white' : 'var(--text)',
                  border: filter === status ? 'none' : '2px solid var(--border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px',
                  transition: 'all 200ms',
                  textTransform: 'capitalize'
                }}
                onMouseEnter={e => {
                  if (filter !== status) {
                    e.currentTarget.style.borderColor = '#667eea'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={e => {
                  if (filter !== status) {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                {status} ({count})
              </button>
            )
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-light)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            <p>Loading invitations...</p>
          </div>
        ) : error ? (
          <div style={{
            background: '#fee',
            color: 'var(--red)',
            padding: '16px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        ) : filteredInvitations.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-light)'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <p>No {filter !== 'all' ? filter : ''} invitations</p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {filteredInvitations.map(invitation => {
              const statusStyle = getStatusColor(invitation.status)
              
              return (
                <div
                  key={invitation._id}
                  style={{
                    background: 'white',
                    border: `2px solid ${statusStyle.border}`,
                    borderRadius: '12px',
                    padding: '16px',
                    transition: 'all 200ms'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        margin: '0 0 8px 0',
                        fontSize: '15px',
                        fontWeight: '600',
                        color: 'var(--text)'
                      }}>
                        {invitation.invitedUser?.name || 'Unknown User'}
                      </h4>
                      <p style={{
                        margin: '0 0 4px 0',
                        fontSize: '13px',
                        color: 'var(--text-light)'
                      }}>
                        {invitation.invitedUser?.email}
                      </p>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                        <span style={{
                          background: 'var(--blue-light)',
                          color: 'var(--blue)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          {getRoleEmoji(invitation.role)} {normalizeRole(invitation.role)}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      textTransform: 'capitalize'
                    }}>
                      <span>{getStatusIcon(invitation.status)}</span>
                      <span>{invitation.status}</span>
                    </div>
                  </div>

                  {/* Invite Message */}
                  {invitation.message && (
                    <div style={{
                      background: '#f8f9fa',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      borderLeft: '3px solid var(--blue)'
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: '13px',
                        color: 'var(--text)',
                        fontStyle: 'italic'
                      }}>
                        💬 "{invitation.message}"
                      </p>
                    </div>
                  )}

                  {/* Decline Reason - Only shown for declined invitations */}
                  {invitation.status === 'declined' && invitation.declineReason && (
                    <div style={{
                      background: '#fff3cd',
                      padding: '12px',
                      borderRadius: '8px',
                      borderLeft: '4px solid #ffc107'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontSize: '16px' }}>🔒</span>
                        <strong style={{
                          fontSize: '13px',
                          color: '#856404'
                        }}>
                          Decline Reason (Organizers Only)
                        </strong>
                      </div>
                      
                      {invitation.declineReason.predefinedReason && (
                        <div style={{
                          background: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          marginBottom: invitation.declineReason.customReason ? '8px' : '0',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#856404'
                        }}>
                          📌 {invitation.declineReason.predefinedReason}
                        </div>
                      )}
                      
                      {invitation.declineReason.customReason && (
                        <div style={{
                          background: 'white',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          color: '#856404',
                          fontStyle: 'italic',
                          lineHeight: '1.5'
                        }}>
                          "{invitation.declineReason.customReason}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamps */}
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    marginTop: '12px',
                    fontSize: '11px',
                    color: 'var(--text-light)'
                  }}>
                    <span>
                      📅 Invited: {formatDate(invitation.createdAt)}
                    </span>
                    {invitation.respondedAt && (
                      <span>
                        ⏰ Responded: {formatDate(invitation.respondedAt)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideUpScale {
          from {
            transform: translateY(20px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
