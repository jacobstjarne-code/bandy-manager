import type { SaveGame, TrainerArc, ArcPhase, ArcTransition } from '../entities/SaveGame'
import { deriveUtfall } from './matchTypeAxes'
import { BOARD_EXPECTATION_ANCHOR_POSITION } from './boardService'

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

/**
 * @cites matchday
 */
export function updateTrainerArc(game: SaveGame): TrainerArc {
  const arc: TrainerArc = { ...(game.trainerArc ?? createTrainerArc()) }
  const standing = game.standings.find(s => s.clubId === game.managedClubId)
  const pos = standing?.position ?? 8
  const md = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup && !f.isKnockout)
    .reduce((m, f) => Math.max(m, f.matchday), 0)
  const season = game.currentSeason
  // sluttest-be-blind-trainerarc (DOM 2026-09-03, Jacob, "den viktigaste av
  // tio"): fasta placeringströsklar ersatta med avstånd från förväntans
  // ankare (samma BOARD_EXPECTATION_ANCHOR_POSITION som boardService.ts
  // äger, aldrig en egen kopia). gap positivt = bättre än ankaret.
  // Svit-triggers (consecutiveWins/Losses) rörda inte, per domen.
  //
  // Tröskelvärdena nedan (gap>=3/-4/2/-5/4/2/0/2) är de GAMLA absoluta
  // trösklarna (pos<=3/>=10/<=4 osv) omräknade till gap vid MidTable-ankaret
  // (6) — samma känsla som förut för en MidTable-klubb, nu generaliserad.
  // Domens två illustrativa exempel ("Survive-sexa=triumf",
  // "WinLeague-trea=ifrågasatt") är kvalitativa, inte kalibreringsdata: de
  // har olika gap-magnitud (+6 resp. -2) och är inte tänkta att träffa
  // SAMMA tröskel. Verifierat: Survive-sexa (gap+6) ger honeymoon här.
  // WinLeague-trea (gap-2) träffar INTE questioned-tröskeln (-4) från
  // newcomer-fasen — landar i grind, skilt från en MidTable-klubb på samma
  // placering (som blir honeymoon, gap+3) men inte lika hårt dömd som
  // domens prosa antyder. Om Jacob vill att WinLeague-trea ska ge
  // 'questioned' redan efter 5 matcher krävs en tightare tröskel — egen
  // kalibreringsfråga, inte löst av denna omskrivning.
  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  const anchor = managedClub ? BOARD_EXPECTATION_ANCHOR_POSITION[managedClub.boardExpectation] : 6
  const gap = anchor - pos

  // Update win/loss streaks from last match
  const lastFixtures = game.fixtures
    .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) && !f.isCup && !f.isKnockout)
    .sort((a, b) => b.matchday - a.matchday)
  const last = lastFixtures[0]
  if (last && last.id !== arc.lastCountedFixtureId) {
    arc.lastCountedFixtureId = last.id
    const outcome = deriveUtfall(last, game.managedClubId)
    if (outcome === 'vunnet') {
      arc.consecutiveWins++
      arc.consecutiveLosses = 0
    } else if (outcome === 'forlorat') {
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
        if (gap >= 3) transition(arc, 'honeymoon', md, season, 'Tydligt över förväntan efter 5 matcher')
        else if (gap <= -4) transition(arc, 'questioned', md, season, 'Tydligt under förväntan efter 5 matcher')
        else transition(arc, 'grind', md, season, 'Stabil start')
      }
      break

    case 'honeymoon':
      if (arc.consecutiveLosses >= 3) {
        transition(arc, 'questioned', md, season, `${arc.consecutiveLosses} raka förluster`)
      } else if (md >= 12) {
        if (gap >= 2) transition(arc, 'established', md, season, 'Håller sig över förväntan')
        else transition(arc, 'grind', md, season, 'Honeymoon över')
      }
      break

    case 'grind':
      if (arc.consecutiveLosses >= 4) {
        transition(arc, 'crisis', md, season, `${arc.consecutiveLosses} raka förluster`)
      } else if (arc.consecutiveLosses >= 3 || gap <= -5) {
        transition(arc, 'questioned', md, season, 'Dåliga resultat')
      } else if (arc.consecutiveWins >= 5) {
        transition(arc, 'honeymoon', md, season, `${arc.consecutiveWins} raka segrar`)
      } else if (gap >= 4 && md >= 15) {
        transition(arc, 'established', md, season, 'Klart över förväntan')
      } else if (gap >= 2 && md >= 12) {
        transition(arc, 'established', md, season, 'Stabilt över förväntan')
      } else if (md >= 18) {
        const recentFixtures = game.fixtures
          .filter(f => f.status === 'completed' && !f.isCup && !f.isKnockout &&
            (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
          .sort((a, b) => b.matchday - a.matchday)
          .slice(0, 8)
        const wins = recentFixtures.filter(f => deriveUtfall(f, game.managedClubId) === 'vunnet').length
        if (wins >= 5) {
          transition(arc, 'established', md, season, 'Jämn stark form')
        }
      }
      break

    case 'questioned':
      if (arc.consecutiveLosses >= 4) {
        transition(arc, 'crisis', md, season, 'Fortsatt negativt')
        arc.boardWarningGiven = true
      } else if (arc.consecutiveWins >= 3) {
        transition(arc, 'redemption', md, season, `${arc.consecutiveWins} raka segrar`)
      } else if (gap >= 0 && md >= 18) {
        transition(arc, 'grind', md, season, 'Stabiliserat, tillbaka på förväntad nivå')
      }
      break

    case 'crisis':
      if (arc.consecutiveWins >= 2) {
        transition(arc, 'redemption', md, season, 'Vände i sista stund')
      }
      // Sparkning hanteras via boardPatience-systemet
      break

    case 'redemption':
      if (arc.consecutiveWins >= 4 || gap >= 2) {
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

  // PÅSTÅENDEKARTAN, LÄST-FÖRE-INITIERING (2026-08-26, RAPPORT_FYRA_
  // UTREDNINGAR_2026-08-26.md): `updateTrainerArc` körs varje omgång,
  // inklusive säsongens ALLRA FÖRSTA anrop innan en match spelats. Vid
  // matchday 0 är alla klubbar på 0 poäng, och `standing.position` är då
  // bara tabellens alfabetiska tie-break — inte en verklig placering.
  // Eftersom bestFinish bara minskar (aldrig återställs) blev den
  // alfabetiska spökpositionen tidigare PERMANENT (bekräftat: Heros fick
  // bestFinish=4, Forsbacka bestFinish=1, båda vid spelade=0). Golvet
  // `standing.played > 0` säkerställer att position bara citeras efter att
  // minst en match faktiskt avgjort tabellens ordning denna säsong.
  if (standing && standing.played > 0 && pos < arc.bestFinish) arc.bestFinish = pos

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
