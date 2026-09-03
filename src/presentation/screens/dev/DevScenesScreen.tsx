/**
 * DevScenesScreen — dev-only gallery for visually verifying hard-to-reach surfaces.
 * Gated on import.meta.env.DEV — never shipped in production builds.
 *
 * Add a scene: extend SCENES, create fingered game via makeGame(), render below.
 */

import { useState, useEffect, useLayoutEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { SaveGame } from '../../../domain/entities/SaveGame'
import type { PlayoffSeries } from '../../../domain/entities/Playoff'
import type { Club, Tactic } from '../../../domain/entities/Club'
import type { TeamSelection } from '../../../domain/entities/Fixture'
import { FORMATIONS } from '../../../domain/entities/Formation'
import { PlayerPosition, CornerStrategy, TacticMentality, TacticTempo, TacticPress, TacticPassingRisk, TacticWidth, TacticAttackingFocus, PenaltyKillStyle, PlayoffRound, PlayoffStatus, InboxItemType } from '../../../domain/enums'
import { CupFinalVictoryScene } from '../scenes/CupFinalVictoryScene'
import { SMFinalVictoryScene } from '../scenes/SMFinalVictoryScene'
import { SeasonArcCard } from '../../components/squad/SeasonArcCard'
import { TabellSecondary } from '../../components/portal/secondary/TabellSecondary'
import { FormStatusMinimal } from '../../components/portal/minimal/FormStatusMinimal'
import { EfterklangSecondary } from '../../components/portal/secondary/EfterklangSecondary'
import { SquadScreen } from '../SquadScreen'
import { PortalScreen } from '../PortalScreen'
import { HalfTimeSummaryScreen } from '../HalfTimeSummaryScreen'
import { MatchScreen } from '../MatchScreen'
import { MatchLiveScreen } from '../match/MatchLiveScreen'
import { BottomNav } from '../../navigation/BottomNav'
import { TranareTab } from '../../components/club/TranareTab'
import { ClubScreen } from '../ClubScreen'
import { BoardMeetingScene } from '../scenes/BoardMeetingScene'
import { GranskaScreen } from '../granska/GranskaScreen'
import { TabellScreen } from '../TabellScreen'
import { SeasonSummaryScreen } from '../SeasonSummaryScreen'
import { SeasonTransitionScene } from '../scenes/SeasonTransitionScene'
import { BOARD_SEASON_ACKNOWLEDGMENT_PLACEHOLDER } from '../../../domain/services/boardService'
import { TransfersScreen } from '../TransfersScreen'
import { ArrivalScene } from '../ArrivalScene'
import { AnslagOverlay } from '../../components/anslag/AnslagOverlay'
import { PortalUpptakt } from '../../components/portal/PortalUpptakt'
import { NextMatchPrimary } from '../../components/portal/primary/NextMatchPrimary'
import { EkonomiTab } from '../../components/club/EkonomiTab'
import { PlayerCard } from '../../components/PlayerCard'
import { ScoreBlock as ScoreBlockComp } from '../../components/primitives/ScoreBlock'
import { Sparkline as SparklineComp } from '../../components/primitives/Sparkline'
import { MiljoHeader } from '../../components/environment/MiljoHeader'
import { MomentumBar } from '../../components/match/MomentumBar'
import { TacticChangeModal } from '../../components/match/TacticChangeModal'
import { SubstitutionModal } from '../../components/match/SubstitutionModal'
import { SentValCard } from '../../components/match/SentValCard'
import { TaktikScreen } from '../TaktikScreen'
import FacilityScreen from '../FacilityScreen'
import { GameOverScreen } from '../GameOverScreen'
import { HistoryScreen } from '../HistoryScreen'
import { EventOverlay } from '../../components/EventOverlay'
import { DecisionCard } from '../../components/DecisionCard'
import { PressConferenceScene } from '../../components/PressConferenceScene'
import { ClubSelectionScreen } from '../ClubSelectionScreen'
import { CallupModal } from '../../components/portal/CallupModal'
import { ChampionScreen } from '../ChampionScreen'
import { PlayoffIntroScreen } from '../PlayoffIntroScreen'
import { QFSummaryScreen } from '../QFSummaryScreen'
import { SeasonContractDemandsScreen } from '../SeasonContractDemandsScreen'
import { CareerBreakScreen } from '../CareerBreakScreen'
import { InboxScreen } from '../InboxScreen'
import { SimSummaryScreen } from '../SimSummaryScreen'
import HallProvningScreen from '../HallProvningScreen'
import { CoffeeRoomScene } from '../scenes/CoffeeRoomScene'
import { ValetScene } from '../scenes/ValetScene'
import { JournalistRelationshipScene } from '../scenes/JournalistRelationshipScene'
import { CupIntroScene } from '../scenes/CupIntroScene'
import { SundayTrainingScene } from '../scenes/SundayTrainingScene'
import { SeasonSignatureRevealScene } from '../scenes/SeasonSignatureRevealScene'
import { ScoutingTab } from '../../components/transfers/ScoutingTab'
import { IntroSequence } from '../IntroSequence'
import { TilltradeScreen } from '../TilltradeScreen'
import { NameInputScreen } from '../NameInputScreen'
import { KlubbparmOverlay } from '../../components/KlubbparmOverlay'
import { CeremonyRetirement } from '../../components/portal/CeremonyRetirement'
import { CornerInteraction } from '../../components/match/CornerInteraction'
import { PenaltyInteraction } from '../../components/match/PenaltyInteraction'
import { CounterInteraction } from '../../components/match/CounterInteraction'
import { FreeKickInteraction } from '../../components/match/FreeKickInteraction'
import { PhaseOverlay } from '../../components/match/PhaseOverlay'
import { CeremonySmFinal } from '../../components/match/CeremonySmFinal'
import { CeremonyCupFinal } from '../../components/match/CeremonyCupFinal'
import { BidModal } from '../../components/transfers/BidModal'
import { RenewContractModal } from '../../components/transfers/RenewContractModal'
import { BoardPatienceMinimal } from '../../components/portal/minimal/BoardPatienceMinimal'
import type { GameEvent } from '../../../domain/entities/GameEvent'
import type { MatchStep } from '../../../domain/services/matchSimulator'
import { useGameStore } from '../../store/gameStore'
import { getNextManagedFixture } from '../../../domain/services/portal/triggers/matchTriggers'
import { generateDetailedAnalysis } from '../../../domain/services/opponentAnalysisService'
import { makeBaseGame, atRound, withInjuries, withSuspended, withLowMorale, withExpiringContracts, withLongestSurnames, withLineupSlots, withoutPendingLineup, withActiveBeat, withAnniversary, withObjectiveAlertWarning, withPendingWeeklyDecision, withTransferWindowClosed, withTransferWindowOpen, withIncomingBids, withActiveIncomingBidEvent } from './gameStateFactory'
import { CUP_FINAL_VENUE, SM_FINAL_VENUE } from '../../../domain/data/specialDateStrings'
import { generatePlayoffBracket } from '../../../domain/services/playoffService'
import { generateDinnerEvent } from '../../../domain/services/mecenatDinnerService'

type SceneId = 'cup-victory' | 'sm-victory' | 'season-arc' | 'portal-cards' | 'efterklang' | 'squad' | 'portal' | 'tranare' | 'board-a' | 'board-b' | 'board-c' | 'stillness' | 'granska' | 'upptakt' | 'ekonomi' | 'playercard' | 'season-a' | 'season-b' | 'season-c' | 'miljoheader-karlsborg' | 'miljoheader-rogle'
  | 'tabell' | 'season-header' | 'finalhelg' | 'annandagen' | 'arrival' | 'squad-trupp'
  // AUDIT DEL 2 (2026-08-09), Etapp B-baseline: tre riktiga SeasonSummaryScreen-
  // utfall (mästare byggs redan av 'season-header') — bevisar kapitelindelningen
  // (B2) håller när sektioner saknas (inget slutspel / styrelsen besviken).
  | 'season-noplayoffs' | 'season-fired'
  // AUDIT DEL 2 (2026-08-09), Etapp B-baseline: Transfers, fyra fönstertillstånd
  // — bevisar att budkortet (B1, byggs efter denna baseline) inte försvinner
  // när fönstret växlar eller antal bud ändras.
  | 'transfers-closed' | 'transfers-open-nobids' | 'transfers-onebid' | 'transfers-multibids'
  // AUDIT DEL 3 (2026-08-10): Granska matchtypsmatrisen — förberedelse för
  // Design-uppdraget (DESIGN_UPPDRAG_GRANSKA_DEL4_2026-08-10.md steg A).
  // 'granska' (befintlig) täcker liga.
  | 'granska-cup' | 'granska-cup-final' | 'granska-slutspel' | 'granska-sm-final' | 'granska-avsked'
  | 'momentumbar' | 'tacticmodal' | 'submodal' | 'spakb'
  // VISUELL_AUDIT punkt 1 (2026-08-09): spelläges-fabriken (gameStateFactory.ts)
  | 'trupp-blandat' | 'trupp-kris' | 'lineup-empty' | 'lineup-filled'
  // PORTAL-TAKREGEL (2026-08-09): fyra baseline-tillstånd, §5 i ordern
  | 'portal-tom' | 'portal-normal' | 'portal-full' | 'portal-grind' | 'portal-facility-completed'
  // AUDIT DEL 2 (2026-08-11): kontrollfall, Berg-budets dubbelrendering (dc3d771f)
  | 'portal-bid-single' | 'portal-bid-multi'
  // AUDIT DEL 3 (2026-08-11): baseline före ombyggnad, Club 'Klubben i korthet'
  | 'club-fresh' | 'club-established'
  // AUDIT DEL 4 (2026-08-12): TacticBoardCard/tacticRows-enande — behöver en
  // riktig opponentAnalysis för att kunna verifiera FÖRESLÅS-badgen alls.
  | 'taktik'
  // AUDIT DEL 4 (2026-08-12) — baseline-täckning: dessa ytor saknade tidigare
  // varje dev-scen och var därför osynade av hela svepet, oavsett vad som
  // ändrades i dem (se GEMENSAM BESLUTSMODELL-commiten, d934aa1e).
  | 'event-overlay' | 'press-conference'
  // AUDIT DEL 4 (2026-08-12) — Primary-rangordningen (initCardBag.ts) prövad
  // i konkurrens, inte bara en i taget.
  | 'primary-smfinal-vs-deadline' | 'primary-event-vs-farewell'
  // Mobil speltest-audit (2026-08-17) — tap-target-grinden: enda scenen som
  // renderar en äkta BottomNav bredvid produktkomponenten (se render-blocket
  // för rotorsak). Detta ÄR SÄTT LAGET-fyndet (MatchLaddningBand, streak≥3).
  | 'navgate-laddning-band'
  // Skutskär-auditen, test 21 (2026-08-23): MatchLiveScreen hade NOLL
  // dev-scene-täckning ("Skydd eller illusion?", SLUTTEST_KO.md rad 112) —
  // spelets mest komplexa skärm, onåbar för tapTargetGate.visual.ts. Skiljer
  // sig från alla andra scener ovan: MatchLiveScreen läser sin data via
  // react-router `location.state`, inte via useGameStore/props. Ett första
  // försök körde den i en nästlad <MemoryRouter> — React tillåter inte ett
  // Router inuti ett annat ("You cannot render a <Router> inside another
  // <Router>"), kraschade hela DevScenesScreen (fångat av browser-
  // verifieringen, inte av tsc/vitest). Fixat: samma yttre router,
  // location.state satt via navigate(samma path, {state, replace:true}) i
  // en useEffect (se render-blocket) — inget nästlat Router-träd.
  | 'match-live'
  // 5.1 Sommaren (SLUTTEST_KO.md, 2026-08-18) — CODE_INSTRUKTION_SOMMAREN_
  // 2026-08-17.md:s fyra baseline-scener, via fabriken (samma mönster som
  // season-a/b/c, inte en egen scen per override).
  | 'sommaren-s2' | 'sommaren-titelforsvarare' | 'sommaren-tomt' | 'sommaren-siffra'
  // V1-uppföljning (RELÄ-Code-DS-konformans-svep1-3.md, 2026-08-20): HalfTimeSummaryScreen
  // saknades helt ur galleriet — se motivering vid SCENES-raden nedan.
  | 'halftime-summary'
  // Människoupplevelse-auditen (7024f8a, 2026-08-24), H1: Bygget/FacilityScreen
  // hade NOLL dev-scene-täckning — inte bara utanför tests/visual/sceneRegistry.ts,
  // aldrig ens importerad här. Samma lucka-klass som "Skydd eller illusion?"
  // (SLUTTEST_KO.md rad 112-117): en yta ingen grind sveper är en yta där nästa
  // fel är osynligt — H1:s nav-overlap (avvecklingsknappen) och den tidigare
  // Annika-finansieringsbuggen var båda symptom av EXAKT den luckan.
  // 'bygget' = trädet stängt (allmän occlusion/raw-token/screenshot-täckning).
  // 'bygget-avveckling' = SJÄLVSTÄNDIG scen med en RIKTIG BottomNav monterad
  // (samma mönster som 'navgate-laddning-band'/SÄTT LAGET) — regressionstestet
  // öppnar sheeten med RIKTIGA klick (Bygg ut → nod), inte via SCENES clickText,
  // eftersom nodklick kräver välj-läge först (två steg, inte ett).
  | 'bygget' | 'bygget-avveckling'
  // Jacobs order (2026-08-24): lyft ur H1-meta-grindens ratchet-skuld, inte
  // kvar som TODO — avskedsvägen är den enda ytan där en spelares hela
  // karriär tar slut, och var helt otäckt (GameOverScreen/HistoryScreen
  // (via /game/game-over/historik) aldrig importerade i detta galleri).
  // 'game-over-historik' läser HistoryScreens `snapshot`-prop direkt (samma
  // data GameOverScreen.tsx:s handleViewHistory() annars skickar via
  // location.state) — ingen MemoryRouter-omväg som match-live behövde.
  | 'game-over' | 'game-over-historik'
  // Mobilhierarki-regressioner (2026-08-31): riktiga, deterministiska lägen
  // för månadskön och DecisionCards tre visuella vikter.
  | 'portal-month-decisions' | 'decision-modes' | 'event-overlay-breakpoint'
  // DOM_SPONSOR_MOTBUD_2026-08-31.md: verifiering av motbudsflödet (egen
  // scen, rör inte portal-month-decisions befintliga baseline).
  | 'sponsor-motbud'
  // Dev-scen-integritet 2026-09-01: tre tidigare byggda men helt osynliga
  // produktlägen, nu med deterministisk data och permanent grindsvep.
  | 'club-selection' | 'season-share' | 'callup-modal'
  // Route-ratchet 2026-09-01: tre slutspelsrutter som tidigare bara gick att
  // nå genom en hel säsong, nu byggda på samma deterministiska slutspelsresa.
  | 'playoff-intro' | 'qf-summary' | 'champion'
  // Route-ratchet 2026-09-02: de fem sista /game-rutterna. Alla använder
  // riktiga produktskärmar och deterministisk state, inte ytkopior.
  | 'contract-demands' | 'career-break' | 'inbox' | 'sim-summary' | 'hall-provning'
  | 'coffee-room' | 'valet' | 'journalist-relationship' | 'cup-intro' | 'sunday-training' | 'season-signature-reveal'
  | 'scouting' | 'intro-sequence' | 'tilltrade' | 'name-input' | 'klubbparm' | 'ceremony-retirement'
  | 'granska-level3' | 'board-patience-minimal' | 'next-match-derby' | 'next-match-annandagen' | 'mecenat-dinner'
  | 'corner-interaction' | 'penalty-interaction' | 'counter-interaction' | 'free-kick-interaction'
  | 'phase-overlay' | 'bid-modal' | 'renew-contract-modal' | 'ceremony-sm-final' | 'ceremony-cup-final'
  | 'manager-fired-redirect'

const SCENES: { id: SceneId; label: string }[] = [
  { id: 'cup-victory',  label: 'Cup Victory' },
  { id: 'sm-victory',   label: 'SM-Final Victory' },
  { id: 'season-arc',   label: 'SeasonArcCard (toppa, omg 16)' },
  { id: 'portal-cards', label: 'Portal Cards (mörk yta)' },
  { id: 'efterklang',   label: 'Efterklang (journalist-tråd)' },
  { id: 'squad',        label: 'SquadScreen (trupp)' },
  { id: 'portal',       label: 'PortalScreen (dashboard)' },
  { id: 'tranare',      label: 'TranareTab (manager-karaktär)' },
  { id: 'board-a',      label: 'BoardMeeting A (första)' },
  { id: 'board-b',      label: 'BoardMeeting B (bra)' },
  { id: 'board-c',      label: 'BoardMeeting C (dålig)' },
  { id: 'stillness',    label: 'NU-stiltje (lugn vecka)' },
  { id: 'granska',      label: 'Granska (IA: 3 grupper) — liga' },
  { id: 'granska-cup',       label: 'Granska — cup, vanlig runda' },
  { id: 'granska-cup-final', label: 'Granska — cup, finalhelgen (neutral plan)' },
  { id: 'granska-slutspel',  label: 'Granska — slutspel' },
  { id: 'granska-sm-final',  label: 'Granska — SM-final (slutspel + skede:final)' },
  { id: 'granska-avsked',    label: 'Granska — avskedsmatch' },
  { id: 'upptakt',      label: 'Upptakt (C-SD2 sub-states)' },
  { id: 'ekonomi',      label: 'Ekonomi (Våg 4: kassa-trend)' },
  { id: 'playercard',   label: 'PlayerCard (Våg 4: rating-block)' },
  { id: 'season-a',     label: 'SeasonSummary A (mästare → gold)' },
  { id: 'season-b',     label: 'SeasonSummary B (topp 3 → win)' },
  { id: 'season-c',     label: 'SeasonSummary C (mittfält → subtle)' },
  { id: 'miljoheader-karlsborg', label: 'MiljöHeader — Karlsborg (arctic_coast, mörkast)' },
  { id: 'miljoheader-rogle', label: 'MiljöHeader — Rögle (scanian_coast, mildast)' },
  { id: 'tabell',        label: 'Tabell (DB-8 header + managed-rad)' },
  { id: 'season-header', label: 'SeasonSummary header (DB-3 + R2 hero-titel) — mästare' },
  { id: 'season-noplayoffs', label: 'SeasonSummary — mittfält, inget slutspel' },
  { id: 'season-fired',  label: 'SeasonSummary — styrelsen besviken, sparkad' },
  { id: 'transfers-closed',      label: 'Transfers — fönster stängt' },
  { id: 'transfers-open-nobids', label: 'Transfers — fönster öppet, inga bud' },
  { id: 'transfers-onebid',      label: 'Transfers — ett inkommande bud' },
  { id: 'transfers-multibids',   label: 'Transfers — flera inkommande bud' },
  { id: 'finalhelg',     label: 'Finalhelg-portal (IllustrationScene header)' },
  { id: 'annandagen',    label: 'Annandagen-anslag (IllustrationScene band)' },
  { id: 'arrival',       label: 'ArrivalScene (IllustrationScene fullbleed)' },
  { id: 'squad-trupp',   label: 'SquadScreen — TRUPP-flik' },
  { id: 'momentumbar',   label: 'MomentumBar (ärlig — kvitterings-läge)' },
  { id: 'tacticmodal',   label: 'TacticChangeModal (🟥 mörk panel)' },
  { id: 'submodal',      label: 'SubstitutionModal (🟥 mörk panel)' },
  { id: 'spakb',         label: 'Spak B — sent matchningsval (feed-kort)' },
  { id: 'trupp-blandat', label: 'Trupp/Nu — blandat (1 skada + 1 utgående kontrakt)' },
  { id: 'trupp-kris',    label: 'Trupp/Nu — kris (alla fyra kategorier)' },
  { id: 'lineup-empty',  label: 'Uppställningen — 3 tomma slots' },
  { id: 'lineup-filled', label: 'Uppställningen — fylld, längsta efternamn' },
  { id: 'portal-tom',    label: 'Portal — tom omgång' },
  { id: 'portal-normal', label: 'Portal — normal (1 atmosfärsrad)' },
  { id: 'portal-full',   label: 'Portal — full (beat+eko+upptakt)' },
  { id: 'portal-grind',  label: 'Portal — grind-läge (veckobeslut olöst)' },
  { id: 'portal-facility-completed', label: 'Portal — Bygget klart (navigerbart beat)' },
  { id: 'portal-bid-single', label: 'Portal — 1 bud, det är det aktiva HÄNDELSE-kortet' },
  { id: 'portal-bid-multi',  label: 'Portal — 3 bud, ett är det aktiva HÄNDELSE-kortet' },
  { id: 'club-fresh',       label: 'Club — säsong 1, inga öppna minnen' },
  { id: 'club-established', label: 'Club — etablerad epok, flera öppna minnen' },
  { id: 'taktik',           label: 'Taktiktavlan — alla 8 dimensioner + FÖRESLÅS' },
  { id: 'event-overlay',    label: 'EventOverlay — kritiskt event, fullskärms-modal' },
  { id: 'press-conference', label: 'PressConferenceScene — bespok scen' },
  { id: 'primary-smfinal-vs-deadline', label: 'Primary — SM-final(100) mot deadline(90)' },
  { id: 'primary-event-vs-farewell',   label: 'Primary — overlay-event lämnar plats åt avsked' },
  { id: 'sommaren-s2',              label: 'Sommaren — säsong 2, utvilad, tre händelser, slutspel rimligt' },
  { id: 'sommaren-titelforsvarare', label: 'Sommaren — säsong 6, titelförsvarare, nära gränsen' },
  { id: 'sommaren-tomt',            label: 'Sommaren — säsong 4, efter tapp, tomt-fallet, slutspel ej rimligt' },
  { id: 'sommaren-siffra',          label: 'Sommaren — säsong 11 (siffervariant), något sliten, en händelse' },
  // V1-uppföljning (RELÄ-Code-DS-konformans-svep1-3.md, 2026-08-20): HalfTimeSummaryScreen
  // fanns aldrig i dev-scenes-galleriet — inte bara utanför sceneRegistry.ts:s SCENES,
  // utan aldrig fotograferad alls. En yta ingen grind sveper är en yta där nästa fel
  // är osynligt (Jacobs formulering) — gäller generellt, inte bara en-primary-gate.
  { id: 'halftime-summary', label: 'HalfTimeSummaryScreen (halvtidssammanfattning)' },
  { id: 'bygget',            label: 'Bygget — trädet (Värmestuga byggd, mecenat Annika aktiv)' },
  { id: 'bygget-avveckling', label: 'Bygget — riktig nav, H1-regressionstest (avveckling/finansiering)' },
  { id: 'game-over',          label: 'GameOverScreen — sparkad efter tre säsonger utan förbättring' },
  { id: 'game-over-historik', label: 'HistoryScreen (snapshot-prop) — avslutad karriär, "Se karriären"' },
  { id: 'portal-month-decisions', label: 'Portal — tre månadsbeslut (1 primärt + 2 väntar)' },
  { id: 'decision-modes', label: 'DecisionCard — notis, dilemma, brytpunkt' },
  { id: 'event-overlay-breakpoint', label: 'EventOverlay — brytpunkt med accentkant' },
  { id: 'sponsor-motbud', label: 'Sponsor-motbud (DOM_SPONSOR_MOTBUD)' },
  { id: 'club-selection', label: 'Klubbval — LÄTT/MEDEL/SVÅR' },
  { id: 'season-share', label: 'SeasonSummary — SÄSONGENS MATCH + delning' },
  { id: 'callup-modal', label: 'Landslagsuttagning — två spelare' },
  { id: 'playoff-intro', label: 'Slutspel — grundserien avklarad' },
  { id: 'qf-summary', label: 'Slutspel — kvartsfinalerna avgjorda' },
  { id: 'champion', label: 'Slutspel — svenska mästare' },
  { id: 'contract-demands', label: 'Lönekrav — två spelare, ett mött' },
  { id: 'career-break', label: 'Karriäruppehåll — säsongen utan dig' },
  { id: 'inbox', label: 'Inkorg — svar, nyheter och rapporter' },
  { id: 'sim-summary', label: 'Simulering — tre matcher och tabellrörelse' },
  { id: 'hall-provning', label: 'Hallprövning — förankring och stöd' },
  { id: 'coffee-room', label: 'Kafferummet — vardagsutbyte' },
  { id: 'valet', label: 'Valet — säsongens anläggningsbeslut' },
  { id: 'journalist-relationship', label: 'Journalistrelation — minnen och utsikt' },
  { id: 'cup-intro', label: 'Cupintro — innan serien' },
  { id: 'sunday-training', label: 'Söndagsträning — sex spelare på isen' },
  { id: 'season-signature-reveal', label: 'Säsongssignatur — kall vinter' },
  { id: 'scouting', label: 'Scouting — talangspaning och spelare' },
  { id: 'intro-sequence', label: 'Intro — kallstart och karriär-CTA' },
  { id: 'tilltrade', label: 'Tillträdet — första onboardingsteget' },
  { id: 'name-input', label: 'Nytt spel — tränarnamn' },
  { id: 'klubbparm', label: 'Klubbpärmen — första kapitlet' },
  { id: 'ceremony-retirement', label: 'Avskedsceremoni — klubbikon slutar' },
  { id: 'mecenat-dinner', label: 'Mecenatmiddag — tre frågor och verklig resolution' },
  { id: 'granska-level3', label: 'Granska — löst val med belagt citat' },
  { id: 'board-patience-minimal', label: 'Portal minimal — styrelsens ultimatum' },
  { id: 'next-match-derby', label: 'Nästa match — derby i portal' },
  { id: 'next-match-annandagen', label: 'Nästa match — annandagen i portal' },
  { id: 'corner-interaction', label: 'Matchinteraktion — hörna' },
  { id: 'penalty-interaction', label: 'Matchinteraktion — straff' },
  { id: 'counter-interaction', label: 'Matchinteraktion — kontring' },
  { id: 'free-kick-interaction', label: 'Matchinteraktion — frislag' },
  { id: 'phase-overlay', label: 'Matchfas — förlängning' },
  { id: 'bid-modal', label: 'Övergång — lägg bud' },
  { id: 'renew-contract-modal', label: 'Kontrakt — förläng' },
  { id: 'ceremony-sm-final', label: 'Ceremoni — SM-final' },
  { id: 'ceremony-cup-final', label: 'Ceremoni — cupfinal' },
  { id: 'manager-fired-redirect', label: 'Route — sparkad redirect' },
]

// ── Fingered data ────────────────────────────────────────────────────────────

const HOME_ID = 'dev-managed'
const AWAY_ID = 'dev-opponent'

const devClubs = [
  {
    id: HOME_ID, name: 'Edsbyn BK', shortName: 'EBK', region: 'Hälsingland',
    reputation: 72, finances: 80000, wageBudget: 25000, transferBudget: 15000,
    youthQuality: 65, youthRecruitment: 60, youthDevelopment: 62, facilities: 68,
    boardExpectation: 'playoff', fanExpectation: 'playoff',
    preferredStyle: 'balanced', hasArtificialIce: false,
    arenaCapacity: 500, arenaName: 'Edsbyns IP',
    activeTactic: { formation: '2-2-5', mentality: 'balanced', tempo: 'normal', press: 'medium', passingRisk: 'safe', width: 'normal', attackingFocus: 'balanced', cornerStrategy: 'near_post', penaltyKillStyle: 'box' },
    squadPlayerIds: ['p1', 'p2', 'p3'],
  },
  {
    id: AWAY_ID, name: 'Bollnäs GoIF', shortName: 'BGF', region: 'Hälsingland',
    reputation: 65, finances: 60000, wageBudget: 20000, transferBudget: 10000,
    youthQuality: 55, youthRecruitment: 52, youthDevelopment: 55, facilities: 58,
    boardExpectation: 'midtable', fanExpectation: 'midtable',
    preferredStyle: 'defensive', hasArtificialIce: false,
    arenaCapacity: 420, arenaName: 'Sävstaås IP',
    activeTactic: { formation: '2-3-4', mentality: 'defensive', tempo: 'slow', press: 'low', passingRisk: 'safe', width: 'narrow', attackingFocus: 'balanced', cornerStrategy: 'far_post', penaltyKillStyle: 'diamond' },
    squadPlayerIds: [],
  },
]

function makePlayer(id: string, first: string, last: string, age: number, pos: PlayerPosition, ca: number, extra: Record<string, unknown> = {}) {
  return {
    id, firstName: first, lastName: last, age, clubId: HOME_ID, position: pos,
    fitness: 75 + Math.floor(ca / 10), sharpness: 60 + Math.floor(ca / 8), seasonForm: 68, form: 70,
    currentAbility: ca, potentialAbility: Math.min(100, ca + 5), morale: 68,
    attributes: { finishing: 60, dribbling: 58, passing: 62, defending: 60, stamina: 65, positioning: 62, goalkeeping: pos === PlayerPosition.Goalkeeper ? 78 : 5, corners: 55, penaltyShooting: 50, longShots: 50 },
    isInjured: false, suspensionGamesRemaining: 0, contractEnd: 9, wage: ca * 25, salary: ca * 100, value: ca * 300, goals: 0, assists: 0, gamesPlayed: 14,
    seasonStats: { goals: 0, assists: 0, gamesPlayed: 14, averageRating: 6.5 },
    // 2026-08-17: fältnamnen matchade INTE PlayerCareerStats (totalGames/
    // totalGoals/totalAssists/seasonsPlayed) — ett kvarblivet skal från en
    // äldre typform. Osynligt tills KapitelPunkts avsked-variant faktiskt
    // läste careerStats.totalGames/totalGoals och fick undefined (samma
    // mönster som managerName-gapet i makeGame(), fångat i tranare-scenen).
    careerStats: { totalGames: 50, totalGoals: 0, totalAssists: 0, seasonsPlayed: 3 },
    seasonHistory: [
      { season: 6, goals: 4, assists: 3, games: 18, rating: 6.4, clubId: HOME_ID },
      { season: 7, goals: 5, assists: 4, games: 20, rating: 6.7, clubId: HOME_ID },
    ],
    ...extra,
  }
}

const devPlayers = [
  // GK
  makePlayer('p-gk1', 'Anders', 'Nilsson', 30, PlayerPosition.Goalkeeper, 78),
  makePlayer('p-gk2', 'Jonas', 'Berg', 24, PlayerPosition.Goalkeeper, 65),
  // DEF
  makePlayer('p-d1', 'Mattias', 'Holm', 27, PlayerPosition.Defender, 80, { sharpness: 82 }),
  makePlayer('p-d2', 'Sven', 'Eriksson', 32, PlayerPosition.Defender, 74),
  makePlayer('p-d3', 'Patrik', 'Björk', 22, PlayerPosition.Defender, 68, { contractEnd: 9, availability: 'contract_expiring' }),
  makePlayer('p-d4', 'Lars', 'Forsberg', 29, PlayerPosition.Defender, 72),
  // HALF
  makePlayer('p-h1', 'Erik', 'Johansson', 19, PlayerPosition.Half, 62, { potentialAbility: 84, promotedFromAcademy: true }),
  makePlayer('p-h2', 'Mikael', 'Strand', 26, PlayerPosition.Half, 75),
  makePlayer('p-h3', 'Thomas', 'Ågren', 33, PlayerPosition.Half, 71, { isInjured: true, injuryDaysRemaining: 14, injuryNarrative: 'Muskelskada, vänster lår. Räknar med 2 veckor.' }),
  makePlayer('p-h4', 'Viktor', 'Lund', 28, PlayerPosition.Half, 69),
  // FWD
  makePlayer('p-f1', 'Karl', 'Lindström', 34, PlayerPosition.Forward, 75, { seasonForm: 65, fitness: 72 }),
  makePlayer('p-f2', 'Daniel', 'Pettersson', 25, PlayerPosition.Forward, 77, { isCharacterPlayer: true }),
  makePlayer('p-f3', 'Marcus', 'Svensson', 21, PlayerPosition.Forward, 64),
  makePlayer('p-f4', 'Henrik', 'Magnusson', 30, PlayerPosition.Forward, 70),
  makePlayer('p-f5', 'Johan', 'Karlsson', 28, PlayerPosition.Forward, 73, { suspensionGamesRemaining: 1 }),
]

// Standing rows for 12-lag liga; managed = 3:a, opponent = 7:e
function makeStandings() {
  const rows = [
    { clubId: 'club-s1', position: 1, played: 14, wins: 12, draws: 1, losses: 1, goalsFor: 52, goalsAgainst: 22, goalDifference: 30, points: 25 },
    { clubId: 'club-s2', position: 2, played: 14, wins: 11, draws: 2, losses: 1, goalsFor: 48, goalsAgainst: 24, goalDifference: 24, points: 24 },
    { clubId: HOME_ID,   position: 3, played: 14, wins: 10, draws: 4, losses: 0, goalsFor: 44, goalsAgainst: 20, goalDifference: 24, points: 24 },
    { clubId: 'club-s4', position: 4, played: 14, wins: 9,  draws: 2, losses: 3, goalsFor: 38, goalsAgainst: 28, goalDifference: 10, points: 20 },
    { clubId: 'club-s5', position: 5, played: 14, wins: 8,  draws: 2, losses: 4, goalsFor: 35, goalsAgainst: 30, goalDifference: 5,  points: 18 },
    { clubId: 'club-s6', position: 6, played: 14, wins: 7,  draws: 3, losses: 4, goalsFor: 32, goalsAgainst: 31, goalDifference: 1,  points: 17 },
    { clubId: AWAY_ID,   position: 7, played: 14, wins: 6,  draws: 4, losses: 4, goalsFor: 28, goalsAgainst: 30, goalDifference: -2, points: 16 },
    { clubId: 'club-s8', position: 8, played: 14, wins: 6,  draws: 3, losses: 5, goalsFor: 27, goalsAgainst: 31, goalDifference: -4, points: 15 },
    { clubId: 'club-s9', position: 9, played: 14, wins: 5,  draws: 2, losses: 7, goalsFor: 24, goalsAgainst: 36, goalDifference: -12, points: 12 },
    { clubId: 'club-s10',position: 10, played: 14, wins: 4, draws: 2, losses: 8, goalsFor: 22, goalsAgainst: 40, goalDifference: -18, points: 10 },
    { clubId: 'club-s11',position: 11, played: 14, wins: 2, draws: 2, losses: 10, goalsFor: 18, goalsAgainst: 45, goalDifference: -27, points: 6 },
    { clubId: 'club-s12',position: 12, played: 14, wins: 1, draws: 1, losses: 12, goalsFor: 14, goalsAgainst: 52, goalDifference: -38, points: 3 },
  ]
  return rows
}

// Completed league fixtures (needed for hasLeagueStarted + getFormResults)
function makeLeagueFixtures() {
  return Array.from({ length: 14 }, (_, i) => ({
    id: `fx-lg-${i}`,
    leagueId: 'liga-dev', season: 8, roundNumber: i + 1, matchday: i + 1,
    homeClubId: i % 2 === 0 ? HOME_ID : AWAY_ID,
    awayClubId: i % 2 === 0 ? AWAY_ID : HOME_ID,
    homeScore: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1,
    awayScore: i % 3 === 0 ? 1 : i % 3 === 1 ? 2 : 3,
    status: 'completed' as const,
    events: [], isCup: false,
  }))
}

// Cup final fixture — triggers useCupFinalData
const cupFinalFixture = {
  id: 'fx-cup-final', leagueId: 'liga-dev', season: 8, roundNumber: 4, matchday: 38,
  homeClubId: HOME_ID, awayClubId: AWAY_ID,
  homeScore: 5, awayScore: 3,
  status: 'completed' as const,
  isCup: true, isKnockout: true,
  arenaName: 'Göransson Arena', attendance: 3412, events: [],
  report: { playerRatings: {}, shotsHome: 18, shotsAway: 10, onTargetHome: 9, onTargetAway: 4, savesHome: 4, savesAway: 9, cornersHome: 8, cornersAway: 4, penaltiesHome: 0, penaltiesAway: 0, possessionHome: 57, possessionAway: 43 },
}

// SM-final fixture — triggers useSMFinalData
const smFinalFixture = {
  ...cupFinalFixture,
  id: 'fx-sm-final', matchday: 40,
  isCup: false, isFinaldag: true, isNeutralVenue: true,
  arenaName: 'Studenternas IP', venueCity: 'Uppsala', attendance: 5840,
}

// 12 rounds of fitness history — båge: grundform 60→80, fitness sågtand, skärpa 50→78
const devFitnessHistory = Array.from({ length: 12 }, (_, i) => ({
  matchday: i + 1,
  avgSeasonForm: Math.round(60 + (i / 11) * 20),
  avgFitness: Math.round(55 + (Math.sin(i * 0.85 + 1) * 0.5 + 0.5) * 30),
  avgSharpness: Math.round(50 + (i / 11) * 28),
  avgMorale: 68,
  injuryCount: i % 4 === 0 ? 1 : 0,
}))

function makeGame(fixtureOverrides: object[], extra: Record<string, unknown> = {}): SaveGame {
  return {
    id: 'dev-game',
    managedClubId: HOME_ID,
    currentSeason: 8,
    currentMatchday: 16,
    currentDate: '2026-01-15',
    trainingHistory: [{ season: 8, roundNumber: 15, focus: { type: 'physical', intensity: 'normal' }, effects: {} }],
    clubs: devClubs,
    players: devPlayers,
    fixtures: fixtureOverrides,
    standings: makeStandings(),
    scoreSnapshots: {
      standingsPosition: [8, 7, 7, 5, 4, 3, 3],
      journalistRelation: [48, 50, 52, 54, 55, 56, 57],
      playerForm: [60, 62, 65, 63, 68, 70],
    },
    teamFitnessHistory: devFitnessHistory,
    managedClubPeriodisation: 'toppa',
    managedClubPeriodisationSince: 14,
    // Minimal required fields
    managerName: 'Jacob Stjärne',
    inbox: [], leagueId: 'liga-dev', managedClubName: 'Edsbyn BK',
    transferBids: [], scoutingReports: [],
    managerProfile: {
      id: 'mgr-dev', firstName: 'Jacob', lastName: 'Stjärne',
      age: 45, hometown: 'Uppsala',
      burnoutScore: 42, burnoutHistory: [28, 31, 35, 38, 40, 42],
      coachRivalries: [{ clubId: AWAY_ID, h2hWins: 3, h2hDraws: 2, h2hLosses: 4, personality: 'kall', intensity: 6 }],
      contractUntilSeason: 10, seasonsAtClub: 8, monthlySalary: 32,
      careerWins: 62, careerDraws: 24, careerLosses: 44,
      personalityType: 'ambitious', trait: 'ironman',
      familyStatus: 'partner',
    },
    aiCoaches: {
      [AWAY_ID]: { name: 'Per Andersson', persona: 'confident', yearsAtClub: 3, clubId: AWAY_ID },
    },
    ...extra,
  } as unknown as SaveGame
}

// Efterklang — fingered journalist (3 memories) + nemesis, så flödet visar två trådar
const efterklangGame = makeGame(makeLeagueFixtures(), {
  journalist: {
    name: 'Britta Sandström',
    persona: 'sceptical',
    relationship: 62,
    memory: [
      { season: 8, matchday: 4, event: 'good_answer', sentiment: 4, opponentShort: 'Karlsborg' },
      { season: 8, matchday: 7, event: 'bad_answer', sentiment: -5 },
      { season: 8, matchday: 9, event: 'big_win', sentiment: 6 },
    ],
  },
  nemesisTracker: {
    [AWAY_ID]: { playerId: 'np-1', name: 'Theo Dahlqvist', clubId: AWAY_ID, goalsAgainstUs: 3 },
  },
})

// economicScar — resolutions-medveten efterdyning. Varje variant har BARA en budgetkris
// (ingen journalist/nemesis) så economicScar är enda Efterklang-kandidaten och syns.
// currentMatchday=16, resolvedMatchday=13 → recency 3 (inom 10-fönstret).
const efterklangCrisisVariants: Array<{ label: string; game: SaveGame }> = [
  {
    label: 'Aktiv kris (decision-fas)',
    game: makeGame(makeLeagueFixtures(), {
      economicCrisisState: { startedSeason: 8, startedMatchday: 9, phase: 'decision', eventsFired: [] },
    }),
  },
  {
    label: 'Efterdyning · sold_star',
    game: makeGame(makeLeagueFixtures(), {
      economicCrisisState: { startedSeason: 8, startedMatchday: 9, phase: 'resolved', eventsFired: [], outcome: 'sold_star', resolvedMatchday: 13, soldToSurvivePlayerName: 'Viktor Ahlén' },
    }),
  },
  {
    label: 'Efterdyning · loan',
    game: makeGame(makeLeagueFixtures(), {
      economicCrisisState: { startedSeason: 8, startedMatchday: 9, phase: 'resolved', eventsFired: [], outcome: 'loan', resolvedMatchday: 13 },
    }),
  },
  {
    label: 'Efterdyning · mecenat',
    game: makeGame(makeLeagueFixtures(), {
      economicCrisisState: { startedSeason: 8, startedMatchday: 9, phase: 'resolved', eventsFired: [], outcome: 'mecenat', resolvedMatchday: 13 },
    }),
  },
  {
    label: 'Efterdyning · natural_recovery',
    game: makeGame(makeLeagueFixtures(), {
      economicCrisisState: { startedSeason: 8, startedMatchday: 9, phase: 'resolved', eventsFired: [], outcome: 'natural_recovery', resolvedMatchday: 13 },
    }),
  },
]

// ── Component ────────────────────────────────────────────────────────────────

// KF4 (2026-06-21): EN styrelsemodell — full BoardMember[] på game.board (find-by-role).
// Flyttad hit (var tidigare bara deklarerad vid board-a/b/c, rad ~1135) — arrival-scenen
// (DOMLOGG_2026-08-31.md §4) redirectar till dashboard utan game.board (ArrivalScene.tsx:204-207),
// så grinden fotograferade en tom omdirigering. squadGame behöver den nu också.
const board = [
  { id: 'ordforande-0', firstName: 'Margareta', lastName: 'Sahlin', age: 61, gender: 'f' as const, role: 'ordförande' as const, personality: 'traditionalist' as const },
  { id: 'kassor-0', firstName: 'Bengt', lastName: 'Ek', age: 58, gender: 'm' as const, role: 'kassör' as const, personality: 'ekonom' as const },
  { id: 'ledamot-0', firstName: 'Sture', lastName: 'Almqvist', age: 67, gender: 'm' as const, role: 'ledamot' as const, personality: 'supporter' as const },
]

const cupGame    = makeGame([...makeLeagueFixtures(), cupFinalFixture])
const smGame     = makeGame([...makeLeagueFixtures(), smFinalFixture])
const arcGame    = makeGame(makeLeagueFixtures())
const portalGame = makeGame(makeLeagueFixtures())
const squadGame  = makeGame(makeLeagueFixtures(), { captainPlayerId: 'p-d1', board })
const mecenatDinnerBaseGame = makeGame(makeLeagueFixtures(), {
  currentMatchday: 20,
  communityStanding: 50,
  mecenater: [{
    id: 'dev-mecenat-dinner', name: 'Karin Berg', gender: 'female', business: 'Berg AB',
    businessType: 'entrepreneur', wealth: 3, personality: 'tyst_kraft', influence: 60,
    happiness: 60, goodwill: 50, contribution: 60_000, totalContributed: 120_000,
    demands: [], socialExpectations: [], isActive: true, arrivedSeason: 7, silentShout: 0,
  }],
})
const mecenatDinnerEvent = generateDinnerEvent(mecenatDinnerBaseGame, 20)!
const mecenatDinnerGame = { ...mecenatDinnerBaseGame, pendingEvents: [mecenatDinnerEvent] }
const interactionPlayer = (squadGame.players.find(p => p.clubId === squadGame.managedClubId) ?? squadGame.players[0])!
const interactionCornerData = {
  cornerTakerId: interactionPlayer.id, cornerTakerName: `${interactionPlayer.firstName[0]}. ${interactionPlayer.lastName}`,
  rusherIds: squadGame.players.slice(1, 6).map(p => p.id), topRusherName: 'K. Lindström',
  opponentPenaltyKill: 'active' as const, isHome: true, supporterBoost: 3, minute: 78,
}
const interactionPenaltyData = {
  minute: 84, shooterName: 'Karl Lindström', shooterId: 'p-f1', shooterSkill: 76,
  keeperName: 'Jonas Berg', keeperSkill: 69,
}
const interactionCounterData = {
  minute: 67, runnerName: 'Daniel Pettersson', runnerId: 'p-f2', runnerSpeed: 78,
  supportName: 'Karl Lindström', supportId: 'p-f1', defendersBeat: 2,
}
const interactionFreeKickData = {
  minute: 72, kickerName: 'Mikael Strand', kickerId: 'p-h2', kickerShooting: 73,
  kickerPassing: 79, distanceMeters: 24, wallSize: 4,
}
const ceremonyHomeLineup = buildSimpleLineup(squadGame, HOME_ID)
const ceremonyAwayLineup = buildSimpleLineup(squadGame, AWAY_ID)
const journalistRelationshipArc = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search).get('relationshipArc')
  : null
