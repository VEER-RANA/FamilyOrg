import React, { useState, useRef, useEffect } from 'react'
import api from '../services/api'
import DetailModal from './DetailModal'
import InvitationManager from './InvitationManager'
import InvitationStatusViewer from './InvitationStatusViewer'

export default function ItemMenu({ item, type, onDeleted, user }){
  const [open, setOpen] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showInvitationStatus, setShowInvitationStatus] = useState(false)
  const menuRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Check if user is organizer
  const isOrganizer = () => {
    if (type === 'event' && item.attendees) {
      return item.attendees.some(a => {
        const userIdString = typeof a.userId === 'string' ? a.userId : a.userId?._id;
        return userIdString === user?.id && a.role === 'organizer';
      });
    }
    if (type === 'trip' && item.participants) {
      return item.participants.some(p => {
        const userIdString = typeof p.userId === 'string' ? p.userId : p.userId?._id;
        return userIdString === user?.id && p.role === 'organizer';
      });
    }
    return false;
  }

  const del = async () => {
    if (!confirm('🗑️ Are you sure you want to delete this item?')) return
    try{
      if (type === 'event') await api.delete(`/events/${item._id}`)
      if (type === 'trip') await api.delete(`/trips/${item._id}`)
      onDeleted?.()
    }catch(err){
      alert(err.response?.data?.message || err.message || 'Delete failed')
    }
  }

  return (
    <div style={{position:'relative',display:'inline-block'}} ref={menuRef}>
      <button className="btn" onClick={()=>setOpen(s=>!s)} style={{
        padding: '6px 10px',
        fontSize: '14px',
        background: 'transparent',
        color: 'var(--text-light)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 150ms'
      }} onMouseEnter={e => {
        e.target.style.background = 'var(--bg-light)'
        e.target.style.color = 'var(--text)'
      }} onMouseLeave={e => {
        e.target.style.background = 'transparent'
        e.target.style.color = 'var(--text-light)'
      }}>•••</button>
      {open && (
        <div style={{position:'absolute',right:0,top:36,background:'white',boxShadow:'var(--shadow-lg)',borderRadius:8,zIndex:50,animation:'slideDown 200ms ease-out',minWidth:'140px'}}>
          <div style={{padding:'10px 14px',cursor:'pointer',color:'var(--text)',fontSize:'14px',display:'flex',alignItems:'center',gap:'8px',transition:'background-color 150ms'}} onClick={()=>{ setShowDetail(true); setOpen(false) }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-light)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            👁️ View
          </div>
          {/* Invite Members - only show if user is an organizer */}
          { isOrganizer() && (
            <div style={{padding:'10px 14px',cursor:'pointer',color:'var(--blue)',fontSize:'14px',display:'flex',alignItems:'center',gap:'8px',transition:'background-color 150ms',borderTop:'1px solid var(--border)'}} onClick={()=>{ setShowInvite(true); setOpen(false) }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.1)'; e.currentTarget.style.color = 'var(--blue)' }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--blue)' }}>
              👥 Invite Members
            </div>
          )}
          {/* View Invitation Status - only show if user is an organizer */}
          { isOrganizer() && (
            <div style={{padding:'10px 14px',cursor:'pointer',color:'var(--purple)',fontSize:'14px',display:'flex',alignItems:'center',gap:'8px',transition:'background-color 150ms',borderTop:'1px solid var(--border)'}} onClick={()=>{ setShowInvitationStatus(true); setOpen(false) }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(155, 89, 182, 0.1)'; e.currentTarget.style.color = 'var(--purple)' }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--purple)' }}>
              📊 Invitation Status
            </div>
          )}
          {/* only show delete option if user is organizer or admin */}
          { (user?.role === 'admin' || isOrganizer()) && (
            <div style={{padding:'10px 14px',cursor:'pointer',color:'var(--red)',fontSize:'14px',display:'flex',alignItems:'center',gap:'8px',transition:'background-color 150ms',borderTop:'1px solid var(--border)'}} onClick={del} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.08)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              🗑️ Delete
            </div>
          )}
        </div>
      )}

      <DetailModal open={showDetail} onClose={()=>setShowDetail(false)} title={`${type} details`} data={item} />

      <InvitationManager 
        open={showInvite}
        itemType={type}
        itemId={item._id}
        onInvitationSent={() => {
          onDeleted?.()
          setShowInvite(false)
        }}
        onClose={() => setShowInvite(false)}
      />

      <InvitationStatusViewer
        open={showInvitationStatus}
        itemType={type}
        itemId={item._id}
        onClose={() => setShowInvitationStatus(false)}
      />

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
