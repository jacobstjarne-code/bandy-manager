import type { MatchStep } from '../../../domain/services/matchSimulator'
import { BottomDock } from './BottomDock'
import { MomentumBar } from './MomentumBar'
import { StatsFooter, calculateLiveStats } from './StatsFooter'

interface SiffrorDrawerProps {
  open: boolean
  onClose: () => void
  currentMatchStep: MatchStep | null
  momentumHistory: number[]
  homeShort: string
  awayShort: string
}

export function SiffrorDrawer({
  open,
  onClose,
  currentMatchStep,
  momentumHistory,
  homeShort,
  awayShort,
}: SiffrorDrawerProps) {
  return (
    <BottomDock variant="peek" open={open} onClose={onClose} height={280}>
      <div style={{ padding: '4px 0 8px' }}>
        {currentMatchStep ? (
          <>
            <MomentumBar
              step={currentMatchStep}
              homeShort={homeShort}
              awayShort={awayShort}
              history={momentumHistory}
            />
            <StatsFooter stats={calculateLiveStats(currentMatchStep)} />
          </>
        ) : (
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--ink-mute)', textAlign: 'center', padding: '24px 0',
          }}>
            Matchdata tillgänglig under spel
          </p>
        )}
      </div>
    </BottomDock>
  )
}
