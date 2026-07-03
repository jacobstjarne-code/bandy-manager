import type { CardRenderProps } from '../portalTypes'
import type { WatchOthersContext } from '../../../../domain/data/watchOthersReflectionText'
import { WATCH_OTHERS_TEXT } from '../../../../domain/data/watchOthersReflectionText'
import { FixtureStatus, PlayoffRound } from '../../../../domain/enums'
import type { Fixture } from '../../../../domain/entities/Fixture'
import type { SaveGame } from '../../../../domain/entities/SaveGame'

function daysUntilFixture(game: SaveGame, fixture: Fixture): number {
  const fixtureDate = fixture.date ?? ''
  const current = new Date(game.currentDate)
  const target = new Date(fixtureDate)
  const diffMs = target.getTime() - current.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function getPlayoffFixtureIds(game: SaveGame): Set<string> {
  if (!game.playoffBracket) return new Set()
  const ids = new Set<string>()
  const allSeries = [
    ...game.playoffBracket.quarterFinals,
    ...game.playoffBracket.semiFinals,
    ...(game.playoffBracket.final ? [game.playoffBracket.final] : []),
  ]
  for (const s of allSeries) {
    for (const fid of s.fixtures) ids.add(fid)
  }
  return ids
}

function getWatchOthersContext(game: SaveGame): WatchOthersContext {
  if (!game.playoffBracket) return 'never_in_playoff'

  const allSeries = [
    ...game.playoffBracket.quarterFinals,
    ...game.playoffBracket.semiFinals,
    ...(game.playoffBracket.final ? [game.playoffBracket.final] : []),
  ]

  const managedInBracket = allSeries.some(
    s => s.homeClubId === game.managedClubId || s.awayClubId === game.managedClubId
  )
  if (!managedInBracket) return 'never_in_playoff'

  const eliminatingSeries = allSeries.find(s => s.loserId === game.managedClubId)
  if (!eliminatingSeries) return 'never_in_playoff'

  // M22 (textaudit 2026-07-03): kollade tidigare "vinnaren spelar i NÅGON
  // kommande omgång" — kunde vara kvartsfinal/semifinal, medan texten
  // ("{motståndare} står I FINALEN") specifikt hävdar finalplats. Kollar nu
  // mot final-seriens faktiska deltagare (final är null tills semifinalerna
  // är klara, så det här kan bara bli sant när laget verkligen är klart).
  const finalSeries = game.playoffBracket.final
  const beaterIsInFinal = !!finalSeries &&
    (finalSeries.homeClubId === eliminatingSeries.winnerId || finalSeries.awayClubId === eliminatingSeries.winnerId)
  return beaterIsInFinal ? 'lost_to_finalist' : 'lost_to_other'
}

function pickReflection(context: WatchOthersContext, seed: number) {
  const pool = WATCH_OTHERS_TEXT[context]
  return pool[seed % pool.length]
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  const days = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör']
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

export function WatchOthersSecondary({ game }: CardRenderProps) {
  const playoffIds = getPlayoffFixtureIds(game)
  const upcomingPlayoff = game.fixtures
    .filter(f =>
      f.status === FixtureStatus.Scheduled &&
      !f.isCup &&
      playoffIds.has(f.id) &&
      f.homeClubId !== game.managedClubId &&
      f.awayClubId !== game.managedClubId
    )
    .filter(f => daysUntilFixture(game, f) <= 7)
    .sort((a, b) => a.matchday - b.matchday)

  if (upcomingPlayoff.length === 0) return null

  const isSMFinal = game.playoffBracket?.final !== null &&
    upcomingPlayoff.some(f => {
      const allSeries = [
        ...(game.playoffBracket?.quarterFinals ?? []),
        ...(game.playoffBracket?.semiFinals ?? []),
        ...(game.playoffBracket?.final ? [game.playoffBracket.final] : []),
      ]
      const series = allSeries.find(s => s.fixtures.includes(f.id))
      return series?.round === PlayoffRound.Final
    })

  const context = getWatchOthersContext(game)
  const seed = game.currentSeason + game.currentMatchday
  const reflection = pickReflection(context, seed)

  return (
    <div className={`portal-watch-others card-sharp${isSMFinal ? ' watch-others-gold' : ''}`}
      style={{ padding: '12px', marginBottom: 8 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: isSMFinal ? 'var(--gold, var(--accent))' : 'var(--cold, var(--text-muted))',
        marginBottom: 6,
      }}>
        {reflection.label}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
        {reflection.reflection}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {upcomingPlayoff.slice(0, 3).map(f => {
          const home = game.clubs.find(c => c.id === f.homeClubId)
          const away = game.clubs.find(c => c.id === f.awayClubId)
          const dateStr = f.date ?? ''
          return (
            <div key={f.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: 12, color: 'var(--text-primary)',
            }}>
              <span>{home?.shortName ?? home?.name} – {away?.shortName ?? away?.name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{formatShortDate(dateStr)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
