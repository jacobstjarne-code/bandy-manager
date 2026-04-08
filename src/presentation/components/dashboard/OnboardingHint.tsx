import { useNavigate } from 'react-router-dom'

interface Props {
  step: number
  clubName: string
  onDismiss: () => void
}

const HINTS: Record<number, { icon: string; title: string; body: string; action: string; path: string; state?: Record<string, unknown> }> = {
  0: {
    icon: '👥',
    title: 'Sätt din startelva',
    body: 'Ditt lag behöver en lineup innan första matchen. Gå till matchvyn och välj 11 startspelare.',
    action: 'Välj lineup →',
    path: '/game/match',
  },
  1: {
    icon: '🏋️',
    title: 'Justera träningen',
    body: 'Bra match! Nu kan du välja träningsfokus — fysik, teknik eller taktik. Det påverkar spelarnas utveckling.',
    action: 'Se träning →',
    path: '/game/club',
    state: { tab: 'training' },
  },
  2: {
    icon: '🏛️',
    title: 'Styrelsen har förväntningar',
    body: 'Kolla in styrelsens uppdrag under Klubb-fliken. De vill se att du bygger något — uppfyll deras mål för att behålla förtroendet.',
    action: 'Se uppdrag →',
    path: '/game/club',
    state: { tab: 'ekonomi' },
  },
  3: {
    icon: '🏘️',
    title: 'Besök Orten-tabben',
    body: 'Bygdens stöd spelar roll. Mecenater, kommun och lokala aktiviteter påverkar din ekonomi och hemmaplansfördel.',
    action: 'Se Orten →',
    path: '/game/club',
    state: { tab: 'orten' },
  },
  4: {
    icon: '📋',
    title: 'Träningsplanering gör skillnad',
    body: 'Rätt träningsfokus och intensitet utvecklar spelarna snabbare. Hög intensitet ger mer men ökar skaderisken.',
    action: 'Se Träning →',
    path: '/game/club',
    state: { tab: 'training' },
  },
}

export function OnboardingHint({ step, clubName: _cn, onDismiss }: Props) {
  const navigate = useNavigate()
  const hint = HINTS[step]
  if (!hint) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 14px', background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)', margin: '0 0 4px',
    }}>
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
        {hint.icon} {hint.title} —{' '}
        <span
          onClick={() => navigate(hint.path, hint.state ? { state: hint.state } : undefined)}
          style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {hint.action}
        </span>
      </span>
      <button onClick={onDismiss} style={{ fontSize: 10, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8 }}>✕</button>
    </div>
  )
}
