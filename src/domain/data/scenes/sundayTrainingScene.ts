/**
 * Söndagsträningen — scen vid säsongsstart, första omgången.
 * Sex spelare på isen i frivillig morgonpass. Tonsättningen för
 * spelarens första kontakt med truppen.
 *
 * All svensk text lever här. Inget hårdkodas i komponenten.
 */

export interface SundayTrainingPlayer {
  initial: string
  name: string
  /** Innehåller HTML — em för citat, strong för betoning. */
  text: string
}

export interface SundayTrainingChoice {
  id: string
  label: string
  effectDescription?: string
}

export const SUNDAY_TRAINING_PLAYERS: SundayTrainingPlayer[] = [
  {
    initial: 'H',
    name: 'Henriksson',
    text: 'skrinnar varv. <em>"Han kommer alltid först,"</em> säger Vaktmästaren. <em>"Han började åtta i morse."</em>',
  },
  {
    initial: 'L',
    name: 'Lindberg',
    text: 'står på läktaren och pratar i telefonen. <em>Han har inte ens skridskorna på.</em>',
  },
  {
    initial: 'A',
    name: 'Andersson, Eriksson, Karlsson',
    text: 'skjuter på mål utan målvakt. <em>De skrattar varje gång någon träffar stolpen.</em>',
  },
  {
    initial: 'B',
    name: 'Bergström',
    text: 'sitter på avbytarbänken. Fryser. <em>Mössan ner över ögonen.</em>',
  },
]

export const SUNDAY_TRAINING_CHOICES: SundayTrainingChoice[] = [
  {
    id: 'greet_henriksson',
    label: 'Gå ut och säg hej till Henriksson',
    effectDescription: 'Bygger relation till en lojal spelare',
  },
  {
    id: 'disturb_lindberg',
    label: 'Stör Lindberg',
    effectDescription: 'Sätter ton — men på vilket sätt?',
  },
  {
    id: 'ask_bergstrom',
    label: 'Fråga Bergström varför han sitter där',
    effectDescription: 'Lyssna in',
  },
  {
    id: 'leave_alone',
    label: 'Lämna dem i fred. Kaffe i klubbhuset.',
    effectDescription: 'Ingen tar ton första dagen',
  },
]

export const SUNDAY_TRAINING_META = {
  title: 'Söndagsträningen',
  // {arena} ersätts med klubbens arenaName vid render
  date: '4 oktober · −2°C · {arena}',
  headline: 'Sex spelare på isen.',
  subtitle: 'Ingen tvingad. Frivillig morgonpass.',
}
