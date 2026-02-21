import React, { useContext, useEffect, useRef, useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Notifications from './pages/Notifications'
import TripDetails from './pages/TripDetails'
import EventDetails from './pages/EventDetails'
import UserProfile from './pages/UserProfile'
import AttendedRecords from './pages/AttendedRecords'
import ProtectedRoute from './components/ProtectedRoute'
import AuthRedirect from './components/AuthRedirect'
import { AuthContext } from './context/AuthContext'

const HERO_WORDS = ['Trips', 'Events', 'Tasks', 'Expenses']

export default function App() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [heroWordIndex, setHeroWordIndex] = useState(0)
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

  useEffect(() => {
    if (user) return
    const interval = setInterval(() => {
      setHeroWordIndex(prev => (prev + 1) % HERO_WORDS.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [user])

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="app-nav" style={{
        padding: '10px 14px',
        display: 'flex',
        gap: '12px',
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
        <Link to="/" aria-label="FamilyOrg" title="FamilyOrg" className="brand-link" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 1,
          minWidth: 0,
          maxWidth: '65%',
          textDecoration: 'none',
          transition: 'transform 150ms'
        }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <img
            src="/themes/icon.png"
            alt="FamilyOrg"
            className="brand-logo"
            style={{ height: 52, width: 'auto', maxWidth: 190, display: 'block', objectFit: 'contain' }}
          />
        </Link>

        <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto', justifyContent: 'flex-end', flexShrink: 0 }}>
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
                    onClick={() => { setMenuOpen(false); navigate('/attended-records') }}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', background: 'white', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >📚 Attended Records</button>
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
              <Link to="/login" className="nav-login" style={{
                color: 'var(--text)',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'color 150ms'
              }} onMouseEnter={e => e.target.style.color = 'var(--blue)'} onMouseLeave={e => e.target.style.color = 'var(--text)'}>
                Login
              </Link>
              <Link to="/register" className="nav-register" style={{
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
        @media (max-width: 768px) {
          .app-nav {
            padding: 8px 10px !important;
            gap: 8px !important;
            margin: 6px !important;
            min-height: 54px !important;
          }
          .brand-link {
            max-width: calc(100% - 130px) !important;
          }
          .brand-logo {
            height: 42px !important;
            max-width: 150px !important;
          }
          .nav-actions {
            gap: 8px !important;
          }
          .nav-login,
          .nav-register {
            font-size: 13px !important;
          }
          .nav-register {
            padding: 7px 12px !important;
          }
          .avatar-btn {
            width: 36px !important;
            height: 36px !important;
            font-size: 18px !important;
          }
          .user-menu {
            top: 42px !important;
            min-width: 160px !important;
          }
        }
        @media (max-width: 420px) {
          .brand-logo {
            height: 36px !important;
            max-width: 120px !important;
          }
          .nav-register {
            padding: 6px 10px !important;
            border-radius: 7px !important;
          }
        }
        .hero-root {
          min-height: calc(100vh - 84px);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 24px;
          background-size: 200% 200%;
          animation: gradientShift 14s ease infinite;
          isolation: isolate;
        }
        .hero-glow {
          position: absolute;
          border-radius: 999px;
          filter: blur(3px);
          opacity: 0.42;
          z-index: 0;
        }
        .hero-glow-one {
          width: 280px;
          height: 280px;
          background: rgba(255, 255, 255, 0.28);
          top: -70px;
          left: -70px;
          animation: floatGlow 10s ease-in-out infinite;
        }
        .hero-glow-two {
          width: 320px;
          height: 320px;
          background: rgba(173, 216, 255, 0.30);
          bottom: -90px;
          right: -90px;
          animation: floatGlow 12s ease-in-out infinite reverse;
        }
        .hero-card {
          text-align: center;
          color: white;
          max-width: 680px;
          width: 100%;
          position: relative;
          z-index: 1;
          padding: clamp(20px, 4vw, 34px);
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.10);
          border: 1px solid rgba(255, 255, 255, 0.24);
          backdrop-filter: blur(8px);
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.16);
          animation: heroPopIn 550ms ease-out;
        }
        .hero-kicker {
          margin: 0 0 10px 0;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          opacity: 0.86;
        }
        .hero-title {
          font-size: clamp(34px, 6vw, 52px);
          font-weight: 800;
          margin: 0 0 14px 0;
          line-height: 1.1;
        }
        .hero-subtitle {
          font-size: clamp(17px, 2.8vw, 22px);
          margin-bottom: 28px;
          line-height: 1.5;
          opacity: 0.96;
        }
        .hero-word {
          display: inline-block;
          margin-left: 0.4ch;
          min-width: 90px;
          text-align: left;
          font-weight: 800;
          color: #fef08a;
          animation: wordSwap 320ms ease;
        }
        .hero-cta-row {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .hero-btn {
          padding: 12px 30px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
          font-size: 16px;
          transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, color 180ms ease;
          display: inline-block;
          box-shadow: var(--shadow-md);
        }
        .hero-btn:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.9);
          outline-offset: 3px;
        }
        .hero-btn:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-lg);
        }
        .hero-btn-primary {
          background: white;
          color: #667eea;
        }
        .hero-btn-outline {
          background: rgba(255, 255, 255, 0.18);
          border: 2px solid white;
          color: white;
          animation: ctaPulse 2.8s ease-in-out infinite;
        }
        .hero-btn-outline:hover {
          background: white;
          color: #667eea;
        }
        .hero-meta {
          margin: 14px 0 0 0;
          font-size: 13px;
          opacity: 0.82;
        }
        @media (max-width: 640px) {
          .hero-root {
            min-height: calc(100vh - 72px);
            padding: 14px;
          }
          .hero-card {
            padding: 18px;
            border-radius: 16px;
          }
          .hero-kicker {
            font-size: 11px;
          }
          .hero-btn {
            width: min(100%, 220px);
          }
          .hero-word {
            min-width: 70px;
          }
          .hero-meta {
            font-size: 12px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-root,
          .hero-card,
          .hero-glow-one,
          .hero-glow-two,
          .hero-word,
          .hero-btn-outline,
          .avatar-btn:hover {
            animation: none !important;
          }
          .hero-btn,
          .avatar-btn,
          .brand-link {
            transition: none !important;
          }
          .hero-btn:hover,
          .avatar-btn:hover {
            transform: none !important;
          }
        }
        @keyframes wordSwap {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroPopIn {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes floatGlow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(18px) translateX(10px); }
        }
        @keyframes ctaPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.18); }
          50% { box-shadow: 0 0 0 9px rgba(255, 255, 255, 0); }
        }
      `}</style>

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={
            <AuthRedirect>
            <div className="hero-root">
              <div className="hero-glow hero-glow-one" />
              <div className="hero-glow hero-glow-two" />
              <div className="hero-card">
                <p className="hero-kicker">Plan better • Stay connected • Celebrate more</p>
                <h1 className="hero-title">
                  Welcome to FamilyOrg
                </h1>
                <p className="hero-subtitle">
                  Keep your family organized with
                  <span key={HERO_WORDS[heroWordIndex]} className="hero-word">{HERO_WORDS[heroWordIndex]}</span>
                  — all in one place.
                </p>
                {!user && (
                  <>
                    <div className="hero-cta-row">
                      <Link to="/login" className="hero-btn hero-btn-primary">
                        Login
                      </Link>
                      <Link to="/register" className="hero-btn hero-btn-outline">
                        Sign Up
                      </Link>
                    </div>
                    <p className="hero-meta">Trusted by families for events, trips, and shared planning.</p>
                  </>
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
          <Route path="/attended-records" element={<ProtectedRoute><AttendedRecords /></ProtectedRoute>} />
          <Route path="/trips/:tripId" element={<ProtectedRoute><TripDetails /></ProtectedRoute>} />
          <Route path="/events/:eventId" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  )
}
