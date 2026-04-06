/**
 * Determines whether a match event should be aligned to the home side (left)
 * or away side (right) based on the event's clubId.
 *
 * Bug 0.6 fix: Suspensions (and other team-specific events) must be sided,
 * not centered. This helper is extracted so it can be unit-tested.
 */
export function getEventAlignment(eventClubId: string, homeClubId: string): 'home' | 'away' {
  return eventClubId === homeClubId ? 'home' : 'away'
}
