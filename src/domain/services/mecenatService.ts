import type { Mecenat, MecenatType, MecenatPersonality, SocialEvent } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'

// ── Region-based business templates ─────────────────────────────────────

interface MecenatTemplate {
  type: MecenatType
  businesses: string[]
}

const REGION_BUSINESSES: Record<string, MecenatTemplate[]> = {
  sandviken: [
    { type: 'brukspatron', businesses: ['Hedins Sågverk', 'Sandvikens Stålförädling'] },
    { type: 'entrepreneur', businesses: ['Göranssons Sporthandel', 'Gävle Bil'] },
  ],
  edsbyn: [
    { type: 'skogsägare', businesses: ['Edsbyns Skogsbruk', 'Hälsinge Timmer'] },
    { type: 'brukspatron', businesses: ['Träslöjden AB', 'Edsbyns Elverk'] },
  ],
  vasteras: [
    { type: 'it_miljonär', businesses: ['Voltiq Systems', 'DataNode AB'] },
    { type: 'fastigheter', businesses: ['Västeråshus AB', 'Mälar-Fastigheter'] },
  ],
  sirius: [
    { type: 'it_miljonär', businesses: ['Dalsjö Digital', 'Uppsala Tech Ventures'] },
    { type: 'entrepreneur', businesses: ['Lindströms Bil', 'Fyris Bygg'] },
  ],
  broberg: [
    { type: 'brukspatron', businesses: ['BillerudKorsnäs', 'Söderhamns Trä'] },
    { type: 'skogsägare', businesses: ['Hälsinge Skog', 'Norrskog'] },
  ],
  falun: [
    { type: 'brukspatron', businesses: ['SSAB Borlänge', 'Dalslipsten AB'] },
    { type: 'entrepreneur', businesses: ['Mora Knivfabrik', 'Dahlströms Sport'] },
  ],
  default: [
    { type: 'entrepreneur', businesses: ['Lokala Bygg AB', 'Ortens Bil'] },
    { type: 'lokal_handlare', businesses: ['Handlarn', 'ICA-Kungen'] },
  ],
}

// ── Names ───────────────────────────────────────────────────────────────

const MALE_NAMES = ['Karl-Erik', 'Bengt', 'Stig', 'Lars-Göran', 'Rolf', 'Per-Olof', 'Arne', 'Göran', 'Tord', 'Lennart']
const FEMALE_NAMES = ['Margareta', 'Karin', 'Elisabeth', 'Birgitta', 'Ingrid', 'Christina', 'Eva', 'Gunilla', 'Lena', 'Annika']
const LAST_NAMES = ['Hedin', 'Lindqvist', 'Bergström', 'Johansson', 'Nilsson', 'Eriksson', 'Holm', 'Sandberg', 'Björk', 'Dalgren']
const YOUNG_MALE = ['Martin', 'Daniel', 'Fredrik', 'Johan', 'Niklas']
const YOUNG_FEMALE = ['Sara', 'Emma', 'Malin', 'Anna', 'Elin']

const PERSONALITIES: MecenatPersonality[] = ['tyst_kraft', 'showman', 'kalkylator', 'nostalgiker', 'kontrollfreak', 'filantropen']

