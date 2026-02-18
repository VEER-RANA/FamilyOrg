import React, { useState, useEffect, useContext } from 'react'
import api from '../services/api'
import { AuthContext } from '../context/AuthContext'

export default function MemberSelector({ value = '', onChange, label = '👥 Select Family Member' }) {
  const { user } = useContext(AuthContext)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const selectedId = Array.isArray(value) ? (value[0] || '') : (value || '')
  const selectedMember = members.find(m => m._id === selectedId)

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true)
        const res = await api.get('/users/members')
        setMembers(res.data || [])
      } catch (err) {
        console.error('Error fetching members:', err)
        setError('Failed to load family members')
      } finally {
        setLoading(false)
      }
    }
    fetchMembers()
  }, [])

  return (
    <div style={{ width: '100%' }}>
      <label style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        marginBottom: '10px',
        color: 'var(--text)'
      }}>
        {label}
      </label>

      {error && (
        <div style={{
          background: '#fee',
          color: 'var(--red)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          marginBottom: '8px'
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ width: '100%', maxWidth: '100%' }}>
        <select
          value={selectedId}
          onChange={e => onChange && onChange(e.target.value)}
          disabled={loading || error}
          style={{
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            display: 'block',
            padding: '12px 14px',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '14px',
            fontFamily: 'inherit',
            cursor: loading || error ? 'not-allowed' : 'pointer',
            transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            background: 'white',
            color: 'var(--text)',
            fontWeight: '500'
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--blue)'
            e.currentTarget.style.boxShadow = '0 0 0 4px rgba(84, 160, 255, 0.15)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <option value="">Select member</option>
          {!loading && members.length === 0 && (
            <option value="" disabled>No other members found</option>
          )}
          {members.map(m => (
            <option key={m._id} value={m._id}>
              {m.name} ({m.email})
            </option>
          ))}
        </select>
      </div>

      {!loading && members.length > 0 && (
        <p style={{
          margin: '6px 0 0 0',
          fontSize: '12px',
          color: 'var(--text-light)'
        }}>
          {members.length} family member{members.length !== 1 ? 's' : ''} available
        </p>
      )}
    </div>
  )
}
