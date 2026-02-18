import React, { useState, useContext, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { register } = useContext(AuthContext)
  const navigate = useNavigate()

  const emailValid = /\S+@\S+\.\S+/.test(email)
  const passwordValid = password.length >= 6
  const nameValid = name.trim().length > 0
  const canSubmit = emailValid && passwordValid && nameValid && !submitting

  useEffect(() => { setError(null) }, [name, email, password])

  const submit = async e => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await register(name, email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="brand">Join FamilyOrg</h2>
        <p style={{
          textAlign: 'center',
          color: 'var(--text-light)',
          fontSize: '14px',
          marginBottom: '24px'
        }}>
          Create your account to get started
        </p>

        <form onSubmit={submit} className="auth-form">
          <div>
            <label className={nameValid ? 'filled' : ''}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                👤 Full Name
              </span>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                style={{
                  transition: 'all 200ms',
                  borderColor: nameValid ? 'var(--blue)' : 'var(--border)',
                  backgroundColor: nameValid ? 'rgba(84, 160, 255, 0.02)' : 'transparent'
                }}
              />
            </label>
          </div>

          <div>
            <label className={emailValid ? 'filled' : ''}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                📧 Email Address
              </span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  transition: 'all 200ms',
                  borderColor: emailValid ? 'var(--blue)' : 'var(--border)',
                  backgroundColor: emailValid ? 'rgba(84, 160, 255, 0.02)' : 'transparent'
                }}
              />
            </label>
          </div>

          <div>
            <label className={passwordValid ? 'filled' : ''}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                🔒 Password
              </span>
              <div className="pw-row">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  style={{
                    transition: 'all 200ms',
                    borderColor: passwordValid ? 'var(--blue)' : 'var(--border)',
                    backgroundColor: passwordValid ? 'rgba(84, 160, 255, 0.02)' : 'transparent'
                  }}
                />
                <button
                  type="button"
                  className="show-btn"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    fontSize: '12px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {showPassword ? '👁 Hide' : '🙈 Show'}
                </button>
              </div>
            </label>
            {!passwordValid && password && (
              <div className="error" style={{
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'slideIn 300ms ease-out'
              }}>
                <span>⚠️</span>
                <span>Password must be at least 6 characters</span>
              </div>
            )}
          </div>

          {error && (
            <div className="error" style={{
              animation: 'slideIn 300ms ease-out',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            className="btn"
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '16px',
              fontWeight: '700',
              background: canSubmit
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#ccc',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'all 200ms'
            }}
            onMouseEnter={e => {
              if (canSubmit) {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = 'var(--shadow-lg)'
              }
            }}
            onMouseLeave={e => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'var(--shadow-md)'
            }}
          >
            {submitting ? '🔄 Creating...' : '✓ Create Account'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          color: 'var(--text-light)',
          fontSize: '14px'
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            color: 'var(--blue)',
            textDecoration: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'color 200ms'
          }} onMouseEnter={e => e.target.style.color = 'var(--purple)'} onMouseLeave={e => e.target.style.color = 'var(--blue)'}>
            Login here
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
} 
