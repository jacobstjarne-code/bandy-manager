import type { PlayerTransferLedger } from '../../../domain/services/playerTransferLedgerService'

interface Props extends PlayerTransferLedger {
  clubName: string
  tone: 'bid' | 'renew'
}

export function PlayerLedgerPanel({ rows, verdict, clubName, tone }: Props) {
  if (rows.length === 0 && !verdict) return null

  return (
    <>
      {rows.length > 0 && (
        <section className="transfers-player-ledger" aria-label={`Spelarens liggare i ${clubName}`}>
          <div className="transfers-player-ledger-rail" aria-hidden="true" />
          <div className="transfers-player-ledger-title">Spelarens liggare · {clubName}</div>
          {rows.map((row, index) => (
            <div className="transfers-player-ledger-row" key={`${row.family}-${row.source}-${index}`}>
              <span className="transfers-player-ledger-family" aria-hidden="true">{row.family}</span>
              <span className="transfers-player-ledger-text">
                {row.isTriumf && <span className="transfers-player-ledger-triumph" aria-label="Triumf" />}
                {row.text} <em>{row.source}</em>
              </span>
            </div>
          ))}
        </section>
      )}
      {verdict && (
        <div className={`transfers-player-ledger-verdict transfers-player-ledger-verdict--${tone}`}>
          {verdict}
        </div>
      )}
    </>
  )
}
