// src/domain/data/injuryDoctorText.ts
// Skade-narrativet — bandydoktorn. Opus-text 2026-05-25.
//
// Karaktären är namngiven per save (som journalisten) och pratar bandysvensk
// understatement. Han säger aldrig "vi måste operera". Han säger "tre veckor om vi
// tar det lugnt, sex om vi inte gör det". Råd, inte order. Bryr sig, men torrt.
//
// {spelare} interpoleras av Code (oftast efternamn). {veckor}/{omg} likaså där det finns.
//
// M9 (textaudit, verifierad 2026-07-05): var HELT död kod — noll konsumenter.
// Pool 1c (2026-07-18): PLAY_THROUGH_AFTERMATH + InjurySeverity nu wirade i
// spela-på-mekaniken (playerStateProcessor.ts/eventProcessor.ts/eventResolver.ts)
// via getInjurySeverity() nedan.
// Pool 1a+1e (2026-07-18): createDoctor() genererar en per-save doktor
// (SaveGame.doctor, satt i createNewGame.ts, speglar createJournalist).
// DIAGNOSIS_LINES wirad i inboxService.ts's createInjuryItem (post-match-
// skadan, playerStateProcessor-källan). LONGTERM_ARC_LINES wirad i
// matchInjuryService.ts's generateInjuryInboxItem för 'skenan'-typen
// (enda matchskadan som når langtid-severity, 30-45 v) — ERSÄTTER
// INJURY_INBOX_BODY.skenan där (en röst vinner, inte båda staplade).
// Pool 1b+1d (2026-07-18): verifierat — inget stage-fält finns någonstans
// (ingen Injury-entitet existerar alls). getRehabStage() härleder stadiet ur
// injuryDaysRemaining som ett ABSOLUT avstånd till återkomst (se funktionens
// egen kommentar för varför en relativ andel inte går att räkna ut).
// REHAB_STAGE_LINES wirad i PlayerCard.tsx som ett ANDRA, kompletterande
// stycke under injuryNarrative (skadans ursprungshistoria är statisk sedan
// skadetillfället; rehab-raden uppdateras med var i återhämtningen spelaren
// är NU — olika moment, båda får plats). DOCTOR_SECONDARY_LINES wirad i
// InjuryStatusSecondary.tsx — ERSÄTTER den tidigare kontextraden eftersom
// båda konkurrerade om samma UI-rad (en röst vinner). Ton härleds ur
// severity (langtid→beslut) + stage (rest/light→kämpigt, full/matchfit→lovande).
// Ingen "Injury-entitet med severity/stage" finns (den tidigare kommentaren
// ovan var fel/stale) — Player har bara isInjured/injuryDaysRemaining,
// severity härleds nu av getInjurySeverity() ur injuryDaysRemaining.
//
// 2026-07-19 (ruling, tog tillbaka del av 1d-ordern): injuryContextText.ts
// hade INTE bara en konkurrerande severity-röst — den hade två axlar
// DOCTOR_SECONDARY_LINES saknade helt (nyckelspelare-borta, flera-skadade-
// samtidigt, en AGGREGERAD läsning av truppläget). De skördades hit som
// KEY_PLAYER_INJURY_LINES/MANY_INJURED_LINES (doktorns röst, samma
// prioritetsordning InjuryStatusSecondary.tsx hade: nyckelspelare > 4+
// skadade > severity/stage-fallback). Filen raderad efter skörd —
// SHORT/MEDIUM/LONG-severity-raderna där var redan dubblerade av
// DIAGNOSIS_LINES.

export type DoctorStyle = 'torr' | 'varm' | 'rakt_pa'

export interface DoctorIdentity {
  name: string
  style: DoctorStyle
}

/** Namnpool för save-genererad bandydoktor. Äldre klubbtrotjänare, blandat. */
export const DOCTOR_NAMES: string[] = [
  'Henrik', 'Bengt', 'Sune', 'Roland', 'Ingvar', 'Lasse', 'Yngve', 'Göran', 'Margareta', 'Birgitta',
]

export const DOCTOR_STYLES: DoctorStyle[] = ['torr', 'varm', 'rakt_pa']

