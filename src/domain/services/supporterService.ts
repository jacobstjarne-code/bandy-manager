import type { SaveGame } from '../entities/SaveGame'
import type { SupporterGroup, SupporterCharacter } from '../entities/Community'
import type { Player } from '../entities/Player'
import { PlayerPosition } from '../enums'

// ── Name pools per role ───────────────────────────────────────────────────────

const NAMES: Record<string, string[]> = {
  leader:  ['Sture', 'Gunnar', 'Leif', 'Bengt', 'Jan', 'Birger', 'Rune'],
  veteran: ['Rolf', 'Bertil', 'Sven', 'Gösta', 'Ebbe', 'Folke', 'Alvar'],
  youth:   ['Elin', 'Sara', 'Maja', 'Ida', 'Lovisa', 'Klara', 'Frida'],
  family:  ['Tommy', 'Håkan', 'Janne', 'Pelle', 'Kalle', 'Patrik', 'Mikael'],
}

const GROUP_NAMES = [
  'Järnkurvan', 'Bandygänget', 'Norrlandsklacken', 'Dalkurvan',
  'Isfolket', 'Blå Front', 'Bandykorpen', 'Strömsklacken',
  'Norrviperiet', 'Klacklagen', 'Stadens Stolthet', 'Isbjörnarna',
]

const RITUALS = ['trumman', 'hörnramsan', 'välkomstsången', 'segerdansen', 'sistaMinuten']

// ── Deterministic pick from pool ──────────────────────────────────────────────

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]
}

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

// ── Generate supporter group at game start ────────────────────────────────────

export function generateSupporterGroup(
  clubId: string,
  season: number,
  players: Player[],
  seed: number,
): SupporterGroup {
  const h = hashStr(clubId) + seed

  const favoritePlayer = pickFavoritePlayer(players)

  const makeChar = (role: string, offset: number): SupporterCharacter => ({
    name: pick(NAMES[role], h + offset),
    role: role as SupporterCharacter['role'],
    favoritePlayerId: favoritePlayer?.id,
  })

  return {
    name: pick(GROUP_NAMES, h),
    founded: season,
    members: 15 + (Math.abs(h * 7) % 50),
    mood: 60,
    leader:  makeChar('leader',  0),
    veteran: makeChar('veteran', 1),
    youth:   makeChar('youth',   2),
    family:  makeChar('family',  3),
    favoritePlayerId: favoritePlayer?.id,
    ritual: pick(RITUALS, h + 4),
  }
}

// ── Pick klackens favoritspelare ──────────────────────────────────────────────
// Prioritizes forwards with highest overall skill, falls back to any outfield player

export function pickFavoritePlayer(players: Player[]): Player | undefined {
  const outfield = players.filter(p => p.position !== PlayerPosition.Goalkeeper)
  if (outfield.length === 0) return undefined

  const scored = outfield.map(p => {
    const attrs = p.attributes
    const skill = attrs.shooting * 2 + attrs.skating + attrs.acceleration + attrs.stamina
    const posBonus = p.position === PlayerPosition.Forward ? 20 : p.position === PlayerPosition.Half ? 5 : 0
    return { p, score: skill + posBonus + p.form }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.p
}

// ── Update favoritePlayerId if player was sold ────────────────────────────────

export function updateSupporterFavorite(
  group: SupporterGroup,
  activePlayers: Player[],
): SupporterGroup {
  const activeIds = new Set(activePlayers.map(p => p.id))
  if (group.favoritePlayerId && activeIds.has(group.favoritePlayerId)) return group

  const newFav = pickFavoritePlayer(activePlayers)
  return { ...group, favoritePlayerId: newFav?.id }
}

// ── Mood helpers ──────────────────────────────────────────────────────────────

export function adjustSupporterMood(group: SupporterGroup, delta: number): SupporterGroup {
  return { ...group, mood: Math.max(0, Math.min(100, group.mood + delta)) }
}

// ── Get character name by role ────────────────────────────────────────────────

export function getCharacterName(game: SaveGame, role: SupporterCharacter['role']): string {
  const sg = game.supporterGroup
  if (!sg) return role === 'youth' ? 'Elin' : role === 'leader' ? 'Sture' : role === 'veteran' ? 'Rolf' : 'Tommy'
  return sg[role].name
}

// ── Mood label ────────────────────────────────────────────────────────────────

export function getSupporterMoodLabel(mood: number): string {
  if (mood >= 80) return 'Elektrisk'
  if (mood >= 65) return 'Tajt'
  if (mood >= 45) return 'Stabil'
  if (mood >= 30) return 'Besviket'
  return 'Uppgivet'
}
