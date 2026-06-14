import { useState } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { Club } from '../../../domain/entities/Club'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { ClubExpectation, ClubStyle } from '../../../domain/enums'
import { SectionCard } from '../SectionCard'
import { InfoRow } from '../primitives'
import { csColor } from '../../utils/formatters'
import { getFunctionaryQuote } from '../../../domain/services/functionaryQuoteService'
import { FACILITY_NODE_DEFS } from '../../../domain/services/facilityService'
import { OrtenMap } from './OrtenMap'
import { generateVolunteerRoster, getActiveVolunteerBonus } from '../../../domain/services/volunteerService'
import { seasonSpanLabel } from '../../../domain/utils/seasonYear'

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



function FacilityRow({ label, value }: { label: string; value: number }) {
  const col = value >= 70 ? 'var(--success)' : value >= 45 ? 'var(--accent)' : 'var(--text-muted)'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: col }}>{value}</span>
    </div>
  )
}

interface OrtenTabProps {
  club: Club
  game: SaveGame
  navigate: NavigateFunction
  interactWithPolitician?: (action: 'invite' | 'budget' | 'apply') => { success: boolean; message: string }
  startFacilityProject?: (projectId: string, mode?: 'club' | 'kommun' | 'mecenat') => { success: boolean; error?: string }
  recruitVolunteer?: (name: string) => void
  activateCommunity?: (key: string, level: string) => { success: boolean; error?: string }
}

