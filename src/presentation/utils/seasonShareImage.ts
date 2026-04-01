import type { SeasonSummary } from '../../domain/services/seasonSummaryService'

const W = 1080
const H = 1350

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

export async function generateSeasonShareImage(summary: SeasonSummary): Promise<Blob | null> {
  try {
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

    const pad = 90
    let y = 120

    // ÅRSBOK label
    ctx.font = `600 36px -apple-system, system-ui, sans-serif`
    ctx.fillStyle = 'rgba(245,241,235,0.35)'
    ctx.letterSpacing = '6px'
    ctx.textAlign = 'center'
    ctx.fillText('ÅRSBOK', W / 2, y)
    y += 60

    // Club name
    ctx.font = `800 72px -apple-system, system-ui, sans-serif`
    ctx.fillStyle = '#F5F1EB'
    ctx.letterSpacing = '2px'
    ctx.fillText(summary.clubName.toUpperCase(), W / 2, y)
    y += 80

    // Season
    ctx.font = `600 44px -apple-system, system-ui, sans-serif`
    ctx.fillStyle = 'rgba(245,241,235,0.55)'
    ctx.letterSpacing = '4px'
    ctx.fillText(`SÄSONG ${summary.season}/${summary.season + 1}`, W / 2, y)
    y += 100

    // Divider
    ctx.strokeStyle = 'rgba(196,122,58,0.4)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(pad, y)
    ctx.lineTo(W - pad, y)
    ctx.stroke()
    y += 80

    // Position — big number
    const posColor = summary.finalPosition === 1 ? '#C47A3A'
      : summary.finalPosition <= 3 ? '#C47A3A'
      : summary.finalPosition >= 10 ? '#C85A50'
      : '#F5F1EB'

    ctx.font = `900 200px -apple-system, system-ui, sans-serif`
    ctx.fillStyle = posColor
    ctx.letterSpacing = '-4px'
    ctx.textAlign = 'center'
    ctx.fillText(`${summary.finalPosition}.`, W / 2, y + 160)
    y += 200

    ctx.font = `600 42px -apple-system, system-ui, sans-serif`
    ctx.fillStyle = 'rgba(245,241,235,0.45)'
    ctx.letterSpacing = '2px'
    ctx.fillText(`PLATS · ${summary.points} POÄNG`, W / 2, y + 10)
    y += 80

    // Playoff result
    if (summary.playoffResult) {
      ctx.font = `700 48px -apple-system, system-ui, sans-serif`
      ctx.fillStyle = summary.playoffResult === 'champion' ? '#C47A3A' : '#F5F1EB'
      ctx.letterSpacing = '1px'
      ctx.fillText(playoffLabel(summary.playoffResult), W / 2, y)
      y += 80
    }

    // Divider
    ctx.strokeStyle = 'rgba(196,122,58,0.25)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pad, y)
    ctx.lineTo(W - pad, y)
    ctx.stroke()
    y += 70

    // W/D/L row
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
    y += 180

    // Goals
    ctx.font = `600 38px -apple-system, system-ui, sans-serif`
    ctx.fillStyle = 'rgba(245,241,235,0.35)'
    ctx.letterSpacing = '2px'
    ctx.textAlign = 'center'
    ctx.fillText(`MÅL ${summary.goalsFor}–${summary.goalsAgainst}`, W / 2, y)
    y += 80

    // Divider
    ctx.strokeStyle = 'rgba(196,122,58,0.25)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pad, y)
    ctx.lineTo(W - pad, y)
    ctx.stroke()
    y += 70

    // Top scorer
    if (summary.topScorer) {
      drawStat(ctx, '🏒 TOPPSKYTT', summary.topScorer.name, `${summary.topScorer.goals} mål`, pad, y, W)
      y += 110
    }

    // Best rated
    if (summary.topRated) {
      drawStat(ctx, '⭐ BÄST BETYG', summary.topRated.name, `${summary.topRated.avgRating.toFixed(1)} snitt`, pad, y, W)
      y += 110
    }

    // Most improved
    if (summary.mostImproved) {
      drawStat(ctx, '📈 MEST FÖRBÄTTRAD', summary.mostImproved.name, `+${summary.mostImproved.caGain} CA`, pad, y, W)
      y += 110
    }

    // Bottom watermark
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

export async function shareSeasonImage(summary: SeasonSummary): Promise<void> {
  const blob = await generateSeasonShareImage(summary)
  if (!blob) return

  const fileName = `bandy-${summary.season}-${summary.clubName.replace(/\s/g, '_')}.png`

  // Web Share API (mobile)
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], fileName, { type: 'image/png' })
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `${summary.clubName} — Säsong ${summary.season}/${summary.season + 1}`,
        })
        return
      } catch {
        // User cancelled or error — fall through to download
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
}
