import React, { useState } from 'react'

const PREDEFINED_REASONS = [
  { value: 'Schedule Conflict', icon: '📅' },
  { value: 'Not Interested', icon: '🙅' },
  { value: 'Already Committed', icon: '✅' },
  { value: 'Too Far', icon: '🗺️' },
  { value: 'Budget Constraints', icon: '💰' },
  { value: 'Other', icon: '📝' }
]

export default function DeclineReasonModal({ 
  isOpen, 
  onClose, 
  onDecline, 
  invitationTitle,
  loading = false 
}) {
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  const handleSubmit = () => {
    if (!selectedReason) {
      alert('Please select a reason')
      return
    }

    onDecline({
      predefinedReason: selectedReason,
      customReason: customReason.trim() || undefined
    })
  }

  const handleClose = () => {
    setSelectedReason('')
    setCustomReason('')
    onClose()
  }

  if (!isOpen) return null

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
        zIndex: 2000,
        padding: '16px',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        animation: 'fadeIn 200ms ease-out'
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: '20px',
          padding: '32px',
          maxWidth: '550px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          animation: 'slideUpScale 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.9)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={loading}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '4px',
            borderRadius: '8px',
            opacity: loading ? 0.5 : 1,
            transition: 'all 150ms'
          }}
          onMouseEnter={e => {
            if (!loading) {
              e.currentTarget.style.background = '#f5f5f5'
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>😔</div>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--text)',
            marginBottom: '8px'
          }}>
            Decline Invitation
          </h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--text-light)'
          }}>
            {invitationTitle && `"${invitationTitle}"`}
          </p>
          <p style={{
            margin: '12px 0 0 0',
            fontSize: '13px',
            color: 'var(--text-light)',
            fontStyle: 'italic'
          }}>
            Your reason will only be visible to the organizers
          </p>
        </div>

        {/* Predefined Reasons */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            fontWeight: '600',
            fontSize: '14px',
            color: 'var(--text)'
          }}>
            Reason for declining <span style={{ color: '#e74c3c' }}>*</span>
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '10px'
          }}>
            {PREDEFINED_REASONS.map(reason => (
              <button
                key={reason.value}
                type="button"
                disabled={loading}
                onClick={() => setSelectedReason(reason.value)}
                style={{
                  padding: '12px 16px',
                  background: selectedReason === reason.value 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'white',
                  color: selectedReason === reason.value ? 'white' : 'var(--text)',
                  border: selectedReason === reason.value 
                    ? '2px solid #667eea' 
                    : '2px solid var(--border)',
                  borderRadius: '10px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'all 200ms',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: loading ? 0.6 : 1
                }}
                onMouseEnter={e => {
                  if (!loading && selectedReason !== reason.value) {
                    e.currentTarget.style.borderColor = '#667eea'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                  }
                }}
                onMouseLeave={e => {
                  if (selectedReason !== reason.value) {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              >
                <span>{reason.icon}</span>
                <span>{reason.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Reason */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            fontSize: '14px',
            color: 'var(--text)'
          }}>
            Additional details (optional)
          </label>
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            disabled={loading}
            placeholder="Share more details if you'd like..."
            maxLength={500}
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              fontSize: '14px',
              border: '2px solid var(--border)',
              borderRadius: '10px',
              resize: 'vertical',
              fontFamily: 'inherit',
              transition: 'border-color 200ms',
              background: loading ? '#f5f5f5' : 'white',
              color: 'var(--text)',
              opacity: loading ? 0.6 : 1
            }}
            onFocus={e => {
              if (!loading) {
                e.target.style.borderColor = '#667eea'
                e.target.style.outline = 'none'
              }
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--border)'
            }}
          />
          <div style={{
            fontSize: '12px',
            color: 'var(--text-light)',
            marginTop: '6px',
            textAlign: 'right'
          }}>
            {customReason.length}/500 characters
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: 'var(--border)',
              color: 'var(--text)',
              border: 'none',
              borderRadius: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 150ms',
              opacity: loading ? 0.6 : 1
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.target.style.background = '#d0d0d0'
              }
            }}
            onMouseLeave={e => {
              e.target.style.background = 'var(--border)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedReason}
            style={{
              padding: '12px 24px',
              background: loading || !selectedReason 
                ? '#ccc' 
                : 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: loading || !selectedReason ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 150ms',
              opacity: loading || !selectedReason ? 0.6 : 1
            }}
            onMouseEnter={e => {
              if (!loading && selectedReason) {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = 'var(--shadow-md)'
              }
            }}
            onMouseLeave={e => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'none'
            }}
          >
            {loading ? 'Declining...' : 'Decline Invitation'}
          </button>
        </div>
      </div>
    </div>
  )
}
