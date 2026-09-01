import { Overlay } from '../primitives/Overlay'

interface WageOverrunWarningProps {
  overrunPct: number
  seasonSeed: number
  onCancel: () => void
  onConfirm: () => void
}

const TEXTS_LIGHT = [
  'Det här går nära kanten. Vi kommer att överskrida budgeten med ~{PCT}% om du gör det här. Hanterbart en kort tid, men inte hela säsongen.',
  'Vi tar oss en titt till på siffrorna. Du är ~{PCT}% över budget med det här köpet. Det går — men det måste finnas en plan för andra halvan av säsongen.',
  'Det är ett bra namn du fått tag i. Men budgeten klarar inte ~{PCT}% överskridande hela året. Tänk på det.',
]

const TEXTS_NOTABLE = [
  'Det här går inte ihop. Lönelistan tål inte ett till. Om du gör det här blir det ett samtal med Licensnämnden om ett halvår.',
  'Jag har varit ordförande i tolv år. Det jag säger nu säger jag av erfarenhet, inte av tradition: vi har inte täckning. Tänk om.',
  'Du är tränaren och du fattar besluten. Men jag måste säga det här: om vi går över budget en gång till kommer styrelsen att kräva en plan.',
]

const TEXTS_SEVERE = [
  'Det här är inte en varning, det är en vädjan. ~{PCT}% över budget är inte hanterbart. Det blir poängavdrag, inte om — utan när.',
  'Jag tänker säga ja till slut, för det är ditt beslut. Men jag säger ja motvilligt och jag vill att du skriver under på att du är medveten om konsekvenserna.',
  'Som ordförande har jag ett ansvar för klubbens långsiktighet. Det här köpet hotar den. Tänk noga.',
]

export function WageOverrunWarning({ overrunPct, seasonSeed, onCancel, onConfirm }: WageOverrunWarningProps) {
  const variant = overrunPct > 30 ? 'severe' : overrunPct > 15 ? 'notable' : 'light'
  const texts = variant === 'severe' ? TEXTS_SEVERE : variant === 'notable' ? TEXTS_NOTABLE : TEXTS_LIGHT
  const text = texts[seasonSeed % texts.length].replace('{PCT}', String(overrunPct))

  const title = variant === 'severe'
    ? '🚨 Ordföranden vädjar'
    : '⚠️ ' + (variant === 'notable' ? 'Ordföranden är orolig' : 'Ordföranden vill prata')

  const confirmLabel = variant === 'light' ? 'Bekräfta köp' : 'Bekräfta köp ändå'

  return (
    <Overlay onClose={onCancel} ariaLabel={title} maxWidth={430} zIndex="var(--z-overlay)" backdropPadding="20px" backdropStyle={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="transfers-modal-box"
        style={{ border: `1px solid ${variant === 'severe' ? 'var(--danger)' : 'var(--warning)'}` }}
      >
        <p className="h-name" style={{ marginBottom: 14 }}>
          {title}
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 24 }}>
          "{text}"
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            className="btn btn-outline"
            style={{ flex: 1, padding: '12px', fontSize: 14, fontWeight: 600 }}
          >
            Avbryt
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-copper"
            style={{ flex: 1, padding: '12px', fontSize: 14, fontWeight: 600 }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Overlay>
  )
}
