import type { GameEventType } from '../entities/GameEvent'

/**
 * A-M3 (SEXSÄSONGSAUDITEN 2026-08-26, SPÅR 2b): "Tekniska eventnycklar läcker
 * (playoffEvent, dayJobConflict, criticalEconomy…)."
 *
 * ROTORSAK: PortalQueueRail.tsx:s SOURCE_META täckte bara 8 av 49
 * GameEventType-värden och föll tillbaka på `sourceKey` — den råa camelCase-
 * strängen renderades då DIREKT som köns chip-text (PortalQueueRail.tsx:96,
 * `const label = meta?.label ?? sourceKey`). EventCardInline.tsx:s egen
 * getEventTypeLabel hade samma partiella täckning (17/49) men en redan-
 * generisk fallback ('📋 HÄNDELSE') — den läckte aldrig rått, men var inte
 * exhaustiv och dubblerade logiken (två källor för samma sak, se OPUS-regel
 * "EN SANNING, ETT STÄLLE").
 *
 * Denna fil är den enda sanningen framåt. `Record<GameEventType, ...>` gör
 * TS-kompilatorn till täckningsgrinden — en ny GameEventType-medlem utan
 * motsvarande rad här failar `npx tsc` direkt (samma disciplin som
 * contentContract.ts:s AssertNoMissingIds, fast här räcker Record-typen
 * ensam eftersom GameEventType redan är en sträng-literal-union).
 *
 * Etiketterna är korta, strukturella kategorinamn (ORTEN, EKONOMI, PRESS …)
 * — inte narrativ prosa. Per SVENSK TEXT-regeln (CLAUDE.md, "Code skriver
 * aldrig speltext") är dessa sektionslabels i exakt samma register som redan
 * godkända etiketter i kodbasen (EventCardInline.tsx:s tidigare switch,
 * PortalQueueRail.tsx:s SOURCE_META, granskaEventClassifier.ts:s
 * CRITICAL_GRANSKA_TYPES/PLAYER_TYPES/REACTION_TYPES-gruppering) — inte nya
 * berättande strängar. De 17 typer som redan hade en etikett (via
 * EventCardInline.tsx) har EXAKT samma icon+label här, för att inte ändra
 * något spelaren redan ser.
 */
export interface EventTypeLabel {
  icon: string
  label: string
}