const BACKSTORIES: Record<MecenatType, { male: string[]; female: string[] }> = {
  brukspatron: {
    male: [
      'Tredje generationen i kommunen. Farfadern byggde fabriken, fadern utvidgade den, han håller den vid liv. Sysselsätter var fjärde familj på orten och pratar aldrig om det.',
      'Tog över vid en konkurs 2008 och vände det på tre år med envishet och tålamod. Folk vet att han inte backar. Ortens tyngste arbetsgivare sedan dess.',
      'Kör samma Volvo som 2003. Pengarna sitter i maskiner och fastigheter, inte i garaget. Känd för att betala löner i tid — varje fredag, utan undantag.',
      'Hans stålverk och sågverk täcker tre kommuner. Det pratar han aldrig om på egen hand, men alla vet. Orten bär hans stämpel på ett sätt som inte syns på kartan.',
    ],
    female: [
      'Tog över efter fadern och moderniserade från grunden — ny produktionslinje, nya avtal, nytt folk. Respekterad för att hon levererade utan att skrika om det.',
      'VD sedan 15 år. Sitter i tre styrelser, driver juniorprogrammet på fritiden och har aldrig kallat det välgörenhet.',
      'Uppvuxen i fabriken, bokstavligen — föräldrarna jobbade tidigt morgon och hon lekte i matsalen som barn. Tillbaka nu som chef. Menar allvar med varje beslut.',
      'Äger produktionsanläggningen utanför orten, tre hyreshus i centrum och ungefär hälften av det som kallas framtid i den här kommunen.',
    ],
  },
  skogsägare: {
    male: [
      'Äger 800 hektar norr om orten. Vad som växer där inne vet han i detalj — vilken trakt som ska avverkas om tre år, vilken som ska vila i tio. Jagar älg varje höst, på sin egen mark.',
      'Ärver inte — köpte. Varje skog han äger är ett avtal han slöt när priset var lågt och andra tvivlade. Pragmatisk som få, tålmodig som marken.',
      'Slog sitt första skogsbud 1997 med lånat kapital. Nu är det han som lånar ut. Säger ingenting om det, men ortens bank vet.',
      'Fem generationer av familjen har brukat mark i länet. Han är den som satte det i bolagsform. Lever på kalender och karta och tycker om det.',
    ],
    female: [
      'Ärvde av mormodern — 400 hektar och ett arvode hon inte förstod priset på förrän tio år senare. Driver det nu som ett modernt skogsbolag med miljöcertifikat och vinst.',
      'Utbildad biolog. Kombinerar naturvård med affärssinne på ett sätt som gör folk obekväma. Vann en regional miljöpris 2019. Pratar aldrig om det.',
      'Kände varenda träd på familjens mark som barn. Nu känner hon rättighetslagstiftningen lika väl. Ortens skogsägare respekterar henne, om än motvilligt.',
      'Sköter 600 hektar och vet exakt vad varje del är värd. Har sagt nej till tre bud från ett multinationellt bolag. Vill inte sälja det som familjen planterat.',
    ],
  },
  it_miljonär: {
    male: [
      'Sålde sitt analysprogram för logistik — 42 miljoner netto vid 34. Åkte hem till orten veckan efter. Letar fortfarande efter vad som ska komma härnäst.',
      'Byggt och sålt tre gånger. Aldrig bott mer än 15 mil från där han växte upp. Kapital saknar han aldrig — mening är en annan sak.',
      'Grundade sin startup i en källare i Uppsala. Sju år senare såldes bolaget till ett tyskt teknikföretag för en summa som inte publicerats, men ryktet stämmer.',
      'Rik sedan tio år. Har finansierat en bandyhall, en förskola och ett bryggeri i orten. Funderar på att starta ett nytt bolag igen om han hittar rätt folk.',
    ],
    female: [
      'Byggde sin verksamhet från grunden i ett garage utanför samhället — mjukvara för regional transport. Tio år och trettio anställda senare sålde hon till ett PE-bolag. Stannade kvar på orten.',
      'Lämnade storstaden 2015 efter sju år på ett konsultbolag. Ville bygga något eget på hemmaplan. Ångrar ingenting och säger det utan att verka arrogant.',
      'Hennes mjukvarubolag automatiserade kommunal administration i sex regioner. Tråkigt i beskrivning, lysande i siffror. Sålde för 28 miljoner netto.',
      'Spelar bandy på torsdagarna med ortens veteraner. Är den rikaste personen på planen och den sista att lämna isen.',
    ],
  },
  entrepreneur: {
    male: [
      'Startade som lärling i en rörmokeriaffär 1989. Öppnade eget 1997. Har nu 23 anställda, tre firmabilar och en förväntning på sig att sponsra allt i orten. Lever upp till den.',
      'Äger tre verksamheter i länet — el, bygg och städ. Sponsrar allt som rör sig i bygden. "Om jag inte ger tillbaka är det ingen idé", sa han en gång i lokaltidningen.',
      'Hans firma tar alla jobb de andra tackar nej till. Det är affärsidén. Ortens mest anlitade hantverkare sedan femton år — och det enda han är stolt över.',
      'Gick ur skolan direkt till en byggarbetsplats. Läste tre kvällskurser under tio år. Nu föreläser han om finansiering för nystartade företagare. Gör det gratis.',
    ],
    female: [
      'Från enmansfirma till tjugo anställda på elva år. Städbolag specialiserat på vård och omsorg — ett segment alla andra ignorerade. Affärssinne i blodet.',
      'Byggde sin verksamhet utan externt kapital. En kund i taget, ett avtal i taget. Känd för att alltid leverera och aldrig överlova.',
      'Driver Ortens Trädgård & Utemiljö sedan 2011. Anlitad av kommunen, skolan och halva villaägarna i trakten. Tycker att sponsring är ett verb, inte en siffra.',
      'Öppnade boutiquebutik 2009 när alla sa det var fel tid. Finns kvar. De som tvivlade är borta. Numera äger hon tre ställen i länet och funderar på ett fjärde.',
    ],
  },
  fastigheter: {
    male: [
      'Äger halva centrumkvarteret och sex hyresrätter i utkanten. Tyst men inflytelserik. Föredrar handling framför ord, och kontanter framför löften.',
      'Investerade i orten 2001 när folk lämnade. Nu när folk kommer tillbaka sitter han på nycklarna. Kommunens tyngste privata fastighetsägare och tänker inte sälja.',
      'Köpte sitt första objekt med ett lån han aldrig ska prata om igen. Nu är det han som beviljar. Har inga fastigheter utanför länet — geografin är hans fördel.',
      'Satt i kommunens byggnadsnämnd i tolv år. Vet exakt vad som är planlagt och varför. Den kunskapen är hans verkliga tillgång — och alla misstänker det.',
    ],
    female: [
      'Började som mäklare 2003 och förstod snabbt att det lönsamma var att äga, inte sälja. Köpte sitt första hus 2006. Nu är det hon som anlitar mäklare.',
      'Formger ortens framtid med tålamod och precision. Köper när andra säljer, säljer när alla vill köpa. Har alltid haft rätt timing — eller arbetat sig till den.',
      'Äger tretton fastigheter i fyra kommuner. Kontoret i centrum ser inte ut som det kostar vad det kostar. Det är poängen.',
      'Renoverade sin första fastighet med egna händer. Nu har hon entreprenörer. Skillnaden är att hon vet exakt vad varje moment ska kosta — och vad det ska inbringa.',
    ],
  },
  lokal_handlare: {
    male: [
      'Tredje generationens handlare. Morfadern öppnade, fadern utvidgade, han moderniserade. Alla i orten känner honom — och han känner alla. Det är inte en kliché, det är ett levande kundregister.',
      'Öppnade sin butik när alla sa att e-handeln hade vunnit. Finns kvar. De som tvivlade handlar hos honom nu — han levererar och vet vad de heter.',
      'Kombinerar dagligvaror med bredbandsförsäljning och postombud. Ortens nav. Om det stänger är det inte en butik som försvinner, det är infrastruktur.',
      'Hans far sa att butiken var ett kall, inte ett jobb. Han trodde inte på det då. Tror på det nu. Stänger aldrig på sportlovet.',
    ],
    female: [
      'Driver det lokala navet sedan 2009. Öppnar kl 6, stänger kl 20. Vet vad folk behöver innan de vet det själva. Satte in bankomat när kommunen tog bort den sista.',
      'Tog över efter föräldrarna och moderniserade utan att tappa det lokala — nytt kassasystem, gammalt bemötande. Grannarna märkte skillnaden, på rätt sätt.',
      'Hennes lokala sylt säljs fortfarande för 49 kronor. Priset är ett politiskt ställningstagande. Omsättningen klarar det gott.',
      'Butiken har funnits i 47 år. Hon tog över 2018 och bestämde att den ska finnas i 47 till. Ingen affärsplan, bara vilja och öppettider.',
    ],
  },
  jordbrukare: {
    male: [
      'Bedriver lantbruk utanför orten — 180 hektar, mjölkkor och spannmål. Sponsrar P19 sedan 2018 och är med på varje match. Jordnära och trovärdig som marken han brukar.',
      'Femte generationen på gården. Har sett konjunkturer komma och gå utan att sälja. Lever på marginalen som alla jordbrukare men kallar det frihet, inte fattigdom.',
      'Har diversifierat: lantbruk, maskinuthyrning och naturturism som ingen riktigt vet om. Pragmatisk och uthållig. Röstar på centerpartiet och är öppen med det.',
      'Kör traktorn själv. Tre anställda på deltid och ett sidobolag som säljer flis till kommunen. Grovt undervärderad av alla som inte bor på landet.',
    ],
    female: [
      'Driver ekologisk verksamhet med starka lokala band — säljer direkt till kunder i regionen och levererar till tre restauranger i länet. Vann Gröna Näringens pris 2021.',
      'Tredje generationen på gården. Envis och rak, precis som marken kräver. Sitter i LRF:s distriktsstyrelse och har tydliga åsikter om allt som rör mat och mark.',
      'Läste agronomutbildningen i Uppsala och kom tillbaka. Alla trodde hon skulle stanna i storstaden. Hon trodde det med, en kort stund.',
      'Sköter gård, barn och styrelseuppdrag med ett lugn som imponerar. Planerar tre år framåt, alltid. Säger att det handlar om planering. Det gör det.',
    ],
  },
}