const journalistRelationshipType = journalistRelationshipArc === 'feud'
  ? 'journalist_feud' as const
  : journalistRelationshipArc === 'redemption'
    ? 'journalist_redemption' as const
    : null
const journalistSceneGame = {
  ...efterklangGame,
  storylines: journalistRelationshipType ? [{
    id: `dev-${journalistRelationshipType}`,
    type: journalistRelationshipType,
    season: 7,
    matchday: 12,
    clubId: HOME_ID,
    description: 'dev-history',
    displayText: 'dev-history',
    resolved: true,
  }] : [],
  journalist: {
    ...efterklangGame.journalist!,
    outlet: 'Gefle Dagblad',
    style: 'neutral' as const,
    relationship: journalistRelationshipArc === 'feud'
      ? 18
      : journalistRelationshipArc === 'redemption'
        ? 80
        : efterklangGame.journalist!.relationship,
    pressRefusals: 1,
    memory: efterklangGame.journalist!.memory.map((m, i) => i === 2 ? { ...m, event: 'refused_press' } : m),
  },
}

// De fem sista route-fixturerna använder bara fält respektive produktvy
// faktiskt läser. Samma SaveGame-form som resten av galleriet, ingen egen
// presentationskopia av skärmen.
const contractDemandsGame = makeGame(makeLeagueFixtures(), {
  pendingContractDemands: [
    { playerId: 'p-d1', currentSalary: 8_000, minSalary: 10_500 },
    { playerId: 'p-f2', currentSalary: 7_700, minSalary: 9_800 },
  ],
})

