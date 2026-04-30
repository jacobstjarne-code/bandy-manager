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

  if (oppPos <= 3) return `${name} ligger ${ordinalSv(oppPos)} — ett av seriens starkaste lag.`
  if (oppPos >= 10) return `${name} är ${ordinalSv(oppPos)} — ett lag ni förväntas slå.`
  if (Math.abs(oppPos - myPos) <= 1) return `${name} är på ${ordinalSv(oppPos)} plats — i princip tabellgrannar.`
  if (oppPos < myPos) return `${name} är ${oppPos - myPos > 0 ? '' : ''}${ordinalSv(oppPos)} — ovanför er i tabellen.`
  return `${name} är ${ordinalSv(oppPos)} — under er i tabellen.`
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

  if (scored > conceded) return `Senast möttes ni vann ni ${scored}–${conceded}.`
  if (scored < conceded) return `Senast möttes ni förlorade ni ${conceded}–${scored}.`
  return `Senaste mötet slutade ${scored}–${conceded}.`
}

// ── Fragment: rivalry ────────────────────────────────────────────────────────

export function getRivalryFragment(game: SaveGame): string | null {
  const next = nextManagedFixture(game)
  if (!next) return null
  const oppId = opponentId(game, next)
  if (!oppId) return null

  const rivalry = getRivalry(game.managedClubId, oppId)
  if (!rivalry) return null

  if (rivalry.intensity >= 3) return `Det är ${rivalry.name}. Resultatet lever kvar länge i byn.`
  if (rivalry.intensity === 2) return `${rivalry.name} — alltid en match som betyder lite mer.`
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
    if (gap >= 4) return `Ni leder med ${gap} poäng ner till tvåan.`
    return `Ni leder, men ${sorted[1] ? (game.clubs.find(c => c.id === sorted[1].clubId)?.shortName ?? '') : ''} är nära.`
  }

  if (myPos <= 8) {
    const gap = myPts - eighth.points
    if (gap <= 2) return `${gap === 0 ? 'Precis på strecket' : `${gap}p över strecket`} — det är nära.`
    return null  // komfortabelt inne, inget att säga
  }

  // Utanför playoff
  const ptsBehind = eighth.points - myPts
  const oppClub = game.clubs.find(c => c.id === eighth.clubId)
  const eighthName = oppClub?.shortName ?? oppClub?.name.split(' ')[0] ?? 'åttan'
  if (ptsBehind <= 4) return `${ptsBehind}p upp till ${eighthName} på strecket.`
  return `${ptsBehind}p upp till playoff — det är långt.`
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
  if (round === 1) return `Vinner ni möter ni ett av fyra lag i kvartsfinal.`
  if (round === 2) return `Vinner ni är ni i semifinal.`
  if (round === 3) return `Vinner ni spelar ni SM-final.`
  if (round === 4) return `Det är cupen. Det finns inget mer att vinna.`
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
    if (weeksLeft === 0) return `${name} är på gränsen — kan spela, kan inte.`
    return `${name} är borta ${weeksLeft > 1 ? `${weeksLeft} veckor till` : 'ytterligare en vecka'}.`
  }
  return `${injured.length} spelare borta, däribland ${name}.`
}

// ── Fragment: säsongskontext (premiär, halvtid, slutspurt) ───────────────────

export function getSeasonPhaseFragment(game: SaveGame): string | null {
  const managedId = game.managedClubId
  const completedLeague = game.fixtures.filter(
    f => f.status === 'completed' && !f.isCup &&
      (f.homeClubId === managedId || f.awayClubId === managedId)
  ).length

  if (completedLeague === 0) return `22 ligaomgångar, en cup och ett slutspel framför er.`
  if (completedLeague === 11) return `Halvtid. Resten av säsongen är er att forma.`
  const roundsLeft = 22 - completedLeague
  if (roundsLeft <= 3 && roundsLeft >= 1) return `${roundsLeft === 1 ? 'Sista omgången' : `${roundsLeft} omgångar kvar`} av grundserien.`
  return null
}
