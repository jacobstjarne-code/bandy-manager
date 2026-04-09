import { useState } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { Club } from '../../../domain/entities/Club'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { ClubExpectation, ClubStyle } from '../../../domain/enums'
import { StatBar } from '../StatBar'
import { SectionCard } from '../SectionCard'
import { csColor } from '../../utils/formatters'
import { getFunctionaryQuote } from '../../../domain/services/functionaryQuoteService'
import { getAvailableProjects } from '../../../domain/services/facilityService'

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
  navigate: NavigateFunction
  interactWithPolitician?: (action: 'invite' | 'budget' | 'apply') => { success: boolean; message: string }
  startFacilityProject?: (projectId: string) => { success: boolean; error?: string }
}

export function KlubbTab({ club, game, navigate, interactWithPolitician, startFacilityProject }: KlubbTabProps) {
  const [polFeedback, setPolFeedback] = useState<{ text: string; ok: boolean } | null>(null)

  const cs = game.communityStanding ?? 50
  const currentRound = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)
  const quote = getFunctionaryQuote(game, currentRound, game.lastCompletedFixtureId)
  const ca = game.communityActivities
  const activeActivities = [
    ca?.kiosk && ca.kiosk !== 'none' ? '🏪 Kiosk' : null,
    ca?.lottery && ca.lottery !== 'none' ? '🎫 Lotteri' : null,
    ca?.functionaries ? '🤝 Funktionärer' : null,
    ca?.bandyplay ? '🏒 Bandyskola' : null,
    ca?.socialMedia ? '📱 Sociala medier' : null,
  ].filter((x): x is string => x !== null)

  return (
    <>
      {/* Bygdens puls */}
      <SectionCard title="🏠 Bygdens puls" stagger={1}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 32, fontWeight: 400, color: csColor(cs), fontFamily: 'var(--font-display)' }}>{cs}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ 100</span>
        </div>
        <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
          <div style={{ flex: cs, height: 7, background: csColor(cs), borderRadius: '4px 0 0 4px' }} />
          <div style={{ flex: 100 - cs, height: 7, background: 'var(--border-dark)', borderRadius: '0 4px 4px 0' }} />
        </div>
        {activeActivities.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
            {activeActivities.map(a => (
              <span key={a} className="tag tag-outline">{a}</span>
            ))}
          </div>
        )}
        {quote && (
          <div style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8 }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5, fontFamily: 'var(--font-display)' }}>
              “{quote.quote}”
            </p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
              {quote.name}, {quote.role}
            </p>
          </div>
        )}
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
          Påverkas av matchresultat, föreningsaktiviteter och samhällsengagemang. Högt stöd ger bättre hemmaplansfördel och sponsorintresse.
        </p>
      </SectionCard>

      {/* Faciliteter moved to combined Anläggning section below */}

      {/* Patron (äldre system) */}
      {game.patron?.isActive && (() => {
        const p = game.patron!
        const happColor = (p.happiness ?? 50) > 60 ? 'var(--success)' : (p.happiness ?? 50) > 40 ? 'var(--accent)' : 'var(--danger)'
        return (
          <SectionCard title="👤 Patron" stagger={2}>
            <div style={{ padding: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</p>
                <span style={{ fontSize: 11, fontWeight: 600, color: happColor }}>
                  {(p.happiness ?? 50) > 60 ? '🤝 Nöjd' : (p.happiness ?? 50) > 40 ? '😐 Neutral' : '😤 Missnöjd'}
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.business}</p>
              {p.backstory && (
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 6 }}>
                  {p.backstory}
                </p>
              )}
              <div style={{ marginTop: 6, marginBottom: 2 }}>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p.happiness ?? 50}%`, background: happColor, borderRadius: 2, transition: 'width 0.5s ease' }} />
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                Bidrag: {Math.round((p.contribution ?? 0) / 1000)} tkr/säsong
              </p>
            </div>
          </SectionCard>
        )
      })()}

      {/* Mecenater */}
      <SectionCard title="👥 Mecenater" stagger={2}>
        {(game.mecenater ?? []).filter(m => m.isActive).length === 0 ? (
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Inga mecenater ännu.</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Mecenater är lokala företagare som stödjer klubben ekonomiskt.
              De lockas av framgång (slutspelsplats) och hög Bygdens puls.
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 4, fontStyle: 'italic' }}>
              Fokusera på att vinna matcher och engagera bygden — då kommer intresset.
            </p>
          </div>
        ) : (
          (() => {
            const typeLabels: Record<string, string> = {
              brukspatron: 'Brukspatron',
              skogsägare: 'Skogsägare',
              it_miljonär: 'IT-entreprenör',
              entrepreneur: 'Företagare',
              fastigheter: 'Fastighetsägare',
              lokal_handlare: 'Lokal handlare',
              jordbrukare: 'Jordbrukare',
            }
            return (game.mecenater ?? []).filter(m => m.isActive).map(mec => {
              const happColor = mec.happiness > 60 ? 'var(--success)' : mec.happiness > 40 ? 'var(--accent)' : 'var(--danger)'
              return (
                <div key={mec.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{mec.name}</p>
                    <span style={{ fontSize: 11, fontWeight: 600, color: happColor }}>
                      {mec.happiness > 60 ? '🤝 Nöjd' : mec.happiness > 40 ? '😐 Neutral' : '😤 Missnöjd'}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    {typeLabels[mec.businessType] ?? mec.businessType} · {mec.business}
                  </p>
                  {mec.backstory && (
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 6 }}>
                      {mec.backstory}
                    </p>
                  )}
                  {/* Relation bar */}
                  <div style={{ marginTop: 4, marginBottom: 2 }}>
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${mec.happiness}%`, background: happColor, borderRadius: 2, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Bidrag: {Math.round(mec.contribution / 1000)} tkr/säsong
                  </p>
                </div>
              )
            })
          })()
        )}
      </SectionCard>

      {/* Kommun */}
      {game.localPolitician && (() => {
        const polData = game.localPolitician
        const agendaText: Record<string, string> = {
          youth: 'Vill se satsning på ungdomsverksamhet. Stärk akademin och kör bandyskola.',
          prestige: 'Vill att klubben sätter orten på kartan. Slutspel och bra resultat imponerar.',
          infrastructure: 'Vill se investeringar i anläggningar. Uppgradera faciliteter.',
          inclusion: 'Vill att klubben engagerar sig i samhället. Kör föreningsaktiviteter.',
          savings: 'Vill ha balanserad ekonomi. Inga underskott.',
        }
        const agendaLabel: Record<string, string> = {
          youth: 'Ungdomssatsning', prestige: 'Prestige', infrastructure: 'Infrastruktur',
          inclusion: 'Inkludering', savings: 'Ekonomi',
        }
        const rel = polData.relationship
        const relColor = rel >= 70 ? 'var(--success)' : rel >= 40 ? 'var(--accent)' : 'var(--danger)'
        return (
        <SectionCard title="🏛️ Kommun" stagger={2}>
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>{polData.name} {polData.party.startsWith('(') ? polData.party : `(${polData.party})`}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Agenda: {agendaLabel[polData.agenda] ?? polData.agenda}
            </p>
            {/* Relationsbar */}
            <div style={{ marginTop: 6, marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>
                <span>Relation</span>
                <span style={{ color: relColor, fontWeight: 600 }}>{rel}/100</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${rel}%`, background: relColor, borderRadius: 3, transition: 'width 0.5s ease' }} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4, marginBottom: 6 }}>
              {agendaText[polData.agenda] ?? ''}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Kommunbidrag: {Math.round((polData.kommunBidrag ?? 0) / 1000)} tkr/säsong
              {polData.mandatExpires && ` · Nästa val: ${polData.mandatExpires}`}
            </p>
          </div>
          {polFeedback && (
            <p style={{ fontSize: 12, color: polFeedback.ok ? 'var(--success)' : 'var(--danger)', marginBottom: 8, fontWeight: 600 }}>
              {polFeedback.ok ? '✓' : '✗'} {polFeedback.text}
            </p>
          )}
          {(() => {
            const li = game.politicianLastInteraction ?? {}
            const currentRound = game.fixtures.filter(f => f.status === 'completed' && !f.isCup).reduce((max, f) => Math.max(max, f.roundNumber), 0)
            const inviteCooldown = li.invite ? Math.max(0, li.invite + 5 - currentRound) : 0
            const budgetUsed = li.budgetSeason === game.currentSeason
            const applyUsed = li.applySeason === game.currentSeason
            return (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" disabled={inviteCooldown > 0} style={{ flex: 1, padding: '8px 6px', fontSize: 11, opacity: inviteCooldown > 0 ? 0.5 : 1 }}
              onClick={() => {
                if (!interactWithPolitician) return
                const r = interactWithPolitician('invite')
                setPolFeedback({ text: r.message, ok: r.success })
                setTimeout(() => setPolFeedback(null), 4000)
              }}>
              {inviteCooldown > 0 ? `📋 Omg ${currentRound + inviteCooldown}` : '📋 Bjud in'}
            </button>
            <button className="btn btn-ghost" disabled={budgetUsed} style={{ flex: 1, padding: '8px 6px', fontSize: 11, opacity: budgetUsed ? 0.5 : 1 }}
              onClick={() => {
                if (!interactWithPolitician) return
                const r = interactWithPolitician('budget')
                setPolFeedback({ text: r.message, ok: r.success })
                setTimeout(() => setPolFeedback(null), 4000)
              }}>
              {budgetUsed ? '📊 Gjort' : '📊 Budget'}
            </button>
            <button className="btn btn-ghost" disabled={applyUsed || polData.relationship < 50} style={{ flex: 1, padding: '8px 6px', fontSize: 11, opacity: (applyUsed || polData.relationship < 50) ? 0.5 : 1 }}
              onClick={() => {
                if (!interactWithPolitician) return
                const r = interactWithPolitician('apply')
                setPolFeedback({ text: r.message, ok: r.success })
                setTimeout(() => setPolFeedback(null), 4000)
              }}>
              {applyUsed ? '📝 Gjort' : polData.relationship < 50 ? '📝 Kräver 50+' : '📝 Bidrag'}
            </button>
          </div>
            )
          })()}
        </SectionCard>
        )
      })()}

      {/* Anläggning + Faciliteter (merged) */}
      <SectionCard title="🏟️ Anläggning & faciliteter" stagger={2}>
        <FacilityRow label="Anläggningar" value={club.facilities} />
        <FacilityRow label="Ungdomskvalitet" value={club.youthQuality} />
        <FacilityRow label="Ungdomsrekrytering" value={club.youthRecruitment} />
        <FacilityRow label="Ungdomsutveckling" value={club.youthDevelopment} />
        {(game.facilityProjects ?? []).filter(p => p.status === 'in_progress').map(proj => (
          <div key={proj.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, fontWeight: 600 }}>🚧 {proj.name}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{proj.description}</p>
          </div>
        ))}
        {(game.facilityProjects ?? []).filter(p => p.status === 'in_progress').length === 0 && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Starta ett projekt för att utveckla anläggningen.</p>
        )}
        {/* Available projects */}
        {(() => {
          const available = getAvailableProjects(club.facilities, game.facilityProjects ?? [])
          if (available.length === 0) return null
          return (
            <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                TILLGÄNGLIGA PROJEKT
              </p>
              {available.map(proj => (
                <div key={proj.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj.name}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {proj.description} · {Math.round(proj.cost / 1000)} tkr · {proj.duration} omg
                    </p>
                  </div>
                  <button
                    className="btn btn-ghost"
                    disabled={club.finances < proj.cost}
                    style={{ padding: '5px 10px', fontSize: 11, opacity: club.finances < proj.cost ? 0.5 : 1, flexShrink: 0 }}
                    onClick={() => {
                      if (!startFacilityProject) return
                      startFacilityProject(proj.id)
                    }}
                  >
                    Starta
                  </button>
                </div>
              ))}
            </div>
          )
        })()}
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
