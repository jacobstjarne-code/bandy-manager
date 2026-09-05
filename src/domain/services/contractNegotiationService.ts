import type { Player } from '../entities/Player'
import type { SaveGame, Sponsor } from '../entities/SaveGame'
import type { Patron } from '../entities/Community'
import type { Club } from '../entities/Club'
import { getResolvedStorylineProjections } from './storylineLedgerService'

export interface ContractSalaryRange {
  min: number
  max: number
}

export interface ContractOfferResult {
  accepted: boolean
  counterSalary?: number
  /** SPEC_FORHANDLING_TERMER_2026-09-04 §4.3 — avslag föreslår en TERM i
   *  stället för bara en siffra när en tillgänglig, oerbjuden term skulle
   *  räcka. `counterSalary` sätts INTE när `counterTerm` finns (mallen
   *  väljer en av två avslagsformer per svar, se §6 reaktioner). */
  counterTerm?: ContractTermKey
}

function roundSalary(value: number): number {
  return Math.max(1_000, Math.round(value / 1_000) * 1_000)
}

/**
 * Spelarens synliga löneanspråk är medvetet ett spann. Den kanoniska
 * minlönen är marknadens mittpunkt, inte ett facit som förhandlingsytan ska
 * avslöja före budet.
 */
export function getContractSalaryRange(minSalary: number): ContractSalaryRange {
  return {
    min: roundSalary(minSalary * 0.95),
    max: roundSalary(minSalary * 1.15),
  }
}

/**
 * Kontraktslängden är en riktig del av erbjudandet: ett kort kontrakt kräver
 * mer lön, medan tre års trygghet kan kompensera för en något lägre nivå.
 * Spelarens personlighet flyttar kravet, men aldrig utanför det kommunicerade
 * spannet.
 */
export function getRequiredContractSalary(
  player: Pick<Player, 'transferPersonality'>,
  minSalary: number,
  years: number,
): number {
  const lengthFactor = years <= 1 ? 1.10 : years >= 3 ? 0.95 : 1
  const personalityFactor = player.transferPersonality === 'ambitious'
    ? 1.05
    : player.transferPersonality === 'homebound' || player.transferPersonality === 'family'
      ? 0.98
      : 1
  const range = getContractSalaryRange(minSalary)
  return Math.max(range.min, Math.min(range.max, roundSalary(minSalary * lengthFactor * personalityFactor)))
}

// ── C-T8: Förhandlingens termer (SPEC_FORHANDLING_TERMER_2026-09-04) ────────
//
// Förhandlingen hade två reglage (lön, år). Fyra termer läggs till, alla ur
// bandyns verklighet (§1). Varje term har ett `clubCost` (vad klubben betalar,
// utanför lönebudgeten för jobb/ansikte) och ett `playerValue` (vad spelaren
// värderar den till i kr/mån-ekvivalent) — INTE samma tal (§2), det är det som
// gör förhandlingen till ett spel. Alla tal nedan är startvärden (§2, sista
// meningen) — mäts i kalibreringsrundan, ändras bara efter ny dom.

export type ContractTermKey = 'signOnBonus' | 'housing' | 'jobGuarantee' | 'imageRights'

export interface ContractTermOffer {
  /** Engångsbelopp i kr, steg om 10 tkr (§3A). */
  signOnKr?: number
  housing?: boolean
  jobGuarantee?: { sponsorId: string }
  imageRights?: { sponsorId: string }
}

export const SIGN_ON_STEP_KR = 10_000
export const HOUSING_CLUB_COST_MONTHLY_KR = 3_000
export const JOB_GUARANTEE_PLAYER_VALUE_BASE_KR = 4_000
export const JOB_GUARANTEE_SPONSOR_CAPACITY = 2
export const JOB_GUARANTEE_PATRON_CAPACITY = 3
export const IMAGE_RIGHTS_PLAYER_VALUE_BASE_KR = 2_000
export const IMAGE_RIGHTS_SPONSOR_INCOME_CUT = 0.10
export const IMAGE_RIGHTS_CA_THRESHOLD = 55

