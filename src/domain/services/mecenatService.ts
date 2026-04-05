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
  const isFemale = rand() < 0.3
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
