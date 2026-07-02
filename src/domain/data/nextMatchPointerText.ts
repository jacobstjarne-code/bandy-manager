// Granska-slutets framåtpekare (§11.3). Opus levererar — CLAUDE.md SVENSK TEXT.
// Sista raden i Granska: utandningen är över, detta är kroken mot nästa match.
// EN rad, sann mot data — aldrig påståenden som inte går att belägga (jfr anslag
// utan datastöd, BACKLOG-lärdom). Laddningstyp väljs i prioordning av wiringen:
// derby > kalenderankare > motståndarens form > tabellnärhet > neutral.
// {opp} = motståndarens kortnamn, {venue} = "hemma"/"borta". Fylls av wiringen.

type PointerPool = string[]

export const NEXT_MATCH_POINTER: Record<
  'derby' | 'annandag' | 'nyar' | 'cupfinalhelg' | 'opp_hot' | 'opp_cold' | 'tabell_nara' | 'neutral',
  PointerPool
> = {
  derby: [
    'Härnäst: {opp}, {venue}. Det behöver inte sägas mer än så.',
    'Sen väntar {opp} {venue}. Derby. Hela veckan känns det.',
    'Nästa gång: {opp}, {venue}. Den matchen bär sig själv.',
  ],
  annandag: [
    'Härnäst: {opp}, {venue}. På annandagen. Hela orten kommer.',
    'Sen är det annandagsbandy mot {opp}, {venue}. Året kokar ner till den.',
  ],
  nyar: [
    'Härnäst: {opp}, {venue}. Nyårsbandy. Sent, kallt och värt det.',
    'Sen väntar {opp} {venue} — nyårsmatchen. Man börjar året där man vill vara.',
  ],
  cupfinalhelg: [
    'Härnäst: {opp}, {venue}. Cupfinalhelgen. Nu räknas det.',
    'Sen är det {opp} {venue} — cupfinalhelg. Det är den här sortens match man minns.',
  ],
  opp_hot: [
    'Härnäst: {opp}, {venue}. De har inte förlorat på ett tag.',
    'Sen väntar {opp} {venue}. Formstarka just nu — det blir en mätare.',
  ],
  opp_cold: [
    'Härnäst: {opp}, {venue}. De vacklar. Läge att slå till.',
    'Sen är det {opp} {venue}. De har det tungt — men tunga lag biter ifrån.',
  ],
  tabell_nara: [
    'Härnäst: {opp}, {venue}. Grannar i tabellen. Sex poäng i en match.',
    'Sen väntar {opp} {venue} — precis intill oss i tabellen. Den väger tungt.',
  ],
  neutral: [
    'Härnäst: {opp}, {venue}.',
    'Sen väntar {opp}, {venue}. En omgång i taget.',
    'Nästa match: {opp}, {venue}. Vi laddar om.',
  ],
}