/** Pool 1a/1e (2026-07-18): save-genererad doktorsidentitet, speglar createJournalist. */
export function createDoctor(rand: () => number): DoctorIdentity {
  const name = DOCTOR_NAMES[Math.floor(rand() * DOCTOR_NAMES.length)]
  const style = DOCTOR_STYLES[Math.floor(rand() * DOCTOR_STYLES.length)]
  return { name, style }
}

export type InjurySeverity = 'mjuk' | 'mild' | 'svar' | 'langtid'

/**
 * Pool 1c: härleder allvarlighetsgrad ur injuryDaysRemaining — Player har
 * ingen egen severity-data, bara dagar kvar. Trösklar satta mot de två
 * skaderegn som faktiskt producerar dagar: playerStateProcessor.ts (post-
 * match, 7-34 dagar) och matchInjuryService.ts (matchhändelser, 0-315 dagar
 * — skenan ensam sträcker sig till 30-45 VECKOR). mjuk/mild täcker
 * playerStateProcessor-spannet (så spela-på-erbjudandet faktiskt kan
 * triggas av den vanligaste skadekällan); svår/långtid täcker resten.
 */
export function getInjurySeverity(injuryDaysRemaining: number): InjurySeverity {
  if (injuryDaysRemaining <= 13) return 'mjuk'
  if (injuryDaysRemaining <= 27) return 'mild'
  if (injuryDaysRemaining <= 60) return 'svar'
  return 'langtid'
}

export type RehabStage = 'rest' | 'light' | 'full' | 'matchfit'

/**
 * Pool 1b/1d (2026-07-18): Player/Injury har inget stage-fält (verifierat —
 * ingen Injury-entitet existerar alls). Stadiet härleds därför ur
 * injuryDaysRemaining som ett ABSOLUT avstånd till återkomst, inte en andel
 * av den ursprungliga skadans totala längd (Player lagrar bara dagar KVAR,
 * inte det ursprungliga totalet, så en relativ andel går inte att räkna ut
 * i efterhand). Trösklar: sista veckan matchfit, upp till tre veckor full,
 * upp till sex veckor light, därutöver rest. Detta ger rimligt beteende
 * över hela severity-spannet: en mjuk skada (≤13 dagar) tillbringar det
 * mesta av sin korta tid i full/matchfit, en långtidsskada (>60 dagar,
 * upp till 315) tillbringar veckor i rest innan den ens når light.
 */
export function getRehabStage(injuryDaysRemaining: number): RehabStage {
  if (injuryDaysRemaining <= 7) return 'matchfit'
  if (injuryDaysRemaining <= 21) return 'full'
  if (injuryDaysRemaining <= 42) return 'light'
  return 'rest'
}

/** Diagnos-repliker vid skade-scenen, per allvarlighetsgrad. */
export const DIAGNOSIS_LINES: Record<InjurySeverity, string[]> = {
  mjuk: [
    'En sträckning, inget mer. {spelare} är tillbaka om en vecka om han håller sig borta från isen så länge.',
    'Det går över av sig självt. En vecka, två om han är envis. Och det är han.',
    'Inget brott, ingen reva. Bara en muskel som sagt ifrån. Han får vila ett par dagar och gnälla resten.',
  ],
  mild: [
    'Det är ljumsken. Han kände det redan i andra halvlek och spelade igenom — det gör de alla. Tre veckor om vi tar det lugnt. Sex om vi inte gör det.',
    'Muskeln har gett upp för den här gången. Räkna med en månad, inte en vecka. Skyndar vi får vi börja om.',
    'Inget dramatiskt, men inget man pressar heller. Han är borta ett par omgångar. Lyssna på mig den här gången.',
  ],
  svar: [
    'Det här tar sin tid. Vi pratar inte veckor, vi pratar månader. Han kommer tillbaka, men inte i vinter.',
    'Brottet är rent, det är det enda positiva jag har åt dig. Resten är tålamod. Han blir borta länge.',
    'Det knäckte till ordentligt. Han är klar med säsongens tunga del. Vi får bygga upp honom från grunden.',
  ],
  langtid: [
    'Det är korsbandet. Säsongen är slut för honom. Han kommer tillbaka starkare, om han vill det tillräckligt mycket.',
    'Knät höll inte. Det är ingen idé att skynda — den som skyndar på ett korsband gör om hela resan en gång till.',
    'Det är illa. Inte karriären, men det här året. Vi ses i operationsförberedelserna i morgon.',
  ],
}