const careerBreakGame = makeGame(makeLeagueFixtures(), {
  careerBreak: {
    firedAtSeason: 7,
    stage: 'season',
    renomme: 61,
    careerOver: false,
    report: {
      formerClubId: HOME_ID,
      formerClubName: 'Edsbyn BK',
      positionUnderPlayer: 9,
      bestPositionUnderReplacement: 5,
      replacementCoachName: 'Oskar Berglund',
      formerClubDidWorse: false,
      seasonsSimulated: 2,
      seasons: [
        { season: 8, formerClubPosition: 7, championClubId: AWAY_ID, championClubName: 'Bollnäs GoIF' },
        { season: 9, formerClubPosition: 5, championClubId: HOME_ID, championClubName: 'Edsbyn BK' },
      ],
      finalStandings: [{ clubId: HOME_ID, position: 5 }, { clubId: AWAY_ID, position: 11 }],
    },
    offers: [{
      clubId: AWAY_ID,
      clubName: 'Bollnäs GoIF',
      lastPosition: 11,
      boardExpectation: 'avoidBottom',
      reputation: 54,
      isFormerClub: false,
      departedCoachName: 'Per Andersson',
      pitch: 'En förening som behöver börja om, med tålamod för ett riktigt bygge.',
    }],
  },
})

const inboxGame = makeGame(makeLeagueFixtures(), {
  inbox: [
    { id: 'dev-inbox-license', date: '2026-01-15', type: InboxItemType.LicenseReview, title: 'Licensen kräver en plan', body: 'Styrelsen vill se en åtgärd före nästa kontroll.', isRead: false, createdMatchday: 16, createdRound: 14, licenseZoneLabel: 'Riskzon' },
    { id: 'dev-inbox-media', date: '2026-01-14', type: InboxItemType.Media, title: 'Vinterns formkurva väcker frågor', body: 'Gefle Dagblad summerar de senaste matcherna.', isRead: false, createdMatchday: 15, createdRound: 13, outlet: 'Gefle Dagblad' },
    { id: 'dev-inbox-scout', date: '2026-01-13', type: InboxItemType.ScoutReport, title: 'Scoutrapport klar', body: 'Tre spelare har följts under månaden.', isRead: true, createdMatchday: 14, createdRound: 12 },
  ],
})

const simSummaryFixtures = makeLeagueFixtures().slice(-3)
const simSummaryGame = makeGame(makeLeagueFixtures())
const simSummaryLocationState = {
  __devScene: 'sim-summary',
  simulatedFixtures: simSummaryFixtures,
  positionBefore: 5,
  positionAfter: 3,
  pointsBefore: 18,
  pointsAfter: 24,
}

const hallProvningGame = makeGame(makeLeagueFixtures(), {
  facilityState: {
    builtNodeIds: [],
    hallTrial: { stage: 'forankring', support: 56, startedSeason: 8, stageStartedRound: 14 },
  },
})
const valetGame = makeGame(makeLeagueFixtures(), { facilityState: { builtNodeIds: [] } })
const seasonSignatureGame = makeGame(makeLeagueFixtures(), {
  currentSeasonSignature: {
    id: 'cold_winter',
    modifiers: { threeBy30Probability: 0.30 },
    startedSeason: 8,
    observedFacts: ['tre matcher i sträng kyla'],
  },
})
// Lugn trupp (allEmpty) för NU-stiltje: inga skador/avstängningar/låg moral
const calmPlayers = devPlayers.map(p => ({ ...p, isInjured: false, injuryDaysRemaining: 0, suspensionGamesRemaining: 0, morale: 70 }))
const stillnessGame = makeGame(makeLeagueFixtures(), { players: calmPlayers, captainPlayerId: 'p-d1' })

// VISUELL_AUDIT punkt 1 (2026-08-09) — spelläges-fabriken (gameStateFactory.ts).
// atRound(18) ger en riktig, validerad mittsäsongsomgång (createNewGame + fejkad,
// invariant-kollad historik) att bygga Trupp/Nu- och Uppställnings-baselinen på.
// Matchday 18 (inte 14) avsiktligt valt: seed 2:s matchday 14 råkar vara
// Annandagen (isAnnandagen:true, 2026-12-26) — det tvingar fram MatchScreens
// "laddning"-beat/IllustrationScene istf lineup-steget direkt, upptäckt genom
// att faktiskt titta på skärmdumpen (inte bara läsa koden).
const factoryMidSeasonGame = atRound(makeBaseGame({ seed: 2 }), 18)

// Route-ratchet 2026-09-01: en sammanhängande, riktig slutspelsresa för tre
// skärmar som tidigare var helt onåbara i dev-galleriet. Vi utgår från den
// invariant-kontrollerade världen ovan, väljer serieledaren som managerklubb
// och härleder varje nästa par ur föregående ronds vinnare. Vi anropar INTE
// advancePlayoffRound här: det är en produktionsmutation som också kräver
// rensning av narrativköer. En dev-fixtur beskriver rena post-state-snapshots
// och ska inte bli en falsk tredje mutationsväg.
const playoffManagedClubId = [...factoryMidSeasonGame.standings]
  .sort((a, b) => a.position - b.position)[0]?.clubId ?? factoryMidSeasonGame.managedClubId
const playoffJourneyBaseGame = {
  ...factoryMidSeasonGame,
  managedClubId: playoffManagedClubId,
} as SaveGame
const playoffOpeningBracket = generatePlayoffBracket(
  playoffJourneyBaseGame.standings,
  playoffJourneyBaseGame.currentSeason,
)
const playoffIntroGame = {
  ...playoffJourneyBaseGame,
  playoffBracket: playoffOpeningBracket,
} as SaveGame

function decideSeriesForHomeClub(series: PlayoffSeries, homeWins = 3): PlayoffSeries {
  return {
    ...series,
    homeWins,
    awayWins: Math.max(0, homeWins - 1),
    winnerId: series.homeClubId,
    loserId: series.awayClubId,
  }
}

const decidedQuarterFinals = {
  ...playoffOpeningBracket,
  quarterFinals: playoffOpeningBracket.quarterFinals.map(series => decideSeriesForHomeClub(series)),
}
const quarterFinalWinners = decidedQuarterFinals.quarterFinals.map(series => series.winnerId!)
const semiFinals: PlayoffSeries[] = [
  {
    id: 'dev-playoff-sf-1', round: PlayoffRound.SemiFinal,
    homeClubId: quarterFinalWinners[0], awayClubId: quarterFinalWinners[3],
    fixtures: [], homeWins: 0, awayWins: 0, winnerId: null, loserId: null,
  },
  {
    id: 'dev-playoff-sf-2', round: PlayoffRound.SemiFinal,
    homeClubId: quarterFinalWinners[1], awayClubId: quarterFinalWinners[2],
    fixtures: [], homeWins: 0, awayWins: 0, winnerId: null, loserId: null,
  },
]
const qfSummaryBracket = {
  ...decidedQuarterFinals,
  status: PlayoffStatus.SemiFinals,
  semiFinals,
}
const qfSummaryGame = {
  ...playoffJourneyBaseGame,
  playoffBracket: qfSummaryBracket,
} as SaveGame

const decidedSemiFinals = semiFinals.map(series => decideSeriesForHomeClub(series))
const finalSeries = decideSeriesForHomeClub({
  id: 'dev-playoff-final', round: PlayoffRound.Final,
  homeClubId: decidedSemiFinals[0].winnerId!, awayClubId: decidedSemiFinals[1].winnerId!,
  fixtures: [], homeWins: 0, awayWins: 0, winnerId: null, loserId: null,
}, 1)
const championGame = {
  ...playoffJourneyBaseGame,
  playoffBracket: {
    ...qfSummaryBracket,
    status: PlayoffStatus.Completed,
    semiFinals: decidedSemiFinals,
    final: finalSeries,
    champion: finalSeries.winnerId,
  },
} as SaveGame

const truppBlandatGame = withExpiringContracts(withInjuries(factoryMidSeasonGame, 1), 1)
const truppKrisGame = withExpiringContracts(withLowMorale(withSuspended(withInjuries(factoryMidSeasonGame, 1), 1), 1), 1)
// "3 tomma slots": INTE withLineupSlots({emptyCount:3}) — setLineup-use caset
// (application/useCases/setLineup.ts) kräver exakt 11 startspelare för att
// spara alls, så managedClubPendingLineup kan strukturellt aldrig hålla en
// PARTIELL elva i riktigt spel. Den tomma-slots-vyn spelaren faktiskt ser är
// appens egen "nudge"-mekanik (lineupNudge.ts: PREFILL_COUNT=8, EMPTY_SLOTS=3,
// deterministiskt seedad på fixtureId) som kickar in just när
// managedClubPendingLineup SAKNAS. Upptäckt genom att ett withLineupSlots-
// försök gav "11 av 11 placerade" på skärmen trots emptyCount:3 — tacticState
// initieras bara från managedClub.activeTactic/nudgeData, aldrig från
// savedLineup.tactic.lineupSlots, så en påhittad partiell savedLineup
// klassas som inkonsekvent av useLineupEditor.ts:s eget skydd och fylls
// automatiskt. Lämna managedClubPendingLineup osatt — låt riktig nudge visa vägen.
//
// createNewGame sätter ALLTID managedClubPendingLineup till en komplett
// defaultLineup (upptäckt via samma skärmdump-verifiering) — withoutPendingLineup
// rensar den explicit så nudgeData faktiskt får chansen att beräknas.
const lineupEmptyGame = withoutPendingLineup(factoryMidSeasonGame)
const lineupFilledGame = withLineupSlots(withLongestSurnames(factoryMidSeasonGame), { emptyCount: 0, formation: '5-3-2' })

// Skutskär-auditen, test 21 (2026-08-23): MatchLiveScreen läser fixture/
// homeLineup/awayLineup via react-router location.state (MatchScreen.tsx:s
// navigate('/game/match/live', {state: {...}}) — enda skärmen i appen som
// gör det, alla andra läser useGameStore/props). buildSimpleLineup() speglar
// gameStateFactory.ts:s withLineupSlots() men för GODTYCKLIG klubb (inte bara
// managedClubId) så samma funktion kan bygga BÅDA lagens elva ur en riktig,
// validerad värld (factoryMidSeasonGame — samma bas som lineup-filled).
function buildSimpleLineup(game: SaveGame, clubId: string, formation: keyof typeof FORMATIONS = '5-3-2'): TeamSelection {
  const template = FORMATIONS[formation]
  const available = game.players.filter(p => p.clubId === clubId && !p.isInjured && p.suspensionGamesRemaining === 0)
  const startingPlayerIds: string[] = []
  for (const slot of template.slots) {
    const candidate = available.find(p => p.position === slot.position && !startingPlayerIds.includes(p.id))
      ?? available.find(p => !startingPlayerIds.includes(p.id))
    if (candidate) startingPlayerIds.push(candidate.id)
  }
  const benchPlayerIds = available.filter(p => !startingPlayerIds.includes(p.id)).slice(0, 5).map(p => p.id)
  const club = game.clubs.find(c => c.id === clubId)
  const tactic: Tactic = { ...(club?.activeTactic as Tactic), formation }
  return { startingPlayerIds, benchPlayerIds, captainPlayerId: startingPlayerIds[0], tactic }
}
const matchLiveGame = factoryMidSeasonGame
const matchLiveFixture = getNextManagedFixture(matchLiveGame)
const matchLiveHomeClub = matchLiveFixture ? matchLiveGame.clubs.find(c => c.id === matchLiveFixture.homeClubId) : undefined
const matchLiveAwayClub = matchLiveFixture ? matchLiveGame.clubs.find(c => c.id === matchLiveFixture.awayClubId) : undefined
const matchLiveLocationState = matchLiveFixture ? {
  fixture: { ...matchLiveFixture, attendance: matchLiveFixture.attendance ?? 320 },
  homeLineup: buildSimpleLineup(matchLiveGame, matchLiveFixture.homeClubId),
  awayLineup: buildSimpleLineup(matchLiveGame, matchLiveFixture.awayClubId),
  homeClubName: matchLiveHomeClub?.name ?? '',
  awayClubName: matchLiveAwayClub?.name ?? '',
  isManaged: true,
  matchMode: 'full' as const,
} : null
type MatchLiveLocationState = NonNullable<typeof matchLiveLocationState>

