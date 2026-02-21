import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { formatDate } from '../utils/date'

export default function AttendedRecords() {
  const [attended, setAttended] = useState({ events: [], trips: [] })
  const [status, setStatus] = useState({ loading: true, error: null })
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await api.get('/users/attended')
        setAttended({
          events: res.data?.events || [],
          trips: res.data?.trips || []
        })
        setStatus({ loading: false, error: null })
      } catch (err) {
        setStatus({ loading: false, error: err.response?.data?.message || 'Failed to load records' })
      }
    }

    fetchRecords()
  }, [])

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    return new Date(year, month, 1).getDay()
  }

  const isSameDay = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  const isDateInRange = (date, startDate, endDate) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const start = new Date(startDate)
    const end = new Date(endDate)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    return d >= start && d <= end
  }

  const getEventsForDate = (date) => {
    return attended.events.filter(event => 
      isSameDay(new Date(event.date), date)
    )
  }

  const getTripsForDate = (date) => {
    return attended.trips.filter(trip => 
      isDateInRange(date, trip.startDate, trip.endDate)
    )
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
    }
    
    return days
  }

  const calendarDays = generateCalendarDays()
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>📚 Attended Records Calendar</h1>
          <p className="subtitle">Your attended events and trips in calendar view</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '4px'
            }}></div>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Events</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '16px', 
              height: '16px', 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '4px'
            }}></div>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Trips</span>
          </div>
        </div>
      </div>

      {status.loading ? (
        <div className="dashboard-loader">Loading records...</div>
      ) : status.error ? (
        <div className="dashboard-error">⚠️ {status.error}</div>
      ) : (
        <>
          <div className="panel" style={{ padding: '24px', overflow: 'visible', position: 'relative' }}>
          {/* Calendar Navigation */}
          <div className="calendar-nav-buttons" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: '2px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <button
              onClick={previousMonth}
              style={{
                padding: '8px 16px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.target.style.background = 'var(--bg-secondary)'}
            >
              ← Previous
            </button>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
              <h2 className="calendar-month-title" style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>{monthYear}</h2>
              <button
                onClick={goToToday}
                style={{
                  padding: '6px 12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                Today
              </button>
            </div>

            <button
              onClick={nextMonth}
              style={{
                padding: '8px 16px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.target.style.background = 'var(--bg-secondary)'}
            >
              Next →
            </button>
          </div>

          {/* Calendar Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
            overflow: 'visible',
            position: 'relative'
          }}>
            {/* Week day headers */}
            {weekDays.map(day => (
              <div
                key={day}
                className="week-day-header"
                style={{
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '14px',
                  padding: '12px 8px',
                  color: 'var(--text-secondary)',
                  borderBottom: '2px solid var(--border-color)'
                }}
              >
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="calendar-empty-day"></div>
              }

              const dayEvents = getEventsForDate(date)
              const dayTrips = getTripsForDate(date)
              const isToday = isSameDay(date, new Date())
              const hasRecords = dayEvents.length > 0 || dayTrips.length > 0

              return (
                <div
                  key={date.toISOString()}
                  className="calendar-day"
                  style={{
                    minHeight: '100px',
                    padding: '8px',
                    background: isToday ? 'var(--bg-hover)' : 'var(--bg-secondary)',
                    border: isToday ? '2px solid #667eea' : '1px solid var(--border-color)',
                    borderRadius: '8px',
                    position: 'relative',
                    transition: 'all 0.2s',
                    cursor: hasRecords ? 'pointer' : 'default'
                  }}
                >
                  <div style={{
                    fontSize: '14px',
                    fontWeight: isToday ? '700' : '500',
                    color: isToday ? '#667eea' : 'var(--text-primary)',
                    marginBottom: '6px'
                  }}>
                    {date.getDate()}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'visible', position: 'relative' }}>
                    {dayEvents.map((event, index) => (
                      <div
                        key={`event-${event._id}-${index}`}
                        className="calendar-event-item"
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          position: 'relative',
                          cursor: 'pointer'
                        }}
                      >
                        📅 {event.title}
                        
                        {/* Tooltip */}
                        <div 
                          className="event-tooltip"
                          style={{
                            position: 'absolute',
                            bottom: 'calc(100% + 4px)',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(0, 0, 0, 0.95)',
                            color: 'white',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            whiteSpace: 'normal',
                            minWidth: '200px',
                            maxWidth: '280px',
                            pointerEvents: 'none',
                            transition: 'opacity 0.2s ease, visibility 0.2s ease',
                            zIndex: 9999,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                          }}>
                          <div style={{ fontWeight: '600', marginBottom: '6px', fontSize: '13px' }}>
                            📅 {event.title}
                          </div>
                          <div style={{ opacity: '0.9', marginBottom: '4px' }}>
                            <strong>Date:</strong> {formatDate(event.date)}
                          </div>
                          <div style={{ opacity: '0.9' }}>
                            <strong>Place:</strong> {event.location || 'Not specified'}
                          </div>
                        </div>
                      </div>
                    ))}

                    {dayTrips.map((trip, index) => (
                      <div
                        key={`trip-${trip._id}-${index}`}
                        className="calendar-trip-item"
                        style={{
                          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                          color: 'white',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          position: 'relative',
                          cursor: 'pointer'
                        }}
                      >
                        ✈ {trip.title}
                        
                        {/* Tooltip */}
                        <div 
                          className="trip-tooltip"
                          style={{
                            position: 'absolute',
                            bottom: 'calc(100% + 4px)',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(0, 0, 0, 0.95)',
                            color: 'white',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            whiteSpace: 'normal',
                            minWidth: '200px',
                            maxWidth: '280px',
                            pointerEvents: 'none',
                            transition: 'opacity 0.2s ease, visibility 0.2s ease',
                            zIndex: 9999,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                          }}>
                          <div style={{ fontWeight: '600', marginBottom: '6px', fontSize: '13px' }}>
                            ✈ {trip.title}
                          </div>
                          <div style={{ opacity: '0.9', marginBottom: '4px' }}>
                            <strong>Duration:</strong> {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                          </div>
                          <div style={{ opacity: '0.9' }}>
                            <strong>Places:</strong> {trip.places?.length ? trip.places.join(', ') : 'Not specified'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Empty state when no records */}
          {attended.events.length === 0 && attended.trips.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              marginTop: '24px',
              background: 'var(--bg-hover)',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <div className="empty-state">No attended records yet</div>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                Your attended events and trips will appear on the calendar
              </p>
            </div>
          )}
        </div>
        </>
      )}

      <style>{`
        .dashboard-container {
          overflow-x: hidden;
          max-width: 100%;
        }

        .panel {
          box-sizing: border-box;
          max-width: 100%;
        }

        .calendar-day {
          overflow: visible !important;
          box-sizing: border-box;
        }

        .calendar-empty-day {
          min-height: 100px;
        }

        .calendar-day:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        /* Default: tooltips hidden */
        .event-tooltip,
        .trip-tooltip {
          opacity: 0;
          visibility: hidden;
        }

        /* Desktop only: Show on hover */
        @media (min-width: 769px) {
          .calendar-event-item:hover .event-tooltip,
          .calendar-trip-item:hover .trip-tooltip {
            opacity: 1 !important;
            visibility: visible !important;
          }
        }

        /* Mobile: Hide tooltips completely */
        @media (max-width: 768px) {
          .event-tooltip,
          .trip-tooltip {
            display: none !important;
          }
        }

        .calendar-event-item,
        .calendar-trip-item {
          transition: all 0.2s;
          position: relative;
          z-index: 1;
        }

        .calendar-event-item:hover,
        .calendar-trip-item:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          z-index: 9998;
          overflow: visible !important;
        }

        /* Desktop: tooltip arrow */
        @media (min-width: 769px) {
          .event-tooltip::after,
          .trip-tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid rgba(0, 0, 0, 0.95);
          }
        }
        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .panel {
            padding: 16px !important;
            overflow: visible !important;
          }
        }

        @media (max-width: 1024px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 16px;
          }

          .event-tooltip,
          .trip-tooltip {
            font-size: 11px !important;
            padding: 8px 12px !important;
            min-width: 180px !important;
          }
        }

        @media (max-width: 768px) {
          .calendar-nav-buttons {
            flex-direction: row !important;
            justify-content: space-between !important;
          }

          .calendar-nav-buttons > button {
            font-size: 12px !important;
            padding: 6px 12px !important;
          }

          .calendar-month-title {
            font-size: 16px !important;
          }

          .calendar-day {
            min-height: 70px !important;
            max-height: 90px !important;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 4px !important;
          }

          .calendar-empty-day {
            min-height: 70px !important;
          }

          .calendar-day > div:first-child {
            font-size: 11px !important;
            margin-bottom: 3px !important;
          }

          .calendar-event-item,
          .calendar-trip-item {
            font-size: 9px !important;
            padding: 2px 4px !important;
          }

          .week-day-header {
            font-size: 11px !important;
            padding: 6px 2px !important;
          }

          /* Mobile grid adjustments */
          .panel > div {
            gap: 4px !important;
          }

          .calendar-day {
            overflow-x: hidden !important;
            overflow-y: auto !important;
          }

          /* Ensure grid container doesn't overflow */
          .panel {
            max-width: 100vw;
            box-sizing: border-box;
          }
        }

        @media (max-width: 480px) {
          .dashboard-header h1 {
            font-size: 16px !important;
          }

          .dashboard-header .subtitle {
            font-size: 11px !important;
          }

          .panel {
            padding: 8px !important;
            overflow: visible !important;
          }

          .calendar-nav-buttons {
            gap: 6px !important;
            margin-bottom: 16px !important;
          }

          .calendar-nav-buttons > button:first-child {
            flex: 1;
          }

          .calendar-nav-buttons > button:last-child {
            flex: 1;
          }

          .calendar-nav-buttons > div {
            flex-basis: 100%;
            order: -1;
            justify-content: center !important;
          }

          .calendar-day {
            min-height: 55px !important;
            max-height: 75px !important;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 3px !important;
          }

          .calendar-empty-day {
            min-height: 55px !important;
          }

          .calendar-day > div:first-child {
            font-size: 10px !important;
            margin-bottom: 2px !important;
          }

          .calendar-event-item,
          .calendar-trip-item {
            font-size: 8px !important;
            padding: 2px 3px !important;
          }

          .week-day-header {
            font-size: 10px !important;
            padding: 4px 1px !important;
          }

          /* Smaller grid gap on small screens */
          .panel > div {
            gap: 3px !important;
          }
        }

        @media (max-width: 360px) {
          .dashboard-header h1 {
            font-size: 14px !important;
          }

          .panel {
            padding: 6px !important;
          }

          .calendar-day {
            min-height: 50px !important;
            max-height: 65px !important;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 2px !important;
          }

          .calendar-empty-day {
            min-height: 50px !important;
          }

          .calendar-day > div:first-child {
            font-size: 9px !important;
            margin-bottom: 1px !important;
          }

          .calendar-event-item,
          .calendar-trip-item {
            font-size: 7px !important;
            padding: 1px 2px !important;
          }

          .week-day-header {
            font-size: 9px !important;
            padding: 3px 0px !important;
          }

          /* Smallest grid gap */
          .panel > div {
            gap: 2px !important;
          }
        }

        /* Mobile scrollbar styling */
        @media (max-width: 768px) {
          .calendar-day::-webkit-scrollbar {
            width: 3px;
          }

          .calendar-day::-webkit-scrollbar-track {
            background: transparent;
          }

          .calendar-day::-webkit-scrollbar-thumb {
            background-color: rgba(0,0,0,0.3);
            border-radius: 2px;
          }

          .calendar-day {
            scrollbar-width: thin;
            scrollbar-color: rgba(0,0,0,0.3) transparent;
          }
        }
      `}</style>
    </div>
  )
}
