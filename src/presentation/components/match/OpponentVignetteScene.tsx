import type { Club } from '../../../domain/entities/Club'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { CLUB_TEMPLATES } from '../../../domain/services/worldGenerator'
import { generatePreMatchOpponentQuote } from '../../../domain/services/opponentManagerService'
import { OPPONENT_VIGNETTE_TEXT } from '../../../domain/data/opponentVignetteText'
import { pickPreMatchContextText, type PreMatchTrigger } from '../../../domain/data/preMatchContextStrings'
import { IllustrationScene, getClubIntroIllustrationAssetName } from '../illustration/IllustrationScene'
import { deriveContext } from './PreMatchContext'

interface Props {
  game: SaveGame
  opponent: Club
  fixture: Fixture
  isHome: boolean
  onContinue: () => void
}

// DESIGN_UPPDRAG_FORMATCHVINJETT_2026-09-06.md §"variabel info": "den gamla
// PreMatchContext valde EN kontext-trigger (derby > streak > tabell > form).
// Om vinjetten övertar den rollen ärver den den prioriteringen." Fyra
// etiketter, samma indelning radens brief namnger — inte en femte egen.
const TAG_BY_TRIGGER: Record<PreMatchTrigger, string> = {
  derby: 'DERBY',
  win_streak: 'FORM',
  loss_streak: 'FORM',
  table_above: 'TABELL',
  table_below: 'TABELL',
  opp_hot: 'FORM',
  opp_home_unbeaten: 'FORM',
  opp_cold: 'FORM',
}

/**
 * matchflode-forbered-linjar ingrepp 3 (Design-mock Forbered-flode.dc.html,
 * "PHONE A — Vinjett" + DESIGN_UPPDRAG_FORMATCHVINJETT_2026-09-06.md).
 * Stämningsyta, inget val — passeras. Ligger FÖRE Uppställning, bara vid
 * första mötet med opponent (opponentVignetteTrigger.ts).
 *
 * Bild/scrim/placeholder-fallback: IllustrationScene (redan byggd, samma
 * intro-<slug>.webp-assets Ankomsten/Tillträdet redan använder — ingen ny
 * bildpipeline). Statiskt stycke: TEXT LÅST (opponentVignetteText.ts).
 * Variabel info: EN kontextrad (PreMatchContext.tsx:s deriveContext, samma
 * prioritering) + tränarcitat (opponentManagerService.ts, samma källa
 * matchförberedelsens gamla scen redan använde) — ingen ny text uppfunnen.
 */
export function OpponentVignetteScene({ game, opponent, fixture, isHome, onContinue }: Props) {
  const template = CLUB_TEMPLATES.find(t => t.id === opponent.id)
  const arenaName = opponent.arenaName ?? template?.arenaName ?? ''
  const supporterGroupName = template?.supporterGroupName ?? ''
  const bodyText = OPPONENT_VIGNETTE_TEXT[opponent.id]

  const ctx = deriveContext(fixture, game, isHome)
  const contextTag = ctx ? TAG_BY_TRIGGER[ctx.trigger] : null
  const contextText = ctx ? pickPreMatchContextText(ctx.trigger, { ...ctx.subs, fixtureId: fixture.id }) : null

  const isDerby = ctx?.trigger === 'derby'
  const coachQuote = opponent.opponentManager
    ? generatePreMatchOpponentQuote(opponent, isDerby, `vignette_${fixture.id}`)
    : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <IllustrationScene
        mode="fullbleed"
        name={getClubIntroIllustrationAssetName(opponent.id) ?? 'intro'}
        style={{ flex: 1, minHeight: 0 }}
      >
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          padding: '22px 18px 16px',
          display: 'flex', flexDirection: 'column', gap: 12,
          background: 'linear-gradient(to top, rgba(10,8,12,0.9), rgba(10,8,12,0.5) 70%, transparent)',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 600, letterSpacing: 4,
              textTransform: 'uppercase', color: 'var(--accent)', opacity: 0.75, marginBottom: 6,
            }}>
              ⬩ Motståndaren ⬩
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text-light)', lineHeight: 1.1 }}>
              {opponent.name}
            </div>
            {(arenaName || supporterGroupName) && (
              <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 12, color: 'var(--text-light-secondary)', marginTop: 2 }}>
                {[arenaName, supporterGroupName].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>

          {bodyText && (
            <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 13, lineHeight: 1.55, color: 'var(--text-light)', margin: 0 }}>
              {bodyText}
            </p>
          )}

          {(contextText || coachQuote) && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 8,
              borderTop: '1px solid rgba(245,241,235,0.12)', paddingTop: 11,
            }}>
              {contextText && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, letterSpacing: 1.5,
                    color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
                    borderRadius: 3, padding: '2px 7px',
                  }}>
                    {contextTag}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-light-secondary)' }}>{contextText}</span>
                </div>
              )}
              {coachQuote && (
                <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 12, color: 'var(--text-light)', lineHeight: 1.45, margin: 0 }}>
                  {coachQuote}
                </p>
              )}
            </div>
          )}
        </div>
      </IllustrationScene>

      {/* Pass-affordans, INTE kopparstämpeln — vinjetten är en stämningsyta,
          inget val (DESIGN_UPPDRAG §2). */}
      <div style={{ padding: '12px 13px', background: 'var(--bg-dark)', flexShrink: 0 }}>
        <button
          onClick={onContinue}
          style={{
            width: '100%', padding: 12, textAlign: 'center',
            border: '1.5px solid var(--accent)', borderRadius: 8,
            background: 'transparent', color: 'var(--text-light)',
            fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, letterSpacing: 0.5,
            cursor: 'pointer',
          }}
        >
          Ta ut laget →
        </button>
      </div>
    </div>
  )
}
