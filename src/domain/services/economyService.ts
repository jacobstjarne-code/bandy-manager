import type { CommunityActivities, Sponsor } from '../entities/SaveGame'

export interface WeeklyEconomy {
  weeklyBase: number       // reputation × 250
  sponsorIncome: number    // sum of active sponsors
  communityIncome: number  // kiosk + lottery + functionaries + bandyplay
  weeklyIncome: number     // total income
  weeklyWages: number      // monthly wages / 4
  netPerRound: number      // income - wages
}

export function calcWeeklyEconomy(
  reputation: number,
  sponsors: Sponsor[],
  communityActivities: CommunityActivities | undefined,
  monthlySalaryTotal: number,
): WeeklyEconomy {
  const weeklyBase = Math.round(reputation * 250)

  const activeSponsors = sponsors.filter(s => s.contractRounds > 0)
  const sponsorIncome = activeSponsors.reduce((sum, s) => sum + s.weeklyIncome, 0)

  const ca = communityActivities
  const kioskEst = ca?.kiosk === 'upgraded' ? 8500 : ca?.kiosk === 'basic' ? 3500 : 0
  const lotteryEst = ca?.lottery === 'intensive' ? 3200 : ca?.lottery === 'basic' ? 1250 : 0
  const communityIncome = kioskEst + lotteryEst
    + (ca?.functionaries ? 4000 : 0)
    + (ca?.bandyplay ? 1500 : 0)
    + (ca?.vipTent ? 2500 : 0)
    + (ca?.socialMedia ? 1000 : 0)

  const weeklyIncome = weeklyBase + sponsorIncome + communityIncome
  const weeklyWages = Math.round(monthlySalaryTotal / 4)
  const netPerRound = weeklyIncome - weeklyWages

  return { weeklyBase, sponsorIncome, communityIncome, weeklyIncome, weeklyWages, netPerRound }
}
