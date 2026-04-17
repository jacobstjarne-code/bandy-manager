import type { SaveGame } from '../entities/SaveGame'
import type { ArcType } from '../entities/Narrative'
import { getRivalry } from '../data/rivalries'
import { getTransferWindowStatus } from './transferWindowService'
import { FixtureStatus } from '../enums'
import { getCurrentAct } from './seasonActService'
import { getSeasonPhase, type SeasonPhase } from '../data/seasonPhases'

const SEASON_MOOD: Record<SeasonPhase, string[]> = {
  pre_season: ['Ny säsong. Nya möjligheter.'],
  early: [
    'Oktober. Första frosten. Truppen samlas.',
    'Höstmörkret sänker sig. Men isen glänser.',
  ],
  mid: [
    'November. Mörkret har lagt sig. Dagsjobben tar kraft.',
    'December. Julturneringen närmar sig.',
  ],
  endgame: [
    'Februari. Slutstriden börjar ta form.',
    'Varje match räknas nu. Tabellen stramas åt.',
    'Transferfönstret. Alla har någon agent som ringt.',
  ],
  playoff: [
    'Slutspel. Inga andra chanser.',
    'Bäst av fem. Varje match kan vara den sista.',
  ],
}

export interface Briefing {
  text: string
  navigateTo?: { path: string; state?: Record<string, unknown> }
}

function getNextManagedFixture(game: SaveGame) {
  return game.fixtures
    .filter(f => f.status === FixtureStatus.Scheduled && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => a.matchday - b.matchday)[0] ?? null
}

function findHotPlayer(game: SaveGame): { name: string; goals: number; matches: number } | null {
  const managedPlayers = game.players.filter(p => p.clubId === game.managedClubId)
  const completed = game.fixtures.filter(f => f.status === FixtureStatus.Completed && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => b.matchday - a.matchday)
    .slice(0, 5)

  for (const player of managedPlayers) {
    let goals = 0
    for (const fixture of completed) {
      const playerGoals = fixture.events.filter(e => e.type === 'goal' && e.playerId === player.id).length
      goals += playerGoals
    }
    if (goals >= 3) {
      return { name: `${player.firstName} ${player.lastName}`, goals, matches: completed.length }
    }
  }
  return null
}

function findAcademyProspect(game: SaveGame): { name: string; ca: number } | null {
  const youth = game.youthTeam
  if (!youth?.players?.length) return null
  const top = youth.players
    .filter(p => p.currentAbility >= 35)
    .sort((a, b) => b.currentAbility - a.currentAbility)[0]
  if (!top) return null
  return { name: `${top.firstName} ${top.lastName}`, ca: top.currentAbility }
}

function getTransferWindowCountdown(game: SaveGame): { opening: boolean; roundsUntil: number } | null {
  const status = getTransferWindowStatus(game.currentDate)
  const date = new Date(game.currentDate)
  const month = date.getMonth() + 1

  if (status.status !== 'closed') return null

  // Estimate rounds until next window based on current month
  // Season runs Oct–Mar: ~2 rounds/month
  let monthsUntil: number
  if (month >= 11 || month <= 7) {
    // Closed Nov–Dec → Jan (winter window)
    if (month >= 11) monthsUntil = 14 - month  // Nov=3, Dec=2
    else monthsUntil = 8 - month               // Feb=6, Mar=5, ... Jul=1
    // We care about closeness (≤3 rounds away)
    const roundsUntil = monthsUntil * 2
    if (roundsUntil <= 4) {
      return { opening: true, roundsUntil }
    }
  }
  return null
}

function getLatestHeadline(game: SaveGame): string | null {
  const recent = game.inbox
    .filter(i =>
      i.title &&
      (i.type === 'media' || i.type === 'mediaEvent' || i.type === 'matchResult') &&
      !i.title.includes(' · ')  // skip journalist attribution format (e.g. "Name · Outlet")
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 1)[0]
  return recent?.title ?? null
}

