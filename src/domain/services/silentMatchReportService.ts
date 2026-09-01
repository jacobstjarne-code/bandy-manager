// DREAM-014: Tyst mode — matchrapport i sportjournalistisk text
// Genererar en kort prosa-rapport baserad på matchresultat och events.

import type { Fixture } from '../entities/Fixture'
import { MatchEventType } from '../enums'
import { deriveUtfall } from './matchTypeAxes'

/**
 * @cites Fixture.homeScore, Fixture.awayScore, Fixture.events, Fixture.homeClubId, MatchEvent.type, MatchEvent.minute
 */
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
  const oppName = managedIsHome ? awayClubName : homeClubName

  const goals = (fixture.events ?? []).filter(e => e.type === MatchEventType.Goal)
  const goalTexts = goals.slice(0, 3).map(e => {
    const min = e.minute ?? 0
    // M57 (textaudit 2026-07-04): mål efter minut 90 (förlängningen, se
    // matchCore.ts:1926 — OT-minuter löper 91-109) etiketterades "andra
    // halvlek", men andra halvlek slutar vid 90.
    const half = min <= 45 ? 'första halvlek' : min <= 90 ? 'andra halvlek' : 'förlängningen'
    return `mål i ${half} (${min}')`
  })

  const utfall = deriveUtfall(fixture, managedClubId)
  const result = utfall === 'vunnet' ? 'seger' : utfall === 'forlorat' ? 'förlust' : 'oavgjort'
  const flavor = result === 'seger'
    ? (diff >= 4 ? 'en klar seger' : diff >= 2 ? 'en välförtjänt seger' : diff === 0 ? 'en dramatisk seger' : 'en knapp men viktig seger')
    : result === 'förlust'
    ? (diff >= 4 ? 'ett tungt nederlag' : diff >= 2 ? 'en tydlig förlust' : 'ett bittert slutresultat')
    : 'en rättvis poängdelning'

  const decider = (fixture.wentToPenalties || fixture.penaltyResult) ? ' efter straffar' : fixture.overtimeResult ? ' efter förlängning' : ''
  const opener = result === 'oavgjort'
    ? `${homeClubName} och ${awayClubName} delade på poängen i en jämn tillställning där lagen tog ut varandra väl.`
    : `${homeClubName} ${home}–${away} ${awayClubName}${decider}. Det blev ${flavor} för ${managedIsHome ? homeClubName : awayClubName} mot ${oppName}.`

  const middle = goalTexts.length > 0
    ? `Avgörande händelser: ${goalTexts.join(', ')}.`
    : `Resultatet säger det mesta om kvällen.`

  const closer = result === 'seger'
    ? `Det ger råg i ryggen inför nästa omgång.`
    : result === 'förlust'
    ? `Nu gäller det att hålla ihop och svara i nästa match.`
    : `Poängen kan visa sig värdefull i sluträkningen.`

  return `${opener}\n\n${middle}\n\n${closer}`
}
