import React, { useState, useEffect, useContext } from 'react'
import api from '../services/api'
import { AuthContext } from '../context/AuthContext'
import MemberSelector from './MemberSelector'

export default function InvitationManager({ itemType = 'event', itemId, onInvitationSent, open: externalOpen, onClose: externalOnClose }) {
  const { user } = useContext(AuthContext)
  const [internalOpen, setInternalOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [role, setRole] = useState('participant')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Use external open state if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnClose ? (val) => {
    if (!val) externalOnClose()
  } : setInternalOpen

  const handleSendInvitation = async (e) => {
    e.preventDefault()
    if (!selectedMemberId || !itemId) {
      setError('Please select a family member and ensure item exists')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const payload = {
        memberId: selectedMemberId,
        role,
        message
      }

      if (itemType === 'event') {
        payload.eventId = itemId
      } else if (itemType === 'trip') {
        payload.tripId = itemId
      } else {
        setError('Invalid item type')
        setLoading(false)
        return
      }

      await api.post('/invitations/send', payload)

      setSuccess('Invitation sent successfully!')
      setSelectedMemberId('')
      setRole('participant')
      setMessage('')

      onInvitationSent?.()

      setTimeout(() => {
        setOpen(false)
        setSuccess(null)
      }, 1500)
    } catch (err) {
      console.error('Invitation error:', err)
      setError(err.response?.data?.message || 'Error sending invitation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Only show button if not controlled externally (i.e., not from ItemMenu) */}
      {externalOpen === undefined && (
        <button
          onClick={() => setOpen(!internalOpen)}
          style={{
            padding: '10px 16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 150ms'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'var(--shadow-md)'
          }}
        >
          👥 Invite Members
        </button>
      )}

      {isOpen && (
        <div
          className="invite-modal"
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
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
          onClick={() => setOpen(false)}
        >
          <div
            className="invite-modal__card"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '88vh',
              height: 'fit-content',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 20px -8px rgba(0, 0, 0, 0.15)',
              animation: 'slideUpScale 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              position: 'relative',
              border: '1px solid rgba(255, 255, 255, 0.9)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              className="invite-modal__close"
              onClick={() => setOpen(false)}
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
                lineHeight: '1',
                minWidth: '44px',
                minHeight: '44px'
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
              title="Close"
            >
              ✕
            </button>

            <h3 style={{
              margin: '0 0 28px 0',
              fontSize: '28px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              paddingBottom: '16px',
              borderBottom: '2px solid var(--border)',
              letterSpacing: '-0.5px',
              lineHeight: '1.2'
            }}>
              Invite Family Members
            </h3>

            <form onSubmit={handleSendInvitation} style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingTop: '4px' }}>
              {/* Member Selector */}
              <MemberSelector 
                value={selectedMemberId}
                onChange={id => setSelectedMemberId(id)}
                label="👥 Select Family Member to Invite"
              />

              {/* Role Selection */}
              <div>
                <label style={{
                  display: 'flex',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '10px',
                  color: 'var(--text)',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  🏷️ Role
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                    background: 'white',
                    color: 'var(--text)',
                    fontWeight: '500'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'var(--blue)'
                    e.target.style.boxShadow = '0 0 0 4px rgba(84, 160, 255, 0.15)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'var(--border)'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  <option value="participant">👥 Participant</option>
                  <option value="organizer">👑 Organizer</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label style={{
                  display: 'flex',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '10px',
                  color: 'var(--text)',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  💬 Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    minHeight: '110px',
                    resize: 'vertical',
                    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                    background: 'white',
                    color: 'var(--text)',
                    fontWeight: '500'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'var(--blue)'
                    e.target.style.boxShadow = '0 0 0 4px rgba(84, 160, 255, 0.15)'
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'var(--border)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  background: 'linear-gradient(135deg, #fee 0%, #fdd 100%)',
                  color: 'var(--red)',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  border: '1px solid #ffcccc',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  animation: 'slideDown 300ms ease-out',
                  boxShadow: '0 4px 12px rgba(231, 76, 60, 0.1)'
                }}>
                  <span style={{ fontSize: '18px', marginTop: '2px' }}>⚠️</span>
                  <span style={{ flex: 1, fontWeight: '500' }}>{error}</span>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div style={{
                  background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                  color: 'var(--green)',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  border: '1px solid #a5d6a7',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  animation: 'slideDown 300ms ease-out',
                  boxShadow: '0 4px 12px rgba(29, 209, 161, 0.1)'
                }}>
                  <span style={{ fontSize: '18px', marginTop: '2px' }}>✓</span>
                  <span style={{ flex: 1, fontWeight: '500' }}>{success}</span>
                </div>
              )}

              {/* Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '12px', 
                marginTop: '16px',
                paddingTop: '20px',
                borderTop: '2px solid var(--border)',
                flexWrap: 'wrap',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    if (externalOnClose) {
                      externalOnClose()
                    } else {
                      setInternalOpen(false)
                    }
                  }}
                  style={{
                    padding: '12px 32px',
                    background: 'var(--border)',
                    color: 'var(--text)',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                    minWidth: '110px',
                    minHeight: '44px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                  }}
                  onMouseEnter={e => {
                    e.target.style.background = '#d4daeb'
                    e.target.style.transform = 'translateY(-2px)'
                    e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.12)'
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = 'var(--border)'
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedMemberId}
                  style={{
                    padding: '12px 32px',
                    background: loading || !selectedMemberId ? '#d4daeb' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: loading || !selectedMemberId ? 'var(--text-light)' : 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: loading || !selectedMemberId ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: loading || !selectedMemberId ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)',
                    minWidth: '160px',
                    minHeight: '44px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={e => {
                    if (!loading && selectedMemberId) {
                      e.target.style.transform = 'translateY(-3px)'
                      e.target.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.4)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!loading && selectedMemberId) {
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }
                  }}
                >
                  {loading ? '📤 Sending...' : '✓ Send Invitation'}
                </button>
              </div>
            </form>

            <style>{`
              @keyframes slideDown {
                from { 
                  transform: translateY(-10px); 
                  opacity: 0; 
                }
                to { 
                  transform: translateY(0); 
                  opacity: 1; 
                }
              }

              @keyframes slideUpScale {
                from { 
                  transform: translateY(40px) scale(0.93);
                  opacity: 0;
                }
                to { 
                  transform: translateY(0) scale(1);
                  opacity: 1;
                }
              }

              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }

              @media (max-width: 768px) {
                .invite-modal__card {
                  padding: 24px !important;
                }
              }

              @media (max-width: 640px) {
                .invite-modal__card {
                  padding: 18px !important;
                  max-width: 100% !important;
                }
              }

              @media (max-width: 480px) {
                .invite-modal__close {
                  display: none !important;
                }

                .invite-modal__card {
                  padding: 12px !important;
                  max-width: 100% !important;
                  border-radius: 14px !important;
                }

                .invite-modal__card h3 {
                  font-size: 22px !important;
                  margin-bottom: 14px !important;
                }

                .invite-modal__card form {
                  gap: 14px !important;
                }

                .invite-modal__card label {
                  font-size: 13px !important;
                  margin-bottom: 6px !important;
                }

                .invite-modal__card input,
                .invite-modal__card textarea,
                .invite-modal__card select {
                  padding: 10px 12px !important;
                  font-size: 13px !important;
                  border-radius: 8px !important;
                }

                .invite-modal__card textarea {
                  min-height: 90px !important;
                }

                .invite-modal__card button {
                  padding: 10px 16px !important;
                  font-size: 13px !important;
                  min-width: 80px !important;
                }
              }

              @media (max-width: 360px) {
                .invite-modal__card {
                  padding: 10px !important;
                }

                .invite-modal__card h3 {
                  font-size: 20px !important;
                  margin-bottom: 12px !important;
                }

                .invite-modal__card button {
                  padding: 10px 12px !important;
                  font-size: 12px !important;
                  min-width: 70px !important;
                }
              }
            `}</style>
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