/**
 * MatchLiveScreen läser sin data via `useLocation().state`, inte via
 * useGameStore/props (ensam i hela appen om detta) — samma yttre router
 * som DevScenesScreen redan lever i (ett nästlat <MemoryRouter> kraschar,
 * se SceneId-kommentaren ovan). navigate(samma path, {state, replace:true})
 * lägger state på DEN AKTUELLA location-posten, så `?scene=match-live`
 * i adressfältet är orört — MatchLiveScreens `useLocation()` ser statet
 * så fort effekten kört en gång.
 */
function MatchLiveDevScene({ locationState }: { locationState: MatchLiveLocationState }) {
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    if (location.state) return
    navigate(location.pathname + location.search, { state: locationState, replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // A-C1-testet (halftimeDockBlock.visual.ts, 2026-08-27) blottade en race:
  // <MatchLiveScreen/> monterade INNAN location.state fanns (barnets effekter
  // körs före förälderns, se React-ordningen), så dess egen mount-effekt
  // (simulateMatchStepByStep-anropet, tomt dep-array — kör EXAKT en gång)
  // såg fixture=undefined på den enda gången den fick köra och avbröt
  // simuleringen permanent. Matchen såg ut att starta (fixture/lag-namn
  // kommer separat via location.state-läsning i render) men klockan/steps
  // rörde sig aldrig — omöjligt att skilja från A-C1:s egna hängningssymptom
  // utan att gräva. Montera aldrig skärmen innan statet faktiskt finns.
  if (!location.state) return null
  return <MatchLiveScreen />
}

function ManagerFiredRedirectDevScene() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate('/game/history', { replace: true })
  }, [navigate])
  return null
}

/** SimSummaryScreen är den andra produktskärmen som kräver route-state.
 * Markören gör scenbyte robust även om location.state från match-live ligger
 * kvar på samma /dev/scenes-historikpost. */
function SimSummaryDevScene() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { __devScene?: string } | null
  useEffect(() => {
    if (state?.__devScene === 'sim-summary') return
    navigate(location.pathname + location.search, { state: simSummaryLocationState, replace: true })
  }, [location.pathname, location.search, navigate, state?.__devScene])
  if (state?.__devScene !== 'sim-summary') return null
  return <SimSummaryScreen />
}

// Mobil speltest-audit (2026-08-17), tap-target-grinden: forcerar de N senaste
// spelade matcherna till vinster så computeLaddningBeat (matchLaddningGrind.ts)
// väljer tier:'band' (kräver streak ≥3) istf tier:'scene'. Ingen egen fixture-
// generering — återanvänder factoryMidSeasonGames redan validerade historik,
// skriver bara om resultatet på de sista matcherna för den styrda klubben.
//
// ROTORSAK (audit-taptargetgate-failande, MASTER_OPPET.md 2026-08-31): denna
// funktion skrev BARA om game.fixtures — men getStreakState() (roundCharacter.ts)
// läser inte fixtures, den läser game.trainerArc.consecutiveWins/consecutiveLosses,
// ett separat räknat fält som trainerArcService.ts underhåller under riktig
// omgångsprocessering. factoryMidSeasonGames trainerArc bar vad den ärvde ur sin
// egen simulering — nästan aldrig exakt streakLength — så computeLaddningBeat
// föll alltid till tier:'none', "SÄTT LAGET"-knappen renderades aldrig, och
// testet floppade på ett timeout, inte en overlap. Två läsare (fixtures vs
// trainerArc), en sanning (trainerArc) — funktionen skrev bara till den ena.
function withWinStreak(game: SaveGame, streakLength: number): SaveGame {
  const managedId = game.managedClubId
  const targetIds = new Set(
    game.fixtures
      .filter(f => f.status === 'completed' && (f.homeClubId === managedId || f.awayClubId === managedId))
      .sort((a, b) => b.matchday - a.matchday)
      .slice(0, streakLength)
      .map(f => f.id)
  )
  const fixtures = game.fixtures.map(f => {
    if (!targetIds.has(f.id)) return f
    const managedIsHome = f.homeClubId === managedId
    return { ...f, homeScore: managedIsHome ? 4 : 1, awayScore: managedIsHome ? 1 : 4 }
  })
  const trainerArc: SaveGame['trainerArc'] = game.trainerArc
    ? { ...game.trainerArc, consecutiveWins: streakLength, consecutiveLosses: 0 }
    : {
        current: 'established', history: [], seasonCount: 1, bestFinish: 1, titlesWon: 0,
        consecutiveWins: streakLength, consecutiveLosses: 0, boardWarningGiven: false,
      }
  return { ...game, fixtures, trainerArc, matchLaddningBandShown: undefined }
}
const matchLaddningBandGame = withWinStreak(factoryMidSeasonGame, 3)

// AUDIT DEL 2 (2026-08-09), Etapp B-baseline: Transfers, fyra fönstertillstånd.
// windowOpen/stängt är rent kalenderdrivet (transferWindowService.ts läser bara
// currentDate-månaden) — withTransferWindow{Closed,Open} byter bara den.
const transfersClosedGame = withTransferWindowClosed(factoryMidSeasonGame)
const transfersOpenNoBidsGame = withTransferWindowOpen(factoryMidSeasonGame)
const transfersOneBidGame = withIncomingBids(withTransferWindowOpen(factoryMidSeasonGame), 1)
const transfersMultiBidsGame = withIncomingBids(withTransferWindowOpen(factoryMidSeasonGame), 3)

function ScoutingDevScene() {
  const [position, setPosition] = useState('ALL')
  const [maxAge, setMaxAge] = useState(24)
  const [maxSalary, setMaxSalary] = useState(12_000)
  const game = transfersOpenNoBidsGame
  const managedClub = game.clubs.find(club => club.id === game.managedClubId)

  return (
    <ScoutingTab
      game={game}
      scoutReports={{}}
      scoutBudget={game.scoutBudget ?? 10}
      activeAssignment={game.activeScoutAssignment ?? null}
      windowOpen
      managedClub={managedClub}
      spaningPosition={position}
      spaningMaxAge={maxAge}
      spaningMaxSalary={maxSalary}
      currentRound={game.currentMatchday}
      onSetSpanningPosition={setPosition}
      onSetSpanningMaxAge={setMaxAge}
      onSetSpanningMaxSalary={setMaxSalary}
      onBid={() => {}}
      onScout={() => {}}
      onStartTalentSearch={() => ({ success: true })}
      onScoutMessage={() => {}}
      onToggleShortlist={() => {}}
    />
  )
}

const tilltradeGame: SaveGame = {
  ...makeBaseGame({ seed: 31 }),
  onboardingComplete: false,
  tilltradeStep: 1,
}

const retirementEvent: GameEvent = {
  id: 'dev-retirement-ceremony',
  type: 'retirementCeremony',
  title: 'Pensionsceremoni — Karl Lindström',
  body: '"Den här klubben är mitt hjärta. Det förändras inte för att jag slutar spela." — Karl Lindström Vill du erbjuda en roll i föreningen?',
  sender: { name: 'Karl Lindström', role: 'Avgående spelare' },
  relatedPlayerId: 'p-f1',
  resolved: false,
  choices: [
    { id: 'youth_coach', label: 'Erbjud roll som ungdomstränare', subtitle: '🌱 +ungdomskvalitet', effect: { type: 'setLegendRole', legendRole: 'youth_coach' } },
    { id: 'scout', label: 'Erbjud roll som scout', subtitle: '🔍 +scoutresurser', effect: { type: 'setLegendRole', legendRole: 'scout' } },
    { id: 'farewell', label: 'Tack och lycka till', effect: { type: 'setLegendRole', legendRole: 'farewell' } },
  ],
}

// Produktion skapar ceremonin efter att den pensionerade spelaren tagits ur
// players. Scenen speglar det läget och bevisar att statistiken läses ur den
// frusna ClubLegend-posten i stället för att tyst falla till noll.
const retirementCeremonyGame: SaveGame = {
  ...squadGame,
  players: squadGame.players.filter(player => player.id !== 'p-f1'),
  clubLegends: [{
    playerId: 'p-f1', name: 'K. Lindström', position: 'Forward', seasons: 7,
    totalGames: 143, totalGoals: 58, totalAssists: 41, titles: [], retiredSeason: 2027,
  }],
  pendingEvents: [retirementEvent],
}

const boardPatienceWarningGame = {
  ...factoryMidSeasonGame,
  boardPatience: 22,
  boardObjectives: [{
    id: 'dev-board-sporting', type: 'sporting', label: 'Nå topp 6',
    description: 'Styrelsen kräver en plats på övre halvan.',
    ownerId: 'dev-chair', ownerPersonality: 'ambitious',
    targetValue: 6, currentValue: 10, startValue: 8,
    measureFn: 'leaguePosition', status: 'at_risk', assignedSeason: factoryMidSeasonGame.currentSeason,
    successReward: 'Ökat förtroende', failureConsequence: 'Minskat tålamod', carryOver: false,
  }],
} as unknown as SaveGame

function makeSpecialNextMatchGame(kind: 'derby' | 'annandagen'): SaveGame {
  const managedClubId = 'club_slottsbron'
  const opponentId = kind === 'derby' ? 'club_lesjofors' : 'club_malilla'
  const base = makeBaseGame({ seed: 41, clubId: managedClubId })
  const source = base.fixtures.find(f =>
    f.status === 'scheduled' && (f.homeClubId === managedClubId || f.awayClubId === managedClubId),
  )
  if (!source) throw new Error('Dev-fixturen saknar en schemalagd match')
  const fixture = {
    ...source,
    id: `dev-next-${kind}`,
    homeClubId: managedClubId,
    awayClubId: opponentId,
    roundNumber: kind === 'annandagen' ? 8 : 2,
    matchday: kind === 'annandagen' ? 12 : 2,
    date: kind === 'annandagen' ? '2026-12-26' : '2026-11-08',
    isCup: false,
    isKnockout: false,
    isAnnandagen: kind === 'annandagen' ? true : undefined,
  }
  return { ...base, currentMatchday: 1, fixtures: [fixture] }
}

const nextMatchDerbyGame = makeSpecialNextMatchGame('derby')
const nextMatchAnnandagenGame = makeSpecialNextMatchGame('annandagen')

// PORTAL-TAKREGEL (2026-08-09) — §5-baselinen, fyra tillstånd.
// portal-full: matchday 24 valt specifikt — inom upptakt-fönstret (sista 3
// grundserieomgångarna) UTAN att vara "mittfalt" (cementerat, ingen upptakt).
// Upptakt och Spectator är strukturellt ömsesidigt uteslutande (se
// gameStateFactory.ts:s kommentar ovanför withAnniversary) — "5 marks" i
// ordern kan alltså inte betyda alla fem atmosfärsmarks bokstavligt; detta
// är den faktiska taket (situation+beat+eko+upptakt = 4), rapporterat i
// commit-meddelandet, inte tyst kringgått.
const portalTomGame = factoryMidSeasonGame
const portalNormalGame = withActiveBeat(factoryMidSeasonGame)
const portalFullBase = atRound(makeBaseGame({ seed: 2 }), 24)
const portalFullGame = withAnniversary(withActiveBeat(portalFullBase))
const portalGrindGame = withObjectiveAlertWarning(withPendingWeeklyDecision(factoryMidSeasonGame))
const portalFacilityCompletedGame = {
  ...portalTomGame,
  facilityState: {
    ...(portalTomGame.facilityState ?? { builtNodeIds: [] }),
    builtNodeIds: [...new Set([...(portalTomGame.facilityState?.builtNodeIds ?? []), 'kiosk'])],
    builtSeasons: { ...portalTomGame.facilityState?.builtSeasons, kiosk: portalTomGame.currentSeason },
    unseenCompletedFacilities: [{ nodeId: 'kiosk', season: portalTomGame.currentSeason, matchday: portalTomGame.currentMatchday }],
  },
}

const mobileDecisionEvents = [
  {
    id: 'dev-month-sponsor', type: 'sponsorOffer' as const, resolved: false,
    title: 'Ett nytt sponsoravtal', body: 'Ett lokalt företag vill synas på matchtröjan.',
    choices: [
      { id: 'accept', label: 'Skriv på', effect: { type: 'noOp' as const } },
      { id: 'decline', label: 'Tacka nej', effect: { type: 'noOp' as const } },
    ],
  },
  {
    id: 'dev-month-hall', type: 'hallDebate' as const, resolved: false,
    title: 'Ishallens framtid', body: 'Kommunen vill ha besked innan nästa möte.',
    choices: [
      { id: 'push', label: 'Driv frågan', effect: { type: 'noOp' as const } },
      { id: 'wait', label: 'Avvakta', effect: { type: 'noOp' as const } },
    ],
  },
  {
    id: 'dev-month-politics', type: 'politicianEvent' as const, resolved: false,
    title: 'Möte i kommunhuset', body: 'Kommunalrådet vill diskutera klubbens planer.',
    choices: [
      { id: 'meet', label: 'Ta mötet', effect: { type: 'noOp' as const } },
      { id: 'skip', label: 'Prioritera laget', effect: { type: 'noOp' as const } },
    ],
  },
]
const portalMonthDecisionsGame = {
  ...factoryMidSeasonGame,
  pendingEvents: mobileDecisionEvents,
} as unknown as SaveGame

// DOM_SPONSOR_MOTBUD_2026-08-31.md — verifiering. Realistisk sponsorData
// (personality satt, matchar generateSponsorOffer:s form) så motbudsknappen
// och SponsorCounterModal går att klicka igenom med riktig kod, inte en
// förenklad dev-approximation (mobileDecisionEvents ovan saknar sponsorData
// helt — byggd för ett annat syfte, HIGH 11:s månadskö-batchning).
const sponsorMotbudOffer = {
  id: 'sponsor_dev_1', name: 'Nordins Bygg AB', category: 'Bygg', weeklyIncome: 2000,
  contractRounds: 12, signedRound: 1, personality: 'regional' as const,
}
const sponsorMotbudEvent = {
  id: 'event_sponsor_dev', type: 'sponsorOffer' as const, resolved: false,
  title: `Sponsorerbjudande — ${sponsorMotbudOffer.name}`,
  body: `${sponsorMotbudOffer.name} vill sponsra klubben med ${sponsorMotbudOffer.weeklyIncome} kr/vecka i ${sponsorMotbudOffer.contractRounds} omgångar.`,
  sponsorData: JSON.stringify(sponsorMotbudOffer),
  choices: [
    { id: 'accept', label: `Acceptera (${sponsorMotbudOffer.weeklyIncome} kr/vecka)`, effect: { type: 'acceptSponsor' as const, sponsorData: JSON.stringify(sponsorMotbudOffer) } },
    { id: 'reject', label: 'Avslå', effect: { type: 'noOp' as const } },
    // B2 (Designgranskning fresh-eyes 2026-09-03): stale '[Opus]'-placeholder
    // i en dev-scenes-fixture lästes felaktigt som en läckande debug-knapp i
    // produkt-UI. Verifierat: SponsorCounterModal.tsx (den RIKTIGA motbuds-
    // ytan, öppnas via choiceId==='counter' i EventCardInline) har fullständig
    // Opus-text sedan 2026-09-01 (c1588c02, MASTER_OPPET.md
    // sponsor-motbud-reservation-walkaway), inget '[Opus]' kvar — bara denna
    // äldre, enklare fixture hade stannat på placeholdern. "Kräv mer" är den
    // riktiga, låsta knappetiketten, kopierad ordagrant.
    { id: 'counter', label: 'Kräv mer', effect: { type: 'noOp' as const } },
  ],
}
const sponsorMotbudGame = {
  ...factoryMidSeasonGame,
  pendingEvents: [sponsorMotbudEvent],
} as unknown as SaveGame

const breakpointEvent = {
  id: 'dev-breakpoint-economy', type: 'criticalEconomy' as const, resolved: false,
  title: 'Kassan räcker inte', body: 'Klubben måste välja vad som ska skyddas.',
  choices: [
    { id: 'squad', label: 'Skydda truppen', effect: { type: 'noOp' as const } },
    { id: 'facility', label: 'Skydda anläggningen', effect: { type: 'noOp' as const } },
  ],
}

// AUDIT DEL 4 (2026-08-12) — täckningslucka i takregel-baselinen: alla fyra
// tillstånd ovan varierar bara atmosfärslagret. Primary-urvalet (initCardBag.ts,
// SM-final 100 · cupfinal 98 · deadline 90 · avsked 82 ·
// derby 80 · next_match 10) fotograferades aldrig i konkurrens — deadline
// (90) vann i tre av fyra bara för att inget högre viktat villkor någonsin
// var sant samtidigt. Samma klass av lucka som lät FÖRESLÅS-badgen vara
// osynlig en månad (3f9bc07a): otestad rangordning upptäcks inte förrän
// någon råkar trigga rätt kombination i skarpt läge.
const primarySmFinalFixture = {
  id: 'fx-primary-smfinal', leagueId: 'liga-dev', season: 8, roundNumber: 37, matchday: 37,
  homeClubId: HOME_ID, awayClubId: AWAY_ID, homeScore: 0, awayScore: 0,
  status: 'scheduled' as const, isFinaldag: true, events: [],
}
// SM-final (100) mot deadline (90) samtidigt: makeLeagueFixtures() ger 14
// avklarade ligarundor => roundsLeft = 15-14 = 1, transferDeadlineWithin3Rounds
// sant. Förväntat vinnare: SMFinalPrimary (100 > 90).
const primarySmfinalVsDeadlineGame = makeGame([...makeLeagueFixtures(), primarySmFinalFixture])

const primaryFarewellFixture = {
  id: 'fx-primary-farewell', leagueId: 'liga-dev', season: 8, roundNumber: 21, matchday: 21,
  homeClubId: HOME_ID, awayClubId: AWAY_ID, homeScore: 0, awayScore: 0,
  status: 'scheduled' as const, farewellMatchForPlayerId: 'p-h1', events: [],
}
// Ett kritiskt overlay-event pendlar medan nästa match är en avskedsmatch.
// D-EVT1: eventet ägs av EventOverlay och konkurrerar inte längre om primary;
const primaryEventVsFarewellGame = makeGame([...makeLeagueFixtures(), primaryFarewellFixture], {
  pendingEvents: [{
    id: 'dev-primary-critical', type: 'playerUnhappy' as const, resolved: false,
    title: 'Missnöjd spelare', body: 'Erik är missnöjd med speltiden inför avskedet.',
    sender: { name: 'Erik Johansson', role: 'Half' },
    relatedPlayerId: 'p-h1',
    choices: [
      { id: 'talk', label: 'Prata med honom', effect: { type: 'noOp' as const } },
      { id: 'ignore', label: 'Vänta och se', effect: { type: 'noOp' as const } },
    ],
  }],
})
// AUDIT DEL 2 (2026-08-11), kontrollfall efter Berg-fixet (dc3d771f): ett
// aktivt bud (HÄNDELSE-kort) ska aldrig få TransferDeadlinePrimary att
// påstå "Inga öppna bud just nu" — varken när det är det enda budet eller
// när det är ett av flera. Två separata tillstånd, inte en variant av
// portal-tom/normal (de har egna, redan etablerade betydelser).
const portalBidSingleGame = withActiveIncomingBidEvent(withIncomingBids(factoryMidSeasonGame, 1))
const portalBidMultiGame = withActiveIncomingBidEvent(withIncomingBids(factoryMidSeasonGame, 3))

