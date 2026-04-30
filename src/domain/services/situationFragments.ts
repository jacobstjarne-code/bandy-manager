/**
 * situationFragments.ts
 *
 * Pure fragment-builders. Var och en returnerar en kort mening (string) eller
 * null om fragmentet inte är relevant. getSituation() plockar ihop 1–3 fragment.
 *
 * Textinnehållet är placeholder-nivå — Opus fyller med slutliga meningar.
 * Logiken (när ett fragment ska synas) ska vara klar och testbar.
 */

import type { SaveGame } from '../entities/SaveGame'
import { getRivalry } from '../data/rivalries'

// ── Helpers ──────────────────────────────────────────────────────────────────

function nextManagedFixture(game: SaveGame) {
  const id = game.managedClubId
  const bracket = game.playoffBracket
  const eliminated = bracket
    ? [...(bracket.quarterFinals ?? []), ...(bracket.semiFinals ?? []), ...(bracket.final ? [bracket.final] : [])]
        .some(s => s.loserId === id)
    : false

  return game.fixtures
    .filter(f => {
      if (f.status !== 'scheduled') return false
      if (f.homeClubId !== id && f.awayClubId !== id) return false
      if (eliminated && f.matchday > 26 && !f.isCup) return false
      return true
    })
    .sort((a, b) => a.matchday - b.matchday)[0] ?? null
}

function opponentId(game: SaveGame, fixture: ReturnType<typeof nextManagedFixture>) {
  if (!fixture) return null
  const id = game.managedClubId
  return fixture.homeClubId === id ? fixture.awayClubId : fixture.homeClubId
}

function ordinalSv(n: number): string {
  if (n === 1) return '1:a'
  if (n === 2) return '2:a'
  if (n === 3) return '3:e'
  return `${n}:e`
}

// ── Fragment: motståndarens tabellposition ───────────────────────────────────

export function getOpponentStandingFragment(game: SaveGame): string | null {
  const next = nextManagedFixture(game)
  if (!next || next.isCup) return null
  const oppId = opponentId(game, next)
  if (!oppId) return null
  const oppStanding = game.standings.find(s => s.clubId === oppId)
  const oppClub = game.clubs.find(c => c.id === oppId)
  if (!oppStanding || !oppClub) return null

  const oppPos = oppStanding.position
  const myPos = game.standings.find(s => s.clubId === game.managedClubId)?.position ?? 12
  const name = oppClub.shortName ?? oppClub.name.split(' ')[0]

  if (oppPos <= 3) return `${name} ligger ${ordinalSv(oppPos)}. Ett av seriens bättre lag.`
  if (oppPos >= 10) return `${name} ligger ${ordinalSv(oppPos)}. Sånt är inte gratis.`
  if (Math.abs(oppPos - myPos) <= 1) return `${name} och ni delar tabellgrannar — ${ordinalSv(oppPos)} mot ${ordinalSv(myPos)}.`
  const posDiff = Math.abs(myPos - oppPos)
  if (oppPos < myPos) return posDiff <= 2 ? `${name} ligger ${ordinalSv(oppPos)} — över er.` : null
  return `${name} ligger ${ordinalSv(oppPos)} — under er.`
}

// ── Fragment: senaste mötet ──────────────────────────────────────────────────

export function getLastMeetingFragment(game: SaveGame): string | null {
  const next = nextManagedFixture(game)
  if (!next) return null
  const oppId = opponentId(game, next)
  if (!oppId) return null
  const managedId = game.managedClubId

  const lastMeeting = game.fixtures
    .filter(f =>
      f.status === 'completed' &&
      ((f.homeClubId === managedId && f.awayClubId === oppId) ||
       (f.homeClubId === oppId && f.awayClubId === managedId))
    )
    .sort((a, b) => b.matchday - a.matchday)[0]

  if (!lastMeeting) return null

  const isHome = lastMeeting.homeClubId === managedId
  const scored = isHome ? lastMeeting.homeScore : lastMeeting.awayScore
  const conceded = isHome ? lastMeeting.awayScore : lastMeeting.homeScore

  if (scored > conceded) return `Senast ni möttes vann ni ${scored}–${conceded}. Det glömmer de inte.`
  if (scored < conceded) return `Senast: ${conceded}–${scored} till dem. Revanschchans.`
  return `Senaste mötet ${scored}–${scored}. Aldrig avgjort, alltid jämnt.`
}

// ── Fragment: rivalry ────────────────────────────────────────────────────────

export function getRivalryFragment(game: SaveGame): string | null {
  const next = nextManagedFixture(game)
  if (!next) return null
  const oppId = opponentId(game, next)
  if (!oppId) return null

  const rivalry = getRivalry(game.managedClubId, oppId)
  if (!rivalry) return null

  if (rivalry.intensity >= 3) return `${rivalry.name}. Den lever länge i byn oavsett vad som händer.`
  if (rivalry.intensity === 2) return `${rivalry.name}. Inte vilken match som helst.`
  return `${rivalry.name}.`
}

