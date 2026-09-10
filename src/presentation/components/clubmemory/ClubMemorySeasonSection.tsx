import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { SeasonMemory, MemoryEvent } from '../../../domain/services/clubMemoryService'
import type { ActiveAnniversary } from '../../../domain/services/clubMemoryService'
import { momentFamily } from '../../../domain/services/clubMemoryService'
import { roundToMonth } from '../../../domain/services/weatherService'
import { seasonSpanLabel } from '../../../domain/utils/seasonYear'
import { ClubMemoryEventRow, kindClassFor } from './ClubMemoryEventRow'

interface Props {
  game: SaveGame
  seasonMemory: SeasonMemory
  activeAnniversaries?: ActiveAnniversary[]
}

const ERA_LABELS: Record<string, string> = {
  survival: 'ÖVERLEVNADSÅRET',
  fotfaste: 'FOTFÄSTET',
  establishment: 'ETABLERINGSÅRET',
  legacy: 'ARVET',
}

const MONTH_ABBR = ['JAN', 'FEB', 'MAR', 'APR', 'MAJ', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC']

/**
 * redesign-klubbminnet-omdesign — game.fixtures nollställs varje säsongs-
 * rollover (k10), så en exakt kalenderdag går bara att slå upp för DEN
 * pågående säsongen. Äldre säsonger visar bara en approximerad månad
 * (samma kalibrerade rond→månad-karta som väderservicen redan använder för
 * exakt samma problem) — aldrig en påhittad exakt dag.
 */
function entryDateLabel(game: SaveGame, seasonMemory: SeasonMemory, matchday: number): { day: string; mon: string } | null {
  if (seasonMemory.isOngoing) {
    const fixture = game.fixtures.find(f => f.matchday === matchday && f.date)
    if (fixture?.date) {
      const d = new Date(fixture.date)
      if (!isNaN(d.getTime())) {
        return { day: String(d.getDate()), mon: MONTH_ABBR[d.getMonth()] }
      }
    }
  }
  return { day: '', mon: MONTH_ABBR[roundToMonth(matchday) - 1] }
}

function pickHero(events: MemoryEvent[]): MemoryEvent | null {
  if (events.length === 0) return null
  return events.reduce((best, event) => event.significance > best.significance ? event : best, events[0])
}

export function ClubMemorySeasonSection({ game, seasonMemory, activeAnniversaries = [] }: Props) {
  const { season, isOngoing, finishPosition, events, eraName } = seasonMemory

  const positionText = finishPosition
    ? finishPosition === 1 ? 'Mästare'
    : finishPosition === 2 ? '2:a plats'
    : finishPosition === 3 ? '3:e plats'
    : `${finishPosition}:e plats`
    : null

  const eraLabel = eraName && eraName !== 'unknown'
    ? (ERA_LABELS[eraName] ?? eraName.toUpperCase())
    : null

  const hero = pickHero(events)
  const restEvents = hero ? events.filter(e => e !== hero) : events
  const heroKindClass = hero ? kindClassFor(hero) : 'k-noterat'
  const heroFamily = hero ? momentFamily(hero.type) : null
  const heroDate = hero ? entryDateLabel(game, seasonMemory, hero.matchday) : null

  return (
    <div className="km-ledger">
      <div className="km-perf" />

      <div className="km-lhead">
        <span className="km-lhead-title">
          Säsong {seasonSpanLabel(season)}
          {isOngoing && <span className="km-lhead-ongoing">Pågående</span>}
        </span>
        {(positionText || eraLabel) && (
          <span className="km-lhead-pos">
            {positionText && <span className="km-medal">{positionText}</span>}
            {eraLabel && <span className="km-era">{eraLabel}</span>}
          </span>
        )}
      </div>

      {hero && (
        <div className={`km-hero ${heroKindClass}`}>
          {heroKindClass === 'k-triumf' && <span className="km-hero-prick" />}
          <div className="km-hero-eyebrow">
            <span className="km-em">{heroFamily}</span>
            Ortens minne
            <span className="km-dt">
              {heroDate?.day ? `${heroDate.day} ${heroDate.mon}` : heroDate?.mon}
            </span>
          </div>
          <div className="km-hero-line">{hero.text}</div>
        </div>
      )}

      {events.length === 0 ? (
        <p className="km-season-empty">
          Inga minnesvärda händelser ännu.
        </p>
      ) : (
        restEvents.map((event, i) => (
          <ClubMemoryEventRow
            key={`${event.type}-${event.matchday}-${i}`}
            event={event}
            dateLabel={entryDateLabel(game, seasonMemory, event.matchday)}
            activeAnniversaries={activeAnniversaries}
          />
        ))
      )}
    </div>
  )
}
