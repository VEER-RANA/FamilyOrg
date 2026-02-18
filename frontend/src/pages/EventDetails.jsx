import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { AuthContext } from '../context/AuthContext'
import ParticipantBadge from '../components/ParticipantBadge'
import InvitationStatusViewer from '../components/InvitationStatusViewer'
import InvitationManager from '../components/InvitationManager'
import ThemeSelectorModal from '../components/ThemeSelectorModal'
import { formatDate } from '../utils/date'
import { getEventTheme } from '../utils/themeConfig'

export default function EventDetails() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showInvitationViewer, setShowInvitationViewer] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState(null)

  // Update form state
  const [updateForm, setUpdateForm] = useState({
    title: '',
    datetime: '',
    location: '',
    description: '',
    googlePhotosAlbumUrl: '',
    theme: 'meeting'
  })

  // Comment state
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')

  // Photos
  const [albumLink, setAlbumLink] = useState('')

  useEffect(() => {
    fetchEventDetails()
    fetchComments()
  }, [eventId])

  useEffect(() => {
    if (event) {
      setAlbumLink(event.googlePhotosAlbumUrl || '')
      setSelectedTheme(event.theme || 'meeting')
    }
  }, [event])

  const fetchEventDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/events/${eventId}`)
      setEvent(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event details')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await api.get(`/events/${eventId}/comments`)
      setComments(response.data || [])
    } catch (err) {
      console.error('Failed to load comments:', err)
    }
  }

  const refreshAllData = async () => {
    await Promise.all([
      fetchEventDetails(),
      fetchComments()
    ])
  }

  const isOrganizer = event?.attendees?.some(a => {
    const attendeeId = typeof a.userId?._id === 'string' ? a.userId._id : a.userId?._id?.toString()
    const userId = typeof user?.id === 'string' ? user?.id : user?.id?.toString()
    return attendeeId === userId && a.role === 'organizer'
  })

  const acceptedAttendees = event?.attendees?.filter(a => a.status === 'accepted') || []

  const handleOpenUpdateModal = () => {
    if (event) {
      const eventDate = new Date(event.date)
      const localDatetime = new Date(eventDate.getTime() - eventDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      
      setUpdateForm({
        title: event.title || '',
        datetime: localDatetime,
        location: event.location || '',
        description: event.description || '',
        googlePhotosAlbumUrl: event.googlePhotosAlbumUrl || '',
        theme: event.theme || 'meeting'
      })
      setSelectedTheme(event.theme || 'meeting')
      setShowUpdateModal(true)
    }
  }

  const handleUpdateEvent = async () => {
    if (!updateForm.title || !updateForm.datetime) {
      alert('Please fill in title and date/time')
      return
    }

    if (new Date(updateForm.datetime) < new Date()) {
      alert('Event date cannot be in the past')
      return
    }

    try {
      await api.patch(`/events/${eventId}`, {
        ...updateForm,
        theme: selectedTheme,
        googlePhotosAlbumUrl: updateForm.googlePhotosAlbumUrl || null
      })
      await refreshAllData()
      setShowUpdateModal(false)
    //   alert('Event updated successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update event')
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    try {
      const response = await api.post(`/events/${eventId}/comments`, { text: newComment })
      setComments([...comments, response.data])
      setNewComment('')
    } catch (err) {
      alert('Failed to add comment')
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return
    try {
      await api.delete(`/events/${eventId}/comments/${commentId}`)
      setComments(comments.filter(c => c._id !== commentId))
    } catch (err) {
      alert('Failed to delete comment')
    }
  }

  const handleSaveAlbumLink = async () => {
    if (!isOrganizer) return
    if (albumLink && !albumLink.startsWith('http')) {
      alert('Please enter a valid URL')
      return
    }
    try {
      await api.patch(`/events/${eventId}`, { googlePhotosAlbumUrl: albumLink || null })
      if (event) {
        setEvent({ ...event, googlePhotosAlbumUrl: albumLink || null })
      }
      alert('Album link saved')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save album link')
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
        <p style={{ color: 'var(--text-light)' }}>Loading event details...</p>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <p style={{ color: 'var(--red)' }}>{error || 'Event not found'}</p>
        <button onClick={() => navigate('/dashboard')} style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: 'var(--blue)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}>
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>
      {/* Header */}
      {(() => {
        const themeData = getEventTheme(event.theme);
        return (
          <div style={{
            background: themeData.bannerImage
              ? `linear-gradient(135deg, rgba(158, 157, 168, 0.35) 0%, rgba(198, 133, 133, 0.55) 100%), url(${themeData.bannerImage})`
              : `linear-gradient(135deg, ${themeData.color}88 0%, ${themeData.color} 100%)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            borderRadius: '20px',
            padding: 'clamp(20px, 4vw, 30px)',
            color: 'white',
            marginBottom: '30px',
            overflow: 'hidden',
            borderLeft: `6px solid ${themeData.color}`
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '16px',
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  onClick={() => navigate('/dashboard')}
                  style={{
                    background: '#2d343669',
                    border: 'none',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                  title="Back to Dashboard"
                >
                  ←
                </button>
                <button
                  onClick={refreshAllData}
                  style={{
                    background: '#2d343669',
                    border: 'none',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                  title="Refresh all event data"
                >
                  🔄
                </button>
              </div>

              {isOrganizer && (
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    style={{
                      background: '#2d343669',
                      border: 'none',
                      color: 'white',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    👥 Invite
                  </button>
                  <button
                    onClick={() => setShowInvitationViewer(true)}
                    style={{
                      background: '#2d343669',
                      border: 'none',
                      color: 'white',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    📊 Status
                  </button>
                  <button
                    onClick={() => setShowThemeModal(true)}
                    style={{
                      background: '#2d343669',
                      border: 'none',
                      color: 'white',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {getEventTheme(event.theme).icon} Theme
                  </button>
                </div>
              )}
            </div>
            <h1 style={{ margin: '0 0 16px 0', fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: '800', wordBreak: 'break-word' }}>
              {event.title}
            </h1>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: 'clamp(14px, 2vw, 16px)', opacity: 0.95, flexDirection: 'column' }}>
              {event.location && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span>📍</span>
                  <span>{event.location}</span>
                </div>
              )}
              <div>📅 {formatDate(event.date)} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              <div>👥 {acceptedAttendees.length} Attendees</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#2d343669', width: 'fit-content', padding: '8px 12px', borderRadius: '8px' }}>
                <span>{getEventTheme(event.theme).icon}</span>
                <span>{getEventTheme(event.theme).name}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '30px',
        padding: '12px',
        flexWrap: 'wrap',
        background: 'white',
        borderRadius: '15px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        {[
          { id: 'overview', icon: '📋', label: 'Overview' },
          { id: 'comments', icon: '💬', label: 'Comments' },
          { id: 'attendees', icon: '👥', label: 'Attendees' },
          { id: 'photos', icon: '📸', label: 'Photos' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: 'clamp(10px, 2vw, 14px) clamp(14px, 3vw, 20px)',
              background: activeTab === tab.id ? '#f5576c' : '#f0f0f0',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: 'clamp(13px, 2vw, 15px)',
              color: activeTab === tab.id ? 'white' : 'var(--text)',
              transition: 'all 200ms ease',
              whiteSpace: 'nowrap',
              flex: '0 1 auto',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: '40px'
            }}
          >
            <span style={{ fontSize: 'clamp(16px, 2.5vw, 18px)' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: 'clamp(16px, 4vw, 30px)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        minHeight: '400px'
      }}>
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '700' }}>Event Overview</h2>
            {event.description && (
              <div style={{
                background: 'var(--bg-light)',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '24px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
                maxHeight: '320px',
                overflowY: 'auto'
              }}>
                {event.description}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '20px', background: 'var(--bg-light)', borderRadius: '12px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📅</div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Date & Time</div>
                <div style={{ color: 'var(--text-light)', fontSize: '14px' }}>
                  {formatDate(event.date)} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div style={{ padding: '20px', background: 'var(--bg-light)', borderRadius: '12px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📍</div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Location</div>
                <div style={{ color: 'var(--text-light)', fontSize: '14px' }}>
                  {event.location || 'Not specified'}
                </div>
              </div>
              <div style={{ padding: '20px', background: 'var(--bg-light)', borderRadius: '12px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Attendees</div>
                <div style={{ color: 'var(--text-light)', fontSize: '14px' }}>
                  {acceptedAttendees.length} confirmed
                </div>
              </div>
              <div 
                style={{ padding: '20px', background: 'var(--bg-light)', borderRadius: '12px', cursor: 'pointer' }}
                onClick={() => setActiveTab('comments')}
              >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>💬</div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Comments</div>
                <div style={{ color: 'var(--text-light)', fontSize: '14px' }}>
                  {comments.length} total
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '700' }}>Comments</h2>
            
            {/* Add Comment */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Add a comment..."
                style={{
                  flex: 1,
                  minWidth: '200px',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={handleAddComment}
                style={{
                  padding: '12px 24px',
                  background: '#f5576c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Post
              </button>
            </div>

            {/* Comments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {comments.length === 0 ? (
                <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '20px' }}>No comments yet</p>
              ) : (
                comments.map(comment => (
                  <div key={comment._id} style={{
                    padding: '16px',
                    background: 'var(--bg-light)',
                    borderRadius: '12px',
                    border: '1px solid #eee'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>
                        {comment.userId?.name || 'Anonymous'}
                      </div>
                      {(comment.userId?._id === user?.id || isOrganizer) && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--red)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '0'
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '8px' }}>
                        {formatDate(comment.createdAt)} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{comment.text}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'photos' && (
          <div>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '700' }}>Photo Gallery</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '16px', background: 'var(--bg-light)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: '700', marginBottom: '8px' }}>Google Photos album</div>
                <p style={{ margin: '0 0 12px 0', color: 'var(--text-light)', fontSize: '14px', lineHeight: '1.5' }}>
                  Create a Google Photos album for this event, upload images there, and paste the album link so everyone can open it.
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => window.open('https://photos.google.com/?pli=1', '_blank')}
                    style={{
                      padding: '10px 14px',
                      background: 'var(--blue)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    📂 Open Google Photos
                  </button>
                  {event.googlePhotosAlbumUrl && (
                    <button
                      onClick={() => window.open(event.googlePhotosAlbumUrl, '_blank')}
                      style={{
                        padding: '10px 14px',
                        background: '#f0f0f0',
                        color: 'var(--text)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      🔗 Open Event Album
                    </button>
                  )}
                </div>
                {isOrganizer && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '10px', flexDirection: 'column' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>
                      Album link
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        type="url"
                        value={albumLink}
                        onChange={e => setAlbumLink(e.target.value)}
                        placeholder="Paste the Google Photos album share link"
                        style={{ flex: 1, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '8px', minWidth: '220px' }}
                      />
                      <button
                        onClick={handleSaveAlbumLink}
                        style={{
                          padding: '10px 14px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '700'
                        }}
                      >
                        Save Link
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendees' && (
          <div>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '700' }}>Attendees</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
              {event.attendees && event.attendees.length > 0 ? (
                event.attendees.map(attendee => (
                  <div key={attendee._id} style={{
                    padding: '16px',
                    background: 'var(--bg-light)',
                    borderRadius: '12px',
                    border: '1px solid #eee'
                  }}>
                    {(() => {
                      const attendeeId = typeof attendee.userId === 'string' ? attendee.userId : attendee.userId?._id
                      const isYou = attendeeId && (attendeeId.toString() === (typeof user?.id === 'string' ? user.id : user?.id?.toString()))
                      return (
                        <ParticipantBadge role={attendee.role} status={attendee.status} isYou={isYou} />
                      )
                    })()}
                    <div style={{ marginTop: '12px', fontSize: '14px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        {attendee.userId?.name}
                      </div>
                      <div style={{ color: 'var(--text-light)', fontSize: '12px', marginBottom: '4px' }}>
                        {attendee.userId?.email}
                      </div>
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        background: attendee.status === 'accepted' ? '#1dd1a1' : attendee.status === 'declined' ? '#ff6348' : '#ffa502',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {attendee.status}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-light)' }}>No attendees yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Update Button */}
      {isOrganizer && (
        <button
          onClick={handleOpenUpdateModal}
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            transition: 'all 200ms'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
          }}
          title="Update Event"
        >
          ✏️
        </button>
      )}

      {/* Modals */}
      <InvitationManager
        itemId={eventId}
        itemType="event"
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvitationSent={() => {
          setShowInviteModal(false)
          refreshAllData()
        }}
      />

      <InvitationStatusViewer
        itemId={eventId}
        itemType="event"
        open={showInvitationViewer}
        onClose={() => setShowInvitationViewer(false)}
      />

      {/* Update Event Modal */}
      {showUpdateModal && (
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
            zIndex: 1000,
            padding: '16px',
            backdropFilter: 'blur(5px)',
            overflow: 'auto'
          }}
          onClick={() => setShowUpdateModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '32px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowUpdateModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: 'var(--text-light)'
              }}
            >
              ✕
            </button>

            <h2 style={{
              margin: '0 0 24px 0',
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--text)'
            }}>
              ✏️ Update Event
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: 'var(--text)'
                }}>
                  Event Title *
                </label>
                <input
                  type="text"
                  value={updateForm.title}
                  onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                  placeholder="e.g., Family Dinner"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: 'var(--text)'
                }}>
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={updateForm.datetime}
                  onChange={(e) => setUpdateForm({ ...updateForm, datetime: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: 'var(--text)'
                }}>
                  Location
                </label>
                <input
                  type="text"
                  value={updateForm.location}
                  onChange={(e) => setUpdateForm({ ...updateForm, location: e.target.value })}
                  placeholder="e.g., Home"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: 'var(--text)'
                }}>
                  Description
                </label>
                <textarea
                  value={updateForm.description}
                  onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
                  placeholder="Add event details..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: 'var(--text)'
                }}>
                  Event Theme
                </label>
                <button
                  onClick={() => setShowThemeModal(true)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `2px solid ${getEventTheme(selectedTheme).color}`,
                    backgroundColor: getEventTheme(selectedTheme).bgColor,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {getEventTheme(selectedTheme).icon} {getEventTheme(selectedTheme).name}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={handleUpdateEvent}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  💾 Save Changes
                </button>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  style={{
                    padding: '12px 24px',
                    background: 'var(--border)',
                    color: 'var(--text)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theme Selector Modal */}
      {showThemeModal && (
        <ThemeSelectorModal 
          type="event"
          currentTheme={selectedTheme}
          onSelect={(theme) => setSelectedTheme(theme)}
          onClose={() => setShowThemeModal(false)}
          onSave={async () => {
            try {
              await api.patch(`/events/${eventId}`, {
                ...updateForm,
                theme: selectedTheme
              })
              await refreshAllData()
              setShowThemeModal(false)
            } catch (err) {
              alert(err.response?.data?.message || 'Failed to update theme')
            }
          }}
        />
      )}
    </div>
  )
}