// ── Fragment: playoff-kontext (position + strecket) ──────────────────────────

export function getPlayoffContextFragment(game: SaveGame): string | null {
  const managedId = game.managedClubId
  const completedLeague = game.fixtures.filter(
    f => f.status === 'completed' && !f.isCup &&
      (f.homeClubId === managedId || f.awayClubId === managedId)
  ).length
  if (completedLeague < 3) return null  // för tidigt

  const myStanding = game.standings.find(s => s.clubId === managedId)
  if (!myStanding) return null

  const sorted = [...game.standings].sort((a, b) => b.points - a.points)
  const eighth = sorted[7]
  const first = sorted[0]
  if (!eighth || !first) return null

  const myPos = myStanding.position
  const myPts = myStanding.points

  if (myPos === 1) {
    const gap = myPts - sorted[1].points
    if (gap >= 4) return `${gap} poäng ner till tvåan. Komfortabelt — men säsongen är inte slut.`
    return `Knapp ledning. Tvåan andas i nacken.`
  }

  if (myPos <= 8) {
    const gap = myPts - eighth.points
    if (gap === 0) return `Precis på strecket. En match är allt.`
    if (gap <= 2) return `${gap}p över strecket. Inget marginal.`
    return null
  }

  // Utanför playoff
  const ptsBehind = eighth.points - myPts
  const oppClub = game.clubs.find(c => c.id === eighth.clubId)
  const eighthName = oppClub?.shortName ?? oppClub?.name.split(' ')[0] ?? 'åttan'
  if (ptsBehind <= 4) return `${ptsBehind}p upp till ${eighthName} — kan tas igen.`
  return `${ptsBehind}p upp till playoff. Långt — men inte omöjligt.`
}

// ── Fragment: cup-stake (vad vinst innebär) ──────────────────────────────────

export function getCupStakeFragment(game: SaveGame): string | null {
  const next = nextManagedFixture(game)
  if (!next?.isCup) return null

  const cupBracket = game.cupBracket
  if (!cupBracket) return null

  const cupMatch = cupBracket.matches.find(m => m.fixtureId === next.id)
  if (!cupMatch) return null

  const round = cupMatch.round
  if (round === 1) return `Vinst ger kvartsfinal — fyra lag kvar.`
  if (round === 2) return `Vinst ger semi.`
  if (round === 3) return `Vinst ger final.`
  if (round === 4) return `Det här är finalen. Det finns inget mer.`
  return null
}

// ── Fragment: skador i managed laget (inför match) ───────────────────────────

export function getInjuryImpactFragment(game: SaveGame): string | null {
  const managedId = game.managedClubId
  const injured = game.players.filter(
    p => p.clubId === managedId && p.isInjured
  )
  if (injured.length === 0) return null

  // Identifiera om någon av de skadade är en "stjärna" (hög form eller rating)
  const topInjured = injured.sort((a, b) =>
    ((b.form ?? 50) + (b.currentAbility ?? 50)) - ((a.form ?? 50) + (a.currentAbility ?? 50))
  )[0]

  const weeksLeft = Math.ceil((topInjured.injuryDaysRemaining ?? 0) / 7)
  const name = topInjured.lastName

  if (injured.length === 1) {
    if (weeksLeft === 0) return `${name} på gränsen. Spelar eller spelar inte.`
    if (weeksLeft === 1) return `${name} borta en vecka till.`
    return `${name} borta i ${weeksLeft} veckor.`
  }
  if (injured.length === 2) return `Två spelare borta. ${name} är en av dem.`
  return `${injured.length} spelare borta. ${name} också.`
}

// ── Fragment: säsongskontext (premiär, halvtid, slutspurt) ───────────────────

export function getSeasonPhaseFragment(game: SaveGame): string | null {
  const managedId = game.managedClubId
  const completedLeague = game.fixtures.filter(
    f => f.status === 'completed' && !f.isCup &&
      (f.homeClubId === managedId || f.awayClubId === managedId)
  ).length

  if (completedLeague === 0) return `Säsongen börjar nu. 22 omgångar, en cup, ett slutspel.`
  if (completedLeague === 11) return `Halvtid. Det ni gjort står — det som kommer ligger framför er.`
  const roundsLeft = 22 - completedLeague
  if (roundsLeft === 1) return `Sista omgången. Allt eller ingenting.`
  if (roundsLeft <= 3 && roundsLeft >= 2) return `${roundsLeft} omgångar kvar. Mätningens tid.`
  return null
}
