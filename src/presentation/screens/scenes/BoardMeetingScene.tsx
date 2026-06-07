/**
 * BoardMeetingScene — styrelsemötet inför säsong 2+.
 * Säsong 1 hanteras av ArrivalScene (denna scen triggas bara säsong 2+, matchday 0).
 *
 * Layout per docs/mockups/2026-05-30_design_boardmeeting_s2plus.html.
 * A/B/C-tillstånd resolveras från föregående säsongs måluppfyllelse.
 * Pixel-värden från mocken. Justera inte.
 */

import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { BoardObjective } from '../../../domain/entities/Community'
import { resolveBoardMeetingState } from '../../../application/services/boardMeetingStateResolver'
import { BOARD_MEETING_COPY, GOAL_MOTIVATIONS, pickFromPool } from '../../../domain/data/boardMeetingCopy'
import { SceneCTA } from './shared/SceneCTA'

interface Props {
  game: SaveGame
  onComplete: () => void
}

const GENRE_COLOR = { A: 'var(--accent)', B: 'var(--gold)', C: 'var(--cold-light)' } as const

const TYPE_ICON: Record<string, string> = {
  sporting: '📊', academy: '🎓', economic: '💰', community: '🏠', identity: '🏒',
}

function isStretch(obj: BoardObjective): boolean {
  return obj.type === 'sporting' && /guld|sm-?final|\bsm\b|cup|final/i.test(`${obj.label} ${obj.description}`)
}

export function BoardMeetingScene({ game, onComplete }: Props) {
  const data = resolveBoardMeetingState(game)
  const { state } = data
  const pool = BOARD_MEETING_COPY[state]
  const seed = game.currentSeason * 9301 + game.managedClubId.length * 7

  const setting = pickFromPool(pool.settings, seed)
  const title = pickFromPool(pool.titles, seed + 1)
  const speakerLine = pickFromPool(pool.speakerLines, seed + 2)

  const goalMotivation = (obj: BoardObjective, i: number): string => {
    const key = `${state}:${obj.type}`
    const motivs = GOAL_MOTIVATIONS[key]
    if (motivs && motivs.length > 0) return pickFromPool(motivs, seed + 3 + i)
    return obj.description
  }

  const evalStripe = state === 'B' ? 'var(--success)' : state === 'C' ? 'var(--danger)' : 'var(--cold)'
  const finValColor = state === 'B' ? 'var(--success)' : state === 'C' ? 'var(--danger)' : 'var(--text-light)'

  const fmtTkr = (v: number) => `${Math.round(v / 1000)} tkr`
  const delta = data.finance.financesDelta
  const deltaText = delta === null ? null
    : delta > 0 ? `▲ +${fmtTkr(delta)}`
    : delta < 0 ? `▼ ${fmtTkr(delta)}`
    : 'Oförändrad'

  return (
    <div style={{
      background: 'var(--bg-portal)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '30px 22px 28px',
      animation: 'fadeIn 300ms ease both',
    }}>
      {/* Genre */}
      <div style={{
        fontSize: 9, letterSpacing: '4px', textTransform: 'uppercase',
        textAlign: 'center', color: GENRE_COLOR[state],
        opacity: state === 'A' ? 0.7 : 0.85, marginBottom: 14,
      }}>
        ⬩ Styrelsemöte ⬩
      </div>

      {/* Setting — rumsprolog (R2-1: 12.5→13 via .h-scene-setting) */}
      <div className="h-scene-setting" style={{ marginBottom: 20 }}>
        {setting}
      </div>

      {/* Title (R2-1: 23→28 via .h-scene-title) */}
      <div className="h-scene-title" style={{ marginBottom: 18 }}>
        {title}
      </div>

      {/* Speaker */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 9, textTransform: 'uppercase', letterSpacing: '2px',
          color: 'var(--text-muted)', marginBottom: 5,
        }}>
          {data.chairmanName} · {data.chairmanRole}
        </div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 14.5, color: 'var(--text-light)', lineHeight: 1.55 }}>
          {speakerLine}
        </div>
      </div>

      {/* Eval — måluppfyllelse förra säsongen */}
      {data.evalRows.length > 0 && (
        <div style={{
          background: 'var(--bg-portal-surface)', borderRadius: 8,
          padding: '13px 14px', marginBottom: 14,
          borderLeft: `2px solid ${evalStripe}`,
        }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', marginBottom: 8 }}>
            Förra säsongen · måluppfyllelse
          </div>
          {data.evalRows.map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: i < data.evalRows.length - 1 ? 6 : 0 }}>
              <span style={{ fontSize: 12, color: 'var(--text-light-secondary)' }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: row.met ? 'var(--success)' : 'var(--danger)' }}>
                {row.met ? '✓' : '✕'}
              </span>
            </div>
          ))}
          {data.hiddenEvalCount > 0 && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
              +{data.hiddenEvalCount} övriga
            </div>
          )}
        </div>
      )}

      {/* Fin — kassa + budget */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div style={{ background: 'var(--bg-portal-surface)', borderRadius: 8, padding: '11px 13px' }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 4 }}>Kassa</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: finValColor }}>{fmtTkr(data.finance.finances)}</div>
          {deltaText && (
            <div style={{ fontSize: 10, color: delta && delta > 0 ? 'var(--success)' : delta && delta < 0 ? 'var(--danger)' : 'var(--text-muted)', marginTop: 2 }}>
              {deltaText}
            </div>
          )}
        </div>
        <div style={{ background: 'var(--bg-portal-surface)', borderRadius: 8, padding: '11px 13px' }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 4 }}>Transferbudget</div>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-light)' }}>{fmtTkr(data.finance.transferBudget)}</div>
        </div>
      </div>

      {/* Goals — nya mål */}
      {data.newGoals.length > 0 && (
        <div style={{ marginBottom: 'auto' }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-muted)', marginBottom: 8 }}>
            📋 Mål för säsong {game.currentSeason}
          </div>
          {data.newGoals.map((obj, i) => {
            const stretch = isStretch(obj)
            return (
              <div key={obj.id} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                background: 'var(--bg-portal-surface)', borderRadius: 8,
                padding: '9px 12px', marginBottom: 6,
                borderLeft: `2px solid ${stretch ? 'var(--gold)' : 'var(--border-dark)'}`,
              }}>
                <span style={{ fontSize: 15, lineHeight: 1.3, flexShrink: 0 }}>{TYPE_ICON[obj.type] ?? '📋'}</span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: stretch ? 'var(--gold)' : 'var(--text-light)' }}>{obj.label}</span>
                  <span style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text-muted)', lineHeight: 1.4 }}>{goalMotivation(obj, i)}</span>
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* CTA — gold ENDAST vid B */}
      <div style={{ marginTop: 16 }}>
        <SceneCTA
          label={`Till säsong ${game.currentSeason} →`}
          onClick={onComplete}
          variant={state === 'B' ? 'gold' : 'default'}
        />
      </div>
    </div>
  )
}
