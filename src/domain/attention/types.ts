export type AttentionCategory =
  | 'match_preparation'
  // Reserverade för kandidater från Berättarens agenda. De får inte
  // genereras direkt ur SaveGame av Attention Engine.
  | 'calendar_anchor'
  | 'season_context'
  | 'narrative_return'

export type AttentionVoice = 'assistant' | 'club' | 'press' | 'season'

export type AttentionImportance = 'normal' | 'major'

export interface AttentionSource {
  kind: 'fixture' | 'standing' | 'rivalry' | 'ledger'
  id: string
}

/**
 * Minsta data som backend behöver bära tillbaka efter en bekräftad narrativ
 * leverans. `post` identifierar den kanoniska liggarposten; `chronology`
 * låser när pushytan faktiskt valde den, även om spelaren öppnar appen senare.
 */
export interface NarrativePostReference {
  post: {
    type: import('../entities/Narrative').EventLedgerType
    semanticKey: string
    season: number
    matchday: number
  }
  chronology: {
    season: number
    matchday: number
  }
}

export interface OpenLoop {
  id: string
  type: AttentionCategory
  subjectId: string
  stateVersion: string
  createdAt: string
  lastEvaluatedAt: string
  unresolved: string[]
  context: Record<string, string | number | boolean>
  sources: AttentionSource[]
}

export interface NotificationCandidate {
  id: string
  openLoopId: string
  category: AttentionCategory
  voice: AttentionVoice
  importance: AttentionImportance
  stateVersion: string
  title: string
  body: string
  deepLink: string
  dedupeKey: string
  availableAfter: string
  expiresAt: string
  score: number
  sources: AttentionSource[]
  narrativePost?: NarrativePostReference
}

export interface NarrativeDeliveryReceipt {
  deliveryId: string
  saveId: string
  deliveredAt: string
  narrativePost: NarrativePostReference
}

export interface AttentionEvaluation {
  stateVersion: string
  evaluatedAt: string
  openLoops: OpenLoop[]
  candidates: NotificationCandidate[]
  badgeCount: number
}

export interface AttentionSnapshot extends AttentionEvaluation {
  schemaVersion: 1
  installationId: string
  saveId: string
  capturedAt: string
  timeZone: string
}

export type NotificationTelemetryEvent =
  | 'push_permission_prompted'
  | 'push_permission_granted'
  | 'push_permission_denied'
  | 'subscription_created'
  | 'subscription_removed'
  | 'snapshot_synced'
  | 'candidate_selected'
  | 'delivery_attempted'
  | 'delivery_succeeded'
  | 'delivery_failed'
  | 'push_received'
  | 'notification_clicked'
  | 'notification_opened'
  | 'app_opened'
  | 'meaningful_action'