// AUDIT DEL 4 (2026-08-12): Taktiktavlan — samma opponentAnalysisService-anrop
// som TacticStep gör live (generateDetailedAnalysis), inte fabricerad data, så
// FÖRESLÅS-badgen körs mot riktig produktionslogik. activeTactic.mentality/press
// medvetet satta att INTE matcha förslaget (recommendation kan annars råka landa
// på samma värde som redan är aktivt) — annars visas ingen badge alls i denna
// dev-scen och den går inte att browser-verifiera.
const taktikGame = (() => {
  const nf = getNextManagedFixture(factoryMidSeasonGame)
  if (!nf) return factoryMidSeasonGame
  const oppId = nf.homeClubId === factoryMidSeasonGame.managedClubId ? nf.awayClubId : nf.homeClubId
  const opp = factoryMidSeasonGame.clubs.find(c => c.id === oppId)
  if (!opp) return factoryMidSeasonGame
  const oppPlayers = factoryMidSeasonGame.players.filter(p => opp.squadPlayerIds.includes(p.id))
  const baseAnalysis = generateDetailedAnalysis(opp, oppPlayers, factoryMidSeasonGame.standings, factoryMidSeasonGame.fixtures, nf.id)
  // suggestedMentality/suggestedPress är undefined när opponentAnalysisService
  // klassar motståndaren som jämbördig ("Jämn motståndare") — sant för denna
  // fabricerade motståndarparning. Tvingar fram en riktad rekommendation
  // (mapRecommendationToMentality/-Press-mönstret, samma strängar som
  // opponentAnalysisService.ts själv använder) så FÖRESLÅS-badgen går att
  // browser-verifiera, snarare än att den råkar utebli.
  const analysis = { ...baseAnalysis, recommendation: 'Pressa högt och dominera mitten.', suggestedMentality: 'offensive' as const, suggestedPress: 'high' as const }
  const managedClub = factoryMidSeasonGame.clubs.find(c => c.id === factoryMidSeasonGame.managedClubId)
  if (!managedClub) return { ...factoryMidSeasonGame, opponentAnalyses: { [oppId]: analysis } }
  const mismatchedTactic = { ...managedClub.activeTactic, mentality: 'defensive' as const, press: 'low' as const }
  const clubs = factoryMidSeasonGame.clubs.map(c => c.id === managedClub.id ? { ...c, activeTactic: mismatchedTactic } : c)
  return { ...factoryMidSeasonGame, clubs, opponentAnalyses: { [oppId]: analysis } }
})()

// AUDIT DEL 3 (2026-08-11): baseline före ombyggnad, Club 'Klubben i korthet'.
// club-fresh: createTrainerArc()-default (seasonCount 0, bestFinish 12) → era
// survival, managerProfile.seasonsAtClub default 1, inga activeAnniversaries —
// "öppna minnen"-kolumnen ska INTE synas här (No false empty states — DS-regel).
const clubFreshGame = makeBaseGame({ seed: 2 })
// club-established: sex säsonger, bestFinish 6 (topp 6, inte topp 4 — annars
// slår legacy-villkoret till istf establishment), hög communityStanding → era
// establishment (calculateClubEra), matchar mockens "Etablering". Tre öppna
// minnen via withAnniversary, applicerad tre gånger, eventId gjorda unika i
// efterhand så de inte kolliderar.
const clubEstablishedBase = atRound(makeBaseGame({ seed: 2 }), 20)
const clubEstablishedWithMemories = [0, 1, 2].reduce(
  (g) => withAnniversary(g),
  clubEstablishedBase
)
const clubEstablishedGame = {
  ...clubEstablishedWithMemories,
  communityStanding: 75,
  activeAnniversaries: (clubEstablishedWithMemories.activeAnniversaries ?? []).map((a, i) => ({ ...a, eventId: `dev_anniversary_${i + 1}` })),
  managerProfile: { ...clubEstablishedWithMemories.managerProfile, seasonsAtClub: 6 },
  trainerArc: {
    current: 'stable', history: [], seasonCount: 6, bestFinish: 6, titlesWon: 0,
    consecutiveLosses: 0, consecutiveWins: 2, boardWarningGiven: false,
  },
} as unknown as SaveGame

// H1 (människoupplevelse-audit, 7024f8a, 2026-08-24): Bygget-fixtur. Säsong 2
// (S1-låset öppet), Värmestuga byggd säsong 1 (öppnar avvecklingssheeten),
// politiker med relation över kommun-tröskeln + en aktiv, villig mecenat
// "Annika" (öppnar finansieringssheetens mecenat-alternativ — samma person
// den ursprungliga finansieringsbuggen gällde).
const facilityBase = atRound(makeBaseGame({ seed: 4 }), 5)
const facilityGame = {
  ...facilityBase,
  // S1-låset (FacilityScreen.tsx:44): "Bygg ut"-knappen döljs tills en säsong
  // avslutats. makeBaseGame() sätter ingen seasonSummaries — utan denna raden
  // hänger fixturen kvar i S1 och testklicket på "Bygg ut" hittar aldrig knappen.
  seasonSummaries: [makeSeasonSummary({ finalPosition: 6, playoffResult: null })],
  facilityState: { builtNodeIds: ['varmestuga'], builtSeasons: { varmestuga: 1 } },
  localPolitician: {
    name: 'Karin Åhs', title: 'Kommunalråd', party: 'lokalt' as const,
    agenda: 'infrastructure' as const, relationship: 55, kommunBidrag: 0,
  },
  mecenater: [{
    id: 'dev-mecenat-annika', name: 'Annika', gender: 'female' as const,
    business: 'Annika Bygg AB', businessType: 'entrepreneur' as const,
    wealth: 6, personality: 'filantropen' as const, influence: 40,
    happiness: 65, goodwill: 50, contribution: 0, totalContributed: 0,
    isActive: true,
  }],
} as unknown as SaveGame

// Jacobs order (2026-08-24): avskedsvägen (game-over/game-over/historik).
// Tre spelade säsonger (nedåtgående placering) + consecutiveFailures:3 —
// GameOverScreen.tsx:s getBoardStatement() hårdaste textgren ("tre
// säsonger på rad utan förbättring"), inte den mildare boardPatience-grenen.
const gameOverGame = {
  ...makeBaseGame({ seed: 6 }),
  currentSeason: 4,
  seasonSummaries: [
    makeSeasonSummary({ season: 1, finalPosition: 8, wins: 10 }),
    makeSeasonSummary({ season: 2, finalPosition: 10, wins: 8 }),
    makeSeasonSummary({ season: 3, finalPosition: 11, wins: 6 }),
  ],
  boardPatience: 12,
  consecutiveFailures: 3,
  managerFired: true,
} as unknown as SaveGame

const callupGame = {
  ...squadGame,
  pendingCallupModal: {
    playerIds: ['p-h1', 'p-f1'],
    names: ['Erik Johansson', 'Karl Lindström'],
    bonusTkr: 10,
  },
} as SaveGame

// Granska IA — fingerad spelad match (md 20) + andra matcher + roundSummary
const granskaFixture = {
  id: 'fx-granska', leagueId: 'liga-dev', season: 8, roundNumber: 20, matchday: 20,
  homeClubId: HOME_ID, awayClubId: AWAY_ID, homeScore: 4, awayScore: 2,
  status: 'completed' as const,
  events: [
    { minute: 8, type: 'goal', clubId: HOME_ID, playerId: 'p-f1', description: 'Mål', isCornerGoal: false },
    { minute: 22, type: 'goal', clubId: AWAY_ID, playerId: undefined, description: 'Kvittering' },
    { minute: 34, type: 'corner', clubId: HOME_ID, description: 'Hörna' },
    { minute: 41, type: 'goal', clubId: HOME_ID, playerId: 'p-h1', description: 'Mål', isCornerGoal: true },
    { minute: 58, type: 'suspension', clubId: AWAY_ID, description: 'Utvisning' },
    { minute: 67, type: 'goal', clubId: HOME_ID, playerId: 'p-f2', description: 'Mål' },
    { minute: 79, type: 'penalty', clubId: AWAY_ID, description: 'Straff' },
    { minute: 81, type: 'goal', clubId: AWAY_ID, playerId: undefined, description: 'Straffmål' },
    { minute: 88, type: 'goal', clubId: HOME_ID, playerId: 'p-f1', description: 'Mål' },
  ],
  report: { playerRatings: { 'p-gk1': 6.4, 'p-d1': 6.6, 'p-d2': 5.2, 'p-d3': 6.1, 'p-d4': 6.3, 'p-h1': 7.2, 'p-h2': 6.5, 'p-h3': 6.0, 'p-h4': 6.2, 'p-f1': 8.4, 'p-f2': 7.0 }, shotsHome: 17, shotsAway: 9, onTargetHome: 9, onTargetAway: 4, savesHome: 3, savesAway: 8, cornersHome: 9, cornersAway: 3, penaltiesHome: 0, penaltiesAway: 1, possessionHome: 58, possessionAway: 42, playerOfTheMatchId: 'p-f1' },
  attendance: 478,
  // BROWSER-VERIFIERING (2026-08-12): GranskaSpelare-fliken saknade lineup helt
  // (homeLineup ej satt) → STARTELVA/BÄNKEN-korten renderade tomma, upptäckt vid
  // faktisk skärmdumpsgranskning av DecisionCard-migreringen, inte via kod-läsning.
  homeLineup: {
    startingPlayerIds: ['p-gk1', 'p-d1', 'p-d2', 'p-d3', 'p-d4', 'p-h1', 'p-h2', 'p-h3', 'p-h4', 'p-f1', 'p-f2'],
    benchPlayerIds: ['p-gk2', 'p-f3', 'p-f4', 'p-f5'],
    captainPlayerId: 'p-d1',
    // O16 (2026-08-19) BROWSER-VERIFIERING: DITT VAL (cornerStrategy → hörnmål)
    // kräver homeLineup.tactic — saknades tidigare (bara lineup mockades ut).
    // Aggressive matchar redan befintlig hörnmål-händelse (minut 41, isCornerGoal).
    tactic: {
      mentality: TacticMentality.Balanced, tempo: TacticTempo.Normal, press: TacticPress.Medium,
      passingRisk: TacticPassingRisk.Mixed, width: TacticWidth.Normal, attackingFocus: TacticAttackingFocus.Mixed,
      cornerStrategy: CornerStrategy.Aggressive, penaltyKillStyle: PenaltyKillStyle.Active,
    },
  },
}
const granskaOtherFixtures = [
  { id: 'fx-o1', leagueId: 'liga-dev', season: 8, roundNumber: 20, matchday: 20, homeClubId: 'club-s1', awayClubId: 'club-s5', homeScore: 3, awayScore: 2, status: 'completed' as const, events: [] },
  { id: 'fx-o2', leagueId: 'liga-dev', season: 8, roundNumber: 20, matchday: 20, homeClubId: 'club-s8', awayClubId: 'club-s2', homeScore: 1, awayScore: 1, status: 'completed' as const, events: [] },
]
// BROWSER-VERIFIERING (2026-08-12): två fabricerade pendingEvents (en 'critical',
// en 'player') så DecisionCard faktiskt går att se renderad med riktigt
// innehåll — tidigare gick granska-scenen att öppna utan att någon
// DecisionCard-migrerad kortyta någonsin hade data att visa.
const granskaPendingEvents = [
  {
    id: 'dev-critical-1', type: 'contractRequest' as const,
    title: 'Kontraktskrav', body: 'Erik vill förlänga — och vill ha mer betalt för att stanna.',
    sender: { name: 'Erik Johansson', role: 'Half' },
    relatedPlayerId: 'p-h1',
    choices: [
      { id: 'accept', label: 'Godkänn kravet', effect: { type: 'noOp' as const } },
      { id: 'reject', label: 'Avböj', effect: { type: 'noOp' as const } },
    ],
    resolved: false,
  },
  {
    id: 'dev-player-1', type: 'playerPraise' as const,
    title: 'Fin insats', body: 'Karl var lagets bästa spelare — assistenten vill lyfta det i truppen.',
    sender: { name: 'Björn Svensson', role: 'Assisterande tränare' },
    relatedPlayerId: 'p-f1',
    choices: [
      { id: 'praise', label: 'Lyft det öppet', effect: { type: 'noOp' as const } },
      { id: 'private', label: 'Ta det enskilt', effect: { type: 'noOp' as const } },
    ],
    resolved: false,
  },
]
const granskaGame = makeGame([...makeLeagueFixtures(), granskaFixture, ...granskaOtherFixtures], {
  lastCompletedFixtureId: 'fx-granska', lastProcessedMatchday: 20, communityStanding: 58,
  pendingEvents: granskaPendingEvents,
})
const granskaLevel3Game = {
  ...granskaGame,
  resolvedChoices: [{ eventId: 'dev-critical-1', choiceId: 'accept', label: 'Godkänn kravet' }],
} as SaveGame
// Upptakt sub-states — fingerade tabeller (played=19, 3 omg kvar)
function makeUpptaktStandings(managedPoints: number, otherPoints: number[]) {
  const rows = [
    { clubId: HOME_ID, played: 19, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: managedPoints, position: 0 },
    ...otherPoints.map((p, i) => ({ clubId: `us${i}`, played: 19, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: p, position: 0 })),
  ]
  rows.sort((a, b) => b.points - a.points).forEach((r, i) => { r.position = i + 1 })
  return rows
}
// Schemalagd nästa match (md 20, grundserie) så NextMatchPrimary renderar w2-warm pcard
const upptaktFx = (variant: 'sakrat' | 'farozon' | 'bottenstrid') => [
  ...makeLeagueFixtures(),
  {
    id: `fx-upptakt-next-${variant}`, leagueId: 'liga-dev', season: 8, roundNumber: 20, matchday: 20,
    homeClubId: HOME_ID, awayClubId: AWAY_ID, homeScore: 0, awayScore: 0,
    status: 'scheduled' as const, events: [], isCup: false, date: '2026-02-08', tipoffHour: 14,
  },
]
const upptaktSakrat = makeGame(upptaktFx('sakrat'), { currentMatchday: 19, standings: makeUpptaktStandings(34, [38, 36, 30, 28, 28, 20, 18, 16, 14, 12, 10]) })
const upptaktFarozon = makeGame(upptaktFx('farozon'), { currentMatchday: 19, standings: makeUpptaktStandings(20, [30, 30, 28, 28, 28, 28, 26, 24, 22, 12, 10]) })
const upptaktBottenstrid = makeGame(upptaktFx('bottenstrid'), { currentMatchday: 19, standings: makeUpptaktStandings(8, [32, 30, 28, 26, 24, 22, 20, 18, 16, 10, 6]) })

// Ekonomi (Våg 4) — kassa-trend härledd ur financeLog. Två states för stroke-färgning.
function makeFinanceLog(nets: number[]) {
  return nets.map((amount, i) => ({ round: i + 1, amount, reason: 'match_income' as const, label: `Omg ${i + 1}` }))
}
// Lugn säsong: stigande kassa (positiva netton) → success-stroke
const ekonomiCalmClub = { ...devClubs[0], finances: 96000, transferBudget: 30000, wageBudget: 40000 } as unknown as Club
const ekonomiCalmGame = makeGame(makeLeagueFixtures(), {
  financeLog: makeFinanceLog([4000, 6000, 3000, 7000, 5000, 8000, 6000, 9000]),
  sponsors: [], communityActivities: {},
})
// Krissäsong: fallande kassa (negativa netton) → danger-stroke
const ekonomiCrisisClub = { ...devClubs[0], finances: 7000, transferBudget: 0, wageBudget: 28000 } as unknown as Club
const ekonomiCrisisGame = makeGame(makeLeagueFixtures(), {
  financeLog: makeFinanceLog([-3000, -5000, 2000, -7000, -4000, -6000, -3000, -8000]),
  sponsors: [], communityActivities: {},
  // 2026-08-26: krisscenariot ska visa VARFÖR EkonomiTab-fixet (RAPPORT_
  // LICENSVARNING_RENDERING_2026-08-26.md) behövdes — licenseStatus
  // (System B, det avskedande) satt till point_deduction så scenen
  // faktiskt bevisar att statusraden nu läser rätt system och visar
  // ackumulatorns låsta zon-text (RAPPORT_ACKUMULATOR_FORSLAG_2026-08-26.md).
  licenseStatus: 'point_deduction',
  licenseRiskScore: 65,
})

// SeasonSummary — fingerade summaries för fyra states
function makeSeasonSummary(overrides: Record<string, unknown>) {
  const base = {
    season: 8, clubId: HOME_ID, clubName: 'Edsbyn BK', finalPosition: 5,
    wins: 14, draws: 4, losses: 4, goalsFor: 62, goalsAgainst: 38, goalDifference: 24, points: 32,
    totalGoals: 14, totalAssists: 10, totalCornerGoals: 4, totalCleanSheets: 6,
    longestWinStreak: 5, longestLossStreak: 2, biggestWin: { opponent: 'BGF', score: '7–1', round: 12 }, worstLoss: null,
    homeRecord: { wins: 8, draws: 2, losses: 1 }, awayRecord: { wins: 6, draws: 2, losses: 3 },
    firstHalfPoints: 15, secondHalfPoints: 17, formTrend: 'improving' as const,
    totalInjuries: 2, mostInjuredPlayer: null,
    startFinances: 60000, endFinances: 95000, financialChange: 35000,
    youthIntakeCount: 2, bestYouthProspect: null,
    roundPoints: [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,32,32,32,32,32,32],
    narrativeSummary: 'En stark säsong.',
    boardExpectation: 'playoff' as const, metExpectation: true, expectationVerdict: 'met' as const,
    playoffResult: null, cupResult: null, signatureRubric: null, cupFinalScore: null,
    topScorer: null, topAssister: null, topRated: null, mostImproved: null, youngPlayer: null,
    storyTriggers: [],
    ...overrides,
  }
  return base
}
// AUDIT DEL 2 (2026-08-09), Etapp B-baseline: cupResult='winner' läggs till här
// (var tidigare null) — "mästare → gold-hero+cup" i ordern kräver BÅDA
// sektionerna samtidigt, inte bara ligamästerskapet.
const seasonSumChampion = makeSeasonSummary({ finalPosition: 1, playoffResult: 'champion', cupResult: 'winner' as const, expectedVerdict: 'exceeded', expectationVerdict: 'exceeded' as const })
const seasonSumTopThree = makeSeasonSummary({ finalPosition: 2, playoffResult: 'finalist', expectationVerdict: 'met' as const })
const seasonSumMidtable = makeSeasonSummary({ finalPosition: 6, playoffResult: 'quarterfinal', expectationVerdict: 'met' as const, formTrend: 'stable' as const })
const seasonSumShare = makeSeasonSummary({
  finalPosition: 3,
  playoffResult: 'semifinal',
  matchOfTheSeason: {
    fixtureId: 'fx-season-share', matchday: 18, roundLabel: 'Omgång 14',
    opponentName: 'Bollnäs GoIF', homeScore: 5, awayScore: 4, isHome: true,
    category: 'late_winner', narrative: 'Karl Lindström avgjorde på tilläggstid efter vinterns stora vändning.',
    potmName: 'Karl Lindström', shareImageReady: true,
  },
})

