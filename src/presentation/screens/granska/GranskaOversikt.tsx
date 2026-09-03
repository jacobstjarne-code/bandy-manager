import { useNavigate } from 'react-router-dom'
import type { SaveGame, RoundSummaryData } from '../../../domain/entities/SaveGame'
import type { Fixture, MatchEvent } from '../../../domain/entities/Fixture'
import type { Player } from '../../../domain/entities/Player'
import type { Club } from '../../../domain/entities/Club'
import type { GameEvent } from '../../../domain/entities/GameEvent'
import { MatchEventType, InboxItemType, TrainingType, WeatherCondition, CornerStrategy } from '../../../domain/enums'
import type { Weather } from '../../../domain/entities/Weather'
import { formatArenaName } from '../../../domain/utils/arenaName'
import { csColor, formatFinance } from '../../utils/formatters'
import { getRivalry } from '../../../domain/data/rivalries'
import { getCurrentLeaguePosition } from '../../../domain/services/standingsService'
import { getFormResults } from '../../utils/formUtils'
import { NEXT_MATCH_POINTER } from '../../../domain/data/nextMatchPointerText'
import { seededPick } from '../../../domain/utils/random'
import { SectionLabel } from '../../components/SectionLabel'
import { ScoreBlock } from '../../components/primitives'
import { generateSilentMatchReport } from '../../../domain/services/silentMatchReportService'
import { generateQuickSummary, getStartedTiredDirection, getSecondHalfKvittoDir, findRotationSubstituteRating, resolvedWithAssertedLabel, rankManagerChoiceLog } from './helpers'
import { DecisionCard } from '../../components/DecisionCard'
import { getEffectiveDecisionMode } from '../../../domain/services/decisionTierService'
import { Swords } from 'lucide-react'
import { getCriticalEventsForGranska, getPlayerEventsForGranska, classifyEventNature } from '../../../domain/services/granskaEventClassifier'
import { ReaktionerKort } from '../../components/granska/ReaktionerKort'
import { HALFTIME_LABELS, HALFTIME_OUTCOMES, LINEUP_ROTATION_OUTCOMES, STARTED_TIRED_OUTCOMES, CAPTAIN_OUTCOMES, LEADERSHIP_OUTCOMES, PEP_TALK_HOLD_KVITTO, PRATA_KVITTO } from '../../../domain/data/managerKvittoText'
import type { KvittoOutcomeDir, CaptainContext } from '../../../domain/data/managerKvittoText'
import type { MatchTypeAxes } from '../../../domain/services/matchTypeAxes'
import { visasFor } from '../../../domain/services/granskaSectionRegistry'
import { deriveTurneringslageMode, getTurneringslageText } from '../../../domain/services/turneringslageService'
import { deriveKapitelPunktKind } from '../../../domain/services/kapitelPunktService'
import { KapitelPunkt } from '../../components/granska/KapitelPunkt'

const TRAINING_LABEL: Record<string, string> = {
  [TrainingType.Skating]: 'Skridskoteknik', [TrainingType.BallControl]: 'Bollkontroll',
  [TrainingType.Passing]: 'Passningsspel', [TrainingType.Shooting]: 'Avslut',
  [TrainingType.Defending]: 'Försvarsspel', [TrainingType.CornerPlay]: 'Hörnor',
  [TrainingType.Physical]: 'Fysik', [TrainingType.Tactical]: 'Taktik',
  [TrainingType.Recovery]: 'Återhämtning', [TrainingType.MatchPrep]: 'Matchförberedelse',
}

/**
 * A1 — flavor-radens text. Straffavgjord match (bara cup/slutspel sätter penResult)
 * får egen label FÖRE margin-logiken, annars hade en straffseger 4–4 hamnat i kryss-grenen.
 * Ren funktion → enhetstestbar (straff-guard + att ligamatch aldrig läcker straff-text).
 *
 * GRANSKA DEL 4 steg 3 (2026-08-11): isNeutralVenue slår av "hemmaseger"/
 * "bortaseger"-svansen. Matrisens rad för Resultat-hero flaggade den som fel
 * på neutral plan (finalhelgen, SM-final) — det finns inget "hemma" att vinna
 * på Studenternas IP eller i Bollnäs. Default false, ingen befintlig
 * anropssida (liga, alltid hemmaplan-koncept) påverkas.
 */
export function granskaFlavorText(args: {
  penResult?: { home: number; away: number }
  won: boolean
  lost: boolean
  isHome: boolean
  homeScore?: number
  awayScore?: number
  isNeutralVenue?: boolean
}): string {
  const { penResult, won, lost, isHome, homeScore, awayScore, isNeutralVenue } = args
  if (penResult) return won ? '🎯 Straffseger' : '🎯 Förlust på straffar'
  const myScore = isHome ? (homeScore ?? 0) : (awayScore ?? 0)
  const theirScore = isHome ? (awayScore ?? 0) : (homeScore ?? 0)
  const margin = myScore - theirScore
  const totalGoals = (homeScore ?? 0) + (awayScore ?? 0)
  const flavor = won
    ? margin >= 3 ? '💪 Dominant insats' : totalGoals >= 8 ? '🔥 Målrik historia' : margin === 1 ? '😅 Knapp seger' : '✅ Klar vinst'
    : lost
    ? margin <= -3 ? '💣 Svår dag på jobbet' : margin === -1 ? '😤 Nära men inte nog' : '❌ Klar förlust'
    : totalGoals >= 8 ? '🎢 Dramatiskt kryss' : '🤝 Rättvis poängdelning'
  const flavorTail = won && !isNeutralVenue ? ` · ${isHome ? 'hemmaseger' : 'bortaseger'}` : ''
  return `${flavor}${flavorTail}`
}

/**
 * SLUTTEST RUNDA 4 (2026-08-08, punkt 3): "vädret syns inte i snabbläget."
 * Live-kommentaren (matchCore.ts, mode:'full') nämner väder ofta (RUNDA 3
 * punkt 4: 100% textträff i live-läge) — men mode:'fast' (snabbsimulera
 * omgången) genererar ALDRIG kommentartext, väder inkluderat. Den som
 * spelar snabbsimulerat har alltså aldrig sett att vädret påverkade
 * matchen. Granska läser sparad MatchWeather-data direkt (inte
 * livekommentaren) — funkar därför oavsett simuleringsläge.
 *
 * Villkorsordning: nederbörds-/siktcondition (Thaw/HeavySnow/LightSnow/Fog)
 * kollas FÖRE extremkyla — "vinner nederbörden" vid samtidiga villkor
 * (kyla + snöfall). Ren funktion → enhetstestbar.
 */
export function getGranskaWeatherEffectLine(weather: Weather | undefined): string | null {
  if (!weather) return null
  switch (weather.condition) {
    case WeatherCondition.Thaw: return 'Det regnade. Isen var knottrig hela matchen.'
    case WeatherCondition.HeavySnow: return 'Ymnigt snöfall. Bollen dog i drivorna.'
    case WeatherCondition.LightSnow: return 'Lätt snöfall över isen. Bollen gick trögare än den brukar.'
    case WeatherCondition.Fog: return 'Dimman låg tät. Långt spel var ingen idé.'
    default: break
  }
  if (weather.temperature < -15) return 'Sträng kyla. Bollen studsade hårt och händerna domnade.'
  return null
}

/**
 * §11.3 — väljer laddningstyp för Granska-slutets framåtpekare, prioordning
 * derby > kalenderankare > motståndarform > tabellnärhet > neutral. Ren
 * funktion → enhetstestbar. Tar redan uppslagna/beräknade värden (inte
 * game/fixtures direkt) så testfallen slipper bygga upp full spelstate.
 * oppFormLast5 måste vara EXAKT 5 element för att opp_hot/opp_cold ska
 * kunna triggas — ett formpåstående får aldrig baseras på färre matcher
 * än vad texten antyder ("senaste 5").
 */
