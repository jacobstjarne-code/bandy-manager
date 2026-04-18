import React from 'react'

interface PageSectionProps {
  title?: string
  children: React.ReactNode
}

export function PageSection({ title, children }: PageSectionProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      {title && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 12,
        }}>
          {title}
        </p>
      )}
      {children}
    </div>
  )
}
