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
      <span className="h-label" style={{ margin: 0 }}>
        {label}
      </span>
      <span className="h-num-sm" style={{ color: 'var(--text-primary)', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  )
}
