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
      'Ekonomin räddad — nämnden lämnar',
    ],
    bodies: [
      'Ni har vänt den ekonomiska trenden. Licensnämnden avslutar sin bevakning och ger er grönt ljus. Välkommen tillbaka.',
      'Hemläxan godkänd. Licensnämnden konstaterar att klubben nu uppfyller de ekonomiska kraven.',
    ],
  },
  first_warning: {
    titles: [
      'Licensnämnden: Första varningen',
      'Ekonomisk varning från RF',
      'Licensnämnden noterar underskotten',
    ],
    bodies: [
      'Licensnämnden har registrerat två säsonger med underskott i rad. En formell varning utfärdas. Fortsätter trenden riskeras poängavdrag.',
      'RF:s licensnämnd noterar de upprepade förlusterna och ber er presentera en plan för ekonomisk återhämtning.',
      'Två år med röda siffror. Licensnämnden bevakar nu er ekonomi noggrant — nästa år kan bli kännbart.',
    ],
  },
  point_deduction: {
    titles: [
      'Licensnämnden: Tre poäng dras av',
      'Tredje förlustår — poängavdrag nästa säsong',
      'RF beslutar: −3 poäng inför nästa säsong',
    ],
    bodies: [
      'Tre säsonger i rad med negativa resultat. Licensnämnden beslutar om tre poängs avdrag inför nästa säsong.',
      'RF:s disciplinutskott bekräftar poängavdrag. Ni startar nästa säsong med −3. Vänd det om ni kan.',
      'Varningen ignorerades. Nu är det verkliga konsekvenser. Tre poäng försvinner ur tabellen inför nästa säsong.',
    ],
  },
  license_denied: {
    titles: [
      'LICENSNÄMNDEN: LICENS NEKAD',
      'RF nekar elitlicens — spelet är över',
      'Fyra förlustår: Licensen dras in',
    ],
    bodies: [
      'Fyra säsonger av underskott. Licensnämnden har inget annat val än att neka licens. Ni kan inte delta i nästa säsongs elitbandyliga.',
      'Det har gått för långt. RF:s licensnämnd konstaterar att klubben inte är finansiellt bärkraftig och nekar elitlicens. Det är slut.',
      'Styrelsen kallar till presskonferens. Tränaren avgår. Licensnämndens beslut är slutgiltigt — elitbandyn spelas utan er nästa säsong.',
    ],
  },
}

function pick(arr: string[], seed: number): string {
  return arr[seed % arr.length]
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

  if (netResult > 0) {
    const newConsecutive = 0
    if (currentStatus !== 'clear') {
      const t = TEXT.cleared
      return {
        action: {
          type: 'cleared',
          message: pick(t.bodies, seasonSeed),
          inboxTitle: pick(t.titles, seasonSeed + 1),
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
        message: pick(t.bodies, seasonSeed),
        inboxTitle: pick(t.titles, seasonSeed + 1),
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
        message: pick(t.bodies, seasonSeed),
        inboxTitle: pick(t.titles, seasonSeed + 1),
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
        message: pick(t.bodies, seasonSeed),
        inboxTitle: pick(t.titles, seasonSeed + 1),
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
