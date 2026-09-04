export enum PlayerPosition {
  Goalkeeper = 'goalkeeper',
  Defender = 'defender',
  Half = 'half',
  Midfielder = 'midfielder',
  Forward = 'forward',
}

export enum PlayerArchetype {
  TwoWaySkater = 'twoWaySkater',
  Playmaker = 'playmaker',
  Finisher = 'finisher',
  Dribbler = 'dribbler',
  DefensiveWorker = 'defensiveWorker',
  CornerSpecialist = 'cornerSpecialist',
  ReflexGoalkeeper = 'reflexGoalkeeper',
  PositionalGoalkeeper = 'positionalGoalkeeper',
  RawTalent = 'rawTalent',
}

export enum FixtureStatus {
  Scheduled = 'scheduled',
  Ready = 'ready',
  Completed = 'completed',
  Postponed = 'postponed',
}

export enum WeatherCondition {
  Clear = 'clear',
  Overcast = 'overcast',
  LightSnow = 'lightSnow',
  HeavySnow = 'heavySnow',
  Fog = 'fog',
  Thaw = 'thaw',
}

export enum IceQuality {
  Excellent = 'excellent',
  Good = 'good',
  Moderate = 'moderate',
  Poor = 'poor',
  Cancelled = 'cancelled',
}

export enum ClubExpectation {
  // H4 Heros (Jacobs dom 2026-08-25): Survive är en femte, LÄGRE tier än
  // AvoidBottom — för klubbar där premissen "det går inte att lyckas, bara
  // att hålla ut" är sann i kanon (bara Heros idag, se worldGenerator.ts).
  // Sistaplats räknas inte som misslyckande under Survive.
  Survive = 'survive',
  AvoidBottom = 'avoidBottom',
  MidTable = 'midTable',
  ChallengeTop = 'challengeTop',
  WinLeague = 'winLeague',
}

export enum ClubStyle {
  Defensive = 'defensive',
  Balanced = 'balanced',
  Attacking = 'attacking',
  Physical = 'physical',
  Technical = 'technical',
}

export enum MatchEventType {
  Goal = 'goal',
  Assist = 'assist',
  Shot = 'shot', // never emitted
  Corner = 'corner',
  Penalty = 'penalty',
  YellowCard = 'yellowCard', // never emitted
  Suspension = 'redCard',   // bandy tidsutvisning (4.5–9 min); string-värdet 'redCard' bevaras för save-kompatibilitet
  Injury = 'injury', // never emitted
  Save = 'save',
  Substitution = 'substitution',
  FullTime = 'fullTime', // never emitted
}

export enum InboxItemType {
  MatchResult = 'matchResult',
  Injury = 'injury',
  Suspension = 'suspension',
  TransferOffer = 'transferOffer',
  ContractExpiring = 'contractExpiring',
  YouthIntake = 'youthIntake',
  PlayerDevelopment = 'playerDevelopment',
  BoardFeedback = 'boardFeedback',
  Training = 'training',
  Playoff = 'playoff',
  Derby = 'derby',
  Recovery = 'recovery',
  ScoutReport = 'scoutReport',
  TransferBidReceived = 'transferBidReceived',
  TransferBidResult = 'transferBidResult',
  Media = 'media',
  Retirement = 'retirement',
  Community = 'community',
  YouthP17 = 'youthP17',
  LicenseReview = 'licenseReview',
  KommunBidrag = 'kommunBidrag',
  SponsorNetwork = 'sponsorNetwork',
  PatronInfluence = 'patronInfluence',
  MediaEvent = 'mediaEvent',
  Transfer = 'transfer',
  /** M17 (textaudit 2026-07-03): rykten (rumorService) delade tidigare typ
   *  med genomförda affärer (Transfer) → coffeeRoomServices soldItem-
   *  detektion tolkade ett rykte om en spelare i annan klubb som "vi sålde
   *  {name}". Egen typ håller isär rykte och avslutad affär. */
  TransferRumor = 'transferRumor',
  ReputationMilestone = 'reputationMilestone',
  TransferDeadline = 'transferDeadline',
  BandyLetter = 'bandyLetter',
  SchoolAssignment = 'schoolAssignment',
  EconomicCrisis = 'economicCrisis',
  Scandal = 'scandal',
  /** HIGH 11 (DOM_HIGH11_DASHBOARD_NIVAER_2026-08-29.md): utfallsraden för ett
   *  beslut som låg obesvarat i avbrottskön när säsongen tog slut — antingen
   *  ett tillämpat default-utfall eller en uttrycklig utrinning. Egen typ, inte
   *  BoardFeedback: "aldrig tyst" ska gå att hitta och räkna som sin egen sort. */
  DecisionRollover = 'decisionRollover',
}

