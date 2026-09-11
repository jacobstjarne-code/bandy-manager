import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { getStureLine, getTreasurerLine } from '../../domain/data/arrivalDialogue'
import { BoardObjectivesList } from '../components/portal/secondary/BoardObjectivesList'
import { getClubIntroIllustrationSrc, IllustrationScene } from '../components/illustration/IllustrationScene'
import type { BoardObjective } from '../../domain/entities/Community'
import type { BoardMember } from '../../domain/entities/Club'

type Phase = 'setting' | 'margareta' | 'sture' | 'objectives' | 'cta'

const PHASE_ORDER: Phase[] = ['setting', 'margareta', 'sture', 'objectives', 'cta']

function phaseGte(current: Phase, target: Phase): boolean {
  return PHASE_ORDER.indexOf(current) >= PHASE_ORDER.indexOf(target)
}

interface ArrivalSceneInnerProps {
  clubId: string
  clubName: string
  board: BoardMember[]
  objectives: BoardObjective[]
  contractsExpiringCount: number
  onComplete: () => void
}

function ArrivalSceneInner({ clubId, clubName, board, objectives, contractsExpiringCount, onComplete }: ArrivalSceneInnerProps) {
  const [phase, setPhase] = useState<Phase>('setting')
  const [settingIn, setSettingIn] = useState(false)

  // Initial setting fade-in — brief delay so CSS transition fires after mount
  useEffect(() => {
    const t = setTimeout(() => setSettingIn(true), 200)
    return () => clearTimeout(t)
  }, [])

  // Auto-progression chain (per spec ARRIVAL-02)
  useEffect(() => {
    const next: Partial<Record<Phase, [Phase, number]>> = {
      setting:    ['margareta',  1400],
      margareta:  ['sture',      2200],
      sture:      ['objectives', 2200],
      objectives: ['cta',        1400],
    }
    const step = next[phase]
    if (!step) return
    const [target, delay] = step
    const t = setTimeout(() => setPhase(target), delay)
    return () => clearTimeout(t)
  }, [phase])

  // Säkerhetsnät: oavsett om mellanstegens timers fyrar (StrictMode-cleanup,
  // bakgrundad flik som pausar timers, remount) ska CTA:n ALLTID bli nåbar.
  // Garanterad övergång till 'cta' efter total sekvenstid. Utan detta kan en
  // missad timer låsa scenen utan väg vidare utom "Hoppa över".
  useEffect(() => {
    const t = setTimeout(() => setPhase('cta'), 7600)
    return () => clearTimeout(t)
  }, [])

  // Tap-to-advance: ett klick var som helst hoppar till nästa fas (eller rakt
  // till 'cta'). Tar bort allt timer-beroende — den som läst klart trycker vidare.
  const advancePhase = () => {
    setPhase(p => {
      const i = PHASE_ORDER.indexOf(p)
      return i < PHASE_ORDER.length - 1 ? PHASE_ORDER[i + 1] : p
    })
    setSettingIn(true)
  }

  // KF4 (2026-06-21): styrelsen är en BoardMember[] — kassör/ledamot via roll.
  const treasurer = board.find(m => m.role === 'kassör')!  // kassör
  const member = board.find(m => m.role === 'ledamot')!    // ledamot — byns röst
  const memberLine = getStureLine(clubId)
  const treasurerLine = getTreasurerLine(contractsExpiringCount)

  // Dot i is lit when we've entered that phase: dot 0 = settingIn, 1–3 = phase > that dot's phase
  const dotLit = [
    settingIn,
    phaseGte(phase, 'margareta'),
    phaseGte(phase, 'sture'),
    phaseGte(phase, 'objectives'),
  ]

  return (
    <div className="arrival-scene" onClick={phase !== 'cta' ? advancePhase : undefined}>
      {/* Klubbens egen fullbleed-bild när den finns; övriga klubbar använder intro.jpg. */}
      <IllustrationScene
        mode="fullbleed"
        name="intro"
        src={getClubIntroIllustrationSrc(clubId)}
        alt=""
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      />
      <div
        className="arrival-scrim"
        style={{
          background: 'linear-gradient(180deg, rgba(250,244,233,0.54) 0px, rgba(250,244,233,0.26) 72px, rgba(250,244,233,0) 118px)',
        }}
      />
      <div className="arrival-lamp-overlay" />

      {/* MEDIUM 14 (audit 2026-08-29): etiketten lovade "introduktionen" men
          knappen stänger bara ankomstscenen — lag- och hörnövningarna ligger
          kvar. Alternativ (b), en riktig "Snabbstart" för återvändande spelare,
          saknar fundament: kodbasen har ingen karriärräknare och inget
          returning-player-begrepp alls (grep: careerCount/previousCareer/
          isReturning → noll träffar utanför ett orelaterat testnamn). Etiketten
          rättas till vad knappen FAKTISKT gör; "Ankomsten" är scenens eget
          rubrikord tio rader ned. */}
      <button
        className="scene-skip"
        aria-label="Hoppa över ankomsten"
        onClick={onComplete}
        style={{
          color: '#4F382D',
          fontWeight: 700,
          textShadow: '0 1px 0 rgba(255,255,255,0.55), 0 0 7px rgba(250,244,233,0.8)',
        }}
      >
        Hoppa över ↘
      </button>

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 2, padding: '32px 24px 0', textAlign: 'center' }}>
        <div
          className="h-scene-genre"
          style={{
            color: '#7A3F20',
            opacity: 0.95,
            textShadow: '0 1px 0 rgba(255,255,255,0.55), 0 0 7px rgba(250,244,233,0.8)',
          }}
        >
          ⬩ &nbsp;Ankomsten&nbsp; ⬩
        </div>
        <div className="beat-progress" style={{ marginTop: 14 }}>
          {dotLit.map((lit, i) => (
            <span
              key={i}
              className={`dot${lit ? ' active' : ''}`}
              style={{
                background: lit ? '#7A3F20' : 'rgba(88,52,34,0.42)',
                boxShadow: '0 0 0 1px rgba(255,248,236,0.28)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Content stack — all elements always in DOM, CSS transitions drive visibility */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        position: 'relative',
        zIndex: 1,
        padding: '28px 24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        {/* Narrativ-panel — tillräckligt tät mörk backing för att den ljusa
            texten ska läsa även mot klubbmotiv med mörka hus/fasader. */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          background: 'rgba(10,8,12,0.70)',
          border: '1px solid rgba(245,241,235,0.06)',
          borderRadius: 'var(--radius)',
          padding: '20px 18px',
        }}>
        {/* Setting */}
        <div className={[
          'scene-setting',
          settingIn && 'in',
          phaseGte(phase, 'margareta') && 'dimmed',
        ].filter(Boolean).join(' ')}>
          <strong>{clubName}.</strong>
          {` Onsdag kväll. Lampan vid klubbhuset lyser. De väntar på dig där inne. ${treasurer.firstName} ${treasurer.lastName}. ${member.firstName} ${member.lastName}. Två kaffekoppar står redan på bordet.`}
        </div>

        {/* Margareta */}
        <div className={[
          'scene-replica',
          phaseGte(phase, 'margareta') && 'in',
          phaseGte(phase, 'sture') && 'dimmed',
        ].filter(Boolean).join(' ')}>
          <div className="h-scene-speaker">{treasurer.firstName} · Kassör</div>
          <div className="h-scene-quote">{treasurerLine}</div>
        </div>

        {/* Sture */}
        <div className={[
          'scene-replica',
          phaseGte(phase, 'sture') && 'in',
          phaseGte(phase, 'objectives') && 'dimmed',
        ].filter(Boolean).join(' ')}>
          <div className="h-scene-speaker">{member.firstName} · Ledamot</div>
          <div className="h-scene-quote">"{memberLine}"</div>
        </div>
        </div>

        {/* BoardObjectives — full opacity, never dimmed */}
        <div className={[
          'arrival-board-objectives',
          phaseGte(phase, 'objectives') && 'in',
        ].filter(Boolean).join(' ')}>
          <div className="portal-secondary-card arrival-board-objectives-card">
            <div className="portal-card-stripe portal-card-stripe-copper" />
            <div className="portal-card-eyebrow">🎯 Styrelsens krav</div>
            <BoardObjectivesList objectives={objectives} max={3} />
          </div>
        </div>
      </div>

      {/* CTA — absolute bottom, fades in at cta phase. stopPropagation så knappen
          inte fångas av scenens tap-to-advance. */}
      <div className={['scene-cta-area', phase === 'cta' && 'in'].filter(Boolean).join(' ')}>
        <button className="btn btn-primary btn-cta" onClick={(e) => { e.stopPropagation(); onComplete() }}>Sätt igång →</button>
      </div>
    </div>
  )
}

export function ArrivalScene() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const advanceOnboardingToTilltrade = useGameStore(s => s.advanceOnboardingToTilltrade)

  if (!game) {
    navigate('/', { replace: true })
    return null
  }

  const managedClub = game.clubs.find(c => c.id === game.managedClubId)
  if (!managedClub) {
    navigate('/', { replace: true })
    return null
  }
  // KF4 (2026-06-21): styrelsen bor på game.board (EN modell), inte club.board.
  const board = game.board
  if (!board || board.length === 0) {
    // Defensiv: nya spel + migrerade saves har alltid styrelse. Hoppa hellre intro än krascha.
    navigate('/game/dashboard', { replace: true })
    return null
  }

  // 2.6: kontrakt som löper ut DENNA säsong i den hanterade klubben — samma
  // villkor arcService.ts/playerVoiceService.ts redan använder.
  const contractsExpiringCount = game.players.filter(
    p => p.clubId === game.managedClubId && p.contractUntilSeason === game.currentSeason
  ).length

  return (
    <ArrivalSceneInner
      clubId={managedClub.id}
      clubName={managedClub.name}
      board={board}
      objectives={game.boardObjectives ?? []}
      contractsExpiringCount={contractsExpiringCount}
      onComplete={() => { void advanceOnboardingToTilltrade(); navigate('/tilltrade', { replace: true }) }}
    />
  )
}
