import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { PlayerLink } from '../components/PlayerLink'
import { ordinal, formatFinanceAbs, formatFinance, playoffResultLabel, cupResultLabel } from '../utils/formatters'
import { seasonSpanLabel, seasonStartYear, seasonChampionYear } from '../../domain/utils/seasonYear'
import type { SeasonSummary } from '../../domain/entities/SeasonSummary'
import type { SaveGame } from '../../domain/entities/SaveGame'
import { shareSeasonImage } from '../utils/seasonShareImage'
import { Share2, Swords } from 'lucide-react'
import { loadTeamPhoto, listTeamPhotoSeasons } from '../../infrastructure/teamPhotoStorage'
import { buildBlodslinje } from '../components/clubmemory/ClubMemoryView'
import { Spine } from '../components/shared/Spine'
import { deriveGoalOutcomeLine, derivePersonChangeLine, deriveRivalryLine, deriveEraChangeLine, shouldShowEraChangeLine } from '../../domain/services/seasonGoalService'
import { TabBar } from '../components/shared/TabBar'
import { getBoardRelationshipTrend } from '../../domain/services/seasonSummaryService'
import type { BoardRelationshipTrendPoint } from '../../domain/services/seasonSummaryService'

function RecordRow({ label, value, sub, isLast }: { label: string; value: string; sub: string; isLast?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      paddingBottom: isLast ? 0 : 10, marginBottom: isLast ? 0 : 10,
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
    }}>
      <div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</p>
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{value}</span>
    </div>
  )
}

// AUDIT DEL 2 B3, avkallad — minimal delning (2026-08-11): playoff/cup-etiketter
// och pengaformat delade med SeasonSummaryScreen.tsx via presentation/utils/
// formatters.ts — var två separata funktioner här med text som redan glidit
// isär från den fulla ytans ("Ej kvalificerad" vs "Ej kvalad till slutspel").
// cupResultLabel returnerar '' (inte null) för eliminated/okänt — wrapparen
// nedan (cupLabel) bevarar det gamla null-kontraktet anroparen förväntar sig.
function cupLabel(result: SeasonSummary['cupResult']): string | null {
  const label = cupResultLabel(result)
  return label === '' ? null : label
}

/**
 * O13 / M11 (DOM_TRANARMARKNADEN_2026-08-26) — årsbokens klubbgräns.
 *
 * `SeasonSummary` bär redan `clubId`/`clubName`, frysta vid genereringen
 * (seasonSummaryService.ts:783). Presentationslagret läste dem aldrig — det
 * antog att HELA årsboken tillhörde `game.managedClubId`. Det antagandet höll
 * så länge en karriär bara kunde ha en klubb. Domens förutsättning ("En
 * spelare kan berätta om två klubbar i samma karriär") kräver att ytan slutar
 * anta det, och det är därför denna fix byggs FÖRE själva tränarmarknaden.
 *
 * Grupperar kronologiskt ordnade säsonger i sammanhängande klubbperioder.
 * En manager som återvänder till samma klubb efter ett mellanspel får TVÅ
 * poster — perioderna är sammanhängande, inte unika klubbar.
 */
export interface CareerSpell {
  clubId: string
  clubName: string
  fromSeason: number
  toSeason: number
  seasonCount: number
}

export function deriveCareerSpells(summariesChronological: SeasonSummary[]): CareerSpell[] {
  const spells: CareerSpell[] = []
  for (const s of summariesChronological) {
    const last = spells[spells.length - 1]
    if (last && last.clubId === s.clubId) {
      last.toSeason = s.season
      last.seasonCount++
    } else {
      spells.push({ clubId: s.clubId, clubName: s.clubName, fromSeason: s.season, toSeason: s.season, seasonCount: 1 })
    }
  }
  return spells
}

/**
 * Epokraden jämför säsong N mot säsong N−1. Över en klubbgräns jämför den
 * två OLIKA klubbars epoker och rapporterar ett epokskifte som aldrig hänt —
 * "Det här året slutade X vara i sin storhetstid" om den föregående posten
 * råkade tillhöra en annan klubb. Raden får bara visas när båda säsongerna
 * är samma klubb.
 */
export function shouldShowEraChangeForSummary(
  current: SeasonSummary,
  previous: SeasonSummary | undefined,
): boolean {
  if (!previous || previous.clubId !== current.clubId) return false
  return shouldShowEraChangeLine(current.clubEra, previous.clubEra)
}

/**
 * HIGH 2 (2026-09-02): historiken ska läsa säsongens FRYSTA managerposter,
 * inte det levande managerProfile som kan ha ändrats flera säsonger senare.
 * Ren accessor för samma testmönster som övrig HistoryScreen-wiring.
 */
export function managerSeasonEntriesForHistory(summary: SeasonSummary) {
  return summary.managerSeason ?? []
}

