/**
 * Valet — säsongsstartens ceremoniella byggval (B1).
 *
 * Domän utan yta tidigare: getPreSeasonChoices() fanns men ingen scen renderade den.
 * Den här filen är scentexten. Designsvar 2026-06-19 (SVAR-B1-NAVIGERING-FABLE):
 * "Två ingångar, ett träd" — välj-läget är den här ceremonin, betrakta-läget är
 * Bygget-fliken. Den typografiska scenen (3:e ceremoninivån, Förbättring 1).
 *
 * SÄSONGSPLACERING (Jacob-beslut 2026-06-19): Säsong 1 är Valet-FRI — ankomst och
 * överlevnad (ArrivalScene), och Bygget-fliken visar trädet som ASPIRATION (man kan
 * titta och lära dimensionerna, men inte committa ett bygge). Första Valet fyrar vid
 * säsong 2:s start, sedan varje säsongsstart. Det gör säsong 2 till ett kapitelbrott
 * ("du överlevde — vad ska vi bygga?") och Valet-ceremonin blir strypventilen som gör
 * byggträdet smältbart: en ceremoniell årsfråga, inte en alltid-öppen meny.
 *   → Code-konsekvens: byggandet måste vara LÅST i säsong 1 (seasonSummaries.length === 0).
 *     Bygget-fliken visar trädet men välj-läget/"Bygg ut" är inaktivt tills säsong 2.
 *
 * Tonalitet: bruksort, understatement. Valet är inte en feature-prompt — det är klubben
 * som frågar "vad bygger vi i år?". Ett val, eller vänta. Att avstå är ett legitimt svar,
 * inte ett misslyckande (en slow arc får vara tyst).
 *
 * All svensk text lever här. Inget hårdkodas i komponenten.
 *
 * SEKVENSERING (löst): detectSceneTrigger är prioritetsordnad och returnerar EN scen per
 * anrop. Lägg 'valet' DIREKT EFTER 'board_meeting' i den listan — styrelsemötet markerar
 * sig självt visat, så det fyrar först, Valet nästa anrop. Ger styrelsemöte → Valet →
 * portal utan särskild sekvenseringslogik. (Vid säsong 3+ fyrar styrelsemötet inte längre
 * — en gång per spel — och Valet fyrar då ensamt, vilket är korrekt.)
 */

import type { SaveGame } from '../../entities/SaveGame'
import type { FacilityNodeDef, FacilityConsequence } from '../../entities/Community'
import { getPreSeasonChoices } from '../../services/facilityService'

/** En färgkodad bit av konsekvensraden — dir avgör severity-färgen i presentationslagret. */
export interface ConsequencePart {
  text: string
  dir: FacilityConsequence['dir']
}

export interface ValetChoiceCard {
  nodeId: string
  label: string
  /** Konsekvensraden i klubbens ordning: vinsten först, kostnaden med (ärlighetsregeln).
   *  Strukturerad (inte en platt sträng) så presentationslagret kan färgkoda per dir —
   *  konvention: färg = severity (samma som FacilityTree ConsekvensRad). */
  consequenceParts: ConsequencePart[]
  /** Byggtid i omgångar — "klar om ~X omg". */
  buildRounds: number
  cost: number
}

export interface ValetScene {
  /** Genre-etikett — "⬩ Valet ⬩". */
  genre: string
  /** Inramning — den typografiska scenens hjälte. */
  heading: string
  /** Setting-prolog, kursiv. Sätter årstiden och frågan. */
  prolog: string
  /** Frågan som ställs över korten. */
  question: string
  cards: ValetChoiceCard[]
  /** Avstå-raden — att vänta är ett legitimt val, inte ett hopp över. */
  declineLabel: string
  declineNote: string
  /** Om inga val finns (allt byggt, eller bygge pågår) — scenen ska inte ens triggas, men text finns för säkerhets skull. */
  emptyNote: string
}

const DIM_LABEL: Record<FacilityConsequence['dim'], string> = {
  publik: 'Publik',
  ekonomi: 'Ekonomi',
  ungdom: 'Ungdom',
  sjal: 'Själ',
}

const DIR_ARROW: Record<FacilityConsequence['dir'], string> = {
  upp: '↑',
  ned: '↓',
  noll: '—',
}

/**
 * Bygg konsekvensraden i klubbens ordning: positiva/neutrala dimensioner först
 * (vinsten man bygger för), kostnaden sist (ärlighetsregeln — köp-val visar alltid
 * kassakostnaden). Returnerar delar, inte en färdig sträng — N-1 (färg = severity,
 * en platt sträng kan inte färgkodas i presentationslagret).
 */
function buildConsequenceParts(def: FacilityNodeDef): ConsequencePart[] {
  const gains = def.consequences.filter(c => c.dim !== 'ekonomi' || c.dir !== 'ned')
  const costs = def.consequences.filter(c => c.dim === 'ekonomi' && c.dir === 'ned')
  return [...gains, ...costs].map(c => ({
    // Kostnadsraden bär redan sin egen etikett ("Kassa −120 tkr") — använd den rakt.
    text: c.dim === 'ekonomi' && c.dir === 'ned' ? c.label : `${DIM_LABEL[c.dim]} ${DIR_ARROW[c.dir]}`,
    dir: c.dir,
  }))
}

export function getValetScene(game: SaveGame): ValetScene {
  const facilityState = game.facilityState
  const choices = facilityState ? getPreSeasonChoices(facilityState) : []

  const cards: ValetChoiceCard[] = choices.map(def => ({
    nodeId: def.id,
    label: def.label,
    consequenceParts: buildConsequenceParts(def),
    buildRounds: def.buildRounds,
    cost: def.cost,
  }))

  return {
    genre: '⬩ Valet ⬩',
    heading: 'Vad bygger vi i år?',
    prolog: `Snön ligger kvar på planen. Innan första matchen samlas det som ska bli årets arbete vid sidan av isen.`,
    question: 'Ett bygge ryms i år. Eller så väntar vi — pengarna gör mer nytta i kassan ett år till.',
    cards,
    declineLabel: 'Vi väntar i år',
    declineNote: 'Inget bygge den här säsongen. Kassan får vila — och nästa år kan valet vara ett annat.',
    emptyNote: 'Inget att bygga just nu — antingen står ett bygge redan på gång, eller så är det som går att bygga redan byggt.',
  }
}

/**
 * Triggar vid säsongsstart från och med säsong 2 (en gång per säsong), om det finns
 * något att välja och inget bygge pågår.
 *
 * - seasonSummaries.length === 0 ⇒ säsong 1 ⇒ Valet-fri (samma gate som styrelsemötet).
 * - valetShownSeason === currentSeason ⇒ redan visad denna säsong (per-säsong-idiom,
 *   som upptaktPhaseMarkSeenSeason). Stämplas av wiringen när scenen resolvats —
 *   INTE via shownScenes (den är SceneId[] = en gång per spel, fel för en recurring scen).
 */
export function shouldTriggerValet(game: SaveGame): boolean {
  if ((game.seasonSummaries?.length ?? 0) === 0) return false
  if (game.valetShownSeason === game.currentSeason) return false
  if (game.pendingScene?.sceneId === 'valet') return false
  if (game.currentMatchday !== 0) return false
  const anyMatchPlayed = game.fixtures.some(f => f.status === 'completed')
  if (anyMatchPlayed) return false
  const facilityState = game.facilityState
  if (!facilityState) return false
  return getPreSeasonChoices(facilityState).length > 0
}
