import React, { useState, useContext, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

const REGISTER_HIGHLIGHTS = [
  'Plan events together faster.',
  'Track trip tasks and expenses in one place.',
  'Stay in sync with smart family notifications.',
]

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)
  const { register } = useContext(AuthContext)
  const navigate = useNavigate()

  const emailValid = /\S+@\S+\.\S+/.test(email)
  const passwordValid = password.length >= 6
  const nameValid = name.trim().length > 0
  const canSubmit = emailValid && passwordValid && nameValid && !submitting
  const strengthChecks = [
    password.length >= 6,
    /[A-Z]/.test(password) && /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const strengthScore = strengthChecks.filter(Boolean).length
  const strengthPercent = [0, 30, 55, 78, 100][strengthScore]
  const strengthLabel = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'][strengthScore]

  useEffect(() => { setError(null) }, [name, email, password])

  useEffect(() => {
    const interval = setInterval(() => {
      setHighlightIndex(prev => (prev + 1) % REGISTER_HIGHLIGHTS.length)
    }, 2400)
    return () => clearInterval(interval)
  }, [])

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
          color: 'var(--auth-muted)',
          fontSize: '14px',
          marginBottom: '10px'
        }}>
          Create your account to get started
        </p>
        <p key={REGISTER_HIGHLIGHTS[highlightIndex]} className="auth-dynamic-tip">✨ {REGISTER_HIGHLIGHTS[highlightIndex]}</p>

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
                  backgroundColor: nameValid ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.94)',
                  color: '#1f2937'
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
                  backgroundColor: emailValid ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.94)',
                  color: '#1f2937'
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
                <div className="pw-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    style={{
                      transition: 'all 200ms',
                      borderColor: passwordValid ? 'var(--blue)' : 'var(--border)',
                      backgroundColor: passwordValid ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.94)',
                      color: '#1f2937'
                    }}
                  />
                  <button
                    type="button"
                    className="show-btn"
                    onClick={() => setShowPassword(s => !s)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </label>
            <div className="strength-wrap" aria-live="polite">
              <div className="strength-head">
                <span>Password strength</span>
                <strong>{password ? strengthLabel : '—'}</strong>
              </div>
              <div className="strength-track">
                <div className="strength-fill" style={{ width: `${password ? strengthPercent : 0}%` }} />
              </div>
            </div>
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
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          color: 'var(--auth-muted)',
          fontSize: '14px'
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            color: 'var(--auth-link)',
            textDecoration: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'color 200ms'
          }} onMouseEnter={e => e.target.style.color = 'var(--auth-link-hover)'} onMouseLeave={e => e.target.style.color = 'var(--auth-link)'}>
            Login here
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auth-dynamic-tip {
          margin: 0 0 8px 0;
          text-align: center;
          color: var(--auth-muted);
          font-size: 12px;
          min-height: 18px;
          animation: fadeUp 260ms ease;
        }
        .strength-wrap {
          margin-top: 6px;
        }
        .strength-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: var(--auth-muted);
          margin-bottom: 6px;
        }
        .strength-head strong {
          color: var(--purple);
          font-size: 12px;
        }
        .strength-track {
          height: 8px;
          background: #eef2f6;
          border-radius: 999px;
          overflow: hidden;
          border: 1px solid var(--border);
        }
        .strength-fill {
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          transition: width 220ms ease;
          border-radius: inherit;
        }
      `}</style>
    </div>
  )
} 
