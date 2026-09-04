import type { Club } from '../entities/Club'
import type { Player } from '../entities/Player'
import type { Fixture } from '../entities/Fixture'
import type { StandingRow } from '../entities/SaveGame'
import { PlayerPosition, TacticMentality } from '../enums'
import { safeStandingPosition } from './standingsService'
import { deriveUtfall } from './matchTypeAxes'
import { stringHashUnsigned } from '../utils/random'

export interface OpponentAnalysis {
  opponentClubId: string
  fixtureId: string
  level: 'basic' | 'detailed'
  formation?: string
  style?: string
  strengths: string[]
  weaknesses: string[]
  recommendation?: string
  /** Yta 3 (Audit-syntes, 2026-07-07): recommendation mappad till en TacticMentality,
   *  så Analys→Taktik-bryggan kan markera den föreslagna knappen utan att TacticBoardCard
   *  behöver tolka fritext. undefined = "Jämn motståndare" — ingen falsk föreslagen knapp
   *  när analysen faktiskt inte lutar. Se mapRecommendationToMentality() nedan. */
  suggestedMentality?: TacticMentality
  recentForm?: string
  tablePosition?: number
  keyPlayers: { playerId: string; name: string; position: string; estimatedCA: number }[]
  /** B4 (BANDYSPRAK_KALLASNING_2026-08-19.md): "Vem är svårast att möta" — mallen
   *  ur sju elitspelarintervjuer är alltid ETT namn plus ETT skäl ("Christoffer
   *  Edlund... han är extremt bra på att åka och fiska efter bollar"), aldrig
   *  "de har farliga forwards". Bara i detaljerad analys, som strengths/weaknesses. */
  threatPlayer?: ThreatPlayer
}

/**
 * B4 — vilken spelaregenskap gör motståndarens huvudhot farlig. Mappas mot en
 * textvariant i THREAT_REASON_LINES (Opus levererar, se kommentaren där).
 * Fyra kategorier räcker för att täcka mallens exempel (hal/skridskor,
 * målnäsa/positionering, arbetsmyra/bollvinnare, spelvändare/passning) — fler
 * kategorier utan text bakom dem är bara fler tomma hål.
 */
export type ThreatReasonKey = 'evasive' | 'clinical' | 'relentless' | 'creative'

export interface ThreatPlayer {
  playerId: string
  name: string
  lastName: string
  position: string
  reasonKey: ThreatReasonKey
}

/**
 * B4: pekar konsekvent på SAMMA spelare för samma motståndarlag (domens krav
 * — "Edlund nämns av två oberoende spelare... analysen ska peka konsekvent på
 * samma spelare, inte slumpa"). Ren funktion av redan existerande attribut,
 * ingen slump: högst currentAbility bland tillgängliga (samma urvalsprincip
 * som keyPlayers) avgör VEM, det egna högsta relevanta attributet avgör VARFÖR.
 */
export function selectThreatPlayer(players: Player[]): ThreatPlayer | undefined {
  const available = players.filter(p => !p.isInjured && p.suspensionGamesRemaining <= 0)
  if (available.length === 0) return undefined

  const threat = [...available].sort((a, b) => b.currentAbility - a.currentAbility)[0]
  const a = threat.attributes

  const candidates: { key: ThreatReasonKey; value: number }[] = [
    { key: 'evasive', value: (a.skating + a.dribbling) / 2 },     // "riktigt hal"
    { key: 'clinical', value: (a.positioning + a.shooting) / 2 }, // "dyker upp varsomhelst och gör mål på allt"
    { key: 'relentless', value: (a.workRate + a.acceleration) / 2 }, // "åker mycket och fiskar bollar"
    { key: 'creative', value: (a.vision + a.passing) / 2 },       // spelvändare
  ]
  const reasonKey = candidates.sort((x, y) => y.value - x.value)[0].key

  return {
    playerId: threat.id,
    name: `${threat.firstName[0]}. ${threat.lastName}`,
    lastName: threat.lastName,
    position: threat.position,
    reasonKey,
  }
}

/**
 * B4-textraden — Opus levererade 2026-08-19. Formen är alltid densamma:
 * namnet, vad han gör, och varför det är ditt problem. Assistenten talar.
 * `{Efternamn}` interpolerar mot ThreatPlayer.lastName.
 */
