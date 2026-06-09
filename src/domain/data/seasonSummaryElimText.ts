/**
 * SeasonSummary-rad som minns var säsongen tog slut.
 * Visas under playoffEliminationSentence i SeasonSummaryScreen.
 *
 * Tonregel (spec 0.5 + bandysvensk understatement): konkret bild,
 * inget melodrama. Template-variabler {motståndare} och {season}.
 */

export type SeasonEliminationContext = 'kf' | 'sf' | 'smf' | 'no_playoff'

interface SeasonElimVariant {
  body: string
}

export const SEASON_SUMMARY_ELIM_TEXT: Record<SeasonEliminationContext, SeasonElimVariant[]> = {
  kf: [
    {
      body: 'Kvartsfinalen mot {motståndare} blev slutpunkten. Det är där berättelsen om {season} fortfarande skaver.',
    },
    {
      body: 'Vi åkte ut i kvartsfinalen. {motståndare} stod kvar när det var över. Sånt händer — men det är inte vad vi ville.',
    },
  ],
  sf: [
    {
      body: 'Semifinalen mot {motståndare} — så långt kom vi. Två matcher till finalen, två som vi inte fick spela.',
    },
    {
      body: '{motståndare} tog semifinalen. Vi var nära finalen — det blir den närheten som biter i {season}.',
    },
  ],
  smf: [
    {
      body: 'Silver. Nära. Aldrig nära nog.',
    },
    {
      body: 'SM-finalförlust. Silver är silver — och bittert på samma gång.',
    },
  ],
  no_playoff: [
    {
      body: 'Vi var inte där när det avgjordes. Det här är vad vi tar med oss till hösten.',
    },
    {
      body: 'Inget slutspel den här säsongen. Det blev en lång vår med bara träningar och tabellen att titta på.',
    },
  ],
}

/**
 * Picker — deterministisk per säsong + klubb.
 */
export function pickSeasonElimText(
  context: SeasonEliminationContext,
  season: number,
  clubId: string,
): string {
  const pool = SEASON_SUMMARY_ELIM_TEXT[context]
  const seed = season + clubId.charCodeAt(0)
  return pool[seed % pool.length].body
}
