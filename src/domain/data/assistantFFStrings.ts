import type { AssistantCoach } from '../entities/AssistantCoach'
import { fillTemplate } from './matchCommentary'

// Röstrader för assistentens val under snabbspolning (corner/counter/frislag).
// Opus levererar — se CLAUDE.md "SVENSK TEXT — CODE SKRIVER ALDRIG".
// Nästlad struktur: rad väljs på FAKTISKT val (zon/choice), ingen råenum-interpolation.
// Code väljer array via seededPick(ASSISTANT_FF_LINES[typ][val], seed). Tom array
// får aldrig förekomma — varje val har rader.
//
// Rösten: assistenten RAPPORTERAR ett fattat beslut, kort, torrt, bandysvenskt.
// Ingen hurra, ingen förklaring av oddsen — han tog det, du ser utfallet härnäst.

export const ASSISTANT_FF_LINES = {
  corner: {
    near: [
      '{coach} vinkade in den kort. Nära stolpen.',
      'Kort hörna vid närmaste. {coach}s beslut.',
      '{coach} tog den nära och trängde ihop det vid första stolpen.',
    ],
    center: [
      'En perfekt passning mot mitten. Skytten stod klar.',
      'Rakt ut till linjen. {coach} litade på skytten.',
      '{coach} la den mot mitten. Direktskott eller inget.',
    ],
    far: [
      '{coach} sökte bortre stolpen.',
      'Långt ut mot bortre. {coach}s val.',
      '{coach} la den på bortre och sökte den fria mannen där ute.',
    ],
  },
  counter: {
    sprint: [
      '{coach} släppte iväg honom. Bara att åka.',
      'Full fart framåt. {coach} släppte loss honom.',
      '{coach} sa åt dem att dra. Rakt på mål.',
    ],
    build: [
      '{coach} höll igen och byggde upp den lugnt.',
      'Ingen brådska. {coach} ville ha ordning först.',
      '{coach} bromsade kontringen och sökte rätt läge i stället.',
    ],
    earlyBall: [
      '{coach} ville ha den tidigt, innan de hann hem.',
      'Tidig boll framåt. {coach} läste luckan.',
      'Direkt bakom deras försvar. {coach}s idé.',
    ],
  },
  freekick: {
    shoot: [
      '{coach} vinkade fram skytten. Direkt mot mål.',
      'Skott. {coach} litade på klubban.',
      'Rakt på, inget krångel. {coach}s val.',
    ],
    chipPass: [
      '{coach} ville ha den över muren.',
      'Boll bakom muren. {coach} sökte en klubba där inne.',
      'Mjukt lyft. {coach} sökte någon på bortre.',
    ],
    layOff: [
      '{coach} ville ha den kort för att bygga vidare.',
      'Kort variant. {coach} ville ha ett bättre läge.',
      'I sidled för en ny vinkel mot mål. {coach}s beslut.',
    ],
  },
} as const

/**
 * BETATEST_TEXTDOM_2026-09-24 C6.1 — assistenten har ett namn i spelet
 * (game.assistantCoach) och ska heta det även när han väljer under
 * snabbspolning. {coach} står alltid först i sin mening, så reservordet
 * "Assistenten" (sparfiler utan assistent) blir grammatiskt i båda fallen.
 * Genitiven går via fillTemplate/swedishGenitive: Holmgrens, men Mattias.
 */
export function renderAssistantFFLine(line: string, coach?: AssistantCoach | null): string {
  const surname = coach?.name?.trim().split(/\s+/).pop()
  return fillTemplate(line, { coach: surname || 'Assistenten' })
}

export type AssistantFFInteraction = keyof typeof ASSISTANT_FF_LINES
