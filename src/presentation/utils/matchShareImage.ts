import type { MatchHighlight, SeasonSummary } from '../../domain/entities/SeasonSummary'
import type { SeasonShareResult } from './seasonShareImage'
import { seasonSpanLabel } from '../../domain/utils/seasonYear'
import { storedRoundLabel } from '../../domain/roundLabel'

const WIDTH = 1080
const HEIGHT = 1350

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line)
      line = word
    } else line = candidate
  }
  if (line) lines.push(line)
  return lines
}

export function generateMatchShareImage(summary: SeasonSummary, match: MatchHighlight): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)

  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT)
  gradient.addColorStop(0, '#211A15')
  gradient.addColorStop(1, '#090A08')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.fillStyle = '#C47A3A'
  ctx.fillRect(0, 0, WIDTH, 14)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#8A857A'
  ctx.font = '700 30px system-ui'
  ctx.fillText('ÅRETS MATCH', WIDTH / 2, 120)
  ctx.fillStyle = '#F5F1EB'
  ctx.font = '800 64px Georgia'
  ctx.fillText(summary.clubName.toUpperCase(), WIDTH / 2, 210)
  ctx.fillStyle = '#C4BAA8'
  ctx.font = '600 30px system-ui'
  ctx.fillText(`SÄSONG ${seasonSpanLabel(summary.season)}`, WIDTH / 2, 270)

  const homeName = match.isHome ? summary.clubName : match.opponentName
  const awayName = match.isHome ? match.opponentName : summary.clubName
  ctx.fillStyle = '#C4BAA8'
  ctx.font = '700 31px system-ui'
  ctx.fillText(`${homeName}  —  ${awayName}`, WIDTH / 2, 410)
  ctx.fillStyle = '#F5F1EB'
  ctx.font = '900 180px Georgia'
  ctx.fillText(`${match.homeScore}–${match.awayScore}`, WIDTH / 2, 610)
  ctx.fillStyle = '#C47A3A'
  ctx.font = '700 26px system-ui'
  ctx.fillText(storedRoundLabel(match.roundLabel, match.matchday), WIDTH / 2, 675)

  ctx.fillStyle = '#F5F1EB'
  ctx.font = 'italic 40px Georgia'
  const lines = wrapText(ctx, match.narrative, 820).slice(0, 5)
  lines.forEach((line, i) => ctx.fillText(line, WIDTH / 2, 790 + i * 56))

  if (match.potmName) {
    ctx.fillStyle = '#C4BAA8'
    ctx.font = '600 27px system-ui'
    ctx.fillText(`MATCHENS SPELARE · ${match.potmName}`, WIDTH / 2, 1120)
  }
  ctx.fillStyle = '#8A857A'
  ctx.font = '600 25px system-ui'
  ctx.fillText('bandymanager.se', WIDTH / 2, 1280)

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
}

function fileName(summary: SeasonSummary, match: MatchHighlight): string {
  const club = summary.clubName.toLowerCase().replace(/[^a-z0-9åäö]+/gi, '-').replace(/^-|-$/g, '')
  return `bandy-arets-match-${club}-${match.fixtureId}.png`
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export async function shareMatchImage(summary: SeasonSummary, match: MatchHighlight): Promise<SeasonShareResult> {
  const blob = await generateMatchShareImage(summary, match)
  if (!blob) return 'failed'
  const name = fileName(summary, match)
  try {
    const file = new File([blob], name, { type: 'image/png' })
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file], title: `${summary.clubName} — Årets match`,
        text: match.narrative, url: window.location.origin,
      })
      return 'shared'
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
  }
  download(blob, name)
  return 'downloaded'
}
