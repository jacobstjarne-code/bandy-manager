import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { ClubExpectation } from '../../domain/enums'

function expectationText(e: ClubExpectation): string {
  switch (e) {
    case ClubExpectation.AvoidBottom: return 'Undvik nedflyttning'
    case ClubExpectation.MidTable: return 'Håll mittentabellen'
    case ClubExpectation.ChallengeTop: return 'Utmana toppen'
    case ClubExpectation.WinLeague: return 'Vinn ligan'
  }
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} mkr`
  if (n >= 1_000) return `${Math.round(n / 1_000)} tkr`
  return `${n} kr`
}

export function PreSeasonScreen() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const clearPreSeason = useGameStore(s => s.clearPreSeason)
  const setBudgetPriority = useGameStore(s => s.setBudgetPriority)

  const [priority, setPriority] = useState<'squad' | 'balanced' | 'youth'>(
    game?.budgetPriority ?? 'balanced'
  )

  if (!game) { navigate('/game', { replace: true }); return null }

  const club = game.clubs.find(c => c.id === game.managedClubId)
  if (!club) { navigate('/game', { replace: true }); return null }

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

  function handleStart() {
    setBudgetPriority(priority)
    clearPreSeason()
    navigate('/game', { replace: true })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(6,14,25,0.97)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px', zIndex: 500,
      overflowY: 'auto',
    }}>
      <div style={{
        width: '100%', maxWidth: 390,
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '2px',
            textTransform: 'uppercase', color: '#C9A84C', marginBottom: 6,
          }}>
            FÖRSÄSONG
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F0F4F8' }}>
            Säsong {game.currentSeason}
          </h1>
          <p style={{ fontSize: 14, color: '#8A9BB0', marginTop: 4 }}>{club.name}</p>
        </div>

        {/* Ungdomsintag */}
        {youthCount > 0 && (
          <div style={{
            background: '#0e1f33', border: '1px solid #1e3450',
            borderRadius: 12, padding: '14px 16px',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#22c55e', marginBottom: 8 }}>
              🌱 Ungdomsintag
            </p>
            <p style={{ fontSize: 14, color: '#F0F4F8', marginBottom: 4 }}>
              {youthCount} nya spelare från akademin!
            </p>
            {topProspect && (
              <p style={{ fontSize: 13, color: '#8A9BB0' }}>
                Mest lovande: <strong style={{ color: '#C9A84C' }}>
                  {topProspect.firstName} {topProspect.lastName}
                </strong>{' '}
                ({topProspect.position}, potential {Math.round(topProspect.potentialAbility)})
              </p>
            )}
          </div>
        )}

        {/* Truppen */}
        <div style={{
          background: '#0e1f33', border: '1px solid #1e3450',
          borderRadius: 12, padding: '14px 16px',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#4A6080', marginBottom: 8 }}>
            📋 Truppen
          </p>
          <p style={{ fontSize: 14, color: '#F0F4F8' }}>
            {managedPlayers.length} spelare · Snitt-styrka: <strong style={{ color: '#C9A84C' }}>{avgCA}</strong>
          </p>
        </div>

        {/* Ekonomi */}
        <div style={{
          background: '#0e1f33', border: '1px solid #1e3450',
          borderRadius: 12, padding: '14px 16px',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#4A6080', marginBottom: 8 }}>
            💰 Ekonomi
          </p>
          <p style={{ fontSize: 14, color: '#F0F4F8' }}>
            Klubbkassa: <strong>{formatCurrency(club.finances)}</strong>
          </p>
          <p style={{ fontSize: 13, color: '#8A9BB0', marginTop: 2 }}>
            Transferbudget: {formatCurrency(club.transferBudget ?? 0)}
          </p>
        </div>

        {/* Kontraktssituation */}
        {expiringPlayers.length > 0 && (
          <div style={{
            background: expiringPlayers.length > 3
              ? 'rgba(239,68,68,0.06)' : '#0e1f33',
            border: expiringPlayers.length > 3
              ? '1px solid rgba(239,68,68,0.3)' : '1px solid #1e3450',
            borderRadius: 12, padding: '14px 16px',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: expiringPlayers.length > 3 ? '#ef4444' : '#4A6080', marginBottom: 8 }}>
              📋 Kontraktssituation
            </p>
            <p style={{ fontSize: 14, color: '#F0F4F8' }}>
              {expiringPlayers.length} spelare med utgående kontrakt
            </p>
            {expiringPlayers.length > 3 && (
              <p style={{ fontSize: 13, color: '#ef4444', marginTop: 4 }}>
                ⚠️ Flera viktiga beslut att ta!
              </p>
            )}
          </div>
        )}

        {/* Styrelsens förväntning */}
        <div style={{
          background: 'rgba(201,168,76,0.06)',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: 12, padding: '14px 16px',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#C9A84C', marginBottom: 8 }}>
            🔮 Styrelsens förväntning
          </p>
          <p style={{ fontSize: 14, color: '#F0F4F8', fontStyle: 'italic' }}>
            "{expectationText(club.boardExpectation)}"
          </p>
        </div>

        {/* Budget priority */}
        <div style={{
          background: '#0e1f33', border: '1px solid #1e3450',
          borderRadius: 12, padding: '14px 16px',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#4A6080', marginBottom: 6 }}>
            💼 Budgetprioritet
          </p>
          <p style={{ fontSize: 12, color: '#4A6080', marginBottom: 10 }}>
            {priority === 'squad'
              ? 'Transferbudget +20% — satsning på rekrytering'
              : priority === 'youth'
              ? 'Transferbudget –30% — ungdomskvalitet +3p per säsong'
              : 'Balanserad fördelning — inga bonusar'}
          </p>
          <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3 }}>
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
                  background: priority === opt.val ? 'rgba(201,168,76,0.2)' : 'transparent',
                  border: priority === opt.val ? '1px solid rgba(201,168,76,0.4)' : '1px solid transparent',
                  borderRadius: 6,
                  color: priority === opt.val ? '#C9A84C' : '#4A6080',
                  cursor: 'pointer',
                }}
              >{opt.label}</button>
            ))}
          </div>
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
            color: '#fff',
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
