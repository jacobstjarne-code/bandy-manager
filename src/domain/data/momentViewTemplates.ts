import type { MomentSource, TransferRole } from '../entities/Moment'
import type { ClubEra } from '../entities/SaveGame'
import type { MatchHighlightCategory } from '../entities/SeasonSummary'

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
  // Skärpning 4 (2026-09-02, Opus dom): era_shift/transfer_story/
  // season_highlight branchar på ETT av dessa (typen avgör vilket) — se
  // Narrative.ts/Moment.ts. Undefined för alla andra källor.
  eraLabel?: ClubEra
  transferRole?: TransferRole
  matchCategory?: MatchHighlightCategory
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
  transfer_story: (ctx) => {
    const to = ctx.subject2Name ?? 'en annan klubb'
    const who = ctx.subjectName ?? 'Han'
    switch (ctx.transferRole) {
      case 'kapten':
        return { title: 'Kaptenen lämnar', body: `${who} tar bindeln av sig och går till ${to}. Sånt känns i hela omklädningsrummet.` }
      case 'klackfavorit':
        return { title: 'Klackens favorit går', body: `${who} var den läktaren sjöng om. Nu bär han ${to}s tröja. Det tar tid att förlåta.` }
      case 'legend':
        return { title: 'En legend lämnar', body: `${who} gav klubben år som inte glöms. Att se honom gå till ${to} gör ont, hur rätt affären än var.` }
      case 'akademiprodukt':
        return { title: 'Egenfostrad såld', body: `${who} kom upp genom den egna akademin. Nu bär ${to} frukten av det arbetet.` }
      default:
        return { title: `${ctx.subjectName ?? 'En spelare'} lämnar`, body: `${who} gick till ${to}. Sånt sätter spår, på plan och på läktaren.` }
    }
  },
  season_highlight: (ctx) => {
    switch (ctx.matchCategory) {
      case 'late_winner':
        return { title: 'Avgjort i slutsekunderna', body: 'Den där kvällen andades hela arenan ut samtidigt. Ett mål när alla trodde det var kört.' }
      case 'derby_win':
        return { title: 'Derbyt som blev säsongen', body: 'Att slå rivalen är en sak. Att göra det när det betydde som mest — det pratas om länge.' }
      case 'cup_drama':
        return { title: 'Cupkvällen', body: 'Cupen ger de där matcherna man inte kan förklara efteråt. Den här var en sådan.' }
      case 'playoff_decisive':
        return { title: 'Slutspelet avgjordes här', body: 'En kväll bar hela säsongen. Laget bar den.' }
      case 'big_win':
        return { title: 'Kvällen målen rann in', body: 'Ibland stämmer allt. Läktaren räknade högt, och ingen ville gå hem.' }
      case 'comeback':
        return { title: 'Vändningen', body: 'Underläge, och sen inte. Den sortens kväll får en att tro på laget igen.' }
      case 'underdog_upset':
        return { title: 'Ingen trodde på oss', body: 'Favoriten kom, favoriten föll. Orten bar det i bröstet resten av säsongen.' }
      default:
        return { title: 'Säsongens ögonblick', body: 'En av de kvällar orten kommer att minnas. Inte för tabellen — för känslan på läktaren.' }
    }
  },
  era_shift: (ctx) => {
    switch (ctx.eraLabel) {
      case 'establishment':
        return { title: 'Klubben reser sig', body: 'Något har förändrats i hur orten ser på laget. Fler på läktaren, högre i tonen. Det här börjar likna något.' }
      case 'legacy':
        return { title: 'Mer än bandy nu', body: 'Det är inte längre bara ett lag. Det är ortens identitet, och den bärs vidare av dem som minns.' }
      case 'survival':
        return { title: 'Tunga tider', body: 'Det knakar i fogarna. Men det är nu det gäller — och orten vet vilka som stannar när det blåser.' }
      default:
        return { title: 'En ny tid', body: 'Något har förändrats i hur orten ser på laget. Det märks på läktaren, i tonen.' }
    }
  },
  rival_sale: (ctx) => ({
    title: `${ctx.subjectName ?? 'En spelare'} till ${ctx.subject2Name ?? 'rivalen'}`,
    body: `${ctx.subjectName ?? 'Han'} bytte tröja mot ${ctx.subject2Name ?? 'rivalen'}. Klacken förlåter inte den sortens affär i första taget.`,
  }),
}

