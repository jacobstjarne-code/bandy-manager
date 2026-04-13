import type { SaveGame, TrainerArc, ArcPhase, ArcTransition } from '../entities/SaveGame'

// ── Default arc for new game ────────────────────────────────────────────────

export function createTrainerArc(): TrainerArc {
  return {
    current: 'newcomer',
    history: [],
    seasonCount: 0,
    bestFinish: 12,
    titlesWon: 0,
    consecutiveLosses: 0,
    consecutiveWins: 0,
    boardWarningGiven: false,
  }
}

// ── Transition helper ───────────────────────────────────────────────────────

function transition(arc: TrainerArc, to: ArcPhase, matchday: number, season: number, reason: string): void {
  if (arc.current === to) return
  const t: ArcTransition = { from: arc.current, to, matchday, season, reason }
  arc.history = [...arc.history.slice(-9), t]
  arc.current = to
}

// ── Update arc after each matchday ──────────────────────────────────────────

export function updateTrainerArc(game: SaveGame): TrainerArc {
  const arc: TrainerArc = { ...(game.trainerArc ?? createTrainerArc()) }
  const standing = game.standings.find(s => s.clubId === game.managedClubId)
  const pos = standing?.position ?? 8
  const totalTeams = game.clubs.length
  const md = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((m, f) => Math.max(m, f.roundNumber), 0)
  const season = game.currentSeason

  // Update win/loss streaks from last match
  const lastFixtures = game.fixtures
    .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) && !f.isCup)
    .sort((a, b) => b.roundNumber - a.roundNumber)
  const last = lastFixtures[0]
  if (last && last.id !== arc.lastCountedFixtureId) {
    arc.lastCountedFixtureId = last.id
    const isHome = last.homeClubId === game.managedClubId
    const myScore = isHome ? last.homeScore : last.awayScore
    const theirScore = isHome ? last.awayScore : last.homeScore
    if (myScore > theirScore) {
      arc.consecutiveWins++
      arc.consecutiveLosses = 0
    } else if (myScore < theirScore) {
      arc.consecutiveLosses++
      arc.consecutiveWins = 0
    } else {
      arc.consecutiveWins = 0
      arc.consecutiveLosses = 0
    }
  }

  // Arc state machine
  switch (arc.current) {
    case 'newcomer':
      if (md >= 5) {
        if (pos <= 3) transition(arc, 'honeymoon', md, season, 'Topp 3 efter 5 matcher')
        else if (pos >= 10) transition(arc, 'questioned', md, season, 'Botten efter 5 matcher')
        else transition(arc, 'grind', md, season, 'Stabil start')
      }
      break

    case 'honeymoon':
      if (arc.consecutiveLosses >= 3) {
        transition(arc, 'questioned', md, season, `${arc.consecutiveLosses} raka förluster`)
      } else if (md >= 12) {
        if (pos <= 4) transition(arc, 'established', md, season, 'Håller positionen')
        else transition(arc, 'grind', md, season, 'Honeymoon över')
      }
      break

    case 'grind':
      if (arc.consecutiveLosses >= 4) {
        transition(arc, 'crisis', md, season, `${arc.consecutiveLosses} raka förluster`)
      } else if (arc.consecutiveLosses >= 3 || pos >= totalTeams - 1) {
        transition(arc, 'questioned', md, season, 'Dåliga resultat')
      } else if (arc.consecutiveWins >= 5) {
        transition(arc, 'honeymoon', md, season, `${arc.consecutiveWins} raka segrar`)
      } else if (pos <= 2 && md >= 15) {
        transition(arc, 'established', md, season, 'Toppkandidat')
      }
      break

    case 'questioned':
      if (arc.consecutiveLosses >= 4) {
        transition(arc, 'crisis', md, season, 'Fortsatt negativt')
        arc.boardWarningGiven = true
      } else if (arc.consecutiveWins >= 3) {
        transition(arc, 'redemption', md, season, `${arc.consecutiveWins} raka segrar`)
      } else if (pos <= Math.ceil(totalTeams / 2) && md >= 18) {
        transition(arc, 'grind', md, season, 'Stabiliserat')
      }
      break

    case 'crisis':
      if (arc.consecutiveWins >= 2) {
        transition(arc, 'redemption', md, season, 'Vände i sista stund')
      }
      // Sparkning hanteras via boardPatience-systemet
      break

    case 'redemption':
      if (arc.consecutiveWins >= 4 || pos <= 4) {
        transition(arc, 'established', md, season, 'Genomfört vändningen')
      } else if (arc.consecutiveLosses >= 3) {
        transition(arc, 'crisis', md, season, 'Vändningen höll inte')
      } else if (md >= 20) {
        transition(arc, 'grind', md, season, 'Stabiliserat efter kris')
      }
      break

    case 'established':
      if (arc.consecutiveLosses >= 5) {
        transition(arc, 'questioned', md, season, 'Lång svit utan seger')
      }
      break

    case 'legendary':
      if (arc.consecutiveLosses >= 5) {
        transition(arc, 'questioned', md, season, 'Legendarens fall?')
      }
      break
  }

  if (pos < arc.bestFinish) arc.bestFinish = pos

  return arc
}