// Full-täcknings-scener (audit-spec task #1) — renderar riktiga skärmar headless.
// SeasonSummary läser game.seasonSummaries (sista) → hela skärmen inkl. ÅRSBOK/hero-titel/CTA.
const seasonHeaderGame = makeGame(makeLeagueFixtures(), { seasonSummaries: [seasonSumChampion] })
// AUDIT DEL 2 (2026-08-09), Etapp B-baseline: mittfält utan slutspel — didNotQualify,
// skiljer sig från seasonSumMidtable (season-c) som faktiskt når kvartsfinal.
const seasonSumNoPlayoffs = makeSeasonSummary({ finalPosition: 8, playoffResult: 'didNotQualify', expectationVerdict: 'met' as const, formTrend: 'stable' as const })
const seasonNoPlayoffsGame = makeGame(makeLeagueFixtures(), { seasonSummaries: [seasonSumNoPlayoffs] })
// Sparkad: expectationVerdict 'failed' (❌ "Styrelsen är besviken") + managerFired
// styr handleNextSeason-routningen (→ /game/game-over istf /game/dashboard).
const seasonSumFired = makeSeasonSummary({ finalPosition: 11, playoffResult: 'didNotQualify', expectationVerdict: 'failed' as const, formTrend: 'declining' as const })
const seasonFiredGame = makeGame(makeLeagueFixtures(), { seasonSummaries: [seasonSumFired], managerFired: true } as never)
const seasonShareGame = makeGame(makeLeagueFixtures(), { seasonSummaries: [seasonSumShare] })
// Finalhelg: playoffBracket med managed i en pågående final (winnerId null) → isSmFinal.
const finalhelgGame = makeGame(makeLeagueFixtures(), {
  playoffBracket: {
    season: 8, status: 'final', champion: null,
    quarterFinals: [], semiFinals: [],
    final: { id: 'pf-final', round: 'final', homeClubId: HOME_ID, awayClubId: AWAY_ID, fixtures: [], homeWins: 1, awayWins: 1, winnerId: null, loserId: null },
  },
})
const seasonGameA = makeGame(makeLeagueFixtures(), { seasonSummaries: [seasonSumChampion] })
const seasonGameB = makeGame(makeLeagueFixtures(), { seasonSummaries: [seasonSumTopThree] })
const seasonGameC = makeGame(makeLeagueFixtures(), { seasonSummaries: [seasonSumMidtable] })

// 5.1 Sommaren (SLUTTEST_KO.md, 2026-08-18) — CODE_INSTRUKTION_SOMMAREN_2026-08-17.
// md:s fyra baseline-scener, via fabriken (behövs en override är det en override,
// inte en egen scen — samma princip som season-a/b/c ovan).
const SOMMAREN_CLUBS = [...devClubs, ...Array.from({ length: 10 }, (_, i) => ({ ...devClubs[1], id: `club-filler-${i}`, name: `Fyllnadsklubb ${i}` }))]
const sommarenCupFixture = {
  id: 'fx-sommaren-cup', leagueId: 'liga-dev', season: 9, roundNumber: 2, matchday: 1,
  homeClubId: HOME_ID, awayClubId: AWAY_ID, status: 'scheduled' as const,
  isCup: true, events: [],
}
function makeSommarenGame(extra: Record<string, unknown>): SaveGame {
  return makeGame([sommarenCupFixture], {
    clubs: SOMMAREN_CLUBS,
    boardObjectives: [
      { id: 'obj-1', type: 'sporting', label: 'Nå slutspel', description: 'Slutspel', ownerId: 'O. Ström', ownerPersonality: 'traditionalist', targetValue: 8, currentValue: 3, measureFn: 'position', status: 'active', assignedSeason: 9, successReward: '', failureConsequence: '', carryOver: false },
      { id: 'obj-2', type: 'economic', label: 'Balansera budgeten', description: 'Ekonomi', ownerId: 'B. Lund', ownerPersonality: 'ekonom', targetValue: 0, currentValue: 120000, measureFn: 'finances', status: 'active', assignedSeason: 9, successReward: '', failureConsequence: '', carryOver: false },
    ],
    ...extra,
  } as never)
}
function transitionEvents(...types: Array<'retired' | 'aged' | 'promoted'>): import('../../../domain/entities/SaveGame').SeasonTransitionEvent[] {
  const names: Record<string, string> = { retired: 'Berglund', aged: 'Åberg', promoted: 'Nilsson' }
  return types.map(type => ({ type, playerId: `p-${type}`, playerLastName: names[type], ...(type === 'aged' && { age: 34 }) }))
}
// Säsong 2, utvilad, tre händelser, slutspel rimligt.
// currentSeason satt = seasonCount (2026-08-19-fyndet: kickern läste game.
// currentSeason, epokLine läser trainerArc.seasonCount — två olika fält som
// makeSommarenGame() aldrig synkade, så alla fyra scener visade samma
// ärvda default (8) i kickern oavsett vad brödtexten sa).
// H6 (2026-08-24): epokLine läser numera managerProfile.seasonsAtClub, inte
// trainerArc.seasonCount (se SeasonTransitionScene.tsx:s rotorsak-kommentar)
// — seasonsAtClub tillagd på alla fyra mockar nedan så de fortsätter visa
// RÄTT säsongsordinal i epok-raden, inte bara i kickern.
const sommarenS2Game = makeSommarenGame({
  currentSeason: 2,
  trainerArc: { current: 'newcomer', history: [], seasonCount: 2, bestFinish: 3, titlesWon: 0, consecutiveLosses: 0, consecutiveWins: 2 },
  seasonSummaries: [makeSeasonSummary({ finalPosition: 3, playoffResult: 'quarterfinal' })],
  managerProfile: { ...seasonHeaderGame.managerProfile, burnoutScore: 15, seasonsAtClub: 2 },
  pendingSeasonTransitionEvents: transitionEvents('retired', 'aged', 'promoted'),
  // Förutsättningsfasen, steg 1 — höjd ribba (dev-scene-verifiering).
  boardAssessment: {
    season: 2, previousExpectation: 'midTable', newExpectation: 'challengeTop', direction: 'raised',
    reasonSource: 'results', reasonLine: 'Ni har visat att ni kan mer. Då begär vi mer.', seasonAcknowledgment: BOARD_SEASON_ACKNOWLEDGMENT_PLACEHOLDER,
    leagueMovements: [
      { type: 'transfer', playerName: 'Oskar Nyström', fromClubName: 'Rogle', toClubName: 'Lesjöfors', fee: 185000 },
      { type: 'positionTrend', clubId: 'club_skutskar', clubName: 'Skutskär', fromPosition: 9, toPosition: 6 },
      { type: 'positionTrend', clubId: 'club_heros', clubName: 'Heros', fromPosition: 2, toPosition: 5 },
    ],
  },
})
// Säsong 6, titelförsvarare, nära gränsen, tre händelser.
const sommarenTitelforsvarareGame = makeSommarenGame({
  currentSeason: 6,
  trainerArc: { current: 'grind', history: [], seasonCount: 6, bestFinish: 1, titlesWon: 1, consecutiveLosses: 0, consecutiveWins: 4 },
  seasonSummaries: [
    makeSeasonSummary({ finalPosition: 4, playoffResult: 'semifinal' }),
    makeSeasonSummary({ finalPosition: 1, playoffResult: 'champion' }),
  ],
  managerProfile: { ...seasonHeaderGame.managerProfile, burnoutScore: 78, seasonsAtClub: 6 },
  pendingSeasonTransitionEvents: transitionEvents('retired', 'aged', 'promoted'),
})
// Säsong 4, efter tapp, tomt-fallet, slutspel INTE rimligt (avoidBottom + didNotQualify).
const sommarenTomtGame = makeSommarenGame({
  currentSeason: 4,
  clubs: SOMMAREN_CLUBS.map(c => c.id === HOME_ID ? { ...c, boardExpectation: 'avoidBottom' } : c),
  trainerArc: { current: 'questioned', history: [], seasonCount: 4, bestFinish: 5, titlesWon: 0, consecutiveLosses: 3, consecutiveWins: 0 },
  seasonSummaries: [
    makeSeasonSummary({ finalPosition: 4, playoffResult: 'quarterfinal' }),
    makeSeasonSummary({ finalPosition: 9, playoffResult: 'didNotQualify' }),
  ],
  managerProfile: { ...seasonHeaderGame.managerProfile, burnoutScore: 55, seasonsAtClub: 4 },
  pendingSeasonTransitionEvents: [],
  // Förutsättningsfasen, steg 1 — sänkt ribba (dev-scene-verifiering).
  boardAssessment: {
    season: 4, previousExpectation: 'midTable', newExpectation: 'avoidBottom', direction: 'lowered',
    reasonSource: 'aiTransfers', reasonLine: 'Två lag omkring er har rustat på ett sätt ni inte matchat. Vi justerar därefter.', seasonAcknowledgment: BOARD_SEASON_ACKNOWLEDGMENT_PLACEHOLDER,
    leagueMovements: [
      { type: 'transfer', playerName: 'Oskar Nyström', fromClubName: 'Rogle', toClubName: 'Lesjöfors', fee: 185000 },
      { type: 'positionTrend', clubId: 'club_skutskar', clubName: 'Skutskär', fromPosition: 9, toPosition: 6 },
    ],
  },
})
// Säsong 11 (siffervarianten), något sliten, en händelse.
const sommarenSiffraGame = makeSommarenGame({
  currentSeason: 11,
  trainerArc: { current: 'grind', history: [], seasonCount: 11, bestFinish: 2, titlesWon: 0, consecutiveLosses: 0, consecutiveWins: 1 },
  seasonSummaries: [makeSeasonSummary({ finalPosition: 5, playoffResult: 'quarterfinal' })],
  managerProfile: { ...seasonHeaderGame.managerProfile, burnoutScore: 50, seasonsAtClub: 11 },
  pendingSeasonTransitionEvents: transitionEvents('retired'),
  // Förutsättningsfasen, steg 1 — oförändrad (dev-scene-verifiering).
  boardAssessment: { season: 11, previousExpectation: 'challengeTop', newExpectation: 'challengeTop', direction: 'unchanged', seasonAcknowledgment: BOARD_SEASON_ACKNOWLEDGMENT_PLACEHOLDER },
})

const granskaRoundSummary = {
  round: 20, date: '2026-02-01', matchPlayed: true,
  communityStandingBefore: 54, communityStandingAfter: 58, communityStandingChanges: [],
  standingBefore: 5, financesBefore: 70000, financesAfter: 84000,
  injuries: ['Holm — lätt stukning, 1 vecka'], youthMatchResult: 'P19 vann 3–1',
  newInboxCount: 2,
}

// AUDIT DEL 3 (2026-08-10), förberedelse för Design-uppdraget "Matchtypsmatrisen"
// (DESIGN_UPPDRAG_GRANSKA_DEL4_2026-08-10.md, steg A): fem scener via fabriken,
// samma granskaFixture-form som redan finns (liga), bara klassificeringsflaggorna
// ändrade — INGET i granska/ rört, bara spelläget som byggs runt den befintliga,
// oförändrade skärmen. Måste finnas INNAN ett ev. sektionsregister byggs, annars
// finns inget bevis för vilka sektioner som fanns innan de ev. togs bort.
// 'fx-granska' återanvänt som id i alla fem (storeReady kollar bara det id:t,
// varje scen sätter sitt EGET game-objekt så ingen kollision uppstår).
function makeGranskaFixture(overrides: Partial<typeof granskaFixture> & {
  isCup?: boolean; isKnockout?: boolean; isCupFinalhelgen?: boolean
  isNeutralVenue?: boolean; farewellMatchForPlayerId?: string
  arenaName?: string; venueCity?: string; isFinaldag?: boolean
}) {
  return { ...granskaFixture, ...overrides }
}

// Cup, vanlig runda — isCup+isKnockout, INTE finalhelgen/neutral plan.
// GRANSKA DEL 4 steg 2 (2026-08-11): roundNumber 2 (kvartsfinal), inte 16 —
// matchTypeAxes.ts:s deriveSkede läser cupens roundNumber 1-4 (samma tal
// cupService.ts:s CUP_MATCHDAYS/getCupRoundName bygger på). roundNumber:16
// låg utanför det intervallet och gjorde skede undefined — sektionsregistret
// råkade se rätt ut ändå (undefined uppför sig som "inte final") men
// testade då inte den verkliga rond→skede-mappningen, bara en tillfällighet.
// matchday hålls kvar på en säker zon (16, inte 2 — 2 kolliderar med
// makeLeagueFixtures()s auto-genererade rundor 1-14); matchday och
// roundNumber är oberoende fält, ingen konflikt att skilja dem åt.
const granskaCupFixture = makeGranskaFixture({ isCup: true, isKnockout: true, roundNumber: 2, matchday: 16 })
const granskaCupGame = makeGame([...makeLeagueFixtures(), granskaCupFixture], {
  lastCompletedFixtureId: 'fx-granska', lastProcessedMatchday: 16, communityStanding: 58,
})
const granskaCupRoundSummary = { ...granskaRoundSummary, round: 16 }

// Cup, finalhelgen — neutral plan (RUNDA 3-fixet: isNeutralVenue bara på cupFINALEN, inte semi).
// roundNumber: 4 = cupService.ts:s verkliga finalrond (samma skäl som ovan).
const granskaCupFinalFixture = makeGranskaFixture({
  isCup: true, isKnockout: true, isCupFinalhelgen: true, isNeutralVenue: true, roundNumber: 4, matchday: 19,
  arenaName: CUP_FINAL_VENUE.arenaName, venueCity: CUP_FINAL_VENUE.city,
})
const granskaCupFinalGame = makeGame([...makeLeagueFixtures(), granskaCupFinalFixture], {
  lastCompletedFixtureId: 'fx-granska', lastProcessedMatchday: 19, communityStanding: 58,
  // GRANSKA DEL 4 steg 5 (2026-08-12): cupBracket wired så Turneringsläge-
  // kortets cup-gren (vunnen_final — granskaCupFinalFixture avgörs 4-2 till
  // HOME_ID) har en levande baseline, inte bara enhetstest.
  cupBracket: { season: 8, matches: [{ id: 'cup-r4-m0', round: 4, fixtureId: granskaCupFinalFixture.id, homeClubId: HOME_ID, awayClubId: AWAY_ID, winnerId: HOME_ID }], winnerId: HOME_ID, completed: true },
})
const granskaCupFinalRoundSummary = { ...granskaRoundSummary, round: 19 }

// Slutspel — isKnockout, INTE cup, INTE neutral plan (SM-kvartsfinal, hemmaplan).
// GRANSKA DEL 4 steg 2: playoffBracket wired med fixturen registrerad i
// quarterFinals — annars läser deriveSkede (matchTypeAxes.ts, slutspel-grenen
// söker fixture.id i bracketens tre grenar) ingen bracket alls och skede blir
// undefined av brist på data, inte av att det verkligen är en kvartsfinal.
const granskaPlayoffFixture = makeGranskaFixture({ isKnockout: true, roundNumber: 33, matchday: 33 })
const granskaPlayoffGame = makeGame([...makeLeagueFixtures(), granskaPlayoffFixture], {
  lastCompletedFixtureId: 'fx-granska', lastProcessedMatchday: 33, communityStanding: 58,
  playoffBracket: {
    season: 8, status: 'quarterFinals',
    quarterFinals: [{
      id: 'po-qf-granska', round: 'quarterFinal', homeClubId: HOME_ID, awayClubId: AWAY_ID,
      fixtures: [granskaPlayoffFixture.id], homeWins: 1, awayWins: 0, winnerId: null, loserId: null,
    }],
    semiFinals: [], final: null, champion: null,
  },
})
const granskaPlayoffRoundSummary = { ...granskaRoundSummary, round: 33 }

// SM-final — GRANSKA DEL 4 steg 3-förberedelse (2026-08-11): tävlingstyp:slutspel
// + skede:final, den enda kombinationen isSeasonEndingFinal (granskaSectionRegistry.ts)
// triggar på. Fälten matchar playoffService.ts:s generatePlayoffFixtures(isFinal-
// grenen) ordagrant: isNeutralVenue+isKnockout+isFinaldag, SM_FINAL_VENUE
// (Studenternas IP, Uppsala) — INTE isCup. playoffBracket.final wired med
// fixturen, annars blir skede undefined av datalucka (samma fel som
// granska-slutspel hade innan steg 2 fixade det).
const granskaSmFinalFixture = makeGranskaFixture({
  isKnockout: true, isFinaldag: true, isNeutralVenue: true,
  arenaName: SM_FINAL_VENUE.arenaName, venueCity: SM_FINAL_VENUE.city,
  roundNumber: 37, matchday: 37,
})
const granskaSmFinalGame = makeGame([...makeLeagueFixtures(), granskaSmFinalFixture], {
  lastCompletedFixtureId: 'fx-granska', lastProcessedMatchday: 37, communityStanding: 58,
  playoffBracket: {
    season: 8, status: 'final',
    quarterFinals: [], semiFinals: [],
    final: {
      id: 'po-final-granska', round: 'final', homeClubId: HOME_ID, awayClubId: AWAY_ID,
      fixtures: [granskaSmFinalFixture.id], homeWins: 1, awayWins: 0, winnerId: HOME_ID, loserId: AWAY_ID,
    },
    champion: HOME_ID,
  },
})
const granskaSmFinalRoundSummary = { ...granskaRoundSummary, round: 37 }

// Avskedsmatch — vanlig ligamatch, farewellMatchForPlayerId satt på en trupp-spelare.
const granskaFarewellFixture = makeGranskaFixture({ farewellMatchForPlayerId: 'p-h1' })
const granskaFarewellGame = makeGame([...makeLeagueFixtures(), granskaFarewellFixture], {
  lastCompletedFixtureId: 'fx-granska', lastProcessedMatchday: 20, communityStanding: 58,
})
const granskaFarewellRoundSummary = { ...granskaRoundSummary }

