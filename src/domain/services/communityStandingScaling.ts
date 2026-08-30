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

// ── ANSPRÅK 4: ortsunderhållet (DOM_ANSPAK4_ORTSUNDERHALL_2026-08-29.md) ────
//
// De två funktionerna nedan kör på csLinearRamp men matar in KLUBBENS RYKTE,
// inte communityStanding. Det är avsiktligt och är samma disciplin, inte ett
// undantag från den: rykte är spelets kontinuerliga storleksaxel, och domen
// är uttrycklig om att storleken INTE får gata detta bakom `calculateClubEra`
// (diskret) eller någon annan tröskel — exakt den felklass D031 finns för att
// stoppa, bara flyttad från cs-axeln till rykte-axeln. csLinearRamp är därför
// återanvänd rakt av; parameternamnet `cs` i signaturen är historiskt, primitiven
// är en ren linjär interpolator.
//
// Domen: "När klubben vuxit har orten stigit i sina förväntningar: samma insats
// håller mindre." En liten klubbs skolbesök är en händelse; en stor klubbs
// skolbesök är väntat.

/** Rykte där ortsunderhållet fortfarande har FULL effekt (faktor 1,0, drag 0).
 *  Elva av tolv klubbar startar under detta (Forsbacka 85 är ensam över), och de
 *  sex minsta (Heros 45, Slottsbron 48, Rögle 50, Skutskär 52, Söderfors 55,
 *  Hälleforsnäs 60 — CLUB_TEMPLATES) ligger 20-35 poäng under.
 *  H4/Survive-golvet, domens SKYDDAT-punkt 3: mätningen visar Heros CS-bana
 *  IDENTISK med baslinjen säsong 1-4 (rykte 56/63/70/80, faktor 1,00 hela vägen). */
export const CS_UPKEEP_REP_FLOOR = 80
/** Rykte där ortsunderhållet är som dyrast. En dominant klubb i mätningen ligger
 *  på 95-100 från säsong 2 och framåt. */
export const CS_UPKEEP_REP_CEIL = 100
/** Faktor vid rykte-taket. 0,85 och inte doktrinens förslag ~0,4-0,5: mätningen
 *  visade att knapp 1 per konstruktion BARA träffar klubben som redan gör rätt
 *  (en klubb utan aktiviteter/frivilliga har ingen boost att skala — dess CS-snitt
 *  var identiskt 77,1 vid faktor 1,00/0,85/0,70/0,55). Ett hårt golv beskattar
 *  alltså enbart insatsen och rör inte den coastande klubben alls, samtidigt som
 *  det krymper skillnaden mellan att hålla och att glida — domens GODKÄNT NÄR 1.
 *  Se D037 för hela svepet. */
export const CS_UPKEEP_FACTOR_CEIL = 0.85
/** Baslinjedrag i CS/omgång vid rykte-taket (knapp 2). Se D037: bortom 1,6 faller
 *  valets synlighet snabbt (ΔCS 5,5 → 4,9 vid 1,8 → 4,3 vid 2,0) utan att den
 *  coastande klubben pressas nämnvärt längre ned. */
export const CS_EXPECTATION_DRAG_CEIL = 1.6

/**
 * ANSPRÅK 4, knapp 1: hur mycket av aktivitets- och volontärboosten som faktiskt
 * biter, som funktion av klubbens storlek (rykte). 1,0 för en liten klubb,
 * fallande linjärt till CS_UPKEEP_FACTOR_CEIL för en stor. Bara den POSITIVA
 * aktivitets-/volontärsumman skalas — negativ csBoost (förlust, skandal) är
 * orörd, det ska vara lika lätt att falla oavsett storlek.
 *
 * Kombineras multiplikativt med getCsDiminishingFactor (som dämpar efter CS-nivå,
 * inte efter storlek). Den kombinationen är mätt och holdbarheten verifierad —
 * se D037 och doktrinens tillägg.
 */
export function csUpkeepFactor(reputation: number): number {
  return csLinearRamp(reputation, CS_UPKEEP_REP_FLOOR, CS_UPKEEP_REP_CEIL, 1.0, CS_UPKEEP_FACTOR_CEIL)
}

/**
 * ANSPRÅK 4, knapp 2: ortens stigande förväntan som ett baslinjedrag i CS per
 * omgång, oberoende av matchresultat. Returnerar en POSITIV magnitud som
 * anropsstället drar av.
 *
 * Byggd först efter mätning, inte spekulativt (domens krav). Baslinjen visade
 * coasting-hålet svart på vitt: en dominant klubb UTAN en enda aktivitet och
 * UTAN en enda frivillig låg ändå kvar på CS-snitt 77 och slutade säsonger på 83
 * — hela ortsspaken var värd bara 9,2 CS för den klubben (mot 25,4 för
 * mittenklubben och 42,7 för Heros). Knapp 1 kan per konstruktion aldrig röra
 * de 77 poängen; de kommer från segrar, som inte skalas. Utan knapp 2 hade
 * anspråk 4 varit verkningslöst på precis den klubbklass det handlar om.
 */
export function csExpectationDrag(reputation: number): number {
  return csLinearRamp(reputation, CS_UPKEEP_REP_FLOOR, CS_UPKEEP_REP_CEIL, 0, CS_EXPECTATION_DRAG_CEIL)
}
