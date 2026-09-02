import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useManagedPlayers, useHasPendingLineup, useManagedClub, useGameStore, useExpiringContracts, useLastCompletedFixture } from '../store/gameStore'
import { getTacticDeltaLine, getTacticChangeHistoryLines } from '../utils/tacticData'
import { ContractsTab } from '../components/transfers/ContractsTab'
import { PlayerPosition, PlayerArchetype } from '../../domain/enums'
import type { Player } from '../../domain/entities/Player'
import type { LoanDeal } from '../../domain/entities/Academy'
import type { Tactic } from '../../domain/entities/Club'
import { StatBar } from '../components/StatBar'
import { PlayerCard } from '../components/PlayerCard'
import { getRecentMatchRatings } from '../components/playerCardUtils'
import { positionShort, POSITION_ORDER } from '../utils/formatters'
import { TRAIT_META } from '../../domain/data/playerTraits'
import { SectionCard } from '../components/SectionCard'
import { getPortraitSvg } from '../../domain/services/portraitService'
import { FirstVisitHint } from '../components/FirstVisitHint'
import { LockerRoomCard } from '../components/club/LockerRoomCard'
import { TacticBoardCard } from '../components/tactic/TacticBoardCard'
import { SeasonArcCard } from '../components/squad/SeasonArcCard'
import { StillnessSection } from '../components/squad/StillnessSection'
import { getRecommendedFormation, FORMATION_META } from '../../domain/entities/Formation'
import { TabBar } from '../components/shared/TabBar'
import { TabIntro } from '../components/shared/TabIntro'
import { TAB_INTROS } from '../../domain/data/tabIntros'
import '../styles/squad.css'
import { getInjuryText, getSuspensionText, getMoraleText, getContractText } from '../../domain/data/squadNuStrings'
import { findActiveAnniversaries } from '../../domain/services/clubMemoryService'
import type { ActiveAnniversary } from '../../domain/services/clubMemoryService'
import { getNextManagedFixture } from '../../domain/services/portal/triggers/matchTriggers'
import { getBurnoutTacticSuppression, suppressTacticRecommendation, burnoutEffectSeed } from '../../domain/services/burnoutReliefService'

type SortKey = 'position' | 'ca' | 'form' | 'age'
type FilterKey = 'all' | 'mv' | 'def' | 'half' | 'mid' | 'fwd'

const FILTER_TO_POSITION: Record<string, PlayerPosition> = {
  mv: PlayerPosition.Goalkeeper,
  def: PlayerPosition.Defender,
  half: PlayerPosition.Half,
  mid: PlayerPosition.Midfielder,
  fwd: PlayerPosition.Forward,
}

function caColor(ca: number): string {
  if (ca >= 75) return 'var(--accent)'
  if (ca >= 60) return 'var(--text-primary)'
  if (ca >= 40) return 'var(--accent)'
  return 'var(--text-secondary)'
}

function ratingColor(r: number): string {
  if (r >= 7.5) return 'var(--accent)'
  if (r >= 6.0) return 'var(--text-secondary)'
  return 'var(--danger)'
}

function barColor(value: number): string {
  if (value > 65) return 'var(--success)'
  if (value >= 40) return 'var(--warning)'
  return 'var(--danger)'
}


const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Alla' },
  { key: 'mv', label: 'MV' },
  { key: 'def', label: 'B' },
  { key: 'half', label: 'YH' },
  { key: 'mid', label: 'MF' },
  { key: 'fwd', label: 'A' },
]

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'position', label: 'Position' },
  { key: 'ca', label: 'Styrka' },
  { key: 'form', label: 'Form' },
  { key: 'age', label: 'Ålder' },
]

interface PlayerRowProps {
  player: Player
  onClick: () => void
  currentSeason: number
  captainPlayerId: string | undefined
  anniversaries: ActiveAnniversary[]
}

interface PlayerRowAnimatedProps {
  player: Player
  index: number
  onClick: () => void
  currentSeason: number
  captainPlayerId: string | undefined
  anniversaries: ActiveAnniversary[]
}

// Eko-text per type med variation. Deterministiskt val på eventId så raden
// inte hoppar vid omrender. Outcome är alltid neutral för player-typer (won/lost
// finns bara på fixture-typer som bär subjectClubId, inte subjectPlayerId), så
// vi diskriminerar bara på type + yearsAgo.
const ANNIVERSARY_EKO: Record<string, ((y: number) => string)[]> = {
  player_milestone: [
    (y) => `På dagen ${y} år sedan — milstolpen. Han bär den fortfarande.`,
    (y) => `${y} år sedan just denna omgång. Han skrev in sig då.`,
    (y) => `Samma omgång för ${y} år sedan. Det är sådant orten minns.`,
  ],
  academy_promotion: [
    (y) => `${y} år sedan han kom upp från P19. Nu är han vår.`,
    (y) => `På dagen ${y} år sedan steget upp från juniorerna.`,
    (y) => `${y} år i A-laget. Det började just den här omgången.`,
  ],
  storyline_resolution: [
    (y) => `${y} år sedan berättelsen fick sitt slut. Den sitter kvar.`,
    (y) => `På dagen ${y} år sedan. Den som var med minns.`,
  ],
  retirement: [
    (y) => `${y} år sedan avskedet. Tröjan hänger kvar i hallen.`,
    (y) => `Orten glömmer inte. ${y} år sedan, samma omgång.`,
  ],
}

