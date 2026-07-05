/**
 * Söndagsträningen — scen vid säsongsstart, första omgången.
 * Sex spelare på isen i frivillig morgonpass. Tonsättningen för
 * spelarens första kontakt med truppen.
 *
 * All svensk text lever här. Inget hårdkodas i komponenten.
 * Namen är tokens — {earliest}/{phone}/{cold}/{group3} — löses ut i ScenComponent.
 * META.date-tokens {date}/{temp}/{arena} löses ut mot klubbens faktiska
 * första matchdag + regionala oktobersnitt (M64, textaudit 2026-07-04).
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
    initial: '{group3}',
    name: '{group3}',
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
  // {date}/{temp} ersätts med klubbens faktiska matchday-1-datum och
  // regionala oktobersnitt, {arena} med klubbens arenaName — allt vid render.
  date: '{date} · {temp} · {arena}',
  headline: 'Sex spelare på isen.',
  subtitle: 'Ingen tvingad. Frivilligt morgonpass.',
}
