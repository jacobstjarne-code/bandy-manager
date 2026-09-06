import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import { MatchEventType } from '../../../domain/enums'
import { SectionLabel } from '../../components/SectionLabel'
import { seededRand } from './helpers'

interface GranskaShotmapProps {
  game: SaveGame
  fixture: Fixture | undefined
  isHome: boolean
}

/**
 * Audit-fynd 2026-08-29: "skottkartan överlappar etiketter nära målet".
 * Rot: alla mål slumpas in i samma 60×38-ruta framför mål, och namnetiketten
 * lades på en fast 12px-radie i en av åtta vinklar härledd ur namnets FÖRSTA
 * BOKSTAV — två målskyttar på samma bokstav fick identisk vinkel, och täta
 * prickar la etiketter ovanpå varandra oavsett vinkel.
 *
 * Två åtgärder, båda deterministiska (ingen ny slump, samma seed ger samma bild):
 *  1. separateDots — relaxationspass som knuffar isär prickar närmare varandra
 *     än summan av radierna + 1px, klämt till zonens gränser.
 *  2. placeLabel — testar kandidatpositioner runt pricken och tar första som
 *     inte krockar med en redan placerad etikett; ingen plats → ingen etikett
 *     (översikten hålls ren, hellre färre namn än oläslig gyttja).
 * Flera mål av samma skytt aggregeras till "Namn ×2" — en etikett, inte fler.
 */
function separateDots<T extends { x: number; y: number; r: number }>(
  items: T[],
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
): void {
  const PAD = 1
  for (let pass = 0; pass < 12; pass++) {
    let moved = false
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i], b = items[j]
        const dx = b.x - a.x, dy = b.y - a.y
        const distSq = dx * dx + dy * dy
        const minDist = a.r + b.r + PAD
        if (distSq >= minDist * minDist) continue
        const dist = Math.sqrt(distSq) || 0.001
        // Deterministisk knuff även vid exakt sammanfall (dist ~0)
        const nx = distSq === 0 ? ((i % 2) === 0 ? 1 : -1) : dx / dist
        const ny = distSq === 0 ? ((j % 2) === 0 ? 1 : -1) : dy / dist
        const push = (minDist - dist) / 2
        a.x -= nx * push; a.y -= ny * push
        b.x += nx * push; b.y += ny * push
        moved = true
      }
    }
    for (const it of items) {
      it.x = Math.max(bounds.minX + it.r, Math.min(bounds.maxX - it.r, it.x))
      it.y = Math.max(bounds.minY + it.r, Math.min(bounds.maxY - it.r, it.y))
    }
    if (!moved) break
  }
}

type LabelBox = { x: number; y: number; w: number; h: number }

/** Cirkel mot rektangel — närmaste punkt i boxen, jämför mot radien. */
function circleHitsBox(c: { x: number; y: number; r: number }, b: LabelBox): boolean {
  const nx = Math.max(b.x, Math.min(c.x, b.x + b.w))
  const ny = Math.max(b.y, Math.min(c.y, b.y + b.h))
  const dx = c.x - nx, dy = c.y - ny
  return dx * dx + dy * dy < c.r * c.r
}

/**
 * Första kandidatposition utan krock — mot både redan placerade etiketter OCH
 * mot prickarna själva (annars lägger sig ett namn tvärs över en granne, vilket
 * var precis det auditen såg). null = ingen plats fanns, etiketten hoppas över.
 */
function placeLabel(
  cx: number, cy: number, dotR: number, text: string,
  placed: LabelBox[],
  dots: Array<{ x: number; y: number; r: number }>,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
): { x: number; y: number; anchor: 'start' | 'end' } | null {
  const w = text.length * 4.0 + 2  // fontSize 7, grov men stabil bredduppskattning
  const h = 7
  for (const radius of [dotR + 5, dotR + 10, dotR + 16, dotR + 22]) {
    for (let a = 0; a < 12; a++) {
      const angle = (a / 12) * Math.PI * 2
      const ox = Math.cos(angle) * radius
      const oy = Math.sin(angle) * radius
      const anchor: 'start' | 'end' = ox < 0 ? 'end' : 'start'
      const tx = cx + ox + (anchor === 'end' ? -2 : 2)
      const ty = cy + oy + 2.5
      const box: LabelBox = { x: anchor === 'end' ? tx - w : tx, y: ty - h, w, h }
      if (box.x < bounds.minX || box.x + box.w > bounds.maxX) continue
      if (box.y < bounds.minY || box.y + box.h > bounds.maxY) continue
      const hitsLabel = placed.some(p =>
        box.x < p.x + p.w && box.x + box.w > p.x && box.y < p.y + p.h && box.y + box.h > p.y)
      if (hitsLabel) continue
      // Egen prick undantagen: etiketten startar redan utanför dess radie.
      const hitsDot = dots.some(d => !(d.x === cx && d.y === cy) && circleHitsBox(d, box))
      if (hitsDot) continue
      placed.push(box)
      return { x: tx, y: ty, anchor }
    }
  }
  return null
}

