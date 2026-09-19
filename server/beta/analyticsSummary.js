/**
 * Small, aggregate-only read model for the closed beta. Raw installation IDs
 * never leave this function; a row represents one server-accepted event.
 */
export function summarizeBetaAnalytics(rows, now = new Date()) {
  const nowMs = now.getTime()
  const day = 24 * 60 * 60 * 1000
  const within = (row, days) => {
    const at = Date.parse(row.recordedAt)
    return Number.isFinite(at) && at >= nowMs - days * day && at <= nowMs
  }
  const distinct = (event, days, predicate = () => true) => new Set(rows
    .filter(row => row.event === event && within(row, days) && predicate(row))
    .map(row => row.installationId)).size
  const sessions = rows.filter(row => row.event === 'session_end' && within(row, 30))
  const durations = sessions.map(row => row.payload?.durationSeconds)
    .filter(value => Number.isFinite(value) && value >= 0 && value <= 24 * 60 * 60)
    .sort((a, b) => a - b)
  const medianSessionMinutes = durations.length
    ? Math.round((durations[Math.floor((durations.length - 1) / 2)]
      + durations[Math.floor(durations.length / 2)]) / 120)
    : null
  const returners = days => {
    const seenDays = new Map()
    for (const row of rows) {
      if (row.event !== 'session_start' || !within(row, days)) continue
      const daysForInstall = seenDays.get(row.installationId) ?? new Set()
      daysForInstall.add(row.recordedAt.slice(0, 10))
      seenDays.set(row.installationId, daysForInstall)
    }
    return [...seenDays.values()].filter(daysForInstall => daysForInstall.size >= 2).length
  }
  const checkpoint = milestone => distinct('season_checkpoint', 90,
    row => row.payload?.careerSeason === 1 && row.payload?.milestone === milestone)
  const featureCounts = {}
  for (const feature of ['training', 'tactics', 'scouting', 'transfers', 'community']) {
    featureCounts[feature] = distinct('feature_opened', 90, row => row.payload?.feature === feature)
  }
  return {
    unit: 'installation',
    retentionDays: 90,
    active7: distinct('session_start', 7),
    active30: distinct('session_start', 30),
    returnedOnAnotherDay7: returners(7),
    returnedOnAnotherDay30: returners(30),
    funnel90: {
      installed: distinct('install', 90),
      gameCreated: distinct('game_created', 90),
      onboardingDone: distinct('onboarding_done', 90),
      firstMatch: distinct('first_match', 90),
      firstSeasonFiveMatches: checkpoint('five_league_matches'),
      firstSeasonHalfway: checkpoint('half_league_matches'),
      seasonOneDone: distinct('season_completed', 90, row => row.payload?.careerSeason === 1),
      seasonThreeDone: distinct('season_completed', 90, row => row.payload?.careerSeason === 3),
    },
    session30: {
      starts: rows.filter(row => row.event === 'session_start' && within(row, 30)).length,
      ends: sessions.length,
      medianCompletedMinutes: medianSessionMinutes,
    },
    features90: featureCounts,
    issues30: {
      renderErrors: rows.filter(row => row.event === 'client_issue' && within(row, 30)
        && row.payload?.kind === 'render_error').length,
      saveFailures: rows.filter(row => row.event === 'client_issue' && within(row, 30)
        && row.payload?.kind === 'save_failure').length,
    },
  }
}
