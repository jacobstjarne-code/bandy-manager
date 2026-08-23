import type { SeasonSummary, MatchHighlight, MatchHighlightCategory } from '../../domain/entities/SeasonSummary'
import { seasonSpanLabel, seasonStartYear } from '../../domain/utils/seasonYear'
import { ClubExpectation } from '../../domain/enums'
import { ordinal } from '../../domain/utils/numberFormat'
import { streakWord } from '../../domain/data/preMatchContextStrings'

const W = 1080
const MIN_H = 1350
const TOP_MARGIN = 120
// 4.12 (SLUTTEST_KO.md, 2026-08-18): rotorsak för "kapas i produktion" — H var
// fast 1350 och footern fast på H-60, men innehållshöjden är datadriven (playoff-
// raden + upp till tre statsrader är alla villkorade). Fixat innehåll (spelare/
// säsong utan de fyra villkorade blocken) rymdes inom 1350; värsta kombinationen
// (SM-final + toppskytt + bäst betyg + mest förbättrad) gjorde inte det, och
// footern ritades på en fast position oavsett var innehållet faktiskt slutade.
const FOOTER_RESERVED = 90

interface LayoutRow {
  /** Kort etikett för assertion-felmeddelandet — inte spelartext, syns aldrig i UI. */
  label: string
  height: number
  draw: (ctx: CanvasRenderingContext2D, y: number) => void
}

// O9 (O9_TEXT_ARETS_BERATTELSE_2026-08-21.md, DOM_DELNINGSKORTET_2026-08-17.md)
// — låst text, Opus/Fable. Rad 1-4 + tvåsanningsraden nedan ersätter det
// äldre 4.12-innehållet (position/W-D-L/mål/tre statskort) som byggde
// layoutmekaniken men aldrig fick O9:s text — exakt den "6., 21 poäng"-
// reduktion domens fynd kritiserade. Alla rader läser bara SeasonSummary,
// ingen fri prosa.
const POSITIONSORD = ['etta', 'tvåa', 'trea', 'fyra', 'femma', 'sexa', 'sjua', 'åtta', 'nia', 'tia', 'elva', 'tolva']

export function positionsord(pos: number): string {
  return POSITIONSORD[pos - 1] ?? `${pos}:e`
}

