import React from 'react'

interface OverlayBackdropProps {
  onClose?: () => void
  children: React.ReactNode
}

export function OverlayBackdrop({ onClose, children }: OverlayBackdropProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
