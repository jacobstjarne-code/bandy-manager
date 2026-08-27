import type { SaveGame } from '../entities/SaveGame'
import type { Fixture } from '../entities/Fixture'
import { getRivalry } from '../data/rivalries'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Insandare {
  signature: string  // "Lars-Erik, 64, Järbo"
  text: string
  sentiment: 'positive' | 'negative' | 'reflective'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// M35 (textaudit 2026-07-03): använde Math.random trots att servicen är
// designad deterministisk via fixtureHash — samma fixture gav ny text per
// render. Seedas nu med hash:en.
function pick(arr: string[], seed: number): string {
  return arr[seed % arr.length]
}

// Deterministic hash for fixture-based caching
function fixtureHash(fixtureId: string): number {
  let h = 0
  for (let i = 0; i < fixtureId.length; i++) h = (h * 31 + fixtureId.charCodeAt(i)) | 0
  return Math.abs(h)
}

const SIGNATURES = [
  // Textaudit domän 2c (2026-07-03): ortsneutrala signaturer — tidigare
  // Gästrike-/Hälsingeorter (Järbo, Tierp, Edsbyn...) visades för ALLA
  // klubbar, även Skåne. Kvarters-/bygdenamn funkar på varje ort.
  'Lars-Erik, 64, Bruket', 'Birgit, 71, Centrum', 'Kjell-Olof, 58, Norra sidan',
  'Gunilla, 69, Kyrkbyn', 'Sigvard, 73, Stationen', 'Margareta, 66, Villaområdet',
  'Gunnar, 78, Åsen', 'Lennart, 55, Storgatan', 'Ingvar, 61, Landsvägen',
]

// ── Generate insändare ────────────────────────────────────────────────────────

/**
 * @cites lastFixture.homeScore, lastFixture.awayScore, getRivalry
 */
export function generateInsandare(game: SaveGame, lastFixture: Fixture): Insandare | null {
  const isHome = lastFixture.homeClubId === game.managedClubId
  const myScore = isHome ? lastFixture.homeScore : lastFixture.awayScore
  const theirScore = isHome ? lastFixture.awayScore : lastFixture.homeScore
  const margin = (myScore ?? 0) - (theirScore ?? 0)
  const isDerby = !!getRivalry(lastFixture.homeClubId, lastFixture.awayClubId)

  // Use fixture hash for determinism — same fixture always generates same insändare
  const hash = fixtureHash(lastFixture.id)
  const chanceSeed = (hash % 100) / 100
  const chance = isDerby ? 0.6 : 0.25
  if (chanceSeed > chance) return null

  const signature = SIGNATURES[hash % SIGNATURES.length]
  const clubName = game.clubs.find(c => c.id === game.managedClubId)?.name ?? 'laget'

  if (margin <= -3) {
    return {
      signature,
      sentiment: 'negative',
      text: pick([
        `Jag har varit ${clubName}-anhängare i 38 år. Och det här är det värsta jag sett på länge.`,
        'Spelarna gör sitt men var är viljan? Någon måste ställa frågor nu.',
        'Kan vi inte kräva att styrelsen förklarar vad som händer?',
      ], hash),
    }
  }
  if (margin >= 3 && isDerby) {
    return {
      signature,
      sentiment: 'positive',
      text: pick([
        'Jag var där. Hela vägen. Den matchen berättar jag om när barnbarnen frågar om bandy.',
        'Tack till laget. Tack till klacken. Tack till orten. Det här är vad bandy handlar om.',
        'Trettiosju år i publiken och jag glömmer aldrig den här kvällen.',
      ], hash),
    }
  }
  if (margin >= 2) {
    return {
      signature,
      sentiment: 'positive',
      text: pick([
        'Bra jobbat laget. Fortsätt så.',
        'Det där såg ut som ett lag i dag. Mer sånt.',
        'Kaptenen ledde idag. Det syns när det är någon som bär laget.',
      ], hash),
    }
  }
  // Oavgjort eller knapp — reflektiv
  return {
    signature,
    sentiment: 'reflective',
    text: pick([
      'En jämn match. Det är så det ska vara i serien. Vi är inte bäst, vi är inte sämst.',
      'Bandy är inte bara siffror. Det är lukten av kaffekoppen, kylan, människorna runt planen.',
      'Tänk på ungdomslaget. De sitter alltid längst bort på läktaren. De förtjänar bättre.',
    ], hash),
  }
}
