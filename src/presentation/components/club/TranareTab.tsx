import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { CoachRivalry } from '../../../domain/entities/ManagerProfile'
import { Sparkline, MIN_POINTS } from '../primitives/Sparkline'
import { ManagerPortrait } from '../squad/ManagerPortrait'
import {
  getManagerBio,
  getBurnoutZone,
  isSustainedHighBurnout,
  getContractStatusText,
  getManagerDisplayName,
} from '../../../domain/services/managerProfileService'
import { BURNOUT_ZONE_LABELS, BURNOUT_MARK, COACH_RIVALRY_QUOTES } from '../../../domain/data/managerKaraktarText'
import { SectionLabel } from '../SectionLabel'
import { Spine } from '../shared/Spine'
import type { SpineItem } from '../shared/Spine'

function nemesisScore(r: CoachRivalry): number {
  return (r.h2hWins + r.h2hDraws + r.h2hLosses) * Math.max(0, r.h2hLosses - r.h2hWins)
}

function deriveNemesis(rivalries: CoachRivalry[]): CoachRivalry | null {
  return rivalries
    .filter(r => nemesisScore(r) > 0)
    .sort((a, b) => nemesisScore(b) - nemesisScore(a))[0] ?? null
}

interface Props {
  game: SaveGame
}

