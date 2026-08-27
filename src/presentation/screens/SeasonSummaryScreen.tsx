import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { seasonTwoTruthsSentence, placeringsdomText } from '../../domain/services/seasonSummaryService'
import type { SeasonSummary } from '../../domain/services/seasonSummaryService'
import { getRoundDate } from '../../domain/services/scheduleGenerator'
import { ClubBadge } from '../components/ClubBadge'
import { SectionLabel } from '../components/SectionLabel'
import { csColor, formatFinanceAbs, positionShort, playoffResultLabel, cupResultLabel } from '../utils/formatters'
import type { PlayerPosition } from '../../domain/enums'
import { shareSeasonImage } from '../utils/seasonShareImage'
import { collectSeasonDecisions } from '../../domain/services/seasonDecisionsService'
import { generateTeamPhotoSvg } from '../utils/teamPhotoGenerator'
import { saveTeamPhoto, loadTeamPhoto } from '../../infrastructure/teamPhotoStorage'
import { pickSeasonElimText } from '../../domain/data/seasonSummaryElimText'
import type { SeasonEliminationContext } from '../../domain/data/seasonSummaryElimText'
import { ScoreBlock } from '../components/primitives/ScoreBlock'
import { Sparkline, MIN_POINTS } from '../components/primitives/Sparkline'
import { seasonSpanLabel, seasonStartYear } from '../../domain/utils/seasonYear'
import { seasonVerdictText } from '../../domain/services/boardService'

function getSignatureEmojiFromRubric(rubric: string): string {
  if (rubric.includes('köldvintern')) return '🌨'
  if (rubric.includes('kandsalsäsongen') || rubric.includes('Skandal')) return '📰'
  if (rubric.includes('transfersommaren') || rubric.includes('transfer')) return '💼'
  if (rubric.includes('Skadekurvan') || rubric.includes('skadekurvan')) return '🩹'
  if (rubric.includes('Drömrundan') || rubric.includes('drömrundan')) return '✨'
  return ''
}

/**
 * AUDIT DEL 2 B2 (2026-08-09): kapitelindelning — Georgia + accent-linje,
 * ingen ny komponentfil (samma lokala-helper-mönster som StatRow nedan).
 * Tre dividers vid de tre verkliga innehållsövergångarna (Resultat→
 * Berättelsen→Truppen→Siffrorna). Ordern nämnde fyra, men Resultat-kapitlet
 * ÄR hero-kortet överst (redan visuellt distinkt via h-display-hero) — en
 * divider FÖRE det hade klippt mitt i en sammanhållen ceremoniell yta,
 * inte markerat en innehållsövergång. Ingen omflyttning av innehåll.
 */
/**
 * Å11-residual (SLUTTEST_KO.md, 6.4 post 21, 2026-08-20) — DS-regel 12 en
 * nivå upp: "Truppen"-kapitlet ska inte rendera en rubrik ovanför tomrum
 * när BÅDA korten under den (Säsongens bästa + Svenska Cupen) gatas bort.
 */
export function shouldShowTruppenChapter(summary: Pick<SeasonSummary, 'topScorer' | 'topAssister' | 'topRated' | 'mostImproved' | 'youngPlayer' | 'cupResult'>): boolean {
  const hasAward = !!(summary.topScorer || summary.topAssister || summary.topRated || summary.mostImproved || summary.youngPlayer)
  const hasCup = !!(summary.cupResult && summary.cupResult !== 'eliminated')
  return hasAward || hasCup
}

function ChapterDivider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0 14px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--accent)', opacity: 0.3 }} />
      <span style={{
        // ds-exempt: order-specificerad Georgia-eyebrow, inget .h-quote/.h-display-* matchar (alla är stora rubrikstilar, inte liten versal bokstavsspärr)
        fontFamily: 'var(--font-display)', fontStyle: 'italic',
        fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase',
        color: 'var(--accent)', whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--accent)', opacity: 0.3 }} />
    </div>
  )
}

/**
 * @cites summary.championClubId, summary.eliminatedByClubId, summary.mostImportantDecision, summary.matchOfTheSeason, h.narrative, h.homeScore, h.awayScore, h.potmName
 */
