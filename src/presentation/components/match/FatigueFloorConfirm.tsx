import type { Player } from '../../../domain/entities/Player'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { PlayerPosition } from '../../../domain/enums'
import { FATIGUE_AVAILABILITY_FLOOR } from '../../../domain/services/squadEvaluator'
import { getFitnessProjection } from '../../../domain/services/fitnessRecoveryService'
import { useGameStore } from '../../store/gameStore'
import { positionShort, positionLong } from '../../utils/formatters'
import { AlertTriangle } from 'lucide-react'
import { Icon } from '../primitives/Icon'

/**
 * FatigueFloorConfirm — A3 (DOM_A3_KONDITIONSSPIRAL_2026-08-29.md), krav 1.
 *
 * "Autofyll får aldrig TYST starta under golvet. När den tvingas ska den
 *  (a) varna synligt, (b) föreslå konkret utväg — akademikallelse eller
 *  formationsbyte — och (c) kräva bekräftelse."
 *
 * ── (b), "konkret utväg": vad som FAKTISKT är byggbart här ──────────────────
 * Två utvägar utreddes mot koden innan denna yta skrevs:
 *
 * • AKADEMIKALLELSE — finns, är en riktig ettklicksåtgärd. `promoteYouthPlayer`
 *   är en wirad store-action (academyActions.ts:156) och NodtruppScene.tsx
 *   renderar redan exakt den här listan med exakt den här knappen. Den enda
 *   skillnaden är TRÖSKELN: NodtruppScene visas bara vid < 11 SPELKLARA, och
 *   A3:s läge är ett annat — elva spelklara finns, men färre än elva över
 *   GOLVET. Ytan är alltså inte ny, den är samma utväg vid rätt tröskel.
 *   En uppkallad junior kommer in på full kondition och lyfter poolen över
 *   golvet med ett steg.
 *
 * • FORMATIONSBYTE — utretts och AVFÄRDAT som utväg för just detta problem.
 *   Ett formationsbyte ändrar VILKA positioner elvan behöver, aldrig HUR MÅNGA
 *   (alltid elva). Ett konditionsunderskott går inte att formera bort. Att
 *   erbjuda det som utväg hade varit en tom knapp — den hade sett ut som en
 *   lösning och inte varit det, vilket är samma sorts dolda straff domen
 *   angriper. Det står inte här av den anledningen, inte av förbiseende.
 *
 * Den tredje, alltid sanna utvägen är att INTE gå in med dem: prognosen
 * (`getFitnessProjection`, samma formel som motorn räknar med) visar vad
 * spelaren är värd nästa match om han vilas i stället. Det gör kostnaden
 * namngivbar — domens hela poäng — även när akademin är tom.
 *
 * SVENSK TEXT — CODE SKRIVER ALDRIG: samtliga meningar i denna yta är
 * '[Opus]'-platshållare, upptagna i tests/grind/opusPlaceholderGate.ts.
 */

interface Props {
  game: SaveGame
  belowFloorStarters: Player[]
  shortfall: number
  /** Bekräfta = gå in med dem ändå. Domens (c). */
  onConfirm: () => void
  onCancel: () => void
}

