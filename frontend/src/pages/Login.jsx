import React, { useState, useContext, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

const LOGIN_TIPS = [
  'Use the same email you used while creating your account.',
  'You can click Show to verify your password before signing in.',
  'Keep your password private and avoid using shared devices.',
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tipIndex, setTipIndex] = useState(0)
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const emailValid = /\S+@\S+\.\S+/.test(email)
  const canSubmit = emailValid && password.length > 0 && !submitting
  const hour = new Date().getHours()
  // const greeting = hour < 12 ? 'Good morning 👋' : hour < 18 ? 'Good afternoon 👋' : 'Good evening 👋'

  useEffect(() => setError(null), [email, password])

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % LOGIN_TIPS.length)
    }, 2600)
    return () => clearInterval(interval)
  }, [])

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
          color: 'var(--auth-muted)',
          fontSize: '14px',
          marginBottom: '10px'
        }}>
          Login to your FamilyOrg account
        </p>
        {/* <div className="auth-live-pill">{greeting}</div> */}
        <p key={LOGIN_TIPS[tipIndex]} className="auth-dynamic-tip">💡 {LOGIN_TIPS[tipIndex]}</p>

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
                  backgroundColor: emailValid ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.94)',
                  color: '#1f2937'
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
                <div className="pw-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{
                      transition: 'all 200ms',
                      borderColor: password.length ? 'var(--blue)' : 'var(--border)',
                      backgroundColor: password.length ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.94)',
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
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          color: 'var(--auth-muted)',
          fontSize: '14px'
        }}>
          Don't have an account?{' '}
          <Link to="/register" style={{
            color: 'var(--auth-link)',
            textDecoration: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'color 200ms'
          }} onMouseEnter={e => e.target.style.color = 'var(--auth-link-hover)'} onMouseLeave={e => e.target.style.color = 'var(--auth-link)'}>
            Sign up here
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
        .auth-live-pill {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: var(--purple);
          background: rgba(108, 92, 231, 0.10);
          border: 1px solid rgba(108, 92, 231, 0.22);
          border-radius: 999px;
          padding: 6px 10px;
          width: fit-content;
          margin: 0 auto 8px;
        }
        .auth-dynamic-tip {
          margin: 0 0 8px 0;
          text-align: center;
          color: var(--auth-muted);
          font-size: 12px;
          animation: fadeUp 260ms ease;
          min-height: 18px;
        }
      `}</style>
    </div>
  )
} 