type PersonalityWeights = { ambitious: number; homebound: number; family: number; standard: number }

/** `dream_club`/`default`/frånvarande personlighet faller alla på `standard` —
 *  specen namnger bara ambitious/homebound/family per term (§3). */
function personalityFactor(personality: Player['transferPersonality'] | undefined, w: PersonalityWeights): number {
  if (personality === 'ambitious') return w.ambitious
  if (personality === 'homebound') return w.homebound
  if (personality === 'family') return w.family
  return w.standard
}

/** §3A — en ambitiös spelare vill ha pengarna nu; en familjeperson räknar per månad. */
function signOnBonusPlayerValue(bonusKr: number, years: number, personality: Player['transferPersonality'] | undefined): number {
  if (bonusKr <= 0 || years <= 0) return 0
  return (bonusKr / (12 * years)) * personalityFactor(personality, { ambitious: 1.3, homebound: 0.8, family: 0.8, standard: 1.0 })
}

/** §3B — 0 om spelaren redan bor här (homegrown eller `lokal`-trait); annars
 *  en familj värderar lägenheten över dess pris, en ambitiös ser en bruksort. */
function housingPlayerValue(player: Pick<Player, 'isHomegrown' | 'trait' | 'transferPersonality'>): number {
  if (player.isHomegrown || player.trait === 'lokal') return 0
  return HOUSING_CLUB_COST_MONTHLY_KR * personalityFactor(player.transferPersonality, { family: 1.5, homebound: 1.4, standard: 1.2, ambitious: 0.9 })
}

/** §3C — redan heltidsproffs värderar den till 0 (han har redan det jobbet
 *  löser); en ambitiös vill spela, inte arbeta. */
function jobGuaranteePlayerValue(player: Pick<Player, 'isFullTimePro' | 'transferPersonality'>): number {
  if (player.isFullTimePro) return 0
  return JOB_GUARANTEE_PLAYER_VALUE_BASE_KR * personalityFactor(player.transferPersonality, { family: 1.3, homebound: 1.2, standard: 1.0, ambitious: 0.5 })
}

/** §3D — profil-gaten (CA≥55/kapten/lokal_hero) avgör om termen ERBJUDS alls
 *  (se `getAvailableContractTerms`), inte värdet här — en redan erbjuden
 *  ansiktesterm förutsätter att profilen är sann. */
function imageRightsPlayerValue(personality: Player['transferPersonality'] | undefined): number {
  return IMAGE_RIGHTS_PLAYER_VALUE_BASE_KR * personalityFactor(personality, { ambitious: 1.4, standard: 1.0, homebound: 0.9, family: 0.8 })
}

interface TermValues {
  key: ContractTermKey
  playerValue: number
}

/** En rad per FAKTISKT erbjuden term (§4.2 — `effective = salary + Σ playerValue`). */
function offeredTermValues(
  player: Pick<Player, 'isHomegrown' | 'trait' | 'transferPersonality' | 'isFullTimePro'>,
  terms: ContractTermOffer,
  years: number,
): TermValues[] {
  const rows: TermValues[] = []
  if (terms.signOnKr) rows.push({ key: 'signOnBonus', playerValue: signOnBonusPlayerValue(terms.signOnKr, years, player.transferPersonality) })
  if (terms.housing) rows.push({ key: 'housing', playerValue: housingPlayerValue(player) })
  if (terms.jobGuarantee) rows.push({ key: 'jobGuarantee', playerValue: jobGuaranteePlayerValue(player) })
  if (terms.imageRights) rows.push({ key: 'imageRights', playerValue: imageRightsPlayerValue(player.transferPersonality) })
  return rows
}

function isTermOffered(key: ContractTermKey, terms: ContractTermOffer): boolean {
  if (key === 'signOnBonus') return !!terms.signOnKr
  if (key === 'housing') return !!terms.housing
  if (key === 'jobGuarantee') return !!terms.jobGuarantee
  return !!terms.imageRights
}