export function OrtenTab({ club, game, navigate, interactWithPolitician, recruitVolunteer, activateCommunity }: OrtenTabProps) {
  const [polFeedback, setPolFeedback] = useState<{ text: string; ok: boolean } | null>(null)
  const [activityFeedback, setActivityFeedback] = useState<{ text: string; ok: boolean } | null>(null)

  function handleActivity(key: string, level: string) {
    if (!activateCommunity) return
    const result = activateCommunity(key, level)
    setActivityFeedback({ text: result.error ?? 'Aktivitet uppdaterad', ok: result.success })
    if (result.success) setTimeout(() => setActivityFeedback(null), 2500)
  }

  const cs = game.communityStanding ?? 50
  const currentRound = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)
  const quote = getFunctionaryQuote(game, currentRound, game.lastCompletedFixtureId)
  const ca = game.communityActivities

  // Volunteer roster — generated from seed based on clubId + season
  const seedNum = game.managedClubId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + game.currentSeason * 17
  const volunteerRoster = generateVolunteerRoster(seedNum, 4)
  const activeVolunteers = game.volunteers ?? []
  const volunteerBonus = getActiveVolunteerBonus(activeVolunteers)

  // Journalist persona labels
  function personaLabel(p: string): string {
    const map: Record<string, string> = {
      supportive: 'Välvillig — skriver gärna positivt',
      critical: 'Kritisk — granskar hårt',
      analytical: 'Analytisk — fokus på fakta',
      sensationalist: 'Sensationslystnad — älskar dramatik',
    }
    return map[p] ?? p
  }

  return (
    <>
      {/* Ortskarta */}
      <SectionCard title="🗺️ Ortskartan" stagger={1}>
        <OrtenMap club={club} game={game} onNodeClick={(id) => {
          const sectionMap: Record<string, string> = {
            arena: 'section-facilities',
            skola: 'section-youth',
            kommunen: 'section-politician',
            mecenater: 'section-sponsors',
            frivilliga: 'section-volunteers',
          }
          const el = document.getElementById(sectionMap[id] ?? '')
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }} />
      </SectionCard>

      {/* Bygdens puls */}
      <SectionCard title="🏠 Bygdens puls" stagger={1}>
        {/* Puls-hero med trendpil */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 40, fontWeight: 300, color: csColor(cs), fontFamily: 'var(--font-display)', lineHeight: 1 }}>{cs}</span>
          {(() => {
            const delta = game.communityStandingDelta ?? 0
            if (delta > 0) return <span style={{ fontSize: 20, color: 'var(--success)' }}>▲</span>
            if (delta < 0) return <span style={{ fontSize: 20, color: 'var(--danger)' }}>▼</span>
            return <span style={{ fontSize: 20, color: 'var(--text-muted)' }}>—</span>
          })()}
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>SÄSONG</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{seasonSpanLabel(game.currentSeason)}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
          <div style={{ flex: cs, height: 7, background: csColor(cs), borderRadius: '4px 0 0 4px' }} />
          <div style={{ flex: 100 - cs, height: 7, background: 'var(--border-dark)', borderRadius: '0 4px 4px 0' }} />
        </div>
        {/* Samhällsaktiviteter — påverkar bygdens puls, inte inkomst */}
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>ENGAGEMANG</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
          {([
            { key: 'functionaries', levels: [{ id: 'active', label: '🤝 Matchvärdar (2 tkr)', cost: 2000 }], current: ca?.functionaries ? 'active' : 'none', isEnum: false },
            { key: 'bandyplay',     levels: [{ id: 'active', label: '⛸️ Bandyskola för barn (gratis)', cost: 0 }], current: ca?.bandyplay ? 'active' : 'none', isEnum: false },
            { key: 'bandySchool',   levels: [{ id: 'active', label: '🏫 Bandyskola avancerad (5 tkr)', cost: 5000 }], current: ca?.bandySchool ? 'active' : 'none', isEnum: false },
            { key: 'pensionarskaffe', levels: [{ id: 'active', label: '☕ Pensionärskaffe (gratis)', cost: 0 }], current: ca?.pensionarskaffe ? 'active' : 'none', isEnum: false },
            { key: 'soppkvall',     levels: [{ id: 'active', label: '🍲 Soppkväll med laget (1 tkr)', cost: 1000 }], current: ca?.soppkvall ? 'active' : 'none', isEnum: false },
            { key: 'skolbesok',     levels: [{ id: 'active', label: '🎒 Skolbesök (gratis)', cost: 0 }], current: ca?.skolbesok ? 'active' : 'none', isEnum: false },
          ] as const).map(({ key, levels, current }) => {
            const nextLevel = levels.find(l => l.id !== current)
            const isActive = current !== 'none'
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {isActive ? levels.find(l => l.id === current)?.label.split('(')[0].trim() ?? key : levels[0].label.split('(')[0].trim()}
                  {isActive && <span style={{ color: 'var(--success)', marginLeft: 4, fontSize: 10 }}>✓</span>}
                </span>
                {nextLevel && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => handleActivity(key, nextLevel.id)}
                    style={{ padding: '3px 8px', fontSize: 10, flexShrink: 0 }}
                  >
                    {isActive ? 'Uppgradera' : 'Aktivera'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        {activityFeedback && (
          <p style={{ fontSize: 11, color: activityFeedback.ok ? 'var(--success)' : 'var(--danger)', marginBottom: 8 }}>
            {activityFeedback.text}
          </p>
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

      {/* Lokaltidningen */}
      {game.journalist && (() => {
        const j = game.journalist
        const relColor = j.relationship >= 70 ? 'var(--success)' : j.relationship >= 40 ? 'var(--text-muted)' : 'var(--danger)'
        const relLabel = j.relationship >= 70 ? '😊 Positiv' : j.relationship < 40 ? '😤 Kritisk' : null
        const recentMemories = [...(j.memory ?? [])].reverse().slice(0, 2)
        return (
          <SectionCard title="📰 Lokaltidningen" stagger={2}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{j.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{j.outlet}</p>
              </div>
              {relLabel && <span style={{ fontSize: 11, fontWeight: 600, color: relColor }}>{relLabel}</span>}
            </div>
            <div style={{ height: 6, borderRadius: 2, background: 'var(--border)', overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${j.relationship}%`, background: relColor, borderRadius: 2, transition: 'width 0.5s ease' }} />
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 8 }}>
              {personaLabel(j.persona)}
            </p>
            {recentMemories.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>SENASTE INTERAKTIONER</p>
                {recentMemories.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '3px 0', borderBottom: i < recentMemories.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Omg {m.matchday} — {{
                      good_answer: 'Bra svar',
                      bad_answer: 'Dåligt svar',
                      refused_press: 'Vägrade kommentera',
                      big_win: 'Stor seger',
                      crisis: 'Krisläge',
                    }[m.event] ?? m.event}</span>
                    <span style={{ color: m.sentiment >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{m.sentiment >= 0 ? '+' : ''}{m.sentiment}</span>
                  </div>
                ))}
              </div>
            )}
            {j.pressRefusals > 0 && (
              <p style={{ fontSize: 11, color: 'var(--warning)', marginTop: 6 }}>
                ⚠️ {j.pressRefusals} presskonferens{j.pressRefusals > 1 ? 'er' : ''} avvisad
              </p>
            )}
          </SectionCard>
        )
      })()}

      {/* Frivilligpool */}
      <SectionCard title="👥 Frivilliga" stagger={2} id="section-volunteers">
        {activeVolunteers.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            {/* Aggregate bar — total frivilliga-styrka */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--success)' }}>{activeVolunteers.length}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>frivilliga</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
                +{Math.round(volunteerBonus.weeklyIncome / 1000)} tkr · +{volunteerBonus.csBoostPerRound.toFixed(1)} puls/omg
              </span>
            </div>
            <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
              {activeVolunteers.map((name, i) => {
                const morale = (game.volunteerMorale ?? {})[name] ?? 70
                const moraleColor = morale >= 60 ? 'var(--success)' : morale >= 35 ? 'var(--accent)' : 'var(--danger)'
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{name}</span>
                    <span style={{ fontSize: 10, color: moraleColor, marginLeft: 6 }}>{morale}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
          TILLGÄNGLIGA ATT REKRYTERA
        </p>
        {volunteerRoster
          .filter(v => !activeVolunteers.includes(v.name))
          .map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600 }}>{v.name}</p>
                <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  {v.role} · {v.csBoost} puls/omg{v.weeklyContrib > 0 ? ` · +${Math.round(v.weeklyContrib / 1000)} tkr` : ''}
                </p>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => recruitVolunteer?.(v.name)}
                style={{ padding: '5px 10px', fontSize: 11, flexShrink: 0 }}
              >
                Rekrytera
              </button>
            </div>
          ))}
        {volunteerRoster.filter(v => !activeVolunteers.includes(v.name)).length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Alla tillgängliga frivilliga är redan rekryterade.</p>
        )}
      </SectionCard>

      {/* Mecenater */}
      <SectionCard title="👥 Mecenater" stagger={2} id="section-sponsors">
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
        <SectionCard title="🏛️ Kommun" stagger={2} id="section-politician">
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>{polData.name} {polData.party.startsWith('(') ? polData.party : `(${polData.party})`}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Agenda: {agendaLabel[polData.agenda] ?? polData.agenda}
              {polData.mediaProfile && ` · ${
                polData.mediaProfile === 'tystlåten' ? 'Tystlåten' :
                polData.mediaProfile === 'utåtriktad' ? 'Utåtriktad' : 'Populist'
              }`}
              {polData.personalInterest === 'bandy' && ' · Bandyfan'}
            </p>
            {polData.campaignPromise && (
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4, marginTop: 4, marginBottom: 4 }}>
                💬 "{polData.campaignPromise}"
              </p>
            )}
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
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4, marginBottom: 4 }}>
              {agendaText[polData.agenda] ?? ''}
            </p>
            {/* Agenda-hint: vilka aktiviteter räknas (Fable-fynd 2) */}
            {(() => {
              const agendaActivityHints: Partial<Record<string, { key: string; label: string }[]>> = {
                youth: [
                  { key: 'bandyplay', label: 'Bandyskola (gratis)' },
                  { key: 'bandySchool', label: 'Bandyskola avancerad' },
                  { key: 'skolbesok', label: 'Skolbesök' },
                ],
                inclusion: [
                  { key: 'functionaries', label: 'Matchvärdar' },
                  { key: 'pensionarskaffe', label: 'Pensionärskaffe' },
                  { key: 'soppkvall', label: 'Soppkväll' },
                  { key: 'skolbesok', label: 'Skolbesök' },
                ],
              }
              const hints = agendaActivityHints[polData.agenda]
              if (!hints) return null
              const caAny = (ca as unknown) as Record<string, unknown> | undefined
              const active = hints.filter(h => !!caAny?.[h.key])
              const inactive = hints.filter(h => !caAny?.[h.key])
              return (
                <div style={{ padding: '6px 8px', background: 'color-mix(in srgb, var(--accent) 6%, transparent)', borderRadius: 6, marginBottom: 6 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>RÄKNAS FÖR AGENDАН</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {active.map(h => (
                      <span key={h.key} style={{ fontSize: 10, color: 'var(--success)', fontWeight: 600 }}>✓ {h.label}</span>
                    ))}
                    {inactive.map(h => (
                      <span key={h.key} style={{ fontSize: 10, color: 'var(--text-muted)' }}>○ {h.label}</span>
                    ))}
                  </div>
                </div>
              )
            })()}
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
              Kommunbidrag: {Math.round((polData.kommunBidrag ?? 0) / 1000)} tkr/säsong
              {polData.mandatExpires && ` · Nästa val: säs. ${polData.mandatExpires}`}
            </p>
          </div>
          {polFeedback && (
            <p style={{ fontSize: 12, color: polFeedback.ok ? 'var(--success)' : 'var(--danger)', marginBottom: 8, fontWeight: 600 }}>
              {polFeedback.ok ? '✓' : '✗'} {polFeedback.text}
            </p>
          )}
          {/* Copper-ram runt knapp-blocket */}
          <div style={{ border: '1px solid var(--accent)', borderRadius: 'var(--radius-md)', padding: 8, opacity: 0.95 }}>
          {(() => {
            const li = game.politicianLastInteraction ?? {}
            const currentRound = game.fixtures.filter(f => f.status === 'completed' && !f.isCup).reduce((max, f) => Math.max(max, f.roundNumber), 0)
            const inviteCooldown = li.invite ? Math.max(0, li.invite + 8 - currentRound) : 0
            const budgetUsed = li.budgetSeason === game.currentSeason
            const applyUsed = li.applySeason === game.currentSeason
            return (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" disabled={inviteCooldown > 0} style={{ flex: 1, padding: '8px 6px', fontSize: 11 }}
              onClick={() => {
                if (!interactWithPolitician) return
                const r = interactWithPolitician('invite')
                setPolFeedback({ text: r.message, ok: r.success })
                setTimeout(() => setPolFeedback(null), 4000)
              }}>
              {inviteCooldown > 0 ? `📋 Omg ${currentRound + inviteCooldown}` : '📋 Bjud in'}
            </button>
            <button className="btn btn-ghost" disabled={budgetUsed} style={{ flex: 1, padding: '8px 6px', fontSize: 11 }}
              onClick={() => {
                if (!interactWithPolitician) return
                const r = interactWithPolitician('budget')
                setPolFeedback({ text: r.message, ok: r.success })
                setTimeout(() => setPolFeedback(null), 4000)
              }}>
              {budgetUsed ? '📊 Gjort' : '📊 Budget'}
            </button>
            <button className="btn btn-ghost" disabled={applyUsed || polData.relationship < 50} style={{ flex: 1, padding: '8px 6px', fontSize: 11 }}
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
          </div>
        </SectionCard>
        )
      })()}

      {/* Anläggning + Faciliteter (merged) */}
      <SectionCard title="🏟️ Anläggning & faciliteter" stagger={2} id="section-facilities">
        <FacilityRow label="Anläggningar" value={club.facilities} />
        <FacilityRow label="Ungdomskvalitet" value={club.youthQuality} />
        <FacilityRow label="Ungdomsrekrytering" value={club.youthRecruitment} />
        <FacilityRow label="Ungdomsutveckling" value={club.youthDevelopment} />
        {game.facilityState?.activeProject && (() => {
          const ap = game.facilityState!.activeProject!
          const def = FACILITY_NODE_DEFS.find(d => d.id === ap.nodeId)
          return (
            <div style={{ padding: '8px 0', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, fontWeight: 600 }}>🚧 {def?.label ?? ap.nodeId}</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Klar omgång {ap.etaMatchday}</p>
            </div>
          )
        })()}
        <button
          className="btn btn-ghost"
          style={{ width: '100%', textAlign: 'left', marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', fontSize: 12 }}
          onClick={() => navigate('/game/facility')}
        >
          <span>Visa trädet</span>
          <span style={{ color: 'var(--text-muted)' }}>›</span>
        </button>
      </SectionCard>

      <SectionCard title="🎯 Förväntan & profil" stagger={3}>
        {/* WEAK-012: Reputation */}
        {(() => {
          const r = club.reputation
          const repLabel = r >= 85 ? 'Elitklubb' : r >= 70 ? 'Etablerad topp' : r >= 55 ? 'Mittenklubb' : r >= 40 ? 'Utmanare' : 'Underdog'
          const repColor = r >= 70 ? 'var(--accent)' : r >= 45 ? 'var(--text-primary)' : 'var(--text-secondary)'
          return (
            <div style={{ paddingBottom: 10, marginBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>KLUBBRENOMMÉ</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: repColor, marginLeft: 'auto' }}>{r}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>/ 100</span>
                <span style={{ fontSize: 11, color: repColor }}>{repLabel}</span>
              </div>
              <div style={{ display: 'flex', gap: 1 }}>
                <div style={{ flex: r, height: 4, background: repColor, borderRadius: 2 }} />
                <div style={{ flex: 100 - r, height: 4, background: 'var(--border)', borderRadius: 2 }} />
              </div>
            </div>
          )
        })()}
        <InfoRow label="Styrelseförväntning" value={expectationLabel(club.boardExpectation)} />
        <InfoRow label="Supporterförväntning" value={expectationLabel(club.fanExpectation)} />
        <InfoRow label="Spelstil" value={styleLabel(club.preferredStyle)} />
        <InfoRow label="Konstis" value={club.hasArtificialIce ? 'Ja' : 'Nej'} />
        {(game.boardObjectives ?? []).length > 0 && (
          <div>
            <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
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
