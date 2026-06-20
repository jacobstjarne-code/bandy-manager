/**
 * facilityPortalBeats.ts
 *
 * Bygg-beats — portalens lågmälda knuff in i Bygget-fliken när något HÄNT i bygget.
 * Designsvar 2026-06-19 (SVAR-B1-NAVIGERING-FABLE, §04 "Hur det lever"): en rad i
 * portalens rytm, aldrig hela trädet. Copper-stripe, etikett, EN mening, en pil in i
 * fliken. Bär aldrig data ("47% färdig") — bara knuffen. Klubbliv, aldrig feature-prompt.
 *
 * Texterna är Opus-satta och slutliga (samma kontrakt som portalBeats.ts).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TVÅ CODE-BEROENDEN INNAN DETTA KAN WIRAS (Opus kan inte lösa dem i text):
 *
 * 1. STATE-FÄLT SAKNAS (anti-brus regel 01 "bara på state-change").
 *    Ett bygg-beat ska trigga på ÖVERGÅNGEN (noden blev klar DENNA omgång), inte på
 *    det stående tillståndet (noden ÄR klar) — annars visas det varje omgång tills
 *    det stängs, vilket bryter regel 01. Men `advanceFacilityState` returnerar
 *    `completedNodeId` UTAN att spara det, och `activeProject` sätts till undefined
 *    vid färdigställande. Det finns ingen "blev klar nyligen"-markör i FacilityState.
 *    → Code: lägg ett fält, förslag `facilityState.lastCompleted?: { nodeId: string;
 *      matchday: number }` som advanceFacilityState sätter, och som beat-triggern
 *      läser (visa beatet bara om lastCompleted.matchday === currentMatchday, dvs
 *      övergången skedde nyss). Samma mönster för "nod blev möjlig" kräver att man
 *      jämför available-set mot förra omgångens — eller enklare: trigga "möjlig" först
 *      när spelaren INTE har ett aktivt bygge OCH minst en ny available-nod finns som
 *      inte fanns förra omgången (kräver också en föregående-snapshot, eller acceptera
 *      en svagare trigger). Hallen-prövningssteget väntar ändå på Opus mekanik-låsning.
 *
 * 2. NAVIGATIONSAFFORDANS SAKNAS i PortalBeat.tsx.
 *    Nuvarande PortalBeat renderar emoji + text + dismiss. Designs bygg-beat har en
 *    etikett-rad ("🏟️ Bygget") OCH en pil ›-affordans som NAVIGERAR till /game/bygget.
 *    → Code: antingen utöka PortalBeat med valfri `route?: string` + `kicker?: string`
 *      (etikett), eller rendera bygg-beats via en egen liten variant. Klick på beatet
 *      (eller pilen) → navigate(beat.route). Dismiss-beteendet behålls.
 *
 * Tills båda finns: texterna nedan är färdiga men INTE wirade. Detta är medvetet —
 * hellre flaggad lucka än falskt grönt. Beatet hör till B1-navbygget, EFTER att
 * Code-navordern (CODE_UPPDRAG_B1_NAVIGERING) byggt Bygget-fliken (routen måste finnas
 * att navigera till).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { SaveGame } from '../entities/SaveGame'
import { FACILITY_NODE_DEFS } from './facilityNodes'

export interface FacilityBeat {
  id: string
  /** Etikett-raden ("Bygget") — Design §04. Emoji hör till etiketten, ej textraden. */
  kicker: string
  emoji: string
  /** EN mening. Klubbliv, ingen data. */
  text: string
  /** Route beatet pekar in i (Bygget-fliken). */
  route: string
  /**
   * Returnerar texten anpassad till vilken nod det gäller, eller null om beatet
   * inte ska visas. Tar nodeId så meningen kan namnge bygget konkret.
   * NOTE: triggern (när detta körs) hör till Code-wiringen — se filhuvudet.
   */
  resolve: (game: SaveGame, nodeId: string) => string | null
}

function nodeLabel(nodeId: string): string | null {
  return FACILITY_NODE_DEFS.find(d => d.id === nodeId)?.label ?? null
}