function hashEventId(eventId: string): number {
  let h = 0
  for (let i = 0; i < eventId.length; i++) {
    h = (h * 31 + eventId.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function anniversaryEkoText(ann: ActiveAnniversary): string {
  const y = ann.yearsAgo
  const pool = ANNIVERSARY_EKO[ann.type]
  if (!pool || pool.length === 0) {
    return `Samma omgång, ${y} år tillbaka. Klubben minns.`
  }
  const idx = hashEventId(ann.eventId) % pool.length
  return pool[idx](y)
}



function PlayerRowAnimated({ player, index, onClick, currentSeason, captainPlayerId, anniversaries }: PlayerRowAnimatedProps) {
  return (
    <div style={{
      animation: index < 8 ? `fadeInUp 250ms ease-out ${index * 40}ms both` : 'none',
    }}>
      <PlayerRow player={player} onClick={onClick} currentSeason={currentSeason} captainPlayerId={captainPlayerId} anniversaries={anniversaries} />
    </div>
  )
}

// DB-5: stripen bär EN prioriterad actionable state (skada/avstängd > moral/lobby >
// kontrakt). Ålder är inte actionable → chip (R2-3 ageband), inte stripe. Guld aldrig.
// Ingen actionable state → transparent (raden behåller 3px-geometrin utan färgcue).
function stripeColor(player: Player, currentSeason: number): string {
  if (player.isInjured || player.suspensionGamesRemaining > 0) return 'var(--danger)'
  if (player.morale < 45 || player.availability === 'unhappy' || player.availability === 'want_to_leave') return 'var(--warm)'
  if (player.contractUntilSeason <= currentSeason) return 'var(--warm)'
  return 'transparent'
}

function PlayerRow({ player, onClick, currentSeason, captainPlayerId, anniversaries }: PlayerRowProps) {
  const isCaptain = player.id === captainPlayerId

  const playerAnniversary = anniversaries
    .filter(a => a.subjectPlayerId === player.id)
    .sort((a, b) => b.significance - a.significance)[0] ?? null

  const stripe = stripeColor(player, currentSeason)

  const chipStyle = (color: string, bg: string, borderColor: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 3,
    fontSize: 10, fontWeight: 600, borderRadius: 99, padding: '2px 7px',
    maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    color, background: bg, border: `1px solid ${borderColor}`, lineHeight: 1.3, flexShrink: 0,
  })
  const allChips: React.ReactNode[] = []
  if (player.isInjured) {
    allChips.push(<span key="injury" style={chipStyle('var(--danger-text)', 'color-mix(in srgb, var(--danger) 5%, transparent)', 'color-mix(in srgb, var(--danger) 30%, transparent)')}>🩹 {getInjuryText(player.injuryDaysRemaining, player.id)}</span>)
  }
  if (player.suspensionGamesRemaining > 0) {
    allChips.push(<span key="suspension" style={chipStyle('var(--danger-text)', 'color-mix(in srgb, var(--danger) 5%, transparent)', 'color-mix(in srgb, var(--danger) 30%, transparent)')}>🚫 {getSuspensionText(player.suspensionGamesRemaining, player.id, player.suspensionCause, currentSeason)}</span>)
  }
  if (player.morale < 45) {
    allChips.push(<span key="morale" style={chipStyle('var(--warm-light)', 'color-mix(in srgb, var(--warm) 6%, transparent)', 'color-mix(in srgb, var(--warm) 40%, transparent)')}>😟 {getMoraleText(player.morale, player.lowMoraleDays, player.id)}</span>)
  } else if (player.availability === 'unhappy') {
    allChips.push(<span key="unhappy" style={chipStyle('var(--warm-light)', 'color-mix(in srgb, var(--warm) 8%, transparent)', 'color-mix(in srgb, var(--warm) 50%, transparent)')}>😤 Missnöjd</span>)
  } else if (player.availability === 'want_to_leave') {
    allChips.push(<span key="want_to_leave" style={chipStyle('var(--warm-light)', 'color-mix(in srgb, var(--warm) 8%, transparent)', 'color-mix(in srgb, var(--warm) 50%, transparent)')}>🚪 Vill lämna</span>)
  }
  if (player.contractUntilSeason <= currentSeason) {
    allChips.push(<span key="contract" style={chipStyle('var(--warm-light)', 'color-mix(in srgb, var(--warm) 6%, transparent)', 'color-mix(in srgb, var(--warm) 40%, transparent)')}>📄 {getContractText(player.contractUntilSeason, currentSeason, player.id)}</span>)
  }
  if (player.trait && TRAIT_META[player.trait]) {
    const meta = TRAIT_META[player.trait]
    allChips.push(<span key="trait" style={chipStyle(meta.color, 'color-mix(in srgb, var(--accent) 5%, transparent)', 'color-mix(in srgb, var(--accent) 30%, transparent)')}>{meta.emoji} {meta.label}</span>)
  }
  if (player.archetype === PlayerArchetype.CornerSpecialist) {
    allChips.push(<span key="corner" style={chipStyle('var(--accent)', 'color-mix(in srgb, var(--accent) 5%, transparent)', 'color-mix(in srgb, var(--accent) 30%, transparent)')}>📐 Hörnspec.</span>)
  }
  if (player.promotedFromAcademy) {
    allChips.push(<span key="academy" style={chipStyle('var(--cold-light)', 'color-mix(in srgb, var(--cold) 5%, transparent)', 'color-mix(in srgb, var(--cold) 30%, transparent)')}>◆ Akademi</span>)  // Q2: squad-domän → --cold, ej --ice
  }
  if (player.isFullTimePro) {
    allChips.push(<span key="pro" style={chipStyle('var(--bg)', 'var(--accent)', 'var(--accent)')}>⭐ Proffs</span>)
  } else if (player.dayJob) {
    allChips.push(<span key="dayjob" style={chipStyle('var(--text-secondary)', 'transparent', 'var(--border-dark)')}>👷 {player.dayJob.title}</span>)
  }
  // VISUELL_AUDIT punkt 3: allChips.slice(0,3) dolde upp till sex chips utan
  // att visa att det fanns fler. +N-pill (samma chipStyle) när fler än tre.
  const chips = allChips.slice(0, 3)
  if (allChips.length > 3) {
    chips.push(
      <span key="more" style={chipStyle('var(--text-muted)', 'transparent', 'var(--border-dark)')}>
        +{allChips.length - 3}
      </span>
    )
  }

  const clubSeasons = player.seasonHistory?.filter(s => s.clubId === player.clubId).length ?? 0
  const showVeteranBand = clubSeasons >= 5 && !isCaptain

  const lastStoryline = player.diary?.filter(e => e.type === 'storyline').slice(-1)[0]

  return (
    <div
      onClick={onClick}
      className="card-sharp"
      style={{
        padding: '10px 12px',
        marginBottom: 6,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        overflow: 'hidden',
        borderLeft: `3px solid ${stripe}`,
        borderRadius: '0 8px 8px 0',
      }}
    >
      {/* Top row: badge + name + CA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Player portrait with captain band / veteran band / legend ring */}
        {/* TODO(FAS 5): byt mot riktig karaktärsillustration · se CHARACTER-BRIEF.md */}
        <div style={{ position: 'relative', flexShrink: 0, width: 40, height: 40 }}>
          {player.isClubLegend && (
            <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', border: '2px solid var(--gold)', zIndex: 1 }} />
          )}
          <div
            style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border)', background: 'var(--bg-surface)' }}
            dangerouslySetInnerHTML={{ __html: getPortraitSvg(player.id, player.age, player.position) }}
          />
          {isCaptain && (
            <div style={{
              position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)',
              fontSize: 8, color: 'var(--accent)', border: '1px solid var(--accent)',
              borderRadius: 3, padding: '0 3px', lineHeight: '14px', background: 'var(--bg-surface)',
              zIndex: 2,
            }}>K</div>
          )}
          {showVeteranBand && (
            <div style={{
              position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)',
              fontSize: 8, color: 'var(--text-muted)', border: '1px solid var(--text-muted)',
              borderRadius: 3, padding: '0 3px', lineHeight: '14px', background: 'var(--bg-surface)',
              zIndex: 2, whiteSpace: 'nowrap',
            }}>{clubSeasons}år</div>
          )}
        </div>

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="h-name" style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {player.shirtNumber != null && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>#{player.shirtNumber}</span>
            )}
            {player.firstName} {player.lastName}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>
            {positionShort(player.position)} · {player.age} år
          </p>
        </div>

        {/* CA badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              fontSize: 15,
              fontWeight: 800,
              color: caColor(player.currentAbility),
              // DB-1 glow-pass: Tailwind-färg → token (alpha bevarad; 40/30 flaggat för
              // Design om de ska snäppas till kanon-glow 35%)
              textShadow: player.currentAbility >= 75
                ? '0 0 8px color-mix(in srgb, var(--success) 40%, transparent)'
                : player.currentAbility < 40
                  ? '0 0 8px color-mix(in srgb, var(--danger) 30%, transparent)'
                  : undefined,
            }}>
              {Math.round(player.currentAbility)}
            </span>
            {player.startSeasonCA != null && player.currentAbility > player.startSeasonCA && (
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>
                ↑+{Math.round(player.currentAbility - player.startSeasonCA)}
              </span>
            )}
            {player.startSeasonCA != null && player.currentAbility < player.startSeasonCA && (
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)' }}>
                ↓{Math.round(player.currentAbility - player.startSeasonCA)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="h-micro" style={{ color: 'var(--text-muted)' }}>Styrka</span>
            {/* R2-3: åldersband-chip-familjen — Utvecklas=cold, Peak=success, Avtar=muted */}
            {player.age < 24 && (
              <span className="ageband ab-young">Utvecklas</span>
            )}
            {player.age >= 24 && player.age <= 30 && (
              <span className="ageband ab-peak">Peak</span>
            )}
            {player.age > 30 && (
              <span className="ageband ab-fade">Avtar</span>
            )}
          </div>
        </div>

        {/* Nav button */}
        <button style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--accent)', fontSize: 11, lineHeight: 1,
          cursor: 'pointer',
        }}>›</button>
      </div>

      {/* Bottom row: fitness bar + chips. Q1: form-sparkline flyttad till PlayerCard-modal
          (sparkline endast när riktning = info; en lista med rader → tal/bar, ej linje-flora). */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 50 }}>
        <div style={{ width: 50, flexShrink: 0 }}>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>Kond</p>
          <StatBar value={player.fitness} color={barColor(player.fitness)} height={5} />
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap', alignItems: 'center', overflow: 'hidden' }}>
          {chips}
        </div>
      </div>

      {/* Stat row */}
      {player.seasonStats.gamesPlayed > 0 && (
        <div style={{ display: 'flex', gap: 12, paddingLeft: 50, fontSize: 11, color: 'var(--text-muted)' }}>
          <span>{player.seasonStats.gamesPlayed}M</span>
          <span style={{ color: player.seasonStats.goals > 0 ? 'var(--text-primary)' : undefined }}>
            {player.seasonStats.goals}G
          </span>
          <span>{player.seasonStats.assists}A</span>
          <span style={{ color: ratingColor(player.seasonStats.averageRating) }}>
            {player.seasonStats.averageRating.toFixed(1)}★
          </span>
          {player.seasonStats.redCards > 0 && (
            <span style={{ color: 'var(--danger)' }}>{player.seasonStats.redCards}utv</span>
          )}
        </div>
      )}

      {/* Fas 2: Storyline row */}
      {lastStoryline && (
        <div className="squad-trait-quote">
          {lastStoryline.text}
        </div>
      )}

      {player.managerNote && (
        <div className="squad-trait-quote">
          ✎ {player.managerNote}
        </div>
      )}

      {/* VÄNTAR PÅ C-K1: Landslags-chip */}
      {playerAnniversary && (
        <div className="squad-trait-quote-gold">
          ✦ {anniversaryEkoText(playerAnniversary)}
        </div>
      )}
      {/* VÄNTAR PÅ Manager v1 + R1: Full lobby-kategorisering med motiv */}
      {/* VÄNTAR PÅ diary-mappning: Klacken-favorit-chip */}
    </div>
  )
}

