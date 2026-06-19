function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0
  }
  return h
}

type ResultBucket = 'big_win' | 'win' | 'draw' | 'loss' | 'big_loss'
type Persona = 'supportive' | 'sensationalist' | 'analytical' | 'critical'

type SimplePool = string[]
type SplitPool = { fresh: string[]; prevLoss: string[] }
type Cell = SimplePool | SplitPool

function isSplit(c: Cell): c is SplitPool {
  return !Array.isArray(c)
}

const BIG_WIN_HEADLINES: Record<Persona, SimplePool> = {
  supportive: [
    'Övertygande seger — laget hade dagen',
    'Klar seger när allt klaffade',
    '{opp} fick stryka på foten',
    'Målrik kväll — hela truppen bidrog',
    'Solid afton från första avslag',
  ],
  sensationalist: [
    'Målfest mot {opp}',
    'Krossade {opp} totalt',
    'Drömkväll — målfest och förlösning',
    '{scoreline}. Inget mer behöver sägas',
    'Hela arenan reste sig — {opp} stod handfallna',
  ],
  analytical: [
    'Övertaget höll hela vägen',
    'Tidiga mål avgjorde',
    'Skotteffektiviteten talade sitt språk',
    '{opp} höll inte tempot efter halvtid',
    'Truppdjup avgjorde när minuter rann ut',
  ],
  critical: [
    'Stor vinst — men resultatet döljer ojämnheter',
    'Storseger mot tabellsvagt motstånd',
    'Räkna inte med samma marginal nästa vecka',
    'Lätt motstånd. Ska bli intressant mot starkare lag',
    'Vann med besked, men mot vem',
  ],
}

const WIN_HEADLINES: Record<Persona, SimplePool> = {
  supportive: [
    'Två poäng efter god kamp',
    'Arbetsseger som betalde sig',
    'Ortens lag bröt isen',
    'Knapp men förtjänt seger',
    'Gick i mål när det krävdes',
  ],
  sensationalist: [
    'Sen avgörare — två poäng mot {opp}',
    'Slutspurt fixade segern',
    'Drama in i sista sekunden',
    'Vände matchen efter tidigt underläge',
    'Räddade hem segern med minuter kvar',
  ],
  analytical: [
    'Disciplinerad andra halvlek räckte',
    'Effektiviteten avgjorde matchen',
    'Kontringsspel gav resultat',
    'Försvarslinjen stod pall vid tryck',
    'Formkurvan håller — ny seger',
  ],
  critical: [
    'Vann trots ojämn insats — mer krävs framöver',
    'Två poäng som inte ska tolkas för optimistiskt',
    'Knappt — och knappt räcker inte alltid',
    'Vinsten skymmer underliggande problem',
    'Räddat resultat, inte räddat spel',
  ],
}

const DRAW_HEADLINES: Record<Persona, SimplePool> = {
  supportive: [
    'En poäng — laget kämpade hela vägen',
    'Delade poäng efter god match',
    'Oavgjort som inte ska skämmas för',
    'En poäng är en poäng',
    'En poäng som satt långt inne',
  ],
  sensationalist: [
    'Drama till sista sekund — slutade {scoreline}',
    'Kämpade sig till poängdelning',
    'Hjärtstillestånd på läktaren in i det sista',
    'Nära två poäng — fick nöja sig med en',
    'Vild slutkvart — båda lagen jagade segern',
  ],
  analytical: [
    'Båda lagen tappade tempo i slutkvarten',
    'Statistiken jämn — resultatet följer',
    'En poäng som speglar matchen — ingen förtjänade mer',
    'Få farligheter — oavgjort är logiskt',
    'Jämnt över nittio minuter — siffran bekräftar',
  ],
  critical: [
    'En poäng räcker inte i längden',
    'Oavgjort mot bottenlag — frågetecken kvarstår',
    'En tappad poäng — så ska det räknas',
    'Slätstruken poäng — inget byggs av såna här matcher',
    'Poängdelning — inte vad som ska levereras',
  ],
}

const LOSS_HEADLINES: Record<Persona, Cell> = {
  supportive: [
    'Tung förlust efter god kamp',
    'Kom till korta — men kämpade in i slutet',
    'Försvann inte fast resultatet bet',
    'Marginalerna fanns inte i dag',
    'Förlust där allt nästan stämde',
  ],
  sensationalist: {
    fresh: [
      'Mörk eftermiddag — föll mot {opp}',
      'Föll tungt när det avgjordes',
      'Kvällen blev en mardröm',
      'Tomhänta efter nittio minuter',
      'Bittert nederlag i nyckelmatch',
    ],
    prevLoss: [
      'Ännu en rak förlust — mörkret tätnar',
      'Nedförsbacke utan broms — förlust på förlust',
      'Förlusterna staplas — det här börjar likna kris',
    ],
  },
  analytical: {
    fresh: [
      'Skotteffektiviteten räckte inte den här gången',
      'Mittfältsspelet bröt samman efter halvtid',
      'För få farligheter framåt — för många bakåt',
      '{opp} kontrollerade tempot från första kvarten',
      'Försvarslinjen tappade form i slutkvarten',
    ],
    prevLoss: [
      'Mönstret upprepar sig — andra halvlek faller samman igen',
      'Ny förlust i raden — formfrågan bekräftad',
      'Samma svaghet, samma resultat — något måste justeras',
    ],
  },
  critical: {
    fresh: [
      'Förlust som inte borde överraska någon',
      'Otillräckligt på alla områden',
      'Insatsen matchar inte ambitionen',
      'Ingen ursäkt — laget mötte inget övermäktigt',
      'Hade kunnat — men gjorde det inte',
    ],
    prevLoss: [
      'Inte ens lärdomar denna gång — ännu en förlust utan svar',
      'Smärtsamt återfall i samma mönster',
      'Svit utan lösningar — ledning behöver förklara',
    ],
  },
}