export function SeasonSummaryScreen() {
  const navigate = useNavigate()
  const params = useParams<{ season?: string }>()
  const { game, clearSeasonSummary } = useGameStore()

  // DREAM-013: generate and persist team photo when season ends
  useEffect(() => {
    if (!game?.lastTeamPhotoSeason) return
    const season = game.lastTeamPhotoSeason
    loadTeamPhoto(season).then(existing => {
      if (existing) return
      const club = game.clubs.find(c => c.id === game.managedClubId)
      if (!club) return
      const players = game.players.filter(p => p.clubId === game.managedClubId)
      const svg = generateTeamPhotoSvg(club, players, season)
      saveTeamPhoto(season, svg).catch(() => {})
    }).catch(() => {})
  }, [game?.lastTeamPhotoSeason])

  if (!game) return null

  // Determine which summary to show
  let summary: SeasonSummary | null = null
  if (params.season) {
    const seasonNum = parseInt(params.season, 10)
    summary = game.seasonSummaries?.find(s => s.season === seasonNum) ?? null
  } else {
    // Show latest
    const summaries = game.seasonSummaries ?? []
    summary = summaries.length > 0 ? summaries[summaries.length - 1] : null
  }

  if (!summary) {
    return (
      <div style={{ padding: 20, color: 'var(--text-secondary)' }}>
        Ingen säsongssammanfattning tillgänglig.
        <button onClick={() => navigate('/game/dashboard')} style={{ marginTop: 16, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
          ← Tillbaka
        </button>
      </div>
    )
  }

  const isHistorical = !!params.season
  const isChampion = summary.playoffResult === 'champion'

  // AUDIT DEL 2 A3, uppföljning (2026-08-09): reversibel dedup mellan DIN
  // SÄSONG och DINA VAL (seasonDecisionsService.ts läser samma game.storylines
  // helt utan dedup). Jacobs ruling: dela seenTypes så en storyline bara syns
  // en gång per skärm, men BEHÅLL DINA VAL:s storyline-inkludering — designfrågan
  // (bär storyline ett fält som pekar mot ett beslut, eller är den ren
  // inramning?) är öppen, inte löst här. DIN SÄSONG fylls i render-ordning
  // FÖRE DINA VAL nedan, så den vinner förstahandsanspråk.
  const claimedStorylineTypes = new Set<string>()

  function playoffEliminationSentence(r: SeasonSummary['playoffResult']): string {
    if (!r || r === 'champion') return ''
    const contextMap: Record<string, SeasonEliminationContext> = {
      quarterfinal: 'kf',
      semifinal: 'sf',
      finalist: 'smf',
      didNotQualify: 'no_playoff',
    }
    const context = contextMap[r]
    if (!context) return ''

    // 2026-08-17 (Stickiness-audit): läser summary.eliminatedByClubId (satt vid
    // genereringstillfället, se seasonSummaryService.ts) — INTE game.playoffBracket,
    // som nollställs vid rollover och därför inte är historiskt tillförlitligt
    // för en gammal summary (blev tidigare generiskt "Kvartsfinalen mot motståndet").
    // game.clubs är däremot alltid live och säkert att slå upp mot.
    let opponentName = 'motståndet'
    const elimClubId = summary?.eliminatedByClubId
    if (elimClubId) {
      const oppClub = game?.clubs.find(c => c.id === elimClubId)
      if (oppClub) opponentName = oppClub.shortName ?? oppClub.name
    }

    return pickSeasonElimText(context, summary!.season, summary!.clubId)
      .replace('{motståndare}', opponentName)
      .replace('{season}', seasonSpanLabel(summary!.season))
  }

  function smWinnerSentence(r: SeasonSummary['playoffResult']): string {
    if (r === 'champion') return ''
    // PÅSTÅENDEKARTAN (2026-08-24): läste tidigare game.playoffBracket.champion
    // — live state som nollställs vid säsongsrollover, samma bugklass som
    // playoffEliminationSentence redan fixades för (2026-08-17). summary.championClubId
    // är snapshottad vid genereringstillfället i seasonSummaryService.ts.
    const champId = summary?.championClubId
    if (!champId) return ''
    const champ = game?.clubs.find(c => c.id === champId)
    if (!champ) return ''
    return `${champ.shortName ?? champ.name} blev svenska mästare.`
  }

  function verdictIcon(v: SeasonSummary['expectationVerdict']): string {
    if (v === 'exceeded') return '✅'
    if (v === 'met') return '✅'
    return '❌'
  }

  function verdictText(s: SeasonSummary): string {
    const totalTeams = game?.clubs.length ?? 12
    return seasonVerdictText(s.boardExpectation, s.finalPosition, totalTeams)
  }

  function StatRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 6, marginBottom: 6, borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: color ?? 'var(--text-primary)' }}>{value}</span>
      </div>
    )
  }

  const [sharing, setSharing] = useState(false)

  async function handleShare() {
    if (!summary) return
    setSharing(true)
    await shareSeasonImage(summary)
    setSharing(false)
  }

  const handleNextSeason = () => {
    clearSeasonSummary()
    if (game.managerFired) {
      navigate('/game/game-over', { replace: true })
    } else {
      // 5.1 Sommaren (SLUTTEST_KO.md, 2026-08-18): efter årsbokens "Starta
      // säsong"-knapp, före portalen. handleNextSeason nås bara efter att en
      // säsong redan avslutats (seasonEndProcessor har redan höjt
      // currentSeason), så "från säsong 2 och framåt" gäller strukturellt
      // varje gång den här grenen körs — inget separat säsongsvillkor behövs.
      navigate('/game/season-transition', { replace: true })
    }
  }

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      background: 'var(--bg)',
    }}>
      <div style={{ padding: '0 16px 180px' }}>

        {/* HEADER */}
        <div style={{
          background: 'var(--bg)',
          padding: '16px 0 12px',
          textAlign: 'center',
          marginBottom: 16,
          position: 'relative',
        }}>
          <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: 16, left: 0, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>←</button>

          {/* R2-1: ÅRSBOK → .h-eyebrow (11/3px accent). h1 → .h-display-hero (ceremoniell 52/900). */}
          <p className="h-eyebrow" style={{ marginBottom: 8 }}>
            ÅRSBOK
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <ClubBadge clubId={summary.clubId} name={summary.clubName} size={56} />
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>{summary.clubName}</p>
          <h1 className="h-display-hero" style={{ color: 'var(--text-primary)', marginBottom: 8 }}>
            SÄSONG {seasonSpanLabel(summary.season)}
          </h1>

          {/* Position — ScoreBlock (C-SY2 Våg 4). gold=mästare/cup, win=topp3, subtle=övrigt) */}
          {/* Poängsumman stannar text — ScoreBlock är för resultat, inte numeriska tal */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <ScoreBlock
              score={`${summary.finalPosition}.`}
              variant={isChampion || summary.cupResult === 'winner' ? 'gold'
                : summary.finalPosition <= 3 ? 'win'
                : 'subtle'}
              label="plats"
              light
            />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{summary.points} poäng</p>
          </div>

          {/* Playoff result */}
          {summary.playoffResult && (
            <p style={{
              fontSize: 13,
              fontWeight: 700,
              color: isChampion ? 'var(--accent)' : 'var(--text-secondary)',
              marginBottom: 4,
            }}>
              {playoffResultLabel(summary.playoffResult)}
            </p>
          )}
          {summary.playoffResult && playoffEliminationSentence(summary.playoffResult) && (
            <p style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginBottom: 4,
              fontStyle: 'italic',
            }}>
              {playoffEliminationSentence(summary.playoffResult)}
            </p>
          )}
          {summary.playoffResult && smWinnerSentence(summary.playoffResult) && (
            <p style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}>
              {smWinnerSentence(summary.playoffResult)}
            </p>
          )}

          {/* Board verdict */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 99,
            background: summary.expectationVerdict === 'failed' ? 'color-mix(in srgb, var(--danger) 15%, transparent)' : 'color-mix(in srgb, var(--success) 15%, transparent)',
            border: `1px solid ${summary.expectationVerdict === 'failed' ? 'color-mix(in srgb, var(--danger) 40%, transparent)' : 'color-mix(in srgb, var(--success) 40%, transparent)'}`,
          }}>
            <span style={{ fontSize: 12 }}>{verdictIcon(summary.expectationVerdict)}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: summary.expectationVerdict === 'failed' ? 'var(--danger)' : 'var(--success)' }}>
              {verdictText(summary)}
            </span>
          </div>

          {/* O18/High 1 (ÅRSBOKENS_TVASANNINGSMENING_2026-08-23.md): när
              placeringsdomen och uppdragsutfallet pekar åt olika håll står
              båda i en mening, förbundna med "men" — annars ingen rad alls.
              Placeringsdomen (fem rader, en per betyg 1-5) text låst av
              Jacob 2026-08-24, ordagrant — se placeringsdomText. */}
          {(() => {
            const placeringsdom = placeringsdomText(
              summary.boardExpectation,
              summary.finalPosition,
              summary.standingsSnapshot?.length ?? 12,
            )
            const twoTruths = seasonTwoTruthsSentence(summary, placeringsdom)
            return (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, maxWidth: 320 }}>
                {twoTruths ?? placeringsdom}
              </p>
            )
          })()}
        </div>

        <ChapterDivider label="Berättelsen" />

        {/* SIGNATURE RUBRIC */}
        {summary.signatureRubric && (
          <div style={{
            background: 'var(--bg-leather)',
            borderLeft: '3px solid var(--accent)',
            padding: '16px 18px',
            borderRadius: '0 6px 6px 0',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 22, marginBottom: 6, opacity: 0.9 }}>
              {getSignatureEmojiFromRubric(summary.signatureRubric)}
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: 'var(--text-light)', lineHeight: 1.4 }}>
              {summary.signatureRubric}
            </div>
          </div>
        )}

        {/* NARRATIVE */}
        <div className="card-sharp card-stagger-1" style={{ padding: '10px 14px', marginBottom: 8, borderLeft: '3px solid var(--accent)', background: 'color-mix(in srgb, var(--accent) 5%, transparent)' }}>
          <p style={{ fontSize: 15, fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            "{summary.narrativeSummary}"
          </p>
        </div>

        {/* ÅRETS MATCH — M12 */}
        {summary.matchOfTheSeason && (() => {
          const h = summary.matchOfTheSeason!
          const homeLabel = (h.isHome ? summary.clubName : h.opponentName).toUpperCase()
          const awayLabel = (h.isHome ? h.opponentName : summary.clubName).toUpperCase()
          const matchDate = (() => {
            try {
              const d = new Date(getRoundDate(summary.season, h.matchday))
              return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })
            } catch { return null }
          })()
          return (
            <div style={{
              background: 'var(--bg-elevated)',  // DB-8: dekorativ yt-gradient → solid (accent-ramen är cuen)
              border: '2px solid var(--accent)',
              borderRadius: 'var(--radius-md)',
              padding: '20px 18px',
              textAlign: 'center',
              position: 'relative',
              marginBottom: 8,
            }}>
              {/* Pill label */}
              <div className="h-label" style={{
                position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                background: 'var(--accent)', color: 'var(--text-light)',
                padding: '4px 16px', borderRadius: 99,
                whiteSpace: 'nowrap', marginBottom: 0,
              }}>⭐ SÄSONGENS MATCH</div>

              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '6px 0 12px', letterSpacing: 1, fontFamily: 'var(--font-body)' }}>
                Omgång {h.matchday}{matchDate ? ` · ${matchDate}` : ''}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: h.isHome ? 'var(--accent)' : 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                  {homeLabel}
                </span>
                {/* DB-3: hero-score → ScoreBlock */}
                {(() => {
                  const my = h.isHome ? h.homeScore : h.awayScore
                  const opp = h.isHome ? h.awayScore : h.homeScore
                  return <ScoreBlock score={`${h.homeScore}–${h.awayScore}`} variant={my > opp ? 'win' : my < opp ? 'loss' : 'draw'} size="hero" />
                })()}
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: !h.isHome ? 'var(--accent)' : 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                  {awayLabel}
                </span>
              </div>

              <p className="h-quote" style={{ lineHeight: 1.55, margin: '12px 12px 14px' }}>
                {h.narrative}
              </p>

              {h.potmName && (
                <p style={{ fontSize: 11, color: 'var(--accent)', margin: '0 0 14px', fontWeight: 600, fontFamily: 'var(--font-body)' }}>
                  ⭐ Match av matchen: {h.potmName}
                </p>
              )}

              <button
                onClick={handleShare}
                disabled={sharing}
                style={{
                  display: 'inline-block',
                  padding: '8px 18px',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                  fontSize: 10,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  cursor: sharing ? 'default' : 'pointer',
                  background: 'transparent',
                  borderRadius: 4,
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  opacity: sharing ? 0.5 : 1,
                }}
              >
                {/* 4.14 (SLUTTEST_KO.md, 2026-08-18): knappen anropar handleShare()
                    → shareSeasonImage(summary), som alltid producerar SÄSONGSKORTET,
                    inte en bild av just den här matchen (h.shareImageReady är permanent
                    false — matchHighlightService.ts har ingen egen bildgenerator).
                    "Spara som bild" lovade en matchartefakt knappen inte kan leverera.
                    Text låst av Jacob 2026-08-18, verbatim tills matchartefakten finns. */}
                {sharing ? 'Sparar...' : 'Dela säsongen'}
              </button>
            </div>
          )
        })()}

        {/* DIN SÄSONG — merged timeline */}
        {(() => {
          type TimelineItem = {
            round: number
            icon: string
            headline: string
            body: string
            relatedPlayerName?: string
            /** Satt bara för storyline-härledda rader — entity-dedup-grinden (2026-08-12). */
            storylineId?: string
          }
          const keyMomentItems: TimelineItem[] = []

          // keyMoments
          for (const m of summary.keyMoments ?? []) {
            const icon = m.type === 'derbyWin' ? '🔥'
              : m.type === 'derbyLoss' ? '😶'
              : m.type === 'hatTrick' ? '🎩'
              : m.type === 'bigWin' ? '✅'
              : m.type === 'bigLoss' ? '❌'
              : m.type === 'comeback' ? '💪'
              : m.type === 'lateWinner' ? '⚡'
              : m.type === 'storyline' ? '📖'
              : '⛸️'
            const relatedPlayer = m.relatedPlayerId ? game.players.find(p => p.id === m.relatedPlayerId) : null
            keyMomentItems.push({
              round: m.round,
              icon,
              headline: m.headline,
              body: m.body,
              relatedPlayerName: relatedPlayer ? `${relatedPlayer.firstName} ${relatedPlayer.lastName}` : undefined,
            })
          }

          // AUDIT DEL 2 A3 (2026-08-09): arc storylines — deduplicerade per typ.
          // (SÄSONGENS BERÄTTELSER, som körde samma filter mot samma
          // game.storylines med ett eget, odelat Set, är borttagen — de två
          // sektionerna dubblerade i praktiken varje säsong med ≥1 storyline.)
          // seenSlTypes speglas in i claimedStorylineTypes (komponent-scope)
          // så DINA VAL längre ned kan hoppa över typer som redan visats här.
          const allSeasonStorylines = game.storylines?.filter(s => s.season === summary.season) ?? []
          const seenSlTypes = new Set<string>()
          const seasonStorylines = allSeasonStorylines.filter(s => {
            if (seenSlTypes.has(s.type)) return false
            seenSlTypes.add(s.type)
            return true
          })
          const storylineEmoji = (type: string): string => {
            switch (type) {
              case 'rescued_from_unemployment': return '🏭'
              case 'went_fulltime_pro': return '⭐'
              case 'returned_to_club': return '🏠'
              case 'captain_rallied_team': return '💪'
              case 'underdog_season': return '🎯'
              case 'gala_winner': return '🏆'
              case 'left_for_bigger_club': return '👋'
              case 'journalist_feud': return '📰'
              case 'relegation_escape': return '😅'
              default: return '📖'
            }
          }
          const storylineItems: TimelineItem[] = seasonStorylines.map(sl => {
            const p = sl.playerId ? game.players.find(pl => pl.id === sl.playerId) : null
            return {
              round: sl.matchday ?? 99,
              icon: storylineEmoji(sl.type),
              headline: sl.displayText,
              body: '',
              relatedPlayerName: p ? `${p.firstName} ${p.lastName}` : undefined,
              storylineId: sl.id,
            }
          })

          // Storylines är sällsynta och narrativt tyngre än generiska keyMoments
          // (matchhändelser) — garantera dem plats i taket istf en blind
          // kronologisk slice(0,7) som kan trycka ut dem helt när en säsong har
          // många keyMoments (summary.keyMoments är redan självt kappat till 7
          // i seasonSummaryService.ts, så plats saknades annars helt).
          const CAP = 7
          const guaranteedStorylines = storylineItems.slice(0, CAP)
          const remainingBudget = Math.max(0, CAP - guaranteedStorylines.length)
          const selectedKeyMoments = keyMomentItems.slice(0, remainingBudget)
          const topItems = [...guaranteedStorylines, ...selectedKeyMoments].sort((a, b) => a.round - b.round)

          // Bara typer som FAKTISKT fick plats (samma index-ordning som storylineItems)
          // räknas som claimed — annars skulle en typ som knuffades ut av CAP ändå
          // spärra DINA VAL från att visa den, och storylinen skulle inte synas alls.
          for (const sl of seasonStorylines.slice(0, guaranteedStorylines.length)) {
            claimedStorylineTypes.add(sl.type)
          }

          if (topItems.length === 0) return null

          return (
            <div style={{ marginBottom: 8 }}>
              <SectionLabel style={{ marginBottom: 6 }}>🏒 DIN SÄSONG</SectionLabel>
              {topItems.map((item, i) => (
                <div
                  key={i}
                  className="card-round"
                  style={{ padding: '10px 12px', marginBottom: 6 }}
                  {...(item.storylineId ? { 'data-entity-id': `storyline:${item.storylineId}`, 'data-entity-source': 'SeasonSummaryTimeline' } : {})}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--bg-dark)', color: 'var(--text-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-body)',
                    }}>
                      O{item.round}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {item.icon} {item.headline}
                      </p>
                      {item.body && (
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 2, lineHeight: 1.4 }}>
                          {item.body}
                        </p>
                      )}
                      {item.relatedPlayerName && (
                        <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600 }}>{item.relatedPlayerName}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })()}

        {/* Å11-residual (SLUTTEST_KO.md, 6.4 post 21, 2026-08-20): kapitelrubriken
            var ovillkorlig även när BÅDA korten under den (Säsongens bästa +
            Svenska Cupen) gatas bort av DS-regel 12 — samma klass av fel en
            nivå upp, en rubrik ovanför tomrum. */}
        {shouldShowTruppenChapter(summary) && (
        <ChapterDivider label="Truppen" />
        )}

        {/* SEASON'S BEST — Å11 (SLUTTEST_KO.md, 2026-08-18, DS-regel 12): kortet
            renderade tidigare ovillkorligt även när alla fem award-fälten var
            null (för få matcher/data för säsongen) — en rubrik ovanför ett
            tomt grid. "✕ betyder att sektionen inte renderas. Inte ett tomt
            kort." Gated på faktisk data, precis som regeln kräver. */}
        {(summary.topScorer || summary.topAssister || summary.topRated || summary.mostImproved || summary.youngPlayer) && (
        <div className="card-sharp card-stagger-2" style={{ padding: '10px 14px', marginBottom: 8 }}>
          <SectionLabel>SÄSONGENS BÄSTA</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {summary.topScorer && (
              <AwardCard icon="🏒" title="Toppskyttar" name={summary.topScorer.name}
                value={`${summary.topScorer.goals} mål, ${summary.topScorer.assists} ass`} />
            )}
            {summary.topAssister && (
              <AwardCard icon="🅰️" title="Mest assist" name={summary.topAssister.name}
                value={`${summary.topAssister.assists} assist`} />
            )}
            {summary.topRated && (
              <AwardCard icon="⭐" title="Högst betyg" name={summary.topRated.name}
                value={`${summary.topRated.avgRating} snitt (${summary.topRated.games} matcher)`} />
            )}
            {summary.mostImproved && (
              <AwardCard icon="📈" title="Mest förbättrad" name={summary.mostImproved.name}
                value={`${summary.mostImproved.startCA} → ${summary.mostImproved.endCA} (+${summary.mostImproved.caGain})`} />
            )}
            {summary.youngPlayer && (
              <AwardCard icon="🌟" title={`Bästa U21 (${summary.youngPlayer.age} år)`} name={summary.youngPlayer.name}
                value={`${summary.youngPlayer.goals} mål · ${summary.youngPlayer.avgRating} snitt`} />
            )}
          </div>
        </div>
        )}

        {/* CUP RESULT */}
        {summary.cupResult && summary.cupResult !== 'eliminated' && (
          <div className="card-sharp card-stagger-2" style={{ padding: '10px 14px', marginBottom: 8 }}>
            <SectionLabel>SVENSKA CUPEN</SectionLabel>
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <span style={{ fontSize: summary.cupResult === 'winner' ? 32 : 24 }}>
                {summary.cupResult === 'winner' ? '🏆' : summary.cupResult === 'finalist' ? '🥈' : '🏆'}
              </span>
              <p style={{ fontSize: summary.cupResult === 'winner' ? 16 : 14, fontWeight: 700, color: summary.cupResult === 'winner' ? 'var(--accent)' : 'var(--text-primary)', marginTop: 6, fontFamily: 'var(--font-display)' }}> {/* ds-exempt: fontSize + color ternary */}
                {cupResultLabel(summary.cupResult)}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Svenska Cupen {seasonStartYear(summary.season)}
              </p>
            </div>
          </div>
        )}

        <ChapterDivider label="Siffrorna" />

        {/* STATISTICS */}
        <div className="card-sharp card-stagger-3" style={{ padding: '10px 14px', marginBottom: 8 }}>
          <SectionLabel>STATISTIK</SectionLabel>
          {/* C-SY2 Våg 4: W-D-L som tre kompakta ScoreBlocks sida vid sida */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <ScoreBlock score={String(summary.wins)} variant="win" label="V" compact light />
            <ScoreBlock score={String(summary.draws)} variant="draw" label="O" compact light />
            <ScoreBlock score={String(summary.losses)} variant="loss" label="F" compact light />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div>
              <StatRow label="Spelade" value={summary.wins + summary.draws + summary.losses} />
            </div>
            <div>
              <StatRow label="Mål gjorda" value={summary.goalsFor} />
              <StatRow label="Mål insläppta" value={summary.goalsAgainst} />
              <StatRow label="Hörnmål" value={summary.totalCornerGoals} />
              <StatRow label="Nollor" value={summary.totalCleanSheets} />
            </div>
          </div>
          {game.captainPlayerId && (() => {
            const captain = game.players.find(p => p.id === game.captainPlayerId)
            return captain ? <StatRow label="© Lagkapten" value={`${captain.firstName} ${captain.lastName}`} color="var(--accent)" /> : null
          })()}
        </div>

        {/* HOME vs AWAY */}
        <div className="card-stagger-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
          <div className="card-sharp" style={{ padding: '10px 14px' }}>
            <SectionLabel>HEMMA</SectionLabel>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>{summary.homeRecord.wins}</p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>V</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>O: {summary.homeRecord.draws}</span>
              <span style={{ fontSize: 13, color: 'var(--danger)' }}>F: {summary.homeRecord.losses}</span>
            </div>
          </div>
          <div className="card-sharp" style={{ padding: '10px 14px' }}>
            <SectionLabel>BORTA</SectionLabel>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>{summary.awayRecord.wins}</p>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>V</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>O: {summary.awayRecord.draws}</span>
              <span style={{ fontSize: 13, color: 'var(--danger)' }}>F: {summary.awayRecord.losses}</span>
            </div>
          </div>
        </div>

        {/* STREAKS */}
        <div className="card-sharp card-stagger-5" style={{ padding: '10px 14px', marginBottom: 8 }}>
          <SectionLabel>STREAKS OCH EXTREMER</SectionLabel>
          <StatRow label="Längsta vinstsvit" value={`${summary.longestWinStreak} matcher`} color="var(--success)" />
          <StatRow label="Längsta förlustsvit" value={`${summary.longestLossStreak} matcher`} color="var(--danger)" />
          {summary.biggestWin && (
            <StatRow label="Största vinst" value={`${summary.biggestWin.score} mot ${summary.biggestWin.opponent} (omg ${summary.biggestWin.round})`} color="var(--success)" />
          )}
          {summary.worstLoss && (
            <StatRow label="Tyngsta förlust" value={`${summary.worstLoss.score} mot ${summary.worstLoss.opponent}`} color="var(--danger)" />
          )}
        </div>

        {/* POINTS CHART */}
        <div className="card-sharp card-stagger-6" style={{ padding: '10px 14px', marginBottom: 8 }}>
          <SectionLabel>POÄNGKURVA</SectionLabel>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Första halvan: </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: summary.formTrend === 'declining' ? 'var(--success)' : 'var(--text-primary)' }}>{summary.firstHalfPoints} p</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Andra halvan: </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: summary.formTrend === 'improving' ? 'var(--success)' : 'var(--text-primary)' }}>{summary.secondHalfPoints} p</span>
            </div>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Trend: </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: summary.formTrend === 'improving' ? 'var(--success)' : summary.formTrend === 'declining' ? 'var(--danger)' : 'var(--text-primary)' }}>
                {summary.formTrend === 'improving' ? '↑' : summary.formTrend === 'declining' ? '↓' : '→'}
              </span>
            </div>
          </div>
          {/* C-SY2 Våg 4: kumulativa poäng → Sparkline (formkurva över säsongen, full bredd).
              areaFill bara vid full data (≥5); 0–1 punkter → ingen sparkline (yttre guard). */}
          {summary.roundPoints && summary.roundPoints.length >= 2 && (
            <Sparkline
              points={summary.roundPoints}
              stroke={summary.formTrend === 'improving' ? 'success' : summary.formTrend === 'declining' ? 'danger' : 'accent'}
              height={40}
              minPoints={2}
              areaFill={summary.roundPoints.length >= MIN_POINTS}
            />
          )}
        </div>

        {/* YOUTH INTAKE */}
        {summary.youthIntakeCount > 0 && (
          <div className="card-sharp card-stagger-6" style={{ padding: '10px 14px', marginBottom: 8 }}>
            <SectionLabel>UNGDOMSKULL</SectionLabel>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>
              {summary.youthIntakeCount} nya spelare rekryterades
            </p>
            {summary.bestYouthProspect && (
              <div style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', borderRadius: 'var(--radius-md)', padding: '10px 12px', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}>
                <p style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>BÄSTA PROSPEKT</p>
                <p style={{ fontSize: 14, fontWeight: 700 }}>{summary.bestYouthProspect.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {positionShort(summary.bestYouthProspect.position as PlayerPosition)} · Potential: {summary.bestYouthProspect.potential}
                </p>
              </div>
            )}
          </div>
        )}

        {/* COMMUNITY STANDING */}
        {summary.communityStandingEnd !== undefined && (
          <div className="card-sharp card-stagger-6" style={{ padding: '10px 14px', marginBottom: 8 }}>
            <SectionLabel>ORTEN</SectionLabel>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lokalstöd vid säsongsslut</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: csColor(summary.communityStandingEnd) }}>
                {summary.communityStandingEnd}
              </span>
            </div>
            <div style={{ height: 6, background: 'color-mix(in srgb, var(--ink) 8%, transparent)', borderRadius: 3 }}>
              <div style={{
                height: '100%',
                width: `${summary.communityStandingEnd}%`,
                background: csColor(summary.communityStandingEnd),
                borderRadius: 3,
                transition: 'width 0.6s ease',
              }} />
            </div>
            {(summary.communityHighlights ?? []).length > 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                {summary.communityHighlights.join(' · ')}
              </p>
            )}
          </div>
        )}

        {/* AVSLUTADE KARRIÄRER */}
        {(summary.retiredPlayers ?? []).length > 0 && (
          <div className="card-sharp card-stagger-7" style={{ padding: '10px 14px', marginBottom: 8 }}>
            <SectionLabel>👋 AVSLUTADE KARRIÄRER</SectionLabel>
            {(summary.retiredPlayers ?? []).map(p => (
              <div key={p.playerId} style={{
                borderBottom: '1px solid var(--border)',
                paddingBottom: 10,
                marginBottom: 10,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: p.isLegend ? 'var(--accent)' : 'var(--text-primary)' }}>
                      {p.isLegend ? '🎖️ ' : '👋 '}{p.name}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                      {p.age} år · {positionShort(p.position as PlayerPosition)}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {p.seasons} sás · {p.totalGoals} mål · {p.totalGames ?? '?'} matcher
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
                  {p.farewell}
                </p>
                {p.bestMoment && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                    ⭐ {p.bestMoment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* O18 fält 2 (SASONGENS_BESLUT_2026-08-23.md): säsongens viktigaste
            beslut — en färdig mening, ingen mall. undefined = ingen O19-
            systemhandelse löstes denna säsong, vilket är korrekt (ingen rad
            då, per domen). */}
        {summary.mostImportantDecision && (
          <div className="card-sharp card-stagger-7" style={{ padding: '10px 14px', marginBottom: 8 }}>
            <SectionLabel style={{ marginBottom: 6 }}>⚖️ SÄSONGENS BESLUT</SectionLabel>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {summary.mostImportantDecision}
            </p>
          </div>
        )}

        {/* DINA VAL */}
        {(() => {
          const decisions = collectSeasonDecisions(game, claimedStorylineTypes)
          if (decisions.length === 0) return null
          return (
            <div className="card-sharp card-stagger-7" style={{ padding: '10px 14px', marginBottom: 8 }}>
              <SectionLabel>📋 DINA VAL</SectionLabel>
              {decisions.map((d, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8,
                    padding: '5px 0',
                    borderBottom: i < decisions.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                  {...(d.storylineId ? { 'data-entity-id': `storyline:${d.storylineId}`, 'data-entity-source': 'SeasonSummaryDinaVal' } : {})}
                >
                  <span style={{ fontSize: 12, flexShrink: 0 }}>{d.icon}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, flex: 1 }}>{d.text}</span>
                  {d.round !== undefined && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, marginLeft: 'auto' }}>O{d.round}</span>
                  )}
                </div>
              ))}
            </div>
          )
        })()}

        {/* FINANCES */}
        <div className="card-sharp card-stagger-7" style={{ padding: '10px 14px', marginBottom: 8 }}>
          <SectionLabel>EKONOMI</SectionLabel>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vid säsongsstart</p>
              <p style={{ fontSize: 16, fontWeight: 700 }}>{formatFinanceAbs(summary.startFinances)}</p>
            </div>
            <span style={{ fontSize: 20, color: summary.financialChange >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              →
            </span>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vid säsongsslut</p>
              <p style={{ fontSize: 16, fontWeight: 700 }}>{formatFinanceAbs(summary.endFinances)}</p>
            </div>
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: summary.financialChange >= 0 ? 'var(--success)' : 'var(--danger)', marginTop: 8, textAlign: 'center' }}>
            {summary.financialChange >= 0 ? '+' : ''}{formatFinanceAbs(Math.abs(summary.financialChange))}
          </p>
        </div>


        {/* NEXT SEASON BUTTON (only if not historical view) */}
        {!isHistorical && (
          <div style={{ padding: '0 0 20px' }}>
            {/* R2-2: Dela/Historik → .btn-outline (accent; Historik slutar vara grå).
               Starta säsong → .btn-hero (ceremoniell, radius 14, glow). Radius-12 eliminerad. */}
            <button
              onClick={handleShare}
              disabled={sharing}
              className="btn btn-outline"
              style={{ width: '100%', marginBottom: 10 }}
            >
              {sharing ? 'Genererar bild...' : '📤 Dela din säsong'}
            </button>
            <button
              onClick={() => navigate('/game/history')}
              className="btn btn-outline"
              style={{ width: '100%', marginBottom: 10 }}
            >
              📖 Se hela karriärhistoriken
            </button>
            <button
              onClick={handleNextSeason}
              className="btn btn-hero"
              style={{ width: '100%' }}
            >
              Starta säsong {seasonSpanLabel(summary.season + 1)} →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function AwardCard({ icon, title, name, value }: { icon: string; title: string; name: string; value: string }) {
  return (
    <div style={{
      background: 'color-mix(in srgb, var(--accent) 6%, transparent)',
      border: '1px solid color-mix(in srgb, var(--accent) 15%, transparent)',
      borderRadius: 'var(--radius-md)',
      padding: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <span style={{ fontSize: 12 }}>{icon}</span>
        <span style={{ fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>{title}</span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{name}</p>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{value}</p>
    </div>
  )
}
