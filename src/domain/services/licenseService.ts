import type { SaveGame, InboxItem } from '../entities/SaveGame'
import { InboxItemType } from '../enums'

// ── Types ──────────────────────────────────────────────────────────────────

export type LicenseStatus = 'clear' | 'first_warning' | 'point_deduction' | 'license_denied'

export type LicenseActionType =
  | 'cleared'
  | 'first_warning'
  | 'point_deduction'
  | 'license_denied'

export interface LicenseAction {
  type: LicenseActionType
  message: string
  inboxTitle: string
}

/**
 * 2026-08-26 (Jacobs dom, RAPPORT_ACKUMULATOR_FORSLAG_2026-08-26.md):
 * licenseRiskScore ersätter den binära, minneslösa räknaren — "kaskaden ska
 * bort" gällde licenseReview (System A, seasonEndProcessor.ts), det här är
 * den PARALLELLA domen för System B (det som faktiskt avskedar): "en positiv
 * säsong nollställde ALLT, en klubb som ändå inte kan gå plus varje år
 * (Survive per definition) skulle bara röra sig uppåt." Ackumulator, 0-100,
 * samma princip som meritBuffer: dåliga år fyller på, bra år tömmer DELVIS.
 *
 * Magnituder, Jacobs dom: 20 straff, 18 lättnad (INTE 12 — "med -12 tar det
 * nästan två bra år att radera ett dåligt... med -18 väger ett bra år nästan
 * upp ett dåligt men inte riktigt — en klubb som växlar plus/minus håller
 * sig stabil, en som förlorar två av tre glider sakta mot tröskeln").
 * Trösklar 40/60/80 bevarar exakt dagens 4-årskadens för en konsekvent dålig
 * klubb (20→40→60→80).
 */
export const LICENSE_RISK_BAD_SEASON_PENALTY = 20
export const LICENSE_RISK_GOOD_SEASON_RELIEF = 18
export const LICENSE_RISK_WARNING_THRESHOLD = 40
export const LICENSE_RISK_POINT_DEDUCTION_THRESHOLD = 60
export const LICENSE_RISK_DENIED_THRESHOLD = 80
export const LICENSE_RISK_SCORE_CAP = 100
export const LICENSE_ACTION_PLAN_CAPITAL_INCOME = 40_000

/**
 * Zon-texten, LÅST av Jacob (2026-08-26, samma dom som magnituderna) — "ingen
 * siffra visas, poängen är ett internt tal... zonen och tidshorisonten
 * räcker." Denna text, inte en siffra, är vad EkonomiTab och inbox-posterna
 * visar för spelaren.
 */
export const LICENSE_ZONE_TEXT: Record<LicenseStatus, string> = {
  clear: 'Ekonomin bär.',
  first_warning: 'Ekonomin är ansträngd.',
  point_deduction: 'Licensen är hotad. Vänd resultatet inom två säsonger.',
  license_denied: 'Licensen dras in om ni inte vänder det i år.',
}

export function licenseZoneFromScore(score: number): LicenseStatus {
  if (score >= LICENSE_RISK_DENIED_THRESHOLD) return 'license_denied'
  if (score >= LICENSE_RISK_POINT_DEDUCTION_THRESHOLD) return 'point_deduction'
  if (score >= LICENSE_RISK_WARNING_THRESHOLD) return 'first_warning'
  return 'clear'
}

export function isActiveLicenseWarning(status: LicenseStatus | undefined): boolean {
  return status === 'first_warning' || status === 'point_deduction'
}

// ── Text ───────────────────────────────────────────────────────────────────

