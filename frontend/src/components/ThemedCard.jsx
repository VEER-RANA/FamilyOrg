import React from 'react'
import { getEventTheme, getTripTheme } from '../utils/themeConfig'

export default function ThemedCard({ 
  type, 
  theme, 
  children,
  onClick,
  className = ''
}) {
  const themeData = type === 'event' 
    ? getEventTheme(theme) 
    : getTripTheme(theme);

  return (
    <div
      className={`themed-card ${className}`}
      onClick={onClick}
      style={{
        backgroundColor: themeData.bgColor,
        borderLeft: `5px solid ${themeData.color}`,
        borderRadius: '10px',
        padding: '16px',
        marginBottom: '12px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 200ms',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        overflow: 'visible',
        position: 'relative'
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
          e.currentTarget.style.transform = 'translateX(4px)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ fontSize: '24px' }}>{themeData.icon}</div>
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