// ── Season end arc update ───────────────────────────────────────────────────

export function checkSeasonEndArc(arc: TrainerArc, isChampion: boolean, season: number): TrainerArc {
  const updated = { ...arc }
  if (isChampion) {
    updated.titlesWon++
    transition(updated, 'legendary', 22, season, 'SM-mästare')
  } else if (updated.seasonCount >= 2 && updated.current !== 'crisis' && updated.current !== 'farewell') {
    if (updated.current === 'newcomer' || updated.current === 'grind') {
      transition(updated, 'established', 22, season, 'Överlevde säsong 2+')
    }
  }
  updated.seasonCount++
  updated.consecutiveLosses = 0
  updated.consecutiveWins = 0
  updated.boardWarningGiven = false
  return updated
}

// ── Arc mood text for dashboard ─────────────────────────────────────────────

export function getArcMoodText(phase: ArcPhase, seed?: number): string | null {
  const pick = (arr: string[]) => arr[(seed ?? 0) % arr.length]

  switch (phase) {
    case 'newcomer':
      return pick([
        '🆕 Ingen vet ditt namn ännu',
        '🆕 Nyckeln till kontoret luktar fortfarande metall',
        '🆕 Grabbarna kallar dig fortfarande "nya tränaren"',
      ])
    case 'honeymoon':
      return pick([
        '☀️ Även parkeringsböterna känns överkomliga',
        '☀️ Lokaltidningen stavade rätt på ditt namn',
        '☀️ Folk hälsar i mataffären',
        '☀️ Kassörskan på ICA frågade om autograf',
      ])
    case 'grind':
      return pick([
        '⚙️ Kaffe. Match. Kaffe. Match.',
        '⚙️ Vardagen har blivit din bästa vän',
        '⚙️ Ingen skriver om dig. Det är bra.',
        '⚙️ Tyst och stabilt. Precis som isen borde vara.',
      ])
    case 'questioned':
      return pick([
        '⛅ Lokaltidningen har slutat be om intervju',
        '⛅ Anonyma kommentarer i forumet',
        '⛅ Grannen undviker ögonkontakt',
        '⛅ "Har du funderat på att prova något annat?"',
      ])
    case 'crisis':
      return pick([
        '⛈️ Ordföranden ringer inte längre. Det är värre.',
        '⛈️ Någon har skrivit AVGÅ på papperskorgen vid planen',
        '⛈️ Frun frågar försiktigt om cv:t',
        '⛈️ Kassören tittade bort vid senaste styrelsemötet',
      ])
    case 'redemption':
      return pick([
        '🌤️ Grannen hälsar igen',
        '🌤️ Lokaltidningen vill göra ett reportage',
        '🌤️ Samma folk som ville sparka dig klappar nu',
        '🌤️ Det luktar comeback',
      ])
    case 'established':
      return pick([
        '🏠 Egen kopp i kafferummet',
        '🏠 Vaktmästaren frågar dig om råd',
        '🏠 Du vet var alla lampknappar sitter',
        '🏠 Del av inventarierna',
      ])
    case 'legendary':
      return pick([
        '👑 Gatan utanför planen borde döpas om',
        '👑 Ortens barn vill bli dig när de växer upp',
        '👑 Du ÄR klubben',
        '👑 Pensionärerna minns ingen annan tränare',
      ])
    case 'farewell':
      return pick([
        '👋 En match i taget. Kanske den sista.',
        '👋 Kontoret känns redan tomt',
        '👋 Det slutar inte med en smäll. Det slutar tyst.',
      ])
    default:
      return null
  }
}