function kapitalisera(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const FORVANTANSSATS: Record<ClubExpectation, string> = {
  [ClubExpectation.WinLeague]: 'Skulle vinna ligan.',
  [ClubExpectation.ChallengeTop]: 'Skulle utmana i toppen.',
  [ClubExpectation.MidTable]: 'Skulle landa i mitten.',
  [ClubExpectation.AvoidBottom]: 'Skulle överleva.',
}

/**
 * Den STARKASTE enskilda utgången, prioritetsordning 1-5, alltid med
 * avslutande punkt. `forcePosition` (satt av rad 1 vid `failed`, aldrig av
 * tvåsanningsraden) hoppar över 1-5 och går direkt till placeringen —
 * domens regel: "ett misslyckande mot förväntan pyntas inte med en
 * cupframgång på rad 1".
 */
export function utfallssats(summary: SeasonSummary, forcePosition: boolean): string {
  if (!forcePosition) {
    if (summary.playoffResult === 'champion') return 'Svenska mästare.'
    if (summary.cupResult === 'winner') return 'Vann cupen.'
    if (summary.playoffResult === 'finalist') return 'SM-final.'
    if (summary.playoffResult === 'semifinal') return 'Semifinal.'
    if (summary.playoffResult === 'quarterfinal') return 'Kvartsfinal.'
  }
  return `Slutade ${positionsord(summary.finalPosition)}.`
}

/** Fallback vid `met` (ingen kontrast) — säsongens tydligaste enskilda fakta. */
function metFallbackRad(summary: SeasonSummary): string {
  const pos = kapitalisera(positionsord(summary.finalPosition))
  if (summary.longestWinStreak >= 4) return `${pos}. ${streakWord(summary.longestWinStreak)} raka segrar.`
  if (summary.biggestWin) return `${pos}. ${summary.biggestWin.score} mot ${summary.biggestWin.opponent}.`
  if (summary.topScorer) return `${pos}. ${summary.topScorer.name} gjorde ${summary.topScorer.goals} mål.`
  return `${pos}, ${summary.points} poäng.`
}

/** Rad 1 — kontrasten, eller met-fallbacken när ingen kontrast finns. */
export function kontrastRad(summary: SeasonSummary): string {
  if (summary.expectationVerdict === 'met') return metFallbackRad(summary)
  const forcePosition = summary.expectationVerdict === 'failed'
  return `${FORVANTANSSATS[summary.boardExpectation]} ${utfallssats(summary, forcePosition)}`
}

const MOMENT_MALL: Record<MatchHighlightCategory, (opponent: string, vara: number, deras: number) => string> = {
  late_winner: (o, v, d) => `Segern mot ${o} kom i sista minuterna. ${v}–${d}.`,
  derby_win: (o, v, d) => `Derbyt mot ${o}: ${v}–${d}.`,
  cup_drama: (o, v, d) => `Cupdramat mot ${o}: ${v}–${d}.`,
  playoff_decisive: (o, v, d) => `Slutspelsmatchen mot ${o}: ${v}–${d}.`,
  big_win: (o, v, d) => `${v}–${d} mot ${o}.`,
  comeback: (o, v, d) => `Vändningen mot ${o}: ${v}–${d}.`,
  underdog_upset: (o, v, d) => `${o} skulle vinna. Det blev ${v}–${d}.`,
}

/** Rad 2 — ögonblicket. undefined om ingen matchOfTheSeason finns (raden utelämnas, ingen ersättning). */
export function ogonblickRad(m: MatchHighlight | undefined): string | undefined {
  if (!m) return undefined
  const vara = m.isHome ? m.homeScore : m.awayScore
  const deras = m.isHome ? m.awayScore : m.homeScore
  return MOMENT_MALL[m.category](m.opponentName, vara, deras)
}

/** Rad 3 — statistiken som bevis. Cup-/slutspelstillägg dubbleras aldrig bort — rad 1 är budskapet, rad 3 är belägget. */
export function statistikRad(summary: SeasonSummary): string {
  let rad = `${ordinal(summary.finalPosition)} · ${summary.points} p · ${summary.goalsFor}–${summary.goalsAgainst}`
  if (summary.cupResult === 'winner') rad += ' · Cupmästare'
  else if (summary.cupResult === 'finalist') rad += ' · Cupfinal'
  else if (summary.cupResult === 'semifinal') rad += ' · Cupsemi'
  if (summary.playoffResult === 'champion') rad += ' · SM-guld'
  else if (summary.playoffResult === 'finalist') rad += ' · SM-final'
  else if (summary.playoffResult === 'semifinal') rad += ' · SM-semi'
  else if (summary.playoffResult === 'quarterfinal') rad += ' · Kvartsfinal'
  return rad
}

/**
 * Tvåsanningsraden — villkorad femte rad. Egen `utfallssats(summary, false)`,
 * OBEROENDE av vilken form rad 1 valde (kontrast eller met-fallback) — så
 * "Kvartsfinal — men två uppdrag missades." kan visas även när rad 1 var
 * en met-fallbackrad utan egen utfallssats.
 */
export function tvasanningsRad(summary: SeasonSummary): string | undefined {
  if (summary.expectationVerdict === 'failed') return undefined
  const outcome = summary.objectiveOutcome
  if (!outcome) return undefined
  const n = outcome.failed + outcome.atRisk
  if (n < 1) return undefined
  const satsUtanPunkt = utfallssats(summary, false).replace(/\.$/, '')
  const uppdragsord = n === 1 ? 'ett uppdrag missades' : `${n} uppdrag missades`
  return `${satsUtanPunkt} — men ${uppdragsord}.`
}

const FRAGA: Record<SeasonSummary['expectationVerdict'], (clubName: string) => string> = {
  exceeded: (c) => `Kan du ta ${c} längre?`,
  met: (c) => `Kan du göra det med ${c}?`,
  failed: () => 'Kan du göra det bättre?',
}

/** Rad 4 — frågan. */
export function fragaRad(summary: SeasonSummary): string {
  return FRAGA[summary.expectationVerdict](summary.clubName)
}

/**
 * Region-baserad layout: EN lista av rader driver både höjdberäkningen
 * (computeSeasonShareImageHeight) och den faktiska ritningen (drawRows) —
 * de kan inte längre divergera från varandra, vilket var precis hur den
 * fasta 1350:an och den villkorade innehållslängden hamnade i otakt.
 */
function buildLayoutRows(summary: SeasonSummary): LayoutRow[] {
  const pad = 90
  const rows: LayoutRow[] = []

  rows.push({
    label: 'arsbok-label', height: 60,
    draw: (ctx, y) => {
      ctx.font = `600 36px -apple-system, system-ui, sans-serif`
      ctx.fillStyle = 'rgba(245,241,235,0.35)'
      ctx.letterSpacing = '6px'
      ctx.textAlign = 'center'
      ctx.fillText('ÅRSBOK', W / 2, y)
    },
  })

  rows.push({
    label: 'club-name', height: 80,
    draw: (ctx, y) => {
      ctx.font = `800 72px -apple-system, system-ui, sans-serif`
      ctx.fillStyle = '#F5F1EB'
      ctx.letterSpacing = '2px'
      ctx.textAlign = 'center'
      ctx.fillText(summary.clubName.toUpperCase(), W / 2, y)
    },
  })

  rows.push({
    label: 'season', height: 100,
    draw: (ctx, y) => {
      ctx.font = `600 44px -apple-system, system-ui, sans-serif`
      ctx.fillStyle = 'rgba(245,241,235,0.55)'
      ctx.letterSpacing = '4px'
      ctx.textAlign = 'center'
      ctx.fillText(`SÄSONG ${seasonSpanLabel(summary.season)}`, W / 2, y)
    },
  })

  rows.push({
    label: 'divider-1', height: 80,
    draw: (ctx, y) => {
      ctx.strokeStyle = 'rgba(196,122,58,0.4)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(pad, y)
      ctx.lineTo(W - pad, y)
      ctx.stroke()
    },
  })

  // Rad 1 — kontrasten (eller met-fallbacken). Alltid närvarande.
  rows.push({
    label: 'kontrast', height: 150,
    draw: (ctx, y) => {
      ctx.font = `800 52px -apple-system, system-ui, sans-serif`
      ctx.fillStyle = '#F5F1EB'
      ctx.letterSpacing = '0px'
      ctx.textAlign = 'center'
      ctx.fillText(kontrastRad(summary), W / 2, y + 60)
    },
  })

  // Rad 2 — ögonblicket. Utelämnad (ingen ersättning) om matchOfTheSeason saknas.
  const ogonblick = ogonblickRad(summary.matchOfTheSeason)
  if (ogonblick) {
    rows.push({
      label: 'ogonblick', height: 90,
      draw: (ctx, y) => {
        ctx.font = `500 36px -apple-system, system-ui, sans-serif`
        ctx.fillStyle = 'rgba(245,241,235,0.7)'
        ctx.letterSpacing = '0px'
        ctx.textAlign = 'center'
        ctx.fillText(ogonblick, W / 2, y)
      },
    })
  }

  rows.push({
    label: 'divider-2', height: 60,
    draw: (ctx, y) => {
      ctx.strokeStyle = 'rgba(196,122,58,0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(pad, y)
      ctx.lineTo(W - pad, y)
      ctx.stroke()
    },
  })

  // Rad 3 — statistiken som bevis. Liten typografi, en rad. Alltid närvarande.
  rows.push({
    label: 'statistik', height: 60,
    draw: (ctx, y) => {
      ctx.font = `500 30px -apple-system, system-ui, sans-serif`
      ctx.fillStyle = 'rgba(245,241,235,0.5)'
      ctx.letterSpacing = '0px'
      ctx.textAlign = 'center'
      ctx.fillText(statistikRad(summary), W / 2, y)
    },
  })

  // Tvåsanningsraden — villkorad femte rad, under rad 3.
  const tvasanning = tvasanningsRad(summary)
  if (tvasanning) {
    rows.push({
      label: 'tvasanning', height: 50,
      draw: (ctx, y) => {
        ctx.font = `500 24px -apple-system, system-ui, sans-serif`
        ctx.fillStyle = 'rgba(245,241,235,0.4)'
        ctx.letterSpacing = '0px'
        ctx.textAlign = 'center'
        ctx.fillText(tvasanning, W / 2, y)
      },
    })
  }

  // Rad 4 — frågan, avslutande ovanför foten. Alltid närvarande.
  rows.push({
    label: 'fraga', height: 110,
    draw: (ctx, y) => {
      ctx.font = `700 40px -apple-system, system-ui, sans-serif`
      ctx.fillStyle = '#C47A3A'
      ctx.letterSpacing = '0px'
      ctx.textAlign = 'center'
      ctx.fillText(fragaRad(summary), W / 2, y + 40)
    },
  })

  return rows
}

function contentHeight(rows: LayoutRow[]): number {
  return rows.reduce((sum, r) => sum + r.height, 0)
}

/** Pure — testbar utan canvas. Samma rader som drawRows konsumerar, se buildLayoutRows. */
export function computeSeasonShareImageHeight(summary: SeasonSummary): number {
  return Math.max(MIN_H, TOP_MARGIN + contentHeight(buildLayoutRows(summary)) + FOOTER_RESERVED)
}

/**
 * Hård assertion (SLUTTEST_KO.md 4.12): ingenting får ritas efter H - FOOTER_RESERVED.
 * Kastar hellre än att tyst klippa — en rads deklarerade `height` som inte matchar
 * vad dess `draw` faktiskt ritar (t.ex. ett internt y+offset som växer förbi radens
 * egen box) ska synas som ett fel i utveckling, inte som en beskuren bild i produktion.
 */
export function assertWithinContentBounds(y: number, maxY: number, label: string): void {
  if (y > maxY) {
    throw new Error(
      `seasonShareImage: raden "${label}" ritas vid y=${y}, som är förbi den reserverade footer-gränsen ${maxY}. ` +
      `computeSeasonShareImageHeight och buildLayoutRows har hamnat i otakt — en rads deklarerade height matchar inte var den faktiskt ritas.`
    )
  }
}

function drawRows(ctx: CanvasRenderingContext2D, rows: LayoutRow[], maxContentY: number): void {
  let y = TOP_MARGIN
  for (const row of rows) {
    assertWithinContentBounds(y, maxContentY, row.label)
    row.draw(ctx, y)
    y += row.height
  }
}

export async function generateSeasonShareImage(summary: SeasonSummary): Promise<Blob | null> {
  try {
    const rows = buildLayoutRows(summary)
    const H = Math.max(MIN_H, TOP_MARGIN + contentHeight(rows) + FOOTER_RESERVED)
    const maxContentY = H - FOOTER_RESERVED

    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    // Background gradient: dark copper
    const bg = ctx.createLinearGradient(0, 0, W * 0.4, H)
    bg.addColorStop(0, '#0D1118')
    bg.addColorStop(0.5, '#110D08')
    bg.addColorStop(1, '#0A0E0A')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Copper accent overlay (top-left glow)
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 900)
    glow.addColorStop(0, 'rgba(196,122,58,0.18)')
    glow.addColorStop(1, 'rgba(196,122,58,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, W, H)

    // Top accent line
    ctx.fillStyle = '#C47A3A'
    ctx.fillRect(0, 0, W, 6)

    drawRows(ctx, rows, maxContentY)

    // Bottom watermark — alltid H-60, men H är nu beräknad så att sista
    // innehållsraden aldrig kan nå hit (maxContentY = H - FOOTER_RESERVED).
    ctx.font = `500 30px -apple-system, system-ui, sans-serif`
    ctx.fillStyle = 'rgba(245,241,235,0.2)'
    ctx.letterSpacing = '1px'
    ctx.textAlign = 'center'
    ctx.fillText('bandymanager.se', W / 2, H - 60)

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    })
  } catch {
    return null
  }
}

