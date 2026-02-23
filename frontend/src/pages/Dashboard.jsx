import React, { useEffect, useState, useContext, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { formatDate } from '../utils/date'
import SummaryCard from '../components/SummaryCard'
import CreateBox from '../components/CreateBox'
import ThemedCard from '../components/ThemedCard'
import PendingInvitations from '../components/PendingInvitations'
import { AuthContext } from '../context/AuthContext'
import { getEventTheme, getTripTheme } from '../utils/themeConfig'

export default function Dashboard() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const lastFetchAtRef = useRef(0)
  const fetchInFlightRef = useRef(false)

  const fetchSummary = useCallback(async ({ force = false, bypassCache = false } = {}) => {
    const nowTs = Date.now()
    if (!force && nowTs - lastFetchAtRef.current < 15000) {
      return
    }
    if (fetchInFlightRef.current) {
      return
    }

    fetchInFlightRef.current = true
    try {
      setRefreshing(true)
      const res = await api.get('/dashboard/summary', {
        params: bypassCache ? { force: '1' } : undefined
      })
      setSummary(res.data)
      setError(null)
      lastFetchAtRef.current = Date.now()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
      fetchInFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    fetchSummary({ force: true })
    
    // Refetch summary when user comes back to dashboard
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSummary()
      }
    }
    
    const handleFocus = () => {
      fetchSummary()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchSummary])

  if (loading) return (
    <div className="dashboard-loader">
      <div style={{
        display: 'inline-block',
        animation: 'spin 1s linear infinite'
      }}>⏳</div>
      <p>Loading your dashboard...</p>
    </div>
  )
  if (error) return <div className="dashboard-error">⚠️ {error}</div>
  if (!summary) return (
    <div className="dashboard-loader">
      <div style={{
        display: 'inline-block',
        animation: 'spin 1s linear infinite'
      }}>⏳</div>
      <p>Loading your dashboard...</p>
    </div>
  )

  const { counts } = summary
  const pastEvents = summary.pastEvents || []
  const pastTrips = summary.pastTrips || []

  const now = new Date()
  const recentWindowStart = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3)
  const recentCreated = (summary.recentCreated || []).filter(r => {
    const createdAt = new Date(r.date)
    if (Number.isNaN(createdAt.getTime()) || createdAt < recentWindowStart) return false

    if (r.type === 'event') {
      const eventDate = new Date(r.meta?.date)
      return !Number.isNaN(eventDate.getTime()) && eventDate >= now
    }

    if (r.type === 'trip') {
      const tripEnd = new Date(r.meta?.endDate)
      return !Number.isNaN(tripEnd.getTime()) && tripEnd >= now
    }

    return false
  })

  return (
    <div className="dashboard-container">

      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1>👋 Welcome back, {user?.name}!</h1>
          <p className="subtitle">Here's your family activity overview</p>
        </div>

        <div className="dashboard-actions">
          <Link 
            to="/notifications"
            style={{
              padding: '10px 16px',
              background: 'var(--border)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
              textDecoration: 'none',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 200ms',
              position: 'relative'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'
              e.currentTarget.style.borderColor = 'var(--blue)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--border)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            🔔 Notifications
            {counts.unreadNotifications > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                background: 'var(--red)',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '700',
                border: '2px solid white'
              }}>
                {counts.unreadNotifications > 9 ? '9+' : counts.unreadNotifications}
              </span>
            )}
          </Link>
          <CreateBox onCreated={fetchSummary} />
          <button 
            className="btn refresh-btn" 
            onClick={() => fetchSummary({ force: true, bypassCache: true })}
            disabled={refreshing}
            style={{ opacity: refreshing ? 0.7 : 1 }}
          >
            {refreshing ? '⟳ Updating...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="summary-grid">
        <SummaryCard 
          title="📅 Upcoming Events" 
          value={counts.upcomingEvents} 
          color="var(--pink)" 
        />
        <SummaryCard 
          title="✈ Upcoming Trips" 
          value={counts.activeTrips} 
          color="var(--green)" 
        />
        {/* <SummaryCard 
          title="🔔 Notifications" 
          value={counts.unreadNotifications} 
          color="var(--blue)" 
        /> */}
        {/* <SummaryCard 
          title="✎ Open Tasks" 
          value={counts.openTasks} 
          color="var(--purple)" 
        /> */}
      </div>

      {/* CONTENT GRID */}
      <div className="content-grid">

        {/* PENDING INVITATIONS */}
        <div className="panel full">
          <h3>👥 Pending Invitations</h3>
          <PendingInvitations onRefresh={fetchSummary} />
        </div>

        {/* UPCOMING EVENTS */}
        <div className="panel">
          <h3>📅 Upcoming Events</h3>
          {summary.upcomingEvents.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {summary.upcomingEvents.map(e => {
                const themeData = getEventTheme(e.theme);
                const isOrganizer = e.attendees?.some(a => {
                  const userIdString = typeof a.userId === 'string'
                    ? a.userId
                    : (a.userId?._id ? String(a.userId._id) : String(a.userId || ''));
                  return userIdString === user?.id && a.role === 'organizer';
                });
                const canDelete = user?.role === 'admin' || isOrganizer;

                const handleDelete = async (event) => {
                  event.stopPropagation();
                  if (!confirm('🗑️ Are you sure you want to delete this event?')) return;
                  try {
                    await api.delete(`/events/${e._id}`);
                    fetchSummary();
                  } catch (err) {
                    alert(err.response?.data?.message || 'Failed to delete event');
                  }
                };

                return (
                  <ThemedCard 
                    key={e._id}
                    type="event"
                    theme={e.theme}
                    onClick={() => navigate(`/events/${e._id}`)}
                  >
                    {canDelete && (
                      <button
                        onClick={handleDelete}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(231, 76, 60, 0.1)',
                          border: '1px solid rgba(231, 76, 60, 0.3)',
                          color: 'var(--red)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'all 150ms',
                          fontWeight: '500',
                          zIndex: 10
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(231, 76, 60, 0.2)';
                          e.currentTarget.style.borderColor = 'var(--red)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(231, 76, 60, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(231, 76, 60, 0.3)';
                        }}
                      >
                        🗑️
                      </button>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                        {e.title}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        📍 {e.location || 'Location TBD'} • ⏰ {formatDate(e.date)}
                      </div>
                    </div>
                  </ThemedCard>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🪩</div>
              No upcoming events
            </div>
          )}
        </div>

        {/* ACTIVE TRIPS */}
        <div className="panel">
          <h3>✈ Upcoming Trips</h3>
          {summary.activeTrips && summary.activeTrips.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {summary.activeTrips.map(t => {
                const themeData = getTripTheme(t.theme);
                const isOrganizer = t.participants?.some(p => {
                  const userIdString = typeof p.userId === 'string'
                    ? p.userId
                    : (p.userId?._id ? String(p.userId._id) : String(p.userId || ''));
                  return userIdString === user?.id && p.role === 'organizer';
                });
                const canDelete = user?.role === 'admin' || isOrganizer;

                const handleDelete = async (event) => {
                  event.stopPropagation();
                  if (!confirm('🗑️ Are you sure you want to delete this trip?')) return;
                  try {
                    await api.delete(`/trips/${t._id}`);
                    fetchSummary();
                  } catch (err) {
                    alert(err.response?.data?.message || 'Failed to delete trip');
                  }
                };

                return (
                  <ThemedCard 
                    key={t._id}
                    type="trip"
                    theme={t.theme}
                    onClick={() => navigate(`/trips/${t._id}`)}
                  >
                    {canDelete && (
                      <button
                        onClick={handleDelete}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(231, 76, 60, 0.1)',
                          border: '1px solid rgba(231, 76, 60, 0.3)',
                          color: 'var(--red)',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          transition: 'all 150ms',
                          fontWeight: '500',
                          zIndex: 10
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(231, 76, 60, 0.2)';
                          e.currentTarget.style.borderColor = 'var(--red)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(231, 76, 60, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(231, 76, 60, 0.3)';
                        }}
                      >
                        🗑️
                      </button>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {formatDate(t.startDate)} - {formatDate(t.endDate)}
                      </div>
                    </div>
                  </ThemedCard>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏖</div>
              No active trips planned
            </div>
          )}
        </div>

        {/* RECENTLY CREATED */}
        <div className="panel">
          <h3>🆕 Newly Created</h3>
          {recentCreated.length ? (
            <ul className="list">
              {recentCreated.map((r, i) => (
                <li key={i} className="list-item">
                  <div style={{ flex: 1 }}>
                    <div className="item-title">
                      {r.title} <span className="muted">({r.type})</span>
                    </div>
                    <div className="item-meta">
                      {formatDate(r.date)} at {new Date(r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>✨</div>
              No newly created items
            </div>
          )}
        </div>
        
        {/* PAST EVENTS & TRIPS */}
        <div className="panel full">
          <h3>🕘 Past Events & Trips</h3>
          <div className="dual-lists">
            <div className="dual-column">
              <h4 className="subheading">Events</h4>
              {pastEvents.length ? (
                <ul className="list compact">
                  {pastEvents.map(e => (
                    <li
                      key={e._id}
                      className="list-item"
                      onClick={() => navigate(`/events/${e._id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div className="item-title">{e.title}</div>
                        <div className="item-meta">
                          📍 {e.location || 'Location TBD'} • ⏰ {formatDate(e.date)}
                        </div>
                        <div className="item-meta">
                          👥 {e.attendees?.length || 0} attendees
                        </div>
                        {e.googlePhotosAlbumUrl && (
                          <button
                            onClick={() => window.open(e.googlePhotosAlbumUrl, '_blank')}
                            style={{
                              marginTop: '8px',
                              padding: '6px 12px',
                              background: 'var(--blue)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              transition: 'all var(--transition-fast)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--purple)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--blue)'}
                          >
                            📷 View Album
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📭</div>
                  No past events
                </div>
              )}
            </div>

            <div className="dual-column">
              <h4 className="subheading">Trips</h4>
              {pastTrips.length ? (
                <ul className="list compact">
                  {pastTrips.map(t => (
                    <li
                      key={t._id}
                      className="list-item"
                      onClick={() => navigate(`/trips/${t._id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div className="item-title">{t.title}</div>
                        <div className="item-meta">
                          {formatDate(t.startDate)} - {formatDate(t.endDate)}
                        </div>
                        <div className="item-meta">
                          📍 {t.places?.length ? t.places.join(', ') : 'Places TBD'}
                        </div>
                        <div className="item-meta">
                          👥 {t.participants?.length || 0} participants • 💰 {Number(t.expenseTotal || 0).toLocaleString()}
                        </div>
                        {t.googlePhotosAlbumUrl && (
                          <button
                            onClick={() => window.open(t.googlePhotosAlbumUrl, '_blank')}
                            style={{
                              marginTop: '8px',
                              padding: '6px 12px',
                              background: 'var(--blue)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                              transition: 'all var(--transition-fast)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--purple)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--blue)'}
                          >
                            📷 View Album
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏁</div>
                  No past trips
                </div>
              )}
            </div>
          </div>
        </div>
        
        

        {/* ACTIVITY */}
        {/* <div className="panel full">
          <h3>📊 Recent Activity</h3>
          {summary.activity && summary.activity.length ? (
            <ul className="activity">
              {summary.activity.map((a, i) => (
                <li key={i} style={{ padding: '14px 0', borderBottom: i < summary.activity.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className="item-title" style={{ marginBottom: '4px' }}>{a.text}</div>
                  <div className="muted">{new Date(a.date).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📭</div>
              No recent activity
            </div>
          )}
        </div> */}

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
