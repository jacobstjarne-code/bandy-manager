import type { SaveGame } from '../../../domain/entities/SaveGame'
import { Sparkline } from '../primitives'
import { getManagerBio, getBurnoutZone, shouldShowBurnoutMark } from '../../../domain/services/managerProfileService'
import { BURNOUT_ZONE_LABELS, BURNOUT_MARK } from '../../../domain/data/managerKaraktarText'
import { SectionLabel } from '../SectionLabel'

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
  const { opener, family } = getManagerBio(profile, seed)
  const zone = getBurnoutZone(profile.burnoutScore)
  const zoneLabel = BURNOUT_ZONE_LABELS[zone]
  const burnoutTriggered = shouldShowBurnoutMark(profile)

  const zoneColor = zone === 'hog'
    ? 'var(--danger)'
    : zone === 'markbar'
    ? 'var(--warm)'
    : 'var(--success)'

  const record = `${profile.careerWins}V ${profile.careerDraws}O ${profile.careerLosses}F`
  const burnoutQuote = BURNOUT_MARK.quotes[seed % BURNOUT_MARK.quotes.length]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Profil-card */}
      <div className="card-sharp" style={{ padding: '12px 14px' }}>
        <SectionLabel style={{ marginBottom: 8 }}>👔 TRÄNARPROFIL</SectionLabel>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', margin: 0 }}>
              {profile.firstName} {profile.lastName}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              {profile.age} år · {profile.hometown}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>Säsong {profile.seasonsAtClub} vid klubben</p>
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

      {/* Burnout-card */}
      <div className="card-sharp" style={{ padding: '12px 14px', borderLeft: `3px solid ${zoneColor}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <SectionLabel>BELASTNING</SectionLabel>
          <span style={{ fontSize: 12, fontWeight: 700, color: zoneColor }}>{zoneLabel}</span>
        </div>

        {profile.burnoutHistory.length >= 3 ? (
          <Sparkline
            points={profile.burnoutHistory}
            stroke={zone === 'hog' ? 'danger' : zone === 'markbar' ? 'warm' : 'success'}
            height={32}
          />
        ) : (
          <div style={{ height: 20, fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Data byggs upp under säsongen.
          </div>
        )}

        {burnoutTriggered && (
          <div style={{ marginTop: 10, padding: '8px 10px', background: 'color-mix(in srgb, var(--danger) 6%, transparent)', borderRadius: 6, border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}>
            <p style={{ fontSize: 11, color: 'var(--danger)', fontStyle: 'italic', margin: 0 }}>
              "{burnoutQuote}"
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
