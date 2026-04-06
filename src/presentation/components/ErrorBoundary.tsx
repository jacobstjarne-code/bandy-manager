import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Okänt fel'
    return { hasError: true, message }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          background: 'var(--bg-dark)',
          padding: 24,
          gap: 16,
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 40 }}>⚠️</span>
          <p style={{ color: 'var(--warning)', fontSize: 18, fontWeight: 700 }}>Något gick fel</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 280 }}>{this.state.message}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8,
              padding: '10px 24px',
              background: 'rgba(196,122,58,0.15)',
              border: '1px solid rgba(196,122,58,0.4)',
              borderRadius: 8,
              color: 'var(--accent)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            LADDA OM
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
