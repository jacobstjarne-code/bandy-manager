import type { SaveGame } from '../entities/SaveGame'
import { getCharacterName } from './supporterService'

// ── Ritual moment types ───────────────────────────────────────────────────────

export type RitualMoment =
  | 'kickoff'
  | 'goal'
  | 'corner'
  | 'suspension'
  | 'lastMinute'
  | 'fullTimeWin'
  | 'fullTimeLoss'
  | 'awayTrip'
  | 'preMatch'

// ── Templates ─────────────────────────────────────────────────────────────────
// {leader}, {veteran}, {youth}, {family}, {player}, {group} are substituted

const RITUALS: Record<RitualMoment, string[]> = {
  preMatch: [
    '{group} samlas vid entrén. {leader} delar ut scarves.',
    'Trumman slår tre gånger utanför omklädningsrummet. Det är en gammal tradition.',
    '{veteran} berättar hur det brukade vara. Alla lyssnar.',
    '{youth} har sysslat med tifon hela veckan. Nu sitter den på plats.',
    '{family} har tagit med barnen för sjunde året i rad.',
  ],
  kickoff: [
    'Trumman sätter igång. {leader} leder ramsan.',
    '{group} sjunger välkomstsången. De brukar alltid.',
    '{veteran} nickar igenkännande. Samma melodi sedan 1987.',
    '{youth} sätter upp sin banderoll. Det har tagit en vecka att sy.',
    '{leader} höjer staven. {group} följer efter.',
  ],
  goal: [
    '{leader} kastar mössan i luften. Tradition.',
    '{player}! {group} exploderar. {veteran} sitter kvar — han har sett allt förr, men han ler.',
    '{youth} hoppar upp och kramar {family}. Okänd sedan förut, men det spelar ingen roll nu.',
    'Trumman slår i ett helt annat tempo. Målet sitter.',
    '{player} — {veteran} vände sig mot {leader}: "Det där var vackert."',
  ],
  corner: [
    'Hörnramsan startar. {leader} stämmer upp.',
    '{group} börjar sjunga hörnramsan. Det händer automatiskt.',
    '{veteran} lär {youth} texten. Det är viktigt att fortsätta traditionen.',
    'Trumman slår takt. Hörnans melodi fyller planen.',
    '{family} sjunger med barnen. De kan varje ord.',
  ],
  suspension: [
    'Utvisningssången. {leader} leder, {group} följer.',
    '"Tio minuter — tio minuter!" Stämman i {group} är samlad.',
    '{veteran} minns att den sången kom till i en bortamatch på 90-talet.',
    '{youth} slår takten mot bänken framför. Det vibrerar.',
    '{family} låter barnen sjunga med. De älskar det.',
  ],
  lastMinute: [
    'Sistaminuterruset. {leader} står upp, alla följer.',
    '{group} sjunger ett tempo snabbare. Det märks på planen.',
    '{veteran} är tyst. Det är hans sätt att koncentrera sig.',
    '{youth} trummar på bänkryggen. Automatiskt, intensivt.',
    '{leader} till {family}: "Nu kör vi." {family} nickar.',
  ],
  fullTimeWin: [
    '{leader} och {veteran} omfamnar varandra. Det behövs inga ord.',
    '{youth} springer ner till plankanten. Hon vill hinna säga någonting till {player}.',
    '{group} sjunger segersången tills de siste åskådarna lämnat.',
    '{family} bär hem barnen på axlarna. Det är sena kvällar de minns.',
    '{veteran} säger till {leader}: "Det här håller." {leader} håller med.',
  ],
  fullTimeLoss: [
    '{group} stannar. Det är tyst en stund. Sedan klappa de.',
    '{veteran} är den siste att lämna läktaren.',
    '{leader} samlar ihop {group}: "Vi ses på tisdag."',
    '{youth} rullar ihop tifon. Det är tyngre än vanligt.',
    '{family} tar barnen i handen. "Vi vann förra veckan", säger hon.',
  ],
  awayTrip: [
    '{leader} organiserade bortaresan. Bussen avgår klockan fem.',
    '{veteran} packar med smörgåsar. "Vi vet aldrig om det finns mat."',
    '{youth} sitter längst bak och spelar musik. {family} sover redan.',
    'Bortaresor är när {group} är som bäst. Ingenting annat spelar roll.',
    '{leader} till {veteran}: "Sist vi åkte dit vann vi med fyra." {veteran}: "Det var en annan tid."',
  ],
}

// ── Get ritual text for a given moment ───────────────────────────────────────

export function getRitualText(
  game: SaveGame,
  moment: RitualMoment,
  playerName?: string,
): string | null {
  if (!game.supporterGroup) return null

  const sg = game.supporterGroup
  const round = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)

  // Only show rituals when mood >= 30 and round >= 2
  if (sg.mood < 30 || round < 2) return null

  const pool = RITUALS[moment]
  const seed = round * 13 + game.currentSeason * 7
  const text = pool[Math.abs(seed) % pool.length]

  const leader  = getCharacterName(game, 'leader')
  const veteran = getCharacterName(game, 'veteran')
  const youth   = getCharacterName(game, 'youth')
  const family  = getCharacterName(game, 'family')
  const player  = playerName ?? 'spelaren'
  const group   = sg.name

  return text
    .replace(/\{leader\}/g, leader)
    .replace(/\{veteran\}/g, veteran)
    .replace(/\{youth\}/g, youth)
    .replace(/\{family\}/g, family)
    .replace(/\{player\}/g, player)
    .replace(/\{group\}/g, group)
}

// ── Away trip narrative ───────────────────────────────────────────────────────

export function getAwayTripNarrative(
  game: SaveGame,
  phase: 'before' | 'after',
  won: boolean,
  opponentName: string,
): string | null {
  if (!game.supporterGroup) return null

  const sg = game.supporterGroup
  const leader  = getCharacterName(game, 'leader')
  const veteran = getCharacterName(game, 'veteran')
  const youth   = getCharacterName(game, 'youth')
  const family  = getCharacterName(game, 'family')
  const group   = sg.name

  const before = [
    `${leader} organiserade bortaresan till ${opponentName}. Bussen avgår tidigt.`,
    `${group} åker borta. ${veteran} packar med smörgåsar — "Man vet aldrig."`,
    `${youth} sitter längst bak. ${family} sover redan. Det är fortfarande mörkt ute.`,
    `"Sist vi var där vann vi", säger ${leader}. ${veteran}: "Det var en annan tid."`,
  ]

  const afterWin = [
    `Bortasegern hyllas i bussen hem. ${leader} ringer ordföranden direkt.`,
    `${youth} sitter fortfarande och ler. ${veteran} säger ingenting — men han ler med.`,
    `"Det här pratar vi om länge", säger ${family}. Han har rätt.`,
    `${group} sjunger hela vägen hem. Busschauffören låter dem.`,
  ]

  const afterLoss = [
    `Det var tyst i bussen hem. ${veteran} sov. ${leader} stirrade ut genom fönstret.`,
    `${youth} rullade ihop banderollen. "Vi tar dem på hemmaplan", sa ${leader}.`,
    `${family} ringde hem. "Vi förlorade. Ja. Vi åker hem nu."`,
    `${group} pratade inte mycket på vägen hem. Det behövdes inte.`,
  ]

  const pool = phase === 'before' ? before : (won ? afterWin : afterLoss)
  const seed = game.currentSeason * 31 + (phase === 'before' ? 0 : 1)
  return pool[Math.abs(seed) % pool.length]
}
