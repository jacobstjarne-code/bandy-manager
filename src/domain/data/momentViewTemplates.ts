import type { MomentSource, TransferRole } from '../entities/Moment'
import type { EventLedgerEntry } from '../entities/Narrative'
import type { ClubEra } from '../entities/SaveGame'
import type { MatchHighlightCategory } from '../entities/SeasonSummary'
import { swedishGenitive } from './matchCommentary'

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
  /**
   * BETATEST_TEXTDOM C4.1–C4.3: hur många poster av samma typ som föregår
   * den här i karriärens liggare (0 = första). Mallar med poolvarianter
   * väljer på detta, så två värvningar under samma karriär aldrig får samma
   * ordagranna eko. Saknas → första varianten (äldre anropare, tester).
   */
  occurrence?: number
}

/**
 * Räknar föregående liggarposter av samma typ. Liggaren är append-only och
 * därmed kronologisk; posten identifieras på semanticKey + säsong + matchdag
 * (samma nyckel kan återkomma en senare säsong, t.ex. en ny domarfejd).
 */
export function ledgerOccurrenceIndex(
  ledger: readonly EventLedgerEntry[] | undefined,
  entry: EventLedgerEntry,
): number {
  let count = 0
  for (const candidate of ledger ?? []) {
    if (candidate === entry || (
      candidate.semanticKey === entry.semanticKey &&
      candidate.season === entry.season &&
      candidate.matchday === entry.matchday &&
      candidate.type === entry.type
    )) return count
    if (candidate.type === entry.type) count++
  }
  return count
}

function variant(pool: readonly string[], occurrence: number | undefined): string {
  const index = Math.max(0, occurrence ?? 0)
  return pool[index % pool.length]
}

const REFEREE_FEUD_BODIES = [
  'Vi har protesterat en gång för mycket, och han har märkt det. Från och med nu tolkas varje tveksam situation åt fel håll, i huvudet på båda.',
  'Det har blivit för många protester mot honom. Nu hörs varje ord från bänken, och han glömmer inget av dem.',
  'Han hälsar inte längre på bänken före avslag. Tveksamma lägen går åt andra hållet, och läktaren har börjat märka det.',
] as const

const REFEREE_TRUST_BODIES = [
  'Ett par matcher med respekt i stället för protester. Han hör bänken utan att bli irriterad, och det märks i tveksamma lägen. Sånt är värt mer än ett frislag.',
  'Inga protester på länge, och han har märkt det. Bänken får en förklaring när den frågar.',
  'Han nickar mot bänken före avslag nu. Det avgör ingen match, men ibland en tveksam situation.',
] as const

const MECENAT_WITHDRAWAL_BODIES = [
  'Pengarna var en sak. Att ha någon som ställde upp när det knakade var en annan. Kassan märker det direkt; orten om ett tag.',
  'Ett samtal till ordföranden, sen var det klart. Kassören satt kvar länge med budgeten den kvällen.',
  'Platsen längst upp på läktaren står tom nu. Någon annan får ringa runt nästa gång det knakar.',
] as const

const PATRON_EMERGE_BODIES = [
  'Ingen presskonferens, ingen skylt på arenan. Bara någon som bestämt sig för att klubben ska finnas kvar, och har råd att mena det.',
  'Det började med en fråga till kassören om vad en säsong kostar. Svaret skrämde inte.',
  'Någon på orten har bestämt sig för att klubben ska klara vintern. Det syns inte i tabellen. Det syns i kassaboken.',
] as const

const PATRON_WITHDRAWAL_BODIES = [
  'Grundpelaren finns inte längre. Det syns inte på läktaren första veckan. Sen syns det överallt.',
  'Beskedet kom i ett brev till styrelsen. Ingen läste upp det högt på mötet.',
  'Den som alltid fanns där när budgeten inte gick ihop finns inte där längre. Nästa gång får klubben lösa det själv.',
] as const

const TRANSFER_SIGNED_BODIES = [
  'Ett namn på ett papper i klubbstugan. Om det var rätt namn vet vi först framåt vårkanten.',
  'Tröjan hängde i skåpet innan bläcket torkat. Resten får han visa på isen.',
  'Vaktmästaren fick sätta en ny namnlapp på skåpet. Läktaren lär sig namnet fort om han gör mål.',
  'En handskakning i klubbstugan, en tröja ur förrådet. Första träningen säger mer än kontraktet.',
  'Kontraktet är påskrivet. Om han passar in avgörs i omklädningsrummet.',
] as const

