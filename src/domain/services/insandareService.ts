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

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Deterministic hash for fixture-based caching
function fixtureHash(fixtureId: string): number {
  let h = 0
  for (let i = 0; i < fixtureId.length; i++) h = (h * 31 + fixtureId.charCodeAt(i)) | 0
  return Math.abs(h)
}

const SIGNATURES = [
  'Lars-Erik, 64, Järbo', 'Birgit, 71, Centrum', 'Kjell-Olof, 58, Norrbyn',
  'Gunilla, 69, Hillsta', 'Sigvard, 73, Älvkarleby', 'Margareta, 66, Tierp',
  'Gunnar, 78, Hedesunda', 'Lennart, 55, Storvik', 'Ingvar, 61, Edsbyn',
]

// ── Generate insändare ────────────────────────────────────────────────────────

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
        `Jag har varit ${clubName}-anhängare i 38 år. Och det här är värst jag har sett på länge.`,
        'Spelarna gör sitt men var är viljan? Någon måste ställa frågor nu.',
        'Kan vi inte kräva att styrelsen förklarar vad som händer?',
      ]),
    }
  }
  if (margin >= 3 && isDerby) {
    return {
      signature,
      sentiment: 'positive',
      text: pick([
        'Jag var där. Hela vägen. Den matchen berättar jag om när barnbarnen frågar om bandy.',
        'Tack till laget. Tack till klacken. Tack till orten. Det här är vad bandy handlar om.',
        'Trettiosju år i publiken och jag glömmer aldrig det där målet i 87:e.',
      ]),
    }
  }
  if (margin >= 2) {
    return {
      signature,
      sentiment: 'positive',
      text: pick([
        'Bra jobbat laget. Fortsätt så.',
        'Efter tre raka — nu börjar det likna något.',
        'Kaptenen ledde idag. Det syns när det är någon som bär laget.',
      ]),
    }
  }
  // Oavgjort eller knapp — reflektiv
  return {
    signature,
    sentiment: 'reflective',
    text: pick([
      'En jämn match. Det är så det ska vara i serien. Vi är inte bäst, vi är inte sämst.',
      'Bandy är inte bara siffror. Det är lukten av kaffekoppen, kylan, människorna runt planen.',
      'Tänk på ungdomslaget. De sitter alltid i sista svängen. De förtjänar bättre.',
    ]),
  }
}
