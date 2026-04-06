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
    <div
      className="card-sharp"
      style={{
        margin: '0 0 8px',
        background: 'linear-gradient(135deg, rgba(196,122,58,0.08), rgba(196,122,58,0.03))',
        border: '1px solid rgba(196,122,58,0.25)',
        position: 'relative',
      }}
    >
      <div style={{ padding: '10px 14px' }}>
        <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
          👋 KOMMA IGÅNG
        </p>
        <button
          onClick={onDismiss}
          style={{
            position: 'absolute', top: 8, right: 10,
            background: 'none', border: 'none',
            fontSize: 14, color: 'var(--text-muted)',
            cursor: 'pointer', lineHeight: 1,
          }}
        >×</button>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{hint.icon}</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              {hint.title}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
              {hint.body}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => navigate(hint.path, hint.state ? { state: hint.state } : undefined)}
                className="btn btn-ghost"
                style={{ fontSize: 12, padding: '5px 12px' }}
              >
                {hint.action}
              </button>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center' }}>
                Tips {step + 1} av 5
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
