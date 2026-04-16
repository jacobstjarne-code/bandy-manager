import type { Player } from '../entities/Player'
import type { SaveGame } from '../entities/SaveGame'

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ── Spelarens egen röst — visas i PlayerCard med 20% chans ───────────────────

export function getPlayerVoice(player: Player, game: SaveGame): string | null {
  // 20% chans per spelarkort-öppning
  if (Math.random() > 0.2) return null

  // Låg moral
  if (player.morale < 30) {
    return pick([
      '"Jag vet inte vad jag gör fel längre."',
      '"Något måste ändras. Det här fungerar inte."',
      '"Skulle behöva prata med någon — men inte nu."',
    ])
  }

  // Hög form, många mål
  if (player.form >= 80 && player.seasonStats.goals >= 5) {
    return pick([
      '"Det känns lätt just nu. Jag hoppas det håller i sig."',
      '"Tack för förtroendet. Det är det som ger kraften."',
      '"Har aldrig mått så bra på isen."',
    ])
  }

  // Kontrakt löper ut
  if (player.contractUntilSeason === game.currentSeason) {
    return pick([
      '"Kontraktet? Vi får se. Jag vill veta vad klubben vill."',
      '"Jag trivs här. Men jag behöver veta att ni vill ha mig."',
    ])
  }

  // Veteran (sista säsong-arc)
  if (player.age >= 34) {
    return pick([
      '"Man tänker på vad som kommer sen. Men just nu är jag här."',
      '"Kroppen säger ifrån ibland. Men jag är inte klar än."',
    ])
  }

  // Nyförvärvad (inte i previousMarketValues)
  if (game.previousMarketValues && !game.previousMarketValues[player.id]) {
    return pick([
      '"Bara varit här en månad. Behöver tid att förstå spelet här."',
      '"Grabbarna är schyssta. Kioskvakten kan mitt namn nu."',
    ])
  }

  // Joker-trait
  if (player.trait === 'joker') {
    return pick([
      '"Bandy är tur och tajming. Den som tror något annat har inte spelat."',
      '"Jag gör ingen plan. Den går ändå inte i lås."',
    ])
  }

  // Hungrig-trait
  if (player.trait === 'hungrig') {
    return pick([
      '"Jag vill mer. Mer matcher, mer ansvar, mer allt."',
      '"Jag är inte här för att vara med. Jag är här för att bli."',
    ])
  }

  return null
}
