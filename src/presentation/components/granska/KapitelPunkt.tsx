import type { KapitelPunktKind, KapitelPunktAvskedData } from '../../../domain/services/kapitelPunktService'
import { getKapitelPunktText } from '../../../domain/services/kapitelPunktService'

interface KapitelPunktProps {
  kind: KapitelPunktKind
  avsked?: KapitelPunktAvskedData
}

/**
 * GRANSKA CRESCENDO — post 6/7/10 (2026-08-17). En kapitelpunkt efter
 * resultatblocket, före Turneringsläge/statistik — markerar i stället för
 * att ceremoniera. Rapportens röst: ingen SectionLabel-kicker, ingen
 * gold/hero-styling (den finns redan på resultatHeroCard) — bara två
 * typografiska nivåer, platt som resten av "Dina val"-korten.
 */
export function KapitelPunkt({ kind, avsked }: KapitelPunktProps) {
  const text = getKapitelPunktText(kind, avsked)
  if (!text) return null

  return (
    <div className="card-sharp" style={{ margin: '0 0 3px', padding: '10px 12px' }}>
      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
        {text.title}
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
        {text.subtitle}
      </p>
    </div>
  )
}
