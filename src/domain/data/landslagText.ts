// src/domain/data/landslagText.ts
// C-K1 Landslagsuttagning. Opus-text 2026-05-25.
//
// För en bruksklubb är en VM-uttagning säsongens guldkorn, oavsett tabell. Tonen är
// gold-tinged stolthet men fortfarande bandysvensk understatement — orten bär det
// tyngre än spelaren visar. Alla effekter synliga (form/moral/ekonomi renderas av
// Code bredvid texten, inte dolt).
//
// Designval (Opus tog Designs föreslag 2026-05-25): +5 tkr/uttagen synligt; egna
// spelare i Portal, övriga landslagsmän i Inbox.
//
// {spelare} = en spelare, {spelare_lista} = flera ("Salonen och Holmqvist"),
// {klubb} = hanterad klubb. Förbundskaptenen hålls som roll, inte hårdkodat namn.

/** Kort inkorgsnotis vid uttagning. Lätt, ingen tung scen — modalen bär ögonblicket. */
export const CALLUP_NOTICE_LINES = {
  single: [
    '{spelare} är uttagen till VM-truppen. Förbundskaptenen ringde i morse.',
    '{spelare} har fått VM-kallelsen. Orten lär prata om inget annat på en vecka.',
  ],
  multi: [
    '{spelare_lista} är uttagna till VM-truppen.',
    '{spelare_lista} kallas till VM. Flera från samma bygd — det händer inte ofta.',
  ],
}

/** UttagningsModal — 1× per säsong, VM-fönstret. Guld-tonad, stolt men dämpad. */
export const CALLUP_MODAL_LINES: string[] = [
  'Förbundskaptenen ringde i morse. {spelare} är uttagen till VM-truppen.\n\nFör en {klubb}-spelare är det stort, oavsett hur tabellen ser ut. Säsongens guldkorn.',
  'Brevet kom med posten, stämplat från förbundet. {spelare} ska till VM.\n\nDet är sådant man minns långt efter att tabellen är glömd.',
]

/** The camp records a call-up, not a match-availability ban. Do not promise absence. */
export const ABSENCE_SECONDARY_LINES: string[] = [
  'VM-kallelsen gäller {spelare}. Det är stort för både spelaren och klubben.',
  'Landslaget har kallat {spelare}. Uttagningen blir en del av klubbens historia.',
]

/**
 * LandslagsReturScen — kafferum vid hemkomst. Synlig boost (Code renderar form/moral).
 * `gold` = kom hem med VM-medalj.
 *
 * `.standard` wirad i release-svepet 2026-07-21 (nationalTeamService.ts →
 * coffeeRoomService.ts). `.gold` är TEXT-UTAN-YTA (VILANDE) — kräver ett
 * VM-turneringsutfall som inte finns (lägret simulerar aldrig ett resultat).
 * RADERA INTE — väntar på en VM-turneringsmekanik. Se nationalTeamService.ts:s
 * applyReturnEffects för rotorsaken.
 */
export const RETURN_SCENE_LINES = {
  standard: [
    '{spelare} är tillbaka från VM. Han säger inte mycket om det, men han går lite rakare i ryggen nu.',
    '{spelare} kom hem från landslaget i går. Något har satt sig i ryggraden — det syns på isen.',
  ],
  gold: [
    '{spelare} kom hem med VM-guld. Kafferummet har inte varit så här högljutt på åratal.',
    '{spelare} har en medalj i väskan och hela orten vid grinden. Grattis till guldet.',
  ],
}

/**
 * IckeUttagenScen — kandidat förbigås. Synlig form/moral-träff (Code renderar).
 * "Snubblade förbi" — konsekvensen syns, inget dolt straff.
 */
export const SNUB_SCENE_LINES: string[] = [
  '{spelare} trodde han skulle med till VM. Det blev någon annan. Han säger inget, men formen säger desto mer.',
  '{spelare} snubblade förbi landslaget i år. Det syns på träningen veckan efter.',
  '{spelare} läste truppen i tidningen och hittade inte sitt namn. Han tränade hårdast av alla i dag, käkarna spända.',
]

/**
 * LOBBY_PRESS_FLAVOUR — TEXTLEVERANS_OPUS_2026-09-08 (lobbypress-mekanik-spec,
 * Jacobs beslut 2026-09-07: nedgradera till flavour nu). Ersätter den gamla
 * `LOBBY_PRESS` (interaktivt weekly-decision-kort med accepted/declined) —
 * den påstod en manager-handling ("Du ringde…") som aldrig fick ytas
 * automatiskt (INSTRUKTIONER_2026-09-08). Detta är en PASSIV journalistnotis:
 * pressen noterar att spelaren är i uttagningssnacket. Ingen spelarförfrågan,
 * ingen manager-handling, inga `choices`. Full uttagningsmekanik (LobbyPress
 * påverkar faktisk uttagningschans) är POST_LAUNCH (Jacobs beslut) — se
 * docs/archive/historiska-statuskallor/BACKLOG.md → BYGGT MEN OSYNLIGT för den gamla, nu superseterade, radens
 * historik. Tokens: {spelare}, {klubb}, {paper} (ur befintlig uppsättning,
 * pressConferenceService.ts:s JOURNALISTS/game.localPaperName).
 */
export const LOBBY_PRESS_FLAVOUR = [
  '"{spelare} nämns i uttagningssnacket" — {paper}',
  '"Det pratas landslag kring {spelare}" — kort i {paper}',
  '"{klubb}s {spelare} med i resonemanget inför uttagningen" — {paper}',
  '"Förbundskaptenen lär ha {spelare} på bevakning" — {paper}',
]

/** MemoryEvent (klubbminne, sig 60) vid första uttagningen någonsin för en spelare. */
export const FIRST_CALLUP_MEMORY_LINES: string[] = [
  '{spelare}s första landslagsuttagning. Han bar bygdens namn till VM.',
  '{spelare} kallades till landslaget för första gången. Orten glömmer det inte.',
]
