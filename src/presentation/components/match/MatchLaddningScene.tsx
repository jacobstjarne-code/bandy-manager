// A3 — Match-laddning full scene (tillfälle-tier).
// Visas för: annandagen, derby, cup, premiär, final, nyår.
// §9: eyebrow --accent (eller --warm-light för derby); guld ENDAST på final.
// Mock: docs/mockups/2026-06-07_design_match_laddning.html
// SM-final uppspel mock: docs/incoming/2026-06-11_design_smfinal_uppspel.html

import { useState } from 'react'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { Fixture } from '../../../domain/entities/Fixture'
import type { Club } from '../../../domain/entities/Club'
import { SCENE_TEXT, STAKE_TEXT, FINAL_LAGPRESENTATION_QUOTES, type LaddningOccasion } from '../../../domain/data/matchLaddningText'
import { FINAL_STAT_LABELS } from '../../../domain/data/scenes/finalIntroScene'
import { getSeasonContext } from '../../../domain/services/seasonContextService'
import { seededPick } from '../../../domain/utils/random'
import { IllustrationPlaceholder } from '../illustration/IllustrationScene'
import { getFarewellMatchPlayer } from '../../../domain/services/retirementService'
import { FAREWELL_MATCH_ATMOSPHERE, FAREWELL_MATCH_KLACK } from '../../../domain/data/retirementText'

// Assets confirmed in repo; others fall back to IllustrationPlaceholder.
const OCCASION_ASSET: Partial<Record<LaddningOccasion, string>> = {
  annandagen: 'annandagen',
  final: 'final',
  // derby: 'derby',      // ordered, placeholder until dropped
  // nyar: 'nyarsbandy',  // ordered, placeholder until dropped
}

interface Props {
  occasion: LaddningOccasion
  isFinal: boolean
  game: SaveGame
  opponent: Club | null
  nextFixture: Fixture
  onContinue: () => void
}

// ── SM-final helpers ────────────────────────────────────────────

type FormResult = 'V' | 'O' | 'F'

function getClubForm(game: SaveGame, clubId: string): FormResult[] {
  const completed = game.fixtures
    .filter(f => f.status === 'completed' && (f.homeClubId === clubId || f.awayClubId === clubId))
    .sort((a, b) => b.matchday - a.matchday)
    .slice(0, 5)
  return completed.map(f => {
    const isHome = f.homeClubId === clubId
    const myScore = isHome ? f.homeScore : f.awayScore
    const theirScore = isHome ? f.awayScore : f.homeScore
    if (myScore > theirScore) return 'V'
    if (myScore < theirScore) return 'F'
    return 'O'
  }).reverse()
}

function getLeaguePosition(game: SaveGame, clubId: string): number {
  type Row = { clubId: string; pts: number; gd: number; gf: number }
  const rows: Record<string, Row> = {}
  for (const f of game.fixtures) {
    if (f.status !== 'completed' || f.isCup || f.isKnockout) continue
    for (const cid of [f.homeClubId, f.awayClubId]) {
      if (!rows[cid]) rows[cid] = { clubId: cid, pts: 0, gd: 0, gf: 0 }
    }
    const hpts = f.homeScore > f.awayScore ? 2 : f.homeScore === f.awayScore ? 1 : 0
    const apts = f.awayScore > f.homeScore ? 2 : f.homeScore === f.awayScore ? 1 : 0
    rows[f.homeClubId].pts += hpts
    rows[f.awayClubId].pts += apts
    rows[f.homeClubId].gd += (f.homeScore - f.awayScore)
    rows[f.awayClubId].gd += (f.awayScore - f.homeScore)
    rows[f.homeClubId].gf += f.homeScore
    rows[f.awayClubId].gf += f.awayScore
  }
  const sorted = Object.values(rows).sort((a, b) =>
    b.pts !== a.pts ? b.pts - a.pts : b.gd !== a.gd ? b.gd - a.gd : b.gf - a.gf,
  )
  const idx = sorted.findIndex(r => r.clubId === clubId)
  return idx >= 0 ? idx + 1 : 0
}

