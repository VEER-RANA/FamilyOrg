import React, { useState } from 'react'
import api from '../services/api'
import MemberSelector from './MemberSelector'

export default function InvitationManager({ itemType = 'event', itemId, onInvitationSent, open: externalOpen, onClose: externalOnClose }) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [selectedMemberIds, setSelectedMemberIds] = useState([])
  const [role, setRole] = useState('participant')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnClose
    ? (val) => {
      if (!val) externalOnClose()
    }
    : setInternalOpen

  const selectedCount = selectedMemberIds.length

  const handleSendInvitation = async (e) => {
    e.preventDefault()
    if (!selectedMemberIds.length || !itemId) {
      setError('Please select at least one family member and ensure item exists')
      return
    }

    if (itemType !== 'event' && itemType !== 'trip') {
      setError('Invalid item type')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const invitationPromises = selectedMemberIds.map(memberId => {
        const payload = {
          memberId,
          role,
          message
        }

        if (itemType === 'event') payload.eventId = itemId
        if (itemType === 'trip') payload.tripId = itemId

        return api.post('/invitations/send', payload)
      })

      const results = await Promise.allSettled(invitationPromises)
      const successCount = results.filter(result => result.status === 'fulfilled').length
      const failedResults = results.filter(result => result.status === 'rejected')

      if (successCount === 0) {
        const firstError = failedResults[0]?.reason
        throw firstError || new Error('Error sending invitations')
      }

      if (successCount === selectedMemberIds.length) {
        setSuccess(`Invitations sent successfully to ${successCount} member${successCount !== 1 ? 's' : ''}!`)
      } else {
        const failedCount = selectedMemberIds.length - successCount
        const firstErrorMessage = failedResults[0]?.reason?.response?.data?.message
        setSuccess(`Sent to ${successCount} member${successCount !== 1 ? 's' : ''}.`)
        setError(`${failedCount} failed${firstErrorMessage ? `: ${firstErrorMessage}` : ''}`)
      }

      setSelectedMemberIds([])
      setRole('participant')
      setMessage('')

      onInvitationSent?.()

      setTimeout(() => {
        setOpen(false)
        setSuccess(null)
        setError(null)
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
            {/* <button
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
                color: 'var(--text-light)',
                lineHeight: '1',
                minWidth: '44px',
                minHeight: '44px'
              }}
              title="Close"
            >
              ✕
            </button> */}

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
              <MemberSelector
                value={selectedMemberIds}
                onChange={ids => setSelectedMemberIds(Array.isArray(ids) ? ids : (ids ? [ids] : []))}
                label="👥 Select Family Members to Invite"
                multiple
              />

              {selectedCount > 0 && (
                <p style={{ margin: '-8px 0 0 0', fontSize: '12px', color: 'var(--blue)', fontWeight: '600' }}>
                  {selectedCount} member{selectedCount !== 1 ? 's' : ''} selected
                </p>
              )}

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
                    background: 'white',
                    color: 'var(--text)',
                    fontWeight: '500'
                  }}
                >
                  <option value="participant">👥 Participant</option>
                  <option value="organizer">👑 Organizer</option>
                </select>
              </div>

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
                    background: 'white',
                    color: 'var(--text)',
                    fontWeight: '500'
                  }}
                />
              </div>

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
                  alignItems: 'flex-start'
                }}>
                  <span style={{ fontSize: '18px', marginTop: '2px' }}>⚠️</span>
                  <span style={{ flex: 1, fontWeight: '500' }}>{error}</span>
                </div>
              )}

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
                  alignItems: 'flex-start'
                }}>
                  <span style={{ fontSize: '18px', marginTop: '2px' }}>✅</span>
                  <span style={{ flex: 1, fontWeight: '500' }}>{success}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    padding: '11px 20px',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    background: 'white',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '11px 20px',
                    border: 'none',
                    borderRadius: '10px',
                    background: loading
                      ? 'linear-gradient(135deg, #b7bed3 0%, #9ea8c2 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '700'
                  }}
                >
                  {loading ? '📤 Sending...' : `✓ Send Invitation${selectedCount > 1 ? 's' : ''}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
