import { useState, useEffect } from 'react'
import type { Club, Tactic } from '../../../domain/entities/Club'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { PlayerPosition } from '../../../domain/enums'
import { positionShort, positionLong } from '../../utils/formatters'
import { generateBasicAnalysis } from '../../../domain/services/opponentAnalysisService'
import { FATIGUE_AVAILABILITY_FLOOR } from '../../../domain/services/squadEvaluator'
import { getConditionLabel, getWeatherEmoji } from '../../../domain/services/weatherService'
import { FORMATIONS, getRecommendedFormation, type FormationType } from '../../../domain/entities/Formation'
import { LineupFormationView } from './LineupFormationView'
import { Settings, AlertTriangle } from 'lucide-react'
import { Icon } from '../primitives/Icon'
import { PitchLineupView, getPositionFit } from './PitchLineupView'
import { OpponentAnalysisCard } from './OpponentAnalysisCard'
import { CoachFraming } from '../CoachFraming'

interface GroupedPlayers {
  position: string
  players: Player[]
}

interface LineupStepProps {
  /** Tillträdet, Uppgift 2/4 "Sätt elvan" — samma mönster som CornerInteractions
   * practice-flagga. Autofyller + låser formationen till rekommenderad, döljer
   * Lista/Plan-vyväxlaren, och avslöjar färgnyckel/spotlight/CTA i fyra beats.
   * Matchdags-editorn (denna prop = false/utelämnad) är HELT oförändrad. */
  practice?: boolean
  /** T5a (SF-2, CODE_INSTRUKTION_SIDFOT_INTRORAM 2026-07-13/14): beat-index
   *  (0-3) ägs av Tillträdet, inte denna komponent — Tillträdet dockar sin
   *  egen sidfotsmall-knapp och styr progressionen, så knappen sitter i
   *  samma dockade position som F1/F3/F4 istf inline i det scrollande kortet.
   *  Bara relevant när practice=true. */
  practiceBeat?: number
  opponent: Club | null
  nextFixture: Fixture | null
  game: SaveGame
  squadPlayers: Player[]
  groupedPlayers: GroupedPlayers[]
  startingIds: string[]
  benchIds: string[]
  captainId: string | null
  selectedSlotId: string | null
  tacticState: Tactic
  canPlay: boolean
  injuredInStarting: Player[]
  onTogglePlayer: (pid: string) => void
  onSetCaptain: (pid: string) => void
  onAutoFill: () => void
  onSlotClick: (slotId: string) => void
  onFormationChange: (newTactic: Tactic) => void
  onAssignPlayer: (playerId: string, slotId: string) => void
  onRemovePlayer: (playerId: string) => void
  onSwapPlayers: (fromSlotId: string, toSlotId: string) => void
  onError: (err: string) => void
  onNext: () => void
}

const GROUP_LABELS: Partial<Record<string, string>> = {
  [PlayerPosition.Goalkeeper]: 'Målvakter',
  [PlayerPosition.Defender]: 'Backar',
  [PlayerPosition.Half]: 'Ytterhalvar',
  [PlayerPosition.Midfielder]: 'Mittfältare',
  [PlayerPosition.Forward]: 'Anfallare',
}

/** Mock: docs/incoming (Downloads) "Intro - Sätt elvan, omgjord sekvens" —
 * fyra beats, coach-citat verbatim ur mocken utom beat 2 (interpolerat med
 * riktig spelare/position istf mockens fiktiva "Holm"-exempel). */
const PRACTICE_COACH_QUOTES = [
  '”Här är truppen. Elva på isen, redan uppställda — du börjar inte från tomt.”',
  '”Färgen säger om spelaren passar sin plats. Grönt är rätt, gult går an, rött skaver.”',
  null, // beat 2 — interpoleras, se practiceSpotlightQuote()
  '”Det var allt. Formen sköter jag; den ändrar du själv senare. Kör. Efter i dag ställer du dem själv.”',
] as const

function practiceSpotlightQuote(player: Player, slotPosition: PlayerPosition): string {
  return `”Ser du ringen som inte är grön? ${player.lastName} är ${positionLong(player.position).toLowerCase()} men står ${positionLong(slotPosition).toLowerCase()}. Tryck ringen om du vill byta — annars låter vi den stå.”`
}