export function selectNextMatchPointerType(args: {
  isDerby: boolean
  calendarFlag: 'annandag' | 'nyar' | 'cupfinalhelg' | null
  oppFormLast5: Array<'V' | 'O' | 'F'>
  managedPosition: number | null
  oppPosition: number | null
}): keyof typeof NEXT_MATCH_POINTER {
  const { isDerby, calendarFlag, oppFormLast5, managedPosition, oppPosition } = args
  if (isDerby) return 'derby'
  if (calendarFlag) return calendarFlag
  if (oppFormLast5.length === 5) {
    const wins = oppFormLast5.filter(r => r === 'V').length
    const losses = oppFormLast5.filter(r => r === 'F').length
    if (wins >= 4) return 'opp_hot'
    if (losses >= 4) return 'opp_cold'
  }
  if (managedPosition != null && oppPosition != null && Math.abs(managedPosition - oppPosition) <= 1) {
    return 'tabell_nara'
  }
  return 'neutral'
}

/**
 * O16 — GRANSKA SOM LÄRANDEYTA (DOM_GRANSKA_LARANDEYTA_2026-08-17.md).
 * Kandidat 2 av fyra i domen — den enda med siffror i MatchResult redan idag
 * (cornerStrategy → matchCore.ts:462/675/1195, isCornerGoal på MatchEvent).
 * De andra tre (press→återvinningar, tempo→kondition sista tjugo,
 * formation→målens ursprung) kräver ny instrumentering och är INTE byggda —
 * se SLUTTEST_KO.md O16.
 *
 * Formen är låst (domen, "Texten"): vad du valde, vad som hände. Ingen
 * bindestreckad slutsats, aldrig beröm/tillrättavisning — bara vad som
 * mättes. Returnerar null när ingen hörna togs alls (0 hörnor = ingen
 * koppling att visa, domen: "Kan matchmotorn inte peka på ett samband ska
 * sektionen inte renderas").
 *
 * Svenska namn på cornerStrategy-värdena lånade rakt av matchCore.ts:457-462
 * kommentar ("säkra hörnor = omställning, aggressiva = metodiskt set-piece").
 * Ren funktion → enhetstestbar.
 *
 * fixture.report.cornersHome/cornersAway läses av ANROPAREN (som beräknar
 * totalCorners innan den skickas in hit) — denna funktion läser bara sina
 * egna redan-verifierade parametrar.
 *
 * @cites cornerStrategy, totalCorners, cornerGoalMinutes
 */
export function dittValCornerText(args: {
  cornerStrategy: CornerStrategy
  totalCorners: number
  /** Minuter för mål gjorda av DEN STYRDA klubben på hörna, denna match. */
  cornerGoalMinutes: number[]
}): string | null {
  const { cornerStrategy, totalCorners, cornerGoalMinutes } = args
  if (totalCorners <= 0) return null

  const strategyLabel = cornerStrategy === CornerStrategy.Safe ? 'säkra hörnor'
    : cornerStrategy === CornerStrategy.Aggressive ? 'aggressiva hörnor'
    : 'vanliga hörnor'
  const chose = `Du valde ${strategyLabel}.`

  const CARDINAL: Record<number, string> = {
    2: 'två', 3: 'tre', 4: 'fyra', 5: 'fem', 6: 'sex', 7: 'sju', 8: 'åtta', 9: 'nio', 10: 'tio', 11: 'elva', 12: 'tolv',
  }
  const cardinal = (n: number) => CARDINAL[n] ?? String(n)

  if (cornerGoalMinutes.length === 0) {
    return totalCorners === 1
      ? `${chose} Den gick inte in.`
      : `${chose} Ingen av de ${cardinal(totalCorners)} gick in.`
  }

  if (cornerGoalMinutes.length === 1) {
    const half = cornerGoalMinutes[0] < 45 ? 'första halvlek' : 'andra halvlek'
    return `${chose} Det gav ett mål i ${half}.`
  }

  return `${chose} Det gav ${cardinal(cornerGoalMinutes.length)} mål.`
}

