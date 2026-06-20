// Mentorskaps-konsekvensrad (Förbättring 5, yta E) — MB-röst, bandysvensk understatement.
// Kanon: system 2 (Akademi-mentorskap, game.mentorships). Se docs/BESLUT_MENTORSKAP_KANON_2026-06-20.md.
//
// Tre lägen:
//  - preview:        båda valda i dropdownsen, före Tilldela (vad det SKULLE göra)
//  - activeInForm:   befintlig paring, mentorn i form (effekten går)
//  - activeOutOfForm: mentorn ur form (<40) — grinden gjord läsbar (promise↔konsekvens)
//
// Effekten skalar med mentorns disciplin och pausas när mentorns form < 40
// (youthProcessor: devBoost = disciplin/20, gated mentor.form >= 40).

/** Preview: båda valda i dropdownsen, före Tilldela. */
export function mentorshipPreview(seniorName: string, disciplin: number, juniorName: string): string {
  if (disciplin >= 80) {
    return `${seniorName} håller hård disciplin. ${juniorName} skulle dra fördel snabbt — så länge ${seniorName} själv håller formen.`
  }
  return `${seniorName} går före med ordning och reda. ${juniorName} lyfter stadigt med en rutinare bredvid sig — när formen finns där.`
}

/** Aktiv paring, mentorn I form (effekten går). */
export function mentorshipActiveInForm(mentorName: string, disciplin: number, adeptName: string): string {
  if (disciplin >= 80) {
    return `${mentorName} går före med disciplin. ${adeptName} snappar upp det — utvecklingen lyfter, märks om några omgångar.`
  }
  return `${mentorName} visar ${adeptName} hur man sköter sig. Stadig dragkraft, inget mirakel — men det lutar rätt väg.`
}

/** Aktiv paring, mentorn UR form (<40) — effekten pausad, grinden läsbar. */
export function mentorshipActiveOutOfForm(mentorName: string, adeptName: string): string {
  return `${mentorName} är för dåligt däckad själv för att föregå med exempel just nu. ${adeptName} står stilla tills formen kommer tillbaka.`
}

// ── Spelarkort, RELATIONER-bond (kortare än AkademiTabs konsekvensrad) ──
// Adept-sidan: "Mentoreras av {X} · sedan omg {startRound}" + en av dessa. Framing
// är ALLTID "sedan omg N", aldrig nedräkning — Mentorship bär startRound, inte expiresRound.

/** Adeptens kort, mentorn i form (båndet verkar). Namnlös — raden ovanför namnger mentorn. */
export function mentorshipBondAdeptInForm(): string {
  return 'Växer snabbare med en rutinare bredvid sig.'
}

/** Adeptens kort, mentorn UR form (<40) — vilande-tillståndet gjort läsbart. */
export function mentorshipBondAdeptResting(mentorName: string): string {
  return `${mentorName} är i svacka — formen för låg för att leda. Växten pausar tills han hittar tillbaka.`
}
