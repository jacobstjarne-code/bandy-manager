import type { MomentSource } from '../entities/Moment'

/**
 * MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01.md Fas 4, Skärpning 3 (Opus
 * dom) — liggarens text-axiom håller: ingen prosa lagras i EventLedgerEntry.
 * ClubMemoryView renderar en liggarpost genom en av mallarna nedan i stället
 * för att läsa Moment.title/body direkt.
 *
 * Code bygger uppslagningen + interpolationen (subjectName/subject2Name
 * slagna upp ur id via momentLedgerService.resolveSubjectName). Opus fyller
 * de svenska mallsträngarna — Code skriver aldrig svensk text, se
 * CLAUDE.md. Platshållaren nedan är `'[Opus]'`, aldrig en hel mening.
 *
 * JACOBS TEXTURKALL (Skärpning 3, 2026-09-01): star_injury tappar den
 * exakta skadedagssiffran i mallen ("borta resten av säsongen" e.dyl.) —
 * inget skalär-fält lades till i schemat för den.
 */
export interface MomentViewContext {
  subjectName?: string
  subject2Name?: string
  matchday: number
  season: number
  significance: number
}

export interface MomentViewText {
  title: string
  body: string
}

type MomentTemplate = (ctx: MomentViewContext) => MomentViewText

export const MOMENT_VIEW_TEMPLATES: Record<MomentSource, MomentTemplate> = {
  derby_win: (ctx) => ({
    title: `Derbyt mot ${ctx.subjectName ?? 'rivalen'} sitter kvar`,
    body: 'Klacken sjöng hela vägen till bilen, och ett par sponsorer hörde av sig dagen efter. Sånt glöms inte i första taget.',
  }),
  star_injury: (ctx) => ({
    title: `${ctx.subjectName ?? 'En nyckelspelare'} är borta`,
    body: 'Sidan han spelade på blir tunnare, och klacken vet det. Borta ett bra tag framöver.',
  }),
  mecenat_costshare: (ctx) => ({
    title: 'En mecenat sköt till',
    body: `Affären med ${ctx.subjectName ?? 'spelaren'} blev billigare — en mecenat tog en del av notan. Pengar tillbaka i kassan.`,
  }),
  captain_crisis: (ctx) => ({
    title: `${ctx.subjectName ?? 'Kaptenen'} bar det tungt`,
    body: 'Det syntes på honom, och det spred sig i omklädningsrummet. Sånt tar sin tid att vända.',
  }),
  nemesis_signed: (ctx) => ({
    title: `${ctx.subjectName ?? 'Han'} — i rätt färger nu`,
    body: `${ctx.subjectName ?? 'Han'} sköt mål MOT oss förr. Nu bär han våra.`,
  }),
  sponsor_positive: (ctx) => ({
    title: 'Sponsorn är nöjd',
    body: `Huvudsponsorn gillade värvningen av ${ctx.subjectName ?? 'spelaren'}. Det håller relationen varm inför nästa förhandling.`,
  }),
  sponsor_negative: (ctx) => ({
    title: 'Sponsorn är orolig',
    body: `Sponsornätverket blev oroligt efter att ${ctx.subjectName ?? 'en nyckelspelare'} såldes. Det ligger kvar när nästa avtal ska skrivas.`,
  }),
  transfer_story: (ctx) => ({
    title: `${ctx.subjectName ?? 'En spelare'} bytte klubb`,
    body: `${ctx.subjectName ?? 'Spelaren'} gick till ${ctx.subject2Name ?? 'en annan klubb'}. Sånt sätter spår, på plan och på läktaren.`,
  }),
  season_highlight: () => ({
    title: 'Säsongens ögonblick',
    body: 'En av de kvällar orten kommer att minnas. Inte för tabellen — för känslan på läktaren.',
  }),
  era_shift: () => ({
    title: 'En ny tid',
    body: 'Något har förändrats i hur orten ser på laget. Det märks på läktaren, i tonen, i tystnaden efter en förlust.',
  }),
  rival_sale: (ctx) => ({
    title: `${ctx.subjectName ?? 'En spelare'} till ${ctx.subject2Name ?? 'rivalen'}`,
    body: `${ctx.subjectName ?? 'Han'} bytte tröja mot ${ctx.subject2Name ?? 'rivalen'}. Klacken förlåter inte den sortens affär i första taget.`,
  }),
}