const SPARKLE_SVG = (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor">
    <path d="M6 1.5 L7 4 L9.5 5 L7 6 L6 8.5 L5 6 L2.5 5 L5 4 Z"/>
    <path d="M9.5 8.5 L10 9.5 L11 10 L10 10.5 L9.5 11.5 L9 10.5 L8 10 L9 9.5 Z"/>
  </svg>
)

export function LineupStep({
  practice = false,
  practiceBeat = 0,
  opponent,
  nextFixture,
  game,
  squadPlayers,
  groupedPlayers,
  startingIds,
  benchIds: _benchIds,
  captainId: _captainId,
  selectedSlotId,
  tacticState,
  canPlay,
  injuredInStarting,
  onTogglePlayer,
  onSetCaptain: _onSetCaptain,
  onAutoFill,
  onSlotClick,
  onFormationChange,
  onAssignPlayer,
  onRemovePlayer,
  onSwapPlayers,
  onError,
  onNext,
}: LineupStepProps) {
  const [viewMode, setViewMode] = useState<'list' | 'pitch'>(practice ? 'pitch' : 'list')
  const [justFilled, setJustFilled] = useState(false)

  // Auto-fill when switching to pitch view with no lineupSlots at all (defensive fallback).
  // IMPORTANT: Only triggers when lineupSlots is undefined or has zero keys.
  // If keys exist but values are null (FIX-50: injured players cleared), do NOT auto-fill —
  // those nulls are intentional empty slots waiting for the user to fill.
  useEffect(() => {
    if (viewMode !== 'pitch') return
    const slotsEmpty =
      !tacticState.lineupSlots ||
      Object.keys(tacticState.lineupSlots).length === 0
    if (slotsEmpty && startingIds.length === 11) {
      onAutoFill()
    }
  }, [viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Practice-läge (Tillträdet, Uppgift 2/4): lås formationen till den
  // rekommenderade — sekvensen bygger på det, sedan autofyll när prop:en når fram.
  const recommendedFormation = practice ? getRecommendedFormation(squadPlayers) : null
  useEffect(() => {
    if (!practice || !recommendedFormation) return
    if (tacticState.formation !== recommendedFormation) {
      onFormationChange({ ...tacticState, formation: recommendedFormation })
    }
  }, [practice]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!practice || !recommendedFormation) return
    if (tacticState.formation === recommendedFormation && startingIds.length < 11) {
      onAutoFill()
    }
  }, [practice, tacticState.formation]) // eslint-disable-line react-hooks/exhaustive-deps

  // Context-combined data
  const weather = nextFixture ? game.matchWeathers?.find(mw => mw.fixtureId === nextFixture.id)?.weather : null
  const weatherText = weather
    ? `${getWeatherEmoji(weather.condition)} ${getConditionLabel(weather.condition)} · ${weather.temperature}°C`
    : 'Okänt väder'

  const oppAnalysis = (opponent && nextFixture)
    ? generateBasicAnalysis(
        opponent,
        game.players.filter(p => opponent.squadPlayerIds.includes(p.id)),
        game.standings,
        game.fixtures,
        nextFixture.id,
      )
    : null

  const oppFormation = opponent?.activeTactic?.formation
  const oppFormText = oppAnalysis
    ? (oppFormation ? `${oppAnalysis.recentForm} · ${oppFormation}` : oppAnalysis.recentForm)
    : (oppFormation ?? '—')

  // Practice — beat 3 spotlight: första icke-gröna slotten (amber före röd).
  const practiceSpotlight = (() => {
    if (!practice || practiceBeat < 2) return null
    const formationType = (tacticState.formation ?? '3-3-4') as FormationType
    const template = FORMATIONS[formationType]
    const fits = template.slots.map(slot => {
      const pid = tacticState.lineupSlots?.[slot.id]
      const player = pid ? squadPlayers.find(p => p.id === pid) ?? null : null
      const fit = player ? getPositionFit(player.position, slot.position) : null
      return { slot, player, fit }
    })
    const target = fits.find(f => f.fit === 'amber') ?? fits.find(f => f.fit === 'red')
    return target?.player ? { slotId: target.slot.id, player: target.player, slotPosition: target.slot.position } : null
  })()

  const practiceCoach = game.assistantCoach
  const practiceCoachInitials = practiceCoach
    ? `${practiceCoach.name.split(' ')[0]?.[0] ?? ''}${practiceCoach.name.split(' ')[1]?.[0] ?? ''}`
    : ''
  const practiceQuote = practiceBeat === 2 && practiceSpotlight
    ? practiceSpotlightQuote(practiceSpotlight.player, practiceSpotlight.slotPosition)
    : (PRACTICE_COACH_QUOTES[practiceBeat] ?? PRACTICE_COACH_QUOTES[0])

  function handlePlayerClick(player: Player) {
    if (player.isInjured || player.suspensionGamesRemaining > 0 || (player.restGamesRemaining ?? 0) > 0) return
    if (selectedSlotId) {
      onAssignPlayer(player.id, selectedSlotId)
    } else {
      onTogglePlayer(player.id)
    }
  }

  return (
    <>
      {/* 0. Practice — coach-quote, beat-baserad (ersätter TilltradeScreens statiska) */}
      {practice && (
        <CoachFraming initial={practiceCoachInitials} quote={practiceQuote} />
      )}

      {/* 1. Context — two-column strip */}
      {nextFixture && (
        <div style={{
          margin: '8px 14px',
          padding: '8px 12px',
          background: 'var(--bg-surface)',
          borderLeft: '2px solid var(--accent)',
          borderRadius: '0 8px 8px 0',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4px 12px',
          fontSize: 11,
        }}>
          <div>
            <div style={{ fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Matchdag</div>
            <div style={{ color: 'var(--text-primary)', fontSize: 11.5, marginTop: 2 }}>{weatherText}</div>
          </div>
          {opponent && (
            <div>
              <div style={{ fontSize: 8, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>{opponent.shortName ?? opponent.name}</div>
              <div style={{ color: 'var(--text-primary)', fontSize: 11.5, marginTop: 2 }}>{oppFormText}</div>
            </div>
          )}
        </div>
      )}

      {/* 2. Opponent analysis card */}
      {opponent && nextFixture && (
        <OpponentAnalysisCard
          fixture={nextFixture}
          opponent={opponent}
          game={game}
          onError={onError}
        />
      )}

      {/* 3. Tabs — always at top, same position in both modes. Practice: alltid Plan, ingen växlare. */}
      {!practice && (
        <div style={{ padding: '0 14px', marginBottom: 10 }}>
          <div className="btn-segmented" style={{ display: 'flex', width: '100%' }}>
            {(['list', 'pitch'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`btn${viewMode === mode ? ' active' : ''}`}
                style={{ flex: 1, padding: '8px 4px', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px' }}
              >
                {mode === 'list' ? 'Lista' : 'Plan'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Status + Auto-fyll — practice autofyller automatiskt, ingen manuell knapp */}
      {!practice && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 14px', marginBottom: 10, gap: 8 }}>
          <span style={{ fontSize: 9, color: startingIds.length === 11 ? 'var(--success)' : 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            {startingIds.length} av 11 placerade
          </span>
          <button
            onClick={() => {
              onAutoFill()
              setJustFilled(true)
              setTimeout(() => setJustFilled(false), 1500)
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 10px',
              background: justFilled ? 'var(--success)' : 'transparent',
              border: `1.5px solid ${justFilled ? 'var(--success)' : 'var(--accent)'}`,
              color: justFilled ? 'var(--text-light)' : 'var(--accent-dark)',
              fontSize: 11, fontWeight: 600,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s, color 0.15s',
            }}
          >
            {justFilled ? '✓' : SPARKLE_SVG}
            {justFilled ? 'Uppdaterad' : 'Fyll bästa elvan'}
          </button>
        </div>
      )}

      {/* 5. Formation — practice: låst till rekommenderad, ingen dropdown */}
      {practice ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', marginBottom: 10 }}>
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Planen
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
            {FORMATIONS[(tacticState.formation ?? '3-3-4') as FormationType].label}
          </span>
          <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 600 }}>· rekommenderad</span>
          <span style={{
            marginLeft: 'auto', fontFamily: 'ui-monospace, monospace', fontSize: 8, letterSpacing: '1px',
            color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 3, padding: '2px 6px',
          }}>SATT FÖR IDAG</span>
        </div>
      ) : (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', marginBottom: 10 }}>
        <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icon icon={Settings} size={11} /> Formation
        </span>
        <select
          value={tacticState.formation ?? '3-3-4'}
          onChange={e => onFormationChange({ ...tacticState, formation: e.target.value as FormationType })}
          style={{
            flex: 1,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            padding: '5px 8px',
            cursor: 'pointer',
          }}
        >
          {Object.entries(FORMATIONS).map(([type, tpl]) => (
            <option key={type} value={type}>{tpl.label}</option>
          ))}
        </select>
      </div>
      )}

      {/* 5b. Practice — färgnyckel (beat ≥1) */}
      {practice && practiceBeat >= 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
          padding: '9px 12px', margin: '0 14px 10px',
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-secondary)' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--success)' }} />rätt position
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-secondary)' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--warning)' }} />går an
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-secondary)' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--danger)' }} />fel position
          </span>
        </div>
      )}

      {/* 6. Pitch — viewMode determines component, same location */}
      {viewMode === 'list' ? (
        <LineupFormationView
          tacticState={tacticState}
          startingIds={startingIds}
          squadPlayers={squadPlayers}
          selectedSlotId={selectedSlotId}
          onSlotClick={onSlotClick}
        />
      ) : (
        <PitchLineupView
          tacticState={tacticState}
          startingIds={startingIds}
          squadPlayers={squadPlayers}
          onAssignPlayer={onAssignPlayer}
          onRemovePlayer={onRemovePlayer}
          onSwapPlayers={onSwapPlayers}
          spotlightSlotId={practiceSpotlight?.slotId ?? null}
        />
      )}

      {/* 6b. Practice — hint (beat 3 exakt) */}
      {practice && practiceBeat === 2 && practiceSpotlight && (
        <p style={{ margin: '0 14px 8px', textAlign: 'center', fontSize: 11, color: 'var(--accent-dark)', fontWeight: 600 }}>
          Tryck den glödande ringen för att byta spelare
        </p>
      )}

      {/* 7. List-mode additions — player list */}
      {viewMode === 'list' && (
        <div style={{ padding: '0 14px 8px' }}>
          {groupedPlayers.map(group => (
            <div key={group.position} style={{ marginBottom: 6 }}>
              <p style={{
                fontSize: 8, fontWeight: 600, letterSpacing: '2px',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                marginBottom: 2, paddingLeft: 4,
              }}>
                {GROUP_LABELS[group.position] ?? group.position}
              </p>
              {group.players.map(player => {
                const isStarting = startingIds.includes(player.id)
                const isInjured = player.isInjured
                const isSuspended = player.suspensionGamesRemaining > 0
                // A-H3 (DOM_AH3_TILLGANGLIGHET_2026-08-28.md), ben 2: vilande/
                // överbelastad efter förra matchens sannolikhetskast — skild
                // orsak, skild etikett, aldrig kallad "skadad".
                const isRestingOut = (player.restGamesRemaining ?? 0) > 0
                const isUnavailable = isInjured || isSuspended || isRestingOut
                // Ben 2, förhandsvarningen (den icke förhandlingsbara delen av
                // domen): en spelare som SKULLE starta idag under golvet —
                // innan matchen är spelad, innan kastet är gjort.
                const isFatigueRisk = isStarting && !isUnavailable && player.fitness < FATIGUE_AVAILABILITY_FLOOR

                const rowBorderLeft = isInjured
                  ? '3px solid var(--danger)'
                  : isSuspended || isRestingOut
                  ? '2px solid var(--warm-light)'
                  : '2px solid transparent'

                return (
                  <div
                    key={player.id}
                    onClick={() => handlePlayerClick(player)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '6px 10px',
                      background: 'var(--bg-surface)',
                      borderLeft: rowBorderLeft,
                      borderRadius: '0 8px 8px 0',
                      marginBottom: 2,
                      fontSize: 12.5,
                      cursor: isUnavailable ? 'default' : 'pointer',
                      opacity: isUnavailable ? 0.75 : 1,
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, width: 22, color: 'var(--text-secondary)', fontSize: 12 }}>
                      {player.shirtNumber ?? '?'}
                    </span>
                    <span style={{ fontSize: 9, letterSpacing: '1px', color: 'var(--text-muted)', width: 22 }}>
                      {positionShort(player.position)}
                    </span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {player.lastName}
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)', width: 26, textAlign: 'right', fontSize: 12 }}>
                      {Math.round(player.currentAbility)}
                    </span>
                    {isInjured && (
                      <span className="tag tag-red" style={{ padding: '2px 5px' }}>
                        {player.injuryDaysRemaining > 0 ? `${player.injuryDaysRemaining} dgr` : 'Skadad'}
                      </span>
                    )}
                    {isSuspended && (
                      <span className="tag tag-copper" style={{ padding: '2px 5px' }}>
                        Avstängd
                      </span>
                    )}
                    {isRestingOut && (
                      <span className="tag tag-copper" style={{ padding: '2px 5px' }}>
                        {/* SVENSK TEXT — CODE SKRIVER ALDRIG: '[Opus]' är en
                            medveten placeholder för etiketten (vilande/
                            överbelastad — inte skadad, inte avstängd). */}
                        [Opus]
                      </span>
                    )}
                    {isFatigueRisk && (
                      <span
                        className="tag tag-red"
                        style={{ padding: '2px 5px', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                        title="Startar under fitness-golvet — risk att förlora honom till nästa match"
                      >
                        <Icon icon={AlertTriangle} size={9} style={{ flexShrink: 0 }} />
                        {/* SVENSK TEXT — CODE SKRIVER ALDRIG: '[Opus]' är en
                            medveten placeholder för förhandsvarningen
                            (domens icke förhandlingsbara krav — synlig INNAN
                            matchen, inte en post-match-överraskning). */}
                        [Opus]
                      </span>
                    )}
                    {isStarting && !isUnavailable && !isFatigueRisk && (
                      <span className="tag tag-green" style={{ padding: '2px 5px' }}>
                        Start
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Validation warnings — practice autofyller alltid en giltig elva, döljs */}
      {!practice && !canPlay && (
        <div style={{ margin: '0 14px 8px', background: 'color-mix(in srgb, var(--danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--danger)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {startingIds.length !== 11 && <span>Välj exakt 11 startspelare (du har {startingIds.length})</span>}
          {injuredInStarting.map(p => (
            <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Icon icon={AlertTriangle} size={12} style={{ flexShrink: 0 }} /> {p.firstName} {p.lastName}{' '}
              {p.isInjured
                ? 'är skadad'
                : p.suspensionGamesRemaining > 0
                ? `är avstängd (${p.suspensionGamesRemaining} matcher kvar)`
                /* A-H3 (DOM_AH3_TILLGANGLIGHET_2026-08-28.md): tredje grenen,
                   vilande/överbelastad. SVENSK TEXT — CODE SKRIVER ALDRIG:
                   '[Opus]' är en medveten placeholder. */
                : '[Opus]'}
            </span>
          ))}
        </div>
      )}
      {!practice && canPlay && !startingIds.some(id => squadPlayers.find(p => p.id === id)?.position === PlayerPosition.Goalkeeper) && (
        <div style={{ margin: '0 14px 8px', background: 'color-mix(in srgb, var(--warning) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon icon={AlertTriangle} size={13} style={{ flexShrink: 0 }} /> Ingen målvakt i startelvan — en utespelare får gå i mål.
        </div>
      )}

      {/* Footer CTA — live only. T5a (SF-2, 2026-07-13/14): practice-footern
          flyttad till Tillträdets dockade .scene-cta-area (samma position som
          F1/F3/F4) — döljs härifrån helt, renderas inte inline i det
          scrollande kortet längre. */}
      {!practice && (
        <div style={{ padding: '4px 14px 24px', borderTop: '0.5px solid var(--border)', marginTop: 4 }}>
          <button
            onClick={onNext}
            disabled={!canPlay}
            className="btn btn-cta btn-primary"
            style={{ width: '100%', cursor: canPlay ? 'pointer' : 'not-allowed', opacity: canPlay ? 1 : 0.5 }}
          >
            Nästa: Taktik →
          </button>
        </div>
      )}
    </>
  )
}