const TEXT: Record<LicenseActionType, { titles: string[]; bodies: string[] }> = {
  cleared: {
    titles: [
      'Licensnämnden: Granskningen avslutad',
      'Licensnämnden: Inga vidare åtgärder',
    ],
    bodies: [
      'Ni har vänt skutan. RF:s licensnämnd avslutar bevakningen av {KLUBB}s ekonomi. "Vi noterar att klubben har återgått till sund finansiell verksamhet", står det i beslutet. Det är inte en utmärkelse. Men det är inte ett problem heller.',
      'Bekräftelsen kom i ett kort brev. {KLUBB}s ekonomi är åter i balans. Licensnämnden kommer inte att vidta ytterligare åtgärder. "Vi förväntar oss att den positiva utvecklingen fortsätter."',
    ],
  },
  first_warning: {
    titles: [
      'Licensnämnden: Första varningen efter två förlustsäsonger',
      'Två röda år — RF kräver plan',
      'Licensnämnden bevakar {KLUBB}',
    ],
    bodies: [
      'RF:s licensnämnd har granskat {KLUBB}s räkenskaper. Två säsonger med underskott. Detta är en formell varning. "Vi förväntar oss en återhämtningsplan inom åtta veckor", står det i beslutet. Klubbens ekonomi är under övervakning fram till dess. Planen nämnden vill se är inte komplicerad: lönerna ner eller intäkterna upp, före nästa bokslut.',
      'Brevet från Licensnämnden är formellt och tre sidor långt. Innehållet kan sammanfattas i en mening: två förlustsäsonger i rad är inte acceptabelt. {KLUBB} ska presentera en plan för återhämtning. Tiden räknas i veckor, inte månader. Det som räknas är bokslutet — en lönelista kassan bär, eller sponsorer och publik som bär lönelistan.',
      'Två säsonger med underskott. Det räcker. RF:s licensnämnd inleder formell bevakning av {KLUBB}s ekonomi. Det är inte slutet — men det är ett första steg dit. Nästa förlustår kommer kosta poäng. Det enda nämnden lyssnar på är ett plus i bokslutet.',
    ],
  },
  point_deduction: {
    titles: [
      'Licensnämnden: −3 poäng inför nästa säsong',
      'Det blev poängavdrag — {KLUBB} −3',
      'RF beslutar: Tre poäng från {KLUBB}',
    ],
    bodies: [
      'Tre säsonger med underskott. Tre poäng. {KLUBB} startar nästa säsong med ett underläge som klubbens egen ekonomi har orsakat. Beslutet är slutgiltigt — ingen överklagan tas upp. RF:s ord är: "Konsekvensen är välbalanserad." Ett plus i årets bokslut lyfter avdraget. Ett minus till drar in licensen.',
      'Brevet kom på en tisdag. Tre poängs avdrag inför nästa säsong. Inget mer att säga. Styrelsemöte på torsdag — det enda alla redan vet är att något måste bort. Frågan är vem. Ett minus till, och det är inte en spelare som får gå. Det är licensen.',
      'Licensnämnden har genomfört sin tredje granskning av {KLUBB}. Beslutet är minskning av poäng inför nästa säsong med 3 enheter. Klubben har inte följt återhämtningsplanen. "Vi har gett er chanser. Det är slut nu." Vänd bokslutet i år. Annars är nästa brev det sista.',
    ],
  },
  license_denied: {
    titles: [
      'LICENSNÄMNDEN: Elitlicens nekad',
      'Spelet är slut för {KLUBB} i elitserien',
      'RF nekar elitlicens — {KLUBB} flyttas ner',
    ],
    bodies: [
      'Fyra säsonger av underskott. Det går inte längre. RF:s licensnämnd har idag fattat beslutet att inte bevilja {KLUBB} elitlicens för nästa säsong. Klubben kommer att placeras i lägre serie. "Detta är inte en straff", står det i beslutet. "Det är en konsekvens." Tränaren får sparken samma kväll.',
      'Beslutet kom som ingen överraskning, men det blev ändå tyst i styrelserummet när det kom. {KLUBB} förlorar elitlicensen. Inga undantag, inga överklaganden. Tränaren avgår innan kvällen är slut. Säsongen — och din tid på jobbet — tar slut här.',
      'Tränaren samlar styrelsen i klubbhuset. Det blir kort. RF:s beslut är slutgiltigt — elitlicensen dras in. {KLUBB} kommer att spela en serie ner från och med nästa säsong. Det här är inte en omstart. Det är ett slut. Tränaren tar farväl utan tårar och utan ord.',
    ],
  },
}

function pick(arr: string[], seed: number): string {
  return arr[seed % arr.length]
}

function fillTokens(text: string, clubName: string): string {
  return text.replace(/{KLUBB}/g, clubName)
}

