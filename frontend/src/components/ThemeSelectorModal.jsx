import React from 'react'
import { EVENT_THEMES, TRIP_THEMES } from '../utils/themeConfig'

export default function ThemeSelectorModal({ 
  type, 
  currentTheme, 
  onSelect, 
  onClose,
  onSave 
}) {
  const themes = type === 'event' ? EVENT_THEMES : TRIP_THEMES;
  
  const handleThemeSelect = (themeKey) => {
    onSelect(themeKey);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.55)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      padding: '16px',
      backdropFilter: 'blur(5px)',
      overflow: 'auto'
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border)'
        }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'var(--text)' }}>
            Select {type === 'event' ? 'Event' : 'Trip'} Theme
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--text-light)',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          margin: '20px 0',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {Object.entries(themes).map(([themeKey, themeData]) => (
            <div
              key={themeKey}
              onClick={() => handleThemeSelect(themeKey)}
              style={{
                padding: '16px',
                border: currentTheme === themeKey ? `3px solid ${themeData.borderColor}` : '1px solid #e0e0e0',
                backgroundColor: themeData.bgColor,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 200ms',
                textAlign: 'center',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '32px' }}>{themeData.icon}</div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text)' }}>
                {themeData.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {themeData.description}
              </div>
              {currentTheme === themeKey && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '24px',
                  height: '24px',
                  background: 'var(--blue)',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>✓</div>
              )}
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border)'
        }}>
          <button 
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'var(--border)',
              color: 'var(--text)',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 200ms'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--border-light, #f0f0f0)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--border)';
            }}
          >
            Cancel
          </button>
          <button 
            onClick={onSave}
            style={{
              padding: '10px 20px',
              background: 'var(--blue)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 200ms'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--blue-dark, #5a67d8)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--blue)';
            }}
          >
            Save Theme
          </button>
        </div>
      </div>
    </div>
  );
}