/**
 * §4.3 — motbudet föreslår den term med högst `playerValue` som klubben inte
 * redan erbjudit och som är tillgänglig. Ingen sådan → null (motbud i lön
 * som idag). Handpenningens referensvärde (för RANGORDNING när ingen exakt
 * summa erbjudits än) använder `minSalary` som en typisk handpenning — en
 * kalibreringsrundans att skärpa, inte en spelarsynlig siffra.
 */
export function suggestCounterTerm(
  player: Pick<Player, 'isHomegrown' | 'trait' | 'transferPersonality' | 'isFullTimePro'>,
  minSalary: number,
  years: number,
  offeredTerms: ContractTermOffer,
  availableTerms: ContractTermKey[],
): ContractTermKey | null {
  const candidates = availableTerms.filter(key => !isTermOffered(key, offeredTerms))
  if (candidates.length === 0) return null

  const referenceValue: Record<ContractTermKey, number> = {
    signOnBonus: signOnBonusPlayerValue(minSalary, years, player.transferPersonality),
    housing: housingPlayerValue(player),
    jobGuarantee: jobGuaranteePlayerValue(player),
    imageRights: imageRightsPlayerValue(player.transferPersonality),
  }

  let best: ContractTermKey | null = null
  for (const key of candidates) {
    if (referenceValue[key] <= 0) continue
    if (best === null || referenceValue[key] > referenceValue[best]) best = key
  }
  return best
}

/**
 * §3D — kräver en aktiv sponsor + profil (CA≥55, kapten, eller en aktiv
 * `lokal_hero_moment`-resolution denna säsong). "Aktiv" tolkas som resolverad
 * INNEVARANDE säsong (samma tidsfönster `getResolvedStorylineProjections`
 * redan använder för säsongsvisa återblickar) — ingen ny "hur länge räknas en
 * resolution som aktiv"-mekanik uppfanns för detta.
 */
export function isImageRightsEligible(
  game: Pick<SaveGame, 'captainPlayerId' | 'currentSeason'> & Parameters<typeof getResolvedStorylineProjections>[0],
  player: Pick<Player, 'id' | 'currentAbility'>,
): boolean {
  if (player.currentAbility >= IMAGE_RIGHTS_CA_THRESHOLD) return true
  if (game.captainPlayerId === player.id) return true
  const resolved = getResolvedStorylineProjections(game, game.currentSeason)
  return resolved.some(s => s.type === 'lokal_hero_moment' && (s.playerId === player.id || s.playerIds?.includes(player.id)))
}

function hasJobCapacity(entity: Pick<Sponsor, 'jobsUsedThisSeason'> | Pick<Patron, 'jobsUsedThisSeason'>, capacity: number): boolean {
  return (entity.jobsUsedThisSeason ?? 0) < capacity
}

/** §3C — sponsorer (kapacitet 2) + patron (kapacitet 3, räknas som en sponsor
 *  med högre kapacitet). Bara aktiva sponsorer (`contractRounds > 0`, samma
 *  villkor sponsorProcessor.ts redan filtrerar leaving sponsors på). */
export function getJobGuaranteeCapableSponsorIds(game: Pick<SaveGame, 'sponsors' | 'patron'>): string[] {
  const ids: string[] = []
  for (const sponsor of game.sponsors ?? []) {
    if (sponsor.contractRounds > 0 && hasJobCapacity(sponsor, JOB_GUARANTEE_SPONSOR_CAPACITY)) ids.push(sponsor.id)
  }
  if (game.patron?.isActive && hasJobCapacity(game.patron, JOB_GUARANTEE_PATRON_CAPACITY)) ids.push(game.patron.id)
  return ids
}

