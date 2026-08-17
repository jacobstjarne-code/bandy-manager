import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'
import type { PlayoffBracket } from '../entities/Playoff'
import { PlayoffStatus } from '../enums'
import { getManagedClubPlayoffStatus } from './playoffService'

export function generateQuarterFinalEvent(game: SaveGame): GameEvent {
  const history = game.seasonSummaries ?? []
  const lastQF = [...history]
    .filter(s => s.playoffResult === 'quarterfinal' || s.playoffResult === 'semifinal' || s.playoffResult === 'finalist' || s.playoffResult === 'champion')
    .slice(-1)[0]

  let body: string
  if (!lastQF) {
    body = 'Kvartsfinalen. Första gången någonsin vi är här. Kapten samlade alla i omklädningsrummet efter gårdagens pass. "Ingen har sett det här läget. Det är vår chans att bygga något."'
  } else {
    const yearsAgo = game.currentSeason - lastQF.season
    body = `Kvartsfinalen. Senast vi var här: för ${yearsAgo} år sedan. Klackens äldste veteraner minns — de sjöng i tre timmar efter den matchen, oavsett resultat. Nu är vi tillbaka.`
  }

  return {
    id: `playoff_qf_${game.currentSeason}`,
    type: 'playoffEvent',
    title: 'Kvartsfinalen väntar',
    body,
    choices: [{ id: 'ack', label: 'Fokusera', effect: { type: 'noOp' } }],
    resolved: false,
  }
}

export function generateSemiFinalEvent(game: SaveGame): GameEvent {
  const mecenat = (game.mecenater ?? []).find(m => m.isActive)
  const body = mecenat
    ? `Semifinalen. ${mecenat.name} ringer. "Om ni tar er till final — jag och hela kontoret är där. Alla biljetter är mitt ansvar." Det är första gången hen säger något sådant.`
    : 'Semifinalen. Ordföranden skrev ett sms klockan fem på morgonen. "Jag sov två timmar i natt. Är det normalt?"'

  return {
    id: `playoff_sf_${game.currentSeason}`,
    type: 'playoffEvent',
    title: 'Semifinalen — två matcher från guld',
    body,
    choices: [{ id: 'ack', label: 'Andas in', effect: { type: 'noOp' } }],
    resolved: false,
  }
}

export function generateFinalEvent(game: SaveGame): GameEvent {
  const supporter = game.supporterGroup?.leader?.name ?? null
  return {
    id: `playoff_final_${game.currentSeason}`,
    type: 'playoffEvent',
    title: 'SM-finalen',
    body: `Finalen. ${supporter ?? 'Ordföranden'} skrev i klubbens chatt i morse: "Det var förra generationens dröm. Nu är det vår tur att kanske göra den sann. Sov gott i natt om ni kan. Ingen av oss kommer göra det."`,
    choices: [{ id: 'ack', label: 'Det är dags', effect: { type: 'noOp' } }],
    resolved: false,
  }
}

/**
 * A3 (2026-08-17, LÅNGSPEL-audit — samma familj som H-02): konsumtionstids-
 * grind för slutspelets "Fokusera"-kort (playoff_qf_/sf_/final_<säsong>).
 *
 * playoffProcessor.ts's `managedInNewBracket`-check bevisar bara att managed
 * club var en legitim kvarts-/semifinalist/finalist i EXAKT ÖGONBLICKET kortet
 * genererades. Den säger ingenting om huruvida det fortfarande stämmer när
 * kortet faktiskt plockas ut ur kön och visas — KF3s avbrottsbudget
 * (deferredDecisions) kan hålla kvar ett kort i flera omgångar. Observerat
 * konkret i 10-säsongersplaytesten: "Finalen. Birger..." avfyrades trots att
 * managed club redan var utslaget i semifinalen.
 *
 * Detta kompletterar (ersätter inte) playoffProcessor.ts's staleEventIds —
 * den mekanismen rensar ett korts EGEN fas när den avslutas (t.ex. SF-kortet
 * när BÅDA semifinalserierna är avgjorda). Den här funktionen omvärderar
 * giltigheten mot den LEVANDE bracketen varje omgång, oavsett om hela fasen
 * hunnit avslutas — fångar alltså elimineringen samma omgång den sker, inte
 * först när motståndarens parallella serie också är klar.
 *
 * Icke-slutspelskort (alla andra event-typer) passerar opåverkade (true).
 */
export function isPlayoffNarrativeCardStillValid(
  eventId: string,
  bracket: PlayoffBracket | null,
  managedClubId: string,
): boolean {
  const isQF = eventId.startsWith('playoff_qf_')
  const isSF = eventId.startsWith('playoff_sf_')
  const isFinal = eventId.startsWith('playoff_final_')
  if (!isQF && !isSF && !isFinal) return true

  if (!bracket) return false

  const status = getManagedClubPlayoffStatus(bracket, managedClubId)
  if (isQF) return bracket.status === PlayoffStatus.QuarterFinals && !status.eliminated
  if (isSF) return bracket.status === PlayoffStatus.SemiFinals && !status.eliminated
  return bracket.status === PlayoffStatus.Final && status.isInFinal
}