function getPlayoffRecord(game: SaveGame, clubId: string): string {
  const bracket = game.playoffBracket
  if (!bracket) return '–'
  let wins = 0
  const allSeries = [...(bracket.quarterFinals ?? []), ...(bracket.semiFinals ?? []), ...(bracket.final ? [bracket.final] : [])]
  for (const s of allSeries) {
    if (s.winnerId === clubId) wins++
  }
  return wins > 0 ? `${wins}–0` : '–'
}

function ordPos(n: number): string {
  if (n === 1) return '1:a'
  if (n === 2) return '2:a'
  return `${n}:e`
}

// ── Component ───────────────────────────────────────────────────

export function MatchLaddningScene({ occasion, isFinal, game, opponent, nextFixture, onContinue }: Props) {
  const [finalStep, setFinalStep] = useState<'uppspel' | 'lagpresentation'>('uppspel')

  const texts = SCENE_TEXT[occasion]
  const seed = game.currentSeason * 97 + game.currentMatchday * 31
  // Playtest-fynd 4: säsong 1 har ingen historik — laddnings-rader som åberopar
  // "i höstas" (förra säsongen) får inte visas premiärsäsongen.
  const chargePool = game.currentSeason <= 1
    ? texts.charge.filter(c => !c.includes('höstas'))
    : texts.charge
  const charge = seededPick(chargePool, seed)
  const relation = seededPick(texts.relation, seed + 7)

  const seasonCtx = getSeasonContext(game)
  const stakeText = (seasonCtx === 'relegationFight' || seasonCtx === 'topRace')
    ? seededPick(STAKE_TEXT[seasonCtx], seed + 13)
    : null

  // Pool 2 (2026-07-19): avskedsmatch-beat — spelarens sista hemmamatch i
  // säsongen (veteran_farewell-arc), samma gate-signal som coffeeRoomService
  // (retirementService.ts's getFarewellMatchPlayer, delad — inte duplicerad).
  // Matchdags-ceremoniröst, skild från pensionsvals-eventet (matchdag ≠ avgång).
  const farewellPlayer = getFarewellMatchPlayer(game, nextFixture)
  const farewellAtmosphere = farewellPlayer ? seededPick(FAREWELL_MATCH_ATMOSPHERE, seed + 19) : null
  const farewellKlack = farewellPlayer ? seededPick(FAREWELL_MATCH_KLACK, seed + 23) : null

  const assetName = OCCASION_ASSET[occasion]
  const isHome = nextFixture.homeClubId === game.managedClubId
  const plats = isHome ? 'Hemma' : 'Borta'

  // §9.1: guld ENDAST final; derby → --warm-light; övriga → --accent
  const eyebrowColor = isFinal
    ? 'var(--gold)'
    : occasion === 'derby'
      ? 'var(--warm-light)'
      : 'var(--accent)'

  const goldStripe = isFinal
    ? 'linear-gradient(180deg, var(--gold), var(--gold-deep))'
    : undefined

  // ── SM-final: steg 2 — Uppspel ──────────────────────────────
  // Kollisionsbeslut (2026-07-19, låst av matchLaddningGrind.test.ts): om
  // SM-finalen RÅKAR sammanfalla med en aktiv veteran_farewell-arcs spelares
  // sista hemmamatch, byggs INGEN sammanslagen ceremoni. SM-finalen vinner —
  // avskedsbeaten (farewellPlayer-blocket i standardscenen nedan) är
  // strukturellt onåbar när isFinal är true, oavsett arc-signalen. Medvetet
  // vald för ett extremt sällsynt sammanträffande, inte glömt.
  if (isFinal && finalStep === 'uppspel') {
    const myPos = getLeaguePosition(game, game.managedClubId)
    const playoffRec = getPlayoffRecord(game, game.managedClubId)

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'var(--bg-scene)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Gold stripe */}
        {goldStripe && (
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: goldStripe, zIndex: 3 }} />
        )}

        {/* Illustration block — fixed height */}
        <div style={{ position: 'relative', height: 290, flexShrink: 0 }}>
          {assetName ? (
            <img
              src={`/assets/illustrations/${assetName}.jpg`}
              alt={texts.eyebrow}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 38%', display: 'block' }}
            />
          ) : (
            <IllustrationPlaceholder name={texts.eyebrow.toLowerCase()} />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(14,12,9,.45) 0%, rgba(14,12,9,0) 20%, rgba(26,22,18,0) 45%, rgba(26,22,18,.55) 78%, var(--bg-scene) 100%)',
          }} />
          <p style={{
            position: 'absolute', left: 0, right: 0, top: 14, zIndex: 2,
            textAlign: 'center', fontFamily: 'var(--font-body)',
            fontSize: 8, fontWeight: 600, letterSpacing: '4px', textTransform: 'uppercase',
            color: eyebrowColor, textShadow: '0 1px 6px rgba(0,0,0,.6)',
          }}>
            ⬩ SM-FINAL ⬩
          </p>
        </div>

        {/* Content below image */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 20px', marginTop: -30, zIndex: 2, position: 'relative' }}>
          <h2 className="h-display-sm" style={{
            color: 'var(--text-light)', textAlign: 'center', lineHeight: 1.2,
            textShadow: '0 1px 8px rgba(0,0,0,.55)',
          }}>
            {relation}
          </h2>
          <p className="h-quote h-quote-light" style={{ textAlign: 'center', lineHeight: 1.55, marginTop: 10 }}>
            {charge}
          </p>

          {myPos > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'center', gap: 22, marginTop: 18,
              paddingTop: 14, borderTop: '0.5px solid color-mix(in srgb, var(--gold) 30%, transparent)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <span className="h-num" style={{ color: 'var(--text-light)', display: 'block' }}>
                  {ordPos(myPos)}
                </span>
                <span className="h-micro" style={{ letterSpacing: '1px', color: 'var(--text-light-secondary)', textTransform: 'uppercase' }}>{FINAL_STAT_LABELS.serien}</span>
              </div>
              {playoffRec !== '–' && (
                <div style={{ textAlign: 'center' }}>
                  <span className="h-num" style={{ color: 'var(--text-light)', display: 'block' }}>
                    {playoffRec}
                  </span>
                  <span className="h-micro" style={{ letterSpacing: '1px', color: 'var(--text-light-secondary)', textTransform: 'uppercase' }}>{FINAL_STAT_LABELS.slutspel}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{
          padding: '12px 16px',
          paddingBottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom) + var(--cta-nav-clearance))',
          background: 'transparent', zIndex: 3,
        }}>
          <button
            style={{
              width: '100%', padding: '11px 26px',
              border: '1.5px solid var(--gold)', borderRadius: 8,
              color: 'var(--text-light)', fontSize: 11, fontWeight: 700,
              letterSpacing: '1.5px', textTransform: 'uppercase' as const,
              background: 'transparent', cursor: 'pointer',
            }}
            onClick={() => setFinalStep('lagpresentation')}
          >
            LAGEN →
          </button>
        </div>
      </div>
    )
  }

  // ── SM-final: steg 3 — Lagpresentation ──────────────────────
  if (isFinal && finalStep === 'lagpresentation') {
    const managedClub = game.clubs.find(c => c.id === game.managedClubId)
    const homeClub = isHome ? managedClub : opponent
    const awayClub = isHome ? opponent : managedClub
    const homeForm = homeClub ? getClubForm(game, homeClub.id) : []
    const awayForm = awayClub ? getClubForm(game, awayClub.id) : []
    const myPos = getLeaguePosition(game, game.managedClubId)
    const oppPos = opponent ? getLeaguePosition(game, opponent.id) : 0
    const coach = game.assistantCoach
    const keyline = seededPick(FINAL_LAGPRESENTATION_QUOTES, seed + 41)

    const FormDots = ({ form }: { form: FormResult[] }) => (
      <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 5 }}>
        {form.map((r, i) => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: 2,
            background: r === 'V' ? 'var(--success)' : r === 'F' ? 'var(--danger)' : 'var(--accent)',
          }} />
        ))}
      </div>
    )

    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'var(--bg-scene)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Gold stripe */}
        {goldStripe && (
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: goldStripe, zIndex: 3 }} />
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '22px 18px 0', position: 'relative' }}>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 8, fontWeight: 600,
            letterSpacing: '4px', textTransform: 'uppercase', textAlign: 'center',
            color: eyebrowColor,
          }}>
            ⬩ LAGEN ⬩
          </p>

          {/* Matchup shields */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 16 }}>
            {/* Home */}
            <div style={{ textAlign: 'center', width: 104 }}>
              <div style={{
                width: 54, height: 60, borderRadius: '8px 8px 50% 50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--text-light)',
                background: 'radial-gradient(circle at 38% 30%, var(--badge-us-start), var(--badge-us-end))',
                border: '1.5px solid var(--led-us, var(--accent))',
                margin: '0 auto',
              }}>
                {/* ds-exempt: klubb-initial i per-klubb-färgad badge */}
                {(homeClub?.shortName ?? homeClub?.name ?? 'H')[0].toUpperCase()}
              </div>
              <h4 className="h-num-sm" style={{ color: 'var(--text-light)', marginTop: 7 }}>
                {homeClub?.shortName ?? homeClub?.name ?? '?'}
              </h4>
              {myPos > 0 && (
                <p style={{ fontSize: 8.5, color: 'var(--text-light-secondary)', marginTop: 3, lineHeight: 1.5 }}>
                  {isHome ? ordPos(myPos) : (oppPos > 0 ? ordPos(oppPos) : '')} i serien
                </p>
              )}
              <FormDots form={homeForm} />
            </div>

            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>MOT</span>

            {/* Away */}
            <div style={{ textAlign: 'center', width: 104 }}>
              <div style={{
                width: 54, height: 60, borderRadius: '8px 8px 50% 50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--text-light)',
                background: 'radial-gradient(circle at 38% 30%, var(--badge-them-start), var(--badge-them-end))',
                border: '1.5px solid var(--led-them, var(--ice))',
                margin: '0 auto',
              }}>
                {/* ds-exempt: klubb-initial i per-klubb-färgad badge */}
                {(awayClub?.shortName ?? awayClub?.name ?? 'B')[0].toUpperCase()}
              </div>
              <h4 className="h-num-sm" style={{ color: 'var(--text-light)', marginTop: 7 }}>
                {awayClub?.shortName ?? awayClub?.name ?? '?'}
              </h4>
              {(isHome ? (oppPos > 0 ? ordPos(oppPos) : '') : (myPos > 0 ? ordPos(myPos) : '')) && (
                <p style={{ fontSize: 8.5, color: 'var(--text-light-secondary)', marginTop: 3, lineHeight: 1.5 }}>
                  {isHome ? (oppPos > 0 ? ordPos(oppPos) : '') : (myPos > 0 ? ordPos(myPos) : '')} i serien
                </p>
              )}
              <FormDots form={awayForm} />
            </div>
          </div>

          {/* Keyline */}
          {coach && (
            <div style={{
              marginTop: 16, padding: '10px 12px',
              background: 'var(--bg-portal-surface)',
              borderRadius: 8, borderLeft: '2px solid var(--gold-deep, var(--accent))',
            }}>
              <p className="h-quote-sm h-quote-light" style={{ lineHeight: 1.5, margin: 0 }}>
                {keyline}
              </p>
              <span style={{ display: 'block', fontSize: 8, letterSpacing: '1px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>
                {coach.name} · Assisterande tränare
              </span>
            </div>
          )}

          {/* Venue */}
          <p style={{
            textAlign: 'center', fontFamily: 'var(--font-mono)',
            fontSize: 8.5, letterSpacing: '1px', color: 'var(--text-muted)',
            marginTop: 14, textTransform: 'uppercase',
          }}>
            Studenternas IP · Uppsala
          </p>
        </div>

        <div style={{
          padding: '12px 16px',
          paddingBottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom) + var(--cta-nav-clearance))',
          background: 'transparent', zIndex: 3,
        }}>
          <button
            style={{
              width: '100%', padding: '11px 26px',
              border: '1.5px solid var(--gold)', borderRadius: 8,
              color: 'var(--text-light)', fontSize: 11, fontWeight: 700,
              letterSpacing: '1.5px', textTransform: 'uppercase' as const,
              background: 'transparent', cursor: 'pointer',
            }}
            onClick={onContinue}
          >
            TILL AVSLAG →
          </button>
        </div>
      </div>
    )
  }

  // ── Standard single-step scene (non-final or other occasions) ──
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'var(--bg-portal)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Scene area — fills everything above the CTA row */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        {assetName ? (
          <img
            src={`/assets/illustrations/${assetName}.jpg`}
            alt={texts.eyebrow}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center 30%',
            }}
          />
        ) : (
          <IllustrationPlaceholder name={texts.eyebrow.toLowerCase()} />
        )}

        {/* Top scrim (mock: top 26%, rgba(12,14,20,0.6) → transparent) */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '26%',
          background: 'linear-gradient(180deg, rgba(12,14,20,0.6), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Bottom scrim (mock: bottom 70%, transparent → deep dark) */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%',
          background: 'linear-gradient(180deg, transparent 0%, rgba(16,18,24,0.55) 42%, rgba(12,14,20,0.94) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Text overlay — bottomed with breathing room above CTA */}
        <div style={{
          position: 'absolute', left: 18, right: 18, bottom: 44, zIndex: 2,
        }}>
          <p className="h-label h-label-light" style={{ color: eyebrowColor, marginBottom: 9, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
            ⬩ {texts.eyebrow} ⬩
          </p>

          {opponent && (
            <p className="h-display-md" style={{
              color: 'var(--text-light)', lineHeight: 1.1, marginBottom: 4,
              textShadow: '0 1px 8px rgba(0,0,0,0.7)', letterSpacing: '-0.4px',
            }}>
              {opponent.name}
            </p>
          )}

          <p className="h-micro" style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-light-secondary)',
            letterSpacing: '0.5px', marginBottom: 12,
            textShadow: '0 1px 4px rgba(0,0,0,0.7)',
          }}>
            {plats} · {relation}
          </p>

          <p className="h-quote h-quote-light" style={{ lineHeight: 1.5, textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
            {charge}
          </p>

          {stakeText && (
            <div style={{
              marginTop: 11,
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 10px', borderRadius: 99,
              background: 'color-mix(in srgb, var(--warm) 18%, transparent)',
              border: '1px solid color-mix(in srgb, var(--warm) 45%, transparent)',
              fontFamily: 'var(--font-body)', fontSize: 10,
              color: 'var(--warm-light)', fontWeight: 600,
            }}>
              {stakeText}
            </div>
          )}

          {/* Pool 2: avskedsmatch-beat. Ingen egen etikett skriven här — de
              två Opus-textraderna (FAREWELL_MATCH_ATMOSPHERE/KLACK) etablerar
              redan kontexten själva ("Avskedsmatch i dag...", "Sista matchen
              för en av oss..."). SVENSK TEXT-regeln: Code hittar inte på en
              rubrik för att komplettera dem. */}
          {farewellPlayer && (
            <div style={{ marginTop: 11, paddingTop: 11, borderTop: '0.5px solid color-mix(in srgb, var(--gold) 30%, transparent)' }}>
              <p className="h-quote-sm h-quote-light" style={{ lineHeight: 1.5, textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
                {farewellAtmosphere}
              </p>
              <p className="h-quote-sm h-quote-light" style={{ lineHeight: 1.5, marginTop: 6, textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
                {farewellKlack}
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={{
        padding: '12px 16px',
        paddingBottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom) + var(--cta-nav-clearance))',
        background: 'rgba(12,14,20,0.96)',
        zIndex: 3,
      }}>
        <button
          className="btn btn-primary btn-cta"
          onClick={onContinue}
        >
          SÄTT LAGET →
        </button>
      </div>
    </div>
  )
}
