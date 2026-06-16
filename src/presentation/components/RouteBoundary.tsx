import { Component, type ReactNode } from 'react'
import { navigateTo } from '../navigation/globalNavigate'

/**
 * GAP-1(c): per-vy error boundary runt GameShells Outlet. Ett trasigt kort/skärm
 * släcker bara sin egen vy — BottomNav (renderad UTANFÖR denna boundary) lever, så
 * spelaren kan navigera vidare. GameShell nycklar wrappern på pathname → boundaryn
 * återställs automatiskt vid flikbyte. "Till översikten" återställer + navigerar
 * (router-kontexten lever, till skillnad från rot-ErrorBoundary).
 */
interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class RouteBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  private toDashboard = () => {
    this.setState({ hasError: false })
    navigateTo('/game/dashboard')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 12, padding: '48px 24px', minHeight: 240,
          textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600 }}>
            Den här vyn kunde inte visas.
          </p>
          <button
            onClick={this.toDashboard}
            className="btn btn-outline"
            style={{ fontSize: 13 }}
          >
            Till översikten
          </button>
          <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            Övriga flikar fungerar som vanligt.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