export const THREAT_REASON_LINES: Record<ThreatReasonKey, string[]> = {
  evasive: [
    '{Efternamn} är riktigt hal. Får du tag i honom en gång ska du vara nöjd.',
    'Ni kommer inte kunna gå på {Efternamn}. Han är borta innan klubban är framme.',
    '{Efternamn} åker som om isen lutar åt hans håll. Håll er mellan honom och målet.',
    'Jaga inte {Efternamn}. Håll zonen tät och låt honom få bollen där han inte gör skada.',
  ],
  clinical: [
    '{Efternamn} dyker upp varsomhelst och gör mål på allt.',
    'Ger ni {Efternamn} ett halvt läge så ligger den inne.',
    '{Efternamn} rör sig inte mycket. Han står bara alltid rätt.',
    'Ha alltid någon i {Efternamn}s zon i straffområdet. Att stå rätt där är hela hans jobb.',
  ],
  relentless: [
    '{Efternamn} fiskar bollar hela matchen. Han ger sig aldrig på en förlorad situation.',
    '{Efternamn} åker mer än någon annan i deras lag. Han är där ni inte väntar er honom.',
    'Slarvar ni med en passning tar {Efternamn} den. Han jagar allt.',
    '{Efternamn} orkar nittio minuter. Frågan är om ni gör det.',
  ],
  creative: [
    '{Efternamn} ser hela planen. Stänger ni ena sidan hittar han den andra.',
    'Det är {Efternamn} som vänder deras spel. Får han vara rättvänd är ni sena.',
    '{Efternamn} behöver inte åka någonstans. Han flyttar er med bollen i stället.',
    'Låt inte {Efternamn} få tid. Han hittar en passning ni inte ser.',
  ],
}

/**
 * Deterministiskt val ur poolen (spelar-id som seed) — samma spelare + samma
 * reasonKey ger alltid samma rad, oavsett hur många gånger analysen öppnas
 * (Jacobs villkor 2026-08-19: "stabil per match, inte per rendering... annars
 * läser det som brus"). {Efternamn} interpolerad in i vald rad.
 */
export function displayThreatReasonLine(threat: ThreatPlayer): string | undefined {
  const pool = THREAT_REASON_LINES[threat.reasonKey]
  if (!pool || pool.length === 0) return undefined
  const hash = stringHashUnsigned(threat.playerId)
  return pool[hash % pool.length].replaceAll('{Efternamn}', threat.lastName)
}

/**
 * Yta 3 (Audit-syntes, 2026-07-07): enda källan för recommendation → TacticMentality.
 * Testbar isolerat från resten av analysgenereringen. Bara de tre riktade
 * rekommendationerna ger ett förslag — "Jämn motståndare" ger avsiktligt undefined.
 *
 * Balanced har MEDVETET ingen väg in — jämn motståndare föreslår ingenting (Fables
 * textdömning 2026-07-07: en falsk "Balanserad föreslås"-pill hade sagt att assistenten
 * har en åsikt när den inte har det, värre än ingen pill alls). Två rekommendationer
 * mappar till Offensive, en till Defensive — det är en spegling av analystjänstens
 * egen recommendation-logik (fler offensiva utfall), inte en design-obalans. Lägger
 * någon till en balans-rekommendation i generateDetailedAnalysis utan att uppdatera
 * denna funktion faller den tyst till undefined — det är rätt reservläge, men om
 * avsikten var en Balanced-väg, uppdatera HÄR, inte bara i analysgenereringen.
 */
export function mapRecommendationToMentality(recommendation: string | undefined): TacticMentality | undefined {
  if (recommendation === 'Pressa högt och dominera mitten.') return TacticMentality.Offensive
  if (recommendation === 'Spela offensivt — deras försvar är sårbart.') return TacticMentality.Offensive
  if (recommendation === 'Prioritera defensiven — de har farliga forwards.') return TacticMentality.Defensive
  return undefined
}

/**
 * Yta 3 textleverans (Fable, 2026-07-07): varför-raden under SPELSTIL-knapparna.
 * En variant per aktiv recommendation, assistentens röst (Sixten-registret — kort,
 * konkret, understatement). Namnger vad assistenten SÅG, inte en order — "Stå stadigt
 * först" i defensivfallet bär avsiktligt att det är en start, inte ett låst läge.
 * "Jämn motståndare"-fallet har ingen rad här — det gates redan bort i presentations-
 * lagret via suggestedMentality===undefined, aldrig ett saknat-mall-fall.
 */
const RECOMMENDATION_WHY_LINE: Record<string, (coachName: string) => string> = {
  'Pressa högt och dominera mitten.': (coach) =>
    `${coach} såg det: deras halvlinje är tunn. Pressa högt, ta mitten.`,
  'Spela offensivt — deras försvar är sårbart.': (coach) =>
    `${coach} såg en spricka i deras försvar. Våga framåt.`,
  'Prioritera defensiven — de har farliga forwards.': (coach) =>
    `${coach} varnar för deras forwards. Stå stadigt först.`,
}

/** Yta 3: recommendation + assistentens namn → varför-raden. undefined om ingen
 *  aktiv rekommendation mappar (inkl. "Jämn motståndare", som aldrig ska ha en rad). */
export function getSuggestionWhyLine(recommendation: string | undefined, coachName: string): string | undefined {
  if (!recommendation) return undefined
  const template = RECOMMENDATION_WHY_LINE[recommendation]
  return template ? template(coachName) : undefined
}

