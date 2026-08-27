/**
 * D-FACT: communityStanding — skalningsregel för nya konsumenter. Se även
 * D031 (`docs/findings/facts/design_principles/D031_community_standing_scaling.yaml`).
 *
 * Bakgrund (RAPPORT_COMMUNITYSTANDING_TROSKELSVEP_2026-08-26, Jacobs dom
 * 2026-08-26): 274 träffar på `communityStanding` grep:ades, 13 var binära
 * trösklar, noll var dokumenterade. Fem oberoende system (sponsortröskeln,
 * `diminishingFactor`, en ryktesmilstolpe, ett spelarinitierat bidrag, en
 * era-gräns) råkade alla slå om på EXAKT samma tal (cs=70/71) utan att någon
 * skrev det avsiktligt — "fem system slår om på exakt 70 och ingen skrev
 * det avsiktligt" är fyndets verkliga innebörd, inte de enskilda buggarna.
 * En diskret tröskel på ett kontinuerligt fält är alltid en gissning om VAR
 * gränsen ska gå; fem oberoende gissningar landade på samma tal av en
 * slump, inte av design.
 *
 * REGEL FÖR NYA KONSUMENTER: communityStanding (0-100, `SaveGame.
 * communityStanding`, default 50) är en kontinuerlig mätare — ortens
 * relation till klubben. Ett nytt system som låter ETT HELTAL avgöra en
 * effekt (pengar, en procentsats, en multiplikator, en sannolikhet) ska
 * INTE gata det bakom `cs > N`. Använd `csLinearRamp` nedan: definiera en
 * golv-cs och en tak-cs, låt allt däremellan interpolera linjärt.
 *
 * Två olika saker kan skala, och det avgör vilken av två metoder som gäller:
 * 1. En AMOUNT/FAKTOR (pengar, multiplikator) — skala VÄRDET direkt med
 *    `csLinearRamp`. Se `getCsDiminishingFactor`/kommunstöd/politikerbidrag
 *    nedan.
 * 2. Om en HÄNDELSE ÖVERHUVUDTAGET KAN INTRÄFFA, när resultatet är odelbart
 *    (en mecenatplats är ett heltal, kan inte vara 1,4; en engångshändelse
 *    inträffar eller inte) — skala istället SANNOLIKHETEN att det prövas,
 *    aldrig till exakt 0% (en "aldrig, någonsin"-vägg för en hel klubbklass
 *    är samma fel som en hård tröskel, bara gömd bakom en tärning). Se
 *    `detOmojligaValet` (postAdvanceEvents.ts) för ett exempel byggt med
 *    denna metod. Mecenat-/patron-trösklarna (#4-#6 i sveptrapporten) är
 *    en EGEN runda med en egen rapport (`RAPPORT_MECENATGENERERING_
 *    2026-08-26.md`) eftersom de redan har en existerande, mer komplex
 *    genereringspipeline att foga in i — löses inte härifrån.
 *
 * Kända konsumenter (2026-08-26):
 * - `contextualSponsorService.ts` — kommunstöd, engångsbelopp (golv cs50, tak cs90)
 * - `communityProcessor.ts` — `getCsDiminishingFactor`, diminishing returns på positiva CS-boostar (golv cs55, tak cs100)
 * - `reputationMilestoneService.ts` — `getCsNeighborContactAmount`, grannklubbs-milstolpen (golv cs55, tak cs90)
 * - `gameStore.ts` (politician apply-action) — `getCsPoliticianGrantBonus` (golv cs50, tak cs90)
 * - `postAdvanceEvents.ts` — `getCsDetOmojligaValetProbability`, "det omöjliga valet" (golv cs0, tak cs100)
 *
 * Kända KVARSTÅENDE binära trösklar (#7-#8, #12-#13 i sveptrapporten,
 * Jacobs omprioritering 2026-08-26) — INTE fixade, se BACKLOG.md.
 */
export function csLinearRamp(cs: number, floorCs: number, ceilCs: number, floorValue: number, ceilValue: number): number {
  const t = Math.max(0, Math.min(1, (cs - floorCs) / (ceilCs - floorCs)))
  return floorValue + t * (ceilValue - floorValue)
}

/** #1 (communityProcessor.ts): diminishing returns på positiva CS-boostar.
 *  1.0 (ingen dämpning) vid/under cs55, linjärt ner till 0.25 vid cs100 —
 *  samma golv/tak som gamla 4-stegstrappan hade som sina ytterlighetsvärden,
 *  bara utan trappstegen. */
export function getCsDiminishingFactor(cs: number): number {
  return csLinearRamp(cs, 55, 100, 1.0, 0.25)
}

/** #2 (reputationMilestoneService.ts): grannklubbens engångsmilstolpe. Var
 *  cs>70 → fast +2 CS. Golvet flyttat till cs55 (samma ankare som
 *  diminishingFactor, inte ett nytt godtyckligt tal) — tröskeln delar
 *  därmed inte längre linje med de andra fyra systemen som satt på 70/71,
 *  och beloppet skalar 1→3 istf ett fast 2. */
export function getCsNeighborContactAmount(cs: number): number {
  return Math.round(csLinearRamp(cs, 55, 90, 1, 3))
}

/** #3 (gameStore.ts, politician apply-action): spelarinitierat bidrag. Var
 *  cs>70 → fast +10 000 kr. Delar kurva med kommunstödet (samma golv/tak,
 *  samma "kommun"-domän). */
export function getCsPoliticianGrantBonus(cs: number): number {
  return Math.round(csLinearRamp(cs, 50, 90, 0, 10_000))
}

/** #11 (postAdvanceEvents.ts): "det omöjliga valet". Var `cs>60` — en klubb
 *  under 60 kunde ALDRIG se en av spelets nio 5/5-systemhändelser
 *  (DOM_VARSLET_KLASSIFICERING_2026-08-17.md), oavsett hur länge den satt i
 *  finanskris med en älskad akademispelare — exakt den klubbprofil
 *  händelsen handlar om. Ersatt av en sannolikhet som prövas VARJE
 *  kvalificerande omgång (samma idiom som filens övriga rand()-villkor,
 *  t.ex. spöksponsorn): 3% vid cs0, stigande linjärt till 15% vid cs100 —
 *  aldrig noll, aldrig garanterat. Magnituderna är ett förslag, inte en
 *  låst balans — Jacob mäter och dömer. */
export function getCsDetOmojligaValetProbability(cs: number): number {
  return csLinearRamp(cs, 0, 100, 0.03, 0.15)
}