export function FatigueFloorConfirm({ game, belowFloorStarters, shortfall, onConfirm, onCancel }: Props) {
  const promoteYouthPlayer = useGameStore(s => s.promoteYouthPlayer)

  const squad = game.players.filter(p => p.clubId === game.managedClubId)
  const availableAboveFloor = squad.filter(
    p =>
      !p.isInjured &&
      p.suspensionGamesRemaining <= 0 &&
      (p.restGamesRemaining ?? 0) === 0 &&
      p.fitness >= FATIGUE_AVAILABILITY_FLOOR,
  ).length

  // Positionsbrist styr vilken junior som är mest värd att kalla upp — samma
  // sortering som NodtruppScene.tsx redan använder, inte en andra ordning.
  const availByPos = (pos: PlayerPosition) =>
    squad.filter(
      p =>
        p.position === pos &&
        !p.isInjured &&
        p.suspensionGamesRemaining <= 0 &&
        (p.restGamesRemaining ?? 0) === 0 &&
        p.fitness >= FATIGUE_AVAILABILITY_FLOOR,
    ).length
  const posDeficit = (pos: PlayerPosition) => (pos === PlayerPosition.Goalkeeper ? 1 : 2) - availByPos(pos)

  const youth = [...(game.youthTeam?.players ?? [])]
    .sort((a, b) => {
      const d = posDeficit(b.position) - posDeficit(a.position)
      return d !== 0 ? d : b.currentAbility - a.currentAbility
    })
    .slice(0, 3)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)',
        background: 'color-mix(in srgb, var(--bg-deepdark) 82%, transparent)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 12,
      }}
      onClick={onCancel}
    >
      <div
        className="card-round"
        style={{
          width: '100%',
          maxWidth: 430,
          maxHeight: '86%',
          overflowY: 'auto',
          background: 'var(--bg-elevated)',
          padding: '18px 18px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* (a) Varna synligt */}
        <div>
          <div
            className="h-label"
            style={{ color: 'var(--danger-text)', marginBottom: 6, display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <Icon icon={AlertTriangle} size={11} style={{ flexShrink: 0 }} />
            {/* SVENSK TEXT — CODE SKRIVER ALDRIG: rubriken för den tvingade
                fyllningen (elvan går inte ihop över konditionsgolvet). */}
            [Opus]
          </div>
          {/* Rent numerisk sats — ingen Code-skriven svenska. Talen bär läget
              (så många av elva är över golvet, så många saknas); '[Opus]'
              nedan bär meningen. */}
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            {availableAboveFloor} / 11 · ≥ {FATIGUE_AVAILABILITY_FLOOR} %
            <span style={{ color: 'var(--danger-text)', marginLeft: 8 }}>−{shortfall}</span>
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {/* SVENSK TEXT — CODE SKRIVER ALDRIG: brödtexten som namnger
                kostnaden — vad det innebär att gå in {shortfall} spelare kort
                över golvet (höjd skaderisk + risk att förlora dem till nästa
                match, A-H3:s två ben). */}
            [Opus]
          </p>
        </div>

        {/* Vilka det gäller + prognosen (krav 3, samma formel som motorn) */}
        <div className="card-sharp" style={{ padding: '10px 12px' }}>
          <div className="h-label" style={{ marginBottom: 8 }}>
            {/* SVENSK TEXT — CODE SKRIVER ALDRIG: sektionslabel för listan
                över de spelare som står under golvet. */}
            [Opus]
          </div>
          {belowFloorStarters.map(p => {
            const proj = getFitnessProjection(p)
            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', minWidth: 22 }}>
                  {positionShort(p.position)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {p.firstName} {p.lastName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {positionLong(p.position)} · {p.fitness} %
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--danger-text)', fontWeight: 700 }}>
                    → {proj.ifStarting} %
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--success)' }}>→ {proj.ifRested} %</div>
                </div>
              </div>
            )
          })}
          <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 8 }}>
            {/* SVENSK TEXT — CODE SKRIVER ALDRIG: förklaringen av de två talen
                (efter nästa match om han startar / om han vilas) och att det är
                en förväntan, inte ett löfte — matchkostnaden slumpas 15–25. */}
            [Opus]
          </p>
        </div>

        {/* (b) Konkret utväg — akademikallelse. Se filhuvudet för varför
            formationsbyte INTE erbjuds här. */}
        {youth.length > 0 && (
          <div className="card-sharp" style={{ padding: '10px 12px' }}>
            <div className="h-label" style={{ marginBottom: 8 }}>
              {/* SVENSK TEXT — CODE SKRIVER ALDRIG: sektionslabel för
                  akademikallelsen som utväg ur golvbristen. */}
              [Opus]
            </div>
            {youth.map(y => (
              <div
                key={y.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', minWidth: 22 }}>
                  {positionShort(y.position)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {y.firstName} {y.lastName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {y.age} år · {positionLong(y.position)} · styrka ~{y.currentAbility}
                  </div>
                </div>
                <button
                  className="btn btn-copper"
                  style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}
                  onClick={() => promoteYouthPlayer(y.id)}
                >
                  Kalla upp
                </button>
              </div>
            ))}
          </div>
        )}

        {/* (c) Kräv bekräftelse */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn btn-outline" style={{ width: '100%', fontSize: 13 }} onClick={onCancel}>
            {/* SVENSK TEXT — CODE SKRIVER ALDRIG: avbryt-knappen (låt elvan
                stå orörd, hitta en annan väg). */}
            [Opus]
          </button>
          <button
            className="btn btn-outline"
            style={{ width: '100%', fontSize: 13, color: 'var(--danger-text)' }}
            onClick={onConfirm}
          >
            {/* SVENSK TEXT — CODE SKRIVER ALDRIG: bekräfta-knappen — gå in med
                dem ändå. Detta är det synliga beslutet domen kräver. */}
            [Opus]
          </button>
        </div>
      </div>
    </div>
  )
}
