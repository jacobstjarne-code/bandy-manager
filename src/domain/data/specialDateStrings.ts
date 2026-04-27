import { mulberry32 } from '../utils/random'

export interface SpecialDateContext {
  isHomePlayer: boolean
  homeClubName: string
  awayClubName: string
  arenaName: string
  venueCity: string
  isDerby?: boolean
  rivalryName?: string
  tipoffHour?: string   // e.g. "13:00"
  isUnderdog?: boolean
  hasJourneyToFinal?: boolean
}

function pickVariant<T>(pool: T[], season: number, matchday: number): T {
  const rand = mulberry32(season * 1000 + matchday)
  return pool[Math.floor(rand() * pool.length)]
}

function substitute(template: string, ctx: Record<string, string | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => ctx[key] ?? `{${key}}`)
}

// ── ANNANDAGSBANDY ────────────────────────────────────────────────────────────

export const ANNANDAGSBANDY_COMMENTARY: string[] = [
  'Annandag jul. Klubbhuset doftar fortfarande av igårkvällens skinka.',
  'Det är 26 december. Halva publiken har julgrans-barr på jackorna.',
  'Familjeråd före match: morfar tog tåget hit i morse, brorsan hade fått ledigt från jobbet i Stockholm. Hela släkten är på plats.',
  'Annandagsbandy. Termosen är fylld med kaffe från frukosten, smörgåsen ligger kvar i fickan från 11-fikat.',
  'Det luktar tända marschaller och pepparkaka. Klacken har dragit igång den första sången redan i kön till entrén.',
]

export const ANNANDAGSBANDY_BRIEFING: string[] = [
  '🎄 Annandagen. {arenaName} ska gå varm i dag.',
  '🎄 26 december. Derbyt mot {opponentName} klockan 13:15. Plogen har gått sedan klockan sex i morse.',
  '🎄 Annandagsbandy mot {opponentName}. Hela bygden samlas, även de som inte brukar gå på match.',
  '🎄 Det är annandag jul. {arenaName} fylls av folk som behöver komma ut ur sina hem.',
  '🎄 Annandagen — {rivalryName}. Året ska ha en till topp innan det är över.',
]

export function annandagsbandyBriefing(ctx: SpecialDateContext, season: number, matchday: number): string {
  const template = pickVariant(ANNANDAGSBANDY_BRIEFING, season, matchday)
  return substitute(template, {
    opponentName: ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName,
    arenaName: ctx.arenaName,
    rivalryName: ctx.rivalryName ?? 'Derbyt',
  })
}

export function annandagsbandyInbox(ctx: SpecialDateContext): { subject: string; body: string } {
  const opponent = ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName
  const venue = ctx.isHomePlayer
    ? `hemma på ${ctx.arenaName}`
    : `borta i ${ctx.venueCity}`
  return {
    subject: `Annandagsbandy mot ${opponent}`,
    body: `Den traditionella annandagsmatchen spelas ${venue} klockan 13:15. ${ctx.rivalryName ?? 'Derbyt'} drar i år förmodligen mer folk än vanlig omgångsmatch — räkna med kaffekö i pausen och tidig parkering. Plogen är beställd från klockan sex.`,
  }
}

// ── NYÅRSBANDY ────────────────────────────────────────────────────────────────

export const NYARSBANDY_COMMENTARY: string[] = [
  '31 december. Klockan rinner på, men just nu står den stilla över {arenaName}.',
  'Nyårsafton. Halva publiken har bokat bord till middagen klockan sex. Andra halvan har ingen middag bokad alls.',
  'Det är sista dagen på året. Någon i klacken har redan tänt en tomtebloss.',
  'Nyårsbandy. Lite uppgivet, lite festligt — som året självt vid det här laget.',
  'Sista matchen för året. Domarens visselpipa låter likadant som den ska låta vid midnatt om åtta timmar.',
]

export const NYARSBANDY_BRIEFING: string[] = [
  '🎆 Nyårsafton. Match klockan {tipoffHour}, midnatt klockan tolv. Båda går fort.',
  '🎆 Det är 31 december och det spelas bandy på {arenaName}. Det är inte normalt, men i år är det så.',
  '🎆 Nyårsbandy mot {opponentName}. Folk kommer i jackor och tänker på middagen sen.',
  '🎆 Sista matchen för året. Tabellen ska se ut på ett visst sätt när det nya året börjar.',
  '🎆 Nyårsafton-bandy. Säsongens bisarraste schemaläggning.',
]

export function nyarsbandyBriefing(ctx: SpecialDateContext, season: number, matchday: number): string {
  const template = pickVariant(NYARSBANDY_BRIEFING, season, matchday)
  return substitute(template, {
    tipoffHour: ctx.tipoffHour ?? '13:00',
    arenaName: ctx.arenaName,
    opponentName: ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName,
  })
}

// ── SM-FINALDAG ───────────────────────────────────────────────────────────────

export const FINALDAG_COMMENTARY_PLAYING: string[] = [
  'SM-final. Det är vad allt gått ut på. Hela säsongen samlas i de här 90 minuterna.',
  'Tredje lördagen i mars. {arenaName} är finalplats och {homeClubName} är där. Det är inte en vanlig match. Det är inte ens en derby. Det är finalen.',
  'Det är finaldag. Något i benen vet det redan innan domaren blåser igång.',
]

export const FINALDAG_BRIEFING_PLAYING: string[] = [
  '🏆 SM-FINAL. {opponentName}, {arenaName}, klockan 13:15. Hela säsongen är det här.',
  '🏆 Finaldagen. Det finns inte mycket att säga. Spelarna vet vad det är.',
  '🏆 Idag är det final. Bygden har bussat hit. Halva orten är på plats.',
]

