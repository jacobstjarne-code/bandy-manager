/**
 * FormSquares — V/O/F-rutor, samma färgkonvention som GranskaOversikt.tsx:s
 * form-strip (success/danger/muted). En sanning för "senaste resultat som
 * rutor" — används av B3 (motståndarens form i framåtkroken) och B4
 * (egen svit i svitkortet).
 */

const RESULT_COLOR: Record<'V' | 'O' | 'F', string> = {
  V: 'var(--success)',
  O: 'var(--text-muted)',
  F: 'var(--danger)',
}

interface Props {
  results: Array<'V' | 'O' | 'F'>
}

export function FormSquares({ results }: Props) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {results.map((r, i) => (
        <span
          key={i}
          style={{
            width: 16,
            height: 16,
            borderRadius: 3,
            background: RESULT_COLOR[r],
            color: 'var(--text-light)',
            // ds-exempt: V/O/F-bokstav i dynamiskt färgad form-ruta (samma mönster som GranskaOversikt.tsx)
            fontSize: 9,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {r}
        </span>
      ))}
    </div>
  )
}