/** Rehab-citat per stadie (matchar Injury.stage: rest/light/full/matchfit). */
export const REHAB_STAGE_LINES: Record<'rest' | 'light' | 'full' | 'matchfit', string[]> = {
  rest: [
    'Han vilar. Inget annat just nu — kroppen ska få göra sitt först.',
    'Vi rör ingenting den här veckan. Han hatar det, men så går det till.',
  ],
  light: [
    'Han springer på bandet i dag. Klart för fri träning nästa vecka om det håller.',
    'Lätt belastning. Han kliar i benen efter mer, men han får vänta.',
  ],
  full: [
    'Full träning från i dag. Vi håller ögonen på honom, men det ser bra ut.',
    'Han är med i allt nu utom matchspel. Sista steget är alltid det otåligaste.',
  ],
  matchfit: [
    'Han är klar. Kanske inte nittio minuter än, men klar.',
    'Match igen. Ta honom försiktigt första gången, sen är han din.',
  ],
}

/**
 * Pool 1b (2026-07-18): deterministiskt radval ur REHAB_STAGE_LINES, samma
 * charCodeAt-hash-mönster som createSuspensionItem/createInjuryItem
 * (inboxService.ts) — aldrig Math.random. Ingen {spelare}-interpolering
 * behövs, poolen använder redan pronomen ("Han vilar...").
 */
export function pickRehabStageLine(playerId: string, injuryDaysRemaining: number): string {
  const stage = getRehabStage(injuryDaysRemaining)
  const lines = REHAB_STAGE_LINES[stage]
  const idx = Math.abs(playerId.charCodeAt(0) + injuryDaysRemaining) % lines.length
  return lines[idx]
}

/**
 * Eftersnack när spelaren pressats tillbaka för tidigt ("spela på").
 * De fem första = det gick illa. Den sista = spelet gick hem den här gången.
 */
export const PLAY_THROUGH_AFTERMATH: string[] = [
  'Du tog tillbaka honom för tidigt. Nu är vi på ruta ett igen, och den här gången tar det längre.',
  'Jag sa åt dig att vänta. Han höll en halvlek, sen small det igen. Dubbelt så länge nu.',
  'Han spelade på vilja, inte på ben. Det syntes, och det kostade oss honom resten av månaden.',
  'Det höll inte. Jag visste det när han värmde upp, men det var ditt beslut.',
  'Du fick din match. Jag får en spelare som behöver en vecka till på britsen.',
  'Det gick. Den här gången. Fråga mig inte att göra om det.',
]

/**
 * DoktorSecondary i Portal — subtila rehab-uppdateringar, cooldown 2 omg.
 * Tre toner: lovande, kämpigt, beslutsläge (långtidsskada).
 */
export type DoctorSecondaryTone = 'lovande' | 'kampigt' | 'beslut'

export const DOCTOR_SECONDARY_LINES: Record<DoctorSecondaryTone, string[]> = {
  lovande: [
    '{spelare} sprang utanför banan på morgonen. Det är ett bra tecken.',
    '{spelare} var först till träningen i dag. Kroppen börjar lita på sig själv igen.',
    '{spelare} bad om att få träna med laget i förtid. Jag sa nej, men det säger något om benen.',
  ],
  kampigt: [
    '{spelare} har börjat tappa fokus i rehab. Det är vecka tre, det händer.',
    '{spelare} pressar för hårt. Jag får be honom dra ner, vilket han hatar.',
    '{spelare} hade en dålig dag på bandet. En sådan får man räkna med, men jag håller ögonen på honom.',
  ],
  beslut: [
    '{spelare} var här i går och frågade om operation. Jag sa att det är hans beslut.',
    '{spelare} vill veta om han hinner tillbaka till slutspelet. Jag lovade ingenting.',
  ],
}