// BoardMeeting fingered state — season 2+, prev-season objective history + new goals
// (board flyttad till fixturblocket ovanför squadGame, se kommentaren där)
const newGoalsSet = [
  { id: 'g-sport', type: 'sporting', label: 'Topp 6', description: 'Ett steg upp', ownerId: 'b1', ownerPersonality: 'traditionalist', targetValue: 6, currentValue: 0, measureFn: 'placement', status: 'active', assignedSeason: 3, successReward: '', failureConsequence: '', carryOver: false },
  { id: 'g-acad', type: 'academy', label: 'En egenfostrad i startelvan', description: 'Akademin ska synas', ownerId: 'b1', ownerPersonality: 'traditionalist', targetValue: 1, currentValue: 0, measureFn: 'academy', status: 'active', assignedSeason: 3, successReward: '', failureConsequence: '', carryOver: false },
]
const stretchGoalsSet = [
  ...newGoalsSet.slice(0, 1),
  { id: 'g-sm', type: 'sporting', label: 'SM-guld', description: 'SM-final och hela vägen', ownerId: 'b1', ownerPersonality: 'modernist', targetValue: 1, currentValue: 0, measureFn: 'title', status: 'active', assignedSeason: 3, successReward: '', failureConsequence: '', carryOver: false },
]
const histA = [{ season: 1, objectiveId: 'x', result: 'met' as const, ownerReaction: 'Bra jobbat.', label: 'Kvar i serien' }]
const histB = [
  { season: 2, objectiveId: 'a', result: 'met' as const, ownerReaction: '', label: 'Topp 4' },
  { season: 2, objectiveId: 'b', result: 'met' as const, ownerReaction: '', label: 'Slutspel' },
  { season: 2, objectiveId: 'c', result: 'met' as const, ownerReaction: '', label: 'Egenfostrad i startelva' },
]
const histC = [
  { season: 2, objectiveId: 'a', result: 'failed' as const, ownerReaction: '', label: 'Topp 6' },
  { season: 2, objectiveId: 'b', result: 'failed' as const, ownerReaction: '', label: 'Undvik kvalstrid' },
  { season: 2, objectiveId: 'c', result: 'met' as const, ownerReaction: '', label: 'Egenfostrad i startelva' },
]
const boardGameA = makeGame(makeLeagueFixtures(), { currentSeason: 2, board, boardObjectives: newGoalsSet, boardObjectiveHistory: histA, seasonStartFinances: 62000 })
// design-d3 (Designgranskning fresh-eyes 2026-09-03): boardGameB/C saknade
// seasonSummaries — resolveBoardMeetingState (boardMeetingStateResolver.ts:87)
// tvingar state='A' när seasonSummaries.length<=1, OAVSETT boardObjectiveHistory.
// Fixture-artefakt bekräftad: båda scenerna visade samma A-titel ("Vi vet
// rutinen nu.") trots att de hette "B (bra)"/"C (dålig)". Rättat med två
// säsonger historik (kravet) + explicit boardPatience som faktiskt separerar
// zonerna (default 70 hade gett BÅDA 'stabilt'→B, oavsett objektivhistorik).
const boardSeasonSummaries = [
  makeSeasonSummary({ finalPosition: 5, playoffResult: null }),
  makeSeasonSummary({ finalPosition: 4, playoffResult: 'quarterfinal' }),
]
const boardGameB = makeGame(makeLeagueFixtures(), { currentSeason: 3, board, boardObjectives: stretchGoalsSet, boardObjectiveHistory: histB, seasonStartFinances: 40000, seasonSummaries: boardSeasonSummaries, boardPatience: 70 })
const boardGameC = makeGame(makeLeagueFixtures(), { currentSeason: 3, board, boardObjectives: newGoalsSet, boardObjectiveHistory: histC, seasonStartFinances: 120000, seasonSummaries: boardSeasonSummaries, boardPatience: 25 })