const BIG_LOSS_HEADLINES: Record<Persona, Cell> = {
  supportive: [
    'Tung dag — försök glömma',
    'Förlust som hela klubben känner',
    'Inget gick laget i händer i dag',
    'Hela laget vill snabbt vidare till nästa',
    'En sån här match gör man inte om',
  ],
  sensationalist: {
    fresh: [
      'Kollapsen — sönderspelade och svarslösa',
      'Mardrömskväll från start till slut',
      'Förödmjukade av {opp} — förnedring inför publik',
      'Skämmig kväll — laget aldrig med',
      'Total kollaps — slutade {scoreline}',
    ],
    prevLoss: [
      'Bottennapp på bottennapp — fritt fall nu',
      'Mörkret blev mörkare — storförlust ovanpå förlust',
      'Krisen är ett faktum — poängen uteblir',
    ],
  },
  analytical: {
    fresh: [
      'Lagdelarna föll isär efter andra baklängesmålet',
      'Defensiven föll ihop fullständigt',
      '{opp} övermäktiga redan i första halvlek',
      'Mittfältsspelet upphörde att fungera efter paus',
      'Truppdjupet räckte inte mot det här',
    ],
    prevLoss: [
      'Strukturella problem — den här matchen bekräftade dem',
      'Datan pekar otvetydigt mot grundläggande lagbalansfråga',
      'Samma mönster upprepas — match efter match',
    ],
  },
  critical: {
    fresh: [
      'Diskussion om ledarskapet börjar nu',
      'Skämmig insats. Punkt',
      'Det här är inte ett elitlag idag',
      'Inga ursäkter accepteras',
      'En förlust som ska följa laget hela säsongen',
    ],
    prevLoss: [
      'Inte längre fråga om form — fråga om förmåga',
      'Förlust igen — och varje gång värre. Något är fundamentalt fel',
      'Snart obekvämt att fortsätta tala om enskilda matcher',
    ],
  },
}

const HEADLINES: Record<ResultBucket, Record<Persona, Cell>> = {
  big_win: BIG_WIN_HEADLINES,
  win: WIN_HEADLINES,
  draw: DRAW_HEADLINES,
  loss: LOSS_HEADLINES,
  big_loss: BIG_LOSS_HEADLINES,
}

export function pickHeadline(
  bucket: ResultBucket,
  persona: Persona,
  fixtureId: string,
  prevLoss = false,
  oppName?: string,
  scoreline?: string,
  matchday = 0,
  isCup = false,
  surface: 'inbox' | 'portal' | 'granska' = 'inbox',
): string {
  const cell = HEADLINES[bucket][persona]

  let pool: string[]
  if (isSplit(cell)) {
    pool = prevLoss && cell.prevLoss.length > 0 ? cell.prevLoss : cell.fresh
  } else {
    pool = cell
  }

  // Cup: inga poäng delas ut — filtrera bort poäng-språk (ligalogik hör inte hemma i cup).
  // Defensiv guard: töm aldrig poolen (om en bucket vore helt poäng-baserad, behåll original).
  if (isCup) {
    const filtered = pool.filter(h => !/poäng/i.test(h))
    if (filtered.length > 0) pool = filtered
  }

  // Include matchday in seed so consecutive rounds never repeat even if fixtureId hashes collide
  // Fynd 3: surface-diskriminator i seeden → samma händelse får tre formuleringar
  // (portal / inkorg / granska), så rubriken inte läser identiskt på tre ytor.
  const idx = hashSeed(`${fixtureId}_${bucket}_${persona}_md${matchday}_${surface}`) % pool.length
  let text = pool[idx]

  if (oppName) text = text.replace(/\{opp\}/g, oppName)
  else text = text.replace(/\s*—\s*\{opp\}[^}]*|,\s*\{opp\}[^,]*|\{opp\}\s*/g, '')

  if (scoreline) text = text.replace(/\{scoreline\}/g, scoreline)
  else text = text.replace(/\{scoreline\}/g, '?–?')

  return text.trim()
}