/**
 * Pool 1d (2026-07-18): ton härleds ur severity+stage — 'beslut' är
 * reserverad för långtidsskador (matchar filens egen kommentar ovan:
 * "beslutsläge (långtidsskada)"). Övriga severity-nivåer mappas mot stage:
 * tidigt i rehabben (rest/light) läser som kämpigt, sent (full/matchfit)
 * som lovande — en enkel, motiverad proxy givet att ingen separat
 * "går rehabben bra"-signal finns på Player.
 */
export function pickDoctorSecondaryLine(playerId: string, spelare: string, injuryDaysRemaining: number): string {
  const severity = getInjurySeverity(injuryDaysRemaining)
  const stage = getRehabStage(injuryDaysRemaining)
  const tone: DoctorSecondaryTone = severity === 'langtid'
    ? 'beslut'
    : (stage === 'rest' || stage === 'light') ? 'kampigt' : 'lovande'
  const lines = DOCTOR_SECONDARY_LINES[tone]
  const idx = Math.abs(playerId.charCodeAt(0) + injuryDaysRemaining) % lines.length
  return lines[idx].replace(/\{spelare\}/g, spelare)
}

/**
 * Nyckelspelare/flera-skadade-axlarna (2026-07-19). injuryContextText.ts
 * (raderad, se BACKLOG-historik) hade två axlar DOCTOR_SECONDARY_LINES
 * saknar helt: en AGGREGERAD läsning av skadeläget (den här spelaren är
 * svår att ersätta / så här många är borta samtidigt), inte en individuell
 * severity/stage-diagnos. Jacobs ruling 2026-07-19: skörda axlarna i
 * doktorns röst (han är klubbläkare, ser hela behandlingsrummet) istf två
 * röster på samma kort. De gamla SHORT/MEDIUM/LONG-severity-raderna i den
 * filen täcktes redan av DIAGNOSIS_LINES/pickDoctorSecondaryLine ovan och
 * raderades utan ersättning.
 */
export const KEY_PLAYER_INJURY_LINES: string[] = [
  '{spelare} är svår att ersätta. Det vet du lika bra som jag.',
  'Han är en av era bästa. Det märks på de andra att han inte är där.',
  'Vi klarar oss utan honom. Sämre, men vi klarar oss.',
]

/** {antal} interpoleras — antal samtidigt skadade spelare. */
export const MANY_INJURED_LINES: string[] = [
  '{antal} på britsen den här veckan. Det blir ditt pussel, inte mitt.',
  'Det är trångt här inne. {antal} stycken, och alla vill tillbaka i förtid.',
  '{antal} borta samtidigt. Sånt händer en lång vinter, men det gör inte truppen bredare.',
]

export function pickKeyPlayerInjuryLine(playerId: string, spelare: string): string {
  const idx = Math.abs(playerId.charCodeAt(0)) % KEY_PLAYER_INJURY_LINES.length
  return KEY_PLAYER_INJURY_LINES[idx].replace(/\{spelare\}/g, spelare)
}

export function pickManyInjuredLine(playerId: string, antal: number): string {
  const idx = Math.abs(playerId.charCodeAt(0) + antal) % MANY_INJURED_LINES.length
  return MANY_INJURED_LINES[idx].replace(/\{antal\}/g, String(antal))
}

/** Långtidsskada-arc — säsongsavslutande skada som narrativ båge. {spelare} interpoleras. */
export const LONGTERM_ARC_LINES: string[] = [
  'Det är inte slutet. Men säsongen är slut för {spelare}. Han kommer tillbaka starkare, om han vill.',
  'Vi opererar i veckan. Sen är det ett halvår av tålamod. {spelare} vet det redan.',
  'Han tog det lugnare än jag trodde. Sa bara att han varit borta förr och kommit tillbaka.',
  'Knät blir aldrig riktigt som förr. Det behöver det inte vara heller — han har spelat på sämre.',
  'Det långa loppet nu. {spelare} ses i rehabrummet, inte på isen, fram till nästa vinter.',
]