// ── Generate a mecenat ──────────────────────────────────────────────────

export function generateMecenat(
  clubId: string,
  season: number,
  rand: () => number,
): Mecenat {
  const region = clubId.replace('club_', '')
  const templates = REGION_BUSINESSES[region] ?? REGION_BUSINESSES.default
  const template = templates[Math.floor(rand() * templates.length)]
  const business = template.businesses[Math.floor(rand() * template.businesses.length)]
  const personality = PERSONALITIES[Math.floor(rand() * PERSONALITIES.length)]
  const isFemale = rand() < 0.5
  const isYoung = template.type === 'it_miljonär' && rand() < 0.5

  const firstName = isYoung
    ? (isFemale ? YOUNG_FEMALE : YOUNG_MALE)[Math.floor(rand() * 5)]
    : (isFemale ? FEMALE_NAMES : MALE_NAMES)[Math.floor(rand() * 10)]
  const lastName = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]

  const wealth = template.type === 'it_miljonär' ? 4 + Math.floor(rand() * 2)
    : template.type === 'brukspatron' ? 3 + Math.floor(rand() * 2)
    : template.type === 'skogsägare' ? 3 + Math.floor(rand() * 2)
    : template.type === 'fastigheter' ? 3 + Math.floor(rand() * 2)
    : template.type === 'entrepreneur' ? 2 + Math.floor(rand() * 2)
    : 1 + Math.floor(rand() * 2)

  const contribution = wealth * 20000 + Math.floor(rand() * 20000)
  const backstoryPool = BACKSTORIES[template.type]?.[isFemale ? 'female' : 'male'] ?? []
  const backstory = backstoryPool[Math.floor(rand() * backstoryPool.length)] ?? ''

  return {
    id: `mecenat_${firstName.toLowerCase()}_${season}`,
    name: `${firstName} ${lastName}`,
    gender: isFemale ? 'female' : 'male',
    business,
    businessType: template.type,
    wealth: Math.min(5, wealth),
    personality,
    influence: 10 + Math.floor(rand() * 20),
    happiness: 60 + Math.floor(rand() * 20),
    patience: 50 + Math.floor(rand() * 30),
    contribution,
    totalContributed: 0,
    demands: [],
    socialExpectations: [],
    isActive: true,
    arrivedSeason: season,
    silentShout: 0,
    backstory: backstory || undefined,
  }
}

