import type { SaveGame } from '../entities/SaveGame'

interface SpectatorMarkCopy {
  eyebrow: string
  quote: string
  helper: string
}

const SPECTATOR_MARK_VARIANTS: SpectatorMarkCopy[] = [
  {
    eyebrow: '⬩ Säsongen fortsätter utan oss ⬩',
    quote: 'Nu följer vi slutspelet som alla andra — med en klump i magen och ögonen på brädan.',
    helper: 'Andra lags matcher rullar. Fokus skiftar till truppen.',
  },
  {
    eyebrow: '⬩ Åskådarläge ⬩',
    quote: 'Slutspelet pågår. Vi är inte med. Vad vi gör med den känslan avgör nästa säsong.',
    helper: 'Visas en gång per säsong.',
  },
  {
    eyebrow: '⬩ Säsongens sista kapitel ⬩',
    quote: 'Andra kämpar om guldet. Vi läker och förbereder. Det är också ett jobb.',
    helper: 'Trupp, kontrakt och akademi väntar.',
  },
]

export function pickSpectatorMarkCopy(game: SaveGame): SpectatorMarkCopy {
  // Deterministic per säsong + klubb
  const seed = game.currentSeason + game.managedClubId.charCodeAt(0)
  return SPECTATOR_MARK_VARIANTS[seed % SPECTATOR_MARK_VARIANTS.length]
}
