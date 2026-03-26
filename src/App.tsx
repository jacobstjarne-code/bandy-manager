import { AppRouter } from './presentation/navigation/AppRouter'
import { ErrorBoundary } from './presentation/components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  )
}
