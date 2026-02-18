import React, { useEffect, useState, useContext } from 'react'
import api from '../services/api'
import { AuthContext } from '../context/AuthContext'
import { formatDate } from '../utils/date'

export default function Notifications() {
  const { user } = useContext(AuthContext)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchNotifications = async () => {
    try {
      setIsRefreshing(true)
      const res = await api.get('/notifications')
      setNotifications(res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`)
      setNotifications(notifs => notifs.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ))
    } catch (err) { console.error(err) }
  }

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`)
      setNotifications(notifs => notifs.filter(n => n._id !== notificationId))
    } catch (err) { console.error(err) }
  }

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read')
      setNotifications(notifs => notifs.map(n => ({ ...n, isRead: true })))
    } catch (err) { console.error(err) }
  }

  const filteredNotifications = (() => {
    if (filter === 'all') return notifications
    if (filter === 'unread') return notifications.filter(n => !n.isRead)
    if (filter === 'invitations') return notifications.filter(n => n.type === 'invitation')
    if (filter === 'events') return notifications.filter(n => n.type === 'event_update' || n.type === 'trip_update')
    if (filter === 'responses') return notifications.filter(n => n.type === 'rsvp_response')
    return notifications
  })()

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (loading && !isRefreshing) return (
    <div className="modern-loader">
      <div className="shimmer-circle"></div>
      <p>Syncing your updates...</p>
    </div>
  )

  return (
    <div className="notif-wrapper">
      {/* GLOSSY HEADER */}
      <div className="notif-header-card">
        <div className="brand-section">
          <h1>Notifications</h1>
          <div className="unread-badge">{unreadCount} New Activity</div>
        </div>
        
        <div className="header-actions">
          {unreadCount > 0 && (
            <button className="glass-btn primary" onClick={markAllAsRead}>
              <span>✓</span> <span className="btn-text">Mark all read</span>
            </button>
          )}
          <button 
            className={`glass-btn secondary ${isRefreshing ? 'spinning' : ''}`} 
            onClick={fetchNotifications}
          >
            <span className="icon">🔄</span> <span className="btn-text">Refresh</span>
          </button>
        </div>
      </div>

      {/* SMART FILTERS (No Horizontal Scroll) */}
      <div className="filter-container">
        {['all', 'unread', 'invitations', 'events', 'responses'].map((f, i) => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`chip ${filter === f ? 'active' : ''}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {f === 'all' && '📋 All'}
            {f === 'unread' && '📬 Unread'}
            {f === 'invitations' && '✉️ Invites'}
            {f === 'events' && '📅 Events'}
            {f === 'responses' && '✅ Responses'}
          </button>
        ))}
      </div>

      {/* NOTIFICATION FEED */}
      <div className="notif-feed">
        {error && <div className="error-banner">⚠️ {error}</div>}
        
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✨</div>
            <h3>Everything is clear</h3>
            <p>You've caught up with all family updates.</p>
          </div>
        ) : (
          filteredNotifications.map((n, i) => (
            <div 
              key={n._id}
              className={`modern-card ${n.isRead ? 'is-read' : 'is-unread'}`}
              style={{ '--index': i }}
              onClick={() => !n.isRead && markAsRead(n._id)}
            >
              <div className="card-accent" />
              <div className="type-icon">
                {n.type === 'invitation' ? '📬' : n.type === 'event_update' ? '📅' : '🔔'}
              </div>

              <div className="card-body">
                <div className="card-top">
                  <h4>{n.title}</h4>
                  <span className="timestamp">{formatDate(n.createdAt)}</span>
                </div>
                <p>{n.message}</p>
              </div>

              <div className="card-controls">
                <button className="icon-btn delete" title="Delete" onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}>
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .notif-wrapper {
          max-width: 850px;
          margin: 0 auto;
          padding: 2.5rem 1.25rem;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        /* HEADER BOX */
        .notif-header-card {
          background: #ffffff;
          padding: 2rem;
          border-radius: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          box-shadow: 0 10px 40px rgba(0,0,0,0.04);
          border: 1px solid #f0f0f0;
        }

        .brand-section h1 {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #1a1a1a;
        }

        .unread-badge {
          display: inline-block;
          background: rgba(108, 92, 231, 0.1);
          color: #6c5ce7;
          padding: 4px 14px;
          border-radius: 100px;
          font-size: 0.85rem;
          font-weight: 700;
          margin-top: 8px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .glass-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          border: 1px solid #e0e6ed;
          background: white;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .glass-btn.primary {
          background: #6c5ce7;
          color: white;
          border: none;
        }

        .glass-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }
        
        .spinning .icon {
          display: inline-block;
          animation: rotate 0.20s linear infinite;
        }

        /* FILTERS - FIXED FOR MOBILE */
        .filter-container {
          display: flex;
          flex-wrap: wrap; /* Wraps instead of scrolling */
          gap: 10px;
          margin-bottom: 2.5rem;
        }

        .chip {
          padding: 8px 18px;
          border-radius: 100px;
          border: 1px solid #eef0f2;
          background: white;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
          color: #636e72;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
        }

        .chip.active {
          background: #2d3436;
          color: white;
          border-color: #2d3436;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        /* FEED CARDS */
        .notif-feed { display: grid; gap: 14px; }

        .modern-card {
          display: flex;
          align-items: center;
          padding: 1.25rem 1.5rem;
          background: white;
          border-radius: 18px;
          border: 1px solid #f1f2f6;
          gap: 1.25rem;
          position: relative;
          transition: all 0.3s ease;
          cursor: pointer;
          animation: slideUp 0.6s ease forwards;
          animation-delay: calc(var(--index) * 0.08s);
          opacity: 0;
        }

        .modern-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.04);
        }

        .card-accent {
          position: absolute;
          left: 0; top: 15%; bottom: 15%;
          width: 4px; border-radius: 0 4px 4px 0;
          background: transparent;
        }

        .is-unread .card-accent { background: #6c5ce7; }
        .is-unread { background: #fcfcff; border-color: #eaebff; }

        .type-icon {
          font-size: 1.5rem;
          background: #f8f9fa;
          width: 50px; height: 50px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 14px;
        }

        .card-body { flex: 1; }
        .card-top { display: flex; justify-content: space-between; margin-bottom: 2px; }
        .card-top h4 { margin: 0; font-size: 1rem; font-weight: 700; color: #1a1a1a; }
        .timestamp { font-size: 0.75rem; color: #b2bec3; font-weight: 500; }
        .card-body p { margin: 0; color: #636e72; font-size: 0.9rem; line-height: 1.4; }

        .icon-btn {
          background: none; border: none; font-size: 1.1rem;
          padding: 8px; border-radius: 10px; cursor: pointer;
          transition: background 0.2s; opacity: 0.4;
        }
        .icon-btn:hover { background: #fff0f0; opacity: 1; }

        .error-banner {
          background: #fff5f5; color: #e74c3c; padding: 12px;
          border-radius: 12px; margin-bottom: 1rem; font-weight: 600;
        }

        /* KEYFRAMES */
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* MOBILE FIXES */
        @media (max-width: 600px) {
          .notif-header-card { 
            flex-direction: column; 
            padding: 1.5rem; 
            text-align: center;
            gap: 1.25rem;
          }
          .header-actions { width: 100%; justify-content: center; }
          .btn-text { display: none; } /* Show only icons on very small screens to save space */
          .glass-btn { padding: 10px 14px; }
          
          .filter-container { justify-content: center; }
          .chip { padding: 6px 14px; font-size: 0.8rem; }
          
          .modern-card { padding: 1rem; gap: 0.75rem; }
          .type-icon { width: 40px; height: 40px; font-size: 1.2rem; }
        }
      `}</style>
    </div>
  )
}