export enum TrainingType {
  Skating = 'skating',
  BallControl = 'ballControl',
  Passing = 'passing',
  Shooting = 'shooting',
  Defending = 'defending',
  CornerPlay = 'cornerPlay',
  Physical = 'physical',
  Tactical = 'tactical',
  Recovery = 'recovery',
  MatchPrep = 'matchPrep',
}

export enum TrainingIntensity {
  Light = 'light',
  Normal = 'normal',
  Hard = 'hard',
  Extreme = 'extreme',
}

export enum TacticMentality {
  Defensive = 'defensive',
  Balanced = 'balanced',
  Offensive = 'offensive',
}

export enum TacticTempo {
  Low = 'low',
  Normal = 'normal',
  High = 'high',
}

/**
 * DOM_FORMATIONER_V2_2026-09-04.md: `press` togs bort som fält på `Tactic`
 * — höjdläget bärs nu av formationen (getHeightMode, Formation.ts). Enumen
 * lämnas kvar oanvänd (superseterad, inte borttagen) eftersom dussintals
 * äldre testfixturer fortfarande konstruerar `TacticPress.X` som RUNTIME-
 * värde (inte bara en typ) — dessa filer ligger utanför tsconfig.json:s
 * `include` (test-exkludering) så tsc fångar inte referensen, men ett
 * borttaget enum-VÄRDE kraschar dem ändå vid körning. Radera bara i en
 * dedikerad, egen städning av de filerna — inte som sidoeffekt här.
 */
export enum TacticPress {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
}

export enum TacticPassingRisk {
  Safe = 'safe',
  Mixed = 'mixed',
  Direct = 'direct',
}

export enum TacticWidth {
  Narrow = 'narrow',
  Normal = 'normal',
  Wide = 'wide',
}

export enum TacticAttackingFocus {
  Central = 'central',
  Wings = 'wings',
  Mixed = 'mixed',
}

export enum CornerStrategy {
  Safe = 'safe',
  Standard = 'standard',
  Aggressive = 'aggressive',
}

export enum PenaltyKillStyle {
  Passive = 'passive',
  Active = 'active',
  Aggressive = 'aggressive',
}

export enum PlayoffStatus {
  NotStarted = 'notStarted',
  QuarterFinals = 'quarterFinals',
  SemiFinals = 'semiFinals',
  Final = 'final',
  Completed = 'completed',
}

export enum PlayoffRound {
  QuarterFinal = 'quarterFinal',
  SemiFinal = 'semiFinal',
  Final = 'final',
}

export enum PendingScreen {
  SeasonSummary = 'season_summary',
  // A-H2b (DOM_AH2B_RETENTION_2026-08-28): säsongsövergångens samlade
  // lönekravsbeslut — visas mellan SeasonSummary och styrelsemötets scen
  // (board_meeting, pendingScene-systemet) NÄR det finns obemötta krav att
  // ta ställning till för den hanterade klubben. Se seasonEndProcessor.ts
  // (beräkning) och gameFlowActions.ts:s clearSeasonSummary (routing).
  ContractDemands = 'contract_demands',
  BoardMeeting = 'board_meeting',
  PreSeason = 'pre_season',
  HalfTimeSummary = 'half_time_summary',
  PlayoffIntro = 'playoff_intro',
  QFSummary = 'qf_summary',
}
