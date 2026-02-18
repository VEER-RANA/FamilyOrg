import React, { useState, useContext } from 'react'
import api from '../services/api'
import { AuthContext } from '../context/AuthContext'
import { EVENT_THEMES, TRIP_THEMES } from '../utils/themeConfig'

export default function CreateBox({ onCreated }){
  const [openMenu, setOpenMenu] = useState(false)
  const [modalType, setModalType] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useContext(AuthContext)

  // Event state
  const [evTitle, setEvTitle] = useState('')
  const [evDate, setEvDate] = useState('')
  const [evLocation, setEvLocation] = useState('')
  const [evDesc, setEvDesc] = useState('')
  const [evTheme, setEvTheme] = useState('meeting')

  // Trip state
  const [tripTitle, setTripTitle] = useState('')
  const [tripStart, setTripStart] = useState('')
  const [tripEnd, setTripEnd] = useState('')
  const [tripItin, setTripItin] = useState('')
  const [tripPlaces, setTripPlaces] = useState('')
  const [tripTheme, setTripTheme] = useState('trip')

  const open = (type) => { setModalType(type); setOpenMenu(false); setError(null) }
  const close = () => { setModalType(null); setError(null); }

  const submitEvent = async e => {
    e.preventDefault()
    if (!evTitle || !evDate) { setError('Title and date required'); return }
    if (new Date(evDate) < new Date()) { setError('Event date cannot be in the past'); return }
    setLoading(true); setError(null)
    try{
      await api.post('/events', { title: evTitle, datetime: evDate, location: evLocation, description: evDesc, theme: evTheme })
      close()
      onCreated?.()
      // reset
      setEvTitle(''); setEvDate(''); setEvLocation(''); setEvDesc(''); setEvTheme('meeting')
    }catch(err){ setError(err.response?.data?.message || 'Create event failed') }
    finally{ setLoading(false) }
  }

  const submitTrip = async e => {
    e.preventDefault()
    if (!tripTitle || !tripStart || !tripEnd) { setError('Title and dates required'); return }
    if (new Date(tripStart) < new Date().setHours(0, 0, 0, 0)) { setError('Start date cannot be in the past'); return }
    if (new Date(tripEnd) < new Date(tripStart)) { setError('End date must be after start date'); return }
    setLoading(true); setError(null)
    try{
      const itinerary = tripItin.split('\n').map(s=>s.trim()).filter(Boolean).map((line,i)=>({ day: i+1, activities: [line] }))
      const places = tripPlaces.split(',').map(s=>s.trim()).filter(Boolean)
      await api.post('/trips', { title: tripTitle, startDate: tripStart, endDate: tripEnd, itinerary, places, theme: tripTheme })
      close(); onCreated?.()
      setTripTitle(''); setTripStart(''); setTripEnd(''); setTripItin(''); setTripPlaces(''); setTripTheme('trip')
    }catch(err){ setError(err.response?.data?.message || 'Create trip failed') }
    finally{ setLoading(false) }
  }

  return (
    <div className="create-box">
      <div className="create-button" onClick={()=>setOpenMenu(s=>!s)}>
        {openMenu ? '✕' : '+'} Create
      </div>
      {openMenu && (
        <div className="create-menu">
          <div onClick={()=>open('event')}>📅 Create Event</div>
          <div onClick={()=>open('trip')}>✈ Plan Trip</div>
          {/* <div onClick={()=>alert('Task creation not implemented yet')}>✎ Add Task</div>
          <div onClick={()=>alert('Expense creation not implemented yet')}>💰 Log Expense</div> */}
        </div>
      )}

      {modalType === 'event' && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3> Create Event</h3>
            <form onSubmit={submitEvent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>📝 Event Title</span>
                <input value={evTitle} onChange={e=>setEvTitle(e.target.value)} placeholder="e.g., Family Dinner" />
              </label>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>⏰ Date & Time</span>
                <input type="datetime-local" value={evDate} onChange={e=>setEvDate(e.target.value)} min={new Date().toISOString().slice(0, 16)} />
              </label>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>📍 Location</span>
                <input value={evLocation} onChange={e=>setEvLocation(e.target.value)} placeholder="e.g., Home" />
              </label>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>📄 Description</span>
                <textarea value={evDesc} onChange={e=>setEvDesc(e.target.value)} placeholder="Add event details..." />
              </label>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>🎨 Theme</span>
                <select value={evTheme} onChange={e=>setEvTheme(e.target.value)} style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: EVENT_THEMES[evTheme]?.bgColor || '#fff'
                }}>
                  <option value="birthday">{EVENT_THEMES.birthday.icon} {EVENT_THEMES.birthday.name}</option>
                  <option value="meeting">{EVENT_THEMES.meeting.icon} {EVENT_THEMES.meeting.name}</option>
                  <option value="dinner">{EVENT_THEMES.dinner.icon} {EVENT_THEMES.dinner.name}</option>
                  <option value="celebration">{EVENT_THEMES.celebration.icon} {EVENT_THEMES.celebration.name}</option>
                  <option value="katha">{EVENT_THEMES.katha.icon} {EVENT_THEMES.katha.name}</option>
                  <option value="poojan">{EVENT_THEMES.poojan.icon} {EVENT_THEMES.poojan.name}</option>
                </select>
              </label>
              {error && <div className="error" style={{ animation: 'slideIn 300ms ease-out' }}><span>⚠️</span> {error}</div>}
              <div style={{display:'flex',gap:12,justifyContent:'flex-end',marginTop:'8px'}}>
                <button type="button" className="btn secondary" onClick={close}>Cancel</button>
                <button className="btn" type="submit" disabled={loading} style={{ background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>{loading ? '🔄 Creating...' : '✓ Create Event'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalType === 'trip' && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>✈ Plan Trip</h3>
            <form onSubmit={submitTrip} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>✈ Trip Name</span>
                <input value={tripTitle} onChange={e=>setTripTitle(e.target.value)} placeholder="e.g., Summer Vacation" />
              </label>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>🗺️ Places (comma-separated)</span>
                <input value={tripPlaces} onChange={e=>setTripPlaces(e.target.value)} placeholder="e.g., Paris, Rome, Barcelona" />
              </label>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>📅 Start Date</span>
                <input type="date" value={tripStart} onChange={e=>setTripStart(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
              </label>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>📅 End Date</span>
                <input type="date" value={tripEnd} onChange={e=>setTripEnd(e.target.value)} min={tripStart || new Date().toISOString().slice(0, 10)} />
              </label>
              <label>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>🎨 Theme</span>
                <select value={tripTheme} onChange={e=>setTripTheme(e.target.value)} style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: TRIP_THEMES[tripTheme]?.bgColor || '#fff'
                }}>
                  <option value="temple">{TRIP_THEMES.temple.icon} {TRIP_THEMES.temple.name}</option>
                  <option value="trip">{TRIP_THEMES.trip.icon} {TRIP_THEMES.trip.name}</option>
                  <option value="tour">{TRIP_THEMES.tour.icon} {TRIP_THEMES.tour.name}</option>
                </select>
              </label>
              {error && <div className="error" style={{ animation: 'slideIn 300ms ease-out' }}><span>⚠️</span> {error}</div>}
              <div style={{display:'flex',gap:12,justifyContent:'flex-end',marginTop:'8px'}}>
                <button type="button" className="btn secondary" onClick={close}>Cancel</button>
                <button className="btn" type="submit" disabled={loading} style={{ background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>{loading ? '🔄 Creating...' : '✓ Create Trip'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}