export const EVENT_TYPE_LABELS: Record<GameEventType, EventTypeLabel> = {
  // ── Redan etiketterade (EventCardInline.tsx, oförändrade) ──
  communityEvent:       { icon: '🏘️', label: 'Orten' },
  supporterEvent:       { icon: '📣', label: 'Klacken' },
  starPerformance:      { icon: '⭐', label: 'Spelaren' },
  playerPraise:         { icon: '💬', label: 'Spelaren' },
  playerMediaComment:   { icon: '📰', label: 'Lokaltidningen' },
  captainSpeech:        { icon: 'Ⓒ', label: 'Kaptenen' },
  bandyLetter:          { icon: '✉️', label: 'Insändare' },
  academyEvent:         { icon: '🎓', label: 'Akademin' },
  refereeMeeting:       { icon: '⚖️', label: 'Domaren' },
  journalistExclusive:  { icon: '📰', label: 'Lokaltidningen' },
  politicianEvent:      { icon: '🏛️', label: 'Kommunen' },
  hallDebate:           { icon: '🏛️', label: 'Kommunen' },
  schoolAssignment:     { icon: '🎓', label: 'Skolan' },
  playoffEvent:         { icon: '🏆', label: 'Slutspelet' },
  retirementCeremony:   { icon: '🎖️', label: 'Avsked' },
  economicStress:       { icon: '💰', label: 'Ekonomi' },
  sponsorOffer:         { icon: '💼', label: 'Sponsor' },
  seasonGoalHalfway:    { icon: '🎯', label: 'Säsongsmålet' },

  // ── Tidigare ofyllda (32/49) — kategoriserade efter konstruktionsställe
  // (eventFactories.ts / patronEvents.ts / mecenatService.ts / politicianEvents.ts
  // / postAdvanceEvents.ts / granskaEventClassifier.ts:s PLAYER_TYPES-gruppering) ──
  transferBidReceived:  { icon: '🔄', label: 'Övergångar' },
  contractRequest:      { icon: '📝', label: 'Kontrakt' },
  playerUnhappy:        { icon: '💬', label: 'Spelaren' },
  pressConference:      { icon: '🎤', label: 'Press' },
  dayJobConflict:       { icon: '💼', label: 'Vardagsjobbet' },
  bidWar:               { icon: '🔄', label: 'Övergångar' },
  hesitantPlayer:       { icon: '💬', label: 'Spelaren' },
  patronEvent:          { icon: '🤝', label: 'Mecenat' },
  hallProcess:          { icon: '🏟️', label: 'Hallen' },
  licenseHandlingsplan: { icon: '🏛️', label: 'Kommunen' },
  kommunMote:           { icon: '🏛️', label: 'Kommunen' },
  gentjanst:            { icon: '🏛️', label: 'Kommunen' },
  icaMaxiEvent:         { icon: '🏘️', label: 'Orten' },
  patronInfluence:      { icon: '🤝', label: 'Mecenat' },
  spoksponsor:          { icon: '💼', label: 'Sponsor' },
  detOmojligaValet:     { icon: '⚖️', label: 'Beslut' },
  varsel:               { icon: '⚠️', label: 'Varsel' },
  playerArc:            { icon: '💬', label: 'Spelaren' },
  mecenatInteraction:   { icon: '🤝', label: 'Mecenat' },
  mecenatEvent:         { icon: '🤝', label: 'Mecenat' },
  criticalEconomy:      { icon: '💰', label: 'Ekonomi' },
  mecenatDinner:        { icon: '🤝', label: 'Mecenat' },
  riskySponsorOffer:    { icon: '💼', label: 'Sponsor' },
  mecenatWithdrawal:    { icon: '🤝', label: 'Mecenat' },
  patronWithdrawal:     { icon: '🤝', label: 'Mecenat' },
  mediaReaction:        { icon: '📰', label: 'Lokaltidningen' },
  fanLetter:            { icon: '✉️', label: 'Insändare' },
  opponentQuote:        { icon: '🏒', label: 'Motståndaren' },
  csPress:              { icon: '📰', label: 'Lokaltidningen' },
  playThroughInjury:    { icon: '🩹', label: 'Spelaren' },
  burnoutRelief:        { icon: '💬', label: 'Spelaren' },
  burnoutCeiling:       { icon: '💬', label: 'Spelaren' },
  // ANSPRÅK 4, spak 3 — samma etikett som communityEvent/icaMaxiEvent: det är
  // orten som tröttnar, ingen ny kategori.
  communityActivityRenewal: { icon: '🏘️', label: 'Orten' },
}

/** Genomsläpps ALDRIG rått — samma register som HÄNDELSE-defaulten i
 *  EventCardInline.tsx:s tidigare switch. */
const FALLBACK: EventTypeLabel = { icon: '📋', label: 'Händelse' }

// Telemetri, en gång per okänd typ per sessions livstid — samma
// `[modul] meddelande`-mönster som cupService.ts:121 (console.warn).
const warnedUnknownTypes = new Set<string>()

/**
 * Runtime-säker uppslagning. `Record<GameEventType, …>` ovan gör att en NY
 * GameEventType-medlem utan rad här redan stoppas av `npx tsc` — den här
 * funktionen är andra linjen, för värden som korsat en typgräns i runtime
 * (löst typade `string`-fält, t.ex. PortalQueueRail.tsx:s deferred-item
 * `type?: string`, eller ett persisterat save från en äldre version av
 * spelet med ett sedan borttaget GameEventType-värde). Faller ALDRIG
 * tillbaka på den råa strängen — bara den generiska etiketten — och loggar
 * en gång per okänd typ så luckan upptäcks istället för att permanentas.
 */
export function getEventTypeMeta(type: string | undefined): EventTypeLabel {
  if (type && type in EVENT_TYPE_LABELS) {
    return EVENT_TYPE_LABELS[type as GameEventType]
  }
  const key = type ?? 'undefined'
  if (!warnedUnknownTypes.has(key)) {
    warnedUnknownTypes.add(key)
    console.warn(`[eventTypeLabels] okänd händelsetyp "${key}" saknar etikett i EVENT_TYPE_LABELS — lägg till en rad i src/domain/data/eventTypeLabels.ts`)
  }
  return FALLBACK
}
