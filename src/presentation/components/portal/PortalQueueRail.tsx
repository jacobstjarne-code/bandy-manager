import { getFatigueState, getItemAge } from '../../../domain/services/decisionFatigueService'
import { getEventTypeMeta } from '../../../domain/data/eventTypeLabels'
import { Sparkline, MIN_POINTS } from '../primitives/Sparkline'
import type { SaveGame } from '../../../domain/entities/SaveGame'

interface Props {
  game: SaveGame
  /** PORTAL-TAKREGEL (2026-08-09): atmosfärsmarks som förlorade mot taket
   *  (ATMOSPHERE_CAP) denna omgång. Auditens "Denna vecka"-rad är i praktiken
   *  den här kön, utbyggd — ingen ny komponent, samma .portal-queue-chip. */
  demotedMarks?: { icon: string; label: string }[]
}

/**
 * A-M3 (SEXSÄSONGSAUDITEN 2026-08-26): rotorsaken till den råa läckan.
 * Denna karta täckte bara 8/49 GameEventType-värden — allt annat föll
 * tillbaka på `sourceKey` (den råa camelCase-strängen, se getSourceMeta
 * nedan). `weeklyDecision` är INTE ett GameEventType (game.deferredDecisions
 * är typad GameEvent[], se SaveGame.ts:464) — behålls här som en egen,
 * icke-GameEventType källnyckel, ingen deferred-post har någonsin haft det
 * värdet i praktiken, men skadar inget att bevara.
 */
const EXTRA_SOURCE_META: Record<string, { icon: string; label: string }> = {
  weeklyDecision: { icon: '📋', label: 'Veckans beslut' },
}

/** EXTRA_SOURCE_META (icke-GameEventType-nycklar) först, sedan den
 *  exhaustiva EVENT_TYPE_LABELS-kartan (eventTypeLabels.ts) — som ALDRIG
 *  faller tillbaka på den råa strängen, bara en generisk etikett + telemetri. */
function getSourceMeta(sourceKey: string): { icon: string; label: string } {
  return EXTRA_SOURCE_META[sourceKey] ?? getEventTypeMeta(sourceKey)
}

function getAgedClass(age: number): string {
  if (age >= 5) return 'aged-2'
  if (age >= 3) return 'aged-1'
  return ''
}

function pressureLabel(pressure: 'calm' | 'warm' | 'hot'): string {
  if (pressure === 'hot') return 'Hög'
  if (pressure === 'warm') return 'Märkbart'
  return 'Lugn'
}

function pressureStroke(pressure: 'calm' | 'warm' | 'hot'): 'accent' | 'warm' | 'danger' {
  if (pressure === 'hot') return 'danger'
  if (pressure === 'warm') return 'warm'
  return 'accent'
}

const STROKE_COLOR: Record<'accent' | 'warm' | 'danger', string> = {
  accent: 'var(--accent)',
  warm:   'var(--warm)',
  danger: 'var(--danger)',
}

function uniqueBySource<T extends { type?: string; source?: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter(item => {
    const key = item.source ?? item.type ?? 'unknown'
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function PortalQueueRail({ game, demotedMarks = [] }: Props) {
  const deferred = game.deferredDecisions ?? []
  if (deferred.length === 0 && demotedMarks.length === 0) return null

  const { pressure } = getFatigueState(game)
  const matchday = game.currentMatchday ?? 1
  const fatigueHistory = game.fatigueHistory ?? []

  const items = deferred as Array<{ type?: string; source?: string; deferredAt?: number }>
  const uniqueItems = uniqueBySource(items).slice(0, 5)
  const hasMore = items.length - uniqueItems.length
  const totalCount = deferred.length + demotedMarks.length

  const railClass = pressure === 'hot'
    ? 'portal-queue-rail hot-pressure'
    : pressure === 'warm'
    ? 'portal-queue-rail warm-pressure'
    : 'portal-queue-rail'

  return (
    <div className={railClass}>
      <div className="portal-queue-rail-head">
        <span className="portal-queue-rail-eyebrow">⏳ I kö</span>
        <span className="portal-queue-rail-count">
          <strong>{totalCount}</strong> beslut i kö
        </span>
      </div>
      <div className="portal-queue-chips">
        {demotedMarks.map((mark, idx) => (
          <span key={`mark-${idx}`} className="portal-queue-chip">
            <span className="portal-queue-chip-icon">{mark.icon}</span>
            <span>{mark.label}</span>
          </span>
        ))}
        {uniqueItems.map((item, idx) => {
          const sourceKey = item.source ?? item.type ?? 'unknown'
          const { icon, label } = getSourceMeta(sourceKey)
          const age = getItemAge(item, matchday)
          const agedClass = getAgedClass(age)
          return (
            <span
              key={idx}
              className={`portal-queue-chip${agedClass ? ` ${agedClass}` : ''}`}
            >
              <span className="portal-queue-chip-icon">{icon}</span>
              <span>{label}</span>
              {age > 0 && (
                <span className="portal-queue-chip-age">{age} omg</span>
              )}
            </span>
          )
        })}
        {hasMore > 0 && (
          <span className="portal-queue-chip">+{hasMore} fler</span>
        )}
      </div>
      <div className="portal-fatigue-bar">
        <div className="portal-fatigue-bar-head">
          <span className="portal-fatigue-label">Tryck</span>
          <span>{pressureLabel(pressure)}</span>
        </div>
        <Sparkline
          points={fatigueHistory}
          stroke={pressureStroke(pressure)}
          height={22}
          label={`Beslutsbörda: ${pressureLabel(pressure)}`}
          markers={fatigueHistory.length >= MIN_POINTS ? [{
            index: fatigueHistory.length - 1,
            color: STROKE_COLOR[pressureStroke(pressure)],
            size: 2.5,
          }] : undefined}
        />
      </div>
    </div>
  )
}
