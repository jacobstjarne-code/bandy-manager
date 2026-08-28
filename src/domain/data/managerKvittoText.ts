// src/domain/data/managerKvittoText.ts
// C-SY1 #4 Efter-match-kvitto. Opus-text 2026-05-25.
//
// ManagerKvittoSection på MatchReportScreen: 2–4 rader som kopplar ett FAKTISKT
// managerval till ett observerbart utfall. Inte "spelet tycker du gjorde rätt" —
// bara "du valde X → Y hände". Tonen är torr och observationell, ingen värdering.
//
// Designval (Opus tog Designs föreslag 2026-05-25): bara rader med mätbart utfall
// (skippa val utan koppling); Opus-pool (ej LLM); max 4 rader.
//
// {spelare}/{n} interpoleras av Code. Code väljer good/bad/neutral utifrån faktiskt
// utfall och kan lägga datalinjen ("släppte in 1, gjorde 2") bredvid framingen.

export const HALFTIME_LABELS = {
  lugna: 'Lugna ner det.',
  pressa: 'Pressa hårdare.',
  prata: 'Prata individuellt.',
  hold: 'Håll i det.',
}

export type KvittoOutcomeDir = 'good' | 'bad' | 'neutral'

/** Halvtidsval → andra halvlek. */
export const HALFTIME_OUTCOMES: Record<'lugna' | 'pressa' | 'prata', Record<KvittoOutcomeDir, string[]>> = {
  lugna: {
    good: ['Tempot sjönk och ni kontrollerade resten.', 'Laget tog ner det och höll undan.'],
    bad: ['Det blev för passivt — de fick ta över.', 'Ni släppte initiativet och fick betala för det.'],
    neutral: ['Lugnare efter pausen, men ingen avgörande skillnad.'],
  },
  pressa: {
    good: ['Ni höjde tempot och de svarade inte.', 'Pressen gav utdelning efter pausen.'],
    bad: ['Pressen öppnade ytor bakåt — och de hittade dem.', 'Ni gick på för hårt och tappade balansen.'],
    neutral: ['Högre tempo, men det jämnade ut sig.'],
  },
  prata: {
    good: ['Det individuella snacket landade — rätt spelare vaknade.', 'Någon behövde höra det enskilt. Det syntes.'],
    bad: ['Budskapet nådde inte fram. Andra halvlek blev seg.', 'Det rörde inte vid det som behövde röras.'],
    neutral: ['Svårt att säga om samtalet gjorde skillnad.'],
  },
}

// H2-uppföljning (oberoende speltest- och produktaudit, 5c9a7a8, 2026-08-24),
// Jacobs text, låst. Två fasta rader, ingen good/bad/neutral-variation:
//
// PEP_TALK_HOLD — pauseLean='hold' (Spak A, live match, matchLiveText.ts).
// PAUSSNACK:s egen etikett för hold är "→ oförändrat" — ingen mätbar
// spelmässig effekt att variera texten på, så en enda rad är rätt, inte en
// pool. Fanns ingen kvittotext för hold förrän nu (H2-uppföljningen).
export const PEP_TALK_HOLD_KVITTO = 'Du sa åt dem att hålla i det. Inga nya instruktioner.'

// PRATA_KVITTO — ersätter HALFTIME_OUTCOMES.pratas tre good/bad/neutral-
// varianter ovan. Mekaniken (applyHalftimeDecision, gameFlowActions.ts) ger
// samma +12 moral-effekt oavsett andra halvlekens utfall — en utfalls-
// beroende kvittotext var därför aldrig sann för just detta valet. Jacobs
// rad förklarar VARFÖR effekten är lagbred trots att valet framställs som
// "individuellt": andra spelare hör av sig ändå — även om mekaniken inte
// modellerar den spridningen som en egen effekt (Jacobs egen formulering,
// 2026-08-24). HALFTIME_OUTCOMES.prata ovan är därmed superseterad för
// denna konsument (GranskaOversikt.tsx) men INTE raderad — den är fortsatt
// data om `entry.type==='halftime_tactic'` nånsin får en good/bad/neutral-
// läsare igen.
export const PRATA_KVITTO = 'Du tog några åt sidan. Resten fick höra det ändå.'

/**
 * Lineup-rotation (jämfört med förra matchen) → energi vs rytm.
 * M44 (textaudit 2026-07-04): "{spelare} avgjorde" borttagen — {spelare} binds
 * till den vilade/roterade spelaren i GranskaOversikt.tsx, medan good/bad/
 * neutral (kvittoDir) sätts av lagets matchresultat, inte den spelarens
 * faktiska bidrag. Raden hävdade att den roterade spelaren avgjorde matchen
 * varje gång laget vann — oavsett om det stämde.
 */
export const LINEUP_ROTATION_OUTCOMES: Record<KvittoOutcomeDir, string[]> = {
  good: ['De utvilade benen orkade hela vägen.'],
  bad: ['Rotationen störde rytmen och kemin uteblev.', 'De invalda kom aldrig in i matchen.'],
  neutral: ['Rotationen syntes varken på gott eller ont.'],
}

