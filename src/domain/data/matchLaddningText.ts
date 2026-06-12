// src/domain/data/matchLaddningText.ts
// A3 Match-laddning — pre-match-beat. Opus-text 2026-06-07.
// Spec: design-system/briefs/DESIGN-BRIEF-MATCH-LADDNING-2026-06-07.md
//
// Två nivåer (DESIGN-DECISIONS "tre lager"): SCEN (tillfälle) + BAND (tillstånd).
// Kontrakt:
//   charge = EN laddningsrad, tillfällets ton. ALDRIG analys ("ni behöver 2 poäng").
//            Bandy-understatement, torrt, konkret. Komponenten roterar med
//            anti-upprepning (staleBias/lastShown) — inte var match.
//   relation = kort faktiskt fäste (mono). Code prependar plats: "{plats} · {fäste}".
//   stake  = VILLKORLIG kort warm-pill. ENDAST om seasonContextService ger insats
//            (relegationFight / topRace). Mittfält → ingen stake, aldrig påhittad.
//   eyebrow = tillfällets etikett. För sviter: streakEyebrow(n), räknas ur svit-längd.
//
// Grinden (vilka matcher får en beat) är Codes, ur roundCharacter + isAnnandagen +
// round==='Final' + kalenderflaggor. post_loss är medvetet UTANFÖR grinden (för frekvent).

export type LaddningOccasion = 'annandagen' | 'derby' | 'cup' | 'premiar' | 'final' | 'nyar'
export type LaddningState = 'losing_streak' | 'winning_streak'
export type SeasonStake = 'relegationFight' | 'topRace'

export interface OccasionText {
  /** Fast etikett, eyebrow. Guld ENDAST på 'final' (DB-2); övriga accent/warm i komponenten. */
  eyebrow: string
  /** Kort faktiskt fäste (mono). Code: "{plats} · {fäste}". */
  relation: string[]
  /** Laddningsrad-varianter (italic Georgia). En visas. Tillfällets ton, aldrig analys. */
  charge: string[]
}

/** SCEN-nivå — tillfällen. Full beat före uppställningen. */
export const SCENE_TEXT: Record<LaddningOccasion, OccasionText> = {
  annandagen: {
    eyebrow: 'ANNANDAGEN',
    relation: ['Annandagsbandy', 'Årets mest sedda omgång'],
    charge: [
      'Hela bygden på plats – tabelläget kommer i andra hand.',
      'Skinkan är uppäten, isen väntar.',
      'Termosar, sittunderlag, portfölj, hela släkten på läktaren.',
      'Mörkt vid fyra, strålkastarna på.',
      'En match att minnas.',
    ],
  },
  derby: {
    eyebrow: 'DERBY',
    relation: ['Grannfejden', 'Det korta avståndets match'],
    charge: [
      'Det är inte långt från platsen bortalaget kallar hemma.',
      'Det här har halva bygden väntat på sedan sist.',
      'Samma älv, två bruk.',
      'De jobbar sida vid sida till vardags – men inte ikväll.',
      'De här läktarna har sett generationer komma och gå.',
    ],
  },
  cup: {
    eyebrow: 'CUPEN',
    relation: ['Utslagsmatch'],
    charge: [
      'Vinna eller hem i spelarbussen.',
      'I dag har ingen tabellen att luta sig mot.',
      'Här kan vem som helst slå vem som helst.',
      'Det som hände i höstas räknas inte i dag.',
      'Det sitter hårdare i magen än en seriematch.',
    ],
  },
  premiar: {
    eyebrow: 'PREMIÄR',
    relation: ['Säsongens första omgång'],
    charge: [
      'Första isen sedan i våras.',
      'Just nu kan alla tolv sluta etta.',
      'Ny is, och ingen vet något än.',
      'Första riktiga kylan är här.',
      'Äntligen bandy igen.',
    ],
  },
  final: {
    eyebrow: 'FINAL',
    relation: ['SM-final'],
    charge: [
      'En match. Studenternas. Uppsala.',
      'Hela säsongen mot den här enda matchen.',
      'Det är hit alla vill, men få når ända fram.',
      'Var guldet hamnar avgörs i dag.',
      'För somliga klubbar är det här en gång i livet.',
    ],
  },
  nyar: {
    eyebrow: 'NYÅR',
    relation: ['Nyårshelgens omgång', 'Trettondagsbandy'],
    charge: [
      'I mellandagarna, när allt annat står still.',
      'Trettondagen på isen, som varenda år.',
      'Nyårslöftena får vänta. I dag är det match.',
      'Kallast nu, och bästa isen med.',
    ],
  },
}

/** BAND-nivå — tillstånd över flera matcher. Slimmat band på uppställningen. */
export const BAND_TEXT: Record<LaddningState, { charge: string[] }> = {
  losing_streak: {
    charge: [
      'Det har inte lossnat på ett tag.',
      'Någonstans vänder det. Lika gärna i dag.',
      'Ingen pratar om det i omklädningsrummet. Alla tänker på det.',
      'Det svåraste är att gå ut och spela som om ingenting hänt.',
    ],
  },
  winning_streak: {
    charge: [
      'Det rullar på, match efter match.',
      'Ingen säger det högt, men alla räknar raderna.',
      'Laget går nästan av sig självt nu.',
      'Det är när det känns lätt man ska se upp.',
    ],
  },
}

/**
 * Svit-brottet (DESIGN-BRIEF §9): bandet tänds på förändring — och brottet är ett
 * eget litet beat, kvitteringen på "någonstans vänder det". Visas EN gång, ronden
 * efter att sviten brutits.
 */
export const STREAK_BROKEN_CHARGE: Record<LaddningState, string[]> = {
  losing_streak: [
    'Så vände det. Det satt långt inne.',
    'Poäng igen. Man andas ut, och börjar om.',
  ],
  winning_streak: [
    'Där tog sviten slut.',
    'Första förlusten på länge. Nu syns det vad den var värd.',
  ],
}

/** Lagpresentation-keylines (assisterande tränare, step 3 SM-final). */
export const FINAL_LAGPRESENTATION_QUOTES: string[] = [
  '"De har rutinen. Vi har ingenting att förlora. Jag vet vilket jag hellre har i en final."',
  '"Alla vet att vi inte borde vara här. Det är precis det som gör det svårare för dem."',
  '"En av dessa klubbar vinner sitt första SM-guld på länge. Kanske mycket länge."',
  '"I en final spelar man inte mot formen från i förra veckan. Man spelar mot historieboken."',
]

/** VILLKORLIG warm-pill. ENDAST om seasonContext ger insats. Kort. Aldrig i mittfält. */
export const STAKE_TEXT: Record<SeasonStake, string[]> = {
  relegationFight: ['Bottenstrid', 'Nedflyttning hotar', 'Kvalstrecket nära'],
  topRace: ['Toppstrid', 'Jagar serieledning', 'Guldchansen lever'],
}

const RAKA_ORD: Record<number, string> = {
  3: 'TRE', 4: 'FYRA', 5: 'FEM', 6: 'SEX', 7: 'SJU', 8: 'ÅTTA', 9: 'NIO',
}

/** Svit-eyebrow ur svit-längd: 3 → "TRE RAKA". */
export function streakEyebrow(n: number): string {
  return `${RAKA_ORD[n] ?? n} RAKA`
}

/** Svit-relation ur längd: losing → "Ingen vinst på 4", winning → "4 raka segrar". */
export function streakRelation(n: number, state: LaddningState): string {
  return state === 'losing_streak' ? `Ingen vinst på ${n}` : `${n} raka segrar`
}