export function generateBriefing(game: SaveGame): Briefing | null {
  // -1. Victory echo — show diary line day after special win
  if (game.pendingVictoryEcho) {
    return { text: game.pendingVictoryEcho.diaryLine }
  }

  // 0a. Grind-state — visa exit-villkor så spelaren vet vad som krävs
  if (game.trainerArc?.current === 'grind') {
    const wins = game.trainerArc.consecutiveWins ?? 0
    const needed = 5 - wins
    if (wins >= 2) {
      return { text: `${wins} raka — bara ${needed} till, sen vänder det. Laget vet det.` }
    } else if (game.trainerArc.consecutiveLosses >= 2) {
      return { text: 'Varje match räknas nu. Ett till tappat poäng och styrelsen börjar titta åt fel håll.' }
    } else {
      return { text: 'Det är grind. Laget gör jobbet men genombrottet dröjer. En sejerserie — det är vad som krävs.' }
    }
  }

  // 0b. Captain crisis briefing
  if (game.captainPlayerId && game.trainerArc?.current === 'crisis') {
    const captain = game.players.find(p => p.id === game.captainPlayerId)
    if (captain) {
      return { text: `Kapten ${captain.lastName} samlade truppen efter träningen. Han pratade inte mycket. Det räckte.` }
    }
  }

  // 0. Arc (building phase) — between derby and hot player priority
  const buildingArc = (game.activeArcs ?? []).find(a => a.phase === 'building' && a.playerId)
  if (buildingArc) {
    const arcPlayer = game.players.find(p => p.id === buildingArc.playerId)
    if (arcPlayer) {
      const texts: Partial<Record<ArcType, string>> = {
        hungrig_breakthrough: `${arcPlayer.firstName} ${arcPlayer.lastName} har inte gjort mål på ${buildingArc.data?.gamesWithoutGoal ?? '?'} matcher.`,
        veteran_farewell: `🏅 ${arcPlayer.firstName} ${arcPlayer.lastName}s kontrakt går ut. ${arcPlayer.age} år gammal.`,
        veteran_final_season: `🏅 ${arcPlayer.firstName} ${arcPlayer.lastName} spelar sin sista säsong. ${arcPlayer.age} år. Varje match räknas.`,
        contract_drama: `📋 ${arcPlayer.firstName} ${arcPlayer.lastName} i blåsväder — kontraktet löper ut snart.`,
        lokal_hero: `🏠 Hela orten pratar om ${arcPlayer.firstName} ${arcPlayer.lastName}.`,
        ledare_crisis: `🦁 ${arcPlayer.firstName} ${arcPlayer.lastName} har samlat laget — krisläget kräver ledarskap.`,
      }
      const t = texts[buildingArc.type]
      if (t) {
        return {
          text: t,
          navigateTo: { path: '/game/squad', state: { highlightPlayer: arcPlayer.id } },
        }
      }
    }
  }

  // 1. Derby?
  const nextFixture = getNextManagedFixture(game)
  if (nextFixture) {
    const rivalry = getRivalry(nextFixture.homeClubId, nextFixture.awayClubId)
    if (rivalry) {
      const opponentId = nextFixture.homeClubId === game.managedClubId ? nextFixture.awayClubId : nextFixture.homeClubId
      const h = game.rivalryHistory?.[opponentId]
      const histText = h ? `V${h.wins} O${h.draws} F${h.losses} i historiken.` : 'Historien börjar nu.'
      return { text: `Derby. ${rivalry.name}. ${histText}` }
    }
  }

  // 2. Spelare i form (≥3 mål senaste 5)
  const hot = findHotPlayer(game)
  if (hot) {
    return { text: `📈 ${hot.name} i glödande form — ${hot.goals} mål senaste ${hot.matches} matcherna.` }
  }

  // 3. Patron har krav
  if (game.patron?.isActive && game.patron.demands?.length) {
    return { text: `👤 ${game.patron.name}: "${game.patron.demands[0]}"` }
  }

  // 4. Akademispelare hög CA
  const prospect = findAcademyProspect(game)
  if (prospect) {
    return {
      text: `🎓 ${prospect.name} (P19) börjar visa A-lagsklass — befordra?`,
      navigateTo: { path: '/game/club', state: { tab: 'akademi' } },
    }
  }

  // 5. Transferfönster nära
  const windowInfo = getTransferWindowCountdown(game)
  if (windowInfo) {
    return { text: `💼 Transferfönstret ${windowInfo.opening ? 'öppnar' : 'stänger'} om ${windowInfo.roundsUntil} omgångar.` }
  }

  // 6. Tidningsrubrik
  const headline = getLatestHeadline(game)
  if (headline) {
    return { text: `📰 ${game.localPaperName ?? 'Lokaltidningen'}: ${headline}` }
  }

  // 7. Generationsväxling — 8b: Tomma omklädningsrummet (omgång 1)
  const currentLigaRound = game.fixtures
    .filter(f => f.status === FixtureStatus.Completed && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)
  if (currentLigaRound === 0) {
    const legends = (game.clubLegends ?? []).filter(l => l.retiredSeason === game.currentSeason - 1)
    if (legends.length > 0) {
      return { text: `🏅 Ny säsong. Omklädningsrummet känns tomt utan ${legends[0].name}.` }
    }
  }

  // 7b. Akademistjärnans kliv — 8c
  const academyStars = game.players.filter(p =>
    p.clubId === game.managedClubId &&
    p.promotedFromAcademy &&
    p.seasonStats.gamesPlayed >= 3
  )
  if (academyStars.length > 0) {
    const star = academyStars[academyStars.length - 1]
    return { text: `🎓 ${star.firstName} ${star.lastName} (${star.age}) — tre matcher i A-laget. Akademin levererade.` }
  }

  // 8. Säsongsfas-stämning (30% chans)
  const isPlayoff = game.fixtures.some(f => f.matchday > 26 && f.status === FixtureStatus.Scheduled)
  const phase = getSeasonPhase(currentLigaRound, isPlayoff)
  const phaseSeed = currentLigaRound * 17 + game.currentSeason * 11
  if (phaseSeed % 3 === 0) {
    const moodPool = SEASON_MOOD[phase]
    return { text: `🕯️ ${moodPool[Math.abs(phaseSeed) % moodPool.length]}` }
  }

  // 9. Akt-baserade briefings
  const act = getCurrentAct(currentLigaRound)
  const standing = game.standings.find(s => s.clubId === game.managedClubId)
  const seed = currentLigaRound * 13 + game.currentSeason * 7
  const ACT_BRIEFINGS: Record<typeof act, string[]> = {
    1: ['📅 Tabellen tar form. Allt är möjligt.', '📅 Säsongen är ung. Låt spelet visa vad ni kan.', '📅 Tidiga poäng väger lika tungt som sena.'],
    2: ['❄️ Vintern testar alla. Utvisningarna avgör.', '❄️ Det är nu karaktären syns. I februari minns alla.', '❄️ Ingen ledar sin väg till guldet om januari säger nej.'],
    3: [`📊 Tabellen klarnar. ${standing ? `Ni är på plats ${standing.position}.` : ''}`, '📊 Varje poäng väger. Ingen match är liten nu.', '📊 Nio lag kan fortfarande spela slutspel. Det är dags att skilja sig.'],
    4: ['⏱ Sista raka. Inget utrymme för misstag.', '⏱ De sista omgångarna minns man resten av livet.', '⏱ Avgörandet. Nu spelar allt annat sekundär roll.'],
  }
  const pool = ACT_BRIEFINGS[act]
  return { text: pool[Math.abs(seed) % pool.length] }
}
