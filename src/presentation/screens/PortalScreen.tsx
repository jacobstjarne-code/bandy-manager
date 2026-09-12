import { useMemo, useEffect, useState, useCallback, useRef, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { FastForward } from 'lucide-react'
import { Icon } from '../components/primitives/Icon'
import { useGameStore, useCanAdvance } from '../store/gameStore'
import { buildPortal, makeSeed } from '../../domain/services/portal/portalBuilder'
import { getSeasonalTone } from '../../domain/services/portal/seasonalTone'
import { initCardBag } from '../../domain/services/portal/initCardBag'
import { PortalSecondarySection } from '../components/portal/PortalSecondarySection'
import { PortalMinimalBar } from '../components/portal/PortalMinimalBar'
import { SituationCard } from '../components/portal/SituationCard'
import { PortalBeat } from '../components/portal/PortalBeat'
import { PortalPhaseMark } from '../components/portal/PortalPhaseMark'
import { PortalSpectatorMark } from '../components/portal/PortalSpectatorMark'
import { PortalAnniversaryMark } from '../components/portal/PortalAnniversaryMark'
import { PortalEventSlot } from '../components/portal/PortalEventSlot'
import { PortalQueueRail } from '../components/portal/PortalQueueRail'
import { PortalInboxCounter } from '../components/portal/PortalInboxCounter'
import { AnslagOverlay } from '../components/anslag/AnslagOverlay'
import { IllustrationScene } from '../components/illustration/IllustrationScene'
import { computeNextAnslag } from '../../domain/services/anslagService'
import { getActiveDecisionCount } from '../../domain/services/decisionBudgetService'
import { PlayoffRound, PendingScreen } from '../../domain/enums'
import { playSound } from '../audio/soundEffects'
import { PortalUpptakt } from '../components/portal/PortalUpptakt'
import { getEscalationSubState } from '../../application/services/portalEscalationResolver'
import { AnnandagsValEvent } from '../components/portal/AnnandagsValEvent'
import { CallupModal } from '../components/portal/CallupModal'
import { getPlayoffSeriesContext } from '../../domain/services/portal/playoffSeriesContext'
import { PortalObjectiveAlert } from '../components/portal/PortalObjectiveAlert'
import { getNextActionCue, getPortalAdvanceButtonText } from '../utils/nextActionCue'
import { ScrollMoreCue } from '../components/ScrollMoreCue'
import { useGameScrollContainer } from '../navigation/GameScrollContext'
import { selectAtmosphereMarks, type AtmosphereMarkKind } from '../../domain/services/portal/atmosphereResolver'
import { ClubNotificationPrompt } from '../components/ClubNotificationPrompt'
import { selectPortalMemory } from '../../domain/services/portal/portalMemoryService'
import { pickEfterklang } from '../../domain/services/portal/pickEfterklang'
import { SceneSeam } from '../components/SceneSeam'

// Initialisera bag-of-cards en gång vid modulimport
initCardBag()

export function PortalScreen() {
  const { game, advance, simulateRemainingStep, markAnslagSeen, recordPortalShown, markLedgerPostTold } = useGameStore()
  const canAdvance = useCanAdvance()
  const navigate = useNavigate()
  const gameScrollRef = useGameScrollContainer()
  const [isAdvancing, setIsAdvancing] = useState(false)
  const [isSimulatingRemaining, setIsSimulatingRemaining] = useState(false)
  // DOM_POLISH_SMFINAL_SKARV_2026-09-10: SM-finalens gold-CTA navigerar inte
  // direkt — SceneSeam sveper CTA:ns fyllning till scenens accent först
  // (~260ms), sen navigerar onComplete. Wira bara smfinal nu (hållpunkten);
  // andra CTA:er kör handleAdvance rakt av som förut.
  const [seamActive, setSeamActive] = useState(false)
  const didAutoAdvance = useRef(false)

  // Auto-skip rounds where managed team has no fixture (e.g. cup R1 for bye-teams,
  // or cup rounds after elimination). The advance() auto-loop handles chaining,
  // so a single call processes all non-managed rounds in sequence.
  useEffect(() => {
    if (!game) return
    if (game.pendingScreen) return
    const scheduled = game.fixtures.filter(f => f.status === 'scheduled')
    if (scheduled.length === 0) return
    const nextMd = Math.min(...scheduled.map(f => f.matchday))
    const hasManagedAtNextMd = scheduled.some(
      f => f.matchday === nextMd &&
           (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    )
    if (!hasManagedAtNextMd) {
      if (didAutoAdvance.current) return
      didAutoAdvance.current = true
      void advance().catch(err => console.error('advance() failed:', err))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Run once on mount — advance() navigates away, re-mount after return handles any remaining rounds

  const seed = game ? makeSeed(game) : 0
  const layout = useMemo(
    () => (game ? buildPortal(game, seed) : null),
    [game, seed],
  )
  const portalMemory = useMemo(
    () => (game && layout?.secondary.some(card => card.id === 'memory_card') ? selectPortalMemory(game) : null),
    [game, layout],
  )
  const efterklangMemories = useMemo(
    () => (game && layout?.secondary.some(card => card.id === 'efterklang') ? pickEfterklang(game, 2) : []),
    [game, layout],
  )

  // Registrera visade kort för stale-bias-beräkning nästa omgång
  useEffect(() => {
    if (!layout) return
    const shownIds = [
      layout.primary.id,
      ...(layout.storySlot ? [layout.storySlot.id] : []),
      ...layout.secondary.map(c => c.id),
      ...layout.minimal.map(c => c.id),
    ]
    recordPortalShown(shownIds, layout.storySlot?.kind)
  }, [layout, recordPortalShown])

  useEffect(() => {
    if (!portalMemory) return
    markLedgerPostTold(portalMemory.post, 'portal')
  }, [portalMemory, markLedgerPostTold])

  useEffect(() => {
    for (const memory of efterklangMemories) {
      if (memory.sourcePost) markLedgerPostTold(memory.sourcePost, 'efterklang')
    }
  }, [efterklangMemories, markLedgerPostTold])

  // Sätt CSS-vars för seasonal tone
  useEffect(() => {
    if (!game) return
    const tone = getSeasonalTone(game.currentDate)
    document.documentElement.style.setProperty('--bg-portal', tone.bgPrimary)
    document.documentElement.style.setProperty('--bg-portal-surface', tone.bgSurface)
    document.documentElement.style.setProperty('--bg-portal-elevated', tone.bgElevated)
    document.documentElement.style.setProperty('--accent-portal', tone.accentTone)
    return () => {
      document.documentElement.style.removeProperty('--bg-portal')
      document.documentElement.style.removeProperty('--bg-portal-surface')
      document.documentElement.style.removeProperty('--bg-portal-elevated')
      document.documentElement.style.removeProperty('--accent-portal')
    }
  }, [game?.currentDate])

  const nextAnslag = game ? computeNextAnslag(game) : null
  const dismissAnslag = useCallback(() => {
    if (nextAnslag) markAnslagSeen(nextAnslag)
  }, [markAnslagSeen, nextAnslag])

  if (!game || !layout) return (
    <div style={{ padding: 20 }}>
      <div className="shimmer" style={{ height: 160, borderRadius: 3, marginBottom: 10 }} />
      <div className="shimmer" style={{ height: 80, borderRadius: 3, marginBottom: 10 }} />
      <div className="shimmer" style={{ height: 80, borderRadius: 3 }} />
    </div>
  )

  // ── CTA logic ────────────────────────────────────────────────────
  const hasScheduledFixtures = game.fixtures.some(f => f.status === 'scheduled')
  const canClickAdvance = canAdvance || hasScheduledFixtures
  const primaryIsSmFinal = layout.primary.id === 'next_match_smfinal'
  const advanceButtonText = getPortalAdvanceButtonText(game, primaryIsSmFinal)

  const handleAdvance = useCallback(() => {
    if (isAdvancing) return
    playSound('click')
    const scheduledFixtures = game.fixtures.filter(f => f.status === 'scheduled')
    if (scheduledFixtures.length === 0) {
      setIsAdvancing(true)
      requestAnimationFrame(() => {
        advance().catch(err => console.error('advance() failed:', err))
        setIsAdvancing(false)
      })
      return
    }
    const nextSimEff = Math.min(...scheduledFixtures.map(f => f.matchday))
    const managedMatchInNextRound = scheduledFixtures.find(
      f => f.matchday === nextSimEff && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId)
    )
    if (managedMatchInNextRound) { navigate('/game/match'); return }
    // Safety: never call advance() if an upcoming managed match has no lineup —
    // matchSimProcessor would silently skip it, leaving the fixture stuck as Scheduled.
    const hasPendingManagedWithoutLineup = !game.managedClubPendingLineup && scheduledFixtures.some(
      f => f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId
    )
    if (hasPendingManagedWithoutLineup) { navigate('/game/match'); return }
    setIsAdvancing(true)
    requestAnimationFrame(() => {
      advance().catch(err => console.error('advance() failed:', err))
      setIsAdvancing(false)
    })
  }, [isAdvancing, game, advance, navigate])

  const playedLeagueRounds = game.fixtures.filter(
    f => f.status === 'completed' &&
         (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId) &&
         !f.isCup
  ).length
  const nextManagedScheduled = game.fixtures
    .filter(f => f.status === 'scheduled' &&
                 (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => a.matchday - b.matchday || (b.isCup ? 1 : 0) - (a.isCup ? 1 : 0))[0]
  const canSimulateRemaining =
    hasScheduledFixtures &&
    playedLeagueRounds >= 12 &&
    !game.playoffBracket &&
    !nextManagedScheduled?.isCup &&
    game.pendingScreen !== PendingScreen.HalfTimeSummary

  // Mätt 2026-09-11 (Jacobs körorder, kod-audit-uppföljning): en verklig
  // 7-säsongers save vid 390px blockerade huvudtråden i sammanlagt ~8s över
  // 22 delmoment — det första ensamt ~3s — när alla 120 stegen kördes
  // synkront i en enda tight loop. `await` på en setTimeout(0) mellan varje
  // steg lämnar tillbaka tråden till webbläsaren (paint, indata) utan att
  // ändra loopens logik eller brytvillkor — samma resultat, bara inte som
  // en enda ohejdad synkron körning.
  const handleSimulateRemaining = async () => {
    if (!canSimulateRemaining || isSimulatingRemaining) return
    playSound('click')
    setIsSimulatingRemaining(true)
    try {
      const HALT_SCREENS: (PendingScreen | null | undefined)[] = [
        PendingScreen.HalfTimeSummary,
        PendingScreen.PlayoffIntro,
        PendingScreen.QFSummary,
      ]
      for (let step = 0; step < 120; step++) {
        const result = await simulateRemainingStep()
        if (!result) break
        if (result.seasonEnded) { navigate('/game/sim-summary'); return }
        if (result.playoffStarted) break
        const currentGame = result.game
        if (HALT_SCREENS.includes(currentGame?.pendingScreen)) break
        // Rot-diagnos (Jacobs körorder 2026-09-11, matchdag-26-fyndet): INGET
        // extra brytvillkor på "inga schemalagda matcher kvar" här. Regel-
        // säsongens sista omgång tömmer fixturlistan ETT steg INNAN
        // advanceToNextEvent()s säsongsslutsvakt (derivePreRoundContext.ts)
        // faktiskt körs — den vakten triggar FÖRST på NÄSTA anrop, och det
        // är DEN som sätter playoffStarted/pendingScreen (kvalar till
        // slutspel) eller seasonEnded (kvalar inte, eller slutspelet redan
        // helt klart). Ett brytvillkor här stängde loopen precis INNAN den
        // riktiga övergången hann köras — spelaren såg matchdag 26 med
        // pendingScreen fortsatt null, ingen skärmövergång, en tyst
        // "fastnad kö" som i praktiken var loopen som slutade ett steg för
        // tidigt. derivePreRoundContext.ts garanterar att NÄSTA anrop alltid
        // slutar i antingen playoffStarted eller seasonEnded när schemat är
        // tomt — de två villkoren ovan fångar redan båda, oavsett
        // slutspelsplats.
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    } finally {
      setIsSimulatingRemaining(false)
    }
  }

  const Primary = layout.primary.Component
  const StorySlotComponent = layout.storySlot?.Component ?? null

  const isSeason1Round1 = (game.seasonSummaries?.length ?? 0) === 0 && game.currentMatchday === 1
  const playoffCtx = getPlayoffSeriesContext(game)
  // Primary-valet är portalens kanoniska svar på vad veckan ÄR. Den frysta
  // finalfixturen kan sakna komplett playoff-context men ändå korrekt välja
  // next_match_smfinal; CTA-färg och seam måste då följa samma sanning som
  // kortet, inte en snävare sekundär härledning.
  const isSmFinal = primaryIsSmFinal || playoffCtx?.round === PlayoffRound.Final
  const escalationSubState = getEscalationSubState(game)
  // C-SD2: warm CTA på kvart/semi + upptakt-fönstret (ej final → gold)
  // !isSmFinal garanterar redan att en ev. playoffCtx inte är final
  const isCtaWarm = !isSmFinal && (playoffCtx != null || (escalationSubState !== null && escalationSubState !== 'mittfalt'))

  // DOM_POLISH_SMFINAL_SKARV_2026-09-10 §5: vid SM-final är destinationen
  // alltid /game/match (nästa schemalagda match är finalen) — samma
  // slutsats handleAdvance själv landar i via managedMatchInNextRound, men
  // seamen behöver navigeringen isolerad från handleAdvance-anropet så
  // klicket inte navigerar förrän svepet är klart.
  const handleCtaClick = useCallback(() => {
    if (isAdvancing || seamActive) return
    if (isSmFinal) {
      playSound('click')
      setSeamActive(true)
      return
    }
    handleAdvance()
  }, [isAdvancing, seamActive, isSmFinal, handleAdvance])

  const activeCount = getActiveDecisionCount(game)
  // Slinga 1: grinda avancera-CTA:n tills veckans beslut hanterats (anti-autopilot).
  // buildPortal garanterar att beslutskortet syns när detta är satt — ingen soft-lock.
  const weeklyDecisionPending = game.pendingWeeklyDecision != null

  // PORTAL-TAKREGEL (2026-08-09), REVIDERAD AUDIT DEL 2 (2026-08-09): marks
  // blir data före de blir JSX. Budgeten (ATMOSPHERE_CAP, default 2) gäller
  // atmosfärslagret — Situation, Beat, Anniversary, Upptakt, Spectator, och
  // (efter Jacobs ruling) PhaseMark, som bär redaktionell eyebrow/citat/
  // helper-text och därför ÄR atmosfär, inte kronologi. RoundMark (ren
  // kronologi, rundnamn/fas-badge) flyttades ur Portal till GameHeader.tsx:s
  // roundChipLabel — den räknades aldrig mot taket och gör det inte nu
  // heller, den finns bara inte i Portal längre. Handlingar (AnnandagsVal,
  // Callup, EventSlot, ObjectiveAlert utom i varningsläge) räknas inte mot
  // taket, se render nedan.
  const atmosphereSelection = selectAtmosphereMarks(game, escalationSubState)
  const ATMOSPHERE_COMPONENT: Record<AtmosphereMarkKind, React.ReactNode> = {
    anniversary: <PortalAnniversaryMark game={game} />,
    upptakt: <PortalUpptakt game={game} subState={escalationSubState} />,
    spectator: <PortalSpectatorMark game={game} />,
    beat: <PortalBeat game={game} />,
    phasemark: <PortalPhaseMark game={game} />,
    situation: <SituationCard game={game} />,
  }
  // Korta, mekaniska köetiketter (samma register som PortalQueueRail.tsx:s
  // egna SOURCE_META — "Orten", "Kommunen" — inte narrativ speltext).
  const ATMOSPHERE_QUEUE_LABEL: Record<AtmosphereMarkKind, { icon: string; label: string }> = {
    anniversary: { icon: '⬩', label: 'Historik' },
    upptakt: { icon: '◷', label: 'Upptakt' },
    spectator: { icon: '👁', label: 'Åskådarläge' },
    beat: { icon: '📍', label: 'Läget' },
    phasemark: { icon: '📅', label: 'Säsongsfas' },
    situation: { icon: '🧭', label: 'Orientering' },
  }
  const demotedAtmosphereChips = atmosphereSelection.demoted.map(kind => ATMOSPHERE_QUEUE_LABEL[kind])
  const objectiveAlertWarning = (game.boardObjectives ?? []).some(o => o.status === 'at_risk')

  // Rapportfråga 2 (Portal-fabriksrapporten): cardStaleTracking är en generisk
  // Record<string, StaleEntry> — marks registreras här med "mark_"-prefix,
  // samma mekanik som korten (recordPortalShown), egen ID-rymd så
  // kortrotationen inte störs.
  useEffect(() => {
    recordPortalShown(atmosphereSelection.shown.map(kind => `mark_${kind}`))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atmosphereSelection.shown.join(','), recordPortalShown])

  // Sticky-CTA:ns FAKTISKA höjd, mätt — inte gissad.
  // Rot till audit-fyndet "fast CTA krockar med innehåll längst ned" (2026-08-29):
  // kortstacken reserverade ett fast +72px medan den fixerade CTA-containern i
  // praktiken är clearance (48) + cue-rad + gap + btn-cta (~48) ≈ 117px, och
  // ytterligare ~60px när "Simulera resterande säsong" finns. Skillnaden är exakt
  // det överlapp spelaren såg med 7–9 köade beslut. Höjden varierar per tillstånd
  // (sim-knapp, cue-radens längd, textstorlek) så den kan inte vara en konstant —
  // den mäts med ResizeObserver och matas in i kortstackens paddingBottom.
  const ctaRef = useRef<HTMLDivElement | null>(null)
  const [ctaHeight, setCtaHeight] = useState(0)
  useEffect(() => {
    const el = ctaRef.current
    if (!el) return
    const measure = () => setCtaHeight(el.getBoundingClientRect().height)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [weeklyDecisionPending, seamActive])

  return (
    <>
      {nextAnslag && (
        <AnslagOverlay
          game={game}
          anslagKey={nextAnslag}
          onDismiss={dismissAnslag}
        />
      )}
      <div
        className="texture-wood card-stack"
        style={{
          background: 'var(--bg-portal)',
          padding: '14px',
          minHeight: '100%',
          // Reservera nav + safe-area + CTA-clearance + CTA-stackens uppmätta höjd
          // + 12px andrum. Ersätter det tidigare fasta +72px som var mindre än
          // CTA-stacken faktiskt tar (se ctaHeight-mätningen ovan).
          paddingBottom: `calc(var(--bottom-nav-height) + var(--safe-bottom) + var(--cta-nav-clearance) + ${Math.round(ctaHeight)}px + 12px)`,
        }}
      >
        {/* Finalhelg-portal: ceremoniellt header-band (final.jpg, fallback tills bilden droppas).
            Edge-to-edge via negativ marginal ut ur card-stackens 14px-padding. */}
        {isSmFinal && (
          <IllustrationScene mode="header" name="final" alt="SM-finalhelg" style={{ margin: '-14px -14px 14px' }} />
        )}
        {/* PORTAL-TAKREGEL: högst ATMOSPHERE_CAP (2) atmosfärsrader, i
            prioritetsordning (atmosphereSelection.shown). Resten går ned i
            PortalQueueRail som chips (demotedAtmosphereChips nedan). */}
        {atmosphereSelection.shown.map(kind => (
          <Fragment key={kind}>{ATMOSPHERE_COMPONENT[kind]}</Fragment>
        ))}
        {/* Undantag från "handlingar efter Primary": ObjectiveAlert när den
            faktiskt varnar (styrelsen på väg att fälla dig) — det är inte
            stämning, det är ett hot mot din anställning. */}
        {objectiveAlertWarning && <PortalObjectiveAlert game={game} />}
        {/* DOM_POLISH_PORTALHIERARKI_2026-09-10 §1/§5: T1, enda röst med den
            vikten. buildPortal garanterar redan exakt ett primary-kort
            (PortalLayout.primary: DashboardCard, aldrig 0/flera) — klassen
            är enforcement-markören handoffen efterfrågar, inte en ny
            visuell behandling (varje variant bär redan sin egen gradient/
            kopparbård-anatomi). */}
        <div className="portal-primary" data-coach-id="klacken-card">
          <Primary game={game} playoffCtx={playoffCtx} escalationSubState={escalationSubState} />
        </div>
        {/* Handlingar (spelaren ska GÖRA något) — efter Primary, inte före.
            Matchen är veckans fråga, allt annat är veckans övriga frågor.
            PhaseMark renderas nu ovan (i ATMOSPHERE_COMPONENT-slingan, om
            den vann prioriteringen) — inte här som ett eget, alltid synligt
            block. RoundMark finns inte längre i Portal, se GameHeader.tsx. */}
        {/* Kassörens röst på den befintliga raden (Portal-orientering #1,
            Jacobs dom 2026-08-22): ingen ny hälsning, ingen ny slot, ingen
            ny dismissedHints-post — samma villkor och innehåll som förut,
            bara attribuerat till samma kassör som redan talar i ankomsten
            (ArrivalScene.tsx:72,143), kafferummet och hallprövningen. */}
        {isSeason1Round1 && activeCount > 0 && (
          <div className="portal-tutorial-frame">
            <strong>{game.board?.find(m => m.role === 'kassör')?.firstName ?? 'Kassören'} · Kassör</strong>
            "Lugnare första veckan. En fråga åt gången — resten ligger och väntar tills du hittat rytmen."
          </div>
        )}
        {game.pendingAnnandagsVal && (
          <AnnandagsValEvent game={game} />
        )}
        {game.pendingCallupModal && (
          <CallupModal game={game} />
        )}
        <PortalEventSlot game={game} />
        {/* DOM_POLISH_PORTALHIERARKI_2026-09-10 §1/§5: T2, andra rösten —
            aldrig CTA. storySlot är redan singular (PortalLayout.storySlot:
            DashboardCard | null), så "högst en" är strukturellt garanterad;
            klassen namnger tieret. */}
        {StorySlotComponent && (
          <div className="portal-story">
            <StorySlotComponent game={game} />
          </div>
        )}
        <PortalQueueRail game={game} demotedMarks={demotedAtmosphereChips} />
        <PortalSecondarySection cards={layout.secondary} game={game} />
        <PortalMinimalBar cards={layout.minimal} game={game} />
        <PortalInboxCounter game={game} />
        <ClubNotificationPrompt game={game} />
      </div>

      <ScrollMoreCue
        scrollRef={gameScrollRef}
        fadeColor="var(--bg-portal)"
        accentColor="var(--accent-portal)"
        style={{
          // Själva Visa mer-knappen är också en träffyta. När den följer den
          // fixerade CTA-stacken behöver den 44 px till närmaste knapp; barens
          // befintliga flex-gap ger 6 px; 39 px till ger heltalssäkert minst
          // 44 px även när subpixelavrundning annars landar på 43,99.
          bottom: `calc(var(--bottom-nav-height) + var(--safe-bottom) + var(--cta-nav-clearance) + ${weeklyDecisionPending ? 0 : Math.round(ctaHeight) + 39}px)`,
        }}
      />

      {/* STICKY CTA — synlig ovanför BottomNav när inget veckobeslut pågår.
          Ett aktivt beslut äger ytan: en låst CTA gav ingen handling och täckte
          i mobilformat det nedersta svarsalternativet. När beslutet är löst
          återkommer CTA:n automatiskt.
          Tap-target-fyndet (geometrigrinden breddad till nav-bärande scener,
          2026-08-17): bara +8px — inte bara i "Simulera"-fallet (redan fixat
          separat), utan för HELA containern, i VARJE portal-tillstånd
          ("Redo — spela omgång N", "Fortsätt slutspel", "Säsong över").
          --cta-nav-clearance (48px) är samma token B-01/MatchLaddningScene
          redan etablerade för exakt den här bugklassen. */}
      {!weeklyDecisionPending && !seamActive && <div ref={ctaRef} data-fixed-bottom-bar style={{
        position: 'fixed',
        bottom: 'calc(var(--bottom-nav-height) + var(--safe-bottom) + var(--cta-nav-clearance))',
        left: 14,
        right: 14,
        zIndex: 'var(--z-header)',  // persistent botten-chrome (ej modal) — var 200 = oförändrat
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        {canSimulateRemaining && (
          // Tap-target-fyndet (mobil speltest-audit, 2026-08-17): bara 28px fri
          // kant till den ordinarie primär-CTA:n nedanför — värsta möjliga par,
          // en felträff simulerar bort resten av säsongen. marginBottom
          // oberoende av gap:6/cue-blockets varierande höjd, så avståndet
          // aldrig kan kollapsa under 44px oavsett cue-textens längd.
          <button
            onClick={handleSimulateRemaining}
            disabled={isSimulatingRemaining}
            className="btn btn-ghost"
            style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 24 }}
          >
            <Icon icon={FastForward} size={13} /> {isSimulatingRemaining ? '···' : 'Simulera resterande säsong'}
          </button>
        )}
        {/* Drag 3 (§11 punkt 6) — "Vad nu?"-affordansen. Bildtext på handlingen,
            aldrig en tooltip/overlay. Färg = allvar: warning i grind-läge, annars
            secondary. Kassörens röst — terse, ↳-prefix, pekar utan att peka. */}
        {(() => {
          const cue = getNextActionCue(game)
          const cueColor = cue.tone === 'warning' ? 'var(--warning)' : 'var(--text-secondary)'
          return (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '0 2px' }}>
              <span style={{ color: cueColor, fontSize: 12, lineHeight: 1.3, flexShrink: 0 }}>
                {cue.tone === 'warning' ? '⚠' : '↳'}
              </span>
              <span className="h-body-sm" style={{ color: cueColor, lineHeight: 1.35 }}>
                {cue.text}
              </span>
            </div>
          )
        })()}
        <button
          data-coach-id="cta-button"
          onClick={handleCtaClick}
          disabled={!canClickAdvance || isAdvancing || seamActive}
          className={`btn btn-primary btn-cta${canClickAdvance && !isAdvancing ? ' btn-pulse' : ''}${isSmFinal ? ' btn-gold' : isCtaWarm ? ' btn-warm' : ''}`}
        >
          {isAdvancing ? '···' : advanceButtonText}
        </button>
      </div>}

      {seamActive && (
        <SceneSeam
          tier="final"
          ctaLabel={advanceButtonText}
          onComplete={() => navigate('/game/match')}
        />
      )}
    </>
  )
}
