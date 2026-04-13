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
  Shot = 'shot',
  Corner = 'corner',
  Penalty = 'penalty',
  YellowCard = 'yellowCard',
  RedCard = 'redCard',
  Injury = 'injury',
  Save = 'save',
  Substitution = 'substitution',
  Suspension = 'suspension',
  FullTime = 'fullTime',
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
  ReputationMilestone = 'reputationMilestone',
  TransferDeadline = 'transferDeadline',
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
