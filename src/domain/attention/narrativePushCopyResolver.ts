import type { SaveGame } from '../entities/SaveGame'
import { resolveSubjectName } from '../services/momentLedgerService'
import { getNextManagedFixture } from '../services/portal/triggers/matchTriggers'
import { getManagerReturnContext } from '../services/managerReturnService'
import type { AttentionVoice } from './types'
import type { ForwardPushPayload, NarrativePushCopy, NarrativePushCopyResolver } from './narrativePushAdapter'

/**
 * Läser/skriver "vilken röst visades sist för detta scenario" så resolvern
 * kan hålla registrets §8.1-regel (aldrig samma variant två leveranser i
 * rad). Domänlagret ska vara rent — nyckel-persistensen (localStorage i
 * produktion) hör hemma i infrastrukturlagret, se
 * `src/infrastructure/attention/attentionClient.ts`s egna nycklar
 * (IDENTITY_KEY/ENABLED_KEY) för samma mönster.
 */
export interface PushCopyRotationStore {
  getLastVoice(scenarioKey: string): AttentionVoice | undefined
  setLastVoice(scenarioKey: string, voice: AttentionVoice): void
}

const WEEKDAYS = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag']

/** Registret §8.4: "{dag}" renderas som veckodag ("på lördag"). */
function weekdayLabel(isoDate: string): string {
  return WEEKDAYS[new Date(`${isoDate}T00:00:00`).getDay()]
}

function pickVoice(
  rotation: PushCopyRotationStore,
  scenarioKey: string,
  options: readonly [AttentionVoice, ...AttentionVoice[]],
): AttentionVoice {
  const last = rotation.getLastVoice(scenarioKey)
  const lastIndex = last ? options.indexOf(last) : -1
  const chosen = options[(lastIndex + 1) % options.length]
  rotation.setLastVoice(scenarioKey, chosen)
  return chosen
}

function nextOpponentClubId(game: SaveGame, fixture: SaveGame['fixtures'][number]): string {
  return fixture.homeClubId === game.managedClubId ? fixture.awayClubId : fixture.homeClubId
}

/**
 * stickiness-copy-roster (register LÅST 2026-09-04, wiring 2026-09-06) —
 * löser `narrative_return`-kategorins scenarier som har en verklig, levande
 * liggarproducent idag: revansch (`buildMatchResultLedgerEntry`,
 * clubMemoryEventBuilders.ts, skrivs i roundProcessor.ts), ex-spelare i
 * motståndarlaget (`transferProcessor.ts:521`) och manager-återkomst
 * (`switchManagedClub.ts`, se nedan).
 *
 * "Återkommande taktiskt misslyckande" (B12-mönster) — WIRAD 2026-09-08
 * (Code), SMAL scope-dom (TEXTLEVERANS_OPUS_2026-09-08): den generella
 * 13-faktorsversionen (valfri kostnadsfaktor) är POST_LAUNCH, bara den
 * verifierade formation_523+Suspension-kombinationen är byggd (se
 * `clubMemoryEventBuilders.ts`s `buildTacticalPatternSuspension523LedgerEntry`).
 *
 * "Återkomst till gamla klubben" — WIRAD 2026-09-08 (Code),
 * docs/dom/DOM_MANAGER_ATERKOMST_2026-09-08.md. Byggdes FÖRST som ett state-undantag
 * i `calendar_anchor` (läste `clubSpells` direkt i pushadaptern) — Opus
 * dömde det fel: händelsen ÄR en händelse (skedde vid signeringen), hör
 * ontologiskt i liggaren som license_event/board_verdict, och ett
 * state-undantag hade kringgått redaktörens dirigent-koordinering. Rättad
 * till en kanonisk `manager_return`-liggarpost (`switchManagedClub.ts`,
 * subject=klubben som tas över). Grenen nedan verifierar ÄNDÅ "första
 * gången" via `managerReturnService.getManagerReturnContext` innan den
 * renderar — inte för att välja kandidaten (det gör agendan/redaktören),
 * utan för att redaktörens untoldness är en mjuk nedprioritering, inte en
 * hård spärr, och den låsta texten kräver att "första gången" är ordagrant
 * sant varje gång den visas.
 *
 * Nemesis — WIRAD 2026-09-08 (Code), sedan k12 (`DOM_K12_TRANSFER_TARGET_
 * MISSED_2026-09-08.md`, commit `c71b4d3e`) gav rätt liggartyp ett verkligt
 * producentspår. KORRIGERAT 2026-09-07 (Code, PRE-SPEC CROSS-CHECK, kvar som
 * historik): "noll skrivvägar" höll aldrig för `nemesis_signed` — den har en
 * producent sedan 2026-04-25 (`transferProcessor.ts:458-473`) och flödar
 * redan till Krönikan/`reviewCallbackService.ts`, men berättar MOTSATT
 * historia mot registrets låsta text ("en tidigare tormentor (3+ mål mot
 * oss) är nu VÅR", triumf). Registrets §7-rad ("Han valde {Motståndare}.
 * {Namn}, som {Klubb} jagade. På {dag} står han på andra sidan.") beskriver
 * en spelare VI jagade och missade som nu står emot oss — exakt
 * `transfer_target_missed` (subject=den jagade spelaren, subject2=hans klubb
 * vid budtillfället), inte `nemesis_signed`. Grenen nedan läser den rätta
 * typen; `nemesis_signed`s egen, sanna historia ("triumf över en gammal
 * plågoande") saknar fortfarande egen låst push-text — ingen ny gren utan
 * Opus-text.
 *
 * Kalenderankare och säsongsläge läser sina egna framåtblickande payloads.
 * Mallarna är ordagrant låsta i copy-registrets §2–§3. Varje gren avstår om
 * ett fält som just den mallen behöver saknas — hellre ingen push än en
 * påhittad dag, klubb eller tabellmarginal.
 */
