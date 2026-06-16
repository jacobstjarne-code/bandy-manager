import { AppRouter } from './presentation/navigation/AppRouter'
import { ErrorBoundary } from './presentation/components/ErrorBoundary'
import { FeedbackButton } from './presentation/components/FeedbackButton'

export default function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
      {/* GAP-2: build-hash-overlayn är nu tappbar → testar-feedback */}
      <FeedbackButton />
    </ErrorBoundary>
  )
}
