import { useState } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { Club } from '../../../domain/entities/Club'
import type { SaveGame, StandingRow } from '../../../domain/entities/SaveGame'
import { ClubExpectation, ClubStyle } from '../../../domain/enums'
import { StatBar } from '../StatBar'
import { SectionCard } from '../SectionCard'

function expectationLabel(e: ClubExpectation): string {
  const map: Record<ClubExpectation, string> = {
    [ClubExpectation.AvoidBottom]: 'Undvika nedflyttning',
    [ClubExpectation.MidTable]: 'Mitten av tabellen',
    [ClubExpectation.ChallengeTop]: 'Utmana toppen',
    [ClubExpectation.WinLeague]: 'Vinna ligan',
  }
  return map[e] ?? e
}

function styleLabel(s: ClubStyle): string {
  const map: Record<ClubStyle, string> = {
    [ClubStyle.Defensive]: 'Defensiv',
    [ClubStyle.Balanced]: 'Balanserad',
    [ClubStyle.Attacking]: 'Anfallsinriktad',
    [ClubStyle.Physical]: 'Fysisk',
    [ClubStyle.Technical]: 'Teknisk',
  }
  return map[s] ?? s
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 10,
      marginBottom: 10,
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function FacilityRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{value}</span>
      </div>
      <StatBar value={value} color='var(--accent)' height={5} />
    </div>
  )
}

interface KlubbTabProps {
  club: Club
  game: SaveGame
  standing: StandingRow | null | undefined
  navigate: NavigateFunction
  interactWithPolitician?: (action: 'invite' | 'budget' | 'apply') => { success: boolean; message: string }
}

