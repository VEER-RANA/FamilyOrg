import React, { createContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export const AuthContext = createContext()

const normalizeUser = (raw) => {
  if (!raw) return null
  const id = raw.id || raw._id
  return id ? { ...raw, id } : raw
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? normalizeUser(JSON.parse(raw)) : null
  })

  const [token, setToken] = useState(() => localStorage.getItem('token'))

  useEffect(() => {
    // Update localStorage when token changes
    if (token) {
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
    }
  }, [token])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user } = res.data
    setToken(token)
    const normalized = normalizeUser(user)
    setUser(normalized)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(normalized))
    return normalized
  }, [])

  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    const { token, user } = res.data
    setToken(token)
    const normalized = normalizeUser(user)
    setUser(normalized)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(normalized))
    return normalized
  }, [])

  // Fetch latest profile from server and update context/localStorage
  const refreshProfile = useCallback(async () => {
    const res = await api.get('/users/profile')
    const normalized = normalizeUser(res.data)
    setUser(normalized)
    localStorage.setItem('user', JSON.stringify(normalized))
    return normalized
  }, [])

  // Update profile (name, email, mobile) and persist
  const updateProfile = useCallback(async (updates) => {
    const res = await api.put('/users/profile', updates)
    const normalized = normalizeUser(res.data)
    setUser(normalized)
    localStorage.setItem('user', JSON.stringify(normalized))
    return normalized
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, register, refreshProfile, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