export function SquadScreen() {
  const players = useManagedPlayers()
  const hasPendingLineup = useHasPendingLineup()
  const club = useManagedClub()
  const location = useLocation()
  const game = useGameStore(s => s.game)
  const talkToPlayer = useGameStore(s => s.talkToPlayer)
  const useLeadershipAction = useGameStore(s => s.useLeadershipAction)
  const markScreenVisited = useGameStore(s => s.markScreenVisited)
  const dismissHint = useGameStore(s => s.dismissHint)
  useEffect(() => { markScreenVisited('squad') }, [])
  const updateTactic = useGameStore(s => s.updateTactic)
  const expiringCount = useExpiringContracts()
  const [screenTab, setScreenTab] = useState<'nu' | 'trupp' | 'taktik' | 'värvning'>('nu')
  // B1-nav Fas 2: deep-link från PlayerCard "Förläng" → öppna Värvning + renew-modal.
  const [renewDeepLinkId, setRenewDeepLinkId] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('position')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [lineupTab, setLineupTab] = useState<'startelva' | 'bank' | 'reserv'>('startelva')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [talkFeedback, setTalkFeedback] = useState<{ text: string; moraleChange: number; formChange: number } | null>(null)
  const [leadershipFeedback, setLeadershipFeedback] = useState<string | null>(null)

  // SKALA-BUGGEN steg B (2026-09-02) — felnamngiven sedan tidigare: filtret
  // exkluderar inte cup/slutspel, så värdet är global matchdag, inte en
  // serieomgång. Namnet bytt för att inte ärvas som mönster nästa gång.
  const latestCompletedMatchday = game
    ? (game.fixtures.filter(f => f.status === 'completed').sort((a, b) => b.matchday - a.matchday)[0]?.matchday ?? 0)
    : 0

  const activeAnniversaries = useMemo(
    () => game ? findActiveAnniversaries(game) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game?.currentMatchday, game?.currentSeason],
  )

  const { nextOpponentName, nextOpponentAnalysis } = useMemo(() => {
    if (!game) return { nextOpponentName: undefined, nextOpponentAnalysis: undefined }
    const nf = getNextManagedFixture(game)
    if (!nf) return { nextOpponentName: undefined, nextOpponentAnalysis: undefined }
    const oppId = nf.homeClubId === game.managedClubId ? nf.awayClubId : nf.homeClubId
    const opp = game.clubs.find(c => c.id === oppId)
    const rawAnalysis = game.opponentAnalyses?.[oppId]
    // O4 (DOM_BURNOUT_2026-08-17.md, 2026-08-23): samma gate/seed som
    // TaktikScreen.tsx — de två skärmarna får aldrig ge olika svar samma omgång.
    // DOM_BURNOUT_TAK_2026-09-02 (C): samma forceFullSuppression-avgörande
    // som TaktikScreen.tsx, ur samma game-objekt.
    const ceilingRecoveryActive = (game.burnoutCeilingRecoveryUntilRound ?? 0) >= game.currentMatchday
    const suppressed = getBurnoutTacticSuppression(game.managerProfile, burnoutEffectSeed(game), ceilingRecoveryActive)
    return {
      nextOpponentName: opp?.shortName ?? opp?.name,
      nextOpponentAnalysis: suppressed ? suppressTacticRecommendation(rawAnalysis) : rawAnalysis,
    }
  }, [game])

  // O15 (2026-08-18/19): samma Taktikens-två-lägen-wiring som TaktikScreen.tsx —
  // Trupp-skärmens Taktik-flik är EN till konsument av samma TacticBoardCard
  // (Å2 var redan gemensam), delta/historik/lägestoggel får inte glida isär mellan de
  // två ingångarna. lastOpponentName = motståndaren i förra SPELADE matchen (inte
  // nästa) — "sedan sist" i spelarens minne.
  const lastFixture = useLastCompletedFixture()
  const setTacticAdvancedMode = useGameStore(s => s.setTacticAdvancedMode)
  const lastOpponentName = useMemo(() => {
    if (!game || !lastFixture) return undefined
    const oppId = lastFixture.homeClubId === game.managedClubId ? lastFixture.awayClubId : lastFixture.homeClubId
    const opp = game.clubs.find(c => c.id === oppId)
    return opp?.shortName ?? opp?.name
  }, [game, lastFixture])
  const tacticAdvancedMode = game?.tacticAdvancedMode ?? false
  const tacticDeltaLine = (game && club)
    ? getTacticDeltaLine(club.activeTactic, lastFixture, game.managedClubId, game.currentSeason, lastOpponentName)
    : undefined
  const tacticHistoryLines = getTacticChangeHistoryLines(game?.tacticChangeLog)

  function handleTalk(playerId: string, choice: 'encourage' | 'demand' | 'future') {
    const result = talkToPlayer(playerId, choice, latestCompletedMatchday)
    setTalkFeedback({ text: result.feedback, moraleChange: result.moraleChange, formChange: result.formChange })
    setTimeout(() => setTalkFeedback(null), 4000)
  }

  function handleLeadership(playerId: string, action: import('../../domain/services/leadershipService').LeadershipAction) {
    const result = useLeadershipAction(playerId, action, latestCompletedMatchday)
    if (result) {
      setLeadershipFeedback(result.feedback)
      setTimeout(() => setLeadershipFeedback(null), 4000)
    }
  }

  useEffect(() => {
    const state = location.state as { highlightPlayer?: string; tab?: string; renewPlayerId?: string } | null
    const highlightId = state?.highlightPlayer
    if (highlightId) {
      setSelectedPlayerId(highlightId)
    }
    // B1-nav Fas 2: PlayerCard "Förläng" landar här på Värvning med renew-modalen öppen.
    if (state?.tab === 'värvning') setScreenTab('värvning')
    if (state?.renewPlayerId) setRenewDeepLinkId(state.renewPlayerId)
    if (highlightId || state?.tab || state?.renewPlayerId) {
      // Clear state so back/forward nav doesn't re-open
      window.history.replaceState({ ...window.history.state, usr: {} }, '')
    }
  }, [location.state])

  const filtered = filter === 'all'
    ? players
    : players.filter(p => p.position === FILTER_TO_POSITION[filter])

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'position') return POSITION_ORDER[a.position] - POSITION_ORDER[b.position]
    if (sort === 'ca') return b.currentAbility - a.currentAbility
    if (sort === 'form') return b.form - a.form
    if (sort === 'age') return a.age - b.age
    return 0
  })

  // Apply lineup tab filter when lineup exists
  const lineupFiltered: Player[] = (() => {
    const lineup = game?.managedClubPendingLineup
    if (!lineup) return sorted
    const startIds = new Set(lineup.startingPlayerIds)
    const benchIds = new Set(lineup.benchPlayerIds)
    if (lineupTab === 'startelva') return sorted.filter(p => startIds.has(p.id))
    if (lineupTab === 'bank') return sorted.filter(p => benchIds.has(p.id))
    return sorted.filter(p => !startIds.has(p.id) && !benchIds.has(p.id))
  })()

  const navigate = useNavigate()
  const selectedPlayer = selectedPlayerId ? players.find(p => p.id === selectedPlayerId) ?? null : null
  const clubName = club?.name ?? ''
  const topScorer = players.filter(p => p.seasonStats.goals > 0).sort((a, b) => b.seasonStats.goals - a.seasonStats.goals)[0]
  const topAssist = players.filter(p => p.seasonStats.assists > 0).sort((a, b) => b.seasonStats.assists - a.seasonStats.assists)[0]
  const topRating = players.filter(p => p.seasonStats.gamesPlayed >= 3).sort((a, b) => b.seasonStats.averageRating - a.seasonStats.averageRating)[0]
  const topSuspensions = players.filter(p => p.seasonStats.redCards > 0).sort((a, b) => b.seasonStats.redCards - a.seasonStats.redCards)[0]
  const hasSeasonData = topScorer || topAssist || topRating || topSuspensions

  const dismissed = game?.dismissedHints ?? []

  return (
    <div className="screen-col-layout" style={{ background: 'var(--bg)' }}>
      {!dismissed.includes('squad') && (
        <FirstVisitHint
          screenId="squad"
          text="Dra spelare till positioner. Grön ring = rätt plats. Gul = kan funka. Utan laguppställning kan du inte spela."
          onDismiss={() => dismissHint('squad')}
        />
      )}
      {/* Screen tabs */}
      <div className="tab-bar-host">
        <TabBar
          tabs={[
            { id: 'nu', label: 'Nu' },
            { id: 'trupp', label: 'Trupp' },
            { id: 'taktik', label: 'Taktik' },
            { id: 'värvning', label: 'Kontrakt', dot: expiringCount > 0 ? 'danger' : null },
          ]}
          activeId={screenTab}
          onSelect={(id) => setScreenTab(id as typeof screenTab)}
        />
      </div>
      <TabIntro entry={TAB_INTROS[screenTab]} />
      {screenTab === 'taktik' && club && game?.assistantCoach && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', paddingBottom: 'calc(var(--bottom-nav-height, 60px) + 16px)' }}>
          <TacticBoardCard
            club={club}
            players={players}
            coach={game.assistantCoach}
            captainPlayerId={game.captainPlayerId}
            chemistryStats={game.chemistryStats ?? {}}
            onTacticChange={(tactic: Tactic) => updateTactic(tactic)}
            matchday={game.currentMatchday}
            nextOpponentName={nextOpponentName}
            opponentAnalysis={nextOpponentAnalysis}
            advancedMode={tacticAdvancedMode}
            onToggleAdvancedMode={setTacticAdvancedMode}
            deltaLine={tacticDeltaLine}
            historyLines={tacticHistoryLines}
            lineupConfirmedThisRound={game.lineupConfirmedThisRound}
          />
        </div>
      )}
      {/* Värvning — kontraktsförlängning (B1-nav Fas 2) */}
      {screenTab === 'värvning' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', paddingBottom: 'calc(var(--bottom-nav-height, 60px) + 16px)' }}>
          <ContractsTab
            initialRenewPlayerId={renewDeepLinkId}
            onConsumedDeepLink={() => setRenewDeepLinkId(null)}
          />
        </div>
      )}
      {/* Nu-vy */}
      {screenTab === 'nu' && game && (() => {
        const injured = players.filter(p => p.isInjured)
        const suspended = players.filter(p => p.suspensionGamesRemaining > 0)
        const lowMorale = players.filter(p => p.morale < 45).sort((a, b) => a.morale - b.morale).slice(0, 3)
        const expiringContracts = players.filter(p => p.contractUntilSeason <= game.currentSeason)
          .sort((a, b) => a.contractUntilSeason - b.contractUntilSeason)
        const recommended = getRecommendedFormation(players)
        const currentFormation = club?.activeTactic?.formation ?? '3-3-4'
        const allEmpty = injured.length === 0 && suspended.length === 0 && lowMorale.length === 0 && expiringContracts.length === 0
        const latestPulse = (game.teamFitnessHistory ?? []).slice(-1)[0]
        const injuryDanger = (latestPulse?.injuryCount ?? 0) >= 2
        const moralDanger = (latestPulse?.avgMorale ?? 100) < 55
        const playerRow = (p: typeof players[0], statusColor: string, statusText: string) => (
          <div
            key={p.id}
            className="card-sharp card-tap"
            onClick={() => setSelectedPlayerId(p.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 6, cursor: 'pointer' }}
          >
            <div
              style={{ width: 40, height: 40, flexShrink: 0, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--border)', background: 'var(--bg-surface)' }}
              dangerouslySetInnerHTML={{ __html: getPortraitSvg(p.id, p.age, p.position) }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{p.firstName} {p.lastName}</div>
              <div style={{ fontSize: 11, color: statusColor }}>{statusText}</div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{positionShort(p.position)}</div>
          </div>
        )
        // VISUELL_AUDIT punkt 3 (2026-08-09): fyra sektioner renderades
        // ovillkorligt med rubrik, även tomma — allEmpty visade StillnessSection,
        // men bara när ALLA fyra var tomma; blandat läge gav tomma rubriker
        // mellan de fyllda. Rendera nu bara sektioner där list.length > 0,
        // severity-stripe (samma prioritet/tokens som stripeColor: skada/
        // avstängning → danger, moral/kontrakt → warm) på var och en av dem.
        // De tomma kategorierna samlas i en enda CalmRow istf fyra tomma rubriker.
        const CATEGORY_LABEL: Record<string, string> = {
          skador: 'skador', avstängningar: 'avstängningar', moral: 'moral', 'utgående kontrakt': 'utgående kontrakt',
        }
        const emptyCategories: string[] = []
        if (injured.length === 0) emptyCategories.push(CATEGORY_LABEL.skador)
        if (suspended.length === 0) emptyCategories.push(CATEGORY_LABEL.avstängningar)
        if (lowMorale.length === 0) emptyCategories.push(CATEGORY_LABEL.moral)
        if (expiringContracts.length === 0) emptyCategories.push(CATEGORY_LABEL['utgående kontrakt'])
        // "Inget om {A} eller {B}." / "Inget om {A}, {B} eller {C}." — texten är
        // Opus färdigskriven (VISUELL_AUDIT-ordern), inte omskriven här.
        const calmRowText = emptyCategories.length === 0 ? null
          : emptyCategories.length === 1 ? `Inget om ${emptyCategories[0]}.`
          : `Inget om ${emptyCategories.slice(0, -1).join(', ')} eller ${emptyCategories[emptyCategories.length - 1]}.`

        const sectionWrap = (color: string, children: React.ReactNode) => (
          <div className="card-sharp" style={{
            marginBottom: 12, padding: '9px 12px', overflow: 'hidden',
            borderLeft: `3px solid ${color}`, borderRadius: '0 8px 8px 0',
          }}>
            {children}
          </div>
        )

        return (
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px', paddingBottom: 'calc(var(--bottom-nav-height, 60px) + 16px)' }}>
            <SeasonArcCard game={game} />
            {allEmpty ? (
              <StillnessSection game={game} />
            ) : (
              <>
                {injured.length > 0 && sectionWrap('var(--danger)', <>
                  <div className="h-label" style={{ marginBottom: 8, color: injuryDanger ? 'var(--danger)' : undefined }}>🚑 SKADADE</div>
                  {injured.map(p => playerRow(p, 'var(--danger)', getInjuryText(p.injuryDaysRemaining, p.id)))}
                </>)}
                {suspended.length > 0 && sectionWrap('var(--danger)', <>
                  <div className="h-label" style={{ marginBottom: 8 }}>🚫 AVSTÄNGDA</div>
                  {suspended.map(p => playerRow(p, 'var(--danger)', getSuspensionText(p.suspensionGamesRemaining, p.id, p.suspensionCause, game.currentSeason)))}
                </>)}
                {lowMorale.length > 0 && sectionWrap('var(--warm)', <>
                  <div className="h-label" style={{ marginBottom: 8, color: moralDanger ? 'var(--danger)' : undefined }}>😟 LÅG MORAL</div>
                  <div className="squad-section-note">
                    Låg moral i längden tär på formen, och det är formen som märks på isen. Ett samtal i tid brukar räcka för att vända det.
                  </div>
                  {lowMorale.map(p => playerRow(p, 'var(--warning)', getMoraleText(p.morale, p.lowMoraleDays, p.id)))}
                </>)}
                {expiringContracts.length > 0 && sectionWrap('var(--warm)', <>
                  <div className="h-label" style={{ marginBottom: 8 }}>📄 KONTRAKT UTGÅR</div>
                  {expiringContracts.map(p => playerRow(p, p.contractUntilSeason < game.currentSeason ? 'var(--danger)' : 'var(--warning)', getContractText(p.contractUntilSeason, game.currentSeason, p.id)))}
                </>)}
                {calmRowText && (
                  <div className="card-sharp" style={{ marginBottom: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{calmRowText}</span>
                  </div>
                )}
                {/* Stiltje-lagret stannar men tonas ned när något brinner */}
                <StillnessSection game={game} receded />
              </>
            )}
            <div>
              <div className="h-label" style={{ marginBottom: 8 }}>📋 FORMATION</div>
              <div className="card-sharp" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nuvarande</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{currentFormation}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: recommended !== currentFormation ? 8 : 0 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Rekommenderad</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: recommended !== currentFormation ? 'var(--accent)' : 'var(--success)' }}>{recommended}</span>
                </div>
                {recommended !== currentFormation && (
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    {FORMATION_META[recommended]?.coachQuote}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
      {/* Header */}
      {screenTab === 'trupp' && <div style={{ padding: '10px 16px 8px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
        {/* Lineup hint */}
        {!hasPendingLineup && (
          <div className="card-stagger-1" style={{
            background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            fontSize: 13,
            color: 'var(--text-secondary)',
            marginBottom: 12,
            animation: 'fadeInUp 300ms ease-out both',
          }}>
            💡 Välj 11 startspelare och 5 avbytare. Tryck på en spelare för att lägga till den i laget.
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, marginBottom: 12 }}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`btn ${filter === tab.key ? 'btn-copper' : 'btn-ghost'}`}
              style={{ flexShrink: 0, padding: '6px 12px', fontSize: 11 }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort row */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>Sortera:</span>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className={`btn ${sort === opt.key ? 'btn-ghost' : 'btn-ghost'}`}
              style={{
                padding: '3px 8px',
                fontSize: 12,
                fontWeight: sort === opt.key ? 700 : 400,
                color: sort === opt.key ? 'var(--text-primary)' : 'var(--text-muted)',
                background: sort === opt.key ? 'var(--bg-elevated)' : 'transparent',
                border: sort === opt.key ? '1px solid var(--border)' : '1px solid transparent',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Lineup tabs — only when lineup exists */}
        {game?.managedClubPendingLineup && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {([
              { key: 'startelva' as const, label: `Startelva (${game.managedClubPendingLineup.startingPlayerIds.length})` },
              { key: 'bank' as const, label: `Bänken (${game.managedClubPendingLineup.benchPlayerIds.length})` },
              { key: 'reserv' as const, label: 'Reserv' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setLineupTab(tab.key)}
                style={{
                  flex: 1,
                  padding: '7px 8px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 11,
                  fontWeight: 600,
                  border: lineupTab === tab.key ? 'none' : '1px solid var(--accent)',
                  background: lineupTab === tab.key ? 'var(--accent)' : 'transparent',
                  color: lineupTab === tab.key ? 'var(--text-light)' : 'var(--accent)',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>}

      {/* Player list */}
      {screenTab === 'trupp' && <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
        {/* Fitness warning */}
        {players.filter(p => p.fitness < 35 && !p.isInjured).length >= 2 && (
          <div
            onClick={() => navigate('/game/club', { state: { tab: 'training' } })}
            style={{
              background: 'color-mix(in srgb, var(--danger) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 25%, transparent)',
              borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 12,
              cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 13, color: 'var(--danger)' }}>
              ⚡ {players.filter(p => p.fitness < 35 && !p.isInjured).length} spelare med kritisk fitness
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Se träning →</span>
          </div>
        )}

        {/* Squad summary card */}
        {hasSeasonData && (
          <div className="card-sharp" style={{
            padding: '12px',
            marginBottom: 12,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}>
            {[
              { emoji: '🏒', label: 'Toppskytt', player: topScorer, value: topScorer?.seasonStats.goals },
              { emoji: '🅰️', label: 'Flest assist', player: topAssist, value: topAssist?.seasonStats.assists },
              { emoji: '⭐', label: 'Bäst betyg', player: topRating, value: topRating ? topRating.seasonStats.averageRating.toFixed(1) : undefined },
              { emoji: '🏒', label: 'Utvisningar', player: topSuspensions, value: topSuspensions?.seasonStats.redCards },
            ].map(({ emoji, label, player: p, value }) => (
              <div
                key={label}
                onClick={p ? () => setSelectedPlayerId(p.id) : undefined}
                className="card-sharp"
                style={{
                  padding: '8px 10px',
                  cursor: p ? 'pointer' : 'default',
                }}
              >
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{emoji} {label}</p>
                {p ? (
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {p.lastName} <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{value}</span>
                  </p>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 19B: Omklädningsrummet — list-vy */}
        {game && players.length >= 3 && (
          <LockerRoomCard
            players={players}
            captainId={game.captainPlayerId}
            onPlayerClick={(id) => setSelectedPlayerId(id)}
          />
        )}

        <SectionCard
          title={game?.managedClubPendingLineup
            ? (lineupTab === 'startelva' ? 'STARTELVA' : lineupTab === 'bank' ? 'BÄNKEN' : 'RESERV')
            : 'TRUPPEN'
          }
          variant="sharp"
          style={{ margin: '0 0 16px' }}>
          {(game?.managedClubPendingLineup ? lineupFiltered : sorted).map((player, index) => (
            <PlayerRowAnimated
              key={player.id}
              player={player}
              index={index}
              onClick={() => setSelectedPlayerId(player.id)}
              currentSeason={game?.currentSeason ?? 0}
              captainPlayerId={game?.captainPlayerId}
              anniversaries={activeAnniversaries}
            />
          ))}
          {(game?.managedClubPendingLineup ? lineupFiltered : sorted).length === 0 && (
            <p style={{ padding: '24px 0', color: 'var(--text-muted)', textAlign: 'center', fontSize: 14 }}>
              {game?.managedClubPendingLineup && lineupTab === 'startelva' ? 'Inga startspelare valda' :
               game?.managedClubPendingLineup && lineupTab === 'bank' ? 'Inga avbytare valda' :
               'Inga spelare i denna position'}
            </p>
          )}
        </SectionCard>

        {/* Låneavtal */}
        {(game?.loanDeals ?? []).length > 0 && (
          <SectionCard title="UTLÅNADE SPELARE" variant="sharp" style={{ margin: '0 0 16px' }}>
            {(game?.loanDeals ?? []).map((deal: LoanDeal) => {
              const player = game?.players.find(p => p.id === deal.playerId)
              if (!player) return null
              const currentMatchday = game?.currentMatchday ?? 0
              const roundsLeft = (deal.endRound ?? currentMatchday) - currentMatchday
              return (
                <div key={deal.playerId} className="card-sharp" style={{
                  padding: '10px 14px', marginBottom: 8,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{player.firstName} {player.lastName}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{deal.destinationClubName} · {deal.matchesPlayed ?? 0}/{deal.totalMatches ?? '?'} matcher</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>Betyg: {deal.averageRating > 0 ? deal.averageRating.toFixed(1) : '—'}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.max(0, roundsLeft)} omg. kvar</p>
                  </div>
                </div>
              )
            })}
          </SectionCard>
        )}

        <div style={{ height: 90 }} />
      </div>}

      {/* Player Card Modal */}
      {selectedPlayer && (
        <div
          onClick={() => setSelectedPlayerId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--z-modal)',  // T1c: 200 → z-skala (modal = 300)
            background: 'rgba(0,0,0,0.6)',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 430,
            margin: '0 auto',
            padding: '40px 20px calc(var(--bottom-nav-height) + 80px)',
          }}
        >
          {/* Unified card surface — everything scrollable inside the overlay */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
            background: 'var(--bg)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-modal)',
            border: '1px solid var(--border)',
            width: '100%',
            maxWidth: 390,
            position: 'relative',
          }}>
          <PlayerCard
            player={selectedPlayer}
            clubName={clubName}
            onClick={undefined}
            currentSeason={game?.currentSeason}
            storylines={(game?.storylines ?? []).filter(s => s.playerId === selectedPlayer.id && s.resolved)}
            onExtendContract={() => { setSelectedPlayerId(null); setScreenTab('värvning'); setRenewDeepLinkId(selectedPlayer.id) }}
            onClose={() => setSelectedPlayerId(null)}
            game={game ?? undefined}
            recentRatings={game ? getRecentMatchRatings(game.fixtures, game.clubs, selectedPlayer.id, game.managedClubId, 5) : undefined}
            onTalkToPlayer={(choice) => handleTalk(selectedPlayer.id, choice)}
            talkFeedback={talkFeedback}
            onLeadershipAction={(action) => { handleLeadership(selectedPlayer.id, action); return null }}
            leadershipFeedback={leadershipFeedback}
          />

          {/* Karaktärsspelare badge */}
          {selectedPlayer.isCharacterPlayer && selectedPlayer.trait && (() => {
            const meta = TRAIT_META[selectedPlayer.trait]
            const ls = selectedPlayer.loyaltyScore ?? 5
            return (
              <div style={{
                margin: '0 14px 12px', padding: '10px 14px',
                background: 'var(--bg-elevated)', border: `1px solid ${meta.color}44`,
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 22 }}>{meta.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, letterSpacing: '0.5px' }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Lojalitet {ls}/10
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{meta.description}</p>
                </div>
              </div>
            )
          })()}
          </div>{/* end card surface */}
        </div>
      )}
    </div>
  )
}