/**
 * §3 — vilka av de fyra termerna kan överhuvudtaget ERBJUDAS just nu.
 * Handpenning kräver kassa ≥ minsta steget (10 tkr); boende är alltid
 * tillgängligt i v1; jobb kräver ledig sponsor-/patronkapacitet; ansikte
 * kräver en aktiv sponsor OCH profil.
 */
export function getAvailableContractTerms(
  game: Pick<SaveGame, 'sponsors' | 'patron' | 'captainPlayerId' | 'currentSeason'> & Parameters<typeof getResolvedStorylineProjections>[0],
  club: Pick<Club, 'finances'>,
  player: Pick<Player, 'id' | 'currentAbility'>,
): ContractTermKey[] {
  const keys: ContractTermKey[] = []
  if (club.finances >= SIGN_ON_STEP_KR) keys.push('signOnBonus')
  keys.push('housing')
  if (getJobGuaranteeCapableSponsorIds(game).length > 0) keys.push('jobGuarantee')
  const hasActiveSponsor = (game.sponsors ?? []).some(s => s.contractRounds > 0)
  if (hasActiveSponsor && isImageRightsEligible(game, player)) keys.push('imageRights')
  return keys
}

export interface ContractTermSponsorRefs {
  jobGuaranteeSponsor?: { id: string; name: string }
  imageRightsSponsor?: { id: string; name: string }
}

/**
 * §5 UI — vilken sponsor/patron chipsen ska peka på. UI:t erbjuder inte ett
 * val mellan flera kapabla sponsorer (§3C/§3D nämner ingen sådan väljare) —
 * en delad slå-upp-funktion så RenewContractModal och BidModal (freeAgent)
 * inte implementerar samma "första kapabla sponsor"-logik två gånger.
 */
export function resolveContractTermSponsors(game: Pick<SaveGame, 'sponsors' | 'patron'>): ContractTermSponsorRefs {
  const jobGuaranteeSponsorId = getJobGuaranteeCapableSponsorIds(game)[0]
  const jobGuaranteeSponsor = jobGuaranteeSponsorId
    ? (game.patron?.id === jobGuaranteeSponsorId
        ? { id: jobGuaranteeSponsorId, name: game.patron.name }
        : (game.sponsors ?? []).find(s => s.id === jobGuaranteeSponsorId))
    : undefined
  const imageRightsSponsorEntity = (game.sponsors ?? []).find(s => s.contractRounds > 0)
  return {
    jobGuaranteeSponsor: jobGuaranteeSponsor ? { id: jobGuaranteeSponsor.id, name: jobGuaranteeSponsor.name } : undefined,
    imageRightsSponsor: imageRightsSponsorEntity ? { id: imageRightsSponsorEntity.id, name: imageRightsSponsorEntity.name } : undefined,
  }
}

/**
 * En enda domänväg för både förlängningar och fria agenter (§4: "Fria
 * agenter: samma resolver, samma termer"). Tidigare låg osäkerheten bara i
 * ContractsTab; anrop direkt mot store accepterade samma bud. Nu avgör samma
 * erbjudande alltid samma sak oavsett yta.
 *
 * `terms`/`availableTerms` är bakåtkompatibla tillägg (C-T8) — utelämnade
 * default:as till "inga termer", identiskt med tidigare beteende.
 */
