import type { SaveGame, InboxItem } from '../entities/SaveGame'
import type { Player } from '../entities/Player'
import { InboxItemType } from '../enums'
import { CALLUP_NOTICE_LINES, RETURN_SCENE_LINES } from '../data/landslagText'

// Release-svepet 2026-07-21 (Block 2c): HANDOFF-C-K1-LANDSLAG-2026-05-23.md
// Q3, låst av Jacob 2026-05-23 — "+5 tkr/uttagen, synligt narrativt". Fanns
// låst men aldrig kodad förrän CALLUP_MODAL byggdes (modalen visar summan,
// den måste vara verklig — inte en påhittad siffra på skärmen). Klubbens
// finance-fält muteras INTE här — roundProcessor.ts applicerar bonusTkr mot
// den slutgiltiga clubs-kedjan (samma efterhands-mönster som marketValueInbox),
// eftersom denna funktion körs innan economy/transfer-kedjan i roundProcessor.
export const CALLUP_BONUS_PER_PLAYER_TKR = 5

// M16 (regelboksanpassning 2026-07-03): förtjänstmodell. Ersätter den tidigare
// alltid-3-till-5-uttagna-logiken (underminerade "säsongens guldkorn"-premissen
// i landslagText — varje bruksklubb fick garanterat flera landslagsspelare).
// Bara spelare med currentAbility ≥ tröskeln kvalar. Tröskeln kalibrerad via
// Monte Carlo mot samma tier/CA-fördelning som worldGenerator.ts genererar
// (tierFromReputation: top ≥75 rep → CA 55-75 bas, mid 55-74 rep → CA 42-62
// bas, under <55 rep → CA 30-52 bas, alla ±8 jitter): vid tröskel 66 får en
// toppklubb (rep ≥75) konsekvent 2 uttagna (cap), en mittenklubb (rep 55-74,
// "bruksklubb") i snitt 0,6-0,7 (dvs oftast 0, ibland 1), en klubb under 55
// rep i praktiken aldrig. 0 uttagna är ett GILTIGT utfall — no-opas tyst av
// anropskoden i roundProcessor.ts (calledUpIds.length > 0-grinden finns redan).
export const LANDSLAGS_CA_TROSKEL = 66
export const CALLUP_CAP = 2

export function selectNationalTeam(game: SaveGame): string[] {
  // Only players from the managed club are tracked
  const squad = game.players.filter(p =>
    p.clubId === game.managedClubId && !p.isInjured && p.suspensionGamesRemaining === 0
  )

  const qualified = squad
    .filter(p => p.currentAbility >= LANDSLAGS_CA_TROSKEL)
    .map(p => ({ id: p.id, score: p.currentAbility + (p.form > 65 ? 3 : 0) }))
    .sort((a, b) => b.score - a.score)

  return qualified.slice(0, CALLUP_CAP).map(p => p.id)
}