// Spectator: only one variant (drop the {N} variant per Jacob's directive)
export const FINALDAG_BRIEFING_SPECTATOR: string[] = [
  '🏆 SM-finalen i dag: {homeClubName} mot {awayClubName}. Vi är inte där. Inte i år.',
]

export function finaldagBriefingPlaying(ctx: SpecialDateContext, season: number, matchday: number): string {
  const template = pickVariant(FINALDAG_BRIEFING_PLAYING, season, matchday)
  return substitute(template, {
    opponentName: ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName,
    arenaName: ctx.arenaName,
  })
}

export function finaldagBriefingSpectator(ctx: SpecialDateContext, season: number, matchday: number): string {
  const template = pickVariant(FINALDAG_BRIEFING_SPECTATOR, season, matchday)
  return substitute(template, {
    homeClubName: ctx.homeClubName,
    awayClubName: ctx.awayClubName,
  })
}

export function finaldagInboxPlaying(ctx: SpecialDateContext): { subject: string; body: string } {
  const opponent = ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName
  const role = ctx.isUnderdog ? 'Underläge på pappret. Allt att vinna.' : 'Favorit på pappret. Inget att förlora?'
  return {
    subject: `SM-final mot ${opponent}`,
    body: `Tredje lördagen i mars. ${ctx.arenaName} är spelplats för bandyårets sista match. ${role} Det är finalen — det går inte att förbereda mer än man redan gjort.`,
  }
}

export function finaldagInboxSpectator(ctx: SpecialDateContext): { subject: string; body: string } {
  return {
    subject: 'SM-finalen avgörs i dag',
    body: `${ctx.homeClubName} mot ${ctx.awayClubName} på ${ctx.arenaName}. Inte vår final i år. Säsongen är över för oss — finalen påminner om det.`,
  }
}

// ── CUP-FINALHELGEN ───────────────────────────────────────────────────────────

export const CUPFINAL_COMMENTARY_PLAYING: string[] = [
  'Cup-final. Säsongens första titel ligger på det här. Det doftar fortfarande sensommar i luften.',
  'Det är oktober och {arenaName} står som finalarena. {homeClubName} är här — det är inte alla år man kan säga det.',
  'Cup-finalen. Tre matcher har lett hit. Den fjärde avgör allt.',
]

export const CUPFINAL_BRIEFING_PLAYING: string[] = [
  '🏆 Cup-final i dag. {opponentName}, {arenaName}, klockan 14. Säsongens första riktiga match.',
  '🏆 Vi spelar cup-final. Det här är en sån match som folk minns även om de glömmer placeringen i serien.',
  '🏆 Cup-finalen. {journeyLine}',
]

export const CUPFINAL_BRIEFING_SPECTATOR: string[] = [
  '🏆 Cup-finalhelgen pågår. {homeClubName} mot {awayClubName}. Vi följer från sidan i år.',
  '🏆 Det är cup-final i {venueCity}. Bandyåret tar fart utan oss i finalen.',
]

export function cupFinalBriefingPlaying(ctx: SpecialDateContext, season: number, matchday: number): string {
  const template = pickVariant(CUPFINAL_BRIEFING_PLAYING, season, matchday)
  return substitute(template, {
    opponentName: ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName,
    arenaName: ctx.arenaName,
    journeyLine: ctx.hasJourneyToFinal ? 'Tre rundor och inga förluster — nu sista.' : 'Vi är här.',
  })
}

export function cupFinalBriefingSpectator(ctx: SpecialDateContext, season: number, matchday: number): string {
  const template = pickVariant(CUPFINAL_BRIEFING_SPECTATOR, season, matchday)
  return substitute(template, {
    homeClubName: ctx.homeClubName,
    awayClubName: ctx.awayClubName,
    venueCity: ctx.venueCity,
  })
}

export function cupFinalInboxPlaying(ctx: SpecialDateContext): { subject: string; body: string } {
  const opponent = ctx.isHomePlayer ? ctx.awayClubName : ctx.homeClubName
  const path = ctx.hasJourneyToFinal
    ? 'Tre cup-matcher, tre vinster. Nu finalen.'
    : 'Vi är i cup-finalen.'
  return {
    subject: `Cup-final mot ${opponent}`,
    body: `Cup-finalen spelas på ${ctx.arenaName} klockan 14. ${path} Det är säsongens första titel som står på spel — innan ligan ens börjat.`,
  }
}

// Cup-final spectator inbox: SKIPPED per design — inte relevant att maila
// spelaren om en final som inte berör deras klubb.

// ── COMMENTARY HELPER (live match, managed club always playing) ───────────────

export function pickSpecialDateCommentary(
  type: 'annandagen' | 'nyarsbandy' | 'finaldag' | 'cupfinal',
  ctx: { arenaName: string; homeClubName: string; awayClubName: string },
  season: number,
  matchday: number,
): string {
  switch (type) {
    case 'annandagen': {
      return pickVariant(ANNANDAGSBANDY_COMMENTARY, season, matchday)
    }
    case 'nyarsbandy': {
      const template = pickVariant(NYARSBANDY_COMMENTARY, season, matchday)
      return substitute(template, { arenaName: ctx.arenaName })
    }
    case 'finaldag': {
      const template = pickVariant(FINALDAG_COMMENTARY_PLAYING, season, matchday)
      return substitute(template, { arenaName: ctx.arenaName, homeClubName: ctx.homeClubName })
    }
    case 'cupfinal': {
      const template = pickVariant(CUPFINAL_COMMENTARY_PLAYING, season, matchday)
      return substitute(template, { arenaName: ctx.arenaName, homeClubName: ctx.homeClubName })
    }
  }
}
