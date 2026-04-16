// DREAM-013: Lagfotografiet — genererar ett SVG-baserat "lagfoto"
// Sparas som SVG-sträng, visas i HistoryScreen, laddas ned på klick.

import type { Club } from '../../domain/entities/Club'
import type { Player } from '../../domain/entities/Player'

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function posAbbr(pos: string): string {
  if (pos === 'goalkeeper') return 'MV'
  if (pos === 'defender') return 'B'
  if (pos === 'half') return 'YH'
  if (pos === 'midfielder') return 'MF'
  if (pos === 'forward') return 'FW'
  return pos.slice(0, 2).toUpperCase()
}

export function generateTeamPhotoSvg(
  club: Club,
  players: Player[],
  season: number,
): string {
  const W = 900
  const H = 560
  const starters = players.slice(0, 18)
  const COLS = 6
  const ROW_Y = [200, 330, 460]
  const COL_X = Array.from({ length: COLS }, (_, i) => 80 + i * (W - 160) / (COLS - 1))

  const rows: Player[][] = [
    starters.slice(0, 6),
    starters.slice(6, 12),
    starters.slice(12, 18),
  ]

  const playerCards = rows.flatMap((row, ri) =>
    row.map((p, ci) => {
      const x = COL_X[ci]
      const y = ROW_Y[ri]
      const rating = p.seasonStats.averageRating > 0 ? p.seasonStats.averageRating.toFixed(1) : ''
      const name = escape(`${p.firstName.slice(0, 1)}. ${p.lastName}`)
      const pos = posAbbr(p.position)
      return `
        <circle cx="${x}" cy="${y - 24}" r="22" fill="rgba(245,241,235,0.08)" stroke="rgba(245,241,235,0.15)" stroke-width="1"/>
        <text x="${x}" y="${y - 18}" text-anchor="middle" font-size="11" fill="#C47A3A" font-family="Georgia, serif" font-weight="700">${pos}</text>
        <text x="${x}" y="${y + 4}" text-anchor="middle" font-size="11" fill="#E8E4DC" font-family="Georgia, serif">${name}</text>
        ${rating ? `<text x="${x}" y="${y + 18}" text-anchor="middle" font-size="10" fill="rgba(245,241,235,0.45)" font-family="Georgia, serif">${rating}</text>` : ''}
      `
    })
  ).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1A1410"/>
      <stop offset="100%" stop-color="#0D0A07"/>
    </linearGradient>
    <linearGradient id="stripe" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgba(196,122,58,0)" />
      <stop offset="50%" stop-color="rgba(196,122,58,0.15)" />
      <stop offset="100%" stop-color="rgba(196,122,58,0)" />
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <!-- Top stripe -->
  <rect x="0" y="0" width="${W}" height="3" fill="#C47A3A" opacity="0.6"/>
  <!-- Bottom stripe -->
  <rect x="0" y="${H - 3}" width="${W}" height="3" fill="#C47A3A" opacity="0.6"/>
  <!-- Center accent line -->
  <rect x="60" y="150" width="${W - 120}" height="1" fill="rgba(196,122,58,0.2)"/>
  <!-- Club name -->
  <text x="${W / 2}" y="60" text-anchor="middle" font-size="32" fill="#E8E4DC" font-family="Georgia, serif" font-weight="700" letter-spacing="3">${escape(club.name.toUpperCase())}</text>
  <!-- Season -->
  <text x="${W / 2}" y="92" text-anchor="middle" font-size="14" fill="#C47A3A" font-family="Georgia, serif" letter-spacing="2">SÄSONG ${season}/${season + 1}</text>
  <!-- Arena -->
  <text x="${W / 2}" y="116" text-anchor="middle" font-size="12" fill="rgba(245,241,235,0.35)" font-family="Georgia, serif">${escape(club.arenaName ?? '')}</text>
  <!-- Row labels -->
  <text x="28" y="${ROW_Y[0] - 8}" text-anchor="middle" font-size="9" fill="rgba(245,241,235,0.25)" font-family="Georgia, serif" transform="rotate(-90,28,${ROW_Y[0] - 8})">RAD 1</text>
  <!-- Players -->
  ${playerCards}
  <!-- Footer -->
  <text x="${W / 2}" y="${H - 18}" text-anchor="middle" font-size="10" fill="rgba(245,241,235,0.2)" font-family="Georgia, serif">Bandy Manager</text>
</svg>`
}
