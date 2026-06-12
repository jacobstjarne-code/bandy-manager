/**
 * StillnessSection — NU-flikens stiltje-lager (C-N1).
 * Fem lager som gör att skärmen aldrig blir tom utan att skrika.
 * Visas alltid; receded=true tonar ned dem när något brinner överst.
 *
 * Per docs/mockups/2026-05-23_design_nu_stiltje.html + copypool_nustiltje.md.
 * Designval: stämningskurva alltid synlig, heritage bara exakta jubileum,
 * mikrohändelser enbart narrativa (inga mood-effekter).
 */

import type { SaveGame } from '../../../domain/entities/SaveGame'
import { pickStillnessBeat, pickStillnessMicro, computeTeamPulse, buildStillnessContext } from '../../../domain/services/stillnessService'
import { findActiveAnniversaries } from '../../../domain/services/clubMemoryService'
import { getNextManagedFixture } from '../../../domain/services/portal/triggers/matchTriggers'
import { Sparkline } from '../primitives/Sparkline'
import { seasonTrendStroke } from '../../utils/formatters'
import { TrainingType } from '../../../domain/enums'

const TRAINING_LABEL: Record<string, string> = {
  [TrainingType.Skating]: 'Skridskoteknik',
  [TrainingType.BallControl]: 'Bollkontroll',
  [TrainingType.Passing]: 'Passningsspel',
  [TrainingType.Shooting]: 'Avslut',
  [TrainingType.Defending]: 'Försvarsspel',
  [TrainingType.CornerPlay]: 'Hörnor',
  [TrainingType.Physical]: 'Fysik',
  [TrainingType.Tactical]: 'Taktik',
  [TrainingType.Recovery]: 'Återhämtning',
  [TrainingType.MatchPrep]: 'Matchförberedelse',
}

const DAY_NAMES = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

interface Props {
  game: SaveGame
  /** true = något brinner överst; lagren stannar men tonas ned. */
  receded?: boolean
}

export function StillnessSection({ game, receded = false }: Props) {
  const stillnessCtx = buildStillnessContext(game)  // beräkna en gång, dela mellan pickers (undviker dubbla getFormResults)
  const beat = pickStillnessBeat(game, stillnessCtx)
  const micros = pickStillnessMicro(game, 2, stillnessCtx)
  const pulse = computeTeamPulse(game)
  const anniversaries = findActiveAnniversaries(game)
  const heritage = anniversaries.find(a => Number.isInteger(a.yearsAgo) && a.yearsAgo >= 1) ?? null

  const latestTraining = (game.trainingHistory ?? []).slice(-1)[0]
  const trainingLabel = latestTraining ? TRAINING_LABEL[latestTraining.focus.type] ?? 'Träning' : null
  const nextFixture = getNextManagedFixture(game)
  const nextOpp = nextFixture
    ? game.clubs.find(c => c.id === (nextFixture.homeClubId === game.managedClubId ? nextFixture.awayClubId : nextFixture.homeClubId))
    : null
  const nextIsHome = nextFixture?.homeClubId === game.managedClubId

  // Veckans rytm — 7-dagars-strip grundad på faktiska datum (currentDate + fixture.date)
  const today = new Date(game.currentDate)
  const dow = (today.getDay() + 6) % 7 // 0=Mån
  const monday = new Date(today); monday.setDate(today.getDate() - dow)
  const matchDate = nextFixture?.date ? new Date(nextFixture.date) : null
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    return {
      label: DAY_NAMES[i],
      isToday: iso === game.currentDate.slice(0, 10),
      isMatch: matchDate ? iso === nextFixture!.date!.slice(0, 10) : false,
    }
  })

  const containerOpacity = receded ? 0.62 : 1
  const pulseStroke = seasonTrendStroke(pulse, { neutral: 'cold' })

  return (
    <div style={{ opacity: containerOpacity, transition: 'opacity 0.3s ease' }}>
      {/* Lager 1 — Stillness-beat */}
      <div style={{
        borderLeft: '2px solid var(--cold-light)',
        padding: '8px 12px', marginBottom: 12,
        fontFamily: 'Georgia, serif', fontStyle: 'italic',
        fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
      }}>
        {beat.body}
      </div>

      {/* Lager 2 — Veckans rytm */}
      <div className="card-sharp" style={{ padding: '12px 14px', marginBottom: 12 }}>
        <div className="h-label" style={{ marginBottom: 8 }}>📅 VECKANS RYTM</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: trainingLabel || nextOpp ? 10 : 0 }}>
          {weekDays.map((d, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', padding: '4px 0', borderRadius: 4,
              background: d.isMatch ? 'var(--accent)' : d.isToday ? 'var(--bg-elevated)' : 'transparent',
              border: d.isToday && !d.isMatch ? '1px solid var(--border)' : '1px solid transparent',
            }}>
              <div style={{ fontSize: 8, letterSpacing: '0.5px', color: d.isMatch ? 'var(--text-light)' : 'var(--text-muted)' }}>{d.label}</div>
              <div style={{ fontSize: 11, marginTop: 2, color: d.isMatch ? 'var(--text-light)' : d.isToday ? 'var(--accent)' : 'var(--text-muted)' }}>
                {d.isMatch ? '⛸️' : d.isToday ? '●' : '·'}
              </div>
            </div>
          ))}
        </div>
        {trainingLabel && (
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: nextOpp ? 4 : 0 }}>
            Träningsfokus: <strong style={{ color: 'var(--text-primary)' }}>{trainingLabel}</strong>
          </div>
        )}
        {nextOpp && (
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            Nästa: <strong style={{ color: 'var(--text-primary)' }}>{nextIsHome ? '' : 'borta mot '}{nextOpp.shortName ?? nextOpp.name}</strong>{nextIsHome ? ' (hemma)' : ''}
          </div>
        )}
      </div>

      {/* Lager 3 — Stämningskurva (alltid) */}
      {pulse.length >= 2 && (
        <div className="card-sharp" style={{ padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <div className="h-label">📈 STÄMNINGSKURVA</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              {Math.round(pulse[pulse.length - 1])}
            </span>
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 6 }}>
            Senaste {pulse.length} omgångar
          </div>
          <Sparkline points={pulse} stroke={pulseStroke} height={28} minPoints={2} />
        </div>
      )}

      {/* Lager 5 — Heritage-rad (exakta jubileum) */}
      {heritage && (
        <div style={{
          padding: '8px 12px', marginBottom: 12,
          borderLeft: '2px solid var(--gold)',
          background: 'rgba(232,185,92,0.05)', borderRadius: '0 6px 6px 0',
        }}>
          <div style={{ fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: 3 }}>
            ⬩ På dagen {heritage.yearsAgo} år sedan
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, fontStyle: 'italic' }}>
            {heritage.originalEventText}
          </div>
        </div>
      )}

      {/* Lager 4 — Mikrohändelser */}
      {micros.length > 0 && (
        <div className="card-sharp" style={{ padding: '12px 14px', marginBottom: 12 }}>
          <div className="h-label" style={{ marginBottom: 8 }}>🌾 RUNT OMKRING</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {micros.map((m, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {m.icon ? `${m.icon} ` : ''}{m.body}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
