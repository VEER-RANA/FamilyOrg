import React, { useState, useEffect, useContext } from 'react'
import api from '../services/api'
import { AuthContext } from '../context/AuthContext'
import DeclineReasonModal from './DeclineReasonModal'

export default function PendingInvitations({ onRefresh }) {
  const { user } = useContext(AuthContext)
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [respondingId, setRespondingId] = useState(null)
  const [declineModalOpen, setDeclineModalOpen] = useState(false)
  const [selectedInvitation, setSelectedInvitation] = useState(null)

  const normalizeRole = (role) => (role === 'organizer' ? 'organizer' : 'participant')
  const getRoleEmoji = (role) => (normalizeRole(role) === 'organizer' ? '👑' : '👥')

  const fetchPendingInvitations = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/invitations/pending')
      setInvitations(response.data || [])
    } catch (err) {
      setError('Failed to load invitations')
      console.error('Error fetching pending invitations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingInvitations()
    const interval = setInterval(fetchPendingInvitations, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const handleAccept = async (invitationId) => {
    try {
      setRespondingId(invitationId)
      await api.post(`/invitations/${invitationId}/accept`)
      setInvitations(invitations.filter(inv => inv._id !== invitationId))
      onRefresh?.()
    } catch (err) {
      setError('Failed to accept invitation')
      console.error('Error accepting invitation:', err)
    } finally {
      setRespondingId(null)
    }
  }

  const handleDeclineClick = (invitation) => {
    setSelectedInvitation(invitation)
    setDeclineModalOpen(true)
  }

  const handleDeclineWithReason = async (reasonData) => {
    if (!selectedInvitation) return
    
    try {
      setRespondingId(selectedInvitation._id)
      await api.post(`/invitations/${selectedInvitation._id}/decline`, reasonData)
      setInvitations(invitations.filter(inv => inv._id !== selectedInvitation._id))
      setDeclineModalOpen(false)
      setSelectedInvitation(null)
      onRefresh?.()
    } catch (err) {
      setError('Failed to decline invitation')
      console.error('Error declining invitation:', err)
    } finally {
      setRespondingId(null)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        color: 'var(--text-light)'
      }}>
        <div style={{ animation: 'spin 2s linear infinite' }}>⏳</div>
        <span style={{ marginLeft: '12px' }}>Loading invitations...</span>
      </div>
    )
  }

  if (invitations.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: 'var(--text-light)'
      }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
        <p>No pending invitations</p>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {error && (
        <div style={{
          background: '#fee',
          color: 'var(--red)',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          border: '1px solid #ffcccc',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {invitations.map(invitation => (
        <div
          key={invitation._id}
          style={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            transition: 'all 200ms',
            cursor: 'pointer'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--blue)'
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.boxShadow = 'none'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <div style={{ flex: 1 }}>
            <h4 style={{
              margin: '0 0 8px 0',
              fontSize: '15px',
              fontWeight: '600',
              color: 'var(--text)'
            }}>
              {invitation.eventId?.title || invitation.tripId?.title || 'Unknown'}
            </h4>
            <p style={{
              margin: '0 0 8px 0',
              fontSize: '13px',
              color: 'var(--text-light)'
            }}>
              From: {invitation.invitedBy?.name || 'Unknown'}
            </p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                background: 'var(--blue-light)',
                color: 'var(--blue)',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {getRoleEmoji(invitation.role)} {normalizeRole(invitation.role)}
              </span>
              {invitation.message && (
                <p style={{
                  margin: 0,
                  fontSize: '12px',
                  color: 'var(--text-light)',
                  fontStyle: 'italic'
                }}>
                  "{invitation.message}"
                </p>
              )}
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            marginLeft: '16px'
          }}>
            <button
              onClick={() => handleDeclineClick(invitation)}
              disabled={respondingId === invitation._id}
              style={{
                padding: '8px 14px',
                background: 'var(--border)',
                color: 'var(--text)',
                border: 'none',
                borderRadius: '6px',
                cursor: respondingId === invitation._id ? 'wait' : 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                transition: 'all 150ms',
                opacity: respondingId === invitation._id ? 0.6 : 1
              }}
              onMouseEnter={e => {
                if (respondingId !== invitation._id) {
                  e.target.style.background = '#ffebee'
                  e.target.style.color = 'var(--red)'
                }
              }}
              onMouseLeave={e => {
                e.target.style.background = 'var(--border)'
                e.target.style.color = 'var(--text)'
              }}
            >
              ✗ Decline
            </button>
            <button
              onClick={() => handleAccept(invitation._id)}
              disabled={respondingId === invitation._id}
              style={{
                padding: '8px 14px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: respondingId === invitation._id ? 'wait' : 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                transition: 'all 150ms',
                opacity: respondingId === invitation._id ? 0.7 : 1
              }}
              onMouseEnter={e => {
                if (respondingId !== invitation._id) {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = 'var(--shadow-md)'
                }
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              ✓ Accept
            </button>
          </div>
        </div>
      ))}

      <DeclineReasonModal
        isOpen={declineModalOpen}
        onClose={() => {
          setDeclineModalOpen(false)
          setSelectedInvitation(null)
        }}
        onDecline={handleDeclineWithReason}
        invitationTitle={selectedInvitation?.eventId?.title || selectedInvitation?.tripId?.title}
        loading={respondingId === selectedInvitation?._id}
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
