import React from 'react'

interface InfoRowProps {
  label: string
  value: React.ReactNode
  divider?: boolean
}

export function InfoRow({ label, value, divider = true }: InfoRowProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 0',
      borderBottom: divider ? '0.5px solid var(--divider, var(--border))' : undefined,
    }}>
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 12,
        fontWeight: 400,
        color: 'var(--text-primary)',
        textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  )
}
