import { Component, type ReactNode } from 'react'
import { RECOVER_PENDING_FLAG } from '../store/gameStore'

declare const __GIT_HASH__: string

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

  // GAP-1: "Till huvudmenyn" sätter en synkron flagga som rensar pending-flöden vid nästa
  // boot och laddar om till menyn — bryter kraschloopen istället för att bara ladda om
  // samma trasiga state (vilket bara återskapar felet).
  private recoverToMenu = () => {
    try { localStorage.setItem(RECOVER_PENDING_FLAG, '1') } catch { /* localStorage otillgänglig */ }
    window.location.assign('/')
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
          gap: 14,
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 40 }}>⚠️</span>
          <p style={{ color: 'var(--warning)', fontSize: 18, fontWeight: 700 }}>Något gick fel</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, maxWidth: 280 }}>{this.state.message}</p>
          <button
            onClick={this.recoverToMenu}
            style={{
              marginTop: 8,
              padding: '10px 24px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 8,
              color: 'var(--bg-dark)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            TILL HUVUDMENYN
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 20px',
              background: 'transparent',
              border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
              borderRadius: 8,
              color: 'var(--accent)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.5px',
            }}
          >
            Ladda om
          </button>
          <p style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'monospace', marginTop: 4 }}>
            {typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : ''}
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
