import type { SeasonSummary } from '../../domain/entities/SeasonSummary'
import { seasonSpanLabel, seasonStartYear } from '../../domain/utils/seasonYear'

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

function playoffLabel(r: SeasonSummary['playoffResult']): string {
  switch (r) {
    case 'champion': return '🏆 SVENSKA MÄSTARE'
    case 'finalist': return '🥈 SM-finalist'
    case 'semifinal': return 'Semifinal'
    case 'quarterfinal': return 'Kvartsfinal'
    case 'didNotQualify': return 'Ej kvalad till slutspel'
    default: return ''
  }
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

  rows.push({
    label: 'position', height: 200,
    draw: (ctx, y) => {
      const posColor = summary.finalPosition === 1 ? '#C47A3A'
        : summary.finalPosition <= 3 ? '#C47A3A'
        : summary.finalPosition >= 10 ? '#C85A50'
        : '#F5F1EB'
      ctx.font = `900 200px -apple-system, system-ui, sans-serif`
      ctx.fillStyle = posColor
      ctx.letterSpacing = '-4px'
      ctx.textAlign = 'center'
      ctx.fillText(`${summary.finalPosition}.`, W / 2, y + 160)
    },
  })

  rows.push({
    label: 'points', height: 80,
    draw: (ctx, y) => {
      ctx.font = `600 42px -apple-system, system-ui, sans-serif`
      ctx.fillStyle = 'rgba(245,241,235,0.45)'
      ctx.letterSpacing = '2px'
      ctx.textAlign = 'center'
      ctx.fillText(`PLATS · ${summary.points} POÄNG`, W / 2, y + 10)
    },
  })

  if (summary.playoffResult) {
    rows.push({
      label: 'playoff', height: 80,
      draw: (ctx, y) => {
        ctx.font = `700 48px -apple-system, system-ui, sans-serif`
        ctx.fillStyle = summary.playoffResult === 'champion' ? '#C47A3A' : '#F5F1EB'
        ctx.letterSpacing = '1px'
        ctx.textAlign = 'center'
        ctx.fillText(playoffLabel(summary.playoffResult), W / 2, y)
      },
    })
  }

  rows.push({
    label: 'divider-2', height: 70,
    draw: (ctx, y) => {
      ctx.strokeStyle = 'rgba(196,122,58,0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(pad, y)
      ctx.lineTo(W - pad, y)
      ctx.stroke()
    },
  })

  rows.push({
    label: 'wdl', height: 180,
    draw: (ctx, y) => {
      const wdlItems = [
        { label: 'V', value: summary.wins, color: '#5A9A4A' },
        { label: 'O', value: summary.draws, color: '#F5F1EB' },
        { label: 'F', value: summary.losses, color: '#C85A50' },
      ]
      const cellW = (W - pad * 2) / 3
      for (let i = 0; i < wdlItems.length; i++) {
        const item = wdlItems[i]
        const cx = pad + cellW * i + cellW / 2
        ctx.font = `900 100px -apple-system, system-ui, sans-serif`
        ctx.fillStyle = item.color
        ctx.letterSpacing = '0px'
        ctx.textAlign = 'center'
        ctx.fillText(String(item.value), cx, y + 90)
        ctx.font = `600 32px -apple-system, system-ui, sans-serif`
        ctx.fillStyle = 'rgba(245,241,235,0.35)'
        ctx.letterSpacing = '3px'
        ctx.fillText(item.label, cx, y + 130)
      }
    },
  })

  rows.push({
    label: 'goals', height: 80,
    draw: (ctx, y) => {
      ctx.font = `600 38px -apple-system, system-ui, sans-serif`
      ctx.fillStyle = 'rgba(245,241,235,0.35)'
      ctx.letterSpacing = '2px'
      ctx.textAlign = 'center'
      ctx.fillText(`MÅL ${summary.goalsFor}–${summary.goalsAgainst}`, W / 2, y)
    },
  })

  rows.push({
    label: 'divider-3', height: 70,
    draw: (ctx, y) => {
      ctx.strokeStyle = 'rgba(196,122,58,0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(pad, y)
      ctx.lineTo(W - pad, y)
      ctx.stroke()
    },
  })

  if (summary.topScorer) {
    const topScorer = summary.topScorer
    rows.push({
      label: 'top-scorer', height: 110,
      draw: (ctx, y) => drawStat(ctx, '⛸️ TOPPSKYTT', topScorer.name, `${topScorer.goals} mål`, pad, y, W),
    })
  }

  if (summary.topRated) {
    const topRated = summary.topRated
    rows.push({
      label: 'top-rated', height: 110,
      draw: (ctx, y) => drawStat(ctx, '⭐ BÄST BETYG', topRated.name, `${topRated.avgRating.toFixed(1)} snitt`, pad, y, W),
    })
  }

  if (summary.mostImproved) {
    const mostImproved = summary.mostImproved
    rows.push({
      label: 'most-improved', height: 110,
      draw: (ctx, y) => drawStat(ctx, '📈 MEST FÖRBÄTTRAD', mostImproved.name, `+${mostImproved.caGain} CA`, pad, y, W),
    })
  }

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

function drawStat(
  ctx: CanvasRenderingContext2D,
  label: string,
  name: string,
  value: string,
  pad: number,
  y: number,
  W: number,
) {
  ctx.font = `600 28px -apple-system, system-ui, sans-serif`
  ctx.fillStyle = 'rgba(245,241,235,0.35)'
  ctx.letterSpacing = '2px'
  ctx.textAlign = 'left'
  ctx.fillText(label, pad, y)

  ctx.font = `700 42px -apple-system, system-ui, sans-serif`
  ctx.fillStyle = '#F5F1EB'
  ctx.letterSpacing = '0px'
  ctx.fillText(name, pad, y + 48)

  ctx.font = `600 36px -apple-system, system-ui, sans-serif`
  ctx.fillStyle = '#C47A3A'
  ctx.letterSpacing = '0px'
  ctx.textAlign = 'right'
  ctx.fillText(value, W - pad, y + 48)
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
