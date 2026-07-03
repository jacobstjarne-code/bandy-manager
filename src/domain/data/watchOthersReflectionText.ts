export type WatchOthersContext = 'lost_to_finalist' | 'lost_to_other' | 'never_in_playoff'

interface WatchOthersReflection {
  label: string
  reflection: string
}

/**
 * Reflektion-rad som visas i WatchOthersSecondary när SM-finalen
 * närmar sig (inom 7 dagar). Tre kontexter beroende på vad managed
 * gjorde i slutspelet.
 *
 * Tonregel (spec 0.5): nämn rivalkontexten konkret — inte bara
 * "andra spelar". Hela poängen är att eko av tidigare beslut syns.
 */
export const WATCH_OTHERS_TEXT: Record<WatchOthersContext, WatchOthersReflection[]> = {
  lost_to_finalist: [
    {
      label: 'De som slog ut oss',
      reflection: '{motståndare} står kvar. Det vi förlorade mot är inte vilket lag som helst.',
    },
    {
      label: 'Finalvägen',
      reflection: '{motståndare} står i finalen. Och de gick förbi oss för att komma dit.',
    },
    {
      label: 'De som vann mot oss',
      reflection: 'Klubben som slog ut oss spelar vidare. Det är inte en mindre sak just nu.',
    },
  ],
  lost_to_other: [
    {
      label: 'Final mellan andra',
      reflection: 'Två lag i finalen. Inget av dem var de som slog oss. Klent tröst, men ändå tröst.',
    },
    {
      label: 'Slutspelets egen logik',
      reflection: 'Det är inte de som slog oss som står i finalen. Slutspel går så ibland.',
    },
    {
      label: 'Andras kamp',
      reflection: 'SM-finalen står utan oss. Vi tittar som alla andra som åkt ut tidigt.',
    },
  ],
  never_in_playoff: [
    {
      label: 'Slutspelet utan oss',
      reflection: 'Åtta lag spelade slutspel. Vi var inte ett av dem. Det förändras till hösten.',
    },
    {
      label: 'Titta och lära',
      reflection: 'Vi följer slutspelet från soffan i år. Det är platsen att lära från.',
    },
    {
      label: 'Bandy är bandy',
      reflection: 'Slutspelet pågår. Vi var långt ifrån. Nästa höst börjar nu, även om ingen säger det än.',
    },
  ],
}
