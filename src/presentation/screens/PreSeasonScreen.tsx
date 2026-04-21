import type React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { ClubExpectation, PlayerPosition } from '../../domain/enums'
import { positionShort, formatFinanceAbs } from '../utils/formatters'
import { calculateClubEra, eraLabel, eraFullLabel, eraDescription } from '../../domain/services/clubEraService'

const LABEL: React.CSSProperties = {
  fontSize: 8, fontWeight: 600, letterSpacing: '2px',
  textTransform: 'uppercase', color: 'var(--text-muted)',
  fontFamily: 'var(--font-body)', margin: 0,
}

function seasonOrdinal(n: number): string {
  const names = ['Första', 'Andra', 'Tredje', 'Fjärde', 'Femte', 'Sjätte', 'Sjunde', 'Åttonde', 'Nionde', 'Tionde']
  return names[n] ?? `${n + 1}:e`
}

function expectationText(e: ClubExpectation): string {
  switch (e) {
    case ClubExpectation.AvoidBottom: return 'Undvik nedflyttning'
    case ClubExpectation.MidTable: return 'Håll mittentabellen'
    case ClubExpectation.ChallengeTop: return 'Utmana toppen'
    case ClubExpectation.WinLeague: return 'Vinn ligan'
  }
}

export function PreSeasonScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const clearPreSeason = useGameStore(s => s.clearPreSeason)
  const setBudgetPriority = useGameStore(s => s.setBudgetPriority)
  const setCaptain = useGameStore(s => s.setCaptain)

  const [priority, setPriority] = useState<'squad' | 'balanced' | 'youth'>(
    game?.budgetPriority ?? 'balanced'
  )
  const [selectedCaptain, setSelectedCaptain] = useState<string | null>(
    game?.captainPlayerId ?? null
  )

  if (!game) { navigate('/game', { replace: true }); return null }

  const club = game.clubs.find(c => c.id === game.managedClubId)
  if (!club) { navigate('/game', { replace: true }); return null }

  const snap = game.seasonStartSnapshot

  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const avgCA = managedPlayers.length > 0
    ? Math.round(managedPlayers.reduce((s, p) => s + p.currentAbility, 0) / managedPlayers.length)
    : 0

  const lastIntake = [...(game.youthIntakeHistory ?? [])]
    .filter(r => r.clubId === game.managedClubId)
    .slice(-1)[0]
  const youthCount = lastIntake?.playerIds.length ?? 0
  const topProspect = lastIntake?.topProspectId
    ? game.players.find(p => p.id === lastIntake.topProspectId)
    : null

  const expiringPlayers = managedPlayers.filter(
    p => p.contractUntilSeason <= game.currentSeason + 1
  )

  const captainCandidates = managedPlayers
    .filter(p => p.position !== PlayerPosition.Goalkeeper)
    .sort((a, b) => {
      const scoreA = (a.loyaltyScore ?? 0) + (a.careerStats?.totalGames ?? 0) * 0.5 + (a.trait === 'ledare' ? 20 : 0)
      const scoreB = (b.loyaltyScore ?? 0) + (b.careerStats?.totalGames ?? 0) * 0.5 + (b.trait === 'ledare' ? 20 : 0)
      return scoreB - scoreA
    })
    .slice(0, 3)

  const currPosition = game.standings.find(s => s.clubId === game.managedClubId)?.position ?? snap?.finalPosition ?? 12
  const currMembers = game.supporterGroup?.members ?? snap?.supporterMembers ?? 0
  const currCS = game.communityStanding ?? 50

  function handleStart() {
    setBudgetPriority(priority)
    if (selectedCaptain && selectedCaptain !== game?.captainPlayerId) {
      setCaptain(selectedCaptain)
    }
    clearPreSeason()
    navigate('/game', { replace: true })
  }

  return (
    <div style={{
      height: '100%',
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 20px',
      overflowY: 'auto',
    }}>
      <div style={{
        width: '100%', maxWidth: 390,
        display: 'flex', flexDirection: 'column', gap: 6,
        paddingBottom: 'calc(var(--safe-bottom, 0px) + 16px)',
      }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 10, paddingTop: 8 }}>
          <p style={{ ...LABEL, color: 'var(--accent)', marginBottom: 8 }}>
            FÖRSÄSONG
          </p>
          <h1 style={{
            fontSize: 28, fontWeight: 400, margin: 0,
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}>
            Säsong {game.currentSeason}/{game.currentSeason + 1}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-body)' }}>
            {club.name}
          </p>
        </div>

        {/* ── LÄGET I KLUBBEN ── */}
        {snap && snap.season === game.currentSeason - 1 && (
          <div className="card-sharp" style={{ padding: '10px 14px' }}>
            <p style={{ ...LABEL, marginBottom: 8 }}>LÄGET I KLUBBEN</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                { label: 'Tabellplats', prev: `${snap.finalPosition}:a`, curr: `${currPosition}:a`, delta: currPosition - snap.finalPosition, invert: true },
                { label: 'Klubbkassa', prev: formatFinanceAbs(snap.finances), curr: formatFinanceAbs(club.finances), delta: club.finances - snap.finances },
                { label: 'Orten', prev: `${snap.communityStanding}`, curr: `${currCS}`, delta: currCS - snap.communityStanding },
                { label: 'Klacken', prev: `${snap.supporterMembers} medl.`, curr: `${currMembers} medl.`, delta: currMembers - snap.supporterMembers },
              ].map(row => {
                const up = row.invert ? row.delta < 0 : row.delta > 0
                const down = row.invert ? row.delta > 0 : row.delta < 0
                const arrow = up ? '↑' : down ? '↓' : '→'
                const arrowColor = up ? 'var(--success)' : down ? 'var(--danger)' : 'var(--text-muted)'
                return (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontFamily: 'var(--font-body)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {row.prev} → <strong style={{ color: 'var(--text-primary)' }}>{row.curr}</strong>
                      {' '}<span style={{ color: arrowColor, fontWeight: 700 }}>{arrow}</span>
                    </span>
                  </div>
                )
              })}
              {snap.academyPromotions > 0 && (
                <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 4, fontFamily: 'var(--font-body)' }}>
                  🌱 {snap.academyPromotions} uppflyttad{snap.academyPromotions > 1 ? 'e' : ''} från akademin
                </p>
              )}
              {(() => {
                const posDelta = snap.finalPosition - currPosition
                const finDelta = club.finances - snap.finances
                let narrative = 'En säsong med rörelse. Nästa ska visa om riktningen håller.'
                if (posDelta >= 3 && finDelta > 0) narrative = 'Ett år av tydlig progression. Vi har skakat av oss stigmat.'
                else if (posDelta >= 2) narrative = 'Vi står stabilare. Ekonomin följer inte alltid tabellen — men det är inte en överraskning.'
                else if (posDelta <= -2) narrative = 'Ett tungt år i tabellen. Vi har försökt behålla strukturen. Det syns i kontraktens längd, inte i poängen.'
                else if (Math.abs(posDelta) <= 1) narrative = 'Stillastående. Det är varken misslyckande eller framgång. Det är en position att bygga från.'
                return (
                  <p style={{ fontSize: 11, fontStyle: 'italic', marginTop: 8, lineHeight: 1.5, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                    {narrative}
                  </p>
                )
              })()}
            </div>
          </div>
        )}

        {/* ── UNGDOMSINTAG ── */}
        {youthCount > 0 && (
          <div className="card-sharp" style={{ padding: '10px 14px' }}>
            <p style={{ ...LABEL, marginBottom: 6 }}>UNGDOMSINTAG</p>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: '0 0 2px', fontFamily: 'var(--font-body)' }}>
              🌱 <strong>{youthCount}</strong> nya spelare från akademin
            </p>
            {topProspect && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-body)' }}>
                Mest lovande: <strong style={{ color: 'var(--accent)' }}>
                  {topProspect.firstName} {topProspect.lastName}
                </strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                  {positionShort(topProspect.position)} · potential {Math.round(topProspect.potentialAbility)}
                </span>
              </p>
            )}
          </div>
        )}

        {/* ── TRUPPEN ── */}
        <div className="card-sharp" style={{ padding: '10px 14px' }}>
          <p style={{ ...LABEL, marginBottom: 6 }}>TRUPPEN</p>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-body)' }}>
            <strong>{managedPlayers.length}</strong> spelare
            <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>·</span>
            Snittstyrka: <strong style={{ color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>{avgCA}</strong>
          </p>
        </div>

        {/* ── EKONOMI ── */}
        <div className="card-sharp" style={{ padding: '10px 14px' }}>
          <p style={{ ...LABEL, marginBottom: 6 }}>EKONOMI</p>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-body)' }}>
            Klubbkassa: <strong style={{ fontFamily: 'var(--font-display)' }}>{formatFinanceAbs(club.finances)}</strong>
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0', fontFamily: 'var(--font-body)' }}>
            Transferbudget: {formatFinanceAbs(club.transferBudget ?? 0)}
          </p>
        </div>

        {/* ── KONTRAKTSSITUATION ── */}
        {expiringPlayers.length > 0 && (
          <div className="card-sharp" style={{ padding: '10px 14px' }}>
            <p style={{ ...LABEL, marginBottom: 6, color: expiringPlayers.length > 3 ? 'var(--danger)' : 'var(--text-muted)' }}>
              KONTRAKTSSITUATION
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-body)' }}>
              <strong>{expiringPlayers.length}</strong> spelare med utgående kontrakt
            </p>
            {expiringPlayers.length > 3 && (
              <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4, fontFamily: 'var(--font-body)' }}>
                ⚠️ Flera viktiga beslut att ta
              </p>
            )}
          </div>
        )}

        {/* ── STYRELSENS FÖRVÄNTNING ── */}
        <div className="card-sharp" style={{ padding: '10px 14px' }}>
          <p style={{ ...LABEL, marginBottom: 6, color: 'var(--accent)' }}>STYRELSENS FÖRVÄNTNING</p>
          <p style={{ fontSize: 14, color: 'var(--text-primary)', fontStyle: 'italic', margin: 0, fontFamily: 'var(--font-body)' }}>
            "{expectationText(club.boardExpectation)}"
          </p>
        </div>

        {/* ── KLUBBENS ERA ── */}
        {(() => {
          const era = game.currentEra ?? calculateClubEra(game)
          const arc = game.trainerArc
          const seasonLabel = seasonOrdinal(arc?.seasonCount ?? 0)
          const eraShiftMoment = (game.recentMoments ?? []).find(
            m => m.source === 'era_shift' && m.season === game.currentSeason,
          )
          const prevEraLabel = eraShiftMoment
            ? (['survival', 'establishment', 'legacy'] as const)
                .filter(e => e !== era)
                .map(e => eraLabel(e))
                .find(l => eraShiftMoment.title.toLowerCase().includes(l.toLowerCase()))
              ?? '—'
            : null

          if (eraShiftMoment) {
            const expectationByEra: Record<typeof era, string> = {
              survival: 'Håll laget sammanhållet. En placering som inte tvingar krisåtgärder.',
              fotfaste: 'Befäst platsen i topp 6. Visa att förra säsongen inte var en slump.',
              establishment: 'Topp 8, bygga akademin, utveckla en egen stjärna.',
              legacy: 'Titeln är förväntningen. Inget annat räcker.',
            }
            return (
              <div className="card-sharp" style={{ padding: '14px 14px', border: '1px solid var(--accent)' }}>
                <p style={{ ...LABEL, color: 'var(--accent)', marginBottom: 8 }}>
                  ERA-ÖVERGÅNG
                </p>
                <p style={{
                  fontSize: 20, fontWeight: 400, margin: '0 0 2px',
                  color: 'var(--text-primary)', fontFamily: 'var(--font-display)', lineHeight: 1.1,
                }}>
                  {eraFullLabel(era)}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px', fontFamily: 'var(--font-body)' }}>
                  tidigare: {prevEraLabel ?? '—'} · {seasonLabel} säsongen som chef
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0, fontStyle: 'italic', fontFamily: 'var(--font-body)' }}>
                  {eraShiftMoment.body}
                </p>
                <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--bg-elevated)', borderLeft: '3px solid var(--accent)' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-body)' }}>
                    <strong>Styrelsens förväntningar skärps:</strong> {expectationByEra[era]}
                  </p>
                </div>
              </div>
            )
          }

          return (
            <div className="card-sharp" style={{ padding: '10px 14px' }}>
              <p style={{ ...LABEL, marginBottom: 6 }}>KLUBBENS ERA</p>
              <p style={{
                fontSize: 16, fontWeight: 400, color: 'var(--text-primary)',
                margin: '0 0 2px', fontFamily: 'var(--font-display)', lineHeight: 1.2,
              }}>
                {eraFullLabel(era)}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px', fontFamily: 'var(--font-body)' }}>
                {seasonLabel} säsongen som chef
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
                {eraDescription(era)}
              </p>
            </div>
          )
        })()}

        {/* ── BUDGETPRIORITET ── */}
        <div className="card-sharp" style={{ padding: '10px 14px' }}>
          <p style={{ ...LABEL, marginBottom: 6 }}>BUDGETPRIORITET</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px', fontFamily: 'var(--font-body)' }}>
            {priority === 'squad'
              ? 'Transferbudget +20% — satsning på rekrytering'
              : priority === 'youth'
              ? 'Transferbudget −30% — ungdomskvalitet +3p per säsong'
              : 'Balanserad fördelning — inga bonusar'}
          </p>
          <div style={{ display: 'flex', gap: 6, background: 'var(--bg)', borderRadius: 8, padding: 3 }}>
            {([
              { val: 'squad', label: '🏒 Trupp' },
              { val: 'balanced', label: '⚖️ Balans' },
              { val: 'youth', label: '🌱 Ungdom' },
            ] as const).map(opt => (
              <button
                key={opt.val}
                onClick={() => setPriority(opt.val)}
                style={{
                  flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 700,
                  background: priority === opt.val ? 'rgba(196,122,58,0.2)' : 'transparent',
                  border: priority === opt.val ? '1px solid rgba(196,122,58,0.4)' : '1px solid transparent',
                  borderRadius: 6,
                  color: priority === opt.val ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                }}
              >{opt.label}</button>
            ))}
          </div>
        </div>

        {/* ── LAGKAPTEN ── */}
        <div className="card-sharp" style={{ padding: '10px 14px' }}>
          <p style={{ ...LABEL, marginBottom: 6 }}>LAGKAPTEN</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {captainCandidates.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedCaptain(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '7px 10px', borderRadius: 4,
                  background: selectedCaptain === p.id ? 'rgba(196,122,58,0.12)' : 'var(--bg-elevated)',
                  border: `1px solid ${selectedCaptain === p.id ? 'rgba(196,122,58,0.4)' : 'var(--border)'}`,
                  color: selectedCaptain === p.id ? 'var(--accent)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 12,
                  fontWeight: selectedCaptain === p.id ? 700 : 400,
                  fontFamily: 'var(--font-body)',
                }}
              >
                <span>{p.firstName} {p.lastName}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                  {positionShort(p.position)} · {Math.round(p.currentAbility)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Start button ── */}
        <button
          onClick={handleStart}
          className="btn btn-primary btn-cta"
          style={{ marginTop: 8 }}
        >
          Starta säsongen →
        </button>
      </div>
    </div>
  )
}