// ── Social event types per mecenat type ──────────────────────────────────

const SOCIAL_TYPES: Record<MecenatType, SocialEvent['type'][]> = {
  brukspatron: ['jakt', 'bastu_affärssamtal'],
  skogsägare: ['jakt', 'middag'],
  it_miljonär: ['middag', 'vinkväll'],
  entrepreneur: ['hockeymatch', 'golfrunda'],
  fastigheter: ['middag', 'golfrunda'],
  lokal_handlare: ['middag', 'bastu_affärssamtal'],
  jordbrukare: ['jakt', 'middag'],
}

// ── Generate mecenat intro event ────────────────────────────────────────

export function generateMecenatIntroEvent(mecenat: Mecenat): GameEvent {
  const pro = mecenat.gender === 'female' ? { subj: 'Hon', poss: 'Hennes' } : { subj: 'Han', poss: 'Hans' }
  return {
    id: `event_mecenat_intro_${mecenat.id}`,
    type: 'patronEvent',
    title: `💼 ${mecenat.name} visar intresse`,
    sender: { name: mecenat.name, role: `${mecenat.business}` },
    body: `${mecenat.name} från ${mecenat.business} har hört om er förening.\n\n"${pro.subj === 'Hon' ? 'Jag har alltid haft ett hjärta för bandyn' : 'Jag har alltid brunnit för bandy'}. Ni gör ett fantastiskt jobb — ${pro.subj.toLowerCase()} vill hjälpa till."`,
    choices: [
      {
        id: 'welcome',
        label: 'Välkomna samarbetet',
        subtitle: `🤝 Mecenat-relation startar · 💰 ${Math.round(mecenat.contribution / 1000)} tkr/säsong`,
        effect: { type: 'patronHappiness', amount: 20 },
      },
      {
        id: 'cautious',
        label: 'Tack, men vi tar det lugnt',
        subtitle: '🤝 Relation startar försiktigt',
        effect: { type: 'patronHappiness', amount: 5 },
      },
      {
        id: 'decline',
        label: 'Vi klarar oss själva',
        subtitle: 'Ingen effekt. Mecenaten kan återkomma.',
        effect: { type: 'noOp' },
      },
    ],
    resolved: false,
  }
}

