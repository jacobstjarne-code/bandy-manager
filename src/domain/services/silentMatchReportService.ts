// DREAM-014: Tyst mode — matchrapport i sportjournalistisk text
// Genererar en kort prosa-rapport baserad på matchresultat och events.

import type { Fixture } from '../entities/Fixture'
import { MatchEventType } from '../enums'

export function generateSilentMatchReport(
  fixture: Fixture,
  homeClubName: string,
  awayClubName: string,
  managedClubId: string,
): string {
  const home = fixture.homeScore ?? 0
  const away = fixture.awayScore ?? 0
  const diff = Math.abs(home - away)
  const managedIsHome = fixture.homeClubId === managedClubId
  const managedScore = managedIsHome ? home : away
  const oppScore = managedIsHome ? away : home
  const oppName = managedIsHome ? awayClubName : homeClubName

  const goals = (fixture.events ?? []).filter(e => e.type === MatchEventType.Goal)
  const goalTexts = goals.slice(0, 3).map(e => {
    const min = e.minute ?? 0
    const half = min <= 45 ? 'första' : 'andra'
    return `mål i ${half} halvlek (${min}')`
  })

  const result = managedScore > oppScore ? 'seger' : managedScore < oppScore ? 'förlust' : 'oavgjort'
  const flavor = result === 'seger'
    ? (diff >= 4 ? 'en klar seger' : diff >= 2 ? 'en välförtjänt seger' : 'en knapp men viktig seger')
    : result === 'förlust'
    ? (diff >= 4 ? 'ett tungt nederlag' : diff >= 2 ? 'en tydlig förlust' : 'ett bittert slutresultat')
    : 'en rättvis poängdelning'

  const opener = diff === 0
    ? `${homeClubName} och ${awayClubName} delade på poängen i en jämn tillställning där lagen tog ut varandra väl.`
    : `${homeClubName} ${home}–${away} ${awayClubName}. ${managedIsHome ? homeClubName : awayClubName} tog hem ${flavor} mot ${oppName}.`

  const middle = goalTexts.length > 0
    ? `Avgörande händelser: ${goalTexts.join(', ')}.`
    : `Matchen avgjordes av smådetaljer snarare än stora chanser.`

  const closer = result === 'seger'
    ? `En prestation att bygga vidare på.`
    : result === 'förlust'
    ? `Nu gäller det att hålla ihop och svara i nästa match.`
    : `Poängen kan visa sig värdefull i sluträkningen.`

  return `${opener}\n\n${middle}\n\n${closer}`
}