export function TranareTab({ game }: Props) {
  const profile = game.managerProfile
  if (!profile) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
        Profil saknas.
      </div>
    )
  }

  const seed = game.currentSeason * 997 + 13
  const displayName = getManagerDisplayName(game)
  const { opener, family } = getManagerBio(profile, seed)
  const zone = getBurnoutZone(profile.burnoutScore)
  const zoneLabel = BURNOUT_ZONE_LABELS[zone]
  // HIGH 10-FÖLJDFIX (2026-08-30): isSustainedHighBurnout, INTE
  // shouldShowBurnoutMark — den flikens citat ska ligga kvar hela tiden
  // zonen är hög (persistent statusflik), inte bara flasha den enda
  // omgången beaten narrerades (Portal-kortets semantik).
  const burnoutTriggered = isSustainedHighBurnout(profile)

  const zoneColor = zone === 'hog'
    ? 'var(--danger)'
    : zone === 'markbar'
    ? 'var(--warm)'
    : 'var(--success)'

  const record = `${profile.careerWins}V ${profile.careerDraws}O ${profile.careerLosses}F`
  const burnoutZone = zone === 'frisk' ? null : zone
  const burnoutQuote = burnoutZone ? BURNOUT_MARK.quotesByZone[burnoutZone][seed % BURNOUT_MARK.quotesByZone[burnoutZone].length] : ''
  const contractText = getContractStatusText(profile, game.currentSeason)
  const seasonsLeft = profile.contractUntilSeason - game.currentSeason
  const contractColor = seasonsLeft <= 1 ? 'var(--warm)' : 'var(--text-muted)'

  const h2hTotal = (r: { h2hWins: number; h2hDraws: number; h2hLosses: number }) =>
    r.h2hWins + r.h2hDraws + r.h2hLosses
  const topRivalries = [...profile.coachRivalries]
    .filter(r => h2hTotal(r) > 0)
    .sort((a, b) => h2hTotal(b) - h2hTotal(a))
    .slice(0, 3)

  const TYPE_LABEL: Record<string, string> = {
    arrival: 'Ankomst',
    burnout_peak: 'Belastningstopp',
    era_shift: 'Ny era',
    rivalry: 'Rivalitet',
    milestone: 'Milstolpe',
  }
  const narrativeItems: SpineItem[] = (profile.diary ?? [])
    .filter(e => e.text !== '// OPUS_COPY')
    .map(e => ({ label: TYPE_LABEL[e.type] ?? e.type, season: e.season, text: e.text }))

  const nemesis = deriveNemesis(profile.coachRivalries)
  const nemesisClub = nemesis ? game.clubs.find(c => c.id === nemesis.clubId) : null
  const nemesisCoach = nemesis ? game.aiCoaches?.[nemesis.clubId] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Profil-card */}
      <div className="card-sharp" style={{ padding: '12px 14px' }}>
        <SectionLabel style={{ marginBottom: 10 }}>👔 TRÄNARPROFIL</SectionLabel>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
          <ManagerPortrait
            displayName={displayName}
            seasonsAtClub={profile.seasonsAtClub}
            burnoutScore={profile.burnoutScore}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="h-name" style={{ margin: 0 }}>
              {displayName}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              {profile.age} år · {profile.hometown}
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '3px 0 0' }}>Säsong {profile.seasonsAtClub} i klubben</p>
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 6px' }}>
          {opener}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
          {family}
        </p>

        {(profile.careerWins + profile.careerDraws + profile.careerLosses) > 0 && (
          <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
            Karriär: {record}
          </p>
        )}
      </div>

      {/* Tränaravtal */}
      <div className="card-sharp" style={{ padding: '12px 14px' }}>
        <SectionLabel style={{ marginBottom: 8 }}>📋 TRÄNARAVTAL</SectionLabel>
        <p style={{ fontSize: 12, color: contractColor, margin: 0 }}>{contractText}</p>
      </div>

      {/* Burnout-card */}
      <div className="card-sharp" style={{ padding: '12px 14px', borderLeft: `3px solid ${zoneColor}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <SectionLabel>BELASTNING</SectionLabel>
          <span style={{ fontSize: 12, fontWeight: 700, color: zoneColor }}>{zoneLabel}</span>
        </div>

        {profile.burnoutHistory.length >= MIN_POINTS ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span className="h-num" style={{ color: zoneColor }}>
                {Math.round(profile.burnoutHistory[profile.burnoutHistory.length - 1])}
              </span>
              <span className="h-micro" style={{ color: 'var(--text-muted)' }}>
                Senaste {profile.burnoutHistory.length} omg.
              </span>
            </div>
            <Sparkline
              points={profile.burnoutHistory}
              stroke={zone === 'hog' ? 'danger' : zone === 'markbar' ? 'warm' : 'success'}
              height={32}
            />
          </>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {zoneLabel} · Ingen belastningshistorik ännu.
          </div>
        )}

        {burnoutTriggered && (
          <div style={{ marginTop: 10, padding: '8px 10px', background: 'color-mix(in srgb, var(--danger) 6%, transparent)', borderRadius: 'var(--radius-md)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}>
            <p style={{ fontSize: 11, color: 'var(--danger)', fontStyle: 'italic', margin: 0 }}>
              "{burnoutQuote}"
            </p>
          </div>
        )}
      </div>

      {/* Coach-rivalries */}
      {topRivalries.length > 0 && (
        <div className="card-sharp" style={{ padding: '12px 14px' }}>
          <SectionLabel style={{ marginBottom: 10 }}>⚔️ RIVALITET</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topRivalries.map(rivalry => {
              const aiCoach = game.aiCoaches?.[rivalry.clubId]
              const club = game.clubs.find(c => c.id === rivalry.clubId)
              if (!aiCoach || !club) return null
              const quotes = COACH_RIVALRY_QUOTES[rivalry.personality]
              const quoteSeed = game.currentSeason * 31 + rivalry.clubId.charCodeAt(0)
              const quote = quotes[quoteSeed % quotes.length]
                .replace('{manager}', profile.firstName)
              return (
                <div key={rivalry.clubId} style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{aiCoach.name}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>{club.name}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                      {rivalry.h2hWins}V {rivalry.h2hDraws}O {rivalry.h2hLosses}F
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
                    "{quote}"
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Nemesis — utpekad rival ur coachRivalries */}
      {nemesis && nemesisClub && nemesisCoach && (
        <div className="card-sharp" style={{ padding: '12px 14px', borderLeft: '3px solid color-mix(in srgb, var(--danger) 40%, transparent)' }}>
          <SectionLabel style={{ marginBottom: 8 }}>🎯 NEMESIS</SectionLabel>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{nemesisCoach.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 6 }}>{nemesisClub.name}</span>
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              {nemesis.h2hWins}V {nemesis.h2hDraws}O {nemesis.h2hLosses}F
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            "Det är inte serien som sätter dig på prov. Det är han."
          </p>
        </div>
      )}

      {/* Tenure-arc — tränarens berättelse */}
      {narrativeItems.length > 0 && (
        <div className="card-sharp" style={{ padding: '12px 14px' }}>
          <SectionLabel style={{ marginBottom: 12 }}>📖 BANAN</SectionLabel>
          <Spine items={narrativeItems} />
        </div>
      )}
    </div>
  )
}