// ── Generate social event ───────────────────────────────────────────────

const SOCIAL_LABELS: Record<SocialEvent['type'], string> = {
  jakt: 'Älgjakt',
  middag: 'Middag',
  golfrunda: 'Golfrunda',
  bastu_affärssamtal: 'Bastu och affärssamtal',
  vinkväll: 'Vinprovning',
  segelbåt: 'Seglats',
  hockeymatch: 'Hockeymatch',
  vernissage: 'Vernissage',
}

const SOCIAL_BODIES: Record<SocialEvent['type'], (name: string) => string> = {
  jakt: (n) => `${n} har bjudit in dig på älgjakt i helgen. Tre dagar i skogen med några lokala företagare.\n\n"Det är ingen business, bara jakt. Men det vore trevligt om du kom."\n\n(Alla vet att det ÄR business.)`,
  middag: (n) => `${n} bjuder på middag hemma hos sig. "Inget stort, bara lite god mat och samtal om framtiden."`,
  golfrunda: (n) => `${n} föreslår en golfrunda på lördag. "Bra tillfälle att prata om nästa säsong."`,
  bastu_affärssamtal: (n) => `${n} bjuder in till bastun efter matchen. "Vi tar ett snack i lugn och ro."`,
  vinkväll: (n) => `${n} arrangerar en vinprovning. "Jag har fått in ett parti Barolo. Du måste smaka."`,
  segelbåt: (n) => `${n} föreslår en dag på sjön. "Tar ut båten om vädret håller."`,
  hockeymatch: (n) => `${n} har biljetter till hockeyn ikväll. "Följ med, det blir kul."`,
  vernissage: (n) => `${n} öppnar en utställning. "Min fru målar. Kom och visa er, det ser bra ut."`,
}

