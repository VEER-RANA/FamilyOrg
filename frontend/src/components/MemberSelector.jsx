import React, { useState, useEffect, useContext, useMemo } from 'react'
import api from '../services/api'
import { AuthContext } from '../context/AuthContext'

export default function MemberSelector({ value = '', onChange, label = '👥 Select Family Member', multiple = false }) {
  const { user } = useContext(AuthContext)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showAllMembers, setShowAllMembers] = useState(false)
  const [recentSearchNames, setRecentSearchNames] = useState([])

  const selectedIds = useMemo(() => {
    if (Array.isArray(value)) return value.filter(Boolean)
    return value ? [value] : []
  }, [value])

  const selectedMember = members.find(m => m._id === selectedIds[0])
  const selectedMembers = useMemo(
    () => members.filter(member => selectedIds.includes(member._id)),
    [members, selectedIds]
  )

  const filteredMembers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return []

    return members.filter(member => {
      const name = (member.name || '').toLowerCase()
      const email = (member.email || '').toLowerCase()
      return name.includes(query) || email.includes(query)
    })
  }, [members, searchQuery])

  const recentSearchMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return []

    return recentSearchNames.filter(name => name.toLowerCase().includes(query)).slice(0, 5)
  }, [recentSearchNames, searchQuery])

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

  useEffect(() => {
    if (multiple || !selectedMember) return
    setSearchQuery(selectedMember.name || '')
  }, [multiple, selectedMember])

  const showSuggestions = isFocused && !loading && !error && (showAllMembers || searchQuery.trim().length > 0)

  const visibleMembers = useMemo(() => {
    if (showAllMembers && !searchQuery.trim()) return members
    return filteredMembers
  }, [showAllMembers, searchQuery, members, filteredMembers])

  const addRecentSearchName = (name) => {
    const normalizedName = (name || '').trim()
    if (!normalizedName) return

    setRecentSearchNames(prev => {
      const deduped = prev.filter(entry => entry.toLowerCase() !== normalizedName.toLowerCase())
      return [normalizedName, ...deduped].slice(0, 5)
    })
  }

  const handlePickMember = (member) => {
    const memberName = member.name || ''

    if (multiple) {
      const alreadySelected = selectedIds.includes(member._id)
      const nextIds = alreadySelected
        ? selectedIds.filter(id => id !== member._id)
        : [...selectedIds, member._id]
      onChange && onChange(nextIds)
      // Keep focus for continuous typing, but do not auto-open full list.
      setSearchQuery('')
      setShowAllMembers(false)
      setIsFocused(true)
    } else {
      onChange && onChange(member._id)
      setSearchQuery(memberName)
      setIsFocused(false)
      setShowAllMembers(false)
    }

    addRecentSearchName(memberName)
  }

  const handleQueryChange = (nextValue) => {
    setSearchQuery(nextValue)
    if (!nextValue.trim()) {
      setShowAllMembers(false)
    }
    if (!multiple && !nextValue.trim()) {
      onChange && onChange('')
    }
  }

  const handleRecentSearchPick = (name) => {
    const normalized = String(name || '').trim().toLowerCase()
    if (!normalized) return

    const matchedMember = members.find(member => (member.name || '').trim().toLowerCase() === normalized)
    if (matchedMember) {
      handlePickMember(matchedMember)
      return
    }

    setSearchQuery(name)
    setShowAllMembers(false)
    setIsFocused(true)
  }

  const removeSelectedMember = (memberId) => {
    if (!multiple) {
      onChange && onChange('')
      return
    }
    onChange && onChange(selectedIds.filter(id => id !== memberId))
  }

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

      <div style={{ width: '100%', maxWidth: '100%', position: 'relative' }}>
        <button
          type="button"
          disabled={loading || !!error}
          onMouseDown={e => {
            e.preventDefault()
            setIsFocused(true)
            setShowAllMembers(prev => !prev)
          }}
          title="Show all family members"
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '30px',
            height: '30px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            background: showAllMembers ? 'rgba(84, 160, 255, 0.14)' : '#fff',
            cursor: loading || error ? 'not-allowed' : 'pointer',
            color: 'var(--text)',
            zIndex: 2
          }}
        >
          👥
        </button>

        <input
          type="text"
          value={searchQuery}
          onChange={e => handleQueryChange(e.target.value)}
          onFocus={e => {
            setIsFocused(true)
            e.currentTarget.style.borderColor = 'var(--blue)'
            e.currentTarget.style.boxShadow = '0 0 0 4px rgba(84, 160, 255, 0.15)'
          }}
          onBlur={e => {
            setTimeout(() => setIsFocused(false), 120)
            addRecentSearchName(searchQuery)
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          placeholder={loading ? 'Loading family members...' : 'Start typing name...'}
          disabled={loading || error}
          autoComplete="off"
          style={{
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            display: 'block',
            padding: '12px 44px 12px 14px',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '14px',
            fontFamily: 'inherit',
            cursor: loading || error ? 'not-allowed' : 'text',
            transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            background: 'white',
            color: 'var(--text)',
            fontWeight: '500'
          }}
        />

        {showSuggestions && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            maxHeight: '220px',
            overflowY: 'auto',
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.12)',
            zIndex: 10
          }}>
            {recentSearchMatches.length > 0 && (
              <div style={{ borderBottom: '1px solid var(--border)' }}>
                <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', letterSpacing: '0.4px' }}>
                  RECENT SEARCHES
                </div>
                {recentSearchMatches.map(name => (
                  <button
                    key={`recent-${name}`}
                    type="button"
                    onMouseDown={() => handleRecentSearchPick(name)}
                    style={{
                      width: '100%',
                      border: 'none',
                      textAlign: 'left',
                      padding: '8px 12px',
                      background: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--text)'
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>🕘</span>
                    <span style={{ fontSize: '13px' }}>{name}</span>
                  </button>
                ))}
              </div>
            )}

            {visibleMembers.length > 0 ? (
              visibleMembers.map(member => {
                const isSelected = selectedIds.includes(member._id)
                return (
                  <button
                    key={member._id}
                    type="button"
                    onMouseDown={() => handlePickMember(member)}
                    style={{
                      width: '100%',
                      border: 'none',
                      textAlign: 'left',
                      padding: '10px 12px',
                      background: isSelected ? 'rgba(84, 160, 255, 0.12)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)' }}>
                      {member.name || 'Unnamed user'}
                    </span>
                    {isSelected && (
                      <span style={{ fontSize: '12px', color: 'var(--blue)', fontWeight: '700' }}>
                        Selected
                      </span>
                    )}
                  </button>
                )
              })
            ) : (
              <div style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text-light)' }}>
                No members match your search
              </div>
            )}
          </div>
        )}
      </div>

      {!multiple && selectedMember && (
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--green)' }}>
          Selected: {selectedMember.name}
        </p>
      )}

      {multiple && selectedMembers.length > 0 && (
        <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {selectedMembers.map(member => (
            <span
              key={member._id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '999px',
                background: 'rgba(84, 160, 255, 0.14)',
                color: 'var(--text)',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              <span>{member.name || 'Unnamed user'}</span>
              <button
                type="button"
                onClick={() => removeSelectedMember(member._id)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text)',
                  fontWeight: '700',
                  lineHeight: 1,
                  padding: 0
                }}
                title={`Remove ${member.name || 'member'}`}
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}

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