export function HistoryManagerSeason({ summary }: { summary: SeasonSummary }) {
  return (
    <>
      {managerSeasonEntriesForHistory(summary).map((entry, idx) => (
        <p
          key={`manager_${entry.season}_${entry.matchday}_${idx}`}
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginTop: idx === 0 ? 8 : 4,
          }}
        >
          {entry.text}
        </p>
      ))}
    </>
  )
}

function JourneyGraph({ summaries }: { summaries: SeasonSummary[] }) {
  if (summaries.length < 2) return null

  // O13-fynd (2026-08-29): anroparen skickar `game.seasonSummaries` — som
  // ALLTID är äldst-först (seasonEndProcessor.ts appendar). Det gamla
  // `.reverse()` här vände den till nyast-först och kallade resultatet
  // `chronological`, så "Resan" ritades baklänges i tiden (x-axelns årtal
  // räknade nedåt). Upptäckt när klubbytesmarkören nedan hamnade på fel
  // sida av bytet. Rotorsak: variabelnamnet påstod en ordning som anroparen
  // aldrig levererade.
  const chronological = summaries
  const W = 300
  const H = 100
  const padL = 28
  const padR = 12
  const padT = 10
  const padB = 24

  const maxPos = Math.max(...chronological.map(s => s.finalPosition), 6)
  const minPos = 1

  const xStep = (W - padL - padR) / (chronological.length - 1)

  function xOf(i: number) { return padL + i * xStep }
  function yOf(pos: number) {
    return padT + ((pos - minPos) / (maxPos - minPos)) * (H - padT - padB)
  }

  const points = chronological.map((s, i) => `${xOf(i)},${yOf(s.finalPosition)}`).join(' ')

  return (
    <div className="card-sharp" style={{ padding: '10px 14px 8px', marginBottom: 8 }}>
      <p className="h-label" style={{ marginBottom: 10 }}>
        Resan — tabellposition per säsong
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Horizontal grid lines for pos 1, middle, maxPos */}
        {[1, Math.ceil((maxPos + 1) / 2), maxPos].map(pos => (
          <line key={pos} x1={padL} x2={W - padR} y1={yOf(pos)} y2={yOf(pos)}
            stroke="var(--border)" strokeWidth="0.8" strokeDasharray="3,3" />
        ))}
        {/* Y axis labels */}
        {[1, Math.ceil((maxPos + 1) / 2), maxPos].map(pos => (
          <text key={pos} x={padL - 4} y={yOf(pos) + 3.5} textAnchor="end"
            fontSize="7" fill="var(--text-muted)" fontFamily="system-ui,sans-serif">
            {pos}
          </text>
        ))}
        {/* O13: klubbytesmarkör — en lodrät linje mellan de två säsonger där
            managern bytte klubb. Resan är managerns, inte klubbens, så kurvan
            bryts inte; men bytet ska gå att se, annars läser en tvåklubbskarriär
            som en enda klubbs upp- och nedgång. */}
        {chronological.map((s, i) => {
          if (i === 0 || chronological[i - 1].clubId === s.clubId) return null
          const x = xOf(i) - xStep / 2
          return (
            <line key={`spell_${s.season}`} x1={x} x2={x} y1={padT - 4} y2={H - padB + 4}
              stroke="color-mix(in srgb, var(--text-muted) 60%, transparent)"
              strokeWidth="0.8" strokeDasharray="2,2" />
          )
        })}
        {/* Line */}
        <polyline points={points} fill="none" stroke="color-mix(in srgb, var(--accent) 70%, transparent)" strokeWidth="1.8" strokeLinejoin="round" />
        {/* Dots + season labels */}
        {chronological.map((s, i) => {
          const cx = xOf(i)
          const cy = yOf(s.finalPosition)
          const isChamp = s.playoffResult === 'champion'
          return (
            <g key={s.season}>
              <circle cx={cx} cy={cy} r={isChamp ? 5 : 3.5}
                fill={isChamp ? 'color-mix(in srgb, var(--accent) 90%, transparent)' : 'var(--bg-elevated)'}
                stroke={isChamp ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 60%, transparent)'}
                strokeWidth="1.5" />
              <text x={cx} y={H - 4} textAnchor="middle"
                fontSize="6.5" fill="var(--text-muted)" fontFamily="system-ui,sans-serif">
                {String(seasonStartYear(s.season)).slice(-2)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/**
 * DOM_BOARDRELATION_BAGE_2026-09-02.md, steg 2 — syskonkurva till
 * JourneyGraph ovan, INTE en ersättning (domens SKYDDAT: positionskurvan
 * rörs inte). Samma visuella språk (W/H/padding/linjebredd/typsnitt) medvetet
 * kopierat rakt av — det här är en dataväxling på ett bevisat mönster, inte
 * en ny designparadigm. Enda skillnaden: patience är "högre = bättre" (ingen
 * axelinvertering behövs, till skillnad från tabellposition).
 */
function BoardRelationshipGraph({ trend }: { trend: ReturnType<typeof getBoardRelationshipTrend> }) {
  if (!trend) return null
  const { points } = trend
  const W = 300
  const H = 100
  const padL = 28
  const padR = 12
  const padT = 10
  const padB = 24

  const xStep = (W - padL - padR) / (points.length - 1)
  function xOf(i: number) { return padL + i * xStep }
  function yOf(patience: number) {
    return padT + ((100 - patience) / 100) * (H - padT - padB)
  }

  const ZONE_COLOR: Record<BoardRelationshipTrendPoint['zone'], string> = {
    stabilt: 'var(--success)',
    under_press: 'var(--warning)',
    ultimatum: 'var(--danger)',
  }

  const svgPoints = points.map((p, i) => `${xOf(i)},${yOf(p.boardPatienceAfter)}`).join(' ')

  return (
    <div className="card-sharp" style={{ padding: '10px 14px 8px', marginBottom: 8 }}>
      <p className="h-label" style={{ marginBottom: 10 }}>
        Styrelsens förtroende — läge per säsong
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {[0, 50, 100].map(patience => (
          <line key={patience} x1={padL} x2={W - padR} y1={yOf(patience)} y2={yOf(patience)}
            stroke="var(--border)" strokeWidth="0.8" strokeDasharray="3,3" />
        ))}
        {[0, 50, 100].map(patience => (
          <text key={patience} x={padL - 4} y={yOf(patience) + 3.5} textAnchor="end"
            fontSize="7" fill="var(--text-muted)" fontFamily="system-ui,sans-serif">
            {patience}
          </text>
        ))}
        {/* adherence-exempt: Sparkline saknar axel-etiketter/rutnät helt (minimal per definition) — DOM_BOARDRELATION_BAGE_2026-09-02.md beställde JourneyGraph-ovans redan baselinade visuella språk, inte en Sparkline-ombyggnad som tappar årtalsetiketterna. */}
        <polyline points={svgPoints} fill="none" stroke="color-mix(in srgb, var(--accent) 70%, transparent)" strokeWidth="1.8" strokeLinejoin="round" />
        {points.map((p, i) => {
          const cx = xOf(i)
          const cy = yOf(p.boardPatienceAfter)
          return (
            <g key={p.season}>
              <circle cx={cx} cy={cy} r={p.verdict === 'exceeded' ? 5 : 3.5}
                fill={ZONE_COLOR[p.zone]}
                stroke={p.verdict === 'failed' ? 'var(--danger)' : 'var(--bg-elevated)'}
                strokeWidth="1.5" />
              <text x={cx} y={H - 4} textAnchor="middle"
                fontSize="6.5" fill="var(--text-muted)" fontFamily="system-ui,sans-serif">
                {String(seasonStartYear(p.season)).slice(-2)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

type ArchiveTab = 'seasons' | 'letters' | 'school' | 'photos' | 'blodslinje'

export interface HistoryScreenProps {
  /**
   * 3.3 (SLUTTEST_KO.md, 2026-08-17) — Kontrakt A. En "avslutad karriär"-vy
   * kan inte läsa live store-state (den kan vara rensad, eller på väg att
   * bli det). Skickas explicit av GameOverScreens "SE KARRIÄREN"-flöde
   * (game fångas i navigate-anropets route-state INNAN "NY KARRIÄR" hinner
   * nollställa store:t) — och samma prop är avsedd att återanvändas av U7:s
   * återställningsflöde (visa ett save som inte är det aktiva). Utelämnas
   * fältet läses live store-state precis som tidigare (normalt Historik-flöde).
   */
  snapshot?: SaveGame
}

/**
 * Ren funktion, testbar utan render: snapshot vinner alltid över live
 * store-state när den finns. Utbruten separat eftersom projektet saknar
 * @testing-library/react — komponentens interna logik måste vara
 * anropbar utan en React-renderingskontext för att gå att regressionstesta.
 */
export function resolveDisplayedGame(snapshot: SaveGame | undefined, liveGame: SaveGame | null): SaveGame | null {
  return snapshot ?? liveGame
}

/**
 * @cites s.finalPosition, s.topScorer, s.mostImproved, s.startFinances, s.endFinances, s.narrativeSummary, s.managerSeason, s.personalGoal, s.personChange, s.rivalryStanding, s.clubEra, s.legacyVerdictWasCorrected, s.verdictSentence
 */
export function HistoryScreen({ snapshot }: HistoryScreenProps = {}) {
  const navigate = useNavigate()
  const liveGame = useGameStore(s => s.game)
  const game = resolveDisplayedGame(snapshot, liveGame)
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null)
  // A-M5 (SEXSÄSONGSAUDITEN 2026-08-26): separat toggle från expandedSeason
  // (ligatabellen) — spelaren kan vilja se avstämningen utan tabellen och
  // tvärtom, samma mönster som redan finns för standingsSnapshot nedan.
  const [expandedFinanceSeason, setExpandedFinanceSeason] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<ArchiveTab>('seasons')
  const [photoSeasons, setPhotoSeasons] = useState<number[]>([])
  const [photoSvg, setPhotoSvg] = useState<string | null>(null)
  const [photoSeason, setPhotoSeason] = useState<number | null>(null)

  useEffect(() => {
    listTeamPhotoSeasons().then(setPhotoSeasons).catch(() => {})
  }, [])

  function handlePhotoSelect(season: number) {
    setPhotoSeason(season)
    loadTeamPhoto(season).then(setPhotoSvg).catch(() => setPhotoSvg(null))
  }

  if (!game) return null

  const summaries = [...(game.seasonSummaries ?? [])].reverse()
  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const currentClubName = game.clubs.find(c => c.id === game.managedClubId)?.name ?? ''

  // O13 (DOM_TRANARMARKNADEN_2026-08-26): en karriär kan spänna över flera
  // klubbar. `spells` är sanningen om vilka — härledd ur varje SeasonSummarys
  // EGNA frysta clubId, aldrig ur game.managedClubId (som bara vet var
  // managern är NU).
  const spells = deriveCareerSpells(game.seasonSummaries ?? [])
  const isMultiClubCareer = spells.length > 1

  // Hall of Fame — top 5 per category
  const topGoalScorers = [...managedPlayers]
    .filter(p => p.careerStats.totalGoals > 0)
    .sort((a, b) => b.careerStats.totalGoals - a.careerStats.totalGoals)
    .slice(0, 5)

  const topByGames = [...managedPlayers]
    .filter(p => p.careerStats.totalGames > 0)
    .sort((a, b) => b.careerStats.totalGames - a.careerStats.totalGames)
    .slice(0, 5)

  const topByRating = [...managedPlayers]
    .filter(p => p.careerStats.totalGames >= 10 && p.careerStats.totalGames > 0)
    .map(p => ({
      p,
      avg: p.careerStats.totalGames > 0
        ? (p.seasonStats.averageRating * p.seasonStats.gamesPlayed + 6.5 * Math.max(0, p.careerStats.totalGames - p.seasonStats.gamesPlayed)) / p.careerStats.totalGames
        : 0,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5)

  return (
    <div style={{ padding: '20px 16px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 22, cursor: 'pointer', padding: 0, lineHeight: 1 }}
        >
          ←
        </button>
        <div>
          {/* O13: rubriken är "Karriärhistorik", inte "Klubbhistorik" (Opus
              dom 2026-09-02, `klubbhistorik-rubrik-tvaklubb`): det är managerns
              resa GENOM klubbar som visas, inte en enskild klubbs krönika —
              rättare även vid enklubbskarriär, och slipper en villkorlig
              rubrik. Underrubriken bär klubbperioderna med årtal. */}
          <h1 className="h-display-sm">Karriärhistorik</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {isMultiClubCareer
              ? spells.map(sp => `${sp.clubName} ${seasonStartYear(sp.fromSeason)}–${seasonStartYear(sp.toSeason)}`).join(' · ')
              : currentClubName}
          </p>
        </div>
      </div>

      {/* Archive tabs */}
      <div style={{ marginBottom: 14 }}>
        <TabBar
          tabs={[
            { id: 'seasons', label: 'Säsonger' },
            { id: 'letters', label: 'Brev' },
            { id: 'school', label: 'Skoluppgifter' },
            { id: 'photos', label: 'Lagfoton' },
            { id: 'blodslinje', label: 'Blodslinje' },
          ]}
          activeId={activeTab}
          onSelect={id => setActiveTab(id as ArchiveTab)}
          variant="pills"
        />
      </div>

      {activeTab !== 'seasons' && activeTab !== 'blodslinje' && <div style={{ display: 'none' }}><JourneyGraph summaries={[]} /></div>}
      {activeTab === 'seasons' && <JourneyGraph summaries={game.seasonSummaries ?? []} />}
      {activeTab === 'seasons' && <BoardRelationshipGraph trend={getBoardRelationshipTrend(game)} />}

      {/* Blodslinje — mentorkedjor */}
      {activeTab === 'blodslinje' && (() => {
        const blodslinjeItems = buildBlodslinje(game)
        if (blodslinjeItems.length === 0) {
          return (
            <div className="card-sharp" style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)', marginBottom: 32 }}>
              <p style={{ fontSize: 20, marginBottom: 8 }}>🩸</p>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Inga mentorband ännu</p>
              <p style={{ fontSize: 12 }}>Låt en senior spelare ta hand om en ungdom från akademin. Det är så stafetten börjar.</p>
            </div>
          )
        }
        return (
          <div style={{ marginBottom: 32 }}>
            <div className="card-sharp" style={{ padding: '14px 16px' }}>
              <p className="h-label" style={{ marginBottom: 16 }}>
                STAFETTEN
              </p>
              <Spine items={blodslinjeItems} />
            </div>
          </div>
        )
      })()}

      {/* Letters archive */}
      {activeTab === 'letters' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
          {(game.bandyLetters ?? []).length === 0 ? (
            <div className="card-sharp" style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 20, marginBottom: 8 }}>✉️</p>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Inga brev ännu</p>
              <p style={{ fontSize: 12 }}>Supportrar kan skriva brev under säsongen.</p>
            </div>
          ) : (
            [...(game.bandyLetters ?? [])].reverse().map(letter => (
              <div key={letter.id} className="card-sharp" style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: '1px', marginBottom: 6 }}>
                  ✉️ {letter.senderName} — Säsong {seasonSpanLabel(letter.season)}
                </p>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: letter.playerReply ? 10 : 0 }}>
                  {letter.text}
                </p>
                {letter.playerReply && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 8, fontStyle: 'italic' }}>
                    Svar: {letter.playerReply}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* School assignments archive */}
      {activeTab === 'school' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
          {(game.schoolAssignmentArchive ?? []).length === 0 ? (
            <div className="card-sharp" style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 20, marginBottom: 8 }}>📚</p>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Inga skoluppgifter ännu</p>
              <p style={{ fontSize: 12 }}>Unga akademispelare kan intervjua dig om klubbens historia.</p>
            </div>
          ) : (
            [...(game.schoolAssignmentArchive ?? [])].reverse().map((record, i) => (
              <div key={i} className="card-sharp" style={{ padding: '12px 14px' }}>
                <p style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: '1px', marginBottom: 6 }}>
                  📚 {record.youngPlayerName} — Säsong {seasonSpanLabel(record.season)}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{record.choiceLabel}</p>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{record.archiveText}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Team photos archive */}
      {activeTab === 'photos' && (
        <div style={{ marginBottom: 32 }}>
          {photoSeasons.length === 0 ? (
            <div className="card-sharp" style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: 20, marginBottom: 8 }}>📷</p>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Inga lagfoton ännu</p>
              <p style={{ fontSize: 12 }}>Lagfoton genereras automatiskt vid säsongsslut.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {photoSeasons.map(s => (
                  <button
                    key={s}
                    onClick={() => handlePhotoSelect(s)}
                    style={{
                      padding: '5px 10px', borderRadius: 99, border: 'none', cursor: 'pointer',
                      fontSize: 11, fontWeight: 600,
                      background: photoSeason === s ? 'var(--accent)' : 'var(--bg-elevated)',
                      color: photoSeason === s ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {seasonSpanLabel(s)}
                  </button>
                ))}
              </div>
              {photoSvg && (
                <div
                  className="lagfoto-frame"
                  style={{ borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => {
                    const blob = new Blob([photoSvg], { type: 'image/svg+xml' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url; a.download = `lagfoto_${photoSeason}.svg`; a.click()
                    URL.revokeObjectURL(url)
                  }}
                  dangerouslySetInnerHTML={{ __html: photoSvg }}
                />
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'seasons' && summaries.length > 0 && (
        <button
          onClick={() => shareSeasonImage(summaries[0])}
          style={{
            width: '100%', padding: '13px', marginBottom: 8,
            background: 'transparent', border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
            borderRadius: 'var(--radius-md)', color: 'var(--accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Share2 size={15} aria-hidden="true" style={{ verticalAlign: 'text-bottom', marginRight: 5 }} />
          Dela senaste säsongen
        </button>
      )}

      {activeTab === 'seasons' && summaries.length === 0 ? (
        <div className="card-sharp" style={{
          padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)',
        }}>
          <p style={{ fontSize: 22, marginBottom: 12 }}>📖</p>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Ingen historik ännu.</p>
          <p style={{ fontSize: 13 }}>Spela din första säsong för att bygga klubbens historia.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
          {summaries.map((s, i) => {
            const isGold = s.playoffResult === 'champion'
            const cup = cupLabel(s.cupResult)
            return (
              <div
                key={s.season}
                className={`card-sharp card-stagger-${Math.min(i + 1, 6)}`}
                style={{
                  background: isGold ? 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, transparent), color-mix(in srgb, var(--accent) 4%, transparent))' : undefined,
                  border: isGold ? '1px solid color-mix(in srgb, var(--accent) 40%, transparent)' : undefined,
                  padding: '10px 14px',
                }}
              >
                <p style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '1.2px',
                  textTransform: 'uppercase', color: isGold ? 'var(--accent)' : 'var(--text-muted)',
                  marginBottom: 10,
                }}>
                  ── Säsong {seasonSpanLabel(s.season)} ──
                </p>

                {/* O13: vilken klubb säsongen tillhörde. Läser postens EGNA
                    frysta clubName, aldrig den klubb managern sitter i nu.
                    Visas bara när karriären faktiskt har mer än en klubb —
                    på en enklubbskarriär står klubbnamnet redan i sidhuvudet
                    och raden hade bara upprepat det på var enda kort. */}
                {isMultiClubCareer && (
                  <p style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
                    marginTop: -6, marginBottom: 8,
                  }}>
                    {s.clubName}
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <p style={{ fontSize: 14 }}>
                    📊 <strong>{ordinal(s.finalPosition)} plats</strong>{' '}
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>({s.points}p, {s.wins}V {s.draws}O {s.losses}F)</span>
                    {s.finalPosition <= 3 && <span style={{ marginLeft: 6 }}>{['🥇','🥈','🥉'][s.finalPosition - 1]}</span>}
                  </p>
                  <p style={{ fontSize: 14 }}>
                    🏆 SM: <span style={{ color: isGold ? 'var(--accent)' : 'var(--text-primary)', fontWeight: isGold ? 700 : 500 }}>
                      {playoffResultLabel(s.playoffResult) || '—'}
                    </span>
                  </p>
                  {cup && <p style={{ fontSize: 14 }}>🏆 Cup: {cup}</p>}
                  {s.topScorer && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      🥅 Toppskytt:{' '}
                      <PlayerLink playerId={s.topScorer.playerId} name={s.topScorer.name} />
                      {' '}({s.topScorer.goals} mål)
                    </p>
                  )}
                  {s.topRated && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      ⭐ Bästa betyg:{' '}
                      <PlayerLink playerId={s.topRated.playerId} name={s.topRated.name} />
                      {' '}({s.topRated.avgRating.toFixed(1)})
                    </p>
                  )}
                  {s.mostImproved && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      📈 Mest förbättrad:{' '}
                      <PlayerLink playerId={s.mostImproved.playerId} name={s.mostImproved.name} />
                      {' '}(+{s.mostImproved.caGain})
                    </p>
                  )}
                  {/* O18 fält 3-5 (DOM_ARSBOKEN_RYGGRAD_2026-08-17.md) — ett fält per säsong,
                      aldrig utfyllnad. Renderas bara när fältet faktiskt har innehåll — en
                      äldre save utan dessa fält (skapad innan denna kod fanns) visar helt
                      enkelt inga av raderna, ingen gissning bakåt. */}
                  {s.personChange && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      👤 {derivePersonChangeLine(s.personChange)}
                    </p>
                  )}
                  {s.rivalryStanding && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      ⚔️ {deriveRivalryLine(s.rivalryStanding)}
                    </p>
                  )}
                  {/* O13-buggfix: epokraden namngav `game.managedClubId`s klubb
                      — alltså den klubb managern sitter i NU — för en säsong
                      som kunde tillhöra en helt annan klubb. Och den jämförde
                      epok mot föregående KORT, oavsett om det kortet var samma
                      klubb; över en klubbgräns rapporterade den ett epokskifte
                      som aldrig inträffat. Båda leden läser nu postens egna
                      frysta identitet (se shouldShowEraChangeForSummary). */}
                  {shouldShowEraChangeForSummary(s, summaries[i + 1]) && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      🏛️ {deriveEraChangeLine(s.clubName, summaries[i + 1].clubEra!)}
                    </p>
                  )}
                  {/* O3 (DOM_EGET_SASONGSMAL_2026-08-17.md) — målraden, sista raden före
                      ekonomin. Renderas bara när ett mål faktiskt valdes den säsongen —
                      deriveGoalOutcomeLine() hanterar "inget mål" med en egen låst rad
                      ("Du lovade ingenting..."), men den skulle fabricerat en gammal säsong
                      som föregick den här featuren. Samma "gissa inte bakåt"-disciplin som
                      K2/K3: bara verklig data, aldrig ett antagande om vad som hänt tidigare. */}
                  {s.personalGoal && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {/* O13: målraden slår upp derbyrival/spelarnamn via
                          game.managedClubId. För en säsong i en TIDIGARE klubb
                          gav det fel rival. Skickar in postens egen klubb som
                          "managed" för just den uppslagningen — game i övrigt
                          orört (spelarregistret är världsbrett). */}
                      🎯 {deriveGoalOutcomeLine(s.personalGoal, { ...game, managedClubId: s.clubId })}
                    </p>
                  )}
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    💰 Ekonomi: {formatFinanceAbs(s.startFinances)} → {formatFinanceAbs(s.endFinances)}{' '}
                    <span style={{ color: s.financialChange >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                      ({s.financialChange >= 0 ? '+' : ''}{formatFinanceAbs(s.financialChange)})
                    </span>
                  </p>
                  {/* A-M5 (SEXSÄSONGSAUDITEN 2026-08-26): avstämning för
                      säsongsväxlingens hopp — samma faktiska rollover-poster
                      som financeLog (kassavy) redan skulle visat om de loggats
                      dit. undefined/tom = ingen mecenat/politiker/etc gav
                      utbetalning denna rollover, ingen rad visas. */}
                  {s.offseasonFinanceEntries && s.offseasonFinanceEntries.length > 0 && (
                    <>
                      <button
                        onClick={() => setExpandedFinanceSeason(expandedFinanceSeason === s.season ? null : s.season)}
                        style={{
                          marginTop: 4, background: 'none', border: 'none',
                          color: 'var(--accent)', fontSize: 11, cursor: 'pointer',
                          padding: 0, textAlign: 'left', fontWeight: 600,
                          display: 'block',
                        }}
                      >
                        {expandedFinanceSeason === s.season ? '▲ Dölj avstämning' : '▼ Visa avstämning (sommaren)'}
                      </button>
                      {expandedFinanceSeason === s.season && (
                        <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                          {s.offseasonFinanceEntries.map((entry, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '3px 0',
                                borderBottom: idx < s.offseasonFinanceEntries!.length - 1 ? '1px solid var(--border)' : 'none',
                              }}
                            >
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{entry.label}</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: entry.amount >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                                {formatFinance(entry.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {s.standingsSnapshot && s.standingsSnapshot.length > 0 && (
                    <button
                      onClick={() => setExpandedSeason(expandedSeason === s.season ? null : s.season)}
                      style={{
                        marginTop: 4, background: 'none', border: 'none',
                        color: 'var(--accent)', fontSize: 11, cursor: 'pointer',
                        padding: 0, textAlign: 'left', fontWeight: 600,
                      }}
                    >
                      {expandedSeason === s.season ? '▲ Dölj tabell' : '▼ Visa ligatabell'}
                    </button>
                  )}
                  {expandedSeason === s.season && s.standingsSnapshot && (
                    <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                      {s.standingsSnapshot
                        .slice()
                        .sort((a, b) => a.position - b.position)
                        .map(row => {
                          const club = game.clubs.find(c => c.id === row.clubId)
                          // O13-buggfix: markerade raden för den klubb managern
                          // sitter i NU. I en tvåklubbskarriär highlightade den
                          // nya klubben i den GAMLA klubbens arkiverade tabell —
                          // och lämnade den klubb säsongen faktiskt handlade om
                          // omarkerad. Postens egen frysta clubId är sanningen.
                          const isManaged = row.clubId === s.clubId
                          return (
                            <div key={row.clubId} style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '3px 0', borderBottom: '1px solid color-mix(in srgb, var(--ink) 6%, transparent)',
                              background: isManaged ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : 'transparent',
                            }}>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 16, textAlign: 'right' }}>{row.position}.</span>
                              <span style={{ fontSize: 11, flex: 1, color: isManaged ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: isManaged ? 700 : 400 }}>
                                {club?.shortName ?? club?.name ?? row.clubId}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', minWidth: 24, textAlign: 'right' }}>{row.points}p</span>
                            </div>
                          )
                        })}
                      <HistoryManagerSeason summary={s} />
                    </div>
                  )}
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.5 }}>
                    📋 {s.narrativeSummary}
                  </p>
                  {/* M8 (audit 5c9a7a8, 2026-08-24): en säsong sparad före A5-domen
                      (2026-08-17) kan ha en felaktig dom bakad in i narrativeSummary
                      OVAN ("2:a plats uppfyller kravet att vinna ligan"). Migreringen
                      (saveGameMigration.ts) räknar om domen från redan lagrade fält
                      och sätter legacyVerdictWasCorrected när den skiljer sig — visa
                      rättelsen synligt HÄR, skriv aldrig tyst över den arkiverade
                      texten ovan. */}
                  {s.legacyVerdictWasCorrected && s.verdictSentence && (
                    <p style={{ fontSize: 11, color: 'var(--warning)', marginTop: 4, lineHeight: 1.5 }}>
                      ⚠️ Arkiverad text ovan följer en äldre regel. Rättelse: {s.verdictSentence}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* All-time Records (seasons tab only) */}
      {activeTab === 'seasons' && game.allTimeRecords && (
        <div className="card-sharp" style={{ padding: '10px 14px', marginBottom: 8 }}>
          <p style={{
            fontSize: 8, fontWeight: 700, letterSpacing: '2px',
            textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 18,
            borderBottom: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)', paddingBottom: 10,
          }}>
            ── Rekord ──
          </p>
          {/* O13: klubbrekorden gäller den klubb managern sitter i nu —
              allTimeRecords byggs per managed klubb och nollställs vid
              klubbyte (switchManagedClub). På en tvåklubbskarriär måste det
              stå, annars läses den föregående klubbens tomma rekordlista som
              "karriären saknar rekord". */}
          {isMultiClubCareer && (
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -8, marginBottom: 14 }}>
              {currentClubName}
            </p>
          )}
          {game.allTimeRecords.bestFinish && (
            <RecordRow label="Bästa tabellplacering" value={`${ordinal(game.allTimeRecords.bestFinish.position)} plats`} sub={`Säsong ${seasonSpanLabel(game.allTimeRecords.bestFinish.season)}`} />
          )}
          {game.allTimeRecords.mostGoalsSeason && (
            <RecordRow label="Flest mål en säsong" value={`${game.allTimeRecords.mostGoalsSeason.goals} mål`} sub={`${game.allTimeRecords.mostGoalsSeason.playerName} · ${seasonSpanLabel(game.allTimeRecords.mostGoalsSeason.season)}`} />
          )}
          {game.allTimeRecords.mostAssistsSeason && (
            <RecordRow label="Flest assist en säsong" value={`${game.allTimeRecords.mostAssistsSeason.assists} assist`} sub={`${game.allTimeRecords.mostAssistsSeason.playerName} · ${seasonSpanLabel(game.allTimeRecords.mostAssistsSeason.season)}`} />
          )}
          {game.allTimeRecords.highestRatingSeason && (
            <RecordRow label="Högst snittbetyg en säsong" value={`${game.allTimeRecords.highestRatingSeason.rating.toFixed(1)}`} sub={`${game.allTimeRecords.highestRatingSeason.playerName} · ${seasonSpanLabel(game.allTimeRecords.highestRatingSeason.season)}`} />
          )}
          {game.allTimeRecords.biggestWin && (
            <RecordRow label="Största seger" value={game.allTimeRecords.biggestWin.score} sub={`vs ${game.allTimeRecords.biggestWin.opponent} · ${seasonSpanLabel(game.allTimeRecords.biggestWin.season)}`} />
          )}
          {game.allTimeRecords.championSeasons.length > 0 && (
            <RecordRow label="SM-guld" value={`${game.allTimeRecords.championSeasons.length}×`} sub={game.allTimeRecords.championSeasons.map(seasonChampionYear).join(', ')} />
          )}
          {(game.allTimeRecords.cupWinSeasons ?? []).length > 0 && (
            <RecordRow label="Cupsegrar" value={`${game.allTimeRecords.cupWinSeasons!.length}×`} sub={game.allTimeRecords.cupWinSeasons!.map(seasonStartYear).join(', ')} isLast />
          )}
          {game.allTimeRecords.championSeasons.length === 0 && (game.allTimeRecords.cupWinSeasons ?? []).length === 0 && (
            <RecordRow label="Titlar" value="—" sub="Inga titlar ännu" isLast />
          )}
        </div>
      )}

      {/* Hall of Fame (seasons tab only) */}
      {activeTab === 'seasons' && <div className="card-sharp" style={{ padding: '18px 16px' }}>
        <p style={{
          fontSize: 8, fontWeight: 700, letterSpacing: '2px',
          textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 18,
          borderBottom: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)', paddingBottom: 10,
        }}>
          ── Hall of Fame ──
        </p>
        {/* O13: listorna är filtrerade på p.clubId === game.managedClubId —
            alltså BARA nuvarande klubbs spelare. Filtret var tyst: efter ett
            klubbyte försvann den gamla klubbens legendarer utan förklaring,
            och listan såg ut att påstå att karriären inte haft några. Namnge
            skopan istället för att dölja den. */}
        {isMultiClubCareer && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -8, marginBottom: 14 }}>
            {currentClubName}
          </p>
        )}

        {topGoalScorers.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p className="h-label" style={{ marginBottom: 8 }}>
              🎯 Flest mål i karriären
            </p>
            {topGoalScorers.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 16 }}>{i + 1}.</span>
                <PlayerLink playerId={p.id} name={`${p.firstName} ${p.lastName}`} style={{ fontSize: 13 }} />
                <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{p.careerStats.totalGoals}</span>
              </div>
            ))}
          </div>
        )}

        {topByGames.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p className="h-label" style={{ marginBottom: 8 }}>
              <Swords size={8} style={{ verticalAlign: 'middle', marginRight: 2 }} />{' '}Flest matcher
            </p>
            {topByGames.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 16 }}>{i + 1}.</span>
                <PlayerLink playerId={p.id} name={`${p.firstName} ${p.lastName}`} style={{ fontSize: 13 }} />
                <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{p.careerStats.totalGames}</span>
              </div>
            ))}
          </div>
        )}

        {topByRating.length > 0 && (
          <div>
            <p className="h-label" style={{ marginBottom: 8 }}>
              ⭐ Bästa snittbetyg (min 10 matcher)
            </p>
            {topByRating.map(({ p, avg }, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < topByRating.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 16 }}>{i + 1}.</span>
                <PlayerLink playerId={p.id} name={`${p.firstName} ${p.lastName}`} style={{ fontSize: 13 }} />
                <span style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{avg.toFixed(1)}</span>
              </div>
            ))}
          </div>
        )}

        {topGoalScorers.length === 0 && topByGames.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Inga spelare att visa ännu.</p>
        )}
      </div>}
    </div>
  )
}
