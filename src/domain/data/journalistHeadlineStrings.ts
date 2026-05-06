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
    'Övertygande hemmaseger — laget hade dagen',
    'Klar seger när allt klaffade',
    '{opp} fick stryka på foten',
    'Sex mål — hela truppen bidrog',
    'Solid afton från första nedsläpp',
  ],
  sensationalist: [
    'Målfest mot {opp}',
    'Krossade {opp} totalt',
    'Drömkväll — sex mål och förlossning',
    'Sju–ett. Inget mer behöver sägas',
    'Hela arenan reste sig — {opp} stod handfallna',
  ],
  analytical: [
    'Hemmaplansfaktorn höll hela vägen',
    'Tre mål i första kvarten avgjorde',
    'Skotteffektiviteten talade sitt språk',
    '{opp} höll inte tempot efter halvtid',
    'Truppdjup avgjorde när minuter rann ut',
  ],
  critical: [
    'Stor vinst — men resultatet döljer ojämnheter',
    'Sex mål mot tabellsvagt motstånd',
    'Räkna inte med samma marginal nästa vecka',
    'Lätt motstånd. Ska bli intressant mot starkare lag',
    'Vann med besked, men mot vem',
  ],
}

const WIN_HEADLINES: Record<Persona, SimplePool> = {
  supportive: [
    'Tre poäng efter god kamp',
    'Hemmaseger som betalde sig',
    'Ortens lag bröt isen',
    'Knapp men förtjänt seger',
    'Gick i mål när det krävdes',
  ],
  sensationalist: [
    'Sen avgörare — tre poäng till {opp}',
    'Slutspurt fixade segern',
    'Drama in i sista sekunden',
    'Vände matchen efter 0–1',
    'Räddade hem segern med minuter kvar',
  ],
  analytical: [
    'Disciplinerad andra halvlek räckte',
    'Effektiviteten avgjorde — fyra skott på mål, två i kassen',
    'Kontringsspel gav resultat',
    'Försvarslinjen stod pall vid tryck',
    'Hemmastatistiken håller — seger nummer fyra',
  ],
  critical: [
    'Vann trots ojämn insats — mer krävs framöver',
    'Tre poäng som inte ska tolkas för optimistiskt',
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
    'Slutminutsmål gav den välbehövda poängen',
  ],
  sensationalist: [
    'Drama till sista sekund — slutade 2–2',
    'Vände 0–2 till oavgjort',
    'Hjärtstillestånd på läktaren — kvitterade i 89:e',
    'Tappade ledning — men räddade en poäng',
    'Vild slutkvart — båda lagen jagade segern',
  ],
  analytical: [
    'Båda lagen tappade tempo i slutkvarten',
    'Statistiken jämn — resultatet följer',
    'En poäng som speglar matchen — ingen förtjänade mer',
    'Få farligheter — oavgjort är logiskt',
    'Läktaren såg defensivt spel — siffran bekräftar',
  ],
  critical: [
    'En poäng räcker inte i längden',
    'Oavgjort mot bottenlag — frågetecken kvarstår',
    'Två tappade poäng — så ska det räknas',
    'Slätstruken poäng — inget byggs av såna här matcher',
    'Hemma och oavgjort — inte vad som ska levereras',
  ],
}

const LOSS_HEADLINES: Record<Persona, Cell> = {
  supportive: [
    'Tung förlust efter god kamp',
    'Kom till korta — men kämpade in i slutet',
    'Försvann inte fast resultatet bet',
    'Marginalerna fanns inte idag',
    'Förlust där allt nästan stämde',
  ],
  sensationalist: {
    fresh: [
      'Mörk eftermiddag — föll mot {opp}',
      'Sista-minuten-mål sänkte hemmaplanen',
      'Bortaplanen blev en mardröm',
      'Tappade ledning — och poäng',
      'Bittert nederlag i nyckelmatch',
    ],
    prevLoss: [
      'Andra raka — mörkret tätnar',
      'Nedförsbacke utan broms — förlust på förlust',
      'Tre raka utan poäng — det här blir en kris',
    ],
  },
  analytical: {
    fresh: [
      'Skotteffektiviteten räckte inte — sex skott på mål, ett mål',
      'Mittfältsspelet bröt samman efter halvtid',
      'För få farligheter framåt — för många bakåt',
      '{opp} kontrollerade tempot från första kvarten',
      'Försvarslinjen tappade form i slutkvarten',
    ],
    prevLoss: [
      'Mönstret upprepar sig — andra halvlek faller samman igen',
      'Tredje förlusten på rad bekräftar formfrågan',
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
      'Inte ens lärdomar denna gång — andra raka utan svar',
      'Smärtsamt återfall i samma mönster',
      'Svit utan lösningar — ledning behöver förklara',
    ],
  },
}

const BIG_LOSS_HEADLINES: Record<Persona, Cell> = {
  supportive: [
    'Tung dag — försök glömma',
    'Förlust som hela klubben känner',
    'Inget gick laget i händer idag',
    'Hela laget vill snabbt vidare till nästa',
    'En sån här match gör man inte om',
  ],
  sensationalist: {
    fresh: [
      'Kollapsen — sönderspelade på hemmaplan',
      'Mardrömskväll — sex mål bakåt',
      'Förödmjukade av {opp} — förnedring framför hemmapubliken',
      'Skämmig kväll — laget aldrig med',
      'Total kollaps — slutade {scoreline}',
    ],
    prevLoss: [
      'Bottennapp på bottennapp — tre raka och i fritt fall',
      'Mörkret blev mörkare — andra storförlusten i rad',
      'Krisen är ett faktum — fyra raka utan poäng',
    ],
  },
  analytical: {
    fresh: [
      'Lagdelarna föll isär efter andra baklängesmålet',
      'Defensivstatistik säsongens sämsta',
      'Bortaplanen blev övermäktig redan i första halvlek',
      'Mittfältsspelet upphörde att fungera efter pauspodiet',
      'Truppdjupet räckte inte när skadeläget tärde',
    ],
    prevLoss: [
      'Strukturella problem — bekräftade i andra storförlusten',
      'Datan pekar otvetydigt mot grundläggande lagbalansfråga',
      'Tredje matchen i rad där samma mönster återupprepas',
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
      'Tredje raka — och varje gång värre. Något är fundamentalt fel',
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
): string {
  const cell = HEADLINES[bucket][persona]

  let pool: string[]
  if (isSplit(cell)) {
    pool = prevLoss && cell.prevLoss.length > 0 ? cell.prevLoss : cell.fresh
  } else {
    pool = cell
  }

  const idx = hashSeed(`${fixtureId}_${bucket}_${persona}`) % pool.length
  let text = pool[idx]

  if (oppName) text = text.replace(/\{opp\}/g, oppName)
  else text = text.replace(/\s*—\s*\{opp\}[^}]*|,\s*\{opp\}[^,]*|\{opp\}\s*/g, '')

  if (scoreline) text = text.replace(/\{scoreline\}/g, scoreline)
  else text = text.replace(/\{scoreline\}/g, '?–?')

  return text.trim()
}
