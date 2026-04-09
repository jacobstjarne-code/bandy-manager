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
    male: ['Tredje generationens bruksägare. Farfadern grundade sågverket.', 'Köpte bruket vid konkursen 2008. Vände det på tre år.'],
    female: ['Tog över efter fadern. Moderniserade hela produktionslinjen.', 'Skogsbolagets VD sedan 15 år. Känd för att hålla vad hon lovar.'],
  },
  skogsägare: {
    male: ['Äger 800 hektar skog norr om orten. Jagar älg varje höst.', 'Skogsmaskinsentreprenör som blev markägare. Pragmatisk.'],
    female: ['Ärvde skogen av mormodern. Driver den som ett modernt företag.', 'Biolog som blev skogsägare. Kombinerar naturvård med avverkning.'],
  },
  it_miljonär: {
    male: ['Sålde sin startup för 40 miljoner. Flyttade hem till orten.', 'Techbolag i Stockholm men hjärtat är kvar här.'],
    female: ['Grundade en SaaS-firma i garaget. Nu 30 anställda.', 'Lämnade Google för att bygga något eget. Tillbaka i bygden.'],
  },
  entrepreneur: {
    male: ['Äger tre bilhallar i länet. Sponsrar allt som rör sig.', 'Startade som lärling. Nu största byggfirman i kommunen.'],
    female: ['Driver regionens största eventbyrå. Vet hur man skapar stämning.', 'Från bageri till restaurangkedja. Affärssinne i blodet.'],
  },
  fastigheter: {
    male: ['Äger halva centrumkvarteret. Tyst men inflytelserik.', 'Byggde 200 lägenheter under 2010-talet. Kommunens största hyresvärd.'],
    female: ['Fastighetsmäklare som blev investerare. Känner varje hus i orten.', 'Arkitekt som blev byggherre. Formger ortens framtid.'],
  },
  lokal_handlare: {
    male: ['Tredje generationens ICA-handlare. Alla i orten känner honom.', 'Öppnade Handlarn när alla sa att det var omöjligt. Finns kvar.'],
    female: ['Driver ortens enda mataffär. Navet i bygden.', 'Tog över butiken från föräldrarna. Moderniserade och expanderade.'],
  },
  jordbrukare: {
    male: ['Mjölkbonde med 120 kor. Sponsrar P19 sedan 2018.', 'Spannmålsodlare som diversifierade. Nu också vindkraft.'],
    female: ['Driver ekologiskt jordbruk. Säljer direkt till restauranger i stan.', 'Mjölkbonde i tredje generationen. Envis och rak.'],
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
