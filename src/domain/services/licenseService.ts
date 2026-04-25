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
      'RF:s licensnämnd har granskat {KLUBB}s räkenskaper. Två säsonger med underskott. Detta är en formell varning. "Vi förväntar oss en återhämtningsplan inom åtta veckor", står det i beslutet. Klubbens ekonomi är under övervakning fram till dess.',
      'Brevet från Licensnämnden är formellt och tre sidor långt. Innehållet kan sammanfattas i en mening: två förlustsäsonger i rad är inte acceptabelt. {KLUBB} ska presentera en plan för återhämtning. Tiden räknas i veckor, inte månader.',
      'Två säsonger med underskott. Det räcker. RF:s licensnämnd inleder formell bevakning av {KLUBB}s ekonomi. Det är inte slutet — men det är ett första steg dit. Nästa förlustår kommer kosta poäng.',
    ],
  },
  point_deduction: {
    titles: [
      'Licensnämnden: −3 poäng inför nästa säsong',
      'Det blev poängavdrag — {KLUBB} −3',
      'RF beslutar: Tre poäng från {KLUBB}',
    ],
    bodies: [
      'Tre säsonger med underskott. Tre poäng. {KLUBB} startar nästa säsong med ett underläge som klubbens egen ekonomi har orsakat. Beslutet är slutgiltigt — ingen överklagan tas upp. RF:s ord är: "Konsekvensen är välbalanserad."',
      'Brevet kom på en tisdag. Tre poängs avdrag inför nästa säsong. Inget mer att säga. Styrelsemöte på torsdag — det enda alla redan vet är att något måste bort. Frågan är vem.',
      'Licensnämnden har genomfört sin tredje granskning av {KLUBB}. Beslutet är minskning av poäng inför nästa säsong med 3 enheter. Klubben har inte följt återhämtningsplanen. "Vi har gett er chanser. Det är slut nu."',
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
): { action: LicenseAction | null; newConsecutiveLossSeasons: number; newLicenseStatus: LicenseStatus } {
  const netResult = computeNetResult(game)
  const currentStatus: LicenseStatus = game.licenseStatus ?? 'clear'
  const consecutiveLoss = game.consecutiveLossSeasons ?? 0
  const clubName = game.clubs.find(c => c.id === game.managedClubId)?.name ?? 'Klubben'

  if (netResult > 0) {
    const newConsecutive = 0
    if (currentStatus !== 'clear') {
      const t = TEXT.cleared
      return {
        action: {
          type: 'cleared',
          message: fillTokens(pick(t.bodies, seasonSeed), clubName),
          inboxTitle: fillTokens(pick(t.titles, seasonSeed + 1), clubName),
        },
        newConsecutiveLossSeasons: newConsecutive,
        newLicenseStatus: 'clear',
      }
    }
    return { action: null, newConsecutiveLossSeasons: newConsecutive, newLicenseStatus: 'clear' }
  }

  const newConsecutive = consecutiveLoss + 1

  if (newConsecutive === 2 && currentStatus === 'clear') {
    const t = TEXT.first_warning
    return {
      action: {
        type: 'first_warning',
        message: fillTokens(pick(t.bodies, seasonSeed), clubName),
        inboxTitle: fillTokens(pick(t.titles, seasonSeed + 1), clubName),
      },
      newConsecutiveLossSeasons: newConsecutive,
      newLicenseStatus: 'first_warning',
    }
  }

  if (newConsecutive === 3 && currentStatus === 'first_warning') {
    const t = TEXT.point_deduction
    return {
      action: {
        type: 'point_deduction',
        message: fillTokens(pick(t.bodies, seasonSeed), clubName),
        inboxTitle: fillTokens(pick(t.titles, seasonSeed + 1), clubName),
      },
      newConsecutiveLossSeasons: newConsecutive,
      newLicenseStatus: 'point_deduction',
    }
  }

  if (newConsecutive === 4 && currentStatus === 'point_deduction') {
    const t = TEXT.license_denied
    return {
      action: {
        type: 'license_denied',
        message: fillTokens(pick(t.bodies, seasonSeed), clubName),
        inboxTitle: fillTokens(pick(t.titles, seasonSeed + 1), clubName),
      },
      newConsecutiveLossSeasons: newConsecutive,
      newLicenseStatus: 'license_denied',
    }
  }

  // Consecutive loss but no new threshold crossed — keep current status
  return { action: null, newConsecutiveLossSeasons: newConsecutive, newLicenseStatus: currentStatus }
}

export function buildLicenseInboxItem(
  action: LicenseAction,
  currentDate: string,
  season: number,
): InboxItem {
  return {
    id: `inbox_license_status_${season}`,
    date: currentDate,
    type: InboxItemType.LicenseReview,
    title: action.inboxTitle,
    body: action.message,
    isRead: false,
  } as InboxItem
}