/**
 * liggare-k3-vymallar-tysta (TEXT LÅST, Opus 2026-09-03,
 * RAPPORT_LIGGARE_KONSUMENTKARTA_2026-09-03.md §10). Fem EventLedgerType-
 * medlemmar som fryses (steg 1) men aldrig talas (steg 3) — se
 * clubMemoryService.ts's LEDGER_CLUB_MEMORY_TYPES/buildMemoryEventFromLedger
 * för konsumenten. Egen tabell, inte en utvidgning av MOMENT_VIEW_TEMPLATES:
 * dessa fem går aldrig genom Moment.ts's dual-write-pipeline (ingen
 * MOMENT_LEDGER_SIGNIFICANCE-post), så MomentSource ska inte breddas för
 * dem. Samma form (title/body, {Namn}/{Efternamn} via resolveSubjectName),
 * samma regel: kopierat ordagrant, aldrig omskrivet.
 */
// liggare-k9-doda-typer (TEXT LÅST, Opus 2026-09-04): transfer_signed/
// transfer_sold — producenter byggda (transferProcessor.ts), mallarna kom
// senare samma dag. {Motpart} = resolveSubjectName(subject2), fallback när
// subject2 saknas.
export type LedgerOnlySource = 'referee_feud' | 'referee_trust' | 'mecenat_withdrawal' | 'patron_emerge' | 'patron_withdrawal' | 'transfer_signed' | 'transfer_sold'

export const LEDGER_ONLY_VIEW_TEMPLATES: Record<LedgerOnlySource, MomentTemplate> = {
  referee_feud: (ctx) => ({
    title: `Fejd med ${ctx.subjectName ?? 'domaren'}`,
    body: 'Vi har protesterat en gång för mycket, och han har märkt det. Från och med nu tolkas varje tveksam situation åt fel håll — i huvudet på båda.',
  }),
  referee_trust: (ctx) => ({
    title: `${ctx.subjectName ?? 'Domaren'} och vi förstår varandra`,
    body: 'Ett par matcher med respekt i stället för protester. Han hör bänken utan att bli irriterad, och det märks i tveksamma lägen. Sånt är värt mer än ett frislag.',
  }),
  mecenat_withdrawal: (ctx) => ({
    title: `${ctx.subjectName ?? 'Mecenaten'} lämnade`,
    body: 'Pengarna var en sak. Att ha någon som ställde upp när det knakade var en annan. Kassan märker det direkt; orten om ett tag.',
  }),
  patron_emerge: (ctx) => ({
    title: `${ctx.subjectName ?? 'Någon'} kliver fram`,
    body: 'Ingen presskonferens, ingen skylt på arenan. Bara någon som bestämt sig för att klubben ska finnas kvar, och har råd att mena det.',
  }),
  patron_withdrawal: (ctx) => ({
    title: `${ctx.subjectName ?? 'Grundpelaren'} drar sig tillbaka`,
    body: 'Grundpelaren finns inte längre. Det syns inte på läktaren första veckan. Sen syns det överallt.',
  }),
  transfer_signed: (ctx) => ({
    title: `${ctx.subjectName ?? 'Spelaren'} skrev på`,
    body: ctx.subject2Name
      ? `Från ${ctx.subject2Name}. Ett namn på ett papper i klubbstugan och en förväntan som ännu inte kostat något. Det kommer den att göra, åt ena eller andra hållet.`
      : 'Ett namn på ett papper i klubbstugan och en förväntan som ännu inte kostat något. Det kommer den att göra, åt ena eller andra hållet.',
  }),
  transfer_sold: (ctx) => ({
    title: `${ctx.subjectName ?? 'Spelaren'} såld`,
    body: ctx.subject2Name
      ? `Till ${ctx.subject2Name}. Pengarna räknades på en gång. Det som saknas räknas i mars.`
      : 'Pengarna räknades på en gång. Det som saknas räknas i mars.',
  }),
}
