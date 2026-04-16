// PATCH: Replace getArcMoodText in src/domain/services/trainerArcService.ts
// Update call sites to pass seed: getArcMoodText(arc.current, game.currentSeason * 100 + currentRound)

export function getArcMoodText(phase: ArcPhase, seed?: number): string | null {
  const pick = (arr: string[]) => arr[(seed ?? 0) % arr.length]
  switch (phase) {
    case 'newcomer':
      return pick([
        '🆕 Ingen vet ditt namn ännu',
        '🆕 Nyckeln till kontoret luktar fortfarande metall',
        '🆕 Grabbarna kallar dig fortfarande "nya tränaren"',
      ])
    case 'honeymoon':
      return pick([
        '☀️ Även parkeringsböterna känns överkomliga',
        '☀️ Lokaltidningen stavade rätt på ditt namn',
        '☀️ Folk hälsar i mataffären',
        '☀️ Kassörskan på ICA frågade om autograf',
      ])
    case 'grind':
      return pick([
        '⚙️ Kaffe. Match. Kaffe. Match.',
        '⚙️ Vardagen har blivit din bästa vän',
        '⚙️ Ingen skriver om dig. Det är bra.',
        '⚙️ Tyst och stabilt. Precis som isen borde vara.',
      ])
    case 'questioned':
      return pick([
        '⛅ Lokaltidningen har slutat be om intervju',
        '⛅ Anonyma kommentarer i forumet',
        '⛅ Grannen undviker ögonkontakt',
        '⛅ "Har du funderat på att prova något annat?"',
      ])
    case 'crisis':
      return pick([
        '⛈️ Ordföranden ringer inte längre. Det är värre.',
        '⛈️ Någon har skrivit AVGÅ på papperskorgen vid planen',
        '⛈️ Frun frågar försiktigt om cv:t',
        '⛈️ Kassören tittade bort vid senaste styrelsemötet',
      ])
    case 'redemption':
      return pick([
        '🌤️ Grannen hälsar igen',
        '🌤️ Lokaltidningen vill göra ett reportage',
        '🌤️ Samma folk som ville sparka dig klappar nu',
        '🌤️ Det luktar comeback',
      ])
    case 'established':
      return pick([
        '🏠 Del av inventarierna',
        '🏠 Egen kopp i kafferummet',
        '🏠 Vaktmästaren frågar dig om råd',
        '🏠 Du vet var alla lampknappar sitter',
      ])
    case 'legendary':
      return pick([
        '👑 Gatan utanför planen borde döpas om',
        '👑 Ortens barn vill bli dig när de växer upp',
        '👑 Du ÄR klubben',
        '👑 Pensionärerna minns ingen annan tränare',
      ])
    case 'farewell':
      return pick([
        '👋 En match i taget. Kanske den sista.',
        '👋 Kontoret känns redan tomt',
        '👋 Det slutar inte med en smäll. Det slutar tyst.',
      ])
    default:
      return null
  }
}
