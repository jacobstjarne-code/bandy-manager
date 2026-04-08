import type { NavigateFunction } from 'react-router-dom'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { CommunityPulse } from './CommunityPulse'
import { SeasonBarometer } from './SeasonBarometer'

interface OrtenTabProps {
  game: SaveGame
  currentRound: number
  navigate: NavigateFunction
}

const NAV_BUTTON_STYLE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
  background: 'transparent', border: '1px solid var(--border)',
  color: 'var(--accent)', fontSize: 12, lineHeight: 1,
  cursor: 'pointer',
}

export function OrtenTab({ game, currentRound, navigate }: OrtenTabProps) {
  const ca = game.communityActivities
  const patron = game.patron
  const politician = game.localPolitician

  // Build aktiviteter list — visa alltid alla 5 möjliga
  const activities: { name: string; label: string; active: boolean }[] = [
    { name: 'Kiosk', label: ca?.kiosk === 'upgraded' ? 'Uppgraderad' : ca?.kiosk === 'basic' ? 'Aktiv' : 'Ej startat', active: !!(ca?.kiosk && ca.kiosk !== 'none') },
    { name: 'Lotteri', label: ca?.lottery === 'intensive' ? 'Intensiv' : ca?.lottery === 'basic' ? 'Aktiv' : 'Ej startat', active: !!(ca?.lottery && ca.lottery !== 'none') },
    { name: 'Bandyskola', label: ca?.bandySchool ? 'Aktiv' : 'Ej startat', active: !!ca?.bandySchool },
    { name: 'Sociala medier', label: ca?.socialMedia ? 'Aktiv' : 'Ej startat', active: !!ca?.socialMedia },
    { name: 'Funktionärer', label: ca?.functionaries ? 'Aktiv' : 'Ej startat', active: !!ca?.functionaries },
  ]

  // Kommun/mecenat alert
  const recentCommunity = game.inbox
    .filter(i => !i.isRead && (i.title.startsWith('🏛️') || i.title.startsWith('👥')))
    .slice(0, 1)[0]
  const isPositive = recentCommunity
    ? recentCommunity.title.includes('noterade') || recentCommunity.title.includes('ökade') || recentCommunity.title.includes('Ny mecenat')
    : false

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Bygdens puls */}
      <div style={{ margin: '0 0 8px' }}>
        <CommunityPulse
          game={game}
          currentRound={currentRound}
          onNavigate={() => navigate('/game/club', { state: { tab: 'orten' } })}
        />
      </div>

      {/* Aktiviteter */}
      <div
        className="card-sharp"
        style={{ margin: '0 0 8px', cursor: 'pointer' }}
        onClick={() => navigate('/game/club', { state: { tab: 'ekonomi' } })}
      >
          <div style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
                🏪 AKTIVITETER
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/game/club', { state: { tab: 'ekonomi' } }) }}
                style={NAV_BUTTON_STYLE}
              >›</button>
            </div>
            {activities.map(a => (
              <div key={a.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>{a.name}</span>
                <span className={`tag ${a.active ? 'tag-green' : 'tag-outline'}`}>{a.label}</span>
              </div>
            ))}
          </div>
        </div>

      {/* Patron */}
      {patron && patron.isActive && (
        <div
          className="card-sharp"
          style={{ margin: '0 0 8px', cursor: 'pointer' }}
          onClick={() => navigate('/game/club', { state: { tab: 'orten' } })}
        >
          <div style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
                👤 PATRON
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/game/club', { state: { tab: 'orten' } }) }}
                style={NAV_BUTTON_STYLE}
              >›</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: 2 }}>
                  {patron.name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                  {patron.business}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right' }}>Humör</div>
                <div style={{ width: 60, height: 4, background: 'var(--border)', borderRadius: 2 }}>
                  <div style={{
                    height: 4, borderRadius: 2,
                    width: `${patron.happiness ?? 50}%`,
                    background: (patron.happiness ?? 50) > 60 ? 'var(--success)' : (patron.happiness ?? 50) > 30 ? 'var(--warning)' : 'var(--danger)',
                  }} />
                </div>
              </div>
            </div>
            {patron.wantsStyle && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 6, fontFamily: 'var(--font-body)' }}>
                "{patron.wantsStyle === 'attacking' ? 'Jag vill se offensiv bandy. Det är det enda som fungerar.'
                  : patron.wantsStyle === 'defensive' ? 'Stabilt försvar — det vinner matcher.'
                  : patron.wantsStyle === 'physical' ? 'Fysiskt, hårt spel. Det är vad bandy handlar om.'
                  : patron.wantsStyle === 'technical' ? 'Teknisk bandy vinner till slut.'
                  : 'Jag bryr mig inte om taktiken. Bara vinn.'}"
              </p>
            )}
            {!patron.wantsStyle && patron.demands && patron.demands.length > 0 && (
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 6, fontFamily: 'var(--font-body)' }}>
                {patron.demands[0]}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Kommun */}
      {politician && (
        <div
          className="card-sharp"
          style={{ margin: '0 0 8px', cursor: 'pointer' }}
          onClick={() => navigate('/game/club', { state: { tab: 'orten' } })}
        >
          <div style={{ padding: '10px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
                🏛️ KOMMUN
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/game/club', { state: { tab: 'orten' } }) }}
                style={NAV_BUTTON_STYLE}
              >›</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-body)', marginBottom: 2 }}>
                  {politician.name}
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>({politician.party.replace(/^\(|\)$/g, '')})</span>
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                  Kommunbidrag: {Math.round((politician.kommunBidrag ?? 0) / 1000)} tkr · Relation {politician.relationship ?? 50}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kommun/mecenat alert */}
      {recentCommunity && (
        <div style={{
          margin: '0 0 8px', padding: '8px 14px',
          fontSize: 11, fontWeight: 600,
          color: isPositive ? 'var(--success)' : 'var(--danger)',
          background: isPositive ? 'rgba(90,154,74,0.06)' : 'rgba(176,80,64,0.06)',
          borderRadius: 8, border: `1px solid ${isPositive ? 'rgba(90,154,74,0.2)' : 'rgba(176,80,64,0.2)'}`,
        }}>
          {recentCommunity.title}
        </div>
      )}

      {/* Säsongsbarometer */}
      <SeasonBarometer game={game} />

    </div>
  )
}
