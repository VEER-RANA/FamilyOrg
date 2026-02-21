import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { AuthContext } from '../context/AuthContext'
import ParticipantBadge from '../components/ParticipantBadge'
import InvitationStatusViewer from '../components/InvitationStatusViewer'
import InvitationManager from '../components/InvitationManager'
import ThemeSelectorModal from '../components/ThemeSelectorModal'
import { formatDate } from '../utils/date'
import { getTripTheme } from '../utils/themeConfig'

export default function TripDetails() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  
  const [trip, setTrip] = useState(null)
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
    startDate: '',
    endDate: '',
    places: '',
    googlePhotosAlbumUrl: '',
    theme: 'nature'
  })

  // Task state
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  
  // Budget state
  const [expenses, setExpenses] = useState([])
   const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'accommodation', paidBy: '' })
  
  // Comment state
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  
  // Photo state
  const [photos, setPhotos] = useState([])
  const [albumLink, setAlbumLink] = useState('')
 
   // Itinerary state
   const [newItinerary, setNewItinerary] = useState({ day: '', activities: '' })
   const [editingItinerary, setEditingItinerary] = useState(false)
   const [editingItineraryIndex, setEditingItineraryIndex] = useState(null)
   const [editItinerary, setEditItinerary] = useState({ day: '', activities: '' })

  useEffect(() => {
    fetchTripDetails()
    fetchTasks()
    fetchExpenses()
    fetchComments()
    fetchPhotos()
  }, [tripId])

  useEffect(() => {
    if (trip) {
      setAlbumLink(trip.googlePhotosAlbumUrl || '')
      setSelectedTheme(trip.theme || 'nature')
    }
  }, [trip])

  const fetchTripDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/trips/${tripId}`)
      setTrip(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trip details')
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await api.get(`/trips/${tripId}/tasks`)
      setTasks(response.data || [])
    } catch (err) {
      console.error('Failed to load tasks:', err)
    }
  }

  const fetchExpenses = async () => {
    try {
      const response = await api.get(`/trips/${tripId}/expenses`)
      setExpenses(response.data || [])
    } catch (err) {
      console.error('Failed to load expenses:', err)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await api.get(`/trips/${tripId}/comments`)
      setComments(response.data || [])
    } catch (err) {
      console.error('Failed to load comments:', err)
    }
  }

  const fetchPhotos = async () => {
    try {
      const response = await api.get(`/trips/${tripId}/photos`)
      setPhotos(response.data || [])
    } catch (err) {
      console.error('Failed to load photos:', err)
    }
  }

  const handleDeletePhoto = async (photoId) => {
    if (!confirm('Delete this photo?')) return
    try {
      await api.delete(`/trips/${tripId}/photos/${photoId}`)
      setPhotos(photos.filter(p => p._id !== photoId))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete photo')
    }
  }

  const handleSaveAlbumLink = async () => {
    if (!isOrganizer) return
    if (albumLink && !albumLink.startsWith('http')) {
      alert('Please enter a valid URL')
      return
    }
    try {
      await api.patch(`/trips/${tripId}`, { googlePhotosAlbumUrl: albumLink || null })
      if (trip) {
        setTrip({ ...trip, googlePhotosAlbumUrl: albumLink || null })
      }
      alert('Album link saved')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save album link')
    }
  }

  const refreshAllData = async () => {
    await Promise.all([
      fetchTripDetails(),
      fetchTasks(),
      fetchExpenses(),
      fetchComments(),
      fetchPhotos()
    ])
  }

  const isOrganizer = trip?.participants?.some(p => {
    const participantId = typeof p.userId?._id === 'string' ? p.userId._id : p.userId?._id?.toString()
    const userId = typeof user?.id === 'string' ? user?.id : user?.id?.toString()
    return participantId === userId && p.role === 'organizer'
  })

  const acceptedParticipants = trip?.participants?.filter(p => p.status === 'accepted') || []
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const totalBudget = trip?.budget || 0

  const handleOpenUpdateModal = () => {
    if (trip) {
      const startDate = new Date(trip.startDate)
      const endDate = new Date(trip.endDate)
      const localStartDate = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10)
      const localEndDate = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 10)
      
      setUpdateForm({
        title: trip.title || '',
        startDate: localStartDate,
        endDate: localEndDate,
        places: trip.places?.join(', ') || '',
        googlePhotosAlbumUrl: trip.googlePhotosAlbumUrl || '',
        theme: trip.theme || 'nature'
      })
      setSelectedTheme(trip.theme || 'nature')
      setShowUpdateModal(true)
    }
  }

  const handleUpdateTrip = async () => {
    if (!updateForm.title || !updateForm.startDate || !updateForm.endDate) {
      alert('Please fill in title and dates')
      return
    }

    if (new Date(updateForm.startDate) < new Date().setHours(0, 0, 0, 0)) {
      alert('Start date cannot be in the past')
      return
    }

    if (new Date(updateForm.endDate) < new Date(updateForm.startDate)) {
      alert('End date must be after start date')
      return
    }

    try {
      const places = updateForm.places.split(',').map(s => s.trim()).filter(Boolean)
      await api.patch(`/trips/${tripId}`, {
        title: updateForm.title,
        startDate: updateForm.startDate,
        endDate: updateForm.endDate,
        places,
        theme: selectedTheme,
        googlePhotosAlbumUrl: updateForm.googlePhotosAlbumUrl || null
      })
      await refreshAllData()
      setShowUpdateModal(false)
      // alert('Trip updated successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update trip')
    }
  }

  const handleAddTask = async () => {
    if (!newTask.trim()) return
    try {
      const response = await api.post(`/trips/${tripId}/tasks`, { description: newTask, completed: false })
      setTasks([...tasks, response.data])
      setNewTask('')
    } catch (err) {
      alert('Failed to add task')
    }
  }

  const handleToggleTask = async (taskId, completed) => {
    try {
      await api.patch(`/trips/${tripId}/tasks/${taskId}`, { completed: !completed })
      setTasks(tasks.map(t => t._id === taskId ? { ...t, completed: !completed } : t))
    } catch (err) {
      alert('Failed to update task')
    }
  }

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/trips/${tripId}/tasks/${taskId}`)
      setTasks(tasks.filter(t => t._id !== taskId))
    } catch (err) {
      alert('Failed to delete task')
    }
  }

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.paidBy) {
      alert('Please fill in all fields including who paid')
      return
    }
    try {
      const response = await api.post(`/trips/${tripId}/expenses`, newExpense)
      setExpenses([...expenses, response.data])
      setNewExpense({ description: '', amount: '', category: 'accommodation', paidBy: '' })
    } catch (err) {
      alert('Failed to add expense')
    }
  }

  const handleDeleteExpense = async (expenseId) => {
    try {
      await api.delete(`/trips/${tripId}/expenses/${expenseId}`)
      setExpenses(expenses.filter(e => e._id !== expenseId))
    } catch (err) {
      alert('Failed to delete expense')
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    try {
      const response = await api.post(`/trips/${tripId}/comments`, { text: newComment })
      setComments([...comments, response.data])
      setNewComment('')
    } catch (err) {
      alert('Failed to add comment')
    }
  }
 
   const handleDeleteComment = async (commentId) => {
     if (!confirm('Delete this comment?')) return
     try {
       await api.delete(`/trips/${tripId}/comments/${commentId}`)
       setComments(comments.filter(c => c._id !== commentId))
     } catch (err) {
       alert('Failed to delete comment')
     }
   }
 
   const handleAddItinerary = async () => {
     if (!newItinerary.day || !newItinerary.activities) return
     try {
       const activities = newItinerary.activities.split('\n').map(s => s.trim()).filter(Boolean)
       const updatedItinerary = [...(trip.itinerary || []), { day: parseInt(newItinerary.day), activities }]
       await api.patch(`/trips/${tripId}`, { itinerary: updatedItinerary })
       setTrip({ ...trip, itinerary: updatedItinerary })
       setNewItinerary({ day: '', activities: '' })
       setEditingItinerary(false)
     } catch (err) {
       alert('Failed to add itinerary')
     }
   }
 
   const handleDeleteItinerary = async (dayIndex) => {
     if (!confirm('Delete this day from itinerary?')) return
     try {
       const updatedItinerary = trip.itinerary.filter((_, idx) => idx !== dayIndex)
       await api.patch(`/trips/${tripId}`, { itinerary: updatedItinerary })
       setTrip({ ...trip, itinerary: updatedItinerary })
     } catch (err) {
       alert('Failed to delete itinerary')
     }
   }

   const handleEditItinerary = (dayIndex) => {
     const day = trip.itinerary[dayIndex]
     setEditingItineraryIndex(dayIndex)
     setEditItinerary({ day: day.day.toString(), activities: day.activities.join('\n') })
     setEditingItinerary(true)
   }

   const handleUpdateItinerary = async () => {
     if (!editItinerary.day || !editItinerary.activities) {
       alert('Please fill in all fields')
       return
     }
     try {
       const activities = editItinerary.activities.split('\n').map(s => s.trim()).filter(Boolean)
       const updatedItinerary = [...trip.itinerary]
       updatedItinerary[editingItineraryIndex] = { day: parseInt(editItinerary.day), activities }
       await api.patch(`/trips/${tripId}`, { itinerary: updatedItinerary })
       setTrip({ ...trip, itinerary: updatedItinerary })
       setEditItinerary({ day: '', activities: '' })
       setEditingItineraryIndex(null)
       setEditingItinerary(false)
     } catch (err) {
       alert('Failed to update itinerary')
     }
   }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✈️</div>
        <p style={{ color: 'var(--text-light)' }}>Loading trip details...</p>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <p style={{ color: 'var(--red)' }}>{error || 'Trip not found'}</p>
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
        const themeData = getTripTheme(trip.theme);
        return (
          <div style={{
            background: themeData.bannerImage
              ? `linear-gradient(135deg, rgba(127, 121, 121, 0.35) 0%, rgba(210, 153, 153, 0.55) 100%), url(${themeData.bannerImage})`
              : (themeData.gradient || `linear-gradient(135deg, ${themeData.color}88 0%, ${themeData.color} 100%)`),
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
                  title="Refresh all trip data"
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
                    {getTripTheme(trip.theme).icon} Theme
                  </button>
                </div>
              )}
            </div>

        <div>
          <h1 style={{ margin: '0 0 16px 0', fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: '800', wordBreak: 'break-word' }}>
            {trip.title}
          </h1>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', fontSize: 'clamp(14px, 2vw, 16px)', opacity: 0.95, flexDirection: 'column' }}>
            {trip.places && trip.places.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span>📍</span>
                <span>{trip.places.join(' → ')}</span>
              </div>
            )}
            <div>📅 {formatDate(trip.startDate)} - {formatDate(trip.endDate)}  ({Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24))} days)</div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>👥 {acceptedParticipants.length} Attendees</div>
              {trip.budget && <div>💰 ₹{trip.budget.toLocaleString()}</div>}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#2d343669', width: 'fit-content', padding: '8px 12px', borderRadius: '8px' }}> {/* rgba(255,255,255,0.2) */}
              <span>{getTripTheme(trip.theme).icon}</span>
              <span>{getTripTheme(trip.theme).name}</span>
            </div>
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
          { id: 'itinerary', icon: '🗓️', label: 'Itinerary' },
          { id: 'comments', icon: '💬', label: 'Comments' },
          { id: 'tasks', icon: '✓', label: 'Tasks' },
          { id: 'budget', icon: '💰', label: 'Budget' },
          { id: 'attendees', icon: '👥', label: 'Attendees' },
          { id: 'photos', icon: '📸', label: 'Photos' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: 'clamp(10px, 2vw, 14px) clamp(14px, 3vw, 20px)',
              background: activeTab === tab.id ? '#667eea' : '#f0f0f0',
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
            <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '700' }}>Trip Overview</h2>
            {trip.description && (
              <div style={{
                background: 'var(--bg-light)',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '24px',
                lineHeight: '1.6'
              }}>
                {trip.description}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div style={{ padding: '20px', background: 'var(--bg-light)', borderRadius: '12px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Participants</div>
                <div style={{ color: 'var(--text-light)', fontSize: '14px' }}>
                  {acceptedParticipants.length} confirmed
                </div>
              </div>
              <div style={{ padding: '20px', background: 'var(--bg-light)', borderRadius: '12px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>💰</div>
                 <div style={{ fontWeight: '600', marginBottom: '4px' }}>Total Expenses</div>
                 <div style={{ color: 'var(--text-light)', fontSize: '14px' }}>
                   ₹{totalExpenses.toLocaleString()}
                </div>
              </div>
              <div style={{ padding: '20px', background: 'var(--bg-light)', borderRadius: '12px' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>✓</div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Tasks</div>
                <div style={{ color: 'var(--text-light)', fontSize: '14px' }}>
                  {tasks.filter(t => t.completed).length} / {tasks.length} completed
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

        {activeTab === 'itinerary' && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              marginBottom: '20px',
              gap: '16px',
              flexWrap: 'wrap',
              width: '100%'
            }}>
              <h2 style={{ margin: 0, fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: '700', flex: '1 1 auto' }}>Itinerary</h2>
              <button 
                onClick={() => setEditingItinerary(true)} 
                className="itinerary-add-btn" 
                style={{
                  padding: '10px 16px',
                  background: 'var(--blue)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  minHeight: '40px',
                  flex: '0 0 auto',
                  display: isOrganizer ? 'flex' : 'none',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                + Add Day
              </button>
            </div>
            {trip.itinerary && trip.itinerary.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {trip.itinerary.map((day, idx) => (
                  <div key={idx} style={{
                    padding: '20px',
                    background: 'var(--bg-light)',
                    borderRadius: '12px',
                    borderLeft: '4px solid var(--blue)',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--blue)' }}>
                        📅 Day {day.day || idx + 1}
                      </h3>
                      {isOrganizer && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleEditItinerary(idx)} style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: '4px 8px',
                            opacity: 0.6,
                            hover: { opacity: 1 }
                          }}>
                            ✏️
                          </button>
                          <button onClick={() => handleDeleteItinerary(idx)} style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: '4px 8px',
                            opacity: 0.6
                          }}>
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                    {day.activities && day.activities.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {day.activities.map((activity, aIdx) => (
                          <li key={aIdx} style={{ marginBottom: '8px', lineHeight: '1.5' }}>{activity}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, color: 'var(--text-light)', fontStyle: 'italic' }}>No activities planned</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 'clamp(40px, 10vw, 60px) 20px', color: 'var(--text-light)' }}>
                <div style={{ fontSize: 'clamp(36px, 8vw, 48px)', marginBottom: '16px' }}>🗓️</div>
                <p style={{ fontSize: 'clamp(14px, 2vw, 16px)' }}>No itinerary added yet. Click "+ Add Day" above to get started!</p>
              </div>
            )}

            {editingItinerary && (
              <div className="modal-overlay" onClick={() => { setEditingItinerary(false); setEditingItineraryIndex(null); }} style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div className="modal" onClick={e => e.stopPropagation()} style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '30px',
                  maxWidth: '500px',
                  width: '90%',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '20px' }}>
                    {editingItineraryIndex !== null ? 'Edit Day in Itinerary' : 'Add Day to Itinerary'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label>
                      <span style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Day Number</span>
                      <input
                        type="number"
                        min="1"
                        value={editingItineraryIndex !== null ? editItinerary.day : newItinerary.day}
                        onChange={(e) => {
                          if (editingItineraryIndex !== null) {
                            setEditItinerary({ ...editItinerary, day: e.target.value })
                          } else {
                            setNewItinerary({ ...newItinerary, day: e.target.value })
                          }
                        }}
                        placeholder="e.g., 1"
                        style={{ width: '100%', padding: '12px', border: '2px solid var(--border)', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </label>
                    <label>
                      <span style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Activities (one per line)</span>
                      <textarea
                        value={editingItineraryIndex !== null ? editItinerary.activities : newItinerary.activities}
                        onChange={(e) => {
                          if (editingItineraryIndex !== null) {
                            setEditItinerary({ ...editItinerary, activities: e.target.value })
                          } else {
                            setNewItinerary({ ...newItinerary, activities: e.target.value })
                          }
                        }}
                        placeholder="Morning: Breakfast at hotel&#10;Afternoon: City tour&#10;Evening: Dinner"
                        style={{ width: '100%', minHeight: '120px', padding: '12px', border: '2px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' }}
                      />
                    </label>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button onClick={() => { setEditingItinerary(false); setEditingItineraryIndex(null); }} style={{
                        padding: '10px 20px',
                        background: '#f0f0f0',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}>
                        Cancel
                      </button>
                      <button onClick={editingItineraryIndex !== null ? handleUpdateItinerary : handleAddItinerary} style={{
                        padding: '10px 20px',
                        background: 'var(--blue)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}>
                        {editingItineraryIndex !== null ? 'Update Day' : 'Add Day'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '700' }}>Task List</h2>
            <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="Add a new task..."
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '2px solid var(--border)',
                  borderRadius: '10px',
                  fontSize: '14px'
                }}
              />
              <button onClick={handleAddTask} style={{
                padding: '12px 24px',
                background: 'var(--blue)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600'
              }}>
                Add Task
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tasks.length > 0 ? tasks.map(task => (
                <div key={task._id} style={{
                  padding: '16px',
                  background: 'var(--bg-light)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task._id, task.completed)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <span style={{
                    flex: 1,
                    textDecoration: task.completed ? 'line-through' : 'none',
                    color: task.completed ? 'var(--text-light)' : 'var(--text)'
                  }}>
                    {task.description}
                  </span>
                  <button onClick={() => handleDeleteTask(task._id)} style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px 8px'
                  }}>
                    🗑️
                  </button>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
                  <p>No tasks yet. Add one to get started!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '700' }}>Budget Tracker</h2>
            <div style={{
              background: 'var(--bg-light)',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>Total Expenses</div>
                  <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--blue)' }}>
                    ₹{totalExpenses.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Add Expense</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <input
                  type="text"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Description"
                  style={{ padding: '12px', border: '2px solid var(--border)', borderRadius: '10px', fontSize: '14px' }}
                />
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="Amount"
                  style={{ padding: '12px', border: '2px solid var(--border)', borderRadius: '10px', fontSize: '14px' }}
                />
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  style={{ padding: '12px', border: '2px solid var(--border)', borderRadius: '10px', fontSize: '14px' }}
                >
                  <option value="accommodation">🏨 Accommodation</option>
                  <option value="transport">🚗 Transport</option>
                  <option value="food">🍽️ Food</option>
                  <option value="activities">🎯 Activities</option>
                  <option value="other">📦 Other</option>
                </select>
                <select
                  value={newExpense.paidBy}
                  onChange={(e) => setNewExpense({ ...newExpense, paidBy: e.target.value })}
                  style={{ padding: '12px', border: '2px solid var(--border)', borderRadius: '10px', fontSize: '14px' }}
                >
                  <option value="">Select who paid</option>
                  {acceptedParticipants.map(p => (
                    <option key={p._id} value={p.userId?._id}>
                      {p.userId?.name || 'Unknown'}
                    </option>
                  ))}
                </select>
                <button onClick={handleAddExpense} style={{
                  padding: '12px 24px',
                  background: 'var(--green)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}>
                  Add
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {expenses.length > 0 ? expenses.map(expense => (
                <div key={expense._id} style={{
                  padding: '16px',
                  background: 'var(--bg-light)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '24px' }}>
                    {expense.category === 'accommodation' && '🏨'}
                    {expense.category === 'transport' && '🚗'}
                    {expense.category === 'food' && '🍽️'}
                    {expense.category === 'activities' && '🎯'}
                    {expense.category === 'other' && '📦'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600' }}>{expense.description}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                      {expense.category} • Paid by {expense.paidBy?.name || 'Unknown'} • {formatDate(expense.createdAt)}
                    </div>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '18px', color: 'var(--red)' }}>
                    ₹{expense.amount.toLocaleString()}
                  </div>
                  <button onClick={() => handleDeleteExpense(expense._id)} style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px 8px'
                  }}>
                    🗑️
                  </button>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
                  <p>No expenses recorded yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attendees' && (
          <div>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '700' }}>Attendees</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
              {trip.participants && trip.participants.length > 0 ? (
                trip.participants.map(participant => (
                  <div key={participant._id} style={{
                    padding: '16px',
                    background: 'var(--bg-light)',
                    borderRadius: '12px',
                    border: '1px solid #eee'
                  }}>
                    {(() => {
                      const participantId = typeof participant.userId === 'string' ? participant.userId : participant.userId?._id
                      const isYou = participantId && (participantId.toString() === (typeof user?.id === 'string' ? user.id : user?.id?.toString()))
                      return (
                        <ParticipantBadge role={participant.role} status={participant.status} isYou={isYou} />
                      )
                    })()}
                    <div style={{ marginTop: '12px', fontSize: '14px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        {participant.userId?.name}
                      </div>
                      <div style={{ color: 'var(--text-light)', fontSize: '12px', marginBottom: '4px' }}>
                        {participant.userId?.email}
                      </div>
                      <div style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        background: participant.status === 'accepted' ? '#1dd1a1' : participant.status === 'declined' ? '#ff6348' : '#ffa502',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {participant.status}
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

        {activeTab === 'photos' && (
          <div>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '700' }}>Photo Gallery</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '16px', background: 'var(--bg-light)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: '700', marginBottom: '8px' }}>Google Photos album</div>
                <p style={{ margin: '0 0 12px 0', color: 'var(--text-light)', fontSize: '14px', lineHeight: '1.5' }}>
                  Create a Google Photos album for this trip, upload images there, and paste the album link so everyone can open it.
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
                  {trip.googlePhotosAlbumUrl && (
                    <button
                      onClick={() => window.open(trip.googlePhotosAlbumUrl, '_blank')}
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
                      🔗 Open Trip Album
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

        {activeTab === 'comments' && (
          <div>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '700' }}>Comments & Discussion</h2>
            <div style={{ marginBottom: '24px' }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts, ask questions, or discuss trip details..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  border: '2px solid var(--border)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <button onClick={handleAddComment} style={{
                marginTop: '12px',
                padding: '12px 24px',
                background: 'var(--blue)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600'
              }}>
                Post Comment
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {comments.length > 0 ? comments.map(comment => (
                <div key={comment._id} style={{
                  padding: '20px',
                  background: 'var(--bg-light)',
                   borderRadius: '12px',
                   position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--blue)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '700'
                    }}>
                      {comment.userId?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                     <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600' }}>{comment.userId?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                        {formatDate(comment.createdAt)} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                     {(isOrganizer || comment.userId?._id === user?.id) && (
                       <button onClick={() => handleDeleteComment(comment._id)} style={{
                         background: 'transparent',
                         border: 'none',
                         cursor: 'pointer',
                         fontSize: '18px',
                         padding: '4px 8px',
                         opacity: 0.6
                       }}>
                         🗑️
                       </button>
                     )}
                  </div>
                  <p style={{ margin: 0, lineHeight: '1.6' }}>{comment.text}</p>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-light)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                  <p>No comments yet. Start the conversation!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <InvitationStatusViewer
        open={showInvitationViewer}
        itemType="trip"
        itemId={tripId}
        onClose={() => setShowInvitationViewer(false)}
      />

      <InvitationManager
        open={showInviteModal}
        itemType="trip"
        itemId={tripId}
        onInvitationSent={() => {
          setShowInviteModal(false)
          fetchTripDetails()
        }}
        onClose={() => setShowInviteModal(false)}
      />

      <style>{`
        @media (max-width: 1024px) {
          div[style*="flexWrap: 'wrap'"][style*="boxShadow"] button {
            padding: 10px 12px !important;
            font-size: 13px !important;
          }
        }
        @media (max-width: 768px) {
          div[style*="flexWrap: 'wrap'"][style*="boxShadow"] {
            gap: 6px !important;
            padding: 10px !important;
          }
          div[style*="flexWrap: 'wrap'"][style*="boxShadow"] button {
            padding: 9px 11px !important;
            font-size: 12px !important;
            min-height: 38px !important;
          }
        }
        @media (max-width: 640px) {
          div[style*="gridTemplateColumns"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="gridTemplateColumns: repeat(auto-fit, minmax(250px, 1fr))"] {
            grid-template-columns: 1fr 1fr !important;
          }
          div[style*="flexWrap: 'wrap'"][style*="boxShadow"] {
            gap: 5px !important;
            padding: 8px !important;
          }
          div[style*="flexWrap: 'wrap'"][style*="boxShadow"] button {
            padding: 8px 10px !important;
            font-size: 11px !important;
            min-height: 36px !important;
          }
          button {
            font-size: 13px !important;
          }
          button.itinerary-add-btn {
            visibility: visible !important;
            opacity: 1 !important;
            padding: 9px 12px !important;
            font-size: 12px !important;
            min-width: auto !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 10 !important;
            flex-shrink: 0 !important;
          }
        }
        @media (max-width: 480px) {
          h2 {
            font-size: 18px !important;
          }
          div[style*="padding: '40px 20px'"] {
            padding: 20px 16px !important;
          }
          div[style*="gridTemplateColumns: repeat(auto-fit, minmax(250px, 1fr))"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="flexWrap: 'wrap'"][style*="boxShadow"] {
            gap: 4px !important;
            padding: 6px !important;
          }
          div[style*="flexWrap: 'wrap'"][style*="boxShadow"] button {
            padding: 7px 9px !important;
            font-size: 10px !important;
            min-height: 34px !important;
            gap: 3px !important;
          }
          button.itinerary-add-btn {
            visibility: visible !important;
            opacity: 1 !important;
            width: auto !important;
            z-index: 10 !important;
            flex-shrink: 0 !important;
            padding: 8px 10px !important;
            font-size: 11px !important;
          }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          div[style*="gridTemplateColumns: repeat(auto-fit, minmax(150px, 1fr))"] {
            grid-template-columns: 1fr 1fr !important;
          }
          div[style*="gridTemplateColumns: repeat(auto-fit, minmax(150px, 1fr))"] button {
            grid-column: 1 / -1;
          }
          div[style*="gridTemplateColumns: repeat(auto-fit, minmax(200px, 1fr))"] {
            grid-template-columns: 1fr 1fr !important;
          }
        }
      `}</style>

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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
          title="Update Trip"
        >
          ✏️
        </button>
      )}

      {/* Update Trip Modal */}
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
              ✏️ Update Trip
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
                  Trip Title *
                </label>
                <input
                  type="text"
                  value={updateForm.title}
                  onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                  placeholder="e.g., Summer Vacation"
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
                  Start Date *
                </label>
                <input
                  type="date"
                  value={updateForm.startDate}
                  onChange={(e) => setUpdateForm({ ...updateForm, startDate: e.target.value })}
                  min={new Date().toISOString().slice(0, 10)}
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
                  End Date *
                </label>
                <input
                  type="date"
                  value={updateForm.endDate}
                  onChange={(e) => setUpdateForm({ ...updateForm, endDate: e.target.value })}
                  min={updateForm.startDate || new Date().toISOString().slice(0, 10)}
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
                  Places (comma-separated)
                </label>
                <input
                  type="text"
                  value={updateForm.places}
                  onChange={(e) => setUpdateForm({ ...updateForm, places: e.target.value })}
                  placeholder="e.g., Paris, Rome, Barcelona"
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
                  Google Photos album link
                </label>
                <input
                  type="url"
                  value={updateForm.googlePhotosAlbumUrl}
                  onChange={(e) => setUpdateForm({ ...updateForm, googlePhotosAlbumUrl: e.target.value })}
                  placeholder="https://photos.google.com/share/..."
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
                  Trip Theme
                </label>
                <button
                  onClick={() => setShowThemeModal(true)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `2px solid ${getTripTheme(selectedTheme).color}`,
                    backgroundColor: getTripTheme(selectedTheme).bgColor,
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
                  {getTripTheme(selectedTheme).icon} {getTripTheme(selectedTheme).name}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={handleUpdateTrip}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
          type="trip"
          currentTheme={selectedTheme}
          onSelect={(theme) => setSelectedTheme(theme)}
          onClose={() => setShowThemeModal(false)}
          onSave={async () => {
            try {
              const places = updateForm.places.split(',').map(s => s.trim()).filter(Boolean)
              await api.patch(`/trips/${tripId}`, {
                title: updateForm.title,
                startDate: updateForm.startDate,
                endDate: updateForm.endDate,
                places,
                theme: selectedTheme,
                googlePhotosAlbumUrl: updateForm.googlePhotosAlbumUrl || null
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
