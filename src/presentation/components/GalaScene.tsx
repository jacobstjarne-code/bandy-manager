import type { GameEvent } from '../../domain/entities/GameEvent'
import type { SaveGame } from '../../domain/entities/SaveGame'
import {
  generateNominations,
  pickHeldAward,
  AWARD_LABELS,
  type GalaNomination,
} from '../../domain/services/bandyGalaService'
import { getGalaSceneCopy, type GalaTone } from '../../domain/data/galaSceneCopy'
import { positionShort } from '../../domain/format'
import '../styles/gala-scene.css'

interface GalaSceneProps {
  event: GameEvent
  game: SaveGame
  onChoose: (choiceId: string, choiceLabel: string) => void
}

/**
 * GalaScene — HANDOFF-GALAN-GESTALTNING_2026-09-10. Rendrar det befintliga
 * `event_gala_{season}`-eventet (bandyGalaService.ts) som tre delar i stället
 * för en textklump i ett generiskt DecisionCard: hållen scen (ett pris) →
 * liggarlandning (resten, protokollform, egna med guldprick) → det
 * verkliga valet (Gå/Skippa, verbatim ur event.choices). Ingen ny
 * domänlogik — samma event-data, samma id, samma choices.
 *
 * `generateNominations(game)` är en ren funktion av game.players/clubs —
 * att anropa den igen här vid render reproducerar exakt samma nomineringar
 * som byggde event.body, utan att ändra eventets dataform.
 */
export function GalaScene({ event, game, onChoose }: GalaSceneProps) {
  const nominations = generateNominations(game)
  const managedClubId = game.managedClubId
  const managedClub = game.clubs.find(c => c.id === managedClubId)

  const managedWinners = nominations.filter(n => {
    const player = game.players.find(p => p.id === n.playerId)
    return player?.clubId === managedClubId
  })

  const held = pickHeldAward(nominations, managedWinners)
  const restNominations = held ? nominations.filter(n => n !== held.nomination) : nominations

  // Två mekaniskt utlösbara toner (se galaSceneCopy.ts — 'bitter' kräver ett
  // signal-fält som inte finns vid galans genereringstillfälle).
  const tone: GalaTone = held?.isOwn ? 'triumf' : 'gra'
  const copy = getGalaSceneCopy(tone)

  const heldPlayer = held ? game.players.find(p => p.id === held.nomination.playerId) : undefined
  const heldStatLine = held && heldPlayer
    ? `${held.nomination.stat} · ${positionShort(heldPlayer.position)} · ${heldPlayer.age} år`
    : held?.nomination.stat

  return (
    <div className="gala-scene" data-decision-card="true" data-entity-id={`event:${event.id}`} data-entity-source="GalaScene">
      <div className="gala-scene__header">
        <span className="gala-scene__club">{managedClub?.name ?? ''}</span>
        <span className="gala-scene__season">{game.currentSeason}</span>
      </div>

      {/* Hållen scen — ett pris bär känslan. Guld-disciplin: medaljen är den
          ENDA fyllda guldytan i hela scenen. */}
      <div className={`gala-scene__held${tone === 'gra' ? ' gala-scene__held--gra' : ''}`}>
        <p className="gala-scene__genre">⬩ Bandygalan ⬩</p>
        {copy.setting && <p className="gala-scene__setting">{copy.setting}</p>}
        {held && (
          <div className="gala-scene__medal-wrap">
            <div className="gala-scene__medal">🏆</div>
            <p className="gala-scene__award-eyebrow">{AWARD_LABELS[held.nomination.award]}</p>
            <p className="gala-scene__award-name">{held.nomination.playerName}</p>
            {heldStatLine && <p className="gala-scene__award-stat">{heldStatLine}</p>}
            {copy.awardLine && <p className="gala-scene__award-line">{copy.awardLine}</p>}
          </div>
        )}
      </div>

      {/* Liggarlandning — resten som protokoll. Guld som accent, noll fyllning. */}
      {restNominations.length > 0 && (
        <div className="gala-scene__body">
          <div className="gala-scene__land-label">
            <span>Kvällens övriga pristagare</span>
            <span className="gala-scene__protok">↑ bokförs i minnet</span>
          </div>
          <div className="gala-scene__ledger">
            <div className="gala-scene__perf" aria-hidden="true" />
            {restNominations.map((nom: GalaNomination) => {
              const player = game.players.find(p => p.id === nom.playerId)
              const isOurs = player?.clubId === managedClubId
              return (
                <div key={nom.award} className={`gala-scene__lrow${isOurs ? ' gala-scene__lrow--ours' : ''}`}>
                  {isOurs && <span className="gala-scene__goldprick" aria-hidden="true" />}
                  <div>
                    <div className="gala-scene__lrow-award">{AWARD_LABELS[nom.award]}</div>
                    <div className="gala-scene__lrow-name">
                      {nom.playerName} <span className="gala-scene__lrow-club">· {nom.clubName}</span>
                    </div>
                  </div>
                  <div className="gala-scene__lrow-stat">{nom.stat}</div>
                </div>
              )
            })}
          </div>
          {managedWinners.length > 0 && (
            <div className="gala-scene__land-foot">
              <b>{managedWinners.length} av {nominations.length} till {managedClub?.name ?? 'klubben'}.</b>
              {' '}Guldprick i marginalen markerar era egna.
            </div>
          )}
        </div>
      )}

      {/* Det verkliga valet — verbatim ur event.choices, en primär. */}
      <div className="gala-scene__decision">
        {copy.decisionQuestion && <p className="gala-scene__dec-q">{copy.decisionQuestion}</p>}
        <div className="gala-scene__dec-btns">
          {event.choices.map((choice, i) => (
            <button
              key={choice.id}
              className={i === 0 ? 'gala-scene__btn-prim' : 'gala-scene__btn-out'}
              onClick={() => onChoose(choice.id, choice.label)}
            >
              {choice.label}
              {choice.subtitle && <small>{choice.subtitle}</small>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
