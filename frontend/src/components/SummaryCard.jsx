import React, { useState } from "react"

export default function SummaryCard({ title, value, color, details }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div
        className="summary-card clickable"
        style={{
          borderLeft: `4px solid ${color || "#6b46c1"}`,
          cursor: details ? 'pointer' : 'default'
        }}
        onClick={() => details && setOpen(true)}
        onMouseEnter={e => {
          if (details) {
            e.currentTarget.style.transform = 'translateY(-8px)'
            e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        }}
      >
        <div className="summary-title">{title}</div>
        <div className="summary-value">{value}</div>
        {details && <div className="summary-view">👁 View details →</div>}
      </div>

      {/* Modal */}
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>📊 {title} – Details</h3>

            <pre className="json-view">
              {JSON.stringify(details, null, 2)}
            </pre>

            <div style={{ textAlign: "right", marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn secondary" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
