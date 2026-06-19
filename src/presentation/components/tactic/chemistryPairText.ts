import type { Player } from '../../../domain/entities/Player'
import type { FormationSlot } from '../../../domain/entities/Formation'

// ── B4b: Branch-based pair expand text ──────────────────────────────────────
// Texts from TEXT_REVIEW_formations_2026-04-20.md — copied exactly.
// Returns null when no concrete suggestion exists (tystnad > generalisering).
// Genomgång II B: extraherad ur ChemistryView när kemin blev ett lager i FormationView.
export function getPairExpandText(
  playerA: Player,
  playerB: Player,
  slotA: FormationSlot,
  slotB: FormationSlot,
  chemistryStrength: 'strong' | 'weak' | 'neutral',
  seed: number,  // deterministic pick within session
): string | null {
  const nameA = playerA.lastName
  const nameB = playerB.lastName

  // Branch 1: New signing — overrides all other branches
  // Approximation: count career games in current club via seasonHistory
  function gamesInCurrentClub(p: Player): number {
    return (p.seasonHistory ?? [])
      .filter(s => s.clubId === p.clubId)
      .reduce((sum, s) => sum + s.games, 0)
  }
  const aIsNew = gamesInCurrentClub(playerA) < 5
  const bIsNew = gamesInCurrentClub(playerB) < 5
  if (aIsNew || bIsNew) {
    const ny = aIsNew ? nameA : nameB
    const gammal = aIsNew ? nameB : nameA
    const templates = [
      `"${ny} är ny i klubben. Ge det några matcher innan ni bygger anfall via dom båda."`,
      `"${ny} har inte hittat rytmen med ${gammal} än. Tålamod — kemin kommer."`,
    ]
    return templates[seed % templates.length]
  }

  const xDist = Math.abs(slotA.x - slotB.x)

  if (chemistryStrength === 'strong') {
    // Branch 2: Strong + together — already optimal, say nothing
    if (xDist <= 25) return null

    // Branch 3: Strong + far apart — unused potential, suggest side
    if (xDist > 50) {
      const sida = slotA.x < 40 ? 'vänster' : slotA.x > 60 ? 'höger' : null
      const templates = sida ? [
        `"${nameA} och ${nameB} har bra kemi — men sitter långt isär. Prova att flytta ihop dom på ${sida}."`,
        `"Stark koppling som inte utnyttjas. Överväg att sätta ${nameB} på ${sida} tillsammans med ${nameA}."`,
        `"Bra kemi men utspritt. Flytta ihop dom om laget tillåter."`,
      ] : [
        `"Bra kemi men utspritt. Flytta ihop dom om laget tillåter."`,
      ]
      return templates[seed % templates.length]
    }

    // Moderate distance — no concrete suggestion
    return null
  }

  if (chemistryStrength === 'weak') {
    // Branch 4: Weak + together — warn about direct passes
    if (xDist <= 25) {
      const templates = [
        `"${nameA} och ${nameB} läser inte varandra än. Undvik långa direktpass — låt dom spela via mittfältet."`,
        `"Svag koppling men dom kommer jobba ihop. Håll det enkelt tills dom hittar varandra."`,
        `"Om laget tillåter — sätt ${nameA} och ${nameB} på olika sidor tills kemin växt."`,
      ]
      return templates[seed % templates.length]
    }

    // Branch 5: Weak + far apart — low risk, say nothing
    return null
  }

  // Branch 6: Neutral — say nothing
  return null
}
