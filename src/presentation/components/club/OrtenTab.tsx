import { useState, useEffect } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { Club } from '../../../domain/entities/Club'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import { ClubExpectation, ClubStyle } from '../../../domain/enums'
import { SectionCard } from '../SectionCard'
import { InfoRow } from '../primitives'
import { csColor } from '../../utils/formatters'
import { getFunctionaryQuote } from '../../../domain/services/functionaryQuoteService'
import { OrtenMap } from './OrtenMap'
import { generateVolunteerRoster, getActiveVolunteerBonus } from '../../../domain/services/volunteerService'
import { seasonSpanLabel } from '../../../domain/utils/seasonYear'
import { SUPPORTER_ROLE_LABELS } from '../../../domain/data/enumLabels'
import { BarChart3, ClipboardList, FilePenLine } from 'lucide-react'

function expectationLabel(e: ClubExpectation): string {
  const map: Record<ClubExpectation, string> = {
    // H4 Heros: samma korta rubrik Jacob låste för klubbvalsskärmen
    // ("LÅGA FÖRVÄNTNINGAR"), inte ny text.
    [ClubExpectation.Survive]: 'Låga förväntningar',
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



interface OrtenTabProps {
  club: Club
  game: SaveGame
  navigate: NavigateFunction
  interactWithPolitician?: (action: 'invite' | 'budget' | 'apply') => { success: boolean; message: string }
  recruitVolunteer?: (name: string) => void
  activateCommunity?: (key: string, level: string) => { success: boolean; error?: string }
  onNavigateTab?: (tab: string) => void
  /** Deep-link: scrolla till specifik sektion vid mount */
  scrollToSection?: string
}

export function OrtenTab({ club, game, navigate, interactWithPolitician, recruitVolunteer, activateCommunity, onNavigateTab, scrollToSection }: OrtenTabProps) {
  const [polFeedback, setPolFeedback] = useState<{ text: string; ok: boolean } | null>(null)
  const [activityFeedback, setActivityFeedback] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    if (!scrollToSection) return
    const sectionIds: Record<string, string> = {
      klack: 'section-supporter',
      supporter: 'section-supporter',
      skola: 'section-youth',
      kommunen: 'section-politician',
      mecenater: 'section-sponsors',
      frivilliga: 'section-volunteers',
    }
    const el = document.getElementById(sectionIds[scrollToSection] ?? scrollToSection)
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
  }, [scrollToSection])

  function handleActivity(key: string, level: string) {
    if (!activateCommunity) return
    const result = activateCommunity(key, level)
    setActivityFeedback({ text: result.error ?? 'Aktivitet uppdaterad', ok: result.success })
    if (result.success) setTimeout(() => setActivityFeedback(null), 2500)
  }

  const cs = game.communityStanding ?? 50
  const currentRound = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup && !f.isKnockout)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)
  const quote = getFunctionaryQuote(game, currentRound, game.lastCompletedFixtureId)
  const ca = game.communityActivities

  // Volunteer roster — generated from seed based on clubId + season
  const seedNum = game.managedClubId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + game.currentSeason * 17
  const volunteerRoster = generateVolunteerRoster(seedNum, 4)
  const activeVolunteers = game.volunteers ?? []
  const volunteerBonus = getActiveVolunteerBonus(activeVolunteers, volunteerRoster)

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
          if (id === 'arena') { navigate('/game/bygget'); return }
          const sectionMap: Record<string, string> = {
            skola: 'section-youth',
            kommunen: 'section-politician',
            mecenater: 'section-sponsors',
            frivilliga: 'section-volunteers',
            klack: 'section-supporter',
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
            <p className="h-label">SÄSONG</p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{seasonSpanLabel(game.currentSeason)}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
          <div style={{ flex: cs, height: 7, background: csColor(cs), borderRadius: '4px 0 0 4px' }} />
          <div style={{ flex: 100 - cs, height: 7, background: 'var(--border-dark)', borderRadius: '0 4px 4px 0' }} />
        </div>
        {/* Samhällsaktiviteter — MASTER_OPPET.md sluttest-ortentab-falsk-kommentar
            (2026-09-01): påstods tidigare bara påverka bygdens puls, inte inkomst
            — falskt, motsagt av economyService.ts. Barnskolan, funktionärer
            och den avancerade skolan ger communityMatchIncome eller
            communityRoundIncome; Bandyplay påverkar sponsorintäkt och drift. */}
        <p className="h-label" style={{ marginBottom: 6 }}>ENGAGEMANG</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
          {/* EkonomiTab äger aktivering — read-only status här */}
          {([
            { key: 'bandySchoolBasic' as const, label: '⛸️ Bandyskola för barn', active: !!ca?.bandySchoolBasic },
            { key: 'bandyplay' as const,        label: '📡 Bandyplay', active: !!ca?.bandyplay },
            { key: 'functionaries' as const,  label: '🏋️ Funktionärer',         active: !!ca?.functionaries },
            { key: 'bandySchool' as const,    label: '🏫 Bandyskola avancerad', active: !!ca?.bandySchool },
          ]).map(({ key, label, active }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {label}
                {active && <span style={{ color: 'var(--success)', marginLeft: 4, fontSize: 10 }}>✓</span>}
              </span>
              {!active && onNavigateTab && (
                <button
                  className="btn btn-ghost"
                  onClick={() => onNavigateTab('ekonomi')}
                  style={{ padding: '3px 8px', fontSize: 10, flexShrink: 0, color: 'var(--text-muted)' }}
                >
                  Ekonomi →
                </button>
              )}
            </div>
          ))}
          {/* Orten äger dessa — knappar finns här */}
          {([
            { key: 'pensionarskaffe' as const, levels: [{ id: 'active', label: '☕ Pensionärskaffe', cost: 0 }], current: ca?.pensionarskaffe ? 'active' : 'none' },
            { key: 'soppkvall' as const,       levels: [{ id: 'active', label: '🍲 Soppkväll med laget', cost: 1000 }], current: ca?.soppkvall ? 'active' : 'none' },
            { key: 'skolbesok' as const,       levels: [{ id: 'active', label: '🎒 Skolbesök', cost: 0 }], current: ca?.skolbesok ? 'active' : 'none' },
          ] as const).map(({ key, levels, current }) => {
            const nextLevel = levels.find(l => l.id !== current)
            const isActive = current !== 'none'
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {levels[0].label}
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

      {/* Anläggning bor i FacilityScreen (/game/bygget) sedan Orten-rensningen eb2cf013 — arena-noden i Ortskartan deep-linkar dit. */}

      {/* Lokaltidningen */}
      {game.journalist && (() => {
        const j = game.journalist
        const relColor = j.relationship >= 70 ? 'var(--success)' : j.relationship >= 40 ? 'var(--text-muted)' : 'var(--danger)'
        const relLabel = j.relationship >= 70 ? '😊 Positiv' : j.relationship < 40 ? '😤 Kritisk' : null
        const recentMemories = [...(j.memory ?? [])].reverse().slice(0, 2)
        return (
          <SectionCard title="📰 Lokaltidningen" stagger={2} collapsible defaultCollapsed>
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
                      // M37 (textaudit 2026-07-04): cs_press_*-nycklarna saknade etiketter
                      // och föll till råa slugs via `?? m.event`.
                      cs_press_individual: 'Lyfte fram en spelare efter nollan',
                      cs_press_team: 'Pekade på hela laget efter nollan',
                      cs_press_system: 'Svarade systemiskt efter nollan',
                      cs_press_silent: 'Avstod kommentar efter nollan',
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
            {/* Rot till audit-fyndet "Orten-volontärer går horisontellt sönder"
                (2026-08-29): containern saknade flexDirection: 'column', så de
                fyra namn+moral-raderna — som var skrivna som fullbreddsrader
                (justify-content: space-between, padding 2px 0) — lades sida vid
                sida med 2px emellan och klipptes/flöt ihop på 390px. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 }}>
              {activeVolunteers.map((name, i) => {
                const morale = (game.volunteerMorale ?? {})[name] ?? 70
                const moraleColor = morale >= 60 ? 'var(--success)' : morale >= 35 ? 'var(--accent)' : 'var(--danger)'
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, padding: '2px 0' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', minWidth: 0, overflowWrap: 'anywhere' }}>{name}</span>
                    <span style={{ fontSize: 10, color: moraleColor, flexShrink: 0 }}>{morale}</span>
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
                  { key: 'bandySchoolBasic', label: 'Bandyskola (gratis)' },
                  { key: 'bandySchool', label: 'Bandyskola avancerad' },
                  { key: 'skolbesok', label: 'Skolbesök' },
                ],
                inclusion: [
                  { key: 'functionaries', label: 'Funktionärer' },
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
                <div style={{ padding: '6px 8px', background: 'color-mix(in srgb, var(--accent) 6%, transparent)', borderRadius: 'var(--radius-md)', marginBottom: 6 }}>
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
            const currentRound = game.fixtures.filter(f => f.status === 'completed' && !f.isCup && !f.isKnockout).reduce((max, f) => Math.max(max, f.roundNumber), 0)
            const inviteCooldown = li.invite !== undefined ? Math.max(0, li.invite + 5 - currentRound) : 0
            const budgetUsed = li.budgetSeason === game.currentSeason
            const applyUsed = li.applySeason === game.currentSeason
            return (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" disabled={inviteCooldown > 0} style={{ flex: 1, padding: '8px 6px', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              onClick={() => {
                if (!interactWithPolitician) return
                const r = interactWithPolitician('invite')
                setPolFeedback({ text: r.message, ok: r.success })
                setTimeout(() => setPolFeedback(null), 4000)
              }}>
              <ClipboardList size={13} aria-hidden="true" />
              {inviteCooldown > 0 ? `Omg ${currentRound + inviteCooldown}` : 'Bjud in'}
            </button>
            <button className="btn btn-ghost" disabled={budgetUsed} style={{ flex: 1, padding: '8px 6px', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              onClick={() => {
                if (!interactWithPolitician) return
                const r = interactWithPolitician('budget')
                setPolFeedback({ text: r.message, ok: r.success })
                setTimeout(() => setPolFeedback(null), 4000)
              }}>
              <BarChart3 size={13} aria-hidden="true" />
              {budgetUsed ? 'Gjort' : 'Budget'}
            </button>
            <button className="btn btn-ghost" disabled={applyUsed || polData.relationship < 50} style={{ flex: 1, padding: '8px 6px', fontSize: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              onClick={() => {
                if (!interactWithPolitician) return
                const r = interactWithPolitician('apply')
                setPolFeedback({ text: r.message, ok: r.success })
                setTimeout(() => setPolFeedback(null), 4000)
              }}>
              <FilePenLine size={13} aria-hidden="true" />
              {applyUsed ? 'Gjort' : polData.relationship < 50 ? 'Kräver 50+' : 'Bidrag'}
            </button>
          </div>
            )
          })()}
          </div>
        </SectionCard>
        )
      })()}

      <SectionCard title="🎯 Förväntan & profil" stagger={3} collapsible defaultCollapsed>
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
        {/* MASTER_OPPET.md fanexpectation-dott (2026-09-02): club.fanExpectation
            sätts en gång i worldGenerator.ts och stegar aldrig med säsongen,
            till skillnad från boardExpectation (recalibrateExpectationLadder,
            boardService.ts). Rendera samma sanna värde här tills en egen,
            oberoende supporterförväntans-mekanik faktiskt byggs. */}
        <InfoRow label="Supporterförväntning" value={expectationLabel(club.boardExpectation)} />
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
        <SectionCard title="📅 Säsongshistorik" stagger={4} collapsible defaultCollapsed>
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


      {/* Klacken / Supporter */}
      {game.supporterGroup && (() => {
        const sg = game.supporterGroup!
        const moodColor = sg.mood >= 70 ? 'var(--success)' : sg.mood >= 40 ? 'var(--text-muted)' : 'var(--danger)'
        const chars = [sg.leader, sg.veteran, sg.youth, sg.family]
        return (
          <SectionCard title={`📯 ${sg.name}`} stagger={4} id="section-supporter">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: moodColor }}>Stämning {sg.mood}/100</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sg.members} medlemmar</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {chars.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', minWidth: 90 }}>{c.name}</span>
                  {/* Språkläcka (audit 2026-08-29): renderade rå SupporterRole med
                      capitalize → "Leader"/"Youth"/"Family". Etiketterna är tomma
                      tills Opus levererat dem (SUPPORTER_ROLE_LABELS) — inget
                      renderas hellre än engelska. */}
                  {SUPPORTER_ROLE_LABELS[c.role] && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{SUPPORTER_ROLE_LABELS[c.role]}</span>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )
      })()}

    </>
  )
}