/** Startade en trött spelare (started_tired) → höll benen eller inte. Egen pool — detta är INTE rotering/vila, så LINEUP_ROTATION_OUTCOMES passar inte här. */
export const STARTED_TIRED_OUTCOMES: Record<KvittoOutcomeDir, string[]> = {
  good: ['{spelare} höll trots tunga ben.', 'Tröttheten syntes inte — {spelare} bar matchen ändå.'],
  bad: ['De tunga benen syntes. {spelare} räckte inte hela vägen.', '{spelare} hade inte benen med sig i dag.'],
  neutral: ['{spelare} gjorde sitt, varken mer eller mindre.'],
}

/** Leadership-action (senaste leadershipActions) → grepp om gruppen. */
export const LEADERSHIP_OUTCOMES: Record<KvittoOutcomeDir, string[]> = {
  good: ['Kaptenen tog tag i det och laget följde.', 'Ledarorden satte sig i omklädningsrummet.'],
  bad: ['Ingen tog kommandot när det krävdes.', 'Beskedet bet inte på den här gruppen.'],
  neutral: ['Det togs upp, men gruppen var redan där.'],
}

/**
 * Kaptenraden i manager-kvittot — kontextspecifika pooler (Opus-text 2026-06-23).
 * Ersätter den hårdkodade alltid-gröna kaptenraden i GranskaOversikt
 * (se docs/DIAGNOS-DINA-VAL-LOGG-2026-06-23.md, D2). Skild från LEADERSHIP_OUTCOMES
 * ovan (den hör till leadership-action-systemet) — denna är specifik för "Dina val · Utfall".
 *
 * Riktning härleds ur kaptenens matchrating, exakt som started_tired:
 *   rating >= 7 → 'good', <= 5 → 'bad', annars 'neutral'. Saknas rating: falla på resultatet.
 * Kontext väljs av Code ur fixturen, i denna prioordning:
 *   final    → isNeutralVenue (SM-final) ELLER cup-final
 *   slutspel → isKnockout && inte final (kvarts/semi, även cup-semi)
 *   derby    → getRivalry(home, away) träffar och matchen ej redan är final/slutspel
 *   vardag   → allt annat (ligaomgång, tidiga cuprundor)
 * Raderna är namnlösa med flit: kaptenens efternamn visas på egen rad ovanför utfallet.
 */
export type CaptainContext = 'final' | 'slutspel' | 'derby' | 'vardag'

export const CAPTAIN_OUTCOMES: Record<CaptainContext, Record<KvittoOutcomeDir, string[]>> = {
  final: {
    good: [
      'På den scenen växte bindeln. Laget tittade dit och fick svar.',
      'Kaptenen bar finalnerverna åt de yngre. Det syntes på isen.',
      'När det vägde tyngst var det kaptenen som höll i taktpinnen.',
    ],
    bad: [
      'Finaltrycket blev för stort. Bindeln syntes aldrig när den behövdes.',
      'Kaptenen försvann i det stora, och laget letade efter någon att följa.',
      'Det var ingen som tog finalen i sin hand.',
    ],
    neutral: [
      'Kaptenen gjorde sitt, men finalen avgjordes på annat håll.',
      'Bindeln drunknade lite i bruset, varken till skada eller nytta.',
    ],
  },
  slutspel: {
    good: [
      'Kaptenen tog det tyngsta på sina axlar och laget orkade hela vägen.',
      'I pressen som bara slutspel ger var bindeln den lugnaste på isen.',
    ],
    bad: [
      'Slutspelsnerverna nådde ända in i bindeln, och laget kände det.',
      'Kaptenen räckte inte till när det stramades åt.',
    ],
    neutral: [
      'Kaptenen gjorde sitt, inget mer att säga om den saken.',
      'Bindeln störde inte, men drog inte heller laget framåt.',
    ],
  },
  derby: {
    good: [
      'I hettan höll kaptenen huvudet kallt och tog ner rätt spelare i varv.',
      'Derbyt krävde någon som inte tappade det. Bindeln tog den rollen.',
      'När det puttrade som värst var det kaptenen som höll ihop laget.',
    ],
    bad: [
      'Kaptenen åkte med i derbyhettan i stället för att dämpa den.',
      'Bindeln tappade humöret först av alla, och det spred sig.',
      'Ingen kylde ner det när derbyt började koka.',
    ],
    neutral: [
      'Kaptenen red ut derbyt utan att vare sig tända eller släcka.',
      'Hettan tog över planen. Bindeln blev en i mängden.',
    ],
  },
  vardag: {
    good: [
      'Kaptenen tog tag i det och laget följde.',
      'En vanlig omgång, men bindeln höll ihop det när det small till.',
      'Ledarorden satte sig i omklädningsrummet.',
    ],
    bad: [
      'Ingen tog kommandot när det krävdes.',
      'Bindeln gick på tomgång, och laget med den.',
      'Beskedet bet inte på den här gruppen.',
    ],
    neutral: [
      'Det togs upp, men gruppen var redan där.',
      'En dag på jobbet för kaptenen. Inget som stack ut.',
    ],
  },
}
