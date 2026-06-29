import React from 'react'

interface PageSectionProps {
  title?: string
  children: React.ReactNode
}

export function PageSection({ title, children }: PageSectionProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      {title && (
        <p className="h-label" style={{ marginBottom: 12 }}>
          {title}
        </p>
      )}
      {children}
    </div>
  )
}
