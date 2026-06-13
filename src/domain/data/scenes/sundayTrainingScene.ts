/**
 * Söndagsträningen — scen vid säsongsstart, första omgången.
 * Sex spelare på isen i frivillig morgonpass. Tonsättningen för
 * spelarens första kontakt med truppen.
 *
 * All svensk text lever här. Inget hårdkodas i komponenten.
 * Namen är tokens — {earliest}/{phone}/{cold} — löses ut i ScenComponent.
 */

export type SundayTrainingCastKey = 'earliest' | 'phone' | 'cold' | 'group'

export interface SundayTrainingPlayer {
  castKey: SundayTrainingCastKey
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
    castKey: 'earliest',
    initial: '{earliest}',
    name: '{earliest}',
    text: 'skrinnar varv. <em>"Den där kommer alltid först,"</em> säger Vaktmästaren. <em>"Var på isen åtta i morse."</em>',
  },
  {
    castKey: 'phone',
    initial: '{phone}',
    name: '{phone}',
    text: 'står på läktaren och pratar i telefon. <em>Skridskorna är inte ens på.</em>',
  },
  {
    castKey: 'group',
    initial: 'A',
    name: 'Andersson, Eriksson, Karlsson',
    text: 'skjuter på mål utan målvakt. <em>De skrattar varje gång någon träffar stolpen.</em>',
  },
  {
    castKey: 'cold',
    initial: '{cold}',
    name: '{cold}',
    text: 'sitter på avbytarbänken. Fryser. <em>Mössan ner över ögonen.</em>',
  },
]

export const SUNDAY_TRAINING_CHOICES: SundayTrainingChoice[] = [
  {
    id: 'greet_{earliest}',
    label: 'Gå ut och säg hej till {earliest}',
    effectDescription: 'Bygger relation till en lojal spelare',
  },
  {
    id: 'disturb_{phone}',
    label: 'Stör {phone}',
    effectDescription: 'Sätter ton — men på vilket sätt?',
  },
  {
    id: 'ask_{cold}',
    label: 'Fråga {cold} varför',
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
  subtitle: 'Ingen tvingad. Frivilligt morgonpass.',
}