// Konsoliderad 2026-07-18 (nationalTeam-konsolideringen): roundProcessor.ts hade
// återimplementerat denna logik inline med extra sidoeffekter (inbox-notiser) som
// dessa funktioner saknade — den var den enda som faktiskt kördes. Verifierat en
// äkta värdedrift innan sammanslagning: den gamla `round = game.currentMatchday`
// pekade på FÖREGÅENDE omgång (currentMatchday sätts till nextMatchday först i
// slutet av roundProcessor-anropet), medan inline korrekt använde `nextMatchday`
// (omgången uttagningen faktiskt sker i). Inline var sanningen — round tas nu in
// som explicit parameter istf att derivas ur ett stale state-fält. Snub-mekaniken
// (samma trigger-block i roundProcessor.ts) har ingen egen service-motsvarighet
// och konsolideras inte hit — den är inte en duplicering, bara grannkod.
export function applyCallupEffects(
  game: SaveGame,
  players: Player[],
  playerIds: string[],
  round: number,
): {
  players: Player[]
  activeNationalTeamCamp: { startRound: number; endRound: number; playerIds: string[] }
  inboxItems: InboxItem[]
  callupModal: { playerIds: string[]; names: string[]; bonusTkr: number }
} {
  const calledUpPlayers = players.filter(p => playerIds.includes(p.id))
  const names = calledUpPlayers.map(p => p.lastName)
  const nameStr = names.length === 1
    ? names[0]
    : `${names.slice(0, -1).join(', ')} och ${names[names.length - 1]}`

  const bonusTkr = CALLUP_BONUS_PER_PLAYER_TKR * playerIds.length

  const noticeTemplates = playerIds.length === 1 ? CALLUP_NOTICE_LINES.single : CALLUP_NOTICE_LINES.multi
  const noticeTemplate = noticeTemplates[game.currentSeason % noticeTemplates.length]
  const noticeBody = noticeTemplate
    .replace('{spelare}', nameStr)
    .replace('{spelare_lista}', nameStr)

  const inboxItems: InboxItem[] = []
  const callupInboxId = `inbox_vm_callup_${game.currentSeason}`
  if (!game.inbox.some(i => i.id === callupInboxId)) {
    inboxItems.push({
      id: callupInboxId,
      date: game.currentDate,
      type: InboxItemType.Community,
      title: 'VM-uttagning',
      body: noticeBody,
      isRead: false,
    })
  }

  const updatedPlayers = players.map(p => {
    if (!playerIds.includes(p.id)) return p
    const isFirstCallup = !p.nationalTeamCallups
    return {
      ...p,
      nationalTeamCallups: (p.nationalTeamCallups ?? 0) + 1,
      lastNationalTeamCallup: game.currentSeason,
      // Release-svepet 2026-07-21 (Block 2b): frusna en gång, till skillnad
      // från callup-räknaren ovan — se Player.ts:s kommentar vid fälten.
      // `round`-parametern är redan den globala matchdagen (se kommentaren
      // ovanför funktionen, konsolideringen 2026-07-18), inte ligaomgången.
      firstNationalTeamCallupSeason: isFirstCallup ? game.currentSeason : p.firstNationalTeamCallupSeason,
      firstNationalTeamCallupMatchday: isFirstCallup ? round : p.firstNationalTeamCallupMatchday,
    }
  })

  return {
    players: updatedPlayers,
    activeNationalTeamCamp: { startRound: round, endRound: round + 1, playerIds },
    inboxItems,
    callupModal: { playerIds, names: calledUpPlayers.map(p => `${p.firstName} ${p.lastName}`), bonusTkr },
  }
}

export function applyReturnEffects(
  game: SaveGame,
  players: Player[],
  camp: NonNullable<SaveGame['activeNationalTeamCamp']>,
): { players: Player[]; inboxItems: InboxItem[]; returnLine: string } {
  const updatedPlayers = players.map(p => {
    if (!camp.playerIds.includes(p.id)) return p
    return {
      ...p,
      form: Math.min(100, p.form + 4),
      morale: Math.min(100, p.morale + 6),
    }
  })

  const returnedPlayers = players.filter(p => camp.playerIds.includes(p.id))
  const names = returnedPlayers.map(p => p.lastName)
  const nameStr = names.length === 1
    ? names[0]
    : `${names.slice(0, -1).join(', ')} och ${names[names.length - 1]}`

  // Release-svepet 2026-07-21 (Block 2a): RETURN_SCENE_LINES.gold ("kom hem
  // med VM-guld") kräver ett VM-turneringsutfall som inte finns — lägret är
  // ren avresa+hemkomst, inget resultat simuleras. Att slumpa fram "guld"
  // utan bakomliggande state hade varit en påhittad historisk händelse
  // spelaren läser som sann (SPÅRBARA SPELARKEDJAN, CLAUDE.md). Bara
  // .standard wirat här; .gold väntar på en VM-turneringsmekanik — rapporterat
  // till Jacob, inte byggt i det här svepet.
  const returnTemplate = RETURN_SCENE_LINES.standard[game.currentSeason % RETURN_SCENE_LINES.standard.length]
  const returnLine = returnTemplate.replace('{spelare}', nameStr)

  const inboxItems: InboxItem[] = []
  const returnInboxId = `inbox_vm_return_${game.currentSeason}`
  if (!game.inbox.some(i => i.id === returnInboxId)) {
    inboxItems.push({
      id: returnInboxId,
      date: game.currentDate,
      type: InboxItemType.Community,
      title: 'Landslagsspelarna är tillbaka',
      body: returnLine,
      isRead: false,
    })
  }

  return { players: updatedPlayers, inboxItems, returnLine }
}