export function generateSocialEvent(mecenat: Mecenat, season: number, matchday: number, rand: () => number): GameEvent {
  const types = SOCIAL_TYPES[mecenat.businessType] ?? ['middag']
  const type = types[Math.floor(rand() * types.length)]
  const label = SOCIAL_LABELS[type]
  const body = SOCIAL_BODIES[type](mecenat.name)

  return {
    id: `event_social_${mecenat.id}_${season}_${matchday}`,
    type: 'patronEvent',
    title: `🤝 ${mecenat.name}: ${label}`,
    sender: { name: mecenat.name, role: mecenat.business },
    body,
    choices: [
      {
        id: 'accept',
        label: 'Tacka ja',
        subtitle: '🤝 +15 relation · ⏰ truppen missar en träningsdag',
        effect: { type: 'patronHappiness', amount: 15 },
      },
      {
        id: 'polite_decline',
        label: 'Tacka nej artigt',
        subtitle: '🤝 -5 relation · "Nästa gång kanske."',
        effect: { type: 'patronHappiness', amount: -5 },
      },
      {
        id: 'blunt_decline',
        label: 'Tacka nej rakt',
        subtitle: '🤝 -15 relation · "Jaha. Då vet jag."',
        effect: { type: 'patronHappiness', amount: -15 },
      },
    ],
    resolved: false,
  }
}

// ── Update silent shout per season ──────────────────────────────────────

export function updateSilentShout(mecenat: Mecenat): Mecenat {
  const shoutIncrease = Math.min(5, Math.floor(mecenat.totalContributed / 50000))
  return {
    ...mecenat,
    silentShout: Math.min(100, mecenat.silentShout + shoutIncrease),
    totalContributed: mecenat.totalContributed + mecenat.contribution,
  }
}

// ── Silent shout events — triggered at influence thresholds ─────────────

export function generateSilentShoutEvent(
  mecenat: Mecenat,
  playerName: string | undefined,
  rand: () => number,
): GameEvent | null {
  const ss = mecenat.silentShout

  // 30+: Media mentions
  if (ss >= 30 && ss < 50 && rand() < 0.15) {
    return {
      id: `event_shout_media_${mecenat.id}_${Date.now()}`,
      type: 'patronEvent',
      title: `📰 ${mecenat.name} i media`,
      sender: { name: mecenat.name, role: mecenat.business },
      body: `Lokaltidningen nämner ${mecenat.name} i en artikel om klubben.\n\n"Enligt uppgifter nära klubben ska ${mecenat.name} vara nöjd med säsongens utveckling."`,
      choices: [
        { id: 'ok', label: 'Noterat', subtitle: 'Inga effekter', effect: { type: 'noOp' } },
      ],
      resolved: false,
    }
  }

  // 50+: Transfer suggestion
  if (ss >= 50 && ss < 70 && playerName && rand() < 0.20) {
    return {
      id: `event_shout_transfer_${mecenat.id}_${Date.now()}`,
      type: 'patronEvent',
      title: `💰 ${mecenat.name} har ett förslag`,
      sender: { name: mecenat.name, role: mecenat.business },
      body: `${mecenat.name} ringer.\n\n"Jag hörde att det finns en spelare som hade passat er. Jag kan tänka mig att bidra med halva kostnaden."`,
      choices: [
        {
          id: 'accept',
          label: 'Intressant — berätta mer',
          subtitle: '🤝 +10 relation · 💰 mecenat bidrar',
          effect: { type: 'patronHappiness', amount: 10 },
        },
        {
          id: 'decline',
          label: 'Jag sköter värvningarna',
          subtitle: '🤝 -10 relation · oberoende',
          effect: { type: 'patronHappiness', amount: -10 },
        },
      ],
      resolved: false,
    }
  }

  // 70+: Tactic pressure
  if (ss >= 70 && ss < 90 && rand() < 0.15) {
    return {
      id: `event_shout_tactic_${mecenat.id}_${Date.now()}`,
      type: 'patronEvent',
      title: `⚠️ ${mecenat.name} har åsikter`,
      sender: { name: mecenat.name, role: mecenat.business },
      body: `${mecenat.name}: "Vi spelar för defensivt. Jag vill se anfall. Publiken vill se mål."`,
      choices: [
        {
          id: 'agree',
          label: 'Du har en poäng — vi ändrar',
          subtitle: '🤝 +15 relation · taktikpress',
          effect: { type: 'patronHappiness', amount: 15 },
        },
        {
          id: 'refuse',
          label: 'Taktiken bestämmer jag',
          subtitle: '🤝 -15 relation · "Jaha. Vi får se."',
          effect: { type: 'patronHappiness', amount: -15 },
        },
      ],
      resolved: false,
    }
  }

  // 90+: Board threat
  if (ss >= 90 && rand() < 0.20) {
    return {
      id: `event_shout_threat_${mecenat.id}_${Date.now()}`,
      type: 'patronEvent',
      title: `🔴 ${mecenat.name} hotar`,
      sender: { name: mecenat.name, role: mecenat.business },
      body: `${mecenat.name}: "Om det inte blir ändringar överväger jag att dra mig tillbaka. Styrelsen borde lyssna."`,
      choices: [
        {
          id: 'submit',
          label: 'Vi lyssnar — vad vill du?',
          subtitle: '🤝 +20 relation · silentShout ökar · kontrollfreak vinner',
          effect: { type: 'patronHappiness', amount: 20 },
        },
        {
          id: 'stand_firm',
          label: 'Klubben styrs av styrelsen, inte av dig',
          subtitle: '🤝 -30 relation · risk att mecenaten lämnar · men oberoende',
          effect: { type: 'patronHappiness', amount: -30 },
        },
      ],
      resolved: false,
    }
  }

  return null
}

