import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { positionShort, formatSalary } from '../utils/formatters'

/**
 * SeasonContractDemandsScreen — A-H2b RETENTION (DOM_AH2B_RETENTION_2026-08-28).
 *
 * Säsongsövergångens SAMLADE lönekravsbeslut (Leg 1 — "domens egna ord").
 * Visas mellan SeasonSummary och styrelsemötets scen (board_meeting,
 * pendingScene-systemet) NÄR seasonEndProcessor.ts hittat obemötta krav för
 * den hanterade klubbens aktiva förstalagsspelare (game.pendingContractDemands).
 *
 * Möter kravet: lön höjs till minSalary omedelbart, ingen morale-effekt.
 * Obemött (default): ingen löneändring, morale eroderas (Leg 2 — mellanledet,
 * Jacobs val: synligt, planeringsbart, inte en dold bestraffning). Se
 * contractDemandService.ts för den faktiska tillämpningen.
 *
 * SVENSK TEXT — CODE SKRIVER ALDRIG (doktrinens egen skärpning för denna
 * yta): rubrik/förklaringsraden är '[Opus]' tills mekaniken är låst och
 * texten skriven — se tests/grind/opusPlaceholderGate.ts:s allowlist.
 * Funktionella knapp-/sektionsetiketter (samma kategori som "Förläng"/
 * "Avslå" i ContractsTab.tsx/eventFactories.ts) är INTE gated — de är
 * gränssnittskontroller, inte berättande text.
 */
export function SeasonContractDemandsScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const resolveContractDemands = useGameStore(s => s.resolveContractDemands)

  const demands = game?.pendingContractDemands ?? []

  // Default: obemött (spelaren måste aktivt välja att möta varje krav —
  // samma "inget sker automatiskt"-princip som renewContract/createOutgoingBid).
  const [decisions, setDecisions] = useState<Record<string, 'met' | 'skipped'>>(
    () => Object.fromEntries(demands.map(d => [d.playerId, 'skipped' as const])),
  )

  if (!game) { navigate('/game', { replace: true }); return null }
  if (demands.length === 0) {
    // Grind: skärmen ska aldrig kunna nås utan krav (clearSeasonSummary
    // gatar på pendingContractDemands.length > 0) — men om save-state ändå
    // hamnar här (t.ex. gammal save mid-flow), fall igenom utan att fastna.
    resolveContractDemands({})
    navigate('/game/dashboard', { replace: true })
    return null
  }

  function toggle(playerId: string, value: 'met' | 'skipped') {
    setDecisions(prev => ({ ...prev, [playerId]: value }))
  }

  function setAll(value: 'met' | 'skipped') {
    setDecisions(Object.fromEntries(demands.map(d => [d.playerId, value])))
  }

  function handleConfirm() {
    resolveContractDemands(decisions)
    navigate('/game/dashboard', { replace: true })
  }

  const metCount = Object.values(decisions).filter(v => v === 'met').length

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', overflowY: 'auto' }}>

      {/* ── RUBRIK ── */}
      <div style={{ textAlign: 'center', padding: '40px 20px 16px' }}>
        <p className="h-label" style={{ marginBottom: 12 }}>
          💰 LÖNEKRAV
        </p>
        <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Georgia, serif', lineHeight: 1.3, marginBottom: 6 }}>
          Truppen vill ha det den är värd
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          De som bar laget i år vet det. Möter du inte kravet finns alltid en klubb som gör det — och då är det inte längre ditt beslut.
        </p>
      </div>

      {/* ── BULK-VAL ── */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 10px' }}>
        <button onClick={() => setAll('met')} className="btn btn-outline" style={{ flex: 1, padding: '8px 10px', fontSize: 12, fontWeight: 600 }}>
          Möt alla
        </button>
        <button onClick={() => setAll('skipped')} className="btn btn-outline" style={{ flex: 1, padding: '8px 10px', fontSize: 12, fontWeight: 600 }}>
          Möt inga
        </button>
      </div>

      {/* ── KRAVLISTA ── */}
      <div className="card-sharp" style={{ padding: '10px 14px', marginBottom: 12, marginLeft: 16, marginRight: 16 }}>
        <p className="h-label" style={{ marginBottom: 8 }}>
          {demands.length} {demands.length === 1 ? 'SPELARE' : 'SPELARE'} — {metCount}/{demands.length} MÖTTA
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {demands.map((demand, i) => {
            const player = game.players.find(p => p.id === demand.playerId)
            if (!player) return null
            const decision = decisions[demand.playerId] ?? 'skipped'
            const isMet = decision === 'met'
            return (
              <div key={demand.playerId} style={{
                display: 'flex', flexDirection: 'column', gap: 6,
                padding: '10px 4px',
                borderBottom: i < demands.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {player.firstName} {player.lastName}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {positionShort(player.position)}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {formatSalary(demand.currentSalary)} → <strong style={{ color: 'var(--text-primary)' }}>{formatSalary(demand.minSalary)}</strong>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => toggle(demand.playerId, 'met')}
                    aria-pressed={isMet}
                    className="btn btn-outline"
                    style={{
                      flex: 1, padding: '6px 8px', fontSize: 11, fontWeight: 600,
                      background: isMet ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : undefined,
                      boxShadow: isMet ? 'inset 0 0 0 1px var(--accent)' : undefined,
                    }}
                  >
                    Möt kravet
                  </button>
                  <button
                    onClick={() => toggle(demand.playerId, 'skipped')}
                    aria-pressed={!isMet}
                    className="btn btn-outline"
                    style={{
                      flex: 1, padding: '6px 8px', fontSize: 11, fontWeight: 600,
                      background: !isMet ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : undefined,
                      boxShadow: !isMet ? 'inset 0 0 0 1px var(--accent)' : undefined,
                    }}
                  >
                    Behåll nuvarande lön
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ padding: '0 16px calc(24px + env(safe-area-inset-bottom, 0px))', marginTop: 'auto' }}>
        <button onClick={handleConfirm} className="btn btn-primary btn-cta">
          BEKRÄFTA BESLUT →
        </button>
      </div>
    </div>
  )
}