export function generateBasicAnalysis(
  opponentClub: Club,
  opponentPlayers: Player[],
  standings: StandingRow[],
  fixtures: Fixture[],
  fixtureId: string,
): OpponentAnalysis {
  const sorted = [...opponentPlayers]
    .filter(p => !p.isInjured)
    .sort((a, b) => b.currentAbility - a.currentAbility)

  const keyPlayers = sorted.slice(0, 3).map(p => ({
    playerId: p.id,
    name: `${p.firstName[0]}. ${p.lastName}`,
    position: p.position,
    estimatedCA: Math.round(p.currentAbility / 5) * 5,
  }))

  const recentResults = fixtures
    .filter(f => f.status === 'completed' &&
      (f.homeClubId === opponentClub.id || f.awayClubId === opponentClub.id))
    .sort((a, b) => b.matchday - a.matchday)
    .slice(0, 5)

  const recentWins = recentResults.filter(f => {
    return deriveUtfall(f, opponentClub.id) === 'vunnet'
  }).length

  const recentForm = recentResults.length === 0 ? 'Okänd form'
    : recentWins >= 4 ? 'Stark form'
    : recentWins >= 2 ? 'Ojämn form'
    : 'Svag form'

  return {
    opponentClubId: opponentClub.id,
    fixtureId,
    level: 'basic',
    strengths: [],
    weaknesses: [],
    recentForm,
    // LÄST-FÖRE-INITIERING (PASTAENDEKARTAN, 2026-08-26): safeStandingPosition
    // ger undefined om motståndaren ännu inte spelat en ligamatch denna
    // säsong, istf en cachad alfabetisk skuggposition som annars satt kvar
    // i scoutrapporten tills klubben scoutas om.
    tablePosition: safeStandingPosition(standings, opponentClub.id) ?? undefined,
    keyPlayers,
  }
}

export function generateDetailedAnalysis(
  opponentClub: Club,
  opponentPlayers: Player[],
  standings: StandingRow[],
  fixtures: Fixture[],
  fixtureId: string,
): OpponentAnalysis {
  const basic = generateBasicAnalysis(opponentClub, opponentPlayers, standings, fixtures, fixtureId)

  const available = opponentPlayers.filter(p => !p.isInjured && p.suspensionGamesRemaining <= 0)
  const avgCA = available.length > 0
    ? available.reduce((s, p) => s + p.currentAbility, 0) / available.length
    : 50

  const avgByPos = (pos: PlayerPosition[]) => {
    const group = available.filter(p => pos.includes(p.position as PlayerPosition))
    return group.length > 0 ? group.reduce((s, p) => s + p.currentAbility, 0) / group.length : 0
  }

  const gkAvg = avgByPos([PlayerPosition.Goalkeeper])
  const defAvg = avgByPos([PlayerPosition.Defender])
  const midAvg = avgByPos([PlayerPosition.Midfielder])
  const fwdAvg = avgByPos([PlayerPosition.Forward])

  const strengths: string[] = []
  const weaknesses: string[] = []

  if (fwdAvg > avgCA + 5) strengths.push('Stark anfallslinje')
  if (defAvg > avgCA + 5) strengths.push('Stabilt försvar')
  if (gkAvg > avgCA + 8) strengths.push('Bra målvakt')
  if (midAvg > avgCA + 5) strengths.push('Stark halvlinje')

  if (fwdAvg > 0 && fwdAvg < avgCA - 5) weaknesses.push('Svag attack')
  if (defAvg > 0 && defAvg < avgCA - 5) weaknesses.push('Sårbart försvar')
  if (midAvg > 0 && midAvg < avgCA - 5) weaknesses.push('Svag halvlinje')

  const injured = opponentPlayers.filter(p => p.isInjured)
  if (injured.length >= 3) weaknesses.push(`Skadeproblem (${injured.length} skadade)`)

  let recommendation = 'Jämn motståndare. Spelplanen avgör.'
  if (weaknesses.some(w => w.includes('Svag halvlinje'))) {
    recommendation = 'Pressa högt och dominera mitten.'
  } else if (weaknesses.some(w => w.includes('Sårbart försvar'))) {
    recommendation = 'Spela offensivt — deras försvar är sårbart.'
  } else if (strengths.some(s => s.includes('Stark anfallslinje'))) {
    recommendation = 'Prioritera defensiven — de har farliga forwards.'
  }

  const styleLabel: Record<string, string> = {
    defensive: 'Defensiv',
    balanced: 'Balanserad',
    attacking: 'Offensiv',
    physical: 'Fysisk',
    technical: 'Teknisk',
  }

  return {
    ...basic,
    level: 'detailed',
    formation: opponentClub.activeTactic.formation ?? '532_tvatoppar',
    style: styleLabel[opponentClub.preferredStyle] ?? opponentClub.preferredStyle,
    strengths,
    weaknesses,
    recommendation,
    suggestedMentality: mapRecommendationToMentality(recommendation),
    threatPlayer: selectThreatPlayer(available),
    keyPlayers: available
      .sort((a, b) => b.currentAbility - a.currentAbility)
      .slice(0, 5)
      .map(p => ({
        playerId: p.id,
        name: `${p.firstName[0]}. ${p.lastName}`,
        position: p.position,
        estimatedCA: Math.round(p.currentAbility),
      })),
  }
}