// ── Core logic ─────────────────────────────────────────────────────────────

function computeNetResult(game: SaveGame): number {
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (!managedClub) return 0
  const startFinances = game.seasonStartSnapshot?.finances ?? managedClub.finances
  return managedClub.finances - startFinances
}

export function checkLicenseStatus(
  game: SaveGame,
  seasonSeed: number,
): { action: LicenseAction | null; newLicenseRiskScore: number; newLicenseStatus: LicenseStatus } {
  const netResult = computeNetResult(game)
  const currentScore = game.licenseRiskScore ?? 0
  const currentZone = licenseZoneFromScore(currentScore)
  const clubName = game.clubs.find(c => c.id === game.managedClubId)?.name ?? 'Klubben'

  const delta = netResult > 0 ? -LICENSE_RISK_GOOD_SEASON_RELIEF : LICENSE_RISK_BAD_SEASON_PENALTY
  const newScore = Math.max(0, Math.min(LICENSE_RISK_SCORE_CAP, currentScore + delta))
  const newZone = licenseZoneFromScore(newScore)

  if (newZone === currentZone) {
    // Ingen zonövergång — poängen rör sig men inget att meddela spelaren om.
    return { action: null, newLicenseRiskScore: newScore, newLicenseStatus: newZone }
  }

  // Tillbaka till clear från en sämre zon — samma "cleared"-narrativ som förut.
  if (newZone === 'clear') {
    const t = TEXT.cleared
    return {
      action: {
        type: 'cleared',
        message: fillTokens(pick(t.bodies, seasonSeed), clubName),
        inboxTitle: fillTokens(pick(t.titles, seasonSeed + 1), clubName),
      },
      newLicenseRiskScore: newScore,
      newLicenseStatus: newZone,
    }
  }

  if (
    (currentZone === 'license_denied' && newZone === 'point_deduction') ||
    (currentZone === 'point_deduction' && newZone === 'first_warning')
  ) {
    const t = TEXT[newZone]
    const message = currentZone === 'license_denied'
      ? 'Ni har vänt det värsta. Licensnämnden häver hotet om nedflyttning — men poängavdraget står kvar tills ekonomin är i balans.'
      : 'Det går åt rätt håll. Nämnden lättar på poängavdraget, men bevakningen fortsätter. Ni är inte ur det än.'
    return {
      action: {
        type: newZone,
        message,
        inboxTitle: fillTokens(pick(t.titles, seasonSeed + 1), clubName),
      },
      newLicenseRiskScore: newScore,
      newLicenseStatus: newZone,
    }
  }

  // Försämring till en ny, sämre zon. newZone !== 'clear' är redan
  // garanterat av return:en ovan.
  const worsened =
    (newZone === 'first_warning' && currentZone === 'clear') ||
    (newZone === 'point_deduction' && (currentZone === 'clear' || currentZone === 'first_warning')) ||
    (newZone === 'license_denied')
  if (worsened) {
    const t = TEXT[newZone]
    return {
      action: {
        type: newZone,
        message: fillTokens(pick(t.bodies, seasonSeed), clubName),
        inboxTitle: fillTokens(pick(t.titles, seasonSeed + 1), clubName),
      },
      newLicenseRiskScore: newScore,
      newLicenseStatus: newZone,
    }
  }

  return { action: null, newLicenseRiskScore: newScore, newLicenseStatus: newZone }
}

export function buildLicenseInboxItem(
  action: LicenseAction,
  currentDate: string,
  season: number,
  licenseStatus: LicenseStatus,
): InboxItem {
  // 2026-08-26 (Jacobs dom): ingen siffra visas — zonens LÅSTA text bär
  // kravet, mätbart utan att ge spelaren ett tal att optimera istf klubben.
  // 'cleared' har ingen zon-oro att visa.
  return {
    id: `inbox_license_status_${season}`,
    date: currentDate,
    type: InboxItemType.LicenseReview,
    title: action.inboxTitle,
    body: action.message,
    isRead: false,
    ...(action.type !== 'cleared' ? { licenseZoneLabel: LICENSE_ZONE_TEXT[licenseStatus] } : {}),
  } as InboxItem
}