const TRANSFER_SOLD_BODIES = [
  'Pengarna räknades på en gång. Det som saknas räknas i mars.',
  'Skåpet står tomt till nästa träning. Kassan fick sitt, laget får klara sig utan.',
  'Han tömde skåpet på en eftermiddag. Pengarna syns i kassan redan i veckan.',
  'Affären gick fort. Luckan efter honom syns först när någon annan ska göra hans jobb.',
] as const

export interface MomentViewText {
  title: string
  body: string
}

type MomentTemplate = (ctx: MomentViewContext) => MomentViewText

const MOMENT_VIEW_TEMPLATES: Record<MomentSource, MomentTemplate> = {
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
        return { title: 'Klackens favorit går', body: `${who} var den läktaren sjöng om. Nu bär han ${swedishGenitive(to)} tröja. Det tar tid att förlåta.` }
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
        return { title: 'Säsongens ögonblick', body: 'Läktaren stod kvar efter slutsignalen. Den kvällen pratas det om i kafferummet länge.' }
    }
  },
  era_shift: (ctx) => {
    switch (ctx.eraLabel) {
      case 'establishment':
        return { title: 'Klubben reser sig', body: 'Något har förändrats i hur orten ser på laget. Fler på läktaren, högre i tonen. Det här börjar likna något.' }
      case 'legacy':
        return { title: 'Mer än bandy nu', body: 'Laget har blivit något orten pratar om som sitt eget. Folk som aldrig gått på bandy vet vem som står i mål.' }
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
 * docs/rapport/RAPPORT_LIGGARE_KONSUMENTKARTA_2026-09-03.md §10). Fem EventLedgerType-
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

const LEDGER_ONLY_VIEW_TEMPLATES: Record<LedgerOnlySource, MomentTemplate> = {
  referee_feud: (ctx) => ({
    title: `Fejd med ${ctx.subjectName ?? 'domaren'}`,
    body: variant(REFEREE_FEUD_BODIES, ctx.occurrence),
  }),
  referee_trust: (ctx) => ({
    title: `${ctx.subjectName ?? 'Domaren'} och vi förstår varandra`,
    body: variant(REFEREE_TRUST_BODIES, ctx.occurrence),
  }),
  mecenat_withdrawal: (ctx) => ({
    title: `${ctx.subjectName ?? 'Mecenaten'} lämnade`,
    body: variant(MECENAT_WITHDRAWAL_BODIES, ctx.occurrence),
  }),
  patron_emerge: (ctx) => ({
    title: `${ctx.subjectName ?? 'Någon'} kliver fram`,
    body: variant(PATRON_EMERGE_BODIES, ctx.occurrence),
  }),
  patron_withdrawal: (ctx) => ({
    title: `${ctx.subjectName ?? 'Grundpelaren'} drar sig tillbaka`,
    body: variant(PATRON_WITHDRAWAL_BODIES, ctx.occurrence),
  }),
  transfer_signed: (ctx) => ({
    title: `${ctx.subjectName ?? 'Spelaren'} skrev på`,
    body: ctx.subject2Name
      ? `Från ${ctx.subject2Name}. ${variant(TRANSFER_SIGNED_BODIES, ctx.occurrence)}`
      : variant(TRANSFER_SIGNED_BODIES, ctx.occurrence),
  }),
  transfer_sold: (ctx) => ({
    title: `${ctx.subjectName ?? 'Spelaren'} såld`,
    body: ctx.subject2Name
      ? `Till ${ctx.subject2Name}. ${variant(TRANSFER_SOLD_BODIES, ctx.occurrence)}`
      : variant(TRANSFER_SOLD_BODIES, ctx.occurrence),
  }),
}

export type MomentViewTemplateSource = MomentSource | LedgerOnlySource

type LedgerSubjectKind = NonNullable<EventLedgerEntry['subject']>['kind']

/**
 * `sluttest-missing-check-grind` (Opus-dom 2026-09-07): en textmall som
 * påstår att något hände måste deklarera vilken state-källa som bevisar
 * påståendet. Liggarmallarnas första kontrakt är medvetet litet och strikt:
 * rätt EventLedgerType måste finnas, och mallar som påstår något om en viss
 * sorts subjekt kan dessutom kräva den subjektstypen.
 *
 * Det här är inte `gameBefore !== gameAfter`: en orelaterad mutation kan
 * aldrig uppfylla kontraktet. En mall utan post, med fel posttyp eller utan
 * sitt deklarerade subjekt renderas inte — hellre ingen mening än en falsk.
 */
export interface MomentViewClaimContract {
  provenBy: {
    source: 'eventLedger'
    ledgerType: MomentViewTemplateSource
    subjectKind?: LedgerSubjectKind
    subject2Kind?: NonNullable<EventLedgerEntry['subject2']>['kind']
  }
}

export const MOMENT_VIEW_CLAIM_CONTRACTS: {
  [Source in MomentViewTemplateSource]: MomentViewClaimContract & {
    provenBy: MomentViewClaimContract['provenBy'] & { ledgerType: Source }
  }
} = {
  derby_win: { provenBy: { source: 'eventLedger', ledgerType: 'derby_win' } },
  star_injury: { provenBy: { source: 'eventLedger', ledgerType: 'star_injury' } },
  mecenat_costshare: { provenBy: { source: 'eventLedger', ledgerType: 'mecenat_costshare' } },
  captain_crisis: { provenBy: { source: 'eventLedger', ledgerType: 'captain_crisis' } },
  nemesis_signed: { provenBy: { source: 'eventLedger', ledgerType: 'nemesis_signed' } },
  // Samma MomentSource används också av generella sponsor-/kommunhändelser.
  // Mallen påstår däremot uttryckligen att en SPELARE värvades. Subjektkravet
  // gör att de bredare händelserna inte kan återberättas som en falsk värvning.
  sponsor_positive: {
    provenBy: { source: 'eventLedger', ledgerType: 'sponsor_positive', subjectKind: 'player' },
  },
  sponsor_negative: {
    provenBy: { source: 'eventLedger', ledgerType: 'sponsor_negative', subjectKind: 'player' },
  },
  transfer_story: { provenBy: { source: 'eventLedger', ledgerType: 'transfer_story' } },
  season_highlight: { provenBy: { source: 'eventLedger', ledgerType: 'season_highlight' } },
  era_shift: { provenBy: { source: 'eventLedger', ledgerType: 'era_shift' } },
  rival_sale: { provenBy: { source: 'eventLedger', ledgerType: 'rival_sale' } },
  referee_feud: { provenBy: { source: 'eventLedger', ledgerType: 'referee_feud' } },
  referee_trust: { provenBy: { source: 'eventLedger', ledgerType: 'referee_trust' } },
  mecenat_withdrawal: { provenBy: { source: 'eventLedger', ledgerType: 'mecenat_withdrawal' } },
  patron_emerge: { provenBy: { source: 'eventLedger', ledgerType: 'patron_emerge' } },
  patron_withdrawal: { provenBy: { source: 'eventLedger', ledgerType: 'patron_withdrawal' } },
  transfer_signed: { provenBy: { source: 'eventLedger', ledgerType: 'transfer_signed' } },
  transfer_sold: { provenBy: { source: 'eventLedger', ledgerType: 'transfer_sold' } },
}

export function hasMomentViewClaimContract(type: string): type is MomentViewTemplateSource {
  return type in MOMENT_VIEW_CLAIM_CONTRACTS
}

export function isMomentViewClaimProven(entry: EventLedgerEntry): boolean {
  if (!hasMomentViewClaimContract(entry.type)) return false
  const proof = MOMENT_VIEW_CLAIM_CONTRACTS[entry.type].provenBy
  return proof.source === 'eventLedger'
    && entry.type === proof.ledgerType
    && (!proof.subjectKind || entry.subject?.kind === proof.subjectKind)
    && (!proof.subject2Kind || entry.subject2?.kind === proof.subject2Kind)
}

/** Enda publika renderingsvägen för de liggarbaserade mallarna. */
export function renderMomentViewFromLedger(
  entry: EventLedgerEntry,
  ctx: MomentViewContext,
): MomentViewText | null {
  if (!isMomentViewClaimProven(entry)) return null

  const template = entry.type in MOMENT_VIEW_TEMPLATES
    ? MOMENT_VIEW_TEMPLATES[entry.type as MomentSource]
    : LEDGER_ONLY_VIEW_TEMPLATES[entry.type as LedgerOnlySource]
  return template(ctx)
}
