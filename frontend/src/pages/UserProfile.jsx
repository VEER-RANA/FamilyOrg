import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import api from '../services/api'

export default function UserProfile() {
  const { user, refreshProfile, updateProfile } = useContext(AuthContext)
  const [form, setForm] = useState({ name: '', email: '', mobile: '' })
  const [status, setStatus] = useState({ saving: false, error: null, success: null })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' })
  const [pwStatus, setPwStatus] = useState({ saving: false, error: null, success: null })

  useEffect(() => {
    const init = async () => {
      try {
        const profile = await refreshProfile()
        setForm({
          name: profile?.name || '',
          email: profile?.email || '',
          mobile: profile?.mobile || ''
        })
      } catch (err) {
        setStatus(s => ({ ...s, error: err.response?.data?.message || 'Failed to load profile' }))
      }
    }
    init()
  }, [refreshProfile])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus({ saving: true, error: null, success: null })
    try {
      const updated = await updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim()
      })
      setForm({ name: updated.name, email: updated.email, mobile: updated.mobile || '' })
      setStatus({ saving: false, error: null, success: 'Profile updated successfully' })
    } catch (err) {
      setStatus({ saving: false, error: err.response?.data?.message || 'Update failed', success: null })
    }
  }

  const onPwChange = (e) => {
    const { name, value } = e.target
    setPwForm(prev => ({ ...prev, [name]: value }))
  }

  const onPwSubmit = async (e) => {
    e.preventDefault()
    setPwStatus({ saving: true, error: null, success: null })
    try {
      await api.put('/users/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      })
      setPwForm({ currentPassword: '', newPassword: '' })
      setPwStatus({ saving: false, error: null, success: 'Password updated successfully' })
    } catch (err) {
      setPwStatus({ saving: false, error: err.response?.data?.message || 'Password update failed', success: null })
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>👤 Your Profile</h1>
          <p className="subtitle">Edit your personal details</p>
        </div>
      </div>

      <div className="content-grid">
        <div className="panel full" style={{ maxWidth: 640 }}>
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={onChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="mobile">Mobile</label>
              <input
                id="mobile"
                name="mobile"
                type="tel"
                value={form.mobile}
                onChange={onChange}
              />
            </div>

            {status.error && (
              <div className="dashboard-error" style={{ marginTop: 12 }}>⚠️ {status.error}</div>
            )}
            {status.success && (
              <div className="notice" style={{ marginTop: 12, color: 'var(--green)' }}>✅ {status.success}</div>
            )}

            <div style={{ marginTop: 16 }}>
              <button
                className="btn"
                type="submit"
                disabled={status.saving}
                style={{ opacity: status.saving ? 0.7 : 1 }}
              >
                {status.saving ? '💾 Saving…' : '💾 Save Changes'}
              </button>
            </div>
          </form>
        </div>

        <div className="panel full" style={{ maxWidth: 640 }}>
          <h3>🔒 Change Password</h3>
          <form onSubmit={onPwSubmit}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={pwForm.currentPassword}
                onChange={onPwChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={pwForm.newPassword}
                onChange={onPwChange}
                required
              />
            </div>

            {pwStatus.error && (
              <div className="dashboard-error" style={{ marginTop: 12 }}>⚠️ {pwStatus.error}</div>
            )}
            {pwStatus.success && (
              <div className="notice" style={{ marginTop: 12, color: 'var(--green)' }}>✅ {pwStatus.success}</div>
            )}

            <div style={{ marginTop: 16 }}>
              <button
                className="btn"
                type="submit"
                disabled={pwStatus.saving}
                style={{ opacity: pwStatus.saving ? 0.7 : 1 }}
              >
                {pwStatus.saving ? '🔑 Updating…' : '🔑 Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
        .form-group input { padding: 10px; border: 1px solid var(--border); border-radius: 8px; }
      `}</style>
    </div>
  )
}