// ── Mecenat conflict — two mecenater disagree ───────────────────────────

export function generateMecenatConflictEvent(
  mec1: Mecenat,
  mec2: Mecenat,
): GameEvent {
  return {
    id: `event_conflict_${mec1.id}_${mec2.id}`,
    type: 'patronEvent',
    title: `⚡ Konflikt: ${mec1.name} vs ${mec2.name}`,
    body: `${mec1.name} vill satsa på dyra värvningar. ${mec2.name} tycker ni ska fokusera på ungdomar.\n\nBåda väntar på ditt svar.`,
    choices: [
      {
        id: 'side_mec1',
        label: `Stöd ${mec1.name}`,
        subtitle: `🤝 ${mec1.name} +15 · ${mec2.name} -10`,
        effect: { type: 'patronHappiness', amount: 15 },
      },
      {
        id: 'side_mec2',
        label: `Stöd ${mec2.name}`,
        subtitle: `🤝 ${mec2.name} +15 · ${mec1.name} -10`,
        effect: { type: 'patronHappiness', amount: -10 },
      },
      {
        id: 'neutral',
        label: 'Medla — hitta en kompromiss',
        subtitle: '🤝 Båda +3 · ingen blir riktigt nöjd',
        effect: { type: 'patronHappiness', amount: 3 },
      },
    ],
    resolved: false,
  }
}

// ── Mecenat alliance — two mecenater cooperate ──────────────────────────

export function generateMecenatAllianceEvent(
  mec1: Mecenat,
  mec2: Mecenat,
  projectName: string,
): GameEvent {
  return {
    id: `event_alliance_${mec1.id}_${mec2.id}`,
    type: 'patronEvent',
    title: `🤝 ${mec1.name} & ${mec2.name} samarbetar`,
    body: `Både ${mec1.name} och ${mec2.name} har uttryckt intresse för att finansiera ${projectName}.\n\n"Vi kan dela på kostnaden om klubben tar resten."`,
    choices: [
      {
        id: 'accept',
        label: 'Fantastiskt — tack!',
        subtitle: '💰 projekt finansieras · 🤝 +10 båda',
        effect: { type: 'patronHappiness', amount: 10 },
      },
      {
        id: 'decline',
        label: 'Vi klarar oss själva',
        subtitle: '🤝 -5 båda',
        effect: { type: 'patronHappiness', amount: -5 },
      },
    ],
    resolved: false,
  }
}
