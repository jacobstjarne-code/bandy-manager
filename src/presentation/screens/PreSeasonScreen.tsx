import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { ClubExpectation, PlayerPosition } from '../../domain/enums'
import { positionShort, formatFinanceAbs } from '../utils/formatters'

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
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
      overflowY: 'auto',
    }}>
      <div style={{
        width: '100%', maxWidth: 390,
        display: 'flex', flexDirection: 'column', gap: 8,
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '2px',
            textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6,
          }}>
            FÖRSÄSONG
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>
            Säsong {game.currentSeason}/{game.currentSeason + 1}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{club.name}</p>
        </div>

        {/* State of the Club */}
        {snap && snap.season === game.currentSeason - 1 && (
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '10px 14px',
          }}>
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
              📊 LÄGET I KLUBBEN
            </p>
            {[
              {
                label: 'Tabellplats',
                prev: `${snap.finalPosition}:a`,
                curr: `${currPosition}:a`,
                delta: currPosition - snap.finalPosition,
                invert: true,
              },
              {
                label: 'Klubbkassa',
                prev: formatFinanceAbs(snap.finances),
                curr: formatFinanceAbs(club.finances),
                delta: club.finances - snap.finances,
              },
              {
                label: 'Orten',
                prev: `${snap.communityStanding}`,
                curr: `${currCS}`,
                delta: currCS - snap.communityStanding,
              },
              {
                label: 'Klacken',
                prev: `${snap.supporterMembers} medl.`,
                curr: `${currMembers} medl.`,
                delta: currMembers - snap.supporterMembers,
              },
            ].map(row => {
              const up = row.invert ? row.delta < 0 : row.delta > 0
              const down = row.invert ? row.delta > 0 : row.delta < 0
              const arrow = up ? '↑' : down ? '↓' : '→'
              const arrowColor = up ? 'var(--success)' : down ? 'var(--danger)' : 'var(--text-muted)'
              return (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {row.prev} → <strong style={{ color: 'var(--text-primary)' }}>{row.curr}</strong>
                    {' '}<span style={{ color: arrowColor, fontWeight: 700 }}>{arrow}</span>
                  </span>
                </div>
              )
            })}
            {snap.academyPromotions > 0 && (
              <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>
                🌱 {snap.academyPromotions} uppflyttad{snap.academyPromotions > 1 ? 'e' : ''} från akademin
              </p>
            )}
          </div>
        )}

        {/* Ungdomsintag */}
        {youthCount > 0 && (
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '10px 14px',
          }}>
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--success)', marginBottom: 8 }}>
              🌱 Ungdomsintag
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
              {youthCount} nya spelare från akademin!
            </p>
            {topProspect && (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Mest lovande: <strong style={{ color: 'var(--accent)' }}>
                  {topProspect.firstName} {topProspect.lastName}
                </strong>{' '}
                ({positionShort(topProspect.position)}, potential {Math.round(topProspect.potentialAbility)})
              </p>
            )}
          </div>
        )}

        {/* Truppen */}
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '10px 14px',
        }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            📋 Truppen
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>
            {managedPlayers.length} spelare · Snittstyrka: <strong style={{ color: 'var(--accent)' }}>{avgCA}</strong>
          </p>
        </div>

        {/* Ekonomi */}
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '10px 14px',
        }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            💰 Ekonomi
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>
            Klubbkassa: <strong>{formatFinanceAbs(club.finances)}</strong>
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            Transferbudget: {formatFinanceAbs(club.transferBudget ?? 0)}
          </p>
        </div>

        {/* Kontraktssituation */}
        {expiringPlayers.length > 0 && (
          <div style={{
            background: expiringPlayers.length > 3
              ? 'rgba(176,80,64,0.06)' : 'var(--bg-elevated)',
            border: expiringPlayers.length > 3
              ? '1px solid rgba(176,80,64,0.3)' : '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '10px 14px',
          }}>
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: expiringPlayers.length > 3 ? 'var(--danger)' : 'var(--text-muted)', marginBottom: 8 }}>
              📋 Kontraktssituation
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-primary)' }}>
              {expiringPlayers.length} spelare med utgående kontrakt
            </p>
            {expiringPlayers.length > 3 && (
              <p style={{ fontSize: 13, color: 'var(--danger)', marginTop: 4 }}>
                ⚠️ Flera viktiga beslut att ta!
              </p>
            )}
          </div>
        )}

        {/* Styrelsens förväntning */}
        <div style={{
          background: 'rgba(196,122,58,0.06)',
          border: '1px solid rgba(196,122,58,0.2)',
          borderRadius: 'var(--radius)', padding: '10px 14px',
        }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
            🔮 Styrelsens förväntning
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-primary)', fontStyle: 'italic' }}>
            "{expectationText(club.boardExpectation)}"
          </p>
        </div>

        {/* Budget priority */}
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '10px 14px',
        }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            💼 Budgetprioritet
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
            {priority === 'squad'
              ? 'Transferbudget +20% — satsning på rekrytering'
              : priority === 'youth'
              ? 'Transferbudget –30% — ungdomskvalitet +3p per säsong'
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
                  cursor: 'pointer',
                }}
              >{opt.label}</button>
            ))}
          </div>
        </div>

        {/* Kapten */}
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '10px 14px',
        }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
            © LAGKAPTEN
          </p>
          {captainCandidates.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedCaptain(p.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '7px 8px', marginBottom: 4, borderRadius: 6,
                background: selectedCaptain === p.id ? 'rgba(196,122,58,0.12)' : 'transparent',
                border: `1px solid ${selectedCaptain === p.id ? 'rgba(196,122,58,0.4)' : 'var(--border)'}`,
                color: selectedCaptain === p.id ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 12, fontWeight: selectedCaptain === p.id ? 700 : 400,
              }}
            >
              <span>{p.firstName} {p.lastName}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{positionShort(p.position)} · {Math.round(p.currentAbility)}</span>
            </button>
          ))}
        </div>

        {/* Start */}
        <button
          onClick={handleStart}
          style={{
            marginTop: 8,
            padding: '16px',
            background: 'var(--accent)',
            border: 'none',
            borderRadius: 12,
            color: 'var(--text-light)',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: '0.5px',
          }}
        >
          Starta säsongen →
        </button>
      </div>
    </div>
  )
}