/**
 * 4.13 (SLUTTEST_KO.md, 2026-08-18). Tidigare: Promise<void>, svalde alla
 * fel tyst — anroparen kunde aldrig veta om delningen faktiskt lyckades,
 * laddades ner, avbröts av användaren, eller misslyckades helt.
 */
export type SeasonShareResult = 'shared' | 'downloaded' | 'cancelled' | 'failed'

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException ? e.name === 'AbortError' : (e as { name?: string } | undefined)?.name === 'AbortError'
}

export async function shareSeasonImage(summary: SeasonSummary): Promise<SeasonShareResult> {
  const blob = await generateSeasonShareImage(summary)
  if (!blob) return 'failed'

  const fileName = `bandy-${seasonStartYear(summary.season)}-${summary.clubName.replace(/\s/g, '_')}.png`

  // Web Share API (mobile)
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], fileName, { type: 'image/png' })
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `${summary.clubName} — Säsong ${seasonSpanLabel(summary.season)}`,
          // narrativeSummary är redan genererad, redan visad text (HistoryScreen,
          // SeasonSummaryScreen) — ingen ny svensk prosa, bara samma sträng återanvänd.
          text: summary.narrativeSummary,
          url: window.location.origin,
        })
        return 'shared'
      } catch (e) {
        // AbortError = användaren avbröt medvetet i delningsarket. Nedladdning
        // efter ett avbrott vore att tvinga fram artefakten trots att spelaren
        // sa nej — därför ingen fallback här, bara här.
        if (isAbortError(e)) return 'cancelled'
        // Annat delningsfel (t.ex. filen för stor för mottagaren) — fall through till nedladdning.
      }
    }
  }

  // Fallback: download
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
  return 'downloaded'
}
