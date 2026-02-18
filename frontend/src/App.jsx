import React, { useContext, useEffect, useRef, useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Notifications from './pages/Notifications'
import TripDetails from './pages/TripDetails'
import EventDetails from './pages/EventDetails'
import UserProfile from './pages/UserProfile'
import ProtectedRoute from './components/ProtectedRoute'
import AuthRedirect from './components/AuthRedirect'
import { AuthContext } from './context/AuthContext'

export default function App() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const initial = (((user?.name || '').trim()[0]) || '?').toUpperCase()
  const btnRef = useRef(null)
  const menuRef = useRef(null)

  // Close menu on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!menuOpen) return
      const btnEl = btnRef.current
      const menuEl = menuRef.current
      if (btnEl && btnEl.contains(e.target)) return
      if (menuEl && menuEl.contains(e.target)) return
      setMenuOpen(false)
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen])

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{
        padding: '8px 12px',
        display: 'flex',
        gap: '20px',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        boxShadow: 'var(--shadow-md)',
        position: 'sticky',
        top: 8,
        margin: '8px',
        zIndex: 100,
        minHeight: '60px',
        backdropFilter: 'saturate(1.06)'
      }}>
        <Link to="/" aria-label="FamilyOrg" title="FamilyOrg" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          transition: 'transform 150ms'
        }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <img
            src="/themes/icon.png"
            alt="FamilyOrg"
            style={{ height: 56, width: 'auto', maxWidth: 200, display: 'block', objectFit: 'contain' }}
          />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                aria-label="User menu"
                className="avatar-btn"
                style={{
                  position: 'relative',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: '2px solid rgba(102, 126, 234, 0.35)',
                  background: 'linear-gradient( #3f3fda)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 400,
                  color: 'white',
                }}
                ref={btnRef}
              >{initial}</button>

              {menuOpen && (
                <div
                  className="user-menu"
                  ref={menuRef}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 48,
                    background: 'white',
                    borderRadius: 8,
                    minWidth: 180,
                    overflow: 'hidden',
                    zIndex: 200
                  }}
                >
                  <button
                    onClick={() => { setMenuOpen(false); navigate('/profile') }}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'white', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >👤 Profile</button>
                  <button
                    onClick={handleLogout}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'white', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 99, 99, 0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >🚪 Logout</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" style={{
                color: 'var(--text)',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'color 150ms'
              }} onMouseEnter={e => e.target.style.color = 'var(--blue)'} onMouseLeave={e => e.target.style.color = 'var(--text)'}>
                Login
              </Link>
              <Link to="/register" style={{
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 150ms',
                boxShadow: 'var(--shadow-md)',
                display: 'inline-block'
              }} onMouseEnter={e => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = 'var(--shadow-lg)'
              }} onMouseLeave={e => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'var(--shadow-md)'
              }}>
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      <style>{`
        .avatar-btn { 
          box-shadow: var(--shadow-sm);
          transition: transform 180ms ease, box-shadow 180ms ease, outline-color 180ms ease, background 180ms ease, border-color 180ms ease;
          outline: 2px solid transparent;
        }
        .avatar-btn:hover {
          transform: scale(1.06);
          box-shadow: 0 6px 18px rgba(102, 126, 234, 0.25);
          outline-color: rgba(102, 126, 234, 0.3);
          animation: avatarPulse 600ms ease-in-out 1;
          background: linear-gradient(180deg, rgba(118, 75, 162, 0.10), #ffffff);
          border-color: rgba(118, 75, 162, 0.45);
        }
        .avatar-btn:active { transform: scale(0.96); }
        @keyframes avatarPulse { 
          0% { transform: scale(1.02); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1.02); }
        }
        .user-menu {
          border: 1px solid rgba(102, 126, 234, 0.25);
          box-shadow: 0 12px 24px rgba(0,0,0,0.12);
          backdrop-filter: saturate(1.1);
        }
      `}</style>

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={
            <AuthRedirect>
            <div style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px',
              backgroundSize: '200% 200%',
              animation: 'gradientShift 15s ease infinite'
            }}>
              <div style={{
                textAlign: 'center',
                color: 'white',
                maxWidth: '600px'
              }}>
                <h1 style={{ fontSize: '48px', fontWeight: '800', margin: '0 0 20px 0' }}>
                  Welcome to FamilyOrg
                </h1>
                <p style={{ fontSize: '20px', marginBottom: '30px', opacity: 0.9 }}>
                  Organize your family's events, trips, tasks, and expenses all in one place.
                </p>
                {!user && (
                  <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/login" style={{
                      padding: '12px 32px',
                      background: 'white',
                      color: '#667eea',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '16px',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                      boxShadow: 'var(--shadow-lg)',
                      display: 'inline-block'
                    }} onMouseEnter={e => {
                      e.target.style.transform = 'translateY(-4px)'
                      e.target.style.boxShadow = 'var(--shadow-lg)'
                    }} onMouseLeave={e => {
                      e.target.style.transform = 'translateY(0)'
                    }}>
                      Login
                    </Link>
                    <Link to="/register" style={{
                      padding: '12px 32px',
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '16px',
                      cursor: 'pointer',
                      transition: 'all 150ms',
                      border: '2px solid white',
                      display: 'inline-block'
                    }} onMouseEnter={e => {
                      e.target.style.background = 'white'
                      e.target.style.color = '#667eea'
                      e.target.style.transform = 'translateY(-4px)'
                    }} onMouseLeave={e => {
                      e.target.style.background = 'rgba(255,255,255,0.2)'
                      e.target.style.color = 'white'
                      e.target.style.transform = 'translateY(0)'
                    }}>
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
            </AuthRedirect>
          } />
          <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
          <Route path="/register" element={<AuthRedirect><Register /></AuthRedirect>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/trips/:tripId" element={<ProtectedRoute><TripDetails /></ProtectedRoute>} />
          <Route path="/events/:eventId" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  )
}