/**
 * Ton-poolen. EN färdig mening per state-change-typ, plus nodspecifika varianter
 * där en konkret nod gör meningen bättre. Designs ton-exempel som referens:
 * "Akademin har sin första junior redo ›" · "Förankringen för hallen tog ett steg ›"
 * · "Värmestugan står klar — folk stannar kvar efter matchen ›".
 */

/** En nod stod klar denna omgång. Den tyngsta knuffen — något FINNS nu som inte fanns. */
export const FACILITY_COMPLETED_BEATS: Record<string, string> = {
  // Nodspecifika — meningen bär nodens roll i klubblivet, inte dess bonus.
  varmestuga:    'Värmestugan står klar. Folk stannar kvar i kylan nu, pratar färdigt.',
  laktare_ostra: 'Östra läktaren är rest. Fyrahundra platser till — och de syns från bron.',
  belysning:     'Strålkastarna lyser över träningsplanen. Ungdomarna kan vara kvar efter mörkrets inbrott.',
  kiosk:         'Kiosken är öppen. Kaffe och korv i pausen — små pengar som blir stora över en säsong.',
  stralkastare:  'Strålkastarna är på plats. Kvällsmatcherna ser ut som matcher nu.',
  gym:           'Gymmet står färdigt. Spelarna kan bygga styrka även när isen ligger.',
  traningshall:  'Träningshallen är klar. Ungdomarna håller sig inomhus hela vintern nu.',
  akademi_2:     'Akademin har tagit ett steg. Det finns ett program för de unga nu, inte bara en plan.',
  akademi_3:     'Elitakademin är på plats. Orten kan ge egna spelare — på riktigt den här gången.',
  matchhall:     'Hallen står klar. Inget blir sig likt — men isen ligger året om nu.',
}

/** Fallback om en nod saknar egen mening (ny nod tillagd utan beat-text). */
export const FACILITY_COMPLETED_FALLBACK = (label: string): string =>
  `${label} står klar. Ett bygge till bakom oss.`

/**
 * En nod blev MÖJLIG denna omgång (beroenden uppfyllda, inget aktivt bygge).
 * Lättare knuff än "klar" — en öppning, inte en händelse. Generell ton, ej nodspecifik,
 * för att inte bli en feature-prompt ("bygg det här nu!"). Bara: vägen ligger öppen.
 */
export const FACILITY_AVAILABLE_BEAT =
  'Det finns något nytt att bygga om man vill. Klubben har råd att tänka framåt.'

/**
 * Hallen-prövningen tog ett steg (förankring → krav → kommun → bygge).
 * VÄNTAR OPUS MEKANIK-LÅSNING (06-11 §5) — processtegen finns inte ännu. Texterna
 * nedan är placeringshållare i rätt ton, färdigställs när stegen är specade.
 */
export const HALL_PROCESS_BEATS: Record<string, string> = {
  forankring:  'Snacket om hallen har börjat på allvar. Birger har en åsikt, så klart.',
  krav:        'Förbundet har sagt sitt om hallen. Det ligger ett papper på bordet nu.',
  kommun:      'Kommunen har tagit i frågan om hallen. Inget löfte — men en dörr på glänt.',
}

/**
 * Bygger det aktiva bygg-beatet. Anropas av Code-wiringen NÄR triggervillkoret är
 * uppfyllt (se filhuvudet — kräver lastCompleted-fältet). Returnerar färdig FacilityBeat
 * eller null.
 */
export function buildFacilityCompletedBeat(_game: SaveGame, nodeId: string): FacilityBeat | null {
  const label = nodeLabel(nodeId)
  if (!label) return null
  const text = FACILITY_COMPLETED_BEATS[nodeId] ?? FACILITY_COMPLETED_FALLBACK(label)
  return {
    id: `facility_completed_${nodeId}`,
    kicker: 'Bygget',
    emoji: '🏟️',  // platshållare — hör till emoji→Lucide-svepet (separat tråd)
    text,
    route: '/game/bygget',
    resolve: () => text,
  }
}