export function evaluateContractOffer(
  player: Pick<Player, 'currentAbility' | 'form' | 'potentialAbility' | 'transferPersonality' | 'isHomegrown' | 'trait' | 'isFullTimePro'>,
  minSalary: number,
  offeredSalary: number,
  years: number,
  rand: () => number,
  terms: ContractTermOffer = {},
  availableTerms: ContractTermKey[] = [],
): ContractOfferResult {
  const requiredSalary = getRequiredContractSalary(player, minSalary, years)
  const termRows = offeredTermValues(player, terms, years)
  const termPlayerValue = termRows.reduce((sum, row) => sum + row.playerValue, 0)
  const effectiveOffer = offeredSalary + termPlayerValue

  if (effectiveOffer < requiredSalary) {
    const counterTerm = suggestCounterTerm(player, minSalary, years, terms, availableTerms)
    return counterTerm ? { accepted: false, counterTerm } : { accepted: false, counterSalary: requiredSalary }
  }

  // Ett tydligt premiumbud ska inte falla på ett dolt tärningsslag. §4.5:
  // premiumregeln gäller på `effective`, inte den nakna lönesiffran.
  if (effectiveOffer >= roundSalary(requiredSalary * 1.15)) return { accepted: true }

  let reluctance = 0
  if (player.currentAbility > 60) reluctance += 0.20
  if (player.form > 65) reluctance += 0.10
  if ((player.potentialAbility ?? 0) > 70) reluctance += 0.10
  if (player.transferPersonality === 'ambitious') reluctance += 0.10

  const premiumShare = Math.max(0, (effectiveOffer - requiredSalary) / Math.max(1, requiredSalary * 0.15))
  let rejectChance = Math.max(0, reluctance * (1 - premiumShare))

  // §4.4 — varje erbjuden term med playerValue > 0 sänker rejectChance med
  // 0,05 ("han känner sig sedd"), oberoende av premiumbandet ovanför.
  const positiveTermCount = termRows.filter(row => row.playerValue > 0).length
  rejectChance = Math.max(0, rejectChance - 0.05 * positiveTermCount)

  return rand() < rejectChance
    ? { accepted: false, counterSalary: roundSalary(requiredSalary * 1.10) }
    : { accepted: true }
}

export interface ApplyContractTermsResult {
  player: Player
  sponsors: Sponsor[]
  patron: Patron | undefined
  /** Engångsbeloppet som ska dras från klubbens kassa (0 om ingen handpenning). */
  signOnDeductionKr: number
  acceptedTermKeys: ContractTermKey[]
}

/**
 * §3 konsekvenser vid accepterat erbjudande — binder termerna till spelaren
 * och konsumerar sponsor-/patronkapacitet. Klubbens kassa dras INTE här
 * (anroparen använder samma `applyFinanceChange`/`appendFinanceLog`-väg som
 * övriga transferbeslut, se transferActions.ts) — bara *hur mycket* rapporteras.
 */
export function applyContractTerms(
  player: Player,
  sponsors: Sponsor[],
  patron: Patron | undefined,
  terms: ContractTermOffer,
): ApplyContractTermsResult {
  let updatedPlayer = player
  let updatedSponsors = sponsors
  let updatedPatron = patron
  const acceptedTermKeys: ContractTermKey[] = []
  let signOnDeductionKr = 0

  if (terms.signOnKr) {
    updatedPlayer = { ...updatedPlayer, signOnKr: terms.signOnKr }
    signOnDeductionKr = terms.signOnKr
    acceptedTermKeys.push('signOnBonus')
  }
  if (terms.housing) {
    updatedPlayer = { ...updatedPlayer, housingProvided: true }
    acceptedTermKeys.push('housing')
  }
  if (terms.jobGuarantee) {
    const sponsorId = terms.jobGuarantee.sponsorId
    updatedPlayer = { ...updatedPlayer, jobGuaranteeSponsorId: sponsorId }
    if (patron && patron.id === sponsorId) {
      updatedPatron = { ...patron, jobsUsedThisSeason: (patron.jobsUsedThisSeason ?? 0) + 1 }
    } else {
      updatedSponsors = sponsors.map(s => s.id === sponsorId ? { ...s, jobsUsedThisSeason: (s.jobsUsedThisSeason ?? 0) + 1 } : s)
    }
    acceptedTermKeys.push('jobGuarantee')
  }
  if (terms.imageRights) {
    updatedPlayer = { ...updatedPlayer, imageRightsSponsorId: terms.imageRights.sponsorId }
    acceptedTermKeys.push('imageRights')
  }

  return { player: updatedPlayer, sponsors: updatedSponsors, patron: updatedPatron, signOnDeductionKr, acceptedTermKeys }
}
