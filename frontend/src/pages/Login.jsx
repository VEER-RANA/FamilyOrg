import React, { useState, useContext, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const emailValid = /\S+@\S+\.\S+/.test(email)
  const canSubmit = emailValid && password.length > 0 && !submitting

  useEffect(() => setError(null), [email, password])

  const submit = async e => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="brand">Welcome Back</h2>
        <p style={{
          textAlign: 'center',
          color: 'var(--text-light)',
          fontSize: '14px',
          marginBottom: '24px'
        }}>
          Login to your FamilyOrg account
        </p>

        <form className="auth-form" onSubmit={submit}>
          <div>
            <label className={emailValid ? 'filled' : ''} style={{
              position: 'relative',
              display: 'block'
            }}>
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
            <label className={password.length ? 'filled' : ''} style={{
              display: 'block'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                🔒 Password
              </span>
              <div className="pw-row">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    transition: 'all 200ms',
                    borderColor: password.length ? 'var(--blue)' : 'var(--border)',
                    backgroundColor: password.length ? 'rgba(84, 160, 255, 0.02)' : 'transparent'
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
            {submitting ? '🔄 Signing in...' : '✓ Login'}
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
          Don't have an account?{' '}
          <Link to="/register" style={{
            color: 'var(--blue)',
            textDecoration: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'color 200ms'
          }} onMouseEnter={e => e.target.style.color = 'var(--purple)'} onMouseLeave={e => e.target.style.color = 'var(--blue)'}>
            Sign up here
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
