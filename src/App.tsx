import { AppRouter } from './presentation/navigation/AppRouter'
import { ErrorBoundary } from './presentation/components/ErrorBoundary'

declare const __GIT_HASH__: string

export default function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
      <div style={{
        position: 'fixed', bottom: 60, right: 6, zIndex: 9999,
        fontSize: 9, color: 'rgba(255,255,255,0.2)',
        fontFamily: 'monospace', letterSpacing: '0.3px',
        pointerEvents: 'none', userSelect: 'none',
      }}>
        {__GIT_HASH__}
      </div>
    </ErrorBoundary>
  )
}