/**
 * @cites fixture.report.shotsHome, fixture.report.shotsAway, fixture.events, fixture.report.savesHome, fixture.report.savesAway, game.fixtures
 */
export function GranskaShotmap({ game, fixture, isHome }: GranskaShotmapProps) {
  if (!fixture?.report) return null

  const managedClubId = isHome ? fixture.homeClubId : fixture.awayClubId
  const goals = fixture.events.filter(e => e.type === MatchEventType.Goal && e.clubId === managedClubId)

  const totalShots   = isHome ? fixture.report.shotsHome   : fixture.report.shotsAway
  const scoredCount  = goals.length
  // savedCount = opponent GK saves of our shots; use report.savesAway (away GK) if we're home, savesHome if we're away
  const savedCount   = isHome ? (fixture.report.savesAway ?? 0) : (fixture.report.savesHome ?? 0)
  // scoredCount + savedCount = shots on target for this team this match.
  // Equivalent to report.onTargetHome/Away but robust against interactive corner goals,
  // which go via matchReducer INTERACTIVE_GOAL and bypass the onTarget counter.
  const onTargetCount = scoredCount + savedCount
  const missCount    = Math.max(0, totalShots - onTargetCount)

  // Two isolated penalty zones — top: our attack, bottom: opponent attack
  // No center line or full-pitch illusion — shows only what matters
  const W = 280
  const H = 230
  const GX = 140
  const GT = 4    // top goal crossbar y
  const GB = 226  // bottom goal crossbar y
  const TOP_MAX = 100  // bottom edge of our-attack zone
  const BOT_MIN = 130  // top edge of opponent-attack zone

  type ShotDot = { x: number; y: number; r: number; kind: 'goal' | 'save' | 'miss'; label?: string }
  const dots: ShotDot[] = []
  let seed = 0
  const DOT_R = { goal: 6, save: 3, miss: 2 } as const

  function nextPos(kind: 'goal' | 'save' | 'miss', playerId?: string): { x: number; y: number } {
    seed++
    const r1 = seededRand(seed * 7 + (playerId ? playerId.charCodeAt(0) : 0))
    const r2 = seededRand(seed * 13 + 1)
    let x: number, y: number
    if (kind === 'goal') {
      x = GX + (r1 - 0.5) * 60;  y = GT + 12 + r2 * 38
    } else if (kind === 'save') {
      x = GX + (r1 - 0.5) * 100;  y = GT + 10 + r2 * 65
    } else {
      x = 15 + r1 * 250;  y = GT + 15 + r2 * 78
    }
    return { x: Math.max(6, Math.min(W - 6, x)), y: Math.max(GT + 4, Math.min(TOP_MAX - 4, y)) }
  }

  // Kluster-och-räkna: flera mål av samma skytt blir EN etikett ("Pålsson ×2"),
  // inte samma namn upprepat ovanpå sig självt.
  const goalCountByName = new Map<string, number>()
  for (const e of goals) {
    const scorer = e.playerId ? game.players.find(p => p.id === e.playerId) : null
    if (scorer?.lastName) goalCountByName.set(scorer.lastName, (goalCountByName.get(scorer.lastName) ?? 0) + 1)
  }
  goals.forEach(e => {
    const pos = nextPos('goal', e.playerId)
    const scorer = e.playerId ? game.players.find(p => p.id === e.playerId) : null
    dots.push({ ...pos, r: DOT_R.goal, kind: 'goal', label: scorer?.lastName })
  })
  for (let i = 0; i < savedCount; i++) dots.push({ ...nextPos('save'), r: DOT_R.save, kind: 'save' })
  for (let i = 0; i < missCount; i++) dots.push({ ...nextPos('miss'), r: DOT_R.miss, kind: 'miss' })
  separateDots(dots, { minX: 4, maxX: W - 4, minY: GT + 2, maxY: TOP_MAX - 2 })

  const oppClubId = isHome ? fixture.awayClubId : fixture.homeClubId
  const managedClub = game.clubs.find(c => c.id === managedClubId)
  const oppClub = game.clubs.find(c => c.id === oppClubId)
  const oppShots = isHome ? fixture.report.shotsAway : fixture.report.shotsHome
  const oppGoals = fixture.events.filter(e => e.type === MatchEventType.Goal && e.clubId !== managedClubId).length
  const oppSavedByUs = isHome ? (fixture.report.savesHome ?? 0) : (fixture.report.savesAway ?? 0)

  type OppDot = { x: number; y: number; r: number; kind: 'goal' | 'save' | 'miss' }
  const oppDots: OppDot[] = []
  let oppSeed = 100
  const OPP_DOT_R = { goal: 5, save: 2.5, miss: 2 } as const

  function nextOppPos(kind: 'goal' | 'save' | 'miss'): { x: number; y: number } {
    oppSeed++
    const r1 = seededRand(oppSeed * 11)
    const r2 = seededRand(oppSeed * 17)
    let x: number, y: number
    if (kind === 'goal') {
      x = GX + (r1 - 0.5) * 60;  y = GB - 12 - r2 * 38
    } else if (kind === 'save') {
      x = GX + (r1 - 0.5) * 100;  y = GB - 10 - r2 * 65
    } else {
      x = 15 + r1 * 250;  y = GB - 15 - r2 * 78
    }
    return { x: Math.max(6, Math.min(W - 6, x)), y: Math.max(BOT_MIN + 4, Math.min(GB - 4, y)) }
  }

  const oppSavedCount = oppSavedByUs
  const oppMissCount = Math.max(0, oppShots - oppGoals - oppSavedCount)
  for (let i = 0; i < oppGoals; i++) oppDots.push({ ...nextOppPos('goal'), r: OPP_DOT_R.goal, kind: 'goal' })
  for (let i = 0; i < oppSavedCount; i++) oppDots.push({ ...nextOppPos('save'), r: OPP_DOT_R.save, kind: 'save' })
  for (let i = 0; i < oppMissCount; i++) oppDots.push({ ...nextOppPos('miss'), r: OPP_DOT_R.miss, kind: 'miss' })
  separateDots(oppDots, { minX: 4, maxX: W - 4, minY: BOT_MIN + 2, maxY: GB - 2 })

  return (
    <div className="card-sharp" style={{ margin: '0 0 6px', padding: '10px 12px' }}>
      <SectionLabel style={{ marginBottom: 8 }}>SKOTTBILD</SectionLabel>
      <div style={{ marginBottom: 8 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}>
          {/* ── TOP ZONE: våra skott → motståndarens mål (topp) ── */}
          <rect x="0" y="0" width={W} height={TOP_MAX} fill="var(--bg-elevated)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" rx="3" />
          {/* Net hint + crossbar + posts */}
          <rect x={121} y={0} width={38} height={GT} fill="rgba(0,0,0,0.05)" />
          <line x1={120} y1={GT} x2={160} y2={GT} stroke="rgba(0,0,0,0.65)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1={120} y1={0} x2={120} y2={GT} stroke="rgba(0,0,0,0.55)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1={160} y1={0} x2={160} y2={GT} stroke="rgba(0,0,0,0.55)" strokeWidth="1.5" strokeLinecap="round" />
          {/* Målgård halvcirkel radie 22px */}
          <path d="M 118 4 A 22 22 0 0 1 162 4" fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="1" />
          {/* Straffområde halvcirkel radie 75px */}
          <path d="M 65 4 A 75 75 0 0 1 215 4" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
          {/* Straffpunkt 53px från mål */}
          <circle cx={GX} cy={57} r={1.5} fill="rgba(0,0,0,0.3)" />

          {/* ── SEPARATOR ── */}
          <rect x="0" y="100" width="280" height="30" fill="rgba(0,0,0,0.07)" />
          <text x="14" y="119" fontSize="8" fill="rgba(0,0,0,0.65)" fontWeight="700" letterSpacing="0.8">↑ VI ANFALLER</text>
          <text x="266" y="119" fontSize="8" fill="rgba(0,0,0,0.65)" textAnchor="end" fontWeight="700" letterSpacing="0.8">DE ANFALLER ↓</text>

          {/* ── BOTTOM ZONE: motståndarens skott → vårt mål (botten) ── */}
          <rect x="0" y={BOT_MIN} width={W} height={H - BOT_MIN} fill="var(--bg-elevated)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" rx="3" />
          {/* Net hint + crossbar + posts */}
          <rect x={121} y={GB} width={38} height={H - GB} fill="rgba(0,0,0,0.05)" />
          <line x1={120} y1={GB} x2={160} y2={GB} stroke="rgba(0,0,0,0.65)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1={120} y1={GB} x2={120} y2={H} stroke="rgba(0,0,0,0.55)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1={160} y1={GB} x2={160} y2={H} stroke="rgba(0,0,0,0.55)" strokeWidth="1.5" strokeLinecap="round" />
          {/* Målgård halvcirkel radie 22px */}
          <path d="M 118 226 A 22 22 0 0 0 162 226" fill="none" stroke="rgba(0,0,0,0.28)" strokeWidth="1" />
          {/* Straffområde halvcirkel radie 75px */}
          <path d="M 65 226 A 75 75 0 0 0 215 226" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
          {/* Straffpunkt 53px från mål */}
          <circle cx={GX} cy={173} r={1.5} fill="rgba(0,0,0,0.3)" />

          {/* Our shot dots (top zone) */}
          {(() => {
            const seenLabels = new Set<string>()
            const placedLabels: LabelBox[] = []
            const labelBounds = { minX: 2, maxX: W - 2, minY: GT + 1, maxY: TOP_MAX - 1 }
            return dots.map((d, i) => {
              const showLabel = d.label != null && !seenLabels.has(d.label)
              if (d.label && showLabel) seenLabels.add(d.label)
              const count = d.label ? (goalCountByName.get(d.label) ?? 1) : 1
              const labelText = d.label ? (count > 1 ? `${d.label} ×${count}` : d.label) : ''
              const pos = showLabel && labelText
                ? placeLabel(d.x, d.y, d.r, labelText, placedLabels, dots, labelBounds)
                : null
              return (
                <g key={i}>
                  <circle
                    cx={d.x} cy={d.y}
                    r={d.r}
                    fill={d.kind === 'goal' ? 'color-mix(in srgb, var(--success) 85%, transparent)' : d.kind === 'save' ? 'color-mix(in srgb, var(--accent) 70%, transparent)' : 'rgba(0,0,0,0.15)'}
                    stroke={d.kind === 'goal' ? 'var(--success)' : d.kind === 'save' ? 'var(--accent)' : 'rgba(0,0,0,0.3)'}
                    strokeWidth="1"
                  />
                  {pos && (
                    <text x={pos.x} y={pos.y} fontSize="7" textAnchor={pos.anchor} fill="rgba(0,0,0,0.55)">{labelText}</text>
                  )}
                </g>
              )
            })
          })()}

          {/* Opponent shot dots (bottom zone) */}
          {(() => {
            const oppDotScale = oppDots.length > 30 ? 0.6 : 1.0
            const oppDotOpacity = oppDots.length > 30 ? 0.5 : 0.75
            return oppDots.map((d, i) => (
              <circle
                key={`opp-${i}`}
                cx={d.x} cy={d.y}
                r={d.r * oppDotScale}
                fill={d.kind === 'goal' ? 'color-mix(in srgb, var(--danger) 60%, transparent)' : d.kind === 'save' ? 'color-mix(in srgb, var(--accent) 40%, transparent)' : 'rgba(0,0,0,0.1)'}
                stroke={d.kind === 'goal' ? 'color-mix(in srgb, var(--danger) 90%, transparent)' : 'rgba(0,0,0,0.25)'}
                strokeWidth="1"
                opacity={oppDotOpacity}
              />
            ))
          })()}
        </svg>
      </div>

      {/* Legend — en rad per zon (topp = vi anfaller, botten = de anfaller) */}
      <div style={{ marginBottom: 8 }}>
        {[
          { name: managedClub?.shortName ?? 'Vi', goal: scoredCount, save: savedCount, miss: missCount, goalColor: 'var(--success)' },
          { name: oppClub?.shortName ?? 'De', goal: oppGoals, save: oppSavedByUs, miss: oppMissCount, goalColor: 'color-mix(in srgb, var(--danger) 80%, transparent)' },
        ].map((row, ri) => (
          <div key={ri} style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center', marginBottom: 3 }}>
            <span className="h-label" style={{ color: 'var(--text-muted)', minWidth: 44, textAlign: 'right', marginBottom: 0 }}>
              {row.name.toUpperCase()}
            </span>
            {[
              { color: row.goalColor, label: `${row.goal} mål` },
              { color: 'var(--accent)', label: `${row.save} räddade` },
              { color: 'rgba(0,0,0,0.28)', label: `${row.miss} miss` },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.color }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* DITT SKOTTMÖNSTER */}
      <div className="card-sharp" style={{ marginTop: 8, padding: '10px 12px' }}>
        <SectionLabel style={{ marginBottom: 8 }}>🎯 DITT SKOTTMÖNSTER</SectionLabel>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Den här matchen</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
            {totalShots} skott · {onTargetCount} på mål · {totalShots > 0 ? Math.round(scoredCount / totalShots * 100) : 0}% målkonvertering
          </span>
        </div>
        {(() => {
          // Compute season-to-date stats from all completed managed club fixtures
          const completedFixtures = game.fixtures.filter(f =>
            f.report != null &&
            (f.homeClubId === managedClubId || f.awayClubId === managedClubId) &&
            f.id !== fixture.id
          )
          const seasonShots = completedFixtures.reduce((sum, f) => {
            const h = f.homeClubId === managedClubId
            return sum + (h ? (f.report?.shotsHome ?? 0) : (f.report?.shotsAway ?? 0))
          }, 0)
          const seasonGoals = completedFixtures.reduce((sum, f) => {
            const h = f.homeClubId === managedClubId
            return sum + (h ? f.homeScore : f.awayScore)
          }, 0)
          const seasonConversion = seasonShots > 0 ? Math.round(seasonGoals / seasonShots * 100) : 0
          if (completedFixtures.length === 0) return null
          return (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Hittills ({completedFixtures.length} matcher)</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                {seasonShots} skott · {seasonConversion}% konv.
              </span>
            </div>
          )
        })()}
      </div>

      {/* MOTSTÅNDAREN */}
      {(() => {
        if (!oppClub) return null
        const oppOnTargetDisplay = oppGoals + oppSavedByUs
        const oppConversion = oppOnTargetDisplay > 0 ? Math.round(oppGoals / oppOnTargetDisplay * 100) : 0
        return (
          <div className="card-sharp" style={{ marginTop: 6, padding: '10px 12px' }}>
            <SectionLabel style={{ marginBottom: 8 }}>🛡 {oppClub.name.toUpperCase()}</SectionLabel>
            {(() => {
              const oppOnTargetDisplay = oppGoals + oppSavedByUs
              const savePct = oppOnTargetDisplay > 0 ? Math.round(oppSavedByUs / oppOnTargetDisplay * 100) : 0
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Skott / på mål</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {oppShots} / {oppOnTargetDisplay} · {oppConversion}% konvertering
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Vår MV</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: oppSavedByUs > 0 ? 'var(--success)' : 'var(--text-primary)' }}>
                      {oppSavedByUs} räddningar · {savePct}% räddningsprocent
                    </span>
                  </div>
                </>
              )
            })()}
          </div>
        )
      })()}

      {/* INSIKT */}
      {(() => {
        const myConv = totalShots > 0 ? scoredCount / totalShots : 0
        const oppConv = oppShots > 0 ? oppGoals / oppShots : 0
        let insight = ''
        if (myConv > 0.4 && oppConv < 0.2) {
          insight = `Klinisk effektivitet — ni konverterade ${Math.round(myConv * 100)}% av skotten medan motståndaren bara lyckades med ${Math.round(oppConv * 100)}%.`
        } else if (myConv < 0.2 && oppConv > 0.3) {
          insight = `Motståndaren var mer effektiva. Era ${totalShots} skott gav bara ${scoredCount} mål — nästa match handlar om att skapa lägen nära mål.`
        } else if (totalShots > oppShots + 5) {
          insight = `Ni dominerade skottstatistiken (${totalShots} mot ${oppShots}) men konverteringen avgör. Fortsätt pressa på.`
        } else if (oppShots > totalShots + 5) {
          insight = `Motståndaren hade flest skott (${oppShots} mot ${totalShots}). Defensiven behöver hålla linjerna bättre.`
        } else if (scoredCount >= 3 && myConv > 0.35) {
          insight = `Stark offensiv — ${scoredCount} mål på ${totalShots} skott är över ligasnittet. Håll den formen.`
        } else {
          insight = `${totalShots} skott och ${scoredCount} mål. Motståndaren sköt ${oppShots} gånger och sköt ${oppGoals} mål.`
        }
        return (
          <div style={{ marginTop: 6, padding: '8px 10px', background: 'color-mix(in srgb, var(--accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)', borderRadius: 'var(--radius-md)' }}>
            <SectionLabel style={{ color: 'var(--accent)', marginBottom: 4 }}>💡 INSIKT</SectionLabel>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{insight}</p>
          </div>
        )
      })()}
    </div>
  )
}
