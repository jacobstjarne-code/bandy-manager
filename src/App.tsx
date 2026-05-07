import { AppRouter } from './presentation/navigation/AppRouter'
import { ErrorBoundary } from './presentation/components/ErrorBoundary'

declare const __GIT_HASH__: string
declare const __BUILD_DATE__: string

export default function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
      <div style={{
        position: 'fixed', bottom: 64, left: 0, right: 0, zIndex: 9999,
        fontSize: 13, color: 'rgba(255,255,255,0.7)',
        fontFamily: 'monospace', letterSpacing: '1px',
        pointerEvents: 'none', userSelect: 'none',
        textAlign: 'center',
      }}>
        {__GIT_HASH__}
      </div>
    </ErrorBoundary>
  )
}
