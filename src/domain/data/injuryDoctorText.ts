// src/domain/data/injuryDoctorText.ts
// Skade-narrativet — bandydoktorn. Opus-text 2026-05-25.
//
// Karaktären är namngiven per save (som journalisten) och pratar bandysvensk
// understatement. Han säger aldrig "vi måste operera". Han säger "tre veckor om vi
// tar det lugnt, sex om vi inte gör det". Råd, inte order. Bryr sig, men torrt.
//
// {spelare} interpoleras av Code (oftast efternamn). {veckor}/{omg} likaså där det finns.

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

export type InjurySeverity = 'mjuk' | 'mild' | 'svar' | 'langtid'

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

/** Långtidsskada-arc — säsongsavslutande skada som narrativ båge. {spelare} interpoleras. */
export const LONGTERM_ARC_LINES: string[] = [
  'Det är inte slutet. Men säsongen är slut för {spelare}. Han kommer tillbaka starkare, om han vill.',
  'Vi opererar i veckan. Sen är det ett halvår av tålamod. {spelare} vet det redan.',
  'Han tog det lugnare än jag trodde. Sa bara att han varit borta förr och kommit tillbaka.',
  'Knät blir aldrig riktigt som förr. Det behöver det inte vara heller — han har spelat på sämre.',
  'Det långa loppet nu. {spelare} ses i rehabrummet, inte på isen, fram till nästa vinter.',
]