export function KlubbTab({ club, game, standing, navigate, interactWithPolitician }: KlubbTabProps) {
  const [polFeedback, setPolFeedback] = useState<{ text: string; ok: boolean } | null>(null)

  return (
    <>
      <SectionCard title="🏟️ Faciliteter" stagger={1}>
        <FacilityRow label="Anläggningar" value={club.facilities} />
        <FacilityRow label="Ungdomskvalitet" value={club.youthQuality} />
        <FacilityRow label="Ungdomsrekrytering" value={club.youthRecruitment} />
        <div style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Ungdomsutveckling</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{club.youthDevelopment}</span>
          </div>
          <StatBar value={club.youthDevelopment} color='var(--accent)' height={5} />
        </div>
      </SectionCard>

      {/* Mecenater */}
      <SectionCard title="👥 Mecenater" stagger={2}>
        {(game.mecenater ?? []).filter(m => m.isActive).length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Inga aktiva mecenater. De dyker upp om klubben lyckas.</p>
        ) : (
          (game.mecenater ?? []).filter(m => m.isActive).map(mec => (
            <div key={mec.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{mec.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>{mec.business}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: mec.happiness > 60 ? 'var(--success)' : mec.happiness > 40 ? 'var(--text-muted)' : 'var(--danger)' }}>
                  {mec.happiness > 60 ? '🤝 Nöjd' : mec.happiness > 40 ? '😐 Neutral' : '😤 Missnöjd'}
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                Bidrag: {Math.round(mec.contribution / 1000)} tkr/säsong · Inflytande: {mec.influence}
              </p>
            </div>
          ))
        )}
      </SectionCard>

      {/* Kommun */}
      {game.localPolitician && (
        <SectionCard title="🏛️ Kommun" stagger={2}>
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>{game.localPolitician.name} ({game.localPolitician.party.replace(/[()]/g, '')})</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Agenda: {game.localPolitician.agenda} · Relation: {game.localPolitician.relationship}/100
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Kommunbidrag: {Math.round((game.localPolitician.kommunBidrag ?? 0) / 1000)} tkr/säsong
              {game.localPolitician.mandatExpires && ` · Nästa val: ${game.localPolitician.mandatExpires}`}
            </p>
          </div>
          {polFeedback && (
            <p style={{ fontSize: 12, color: polFeedback.ok ? 'var(--success)' : 'var(--danger)', marginBottom: 8, fontWeight: 600 }}>
              {polFeedback.ok ? '✓' : '✗'} {polFeedback.text}
            </p>
          )}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" style={{ flex: 1, padding: '8px 6px', fontSize: 11 }}
              onClick={() => {
                if (!interactWithPolitician) return
                const r = interactWithPolitician('invite')
                setPolFeedback({ text: r.message, ok: r.success })
                setTimeout(() => setPolFeedback(null), 4000)
              }}>
              📋 Bjud in till match
            </button>
            <button className="btn btn-ghost" style={{ flex: 1, padding: '8px 6px', fontSize: 11 }}
              onClick={() => {
                if (!interactWithPolitician) return
                const r = interactWithPolitician('budget')
                setPolFeedback({ text: r.message, ok: r.success })
                setTimeout(() => setPolFeedback(null), 4000)
              }}>
              📊 Presentera budget
            </button>
            <button className="btn btn-ghost" style={{ flex: 1, padding: '8px 6px', fontSize: 11 }}
              onClick={() => {
                if (!interactWithPolitician) return
                const r = interactWithPolitician('apply')
                setPolFeedback({ text: r.message, ok: r.success })
                setTimeout(() => setPolFeedback(null), 4000)
              }}>
              📝 Ansök om bidrag
            </button>
          </div>
        </SectionCard>
      )}

      {/* Anläggning */}
      <SectionCard title="🏗️ Anläggning" stagger={2}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Faciliteter: {club.facilities}/100</span>
          <StatBar value={club.facilities} color='var(--accent)' height={5} />
        </div>
        {(game.facilityProjects ?? []).filter(p => p.status === 'in_progress').map(proj => (
          <div key={proj.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, fontWeight: 600 }}>🚧 {proj.name}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{proj.description}</p>
          </div>
        ))}
        {(game.facilityProjects ?? []).filter(p => p.status === 'in_progress').length === 0 && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Inga pågående projekt.</p>
        )}
      </SectionCard>

      <SectionCard title="🎯 Förväntan & profil" stagger={3}>
        <InfoRow label="Styrelseförväntning" value={expectationLabel(club.boardExpectation)} />
        <InfoRow label="Supporterförväntning" value={expectationLabel(club.fanExpectation)} />
        <InfoRow label="Spelstil" value={styleLabel(club.preferredStyle)} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, marginBottom: (game.boardObjectives ?? []).length > 0 ? 10 : 0, borderBottom: (game.boardObjectives ?? []).length > 0 ? '1px solid var(--border)' : 'none' }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Konstis</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{club.hasArtificialIce ? 'Ja' : 'Nej'}</span>
        </div>
        {(game.boardObjectives ?? []).length > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
              📋 Styrelsens uppdrag
            </p>
            {(game.boardObjectives ?? []).map((obj, i) => {
              const statusColor = obj.status === 'met' ? 'var(--success)' : obj.status === 'at_risk' ? 'var(--warning)' : obj.status === 'failed' ? 'var(--danger)' : 'var(--text-secondary)'
              const statusIcon = obj.status === 'met' ? '✅' : obj.status === 'at_risk' ? '⚠️' : obj.status === 'failed' ? '❌' : '📌'
              return (
                <div key={obj.id} style={{ paddingBottom: 8, marginBottom: 8, borderBottom: i < (game.boardObjectives ?? []).length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{statusIcon} {obj.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: statusColor }}>
                      {obj.status === 'met' ? 'Uppfyllt' : obj.status === 'at_risk' ? 'I fara' : obj.status === 'failed' ? 'Missat' : 'Aktivt'}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {obj.ownerId} ({obj.ownerPersonality})
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </SectionCard>

      {standing && (
        <SectionCard title="📊 Tabellposition" stagger={3}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)' }}>{standing.position}:e</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {standing.points}p · {standing.wins}V {standing.draws}O {standing.losses}F · MS {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
            </span>
          </div>
        </SectionCard>
      )}

      {game.seasonSummaries && game.seasonSummaries.length > 0 && (
        <SectionCard title="📅 Säsongshistorik" stagger={4}>
          {[...game.seasonSummaries].reverse().map(s => {
            const posColor = s.finalPosition <= 3 ? 'var(--accent)' : s.finalPosition >= 10 ? 'var(--danger)' : 'var(--text-primary)'
            let playoffLabel = ''
            if (s.playoffResult === 'champion') playoffLabel = '🏆'
            else if (s.playoffResult === 'finalist') playoffLabel = '🥈'
            else if (s.playoffResult === 'semifinal') playoffLabel = 'SF'
            else if (s.playoffResult === 'quarterfinal') playoffLabel = 'KF'
            return (
              <div
                key={s.season}
                onClick={() => navigate(`/game/season-summary/${s.season}`)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
              >
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', minWidth: 48 }}>{s.season}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: posColor, minWidth: 32, textAlign: 'center' }}>{s.finalPosition}.</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 52, textAlign: 'center' }}>{s.points} p</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1, textAlign: 'right' }}>{playoffLabel}</span>
                <span style={{ fontSize: 14, color: 'var(--accent)', marginLeft: 8 }}>→</span>
              </div>
            )
          })}
          <button
            className="btn btn-outline"
            onClick={() => navigate('/game/history')}
            style={{ width: '100%', marginTop: 8 }}
          >
            Hall of Fame & full historik →
          </button>
        </SectionCard>
      )}


    </>
  )
}
