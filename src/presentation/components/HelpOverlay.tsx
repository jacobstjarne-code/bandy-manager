const HELP_SECTIONS = [
  { emoji: '🏒', title: 'Matchen', body: '22 omgångar + cup + slutspel. Välj lineup och taktik. Resten sköter sig — utom hörnorna.' },
  { emoji: '📐', title: 'Hörnor', body: 'I bandy kommer hälften av alla mål från hörnor. Du väljer zon och leverans. Hög hörnskill = fler mål.' },
  { emoji: '🏘', title: 'Orten', body: 'Frivilliga, kommun och aktiviteter ger pengar och bygdens puls. Hög puls = bättre ekonomi och hemmaplansfördel.' },
  { emoji: '📣', title: 'Klacken', body: 'Fyra karaktärer med åsikter. Deras humör ger hemmabonus. De har en favoritspelare. Ignorera dem på egen risk.' },
  { emoji: '💰', title: 'Ekonomi', body: 'Kassan är tight. Sponsorer + frivilliga + matchintäkter. Minusbudget = styrelsen tappar tålamodet.' },
  { emoji: '⚔️', title: 'Slutspel', body: 'Topp 8 efter grundserien → kvartsfinal → semifinal → SM-final. Bäst av fem.' },
]

interface HelpOverlayProps {
  onClose: () => void
  onRestartCoachMarks: () => void
}

export function HelpOverlay({ onClose, onRestartCoachMarks }: HelpOverlayProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        zIndex: 250, display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', paddingTop: 60, overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg)', borderRadius: 12,
          padding: '20px 18px', maxWidth: 380, width: '90%',
          maxHeight: 'calc(100vh - 100px)', overflowY: 'auto',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <h2 style={{
              fontSize: 18, fontWeight: 800,
              fontFamily: 'var(--font-display)', margin: '0 0 4px',
              color: 'var(--text-primary)',
            }}>
              Hur funkar det?
            </h2>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              Allt du behöver veta. Resten lär du dig på isen.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              fontSize: 20, color: 'var(--text-muted)',
              cursor: 'pointer', padding: '0 0 0 8px', flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {HELP_SECTIONS.map((s, i) => (
            <div
              key={i}
              className="card-sharp"
              style={{ padding: '10px 12px' }}
            >
              <p style={{
                fontSize: 13, fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)', margin: '0 0 4px',
              }}>
                {s.emoji} {s.title}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={() => { onRestartCoachMarks(); onClose() }}
          style={{
            width: '100%', marginTop: 16, padding: '12px',
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
          }}
        >
          🔄 Visa introduktionen igen
        </button>
      </div>
    </div>
  )
}