export function createNarrativePushCopyResolver(
  game: SaveGame,
  rotation: PushCopyRotationStore,
): NarrativePushCopyResolver {
  return (payload: ForwardPushPayload): NarrativePushCopy | null => {
    const ownClub = game.clubs.find(c => c.id === game.managedClubId)
    const ownClubName = ownClub?.shortName ?? ownClub?.name
    if (!ownClubName) return null

    if (payload.category === 'calendar_anchor') {
      if (!payload.fixture.date) return null
      const opponent = game.clubs.find(c => c.id === payload.opponentClubId)
      const opponentName = opponent?.shortName ?? opponent?.name
      if (!opponentName) return null
      const dag = weekdayLabel(payload.fixture.date)

      if (payload.kind === 'cup') {
        if (!payload.fixture.venueCity) return null
        return {
          voice: 'press',
          title: `Cupkväll i ${payload.fixture.venueCity}.`,
          body: `${opponentName} på ${dag}. Vinnaren går vidare, förloraren åker hem.`,
        }
      }

      if (payload.kind === 'final') {
        const voices: [AttentionVoice, ...AttentionVoice[]] = (game.fanMood ?? 50) >= 60
          ? ['press', 'club', 'fans']
          : ['press', 'club']
        const voice = pickVoice(rotation, 'anchor_final', voices)
        if (voice === 'press') {
          return { voice, title: 'Final.', body: `${ownClubName} mot ${opponentName}. En match, ett år.` }
        }
        if (voice === 'fans') {
          return { voice, title: 'Hela orten åker.', body: `Final mot ${opponentName}. Bussarna är fulla.` }
        }
        return {
          voice,
          title: `Det är final på ${dag}.`,
          body: `Mot ${opponentName}. Ingen påminnelse behövs, men här är en.`,
        }
      }

      if (payload.kind === 'playoff') {
        if (!payload.playoffStage) return null
        return {
          voice: 'press',
          title: 'Slutspelet börjar.',
          body: `${opponentName} i ${payload.playoffStage}.`,
        }
      }

      if (payload.kind === 'annandag') {
        return {
          voice: 'club',
          title: 'Annandagen.',
          body: `${opponentName} ${payload.venue}. Som varje år.`,
        }
      }

      const voices: [AttentionVoice, ...AttentionVoice[]] = (game.fanMood ?? 50) >= 60
        ? ['press', 'club', 'fans']
        : ['press', 'club']
      const voice = pickVoice(rotation, 'anchor_derby', voices)
      if (voice === 'press') {
        return {
          voice,
          title: 'Derbyveckan är här.',
          body: `${ownClubName}–${opponentName} ${payload.venue} på ${dag}. Orten pratar inte om något annat.`,
        }
      }
      if (voice === 'fans') {
        return {
          voice,
          title: 'Läktaren är redan där.',
          body: `Derby mot ${opponentName}. Klacken sjunger sedan i onsdags.`,
        }
      }
      return { voice, title: `Derby på ${dag}.`, body: `${opponentName}. Du vet.` }
    }

    if (payload.category === 'season_context') {
      if (payload.kind === 'title') {
        if (payload.pointsTo.title <= 0) return null
        return {
          voice: 'chair',
          title: 'Serieseger inom räckhåll.',
          body: `${payload.pointsTo.title} poäng, ${payload.roundsRemaining} ${payload.roundsRemaining === 1 ? 'omgång' : 'omgångar'}. Ordföranden har inte sovit.`,
        }
      }

      if (payload.kind === 'playoff_edge') {
        if (payload.pointsTo.playoff <= 0) return null
        const voice = pickVoice(rotation, 'season_playoff_edge', ['chair', 'assistant'])
        return voice === 'chair'
          ? {
              voice,
              title: `${payload.pointsTo.playoff} poäng till slutspel.`,
              body: `${payload.roundsRemaining} ${payload.roundsRemaining === 1 ? 'omgång' : 'omgångar'} kvar. Styrelsen räknar. Det gör vi alla.`,
            }
          : {
              voice,
              title: 'Slutspelet går att nå.',
              body: `${payload.pointsTo.playoff} poäng på ${payload.roundsRemaining} ${payload.roundsRemaining === 1 ? 'match' : 'matcher'}. Jag tror på det. Laget vet inte än.`,
            }
      }

      if (payload.kind === 'relegation') {
        if (payload.pointsTo.safety <= 0) return null
        const voice = pickVoice(rotation, 'season_relegation', ['chair', 'assistant'])
        return voice === 'chair'
          ? {
              voice,
              title: `${payload.position}:e plats.`,
              body: `${payload.pointsTo.safety} poäng till säkerhet, ${payload.roundsRemaining} ${payload.roundsRemaining === 1 ? 'omgång' : 'omgångar'}. Vi behöver inte prata om vad det betyder.`,
            }
          : {
              voice,
              title: 'Vi ligger illa.',
              body: `${payload.position}:e, ${payload.pointsTo.safety} poäng till säkerhet. Jag säger det rakt, för ingen annan gör det.`,
            }
      }

      if (!payload.form || !payload.nextFixture?.date || !payload.nextOpponentClubId) return null
      const opponent = game.clubs.find(c => c.id === payload.nextOpponentClubId)
      const opponentName = opponent?.shortName ?? opponent?.name
      if (!opponentName) return null
      const dag = weekdayLabel(payload.nextFixture.date)
      return payload.kind === 'streak_w'
        ? {
            voice: 'club',
            title: `${payload.form.length} raka.`,
            body: `${opponentName} nästa. Serien håller tills den inte gör det.`,
          }
        : {
            voice: 'club',
            title: `${payload.form.length} raka förluster.`,
            body: `${opponentName} på ${dag}. Något måste ändras, eller inte.`,
          }
    }

    const item = payload.item

    const fixture = getNextManagedFixture(game)
    if (!fixture?.date) return null
    const opponentId = nextOpponentClubId(game, fixture)
    const dag = weekdayLabel(fixture.date)

    // Revansch (register §4) — big_loss / förlorat derby mot exakt nästa motstånd, ≤1 säsong.
    if (
      (item.post.type === 'big_loss' || (item.post.type === 'derby_result' && item.post.outcome === 'lost')) &&
      item.post.subject?.kind === 'club' &&
      item.post.subject.id === opponentId &&
      item.post.result
    ) {
      const seasonsAgo = game.currentSeason - item.post.season
      if (seasonsAgo < 0 || seasonsAgo > 1) return null
      const opponentName = resolveSubjectName(game, item.post.subject, item.post.subjectSnapshot)
      if (!opponentName) return null
      const resultat = `${item.post.result.goalsFor}–${item.post.result.goalsAgainst}`
      const timeframe = seasonsAgo === 0 ? 'i höstas' : 'förra säsongen'
      const voice = pickVoice(rotation, 'memory_revenge', ['press', 'club'])
      return voice === 'press'
        ? {
            voice,
            title: 'Revanschen väntar.',
            body: `${opponentName} slog ${ownClubName} med ${resultat} ${timeframe}. På ${dag} möts de igen.`,
          }
        : {
            voice,
            title: `${opponentName}. Igen.`,
            body: `${resultat} förra gången. Den siffran står kvar i Krönikan.`,
          }
    }

    // Ex-spelare i motståndarlaget (register §4) — transfer_sold till exakt nästa motstånd.
    if (
      item.post.type === 'transfer_sold' &&
      item.post.subject?.kind === 'player' &&
      item.post.subject2?.kind === 'club' &&
      item.post.subject2.id === opponentId
    ) {
      const seasonsAgo = game.currentSeason - item.post.season
      if (seasonsAgo < 0 || seasonsAgo > 1) return null
      const playerName = resolveSubjectName(game, item.post.subject, item.post.subjectSnapshot)
      const opponentName = resolveSubjectName(game, item.post.subject2, item.post.subject2Snapshot)
      if (!playerName || !opponentName) return null
      const timeframe = seasonsAgo === 0 ? 'i somras' : 'förra året'
      const voice = pickVoice(rotation, 'memory_ex_player', ['press', 'club'])
      return voice === 'press'
        ? {
            voice,
            title: `${playerName} kommer tillbaka.`,
            body: `Såld till ${opponentName} ${timeframe}. På ${dag} spelar han mot ${ownClubName}.`,
          }
        : {
            voice,
            title: `${playerName} i fel tröja.`,
            body: 'Ni sålde honom. Nu möter ni honom.',
          }
    }

    // Nemesis (register §4, "Han valde {Motståndare}") — DOM_K12_TRANSFER_
    // TARGET_MISSED_2026-09-08: en spelare vi bjöd på och missade, vars klubb
    // vid budtillfället är exakt nästa motstånd. Registret ger bara EN röst
    // (press) för detta scenario — ingen rotation.
    if (
      item.post.type === 'transfer_target_missed' &&
      item.post.subject?.kind === 'player' &&
      item.post.subject2?.kind === 'club' &&
      item.post.subject2.id === opponentId
    ) {
      const seasonsAgo = game.currentSeason - item.post.season
      if (seasonsAgo < 0 || seasonsAgo > 1) return null
      const playerName = resolveSubjectName(game, item.post.subject, item.post.subjectSnapshot)
      const opponentName = resolveSubjectName(game, item.post.subject2, item.post.subject2Snapshot)
      if (!playerName || !opponentName) return null
      return {
        voice: 'press',
        title: `Han valde ${opponentName}.`,
        body: `${playerName}, som ${ownClubName} jagade. På ${dag} står han på andra sidan.`,
      }
    }

    // Återkomst till gamla klubben (register §4) — DOM_MANAGER_ATERKOMST_
    // 2026-09-08: kanonisk liggarpost (switchManagedClub.ts), inte ett
    // state-undantag. Kandidaten kommer via agendan (item.post); den låsta
    // texten kräver "första gången" ordagrant sant, så resolvern verifierar
    // det via managerReturnService.ts:s egen detektor (samma en som
    // reviewCallbackService.ts:s review-callback) INNAN den renderar — en
    // post kan i teorin ligga kvar i liggaren och återfå poäng långt efter
    // att återkomsten redan skett (redaktörens untoldness är en mjuk
    // nedprioritering, ingen hård spärr), och "första gången" får aldrig
    // bli en osann rad.
    if (
      item.post.type === 'manager_return' &&
      item.post.subject?.kind === 'club' &&
      item.post.subject.id === opponentId
    ) {
      const manager = game.managerProfile
      if (!manager) return null
      const returnContext = getManagerReturnContext(game, fixture)
      if (!returnContext || returnContext.formerClubId !== opponentId) return null
      const opponentName = resolveSubjectName(game, item.post.subject, item.post.subjectSnapshot)
      if (!opponentName) return null
      const managerName = `${manager.firstName} ${manager.lastName}`
      const voice = pickVoice(rotation, 'memory_manager_return', ['press', 'club'])
      return voice === 'press'
        ? {
            voice,
            title: `${managerName} tillbaka i ${opponentName}.`,
            body: `Första gången mot ${opponentName} sedan avskedet. Läktaren minns.`,
          }
        : {
            voice,
            title: `Tillbaka till ${opponentName}.`,
            body: 'Första matchen mot dem sedan du gick. Åt båda hållen.',
          }
    }

    // Återkommande taktiskt misslyckande (register §4, "Samma sak tredje
    // gången") — stickiness-copy-roster B12-mönstret, SMAL scope-dom
    // (TEXTLEVERANS_OPUS_2026-09-08): tre raka ligaomgångar med utvisning
    // under formation_523 (clubMemoryEventBuilders.ts's
    // buildTacticalPatternSuspension523LedgerEntry). Ingen opponentId-koppling
    // — mönstret handlar om managerns eget taktikval, inte nästa motstånd.
    // Registret ger en röst (assistant), ingen rotation.
    if (item.post.type === 'tactical_pattern_suspension') {
      return {
        voice: 'assistant',
        title: 'Samma sak tredje gången.',
        body: 'Tre matcher i rad med utvisningar under 5-2-3. Mönstret är ditt, inte otur.',
      }
    }

    return null
  }
}
