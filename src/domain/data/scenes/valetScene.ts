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
  /** N-4: kvalitativ bygghorisont på titelraden — härledd ur buildRounds. */
  horizonLabel: string
  cost: number
  /** A-2 (Valet-scen-audit, 2026-07-06): CTA-texten i bekräfta-steget när kortet är
   *  valt men inte bekräftat än — bär nodens namn ("Bygg värmestugan"), aldrig
   *  generiskt "Bekräfta". Alla tio skrivna och dömda 2026-07-06. */
  confirmCta: string
  /** N-5: kursiv serif-flavorrad — klubbens röst om vad bygget lovar. */
  flavor: string
}

/**
 * A-2 (Valet-scen-audit, beslut 2026-07-06 — Jacob): tap-to-commit bytt mot
 * select→confirm. Skäl: valet är irreversibelt och säsongsdefinierande (120–300 tkr
 * ur en kassa på några hundra), ett feltryck ska inte låsa året, och tvåstegsmodellen
 * förstärker A-1-likvärdigheten (inget händer förrän spelaren aktivt bekräftar).
 * Nyckel = nodeId, samma format som BOARD_MEETING_EXPECTATION_LINE (M63).
 */
const VALET_CONFIRM_CTA: Record<string, string> = {
  varmestuga: 'Bygg värmestugan',
  laktare_ostra: 'Bygg östra läktaren',
  belysning: 'Sätt upp belysningen',
  matchhall: 'Ta upp hallfrågan',
  kiosk: 'Bygg kiosken',
  stralkastare: 'Res strålkastarna',
  gym: 'Bygg gymmet',
  traningshall: 'Bygg träningshallen',
  akademi_2: 'Starta akademiprogrammet',
  akademi_3: 'Bygg elitakademin',
}

/**
 * N-5 (Valet-scen-audit, beslut 2026-07-06): flavor-raden per kort — kursiv
 * Georgia i mocken ("det som gör kortet till en scen, inte en meny").
 * Klubbens röst om vad bygget LOVAR — aspirationsspråk är tillåtet här
 * (konsekvensraden bär redan riktningarna; L#9 gäller påståenden om nuläget).
 * Varmestugans rad är mockens kanon-exempel, behållen ordagrant.
 * Code: rendera som kursiv serif-rad på kortet (se auditens .vflavor).
 */
const VALET_FLAVOR: Record<string, string> = {
  varmestuga: 'Kylan biter mindre. Folk stannar.',
  laktare_ostra: 'Fyrahundra platser till. De syns från vägen.',
  belysning: 'Mörkret får vänta utanför staketet.',
  matchhall: 'Tak över isen. Frågan är vad det kostar — utöver pengarna.',
  kiosk: 'Varm korv i pausen. Kön är halva nöjet.',
  stralkastare: 'Kvällsmatch i vitt ljus. Det ser ut som allvar.',
  gym: 'Det som byggs där inne syns på isen.',
  traningshall: 'Ungdomarna slipper vänta på vintern.',
  akademi_2: 'Egna spelare. Det börjar med ett schema.',
  akademi_3: 'Orten fostrar sina egna. Hela vägen upp.',
}

export interface ValetScene {
  /** Genre-etikett — "⬩ Säsongsstart · Valet ⬩". */
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
  /** A-2: bekräfta-CTA:n för avstå-valet, samma tvåstegsmodell som korten. */
  declineConfirmCta: string
  /** A-1 (Valet-scen-audit): knapp-likvärdighet — inget kort är förvalt. */
  noPresetNote: string
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

/**
 * N-4 (Valet-scen-audit, beslut 2026-07-06 — Fable): kvalitativ horisontetikett
 * på kortets titelrad. OBS: mockens exempelnivåer ("I år" / "Om tre säsonger")
 * skulle LJUGA mot motorn — Valet sker vid säsongsstart och buildRounds spänner
 * 4–20 av seriens 22 omgångar, så ALLT blir klart inom innevarande säsong.
 * Trösklarna mappar därför mot bandyårets inre kalender (serien november–mars):
 * ≤6 omg ≈ december · 7–14 ≈ jan–feb · ≥15 ≈ slutspurten. "klar om ~X omg"
 * behålls i metaraden — kvantiteten för den som räknar, horisonten för scenen.
 */
function buildHorizonLabel(buildRounds: number): string {
  if (buildRounds <= 6) return 'Före jul'
  if (buildRounds <= 14) return 'Mitt i vintern'
  return 'Lagom till våren'
}

export function getValetScene(game: SaveGame): ValetScene {
  const facilityState = game.facilityState
  const choices = facilityState ? getPreSeasonChoices(facilityState) : []
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)

  const cards: ValetChoiceCard[] = choices.map(def => ({
    nodeId: def.id,
    label: def.label,
    consequenceParts: buildConsequenceParts(def),
    buildRounds: def.buildRounds,
    horizonLabel: buildHorizonLabel(def.buildRounds),
    cost: def.cost,
    confirmCta: VALET_CONFIRM_CTA[def.id] ?? '[Opus]',
    flavor: VALET_FLAVOR[def.id] ?? '',
  }))

  return {
    genre: '⬩ Säsongsstart · Valet ⬩',
    heading: `Vad bygger ${managedClub?.name ?? 'klubben'} i år?`,
    prolog: `Frosten ligger på planen om morgnarna. Innan första matchen samlas det som ska bli årets arbete vid sidan av isen.`,
    question: 'Ett bygge ryms i år. Eller inget — att vänta är också ett val.',
    cards,
    declineLabel: 'Vi väntar i år',
    declineNote: 'Inget bygge den här säsongen. Kassan får vila — och nästa år kan valet vara ett annat.',
    declineConfirmCta: 'Vänta i år',
    noPresetNote: 'Inget val är förvalt.',
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
