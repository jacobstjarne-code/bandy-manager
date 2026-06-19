import type { Player } from '../entities/Player'
import type { SaveGame } from '../entities/SaveGame'

// Genomgång II A: rösten lyfts till spelarkortets topp. Den måste därför vara
// deterministisk (samma spelare + samma omgång → samma rad) och alltid finnas —
// inte slumpa fram null 80 % av öppningarna som tidigare (Math.random bröt både
// determinismkontraktet och hjälte-placeringen).

function hashId(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function pickFor(player: Player, game: SaveGame, arr: string[]): string {
  const seed = hashId(player.id) + (game.currentMatchday ?? 0)
  return arr[seed % arr.length]
}

// ── Spelarens egen röst — citat i hjälteblocket, alltid närvarande ───────────

export function getPlayerVoice(player: Player, game: SaveGame): string {
  if (player.isInjured) {
    return pickFor(player, game, [
      '"Det läker. Men det går för långsamt."',
      '"Jag sitter och ser på. Det är det värsta."',
    ])
  }

  if (player.morale < 30) {
    return pickFor(player, game, [
      '"Jag vet inte vad jag gör fel längre."',
      '"Något måste ändras. Det här fungerar inte."',
      '"Skulle behöva prata med någon. Men inte nu."',
    ])
  }

  if (player.form >= 80 && player.seasonStats.goals >= 5) {
    return pickFor(player, game, [
      '"Det känns lätt just nu. Jag hoppas det håller."',
      '"Jag bryr mig inte om tabellen i november. Jag bryr mig om lördag."',
      '"Har aldrig mått så bra på isen."',
    ])
  }

  if (player.contractUntilSeason === game.currentSeason) {
    return pickFor(player, game, [
      '"Kontraktet? Vi får se. Jag vill veta vad klubben vill."',
      '"Jag trivs här. Men jag behöver veta att ni vill ha mig."',
    ])
  }

  if (player.age >= 34) {
    return pickFor(player, game, [
      '"Man tänker på vad som kommer sen. Men just nu är jag här."',
      '"Kroppen säger ifrån ibland. Jag är inte klar än."',
    ])
  }

  if (game.previousMarketValues && !game.previousMarketValues[player.id]) {
    return pickFor(player, game, [
      '"Bara varit här en månad. Behöver tid att förstå spelet här."',
      '"Grabbarna är schyssta. Kioskvakten kan mitt namn nu."',
    ])
  }

  if (player.trait === 'joker') {
    return pickFor(player, game, [
      '"Bandy är tur och tajming. Den som tror något annat har inte spelat."',
      '"Jag gör ingen plan. Den går ändå inte i lås."',
    ])
  }

  if (player.trait === 'hungrig') {
    return pickFor(player, game, [
      '"Jag vill mer. Mer matcher, mer ansvar, mer allt."',
      '"Jag är inte här för att vara med. Jag är här för att bli."',
    ])
  }

  if (player.trait === 'lokal') {
    return pickFor(player, game, [
      '"Jag är härifrån. Det betyder något när hallen är full."',
      '"Min farsa stod på samma läktare. Det glömmer man inte."',
    ])
  }

  return pickFor(player, game, [
    '"Jag gör mitt jobb. Resten sköter laget."',
    '"En match i taget. Det är hela hemligheten."',
    '"Bra träningsvecka. Sen får lördagen avgöra."',
  ])
}

// ── Känsloläge: kort observation om var spelaren står just nu ─────────────────

export function getPlayerMoodLine(player: Player, game: SaveGame): string {
  const recentGoals = player.seasonStats.goals
  if (player.isInjured) return 'Borta från spel. Otålig.'
  if (player.morale < 30) return 'Tyngd. Något skaver under ytan.'
  if (player.form >= 80 && recentGoals >= 5) return 'Tänd. Och han vet det.'
  if (player.form >= 75) return 'I gungning. Lätt i steget.'
  if (player.form < 40) return 'Ur form. Söker tillbaka.'
  if (player.contractUntilSeason === game.currentSeason) return 'Avvaktande. Väntar på besked.'
  if (player.age >= 34) return 'Lugn. Har sett det förr.'
  return 'Stabil. Gör sitt.'
}

// ── Säsongens båge: form + resultat ur loggen, inget påhittat (Opus lärdom #9) ─
// Jacob: trimmad till form + resultat — ingen lag-effekt vi inte modellerar.

export function getSeasonArc(
  player: Player,
  recentRatings: Array<{ rating: number }> | undefined,
): string | null {
  const games = player.seasonStats.gamesPlayed
  if (games < 3) return null

  const goals = player.seasonStats.goals
  const avg = player.seasonStats.averageRating

  // Formkurva ur de senaste betygen: jämför första vs sista halvan.
  let trend: 'upp' | 'ner' | 'jämn' = 'jämn'
  if (recentRatings && recentRatings.length >= 4) {
    const mid = Math.floor(recentRatings.length / 2)
    const early = recentRatings.slice(0, mid).reduce((s, r) => s + r.rating, 0) / mid
    const late = recentRatings.slice(mid).reduce((s, r) => s + r.rating, 0) / (recentRatings.length - mid)
    if (late - early >= 0.5) trend = 'upp'
    else if (early - late >= 0.5) trend = 'ner'
  }

  const formPart =
    trend === 'upp' ? 'Trög start, men kurvan pekar uppåt'
    : trend === 'ner' ? 'Stark inledning som planat ut'
    : avg >= 7 ? 'Jämn och hög nivå hela vägen'
    : avg >= 6 ? 'Stabil säsong utan toppar'
    : 'Tung säsong, betygen vill inte lossna'

  const resultPart =
    goals >= 8 ? `${goals} mål på ${games} matcher.`
    : goals >= 3 ? `${goals} mål så här långt.`
    : avg >= 6.5 ? `Bär laget utan att synas i målprotokollet.`
    : `Inga mål än, men ${games} matcher i benen.`

  return `${formPart}. ${resultPart}`
}