export function DevScenesScreen() {
  // ?scene=<id> för deterministisk headless-capture (scripts/capture-scenes.mjs)
  const initialScene = (typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('scene')
    : null) as SceneId | null
  const [scene, setScene] = useState<SceneId>(initialScene ?? 'cup-victory')
  const [seededScene, setSeededScene] = useState<SceneId | null>(null)
  // VISUELL_AUDIT punkt 1 (2026-08-09): data-scene-content var hårdkodad till
  // 375px oavsett Playwright-viewport — en "390px"-baseline hade i praktiken
  // screenshottat samma 375px-innehåll med mer grått runt om, inte bredare
  // innehåll. ?width=390 gör bredden en riktig variabel, default 375 så
  // ALLA befintliga scenes.visual.ts-baselines är pixel-oförändrade.
  const contentWidth = (typeof window !== 'undefined'
    ? Number(new URLSearchParams(window.location.search).get('width'))
    : 0) || 375
  // Tap-target-grinden (2026-08-17, "Bredda grinden, inte snapshotarna"):
  // ?navGate=1 monterar en äkta BottomNav ENBART för geometrimätning i
  // tapTargetGate.visual.ts. scenes.visual.ts skickar aldrig parametern,
  // så dess pixelbaselines är oförändrade — samma princip som ?width redan
  // etablerade (default = befintligt beteende, opt-in för det nya).
  const navGate = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('navGate') === '1'
  // Manuell/agentdriven produktinspektion: den växande dev-menyn är numera
  // högre än en mobilviewport och skulle annars täcka scenen som ska bedömas.
  // Opt-in; snapshots och vanlig gallerinavigering är oförändrade.
  const inspectMode = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('inspect') === '1'
  const storeReady = useGameStore(s => s.game?.lastCompletedFixtureId === 'fx-granska')
  const seasonReady = useGameStore(s => (s.game?.seasonSummaries?.length ?? 0) > 0)
  const finalReady = useGameStore(s => !!s.game?.playoffBracket?.final)
  const storeGame = useGameStore(s => s.game)
  const retirementEventForScene = storeGame?.pendingEvents?.find(event => event.id === retirementEvent.id)
  const mecenatDinnerEventForScene = storeGame?.pendingEvents?.find(event => event.id === mecenatDinnerEvent.id)

  // Seed the store so all screens that call useGameStore() work.
  // Detta låg tidigare i useMemo och anropade useGameStore.setState() UNDER
  // render — React varnade på alla Portal-devscener. useLayoutEffect kör
  // seedningen efter renderfasen men före paint; seededScene-gaten nedan gör
  // att inget barn hinner rendera mot föregående/null game (och bevarar därmed
  // skyddet mot "Rendered more hooks" som den gamla lösningen försökte ge).
  useLayoutEffect(() => {
    const g = scene === 'cup-victory' ? cupGame
      : scene === 'sm-victory' ? smGame
      : scene === 'season-arc' ? arcGame
      : scene === 'efterklang' ? efterklangGame
      : scene === 'squad' || scene === 'portal' || scene === 'tranare' ? squadGame
      : scene === 'board-a' ? boardGameA
      : scene === 'board-b' ? boardGameB
      : scene === 'board-c' ? boardGameC
      : scene === 'stillness' ? stillnessGame
      : scene === 'granska' ? granskaGame
      : scene === 'granska-level3' ? granskaLevel3Game
      : scene === 'granska-cup' ? granskaCupGame
      : scene === 'granska-cup-final' ? granskaCupFinalGame
      : scene === 'granska-slutspel' ? granskaPlayoffGame
      : scene === 'granska-sm-final' ? granskaSmFinalGame
      : scene === 'granska-avsked' ? granskaFarewellGame
      : scene === 'season-a' ? seasonGameA
      : scene === 'season-b' ? seasonGameB
      : scene === 'season-c' ? seasonGameC
      : scene === 'tabell' ? granskaGame
      : scene === 'season-header' ? seasonHeaderGame
      : scene === 'season-noplayoffs' ? seasonNoPlayoffsGame
      : scene === 'season-fired' ? seasonFiredGame
      : scene === 'season-share' ? seasonShareGame
      : scene === 'sommaren-s2' ? sommarenS2Game
      : scene === 'sommaren-titelforsvarare' ? sommarenTitelforsvarareGame
      : scene === 'sommaren-tomt' ? sommarenTomtGame
      : scene === 'sommaren-siffra' ? sommarenSiffraGame
      : scene === 'transfers-closed' ? transfersClosedGame
      : scene === 'transfers-open-nobids' ? transfersOpenNoBidsGame
      : scene === 'transfers-onebid' ? transfersOneBidGame
      : scene === 'transfers-multibids' ? transfersMultiBidsGame
      : scene === 'finalhelg' ? finalhelgGame
      : scene === 'arrival' || scene === 'squad-trupp' || scene === 'annandagen' ? squadGame
      : scene === 'trupp-blandat' ? truppBlandatGame
      : scene === 'trupp-kris' ? truppKrisGame
      : scene === 'lineup-empty' ? lineupEmptyGame
      : scene === 'lineup-filled' ? lineupFilledGame
      : scene === 'match-live' ? matchLiveGame
      : scene === 'navgate-laddning-band' ? matchLaddningBandGame
      : scene === 'portal-tom' ? portalTomGame
      : scene === 'portal-normal' ? portalNormalGame
      : scene === 'portal-full' ? portalFullGame
      : scene === 'portal-grind' ? portalGrindGame
      : scene === 'portal-facility-completed' ? portalFacilityCompletedGame
      : scene === 'portal-bid-single' ? portalBidSingleGame
      : scene === 'portal-bid-multi' ? portalBidMultiGame
      : scene === 'portal-month-decisions' ? portalMonthDecisionsGame
      : scene === 'sponsor-motbud' ? sponsorMotbudGame
      : scene === 'club-fresh' ? clubFreshGame
      : scene === 'club-established' ? clubEstablishedGame
      : scene === 'taktik' ? taktikGame
      : scene === 'event-overlay' || scene === 'event-overlay-breakpoint' || scene === 'press-conference' || scene === 'decision-modes' ? granskaGame
      : scene === 'primary-smfinal-vs-deadline' ? primarySmfinalVsDeadlineGame
      : scene === 'primary-event-vs-farewell' ? primaryEventVsFarewellGame
      : scene === 'halftime-summary' ? portalGame
      : scene === 'bygget' || scene === 'bygget-avveckling' ? facilityGame
      : scene === 'game-over' || scene === 'game-over-historik' ? gameOverGame
      : scene === 'callup-modal' ? callupGame
      : scene === 'playoff-intro' ? playoffIntroGame
      : scene === 'qf-summary' ? qfSummaryGame
      : scene === 'champion' ? championGame
      : scene === 'contract-demands' ? contractDemandsGame
      : scene === 'career-break' ? careerBreakGame
      : scene === 'inbox' ? inboxGame
      : scene === 'sim-summary' ? simSummaryGame
      : scene === 'hall-provning' ? hallProvningGame
      : scene === 'valet' ? valetGame
      : scene === 'journalist-relationship' ? journalistSceneGame
      : scene === 'season-signature-reveal' ? seasonSignatureGame
      : scene === 'coffee-room' || scene === 'cup-intro' || scene === 'sunday-training' ? squadGame
      : scene === 'scouting' ? transfersOpenNoBidsGame
      : scene === 'tilltrade' ? tilltradeGame
      : scene === 'board-patience-minimal' ? boardPatienceWarningGame
      : scene === 'next-match-derby' ? nextMatchDerbyGame
      : scene === 'next-match-annandagen' ? nextMatchAnnandagenGame
      : scene === 'manager-fired-redirect' ? gameOverGame
      : scene === 'corner-interaction' || scene === 'penalty-interaction' || scene === 'counter-interaction'
        || scene === 'free-kick-interaction' || scene === 'phase-overlay' || scene === 'bid-modal'
        || scene === 'renew-contract-modal' || scene === 'ceremony-sm-final' || scene === 'ceremony-cup-final' ? squadGame
      : scene === 'ceremony-retirement' ? retirementCeremonyGame
      : scene === 'mecenat-dinner' ? mecenatDinnerGame
      : scene === 'intro-sequence' || scene === 'name-input' || scene === 'klubbparm' ? squadGame
      : portalGame
    const roundSummaryForScene =
      scene === 'granska' || scene === 'granska-level3' ? granskaRoundSummary
      : scene === 'granska-cup' ? granskaCupRoundSummary
      : scene === 'granska-cup-final' ? granskaCupFinalRoundSummary
      : scene === 'granska-slutspel' ? granskaPlayoffRoundSummary
      : scene === 'granska-sm-final' ? granskaSmFinalRoundSummary
      : scene === 'granska-avsked' ? granskaFarewellRoundSummary
      : null
    useGameStore.setState({ game: g, roundSummary: roundSummaryForScene } as never)
    setSeededScene(scene)
  }, [scene])

  // Vid första mount och scenbyte: låt layout-effekten installera rätt store-
  // fixture innan någon produktskärm monteras. Effekten kör före paint, så
  // detta skapar ingen synlig mellanbild i galleriet eller snapshots.
  if (seededScene !== scene) return null

  return (
    // SKAL-REGEL (2026-08-12): #root är overflow:hidden (global.css) — riktiga
    // skärmar hanterar sitt eget interna scroll-flöde, men DevScenesScreen
    // gjorde det aldrig. Utan egen overflow-container kapas document.body/
    // documentElement.scrollHeight vid viewportens höjd, och Playwright måste
    // tvinga fram scroll förbi den gränsen för att fånga högt innehåll — en
    // körväg som inte är pålitlig. height:100vh + overflowY:auto ger skalet
    // sitt EGET scroll-sammanhang (som riktiga skärmar redan har), så normal
    // scroll-och-stitch fungerar utan specialfall.
    <div style={{ background: '#080808', height: '100vh', overflowY: 'auto' }}>
      {/* SKAL-REGEL (2026-08-12, se CLAUDE.md): dev-scenskalet får inte påverka det
          som fotograferas. Två separata regler följer av det:
          1. zIndex UNDER --z-modal (300), aldrig över — ett skal-element ska
             aldrig kunna dölja produktionens egna modaler (hände med EventOverlay/
             PressConferenceScene när navet låg på 999).
          2. position:sticky stängs av under capture (html.capture-mode, satt av
             Playwright-testerna innan screenshot) — sticky-element återfäster sig
             i toppen av VARJE scroll-steg när Playwright stitchar en element-
             screenshot som är högre än viewporten, vilket läcker nav-text in i
             capturen. Kvar som sticky i vanlig dev-användning (bra UX vid manuell
             genombläddring), bara neutraliserad vid automatiserad capture. */}
      <style>{'html.capture-mode [data-dev-nav] { position: static !important; }'}</style>
      <div
        data-dev-nav
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: '#111', borderBottom: '1px solid #2a2a2a',
          padding: '6px 12px', display: inspectMode ? 'none' : 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 9, letterSpacing: '2px', color: '#555', textTransform: 'uppercase', marginRight: 4 }}>
          DEV GALLERY
        </span>
        {SCENES.map(s => (
          <button
            key={s.id}
            onClick={() => setScene(s.id)}
            style={{
              background: s.id === scene ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: `1px solid ${s.id === scene ? '#555' : '#2a2a2a'}`,
              borderRadius: 4, color: s.id === scene ? '#e0e0e0' : '#666',
              fontSize: 11, padding: '4px 10px', cursor: 'pointer',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Scene output — 375 px mobile viewport ── */}
      <div data-scene-content style={{ maxWidth: contentWidth, margin: '0 auto' }}>

        {scene === 'cup-victory' && (
          <CupFinalVictoryScene game={cupGame} onComplete={() => {}} />
        )}

        {scene === 'sm-victory' && (
          <SMFinalVictoryScene game={smGame} onComplete={() => {}} />
        )}

        {scene === 'season-arc' && (
          <div style={{ padding: '20px 0' }}>
            <SeasonArcCard game={arcGame} />
          </div>
        )}

        {scene === 'portal-cards' && (
          <div
            style={{
              background: 'var(--bg-portal-surface)',
              minHeight: 'calc(100vh - 40px)',
              padding: '20px 12px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <TabellSecondary game={portalGame} />
              <div
                style={{
                  background: 'var(--bg-portal-surface)',
                  border: '1px solid var(--bg-leather)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <FormStatusMinimal game={portalGame} />
              </div>
            </div>
          </div>
        )}

        {scene === 'efterklang' && (
          <div style={{ padding: '20px 12px', background: 'var(--bg-portal-surface)', minHeight: 'calc(100vh - 40px)' }}>
            <EfterklangSecondary game={efterklangGame} />
            <div style={{ marginTop: 28, fontSize: 8, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              ⬩ economicScar — resolutions-medveten efterdyning
            </div>
            {efterklangCrisisVariants.map(v => (
              <div key={v.label} style={{ marginTop: 14 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 6 }}>{v.label}</div>
                <EfterklangSecondary game={v.game} />
              </div>
            ))}
          </div>
        )}

        {(scene === 'miljoheader-karlsborg' || scene === 'miljoheader-rogle') && (() => {
          // Fallback-rendering (bruksort-header.jpg finns inte än): säsongstonad gradient +
          // klimateArchetype-tint + ClubBadge-vattenstämpel + dev-stämpel. Samma datum (djup
          // vinter) för båda → skillnaden är ren per-klubb-tint (arctic mörk/blå vs scanian mild/ljus).
          const club = scene === 'miljoheader-karlsborg'
            ? { id: 'club_karlsborg', name: 'Karlsborg' }
            : { id: 'club_rogle', name: 'Rögle' }
          return (
            <div style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 40px)' }}>
              <MiljoHeader date="2027-01-20" club={club} mode="portal" />
              <div style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                ⬩ Vardagskropp under bandet (kort i ljust papper). Bandet är "vyn ut".
              </div>
              <MiljoHeader date="2027-01-20" club={club} mode="inner" />
            </div>
          )
        })()}

        {scene === 'squad' && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <SquadScreen />
          </div>
        )}

        {scene === 'portal' && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <PortalScreen />
          </div>
        )}
        {scene === 'halftime-summary' && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <HalfTimeSummaryScreen />
          </div>
        )}
        {(scene === 'portal-tom' || scene === 'portal-normal' || scene === 'portal-full' || scene === 'portal-grind'
          || scene === 'portal-facility-completed'
          || scene === 'portal-bid-single' || scene === 'portal-bid-multi'
          || scene === 'portal-month-decisions' || scene === 'sponsor-motbud'
          || scene === 'primary-smfinal-vs-deadline' || scene === 'primary-event-vs-farewell') && (
          <div style={{ height: '1400px', overflow: 'hidden', position: 'relative' }}>
            <PortalScreen />
          </div>
        )}

        {/* Full-täcknings-scener (audit-spec task #1) */}
        {scene === 'tabell' && storeReady && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <TabellScreen />
          </div>
        )}
        {(scene === 'season-header' || scene === 'season-noplayoffs' || scene === 'season-fired' || scene === 'season-share') && seasonReady && (
          <div style={{ height: '812px', overflow: 'auto', position: 'relative' }}>
            <SeasonSummaryScreen />
          </div>
        )}
        {scene === 'club-selection' && (
          <div style={{ height: '844px', overflow: 'hidden', position: 'relative' }}>
            <ClubSelectionScreen managerNameOverride="Testtränaren" offerSeed={42} />
          </div>
        )}
        {scene === 'callup-modal' && (
          <div style={{ height: '844px', overflow: 'hidden', position: 'relative', background: 'var(--bg-portal)' }}>
            <CallupModal game={callupGame} />
          </div>
        )}
        {scene === 'playoff-intro' && (
          <div style={{ height: '844px', overflow: 'hidden', position: 'relative' }}>
            <PlayoffIntroScreen />
          </div>
        )}
        {scene === 'qf-summary' && (
          <div style={{ height: '844px', overflow: 'hidden', position: 'relative' }}>
            <QFSummaryScreen />
          </div>
        )}
        {scene === 'champion' && (
          <div style={{ height: '844px', overflow: 'hidden', position: 'relative' }}>
            <ChampionScreen />
          </div>
        )}
        {scene === 'contract-demands' && (
          <div style={{ height: '844px', overflow: 'hidden', position: 'relative' }}>
            <SeasonContractDemandsScreen />
          </div>
        )}
        {scene === 'career-break' && (
          <div style={{ height: '844px', overflow: 'hidden', position: 'relative' }}>
            <CareerBreakScreen />
          </div>
        )}
        {scene === 'inbox' && (
          <div style={{ height: '844px', overflow: 'hidden', position: 'relative', background: 'var(--bg)' }}>
            <InboxScreen />
          </div>
        )}
        {scene === 'sim-summary' && (
          <div style={{ height: '844px', overflow: 'hidden', position: 'relative' }}>
            <SimSummaryDevScene />
          </div>
        )}
        {scene === 'hall-provning' && (
          <div style={{ height: '844px', overflow: 'hidden', position: 'relative' }}>
            <HallProvningScreen />
          </div>
        )}
        {scene === 'coffee-room' && (
          <CoffeeRoomScene game={squadGame} onComplete={() => {}} />
        )}
        {scene === 'valet' && (
          <ValetScene game={valetGame} onComplete={() => {}} />
        )}
        {scene === 'journalist-relationship' && (
          <JournalistRelationshipScene game={journalistSceneGame} onComplete={() => {}} />
        )}
        {scene === 'cup-intro' && (
          <CupIntroScene game={squadGame} onComplete={() => {}} />
        )}
        {scene === 'sunday-training' && (
          <SundayTrainingScene game={squadGame} onComplete={() => {}} />
        )}
        {scene === 'season-signature-reveal' && (
          <SeasonSignatureRevealScene game={seasonSignatureGame} onComplete={() => {}} />
        )}
        {scene === 'scouting' && (
          <div style={{ minHeight: '844px', background: 'var(--bg)', padding: '16px 12px' }}>
            <ScoutingDevScene />
          </div>
        )}
        {scene === 'intro-sequence' && (
          <div style={{ height: '844px', overflow: 'hidden', position: 'relative' }}>
            <IntroSequence />
          </div>
        )}
        {scene === 'tilltrade' && (
          <div style={{ height: '844px', overflow: 'hidden', position: 'relative' }}>
            <TilltradeScreen />
          </div>
        )}
        {scene === 'name-input' && (
          <div style={{ height: '844px', overflow: 'hidden', position: 'relative' }}>
            <NameInputScreen />
          </div>
        )}
        {scene === 'klubbparm' && (
          <KlubbparmOverlay game={squadGame} onClose={() => {}} />
        )}
        {scene === 'ceremony-retirement' && storeGame && retirementEventForScene && (
          <CeremonyRetirement game={storeGame} event={retirementEventForScene} />
        )}
        {scene === 'corner-interaction' && (
          <CornerInteraction data={interactionCornerData} outcome={null} onChoose={() => {}} practice />
        )}
        {scene === 'penalty-interaction' && (
          <PenaltyInteraction data={interactionPenaltyData} outcome={null} onChoose={() => {}} />
        )}
        {scene === 'counter-interaction' && (
          <CounterInteraction data={interactionCounterData} outcome={null} onChoose={() => {}} />
        )}
        {scene === 'free-kick-interaction' && (
          <FreeKickInteraction data={interactionFreeKickData} outcome={null} onChoose={() => {}} />
        )}
        {scene === 'phase-overlay' && (
          <PhaseOverlay phase="overtime" onContinue={() => {}} />
        )}
        {scene === 'bid-modal' && (
          <BidModal
            player={interactionPlayer}
            managedClub={{ transferBudget: 400_000, finances: 650_000 }}
            rivalry={{ name: 'Bollnäs GoIF', intensity: 2 }}
            onClose={() => {}}
            onConfirm={() => {}}
          />
        )}
        {scene === 'renew-contract-modal' && (
          <RenewContractModal
            player={interactionPlayer}
            currentSeason={squadGame.currentSeason}
            minSalary={interactionPlayer.salary + 1_000}
            onClose={() => {}}
            onConfirm={() => {}}
          />
        )}
        {scene === 'ceremony-sm-final' && (
          <CeremonySmFinal
            slide={2}
            homeClubName="Edsbyn BK"
            awayClubName="Bollnäs GoIF"
            homeScore={5}
            awayScore={3}
            fixture={smFinalFixture as never}
            managedClubId={HOME_ID}
            season={squadGame.currentSeason}
            steps={[]}
            homeLineup={ceremonyHomeLineup}
            awayLineup={ceremonyAwayLineup}
            players={squadGame.players}
            onAdvance={() => {}}
            onNavigate={() => {}}
          />
        )}
        {scene === 'ceremony-cup-final' && (
          <CeremonyCupFinal
            slide={2}
            homeClubName="Edsbyn BK"
            awayClubName="Bollnäs GoIF"
            homeScore={5}
            awayScore={3}
            fixture={cupFinalFixture as never}
            managedClubId={HOME_ID}
            season={squadGame.currentSeason}
            clubs={squadGame.clubs}
            cupBracket={undefined}
            onNavigate={() => {}}
          />
        )}
        {scene === 'manager-fired-redirect' && <ManagerFiredRedirectDevScene />}
        {scene === 'board-patience-minimal' && (
          <div className="card--portal" style={{ minHeight: '844px', background: 'var(--bg-portal-surface)', padding: '28px 16px' }}>
            <div className="card-sharp" style={{ background: 'var(--bg-portal-surface)', padding: '16px 12px' }}>
              <BoardPatienceMinimal game={boardPatienceWarningGame} />
            </div>
          </div>
        )}
        {(scene === 'next-match-derby' || scene === 'next-match-annandagen') && (
          <div style={{ minHeight: '844px', background: 'var(--bg-portal)', padding: '28px 12px' }}>
            <NextMatchPrimary game={scene === 'next-match-derby' ? nextMatchDerbyGame : nextMatchAnnandagenGame} />
          </div>
        )}
        {(scene === 'sommaren-s2' || scene === 'sommaren-titelforsvarare' || scene === 'sommaren-tomt' || scene === 'sommaren-siffra') && (
          <div style={{ height: '812px', overflow: 'auto', position: 'relative' }}>
            <SeasonTransitionScene />
          </div>
        )}
        {(scene === 'transfers-closed' || scene === 'transfers-open-nobids' || scene === 'transfers-onebid' || scene === 'transfers-multibids') && (
          <div style={{ height: '812px', overflow: 'auto', position: 'relative' }}>
            <TransfersScreen />
          </div>
        )}
        {scene === 'finalhelg' && finalReady && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <PortalScreen />
          </div>
        )}
        {scene === 'arrival' && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <ArrivalScene />
          </div>
        )}
        {scene === 'squad-trupp' && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <SquadScreen />
          </div>
        )}
        {(scene === 'trupp-blandat' || scene === 'trupp-kris') && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <SquadScreen />
          </div>
        )}
        {(scene === 'lineup-empty' || scene === 'lineup-filled') && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <MatchScreen />
          </div>
        )}
        {scene === 'match-live' && matchLiveLocationState && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <MatchLiveDevScene locationState={matchLiveLocationState} />
          </div>
        )}
        {/* Mobil speltest-audit (2026-08-17), tap-target-grinden: till skillnad
            från alla andra scener ovan renderas BottomNav HÄR, äkta, sida vid
            sida med produktkomponenten — inte utelämnad. MatchLaddningScene/Band
            är position:fixed/inset:0 och positionerar sig mot HELA viewporten
            (som i produktion), så wrappern har ingen transform som skulle
            kontainera dem — 390×844 är den verkliga mätningen, ingen konstgjord
            höjd. Detta är den ENDA dev-scenen som gör detta; ingen av de
            övriga 76 kan användas för nav-kollisionsmätning, se rapport. */}
        {scene === 'navgate-laddning-band' && (
          <div style={{ height: '844px', overflow: 'hidden', position: 'relative' }}>
            <MatchScreen />
            <BottomNav />
          </div>
        )}
        {scene === 'bygget' && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <FacilityScreen />
          </div>
        )}
        {/* H1-regressionsscen: samma mönster som navgate-laddning-band ovan —
            riktig BottomNav monterad bredvid produktkomponenten, äkta 390×844.
            Sheeten öppnas av testet självt med RIKTIGA klick (Bygg ut → nod),
            inte via en fixture som redan har selectedNodeId satt — FacilityScreen
            äger det state:t lokalt och tar inga dev-props. */}
        {scene === 'bygget-avveckling' && (
          <div style={{ height: '844px', overflow: 'hidden', position: 'relative' }}>
            <FacilityScreen />
            <BottomNav />
          </div>
        )}
        {/* Avskedsvägen (Jacobs order 2026-08-24) — ingen BottomNav: GameOverScreen/
            HistoryScreen ligger utanför GameShell (GameGuard-blocket, AppRouter.tsx),
            produktionen visar aldrig nav på dessa rutter. */}
        {scene === 'game-over' && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <GameOverScreen />
          </div>
        )}
        {scene === 'game-over-historik' && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <HistoryScreen snapshot={gameOverGame} />
          </div>
        )}
        {scene === 'annandagen' && (
          // transform → containing block, så AnslagOverlays position:fixed ramas in i scenen
          // (annars escapar overlayn till viewporten och fångas dåligt i fullPage-screenshot).
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative', transform: 'translateZ(0)' }}>
            <AnslagOverlay game={squadGame} anslagKey={'league_midwinter' as never} onDismiss={() => {}} />
          </div>
        )}

        {scene === 'tranare' && (
          <div style={{ background: 'var(--bg)', padding: '12px', minHeight: '812px' }}>
            <TranareTab game={squadGame} />
          </div>
        )}

        {scene === 'board-a' && <BoardMeetingScene game={boardGameA} onComplete={() => {}} />}
        {scene === 'board-b' && <BoardMeetingScene game={boardGameB} onComplete={() => {}} />}
        {scene === 'board-c' && <BoardMeetingScene game={boardGameC} onComplete={() => {}} />}

        {scene === 'stillness' && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <SquadScreen />
          </div>
        )}

        {(scene === 'granska' || scene === 'granska-level3' || scene === 'granska-cup' || scene === 'granska-cup-final'
          || scene === 'granska-slutspel' || scene === 'granska-sm-final' || scene === 'granska-avsked') && storeReady && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <GranskaScreen />
          </div>
        )}

        {(scene === 'club-fresh' || scene === 'club-established') && (
          <div style={{ height: '812px', overflow: 'hidden', position: 'relative' }}>
            <ClubScreen />
          </div>
        )}

        {scene === 'playercard' && (
          <div style={{ background: 'var(--bg)', minHeight: '812px', padding: '12px' }}>
            {([
              ['Över snitt → win', [{ rating: 5.8, result: 'O' as const, opponentShortName: 'BGF' }, { rating: 6.2, result: 'V' as const, opponentShortName: 'EBK' }, { rating: 6.0, result: 'O' as const, opponentShortName: 'VÄS' }, { rating: 7.1, result: 'V' as const, opponentShortName: 'SAN' }, { rating: 7.8, result: 'V' as const, opponentShortName: 'BOL' }]],
              ['Under snitt → loss', [{ rating: 6.5, result: 'V' as const, opponentShortName: 'BGF' }, { rating: 6.0, result: 'O' as const, opponentShortName: 'EBK' }, { rating: 5.8, result: 'F' as const, opponentShortName: 'VÄS' }, { rating: 5.2, result: 'F' as const, opponentShortName: 'SAN' }, { rating: 4.9, result: 'F' as const, opponentShortName: 'BOL' }]],
              ['Neutral → subtle', [{ rating: 6.2, result: 'O' as const, opponentShortName: 'BGF' }, { rating: 5.9, result: 'F' as const, opponentShortName: 'EBK' }, { rating: 6.1, result: 'V' as const, opponentShortName: 'VÄS' }, { rating: 6.0, result: 'O' as const, opponentShortName: 'SAN' }, { rating: 6.0, result: 'O' as const, opponentShortName: 'BOL' }]],
            ] as const).map(([label, ratings]) => (
              <div key={label} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 9, letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
                <PlayerCard player={devPlayers[10] as never} clubName="Edsbyn BK" isOwned currentSeason={8} recentRatings={ratings as never} game={portalGame} />
              </div>
            ))}
          </div>
        )}

        {(scene === 'season-a' || scene === 'season-b' || scene === 'season-c') && (() => {
          const sumMap = { 'season-a': seasonSumChampion, 'season-b': seasonSumTopThree, 'season-c': seasonSumMidtable }
          const sum = sumMap[scene as 'season-a' | 'season-b' | 'season-c']
          const isChamp = sum.playoffResult === 'champion' || sum.cupResult === 'winner'
          const posVariant = isChamp ? 'gold' : sum.finalPosition <= 3 ? 'win' : 'subtle'
          const formStroke = sum.formTrend === 'improving' ? 'success' : sum.formTrend === 'declining' ? 'danger' : 'accent'
          return (
            <div style={{ background: 'var(--bg)', padding: '20px 16px', minHeight: '812px' }}>
              <p style={{ fontSize: 9, letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                {scene === 'season-a' ? 'Mästare → gold' : scene === 'season-b' ? 'Topp 3 → win' : 'Mittfält → subtle'}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <ScoreBlockComp score={`${sum.finalPosition}.`} variant={posVariant} label="plats" />
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{sum.points} poäng</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <ScoreBlockComp score={String(sum.wins)} variant="win" label="V" compact />
                <ScoreBlockComp score={String(sum.draws)} variant="draw" label="O" compact />
                <ScoreBlockComp score={String(sum.losses)} variant="loss" label="F" compact />
              </div>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px' }}>
                <p style={{ fontSize: 9, letterSpacing: '1.5px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>POÄNGKURVA</p>
                <SparklineComp points={sum.roundPoints} stroke={formStroke} height={40} areaFill />
              </div>
            </div>
          )
        })()}

        {scene === 'ekonomi' && (
          <div style={{ background: 'var(--bg)', minHeight: '812px', padding: '12px' }}>
            {([['Lugn säsong (stigande)', ekonomiCalmClub, ekonomiCalmGame], ['Krissäsong (fallande)', ekonomiCrisisClub, ekonomiCrisisGame]] as const).map(([label, c, g]) => (
              <div key={label} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 9, letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
                <EkonomiTab club={c} game={g} seekSponsor={() => ({ success: false })} activateCommunity={() => ({ success: false })} setTransferBudget={() => {}} buyScoutRounds={() => {}} />
              </div>
            ))}
          </div>
        )}

        {scene === 'upptakt' && (
          <div style={{ background: 'var(--bg-portal)', minHeight: '812px', padding: '14px 0' }}>
            {([['Säkrat', upptaktSakrat], ['Farozon', upptaktFarozon], ['Bottenstrid', upptaktBottenstrid]] as const).map(([label, g]) => (
              <div key={label} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 9, letterSpacing: '2px', color: 'var(--text-muted)', textTransform: 'uppercase', padding: '0 14px 6px' }}>{label}</div>
                <PortalUpptakt game={g} />
                <div style={{ padding: '0 14px' }}><NextMatchPrimary game={g} /></div>
              </div>
            ))}
          </div>
        )}

        {/* Spår A — MatchLive-ytor (deterministisk fingerad state) */}
        {scene === 'momentumbar' && (() => {
          const devStep = {
            step: 50, minute: 67, homeScore: 2, awayScore: 2,
            shotsHome: 9, shotsAway: 7, cornersHome: 4, cornersAway: 3, intensity: 'high',
            homeInitiative: 0.63, postBreakUrgency: 0, postEqualizerMomentum: 0.5,
            postEqualizerTeam: 'home', lateFactor: 0.5, matchProfile: 'open_game', events: [],
          } as unknown as MatchStep
          const history = [0.5, 0.52, 0.48, 0.45, 0.5, 0.58, 0.63]
          return (
            <div style={{ background: 'var(--bg-deepdark)', minHeight: '812px', padding: '40px 12px' }}>
              <MomentumBar step={devStep} homeShort="EBK" awayShort="BGF" history={history} />
            </div>
          )
        })()}

        {scene === 'tacticmodal' && (
          <div style={{ background: 'var(--bg-deepdark)', minHeight: '812px', transform: 'translateZ(0)', position: 'relative' }}>
            <TacticChangeModal changesLeft={2} onChoose={() => {}} onClose={() => {}} />
          </div>
        )}

        {scene === 'submodal' && (() => {
          const P = PlayerPosition
          const starters = [
            makePlayer('s1', 'Erik', 'Lund', 27, P.Goalkeeper, 68, { fitness: 82 }),
            makePlayer('s2', 'Johan', 'Berg', 24, P.Defender, 64, { fitness: 71 }),
            makePlayer('s3', 'Anton', 'Sjö', 29, P.Half, 66, { fitness: 58 }),
            makePlayer('s4', 'Nils', 'Holm', 22, P.Forward, 70, { fitness: 44 }),
          ] as never[]
          const bench = [
            makePlayer('b1', 'Olle', 'Ek', 20, P.Forward, 61, { fitness: 90 }),
            makePlayer('b2', 'Sven', 'Dahl', 31, P.Half, 63, { fitness: 88 }),
          ] as never[]
          return (
            <div style={{ background: 'var(--bg-deepdark)', minHeight: '812px', transform: 'translateZ(0)', position: 'relative' }}>
              <SubstitutionModal starters={starters} bench={bench} onConfirm={() => {}} onClose={() => {}} />
            </div>
          )
        })()}

        {scene === 'spakb' && (
          <div style={{ background: 'var(--bg-deepdark)', minHeight: '812px', padding: '40px 0' }}>
            <SentValCard minute={79} onPush={() => {}} onShut={() => {}} />
          </div>
        )}

        {scene === 'taktik' && <TaktikScreen />}

        {/* AUDIT DEL 4 (2026-08-12) — baseline-täckning: EventOverlay tar emot
            event via prop (samma väg GameShell använder), ingen global
            event-kö-drift behövs. Kritiska events blockeras annars av
            isMatchScreen — /dev/scenes matchar ingen av de rutterna. */}
        {scene === 'event-overlay' && (
          <div style={{ position: 'relative', minHeight: 500 }}>
            <EventOverlay event={granskaPendingEvents[0]} />
          </div>
        )}

        {scene === 'event-overlay-breakpoint' && (
          <div style={{ position: 'relative', minHeight: 500 }}>
            <EventOverlay event={breakpointEvent} />
          </div>
        )}

        {scene === 'mecenat-dinner' && mecenatDinnerEventForScene && (
          <div style={{ position: 'relative', minHeight: 500 }}>
            <EventOverlay event={mecenatDinnerEventForScene} />
          </div>
        )}

        {scene === 'decision-modes' && (
          <div data-decision-mode-gallery style={{ position: 'fixed', inset: 0, zIndex: 51, overflowY: 'auto', background: 'var(--bg)', padding: '20px 14px' }}>
            {([
              { mode: 'notis' as const, label: 'Notis', title: 'En röst från läktaren', body: 'Supportern vill att laget visar mer tålamod.' },
              { mode: 'dilemma' as const, label: 'Dilemma', title: 'Två vägar framåt', body: 'Båda alternativen hjälper klubben men kostar något.' },
              { mode: 'brytpunkt' as const, label: 'Brytpunkt', title: 'Klubben måste välja', body: 'Beslutet förändrar förutsättningarna för resten av säsongen.' },
            ]).map(item => (
              <DecisionCard
                key={item.mode}
                mode={item.mode}
                label={item.label}
                title={item.title}
                body={item.body}
                resolved={false}
                choices={[
                  { id: 'left', label: 'Välj den ena vägen', effect: { type: 'noOp' as const } },
                  { id: 'right', label: 'Välj den andra vägen', effect: { type: 'noOp' as const } },
                ]}
                onChoose={() => {}}
              />
            ))}
          </div>
        )}

        {scene === 'press-conference' && (
          <div style={{ position: 'relative', minHeight: 500 }}>
            <PressConferenceScene
              event={{
                id: 'dev-press-1', type: 'pressConference', resolved: false,
                title: 'Presskonferens — Britta Sandström, Gefle Dagblad',
                body: '"Ni vann stort men spelade passivt sista tio minuterna — medvetet val eller tapp av tempo?"',
                choices: [
                  { id: 'confident', label: 'Medvetet — vi förvaltade ledningen', effect: { type: 'pressResponse' } },
                  { id: 'honest', label: 'Ärligt, vi tappade greppet lite', effect: { type: 'pressResponse' } },
                ],
              } as never}
              journalist={{
                name: 'Britta Sandström', outlet: 'Gefle Dagblad', persona: 'sceptical',
                style: 'neutral', relationship: 58, memory: [], pressRefusals: 0,
              } as never}
              onChoice={() => {}}
            />
          </div>
        )}
      </div>
      {navGate && <BottomNav />}
    </div>
  )
}
