// Röstrader för assistentens val under snabbspolning (corner/counter/frislag).
// Opus levererar — se CLAUDE.md "SVENSK TEXT — CODE SKRIVER ALDRIG". Arrayerna
// lämnas tomma tills Opus fyller dem; tom array = ingen röstrad visas (ingen krasch).
// Platshållare i strängarna fylls via fillTemplate({zone}/{delivery}/{choice}).
export const ASSISTANT_FF_LINES: Record<'corner' | 'counter' | 'freekick', string[]> = {
  corner: [],   // OPUS_COPY: t.ex. "Assistenten tog hörnan — {zone}, {delivery}."
  counter: [],  // OPUS_COPY: t.ex. "Assistenten kör kontringen — {choice}."
  freekick: [], // OPUS_COPY: t.ex. "Assistenten tar frislaget — {choice}."
}