/** Grupp-avdelare: ⬩ + label + hairline. */
function GroupDivider({ label, style }: { label: string; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 2px 6px', ...style }}>
      <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
        ⬩ {label}
      </span>
      <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

interface GranskaOversiktProps {
  game: SaveGame
  fixture: Fixture | undefined
  homeClub: Club | undefined
  awayClub: Club | undefined
  isHome: boolean
  won: boolean
  lost: boolean
  resultColor: string
  resultLabel: string
  potm: Player | null
  potmRating: number | null | undefined
  penResult: { home: number; away: number } | undefined
  keyMoments: MatchEvent[]
  pendingEvents: GameEvent[]
  resolvedEventIds: Set<string>
  chosenLabels: Record<string, string>
  fadeIn: (i: number) => React.CSSProperties
  onChoice: (eventId: string, choiceId: string, choiceLabel: string) => void
  onResolve: (ids: string[]) => void
  rs: RoundSummaryData | null
  standing: { clubId: string; position: number } | undefined
  standingBefore: number | null
  financesDelta: number
  csDelta: number
  cs: number
  otherResults: Fixture[]
  onOpenReport: () => void
  axes: MatchTypeAxes
}

/**
 * @cites findRotationSubstituteRating, fixture.report.playerRatings
 */
export function GranskaOversikt({
  game, fixture, homeClub, awayClub, isHome,
  won, lost, resultColor, resultLabel, potm, potmRating, penResult,
  keyMoments, pendingEvents, resolvedEventIds, chosenLabels, fadeIn, onChoice, onResolve,
  rs, standing, standingBefore, financesDelta, csDelta, cs, otherResults, onOpenReport, axes,
}: GranskaOversiktProps) {
  const navigate = useNavigate()
  const leaguePosition = getCurrentLeaguePosition(game.managedClubId, game)
  const getClubShort = (id: string) => game.clubs.find(c => c.id === id)?.shortName ?? game.clubs.find(c => c.id === id)?.name ?? '?'
  const latestTraining = (game.trainingHistory ?? []).slice(-1)[0]
  const trainingLabel = latestTraining ? TRAINING_LABEL[latestTraining.focus.type] ?? 'Träning' : null

  // GRANSKA DEL 4 steg 3 (2026-08-11): tre sektioner hissade till lokala
  // variabler (istf inline i huvud-JSX:en) så avskeds-tributegrenen nedan kan
  // återanvända dem ordagrant — samma innehåll, EN källa, inte en kopia som
  // kan glida isär från originalet över tid.
  const resultatHeroCard = fixture && (
        <div className="card-sharp card-tap" onClick={onOpenReport} style={{ margin: '0 0 3px', position: 'relative', cursor: 'pointer', ...fadeIn(0) }}>
          <span style={{ position: 'absolute', top: 13, right: 14, fontSize: 16, color: 'var(--accent)' }}>›</span>
          <div style={{ padding: '16px 14px 16px', textAlign: 'center' }}>
            <SectionLabel style={{ marginBottom: 10 }}><Swords size={12} />{' '}MATCHEN</SectionLabel>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, textAlign: 'left' }}>{homeClub?.shortName ?? homeClub?.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, textAlign: 'right' }}>{awayClub?.shortName ?? awayClub?.name}</span>
            </div>

            {/* DB-3: hero-score → ScoreBlock (en primitiv för alla resultat i UI-flöde).
                GRANSKA DEL 4 steg 3: trophy-ton — gold-variant reserverad för SM-final/
                Cup-final (design-system/DESIGN-DECISIONS.md: "Gold-regel"), tvingad här
                vid anropssidan, inte i komponenten. Bara på VUNNEN final — en förlorad
                final är fortfarande en förlust, inte guld. */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <ScoreBlock
                score={`${fixture.homeScore}–${fixture.awayScore}`}
                variant={axes.skede === 'final' && won ? 'gold' : won ? 'win' : lost ? 'loss' : 'draw'}
                size="hero"
                light
              />
            </div>

            {(fixture.wentToOvertime || penResult) && (
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {penResult ? `Straffar: ${penResult.home}–${penResult.away}` : 'Avgjort i förlängning'}
              </p>
            )}

            <span style={{
              display: 'inline-block', padding: '4px 14px', borderRadius: 99,
              background: won ? 'color-mix(in srgb, var(--success) 12%, transparent)' : lost ? 'color-mix(in srgb, var(--danger) 12%, transparent)' : 'rgba(245,241,235,0.08)',
              border: `1px solid ${won ? 'color-mix(in srgb, var(--success) 30%, transparent)' : lost ? 'color-mix(in srgb, var(--danger) 30%, transparent)' : 'rgba(245,241,235,0.2)'}`,
              color: resultColor, fontSize: 11, fontWeight: 700, letterSpacing: '1px', marginBottom: 8,
            }}>
              {resultLabel}
            </span>

            {potm && potmRating != null && (
              <p style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>⭐ {potm.firstName} {potm.lastName} · {potmRating.toFixed(1)}</p>
            )}
            {fixture.attendance != null && (
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>🏟️ {fixture.attendance} åskådare</p>
            )}
            {/* SLUTTEST RUNDA 4 (punkt 2): fixture.arenaName läses FÖRST (satt av
                cupService.ts/playoffService.ts för neutral-plan-matcher — "Sävstaås
                IP"/"Studenternas IP", redan kompletta namn, INTE genom
                formatArenaName som skulle lägga till " arena"). Faller tillbaka på
                hemmaklubbens egen arena (formatArenaName som innan) när fixturen
                inte har ett eget namn. Tidigare version visade INGEN rad alls för
                neutral-plan-matcher (!fixture.isNeutralVenue-gaten) sedan RUNDA 3
                satte isNeutralVenue även på cupens semi/final. */}
            {fixture.arenaName ? (
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>
                Spelades på {fixture.arenaName}{fixture.venueCity ? ` i ${fixture.venueCity}` : ''}
              </p>
            ) : homeClub?.arenaName && (
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>Spelades på {formatArenaName(homeClub.arenaName)}</p>
            )}

            {/* Match summary */}
            {(() => {
              if (game.preferredMatchMode === 'silent') {
                const homeClubName = game.clubs.find(c => c.id === fixture.homeClubId)?.name ?? ''
                const awayClubName = game.clubs.find(c => c.id === fixture.awayClubId)?.name ?? ''
                const report = generateSilentMatchReport(fixture, homeClubName, awayClubName, game.managedClubId)
                return (
                  <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', textAlign: 'left' }}>
                    {report.split('\n\n').map((para, i) => (
                      <p key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: i < 2 ? 10 : 0 }}>{para}</p>
                    ))}
                  </div>
                )
              }
              const summary = generateQuickSummary(fixture, isHome, game.players, axes.tavlingstyp, axes.skede)
              return summary ? (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 12, padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', textAlign: 'left' }}>
                  {summary}
                </p>
              ) : null
            })()}

            {/* SLUTTEST RUNDA 4 (punkt 3): väderrad — syns oavsett simuleringsläge,
                se getGranskaWeatherEffectLine ovan för rotorsak. */}
            {(() => {
              const weatherLine = getGranskaWeatherEffectLine(
                game.matchWeathers?.find(mw => mw.fixtureId === fixture.id)?.weather
              )
              return weatherLine ? (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 6 }}>
                  {weatherLine}
                </p>
              ) : null
            })()}

            {/* Flavor-rad — kort sammanfattning, border-top, klipps aldrig mot underkanten */}
            {(() => {
              const flavorText = granskaFlavorText({ penResult, won, lost, isHome, homeScore: fixture.homeScore, awayScore: fixture.awayScore, isNeutralVenue: fixture.isNeutralVenue })
              // penResult-grenen har egen färglogik (straff → alltid won/lost, ingen neutral)
              if (penResult) {
                return (
                  <div style={{ marginTop: 12, paddingTop: 11, borderTop: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: won ? 'var(--success)' : 'var(--danger)' }}>
                    {flavorText}
                  </div>
                )
              }
              return (
                <div style={{ marginTop: 12, paddingTop: 11, borderTop: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: won ? 'var(--success)' : lost ? 'var(--danger)' : 'var(--text-secondary)' }}>
                  {flavorText}
                </div>
              )
            })()}
          </div>
        </div>
  )

  const nyckelmomentCard = keyMoments.length > 0 && (
        <div className="card-sharp" style={{ margin: '0 0 3px', padding: '10px 12px', ...fadeIn(6) }}>
          <SectionLabel style={{ marginBottom: 8 }}>NYCKELMOMENT</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {keyMoments.map((e, i) => {
              const isHomeEvent = e.clubId === fixture?.homeClubId
              const scorer = e.playerId ? game.players.find(p => p.id === e.playerId) : null
              const scorerName = scorer ? `${scorer.firstName[0]}. ${scorer.lastName}` : '?'
              const icon = e.type === MatchEventType.Goal ? (e.isCornerGoal ? '📐' : '🥅') : '⏱️'
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: isHomeEvent ? 'flex-start' : 'flex-end', gap: 5 }}>
                  {isHomeEvent && <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 24, textAlign: 'right', flexShrink: 0 }}>{e.minute}'</span>}
                  {isHomeEvent && <span style={{ fontSize: 11 }}>{icon}</span>}
                  <span style={{ fontSize: 11, color: e.type === MatchEventType.Suspension ? 'var(--danger)' : 'var(--text-secondary)' }}>{scorerName}</span>
                  {!isHomeEvent && <span style={{ fontSize: 11 }}>{icon}</span>}
                  {!isHomeEvent && <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 24, textAlign: 'left', flexShrink: 0 }}>{e.minute}'</span>}
                </div>
              )
            })}
          </div>
        </div>
  )

  // §11.3 — Granska-slutets framåtpekare. Avslutande viskning, inget kort/rubrik.
  // ✕ bara på den säsongsavslutande finalen (slutspel+final) — en cupfinal
  // spelas i augusti, ligasäsongen fortsätter direkt efteråt, så den behåller
  // pekaren (nextFixture finns naturligt ändå). Avsked ✓ (matrisen).
  const nastaMatchPekareLine = visasFor('nastaMatchPekare', axes.tavlingstyp, axes.skede) && (() => {
    const nextFixture = game.fixtures
      .filter(f =>
        f.status !== 'completed' &&
        (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
      )
      .sort((a, b) => a.matchday - b.matchday)[0]
    if (!nextFixture) return null

    const isNextHome = nextFixture.homeClubId === game.managedClubId
    const oppId = isNextHome ? nextFixture.awayClubId : nextFixture.homeClubId
    const venue = isNextHome ? 'hemma' : 'borta'

    const nextSlot = (game.seasonCalendar ?? []).find(s => s.matchday === nextFixture.matchday)
    const calendarFlag = nextSlot?.isAnnandagen ? 'annandag' as const
      : nextSlot?.isNyarsbandy ? 'nyar' as const
      : nextSlot?.isCupFinalhelgen ? 'cupfinalhelg' as const
      : null
    // Formkollen körs på MOTSTÅNDAREN, inte managed club.
    const oppFormLast5 = getFormResults(oppId, game.fixtures, game.clubs, 5).map(r => r.result)
    const oppPosition = getCurrentLeaguePosition(oppId, game)

    const pointerType = selectNextMatchPointerType({
      isDerby: getRivalry(game.managedClubId, oppId) !== null,
      calendarFlag,
      oppFormLast5,
      managedPosition: leaguePosition,
      oppPosition,
    })

    const line = seededPick(NEXT_MATCH_POINTER[pointerType], nextFixture.matchday)
      .replaceAll('{opp}', getClubShort(oppId))
      .replaceAll('{venue}', venue)

    return (
      <p data-granska-section="nastaMatchPekare" style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--text-muted)', textAlign: 'center', marginTop: 14 }}>
        {line}
      </p>
    )
  })()

  // GRANSKA DEL 4 steg 3 (2026-08-11): ett första försök att gren:a av avsked
  // som en helt egen return tidigt i funktionen visade sig DROPPA innehåll
  // matrisen inte alls ✕:ar för avsked — Media (⚠, kvar), NY SKADA-kortet,
  // kritiska events, presskonferens/CS-press/domarmöte (event-drivna
  // beslutsprompter helt utanför matrisens 12 rader). En "egen gren" som
  // tystar en väntande presskonferens är en regression, inte en förbättring.
  // Reverterat till EN return — registret (steg 2) döljer redan korrekt de
  // sju ✕-sektionerna (Tabell/Form/Statistik/Dina val/Omgångssammanfattning/
  // Andra matcher/Scouting) för avsked, verifierat i browser. En fullständig
  // fysisk avgrening (hissa även critical events/press/CS-press/domarmöte/
  // Media/NY SKADA) är görbar men är sex block till att flytta rätt utan att
  // tappa något — rapporterat till Jacob som en separat avvägning istf gjort
  // under tidspress här.
  // GRANSKA CRESCENDO (2026-08-17) — KapitelPunkt. En rad i registret
  // (granskaSectionRegistry.ts), avsked är ETT av de fem innehållen, inte en
  // egen gren — se kommentaren ovan om varför den fysiska avgrening som
  // provades tidigare reverterades.
  const farewellPlayer = fixture?.farewellMatchForPlayerId
    ? game.players.find(p => p.id === fixture.farewellMatchForPlayerId)
    : undefined
  const kapitelPunktKind = visasFor('kapitelPunkt', axes.tavlingstyp, axes.skede)
    ? deriveKapitelPunktKind(axes.tavlingstyp, axes.skede, won, farewellPlayer != null)
    : null

  return (
    <>
      <GroupDivider label="Resultatet" style={{ marginTop: 2 }} />
      {/* Result hero — tappbar → Analys (händelsetidslinje + insikter) */}
      {resultatHeroCard}

      {/* Kapitelpunkt — efter resultatblocket, före Turneringsläge/statistik.
          data-granska-section: matchtypsmatrisgrinden (post 20) läser detta
          som "ankaret" — det enda av matrisens nio matchtypsberoende
          sektioner vars NÄRVARO asserteras, inte bara frånvaro (kapitelPunkt-
          Kind är deterministisk när visasFor säger ✓, se kapitelPunktService.
          ts — ingen data-lucka som tabell/form/statistik kan gömma bakom). */}
      {kapitelPunktKind && (
        <div data-granska-section="kapitelPunkt">
          <KapitelPunkt
            kind={kapitelPunktKind}
            avsked={farewellPlayer ? {
              firstName: farewellPlayer.firstName,
              lastName: farewellPlayer.lastName,
              games: farewellPlayer.careerStats.totalGames,
              goals: farewellPlayer.careerStats.totalGoals,
            } : undefined}
          />
        </div>
      )}

      {/* Resultat-strip — tabell + form (två kolumner). GRANSKA DEL 4 steg 2:
          var och en gated individuellt — cup döljer båda, slutspel behåller
          form utom på final, avsked/final döljer båda. Se
          granskaSectionRegistry.ts. Aldrig ett tomt/gråtonat kort (DS-regel 12) —
          faller hela stripen bort renderas ingenting alls. */}
      {standing && (() => {
        const showTabell = visasFor('tabell', axes.tavlingstyp, axes.skede)
        const showForm = visasFor('form', axes.tavlingstyp, axes.skede)
        if (!showTabell && !showForm) return null
        const form = getFormResults(game.managedClubId, game.fixtures, game.clubs).slice(-5)
        const dotColor = (r: 'V' | 'O' | 'F') => r === 'V' ? 'var(--success)' : r === 'F' ? 'var(--danger)' : 'var(--text-muted)'
        return (
          <div style={{ display: 'grid', gridTemplateColumns: showTabell && showForm ? '1fr 1fr' : '1fr', gap: 6, margin: '0 0 3px', ...fadeIn(1) }}>
            {showTabell && (
              <div className="card-sharp card-tap" onClick={() => navigate('/game/tabell')} style={{ padding: '10px 12px', cursor: 'pointer' }}>
                <SectionLabel style={{ marginBottom: 7 }}>📊 TABELL</SectionLabel>
                <span className="h-num-lg" style={{ color: 'var(--text-primary)' }}>
                  {leaguePosition ?? '—'}{leaguePosition ? ':a' : ''}
                </span>
                {standingBefore && leaguePosition && standingBefore !== leaguePosition && (
                  <span style={{ fontSize: 11, marginLeft: 6, color: standingBefore > leaguePosition ? 'var(--success)' : 'var(--danger)' }}>
                    {standingBefore > leaguePosition ? '↑' : '↓'}
                  </span>
                )}
              </div>
            )}
            {showForm && (
              <div className="card-sharp" style={{ padding: '10px 12px' }}>
                <SectionLabel style={{ marginBottom: 7 }}>📈 FORM</SectionLabel>
                <div style={{ display: 'flex', gap: 4 }}>
                  {form.length === 0
                    ? <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Inga matcher ännu</span>
                    : form.map((r, i) => ( // ds-exempt: V/O/F-bokstav i dynamiskt färgad form-dot
                      <span key={i} style={{ width: 16, height: 16, borderRadius: 4, background: dotColor(r.result), color: 'var(--text-light)', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.result}</span>
                    ))}
                </div>
              </div>
            )}
          </div>
        )
      })()}

      {/* Turneringsläge — GRANSKA DEL 4 steg 5. Enda sektionen matrisen lägger
          TILL, inte tar bort — täcker live-luckan där en cupsemifinal-förlust
          aldrig nämnde "cup" en enda gång på skärmen. Text från Opus
          (2026-08-12), struktur/derivering Code:s (turneringslageService.ts,
          ingen ny mekanik). Visas bara när ett läge faktiskt kan avgöras
          (se deriveTurneringslageMode) — annars ingen rad (No false empty
          states, DS-regel 12). */}
      {(() => {
        // 2026-08-17 (GRANSKA CRESCENDO, upptäckt vid browser-verifiering):
        // vunnen_final/forlorad_final säger ORDAGRANT samma sak som KapitelPunkt
        // (båda läser samma "Svenska mästare."/"Cupen är er."-text) på exakt
        // samma skärm — finalens EGEN Granska-sida. Utan denna spärr syntes
        // budskapet två gånger i rad. Turneringslägets övriga lägen
        // (ut_forstarunda/ut_kvart/ut_semi/vidare_final) hör hemma på en ANNAN
        // matchs Granska-sida (den som slog ut/tog laget vidare) där
        // kapitelPunktKind alltid är null — ingen krock där.
        if (kapitelPunktKind && kapitelPunktKind !== 'avsked') return null
        const mode = deriveTurneringslageMode(game, axes.tavlingstyp)
        if (!mode) return null
        return (
          <div className="card-sharp" style={{ margin: '0 0 3px', padding: '10px 12px' }}>
            <SectionLabel style={{ marginBottom: 6 }}>TURNERINGSLÄGE</SectionLabel>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {getTurneringslageText(mode, axes.tavlingstyp)}
            </p>
          </div>
        )
      })()}

      {/* Statistik — GRANSKA DEL 4 steg 2: ✕ på avsked (matchmallen viker för hyllningen). */}
      {fixture?.report && visasFor('statistik', axes.tavlingstyp, axes.skede) && (
        <div className="card-sharp" style={{ margin: '0 0 3px', padding: '10px 12px', ...fadeIn(1) }}>
          <SectionLabel style={{ marginBottom: 8 }}>STATISTIK</SectionLabel>
          {[
            { label: 'Skott', home: fixture.report.shotsHome, away: fixture.report.shotsAway },
            { label: 'Hörnor', home: fixture.report.cornersHome, away: fixture.report.cornersAway },
            { label: 'Bollinnehav', home: fixture.report.possessionHome, away: fixture.report.possessionAway, suffix: '%' },
            ...(fixture.report.penaltiesHome + fixture.report.penaltiesAway > 0 ? [{ label: 'Straffar', home: fixture.report.penaltiesHome, away: fixture.report.penaltiesAway }] : []),
          ].map(stat => {
            const total = stat.home + stat.away
            const homeW = total > 0 ? (stat.home / total) * 100 : 50
            return (
              <div key={stat.label} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{stat.home}{stat.suffix ?? ''}</span>
                  <span className="h-label" style={{ marginBottom: 0 }}>{stat.label.toUpperCase()}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{stat.away}{stat.suffix ?? ''}</span>
                </div>
                <div style={{ display: 'flex', height: 3, borderRadius: 2, overflow: 'hidden', gap: 1 }}>
                  <div style={{ flex: homeW, background: isHome ? 'var(--accent)' : 'var(--border)' }} />
                  <div style={{ flex: 100 - homeW, background: !isHome ? 'var(--accent)' : 'var(--border)' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Critical events — max 3, kräver val. GRANSKA DEL 4 (2026-08-12):
          registrerad i granskaSectionRegistry.ts (✓ i alla lägen — en väntande
          transferbud-decision försvinner inte för att matchen var en final). */}
      {visasFor('criticalEvents', axes.tavlingstyp, axes.skede) && (() => {
        const criticalEvents = getCriticalEventsForGranska(pendingEvents).slice(0, 3)
        const playerEvents = getPlayerEventsForGranska(pendingEvents)
        const inboxOnlyCount = pendingEvents.filter(e => !e.resolved && classifyEventNature(e) === 'inbox-only').length
        return (
          <>
            {criticalEvents.map((event, ei) => {
              const resolved = resolvedWithAssertedLabel(event.id, resolvedEventIds, chosenLabels)
              const relatedPlayer = event.relatedPlayerId ? game.players.find(p => p.id === event.relatedPlayerId) : null
              const relatedClub = event.relatedClubId ? game.clubs.find(c => c.id === event.relatedClubId) : null
              const tags = [
                ...(relatedPlayer ? [{ label: `${relatedPlayer.firstName} ${relatedPlayer.lastName} · Styrka ${Math.round(relatedPlayer.currentAbility)}`, tone: 'accent' as const }] : []),
                ...(relatedClub ? [{ label: relatedClub.name, tone: 'ice' as const }] : []),
              ]
              return (
                <DecisionCard
                  key={event.id}
                  style={fadeIn(2 + ei)}
                  mode={getEffectiveDecisionMode(event)}
                  label={event.sender ? `${event.sender.name}, ${event.sender.role}` : 'Händelse'}
                  title={event.title}
                  body={event.body}
                  tags={tags}
                  resolved={resolved}
                  chosenLabel={chosenLabels[event.id]}
                  choices={event.choices}
                  onChoose={(id, label) => onChoice(event.id, id, label)}
                />
              )
            })}
            {playerEvents.length > 0 && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 12px 6px' }}>
                {playerEvents.length} spelar{playerEvents.length > 1 ? 'händelser' : 'händelse'} i Spelare-fliken
              </p>
            )}
            {inboxOnlyCount > 0 && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 12px 6px' }}>
                {inboxOnlyCount} notis{inboxOnlyCount === 1 ? '' : 'er'} i inboxen
              </p>
            )}
          </>
        )
      })()}

      {/* Presskonferens — tidskritisk, direkt efter events. GRANSKA DEL 4
          (2026-08-12): registrerad, ✓ i alla lägen. */}
      {visasFor('pressConference', axes.tavlingstyp, axes.skede) && (() => {
        const pc = game.pendingPressConference
        if (!pc) return null
        // GRANSKA DEL 4 (2026-08-11): strukturerat fält (pc.sender) istf
        // title-prefix-parse — pc.title bär aldrig 🎤-prefixet (generatorn
        // emitterar det aldrig), så regexen var en no-op sedan tidigare.
        const pcTitle = pc.sender ? (pc.sender.role ? `${pc.sender.name}, ${pc.sender.role}` : pc.sender.name) : undefined
        return (
          <DecisionCard
            style={fadeIn(4)}
            accent
            label="🎤 PRESSKONFERENSEN"
            subtitle={pcTitle}
            body={pc.body}
            bodyAsQuote
            resolved={resolvedWithAssertedLabel(pc.id, resolvedEventIds, chosenLabels)}
            chosenLabel={chosenLabels[pc.id]}
            choices={pc.choices}
            onChoose={(id, label) => onChoice(pc.id, id, label)}
          />
        )
      })()}

      {/* C-B1: CS-pressfråga. GRANSKA DEL 4 (2026-08-12): registrerad, ✓ i alla lägen. */}
      {visasFor('csPress', axes.tavlingstyp, axes.skede) && (() => {
        const cp = game.pendingCSPress
        if (!cp) return null
        const journalist = game.journalist
        return (
          <DecisionCard
            style={fadeIn(4)}
            accent
            label="📰 PRESSFRÅGA"
            subtitle={journalist ? `${journalist.name} · ${journalist.outlet}` : undefined}
            body={cp.body}
            bodyAsQuote
            resolved={resolvedWithAssertedLabel(cp.id, resolvedEventIds, chosenLabels)}
            chosenLabel={chosenLabels[cp.id]}
            choices={cp.choices}
            onChoose={(id, label) => onChoice(cp.id, id, label)}
          />
        )
      })()}

      {/* Domarmöte. GRANSKA DEL 4 (2026-08-12): registrerad, ✓ i alla lägen. */}
      {visasFor('refereeMeeting', axes.tavlingstyp, axes.skede) && (() => {
        const rm = game.pendingRefereeMeeting
        if (!rm) return null
        return (
          <DecisionCard
            style={fadeIn(4)}
            label="🏟️ DOMARENS LOCKER ROOM"
            subtitle={rm.sender?.name}
            body={rm.body}
            bodyAsQuote
            resolved={resolvedWithAssertedLabel(rm.id, resolvedEventIds, chosenLabels)}
            chosenLabel={chosenLabels[rm.id]}
            choices={rm.choices}
            onChoose={(id, label) => onChoice(rm.id, id, label)}
          />
        )
      })()}

      {/* GRANSKA DEL 4 (2026-08-12): registrerad, ✓ i alla lägen. */}
      {visasFor('reaktioner', axes.tavlingstyp, axes.skede) && <ReaktionerKort pendingEvents={pendingEvents} onResolve={onResolve} />}

      {/* Media */}
      {(() => {
        const headlineItem = game.inbox
          .filter(i => i.type === InboxItemType.MediaEvent &&
            (!fixture || i.id === `inbox_headline_md${fixture.matchday}_${game.currentSeason}`))
          .sort((a, b) => b.date.localeCompare(a.date))[0]
        if (!headlineItem) return null
        const journalist = game.journalist
        const personaLabel = journalist?.persona === 'critical' ? 'Kritisk'
          : journalist?.persona === 'supportive' ? 'Stödjande'
          : journalist?.persona === 'sensationalist' ? 'Sensationalistisk'
          : journalist?.persona === 'analytical' ? 'Analytisk' : null
        return (
          <div className="card-sharp" style={{
            margin: '0 0 3px', padding: '10px 12px',
            borderLeft: '2px solid var(--accent)',
            borderRadius: '0 8px 8px 0',
            ...fadeIn(5),
          }}>
            <SectionLabel style={{ marginBottom: 6 }}>📰 MEDIA</SectionLabel>
            {journalist && (
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                {journalist.name} · {journalist.outlet}{personaLabel ? ` · ${personaLabel}` : ''}
              </p>
            )}
            <p className="h-quote" style={{ color: 'var(--text-primary)' }}>
              {/* Fynd 3: granska-varianten av rubriken (samma händelse, egen formulering) */}
              {headlineItem.mediaVariants?.granska ?? headlineItem.title}
            </p>
          </div>
        )
      })()}

      {/* Manager kvitto — val → utfall */}
      {/* M15 — Dina val: utfallsrader (stripe + beslut + spelare + utfall + siffra) */}
      {/* GRANSKA DEL 4 steg 2: ✕ på avsked — "ingen taktik-obduktion" på en hyllning. */}
      {visasFor('dinaVal', axes.tavlingstyp, axes.skede) && (() => {
        const log = fixture?.report?.managerChoiceLog
        if (!log || log.length === 0) return null
        const kvittoDir: KvittoOutcomeDir = won ? 'good' : lost ? 'bad' : 'neutral'
        // PÅSTÅENDEKARTAN (2026-08-24): pausbeslut (halftime_tactic/pep_talk)
        // bedöms mot andra halvlekens faktiska målskillnad, inte helmatchens
        // resultat — se helpers.ts:s getSecondHalfKvittoDir.
        const secondHalfKvittoDir = getSecondHalfKvittoDir(fixture, game.managedClubId, kvittoDir)
        const seed = (fixture?.homeScore ?? 0) + (fixture?.awayScore ?? 0)
        type OutcomeRow = {
          stripe: 'good' | 'neutral' | 'bad'
          heading: string
          playerName: string
          outcome: string
          value: string
          valueLabel: string
          /** 4.8 (andra halvan): attribution när laget kom från auto-uttagning, inte spelarens val. */
          note?: string
        }
        const rows: OutcomeRow[] = []
        const findPlayer = (id?: string) => id ? game.players.find(p => p.id === id) : undefined

        // GPT-fynd 2026-09-03: rangordna FÖRE fyra-begränsningen — en
        // managerhandling (pausbeslut/kapten/rotation) får aldrig trängas
        // undan av automatiska started_tired-rader. Se rankManagerChoiceLog.
        for (const entry of rankManagerChoiceLog(log)) {
          const i = rows.length
          if (i >= 4) break
          if (entry.type === 'halftime_tactic') {
            const key = entry.detail === 'lowered_tempo' ? 'lugna'
              : entry.detail === 'increased_pressure' ? 'pressa'
              : entry.detail === 'player_talk' ? 'prata'
              : null
            if (!key) continue
            const stripe: OutcomeRow['stripe'] = secondHalfKvittoDir === 'good' ? 'good' : secondHalfKvittoDir === 'bad' ? 'bad' : 'neutral'
            // H2-uppföljning (5c9a7a8, 2026-08-24), Jacobs dom: 'prata' är
            // fast text (PRATA_KVITTO), inte en good/bad/neutral-pool.
            // Mekaniken (applyHalftimeDecision) ger samma +12 moral oavsett
            // andra halvlekens utfall — en utfallsberoende text var aldrig
            // sann för just det här valet. HALFTIME_OUTCOMES.prata kvar i
            // managerKvittoText.ts (superseterad här, inte raderad).
            const outcome = key === 'prata' ? PRATA_KVITTO : HALFTIME_OUTCOMES[key][secondHalfKvittoDir][(seed + i) % HALFTIME_OUTCOMES[key][secondHalfKvittoDir].length]
            rows.push({
              stripe, heading: HALFTIME_LABELS[key], playerName: '',
              outcome,
              value: secondHalfKvittoDir === 'good' ? '✓' : secondHalfKvittoDir === 'bad' ? '✗' : '—',
              valueLabel: secondHalfKvittoDir === 'good' ? 'gav effekt' : secondHalfKvittoDir === 'bad' ? 'backade' : 'neutral',
            })
          } else if (entry.type === 'pep_talk') {
            // H2-uppföljning (5c9a7a8, 2026-08-24): live-matchens paussnack
            // (pauseLean: 'push'/'calm'/'hold', Spak A). push/calm mappar
            // mot de BEFINTLIGA lugna/pressa-poolerna (samma riktning: push
            // höjer tempot precis som 'pressa', calm dämpar precis som
            // 'lugna') — ingen egen textpool finns ännu för dem specifikt.
            // 'hold' har nu fast text (PEP_TALK_HOLD_KVITTO, Jacobs dom):
            // PAUSSNACK:s egen etikett för hold är "→ oförändrat" — ingen
            // mätbar effekt att variera på, en enda rad är rätt.
            if (entry.detail === 'hold') {
              rows.push({
                stripe: 'neutral', heading: HALFTIME_LABELS.hold, playerName: '',
                outcome: PEP_TALK_HOLD_KVITTO,
                value: '—', valueLabel: 'neutral',
              })
              continue
            }
            const key = entry.detail === 'push' ? 'pressa' : entry.detail === 'calm' ? 'lugna' : null
            if (!key) continue
            const pool = HALFTIME_OUTCOMES[key][secondHalfKvittoDir]
            const stripe: OutcomeRow['stripe'] = secondHalfKvittoDir === 'good' ? 'good' : secondHalfKvittoDir === 'bad' ? 'bad' : 'neutral'
            rows.push({
              stripe, heading: HALFTIME_LABELS[key], playerName: '',
              outcome: pool[(seed + i) % pool.length],
              value: secondHalfKvittoDir === 'good' ? '✓' : secondHalfKvittoDir === 'bad' ? '✗' : '—',
              valueLabel: secondHalfKvittoDir === 'good' ? 'gav effekt' : secondHalfKvittoDir === 'bad' ? 'backade' : 'neutral',
            })
          } else if (entry.type === 'captain' && entry.playerId) {
            const player = findPlayer(entry.playerId)
            if (!player) continue
            // D2: kontext + riktning ur kaptenens matchrating (som started_tired).
            // Kontext: final → slutspel → derby → vardag (prioordning per diagnosen).
            // GRANSKA DEL 4 steg 1-rapporten: isNeutralVenue dög INTE som "är det
            // final"-tecken — cupService.ts sätter isNeutralVenue på BÅDE
            // cupsemifinalen och cupfinalen (isCupFinalWeekend = nextRound >= 3),
            // så en spelad cupsemifinal klassificerades tidigare felaktigt som
            // 'final'. axes.skede kommer ur roundNumber/bracket, inte isNeutralVenue.
            const captainContext: CaptainContext =
              axes.skede === 'final' ? 'final'
              : (axes.tavlingstyp === 'cup' || axes.tavlingstyp === 'slutspel') ? 'slutspel'
              : getRivalry(fixture?.homeClubId ?? '', fixture?.awayClubId ?? '') ? 'derby'
              : 'vardag'
            const captainRating = fixture?.report?.playerRatings[entry.playerId]
            const captainDir: KvittoOutcomeDir =
              captainRating !== undefined
                ? (captainRating >= 7 ? 'good' : captainRating <= 5 ? 'bad' : 'neutral')
                : kvittoDir
            const captainPool = CAPTAIN_OUTCOMES[captainContext][captainDir]
            const captainStripe: OutcomeRow['stripe'] = captainDir === 'good' ? 'good' : captainDir === 'bad' ? 'bad' : 'neutral'
            rows.push({
              stripe: captainStripe,
              heading: 'Kapten',
              playerName: player.lastName,
              outcome: captainPool[(seed + i) % captainPool.length],
              value: captainDir === 'good' ? '✓' : captainDir === 'bad' ? '✗' : '—',
              valueLabel: captainDir === 'good' ? 'bar laget' : captainDir === 'bad' ? 'räckte ej' : 'neutral',
            })
          } else if (entry.type === 'started_tired' && entry.playerId) {
            const player = findPlayer(entry.playerId)
            if (!player) continue
            const rating = fixture?.report?.playerRatings[entry.playerId]
            const cond = entry.detail.startsWith('condition_') ? entry.detail.slice(10) : entry.detail
            const dir: KvittoOutcomeDir = getStartedTiredDirection(cond, rating, kvittoDir)
            const pool = STARTED_TIRED_OUTCOMES[dir]
            // Rotate deterministically: 3 sentences, avoid same in sequence
            const sentences = [
              'Klarade matchen utan att sjunka.',
              'Höll måttet, ingen påverkan.',
              'Gjorde sitt, varken mer eller mindre.',
            ]
            const outcomeText = dir === 'bad'
              ? pool[(seed + i) % pool.length].replace('{spelare}', player.lastName)
              : sentences[(seed + i) % sentences.length]
            rows.push({
              stripe: dir,
              heading: 'Startade trött',
              playerName: player.lastName,
              outcome: outcomeText,
              // 4.8 (andra halvan): "Assistenten satte laget" är låst text (Jacob,
              // 2026-08-17) — visas bara när denna started_tired-post kommer från
              // simulateRemainingStep()'s auto-uttagning, aldrig vid spelarens egen
              // lineup. Skiljer "du valde detta" från "assistenten valde detta".
              ...(entry.autoSelected && { note: 'Assistenten satte laget' }),
              value: `${cond}%`,
              // 2026-08-17 (Stickiness-audit): cond är player.fitness rakt av
              // (roundProcessor.ts/matchActions.ts: `condition_${fitness}`) —
              // HÖGRE tal betyder MER kondition, inte mer trötthet. Etiketten
              // "trötthet" på samma siffra var en semantisk inversion: "0%
              // trötthet" läses som "inte alls trött", när 0 faktiskt betyder
              // helt slut. "kondition" matchar hur samma fält visas överallt
              // annars i appen (PlayerCard.tsx: "Kondition").
              valueLabel: 'kondition',
            })
          } else if (entry.type === 'bench_fit' && entry.playerId) {
            const player = findPlayer(entry.playerId)
            if (!player) continue
            // PÅSTÅENDEKARTAN omsvep (2026-08-24), VAR-fel-entitet: den vilade
            // spelaren spelade inte — kvittot ska spegla ERSÄTTARENS insats,
            // inte lagets resultat (redan dokumenterat som proxy i
            // managerKvittoText.ts). Föll tidigare tillbaka på LAGRESULTATET
            // (kvittoDir) när ersättaren inte gick att entydigt identifiera —
            // samma fel i mindre skala: texten talar fortfarande om just
            // DEN HÄR vilade spelarens ersättning, men verdikten kom nu från
            // en helt annan entitet (hela laget). Hellre ingen rad än en rad
            // om fel entitet — samma "hellre tyst"-princip som
            // findRotationSubstituteRating själv redan följer.
            const subRating = fixture ? findRotationSubstituteRating(fixture, game, entry.playerId) : undefined
            if (subRating === undefined) continue
            const dir: KvittoOutcomeDir = subRating >= 7 ? 'good' : subRating <= 5 ? 'bad' : 'neutral'
            const pool = LINEUP_ROTATION_OUTCOMES[dir]
            const stripe: OutcomeRow['stripe'] = dir === 'good' ? 'good' : dir === 'bad' ? 'bad' : 'neutral'
            rows.push({
              stripe,
              heading: 'Vilad',
              playerName: player.lastName,
              outcome: pool[(seed + i) % pool.length].replace('{spelare}', player.lastName),
              value: dir === 'good' ? '✓' : dir === 'bad' ? '✗' : '—',
              valueLabel: dir === 'good' ? 'bra val' : dir === 'bad' ? 'backade' : 'neutral',
            })
          }
        }

        // LEADERSHIP_OUTCOMES — droppad import (release-svepet 2026-07-21).
        // Läser game.leadershipActions direkt, inte managerChoiceLog: en
        // ledarskapsåtgärd (lower_tempo/mentor/private_talk/public_praise,
        // leadershipService.ts) loggas aldrig som en ManagerChoiceEntry —
        // den är en egen mekanik. Senaste åtgärden vars fönster täcker
        // matchen räknas; riktningen läses på matchutfallet (grepp om
        // GRUPPEN, inte en enskild spelares rating — matchar poolens
        // egen kommentar i managerKvittoText.ts).
        if (rows.length < 4 && fixture) {
          const relevantLeadership = (game.leadershipActions ?? [])
            .filter(a => a.fromRound <= fixture.matchday && a.expiresRound >= fixture.matchday)
            .sort((a, b) => b.fromRound - a.fromRound)[0]
          if (relevantLeadership) {
            const player = findPlayer(relevantLeadership.playerId)
            if (player) {
              const i = rows.length
              const pool = LEADERSHIP_OUTCOMES[kvittoDir]
              rows.push({
                stripe: kvittoDir,
                heading: 'Ledarskap',
                playerName: player.lastName,
                outcome: pool[(seed + i) % pool.length],
                value: kvittoDir === 'good' ? '✓' : kvittoDir === 'bad' ? '✗' : '—',
                valueLabel: kvittoDir === 'good' ? 'satte sig' : kvittoDir === 'bad' ? 'bet inte' : 'neutral',
              })
            }
          }
        }

        if (rows.length === 0) return null

        const stripeColor: Record<OutcomeRow['stripe'], string> = {
          good: 'var(--success)',
          neutral: 'var(--text-muted)',
          bad: 'var(--danger)',
        }
        const valueColor: Record<OutcomeRow['stripe'], string> = {
          good: 'var(--success)',
          neutral: 'var(--text-secondary)',
          bad: 'var(--danger-text)',
        }

        return (
          <div style={{ margin: '0 0 3px', ...fadeIn(7) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
              <SectionLabel>📋 DINA VAL · UTFALL</SectionLabel>
            </div>
            {rows.map((row, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                marginBottom: 6,
              }}>
                {/* Stripe */}
                <div style={{
                  width: 6, alignSelf: 'stretch', borderRadius: 3, flexShrink: 0,
                  background: stripeColor[row.stripe],
                }} />
                {/* Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {row.heading}
                  </div>
                  {row.playerName && (
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginTop: 1 }}>
                      {row.playerName}
                    </div>
                  )}
                  <div className="h-micro" style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                    {row.outcome}
                  </div>
                  {row.note && (
                    <div className="h-micro" style={{ color: 'var(--text-muted)', marginTop: 1, fontStyle: 'italic' }}>
                      {row.note}
                    </div>
                  )}
                </div>
                {/* Value */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    // ds-exempt: bespoke 18/800/lh1-emfasvärde, utanför .h-num-skalan (700)
                    fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, lineHeight: 1,
                    color: valueColor[row.stripe],
                  }}>
                    {row.value}
                  </div>
                  <div className="h-micro" style={{ letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 2 }}>
                    {row.valueLabel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* O16 — DITT VAL: cornerStrategy → hörnmål, den enda av fyra kandidater
          matchmotorn har siffror för idag (se DOM_GRANSKA_LARANDEYTA_2026-08-17.md
          + dittValCornerText ovan). Skild från "DINA VAL · UTFALL" ovan (den
          sektionen läser managerChoiceLog, in-match-beslut — den här läser en
          förematch-taktikinställning mot ett efterhandsmätt utfall). */}
      {visasFor('dittVal', axes.tavlingstyp, axes.skede) && fixture && (() => {
        const managedIsHome = isHome
        const cornerStrategy = managedIsHome ? fixture.homeLineup?.tactic.cornerStrategy : fixture.awayLineup?.tactic.cornerStrategy
        const totalCorners = managedIsHome ? fixture.report?.cornersHome : fixture.report?.cornersAway
        if (cornerStrategy == null || totalCorners == null) return null
        const managedClubId = managedIsHome ? fixture.homeClubId : fixture.awayClubId
        const cornerGoalMinutes = fixture.events
          .filter(e => e.type === MatchEventType.Goal && e.isCornerGoal && e.clubId === managedClubId)
          .map(e => e.minute)
        const text = dittValCornerText({ cornerStrategy, totalCorners, cornerGoalMinutes })
        if (!text) return null
        return (
          <div className="card-sharp" style={{ margin: '0 0 3px', padding: '10px 12px', ...fadeIn(7.5) }}>
            <SectionLabel style={{ marginBottom: 6 }}>DITT VAL</SectionLabel>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{text}</p>
          </div>
        )
      })()}

      {/* Nyckelmoment */}
      {nyckelmomentCard}

      {/* ── KLUBBEN ── */}
      <GroupDivider label="Klubben" />
      {/* GRANSKA DEL 4 steg 2: ✕ på final (cup eller slutspel — "inte '+2 tkr/omg' under
          guldet") och avsked. Se granskaSectionRegistry.ts. */}
      {rs && visasFor('omgangssammanfattning', axes.tavlingstyp, axes.skede) && (
        <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
          {/* Rubrikbyte 2026-08-12 (Opus): "omgång" ljög i cupmatcher — sektionen
              hette OMGÅNGSSAMMANFATTNING och Ekonomiraden bar /omg-suffixet trots
              att en cupmatch inte är en "omgång" i spelarens mening. Siffran var
              redan matchtyp-agnostiskt korrekt (samma ekonomi-tick oavsett cup/
              liga) — bara orden ljög. Ordbyte, inte ✕ (matrisen är ⚠ för cup). */}
          <SectionLabel style={{ marginBottom: 8 }}>SEDAN SIST</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/club', { state: { tab: 'ekonomi' } })}>
              {/* High 3 (Skutskär-auditen, 2026-08-22): flera hoppade omgångar
                  utan hanterad match visade tidigare en odelad summa utan
                  förklaring ("Ekonomi −100 tkr"). Perioden namnges nu när
                  raden faktiskt täcker mer än en omgång — radens klick-igenom
                  till ekonomifliken fanns redan, det som saknades var att veta
                  VILKEN period siffran gällde. */}
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                💰 Ekonomi{rs.multiWeekPeriod && rs.multiWeekPeriod.toRound > rs.multiWeekPeriod.fromRound
                  ? ` (omgång ${rs.multiWeekPeriod.fromRound}–${rs.multiWeekPeriod.toRound})`
                  : ''}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: financesDelta >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatFinance(financesDelta)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/club', { state: { tab: 'orten' } })}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🏘 Bygdens puls</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: csColor(cs) }}>
                {csDelta !== 0 ? `${rs.communityStandingBefore ?? cs} → ${cs} ${csDelta > 0 ? '↑' : '↓'}` : `${cs}`}
              </span>
            </div>
            {trainingLabel && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🏋️ Träning</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{trainingLabel}</span>
              </div>
            )}
            {rs.youthMatchResult && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => navigate('/game/club', { state: { tab: 'akademi' } })}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🎓 Akademin (P19)</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>{rs.youthMatchResult}</span>
              </div>
            )}
            {rs.newInboxCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', cursor: 'pointer' }} onClick={() => navigate('/game/inbox')}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>📬 Inkorg</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>{rs.newInboxCount} nya</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NY SKADA — eget danger-stripe-kort, bara om en ny skada finns denna omg.
          GRANSKA DEL 4 (2026-08-12): registrerad, ✓ i alla lägen. */}
      {visasFor('nySkada', axes.tavlingstyp, axes.skede) && rs?.injuries && rs.injuries.length > 0 && (
        <div className="card-sharp card-tap" onClick={() => navigate('/game/squad')}
          style={{ margin: '0 0 6px', padding: '10px 12px', borderLeft: '3px solid var(--danger)', borderRadius: '0 8px 8px 0', cursor: 'pointer' }}>
          <SectionLabel style={{ marginBottom: 6 }}>🩹 NY SKADA</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {rs.injuries.map((inj: string, i: number) => (
              <span key={i} style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger)' }}>{inj}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── OMVÄRLDEN ── */}
      {/* GRANSKA DEL 4 steg 2: Andra matcher ✕ på final (bägge — "fanns inga";
          otherResults är redan strukturellt tomt där eftersom cup-/slutspelsfinalen
          är den enda matchen den dagen, men registret gör garantin explicit istf
          att förlita sig på det). Scouting ✕ bara på den säsongsavslutande
          finalen och avsked (cupfinal håller — säsongen fortsätter). */}
      {(() => {
        const showAndraMatcher = otherResults.length > 0 && visasFor('andraMatcher', axes.tavlingstyp, axes.skede)
        const showScouting = game.inbox.some(i => i.type === InboxItemType.ScoutReport && !i.isRead) && visasFor('scouting', axes.tavlingstyp, axes.skede)
        return (showAndraMatcher || showScouting) && <GroupDivider label="Omvärlden" />
      })()}
      {otherResults.length > 0 && visasFor('andraMatcher', axes.tavlingstyp, axes.skede) && (() => {
        const rivalClubId = game.clubs.filter(c => c.id !== game.managedClubId).find(c => getRivalry(game.managedClubId, c.id))?.id ?? null
        return (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
            <SectionLabel style={{ marginBottom: 6 }}><Swords size={12} />{' '}ANDRA MATCHER</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {otherResults.map(f => {
                const homeWon = (f.homeScore ?? 0) > (f.awayScore ?? 0)
                const awayWon = (f.awayScore ?? 0) > (f.homeScore ?? 0)
                const isRivalMatch = rivalClubId && (f.homeClubId === rivalClubId || f.awayClubId === rivalClubId)
                const isDraw = !homeWon && !awayWon
                const blockVariant = isRivalMatch ? 'derby' : isDraw ? 'draw' : 'subtle'
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ flex: 1, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: homeWon ? 600 : 400, color: homeWon ? 'var(--text-primary)' : 'var(--text-secondary)', textAlign: 'right' }}>{isRivalMatch && f.homeClubId === rivalClubId ? '🔥 ' : ''}{getClubShort(f.homeClubId)}</span>
                    <ScoreBlock score={`${f.homeScore}–${f.awayScore}`} variant={blockVariant} light compact />
                    <span style={{ flex: 1, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: awayWon ? 600 : 400, color: awayWon ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{isRivalMatch && f.awayClubId === rivalClubId ? '🔥 ' : ''}{getClubShort(f.awayClubId)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })()}
      {(() => {
        if (!visasFor('scouting', axes.tavlingstyp, axes.skede)) return null
        const scoutItems = game.inbox.filter(i => i.type === InboxItemType.ScoutReport && !i.isRead).slice(-2)
        if (scoutItems.length === 0) return null
        return (
          <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
            <SectionLabel style={{ marginBottom: 6 }}>🔍 SCOUTING</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {scoutItems.map((item, i) => (
                <div key={i} style={{ borderBottom: i < scoutItems.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: i < scoutItems.length - 1 ? 5 : 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{item.title}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* §11.3 — Granska-slutets framåtpekare. Avslutande viskning, inget kort/rubrik. */}
      {nastaMatchPekareLine}
    </>
  )
}
