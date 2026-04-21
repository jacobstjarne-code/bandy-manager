// DREAM-010: Bandybrev till klubben
// En gång per säsong (omgång 10-18) får spelaren ett brev från en pensionär med minnen.
// Brevet sparas i arkivet med ett valfritt svar.

import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'

const SENDER_ORIGINS = [
  'Järbo', 'Högbo Bruk', 'Sandviken', 'Skutskär', 'Bollnäs',
  'Edsbyn', 'Hudiksvall', 'Söderhamn', 'Gävle', 'Karlstad',
  'Örebro', 'Västerås', 'Falun', 'Borlänge',
]

const SENDER_MALE_NAMES = [
  'Göran', 'Stig', 'Lennart', 'Rune', 'Bertil', 'Åke', 'Gunnar', 'Lars',
]

const SENDER_FEMALE_NAMES = [
  'Ingrid', 'Maj', 'Britt', 'Elsa', 'Karin', 'Birgit', 'Gun', 'Inga',
]

const SENDER_LAST_NAMES = [
  'Lundgren', 'Eriksson', 'Pettersson', 'Karlsson', 'Nilsson',
  'Johansson', 'Andersson', 'Lindström', 'Bergström', 'Magnusson',
]

function pickRng<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

export function generateBandyLetterEvent(game: SaveGame, nextMatchday: number): GameEvent | null {
  // Once per season, only in rounds 10-18
  if ((game.bandyLetterThisSeason ?? 0) >= game.currentSeason) return null
  if (nextMatchday < 10 || nextMatchday > 18) return null

  const eventId = `event_bandy_letter_${game.currentSeason}`
  if ((game.resolvedEventIds ?? []).includes(eventId)) return null
  if ((game.pendingEvents ?? []).some(e => e.id === eventId)) return null

  const club = game.clubs.find(c => c.id === game.managedClubId)
  if (!club) return null

  // Deterministic names from matchday + season
  const seed = nextMatchday * 13 + game.currentSeason * 7
  const templateIdx = seed % 3 // must match templates.length below
  // Template 2 (änka-brevet) kräver ett kvinnonamn
  const firstNamePool = templateIdx === 2 ? SENDER_FEMALE_NAMES : SENDER_MALE_NAMES
  const firstName = pickRng(firstNamePool, seed)
  const lastName = pickRng(SENDER_LAST_NAMES, seed + 3)
  const origin = pickRng(SENDER_ORIGINS, seed + 5)
  const age = 68 + (seed % 18) // 68-85 år
  const memYear = 1970 + (seed % 40) // 1970-2009

  const templates = [
    {
      text: `Jag heter ${firstName} ${lastName} och är ${age} år gammal. Jag kommer från ${origin}.\n\nJag såg min första ${club.name}-match med min far ${memYear}. Det snöade så hårt att han lade en filt över mig under andra halvlek. Vi vann 4-3 mot ett lag vars namn jag glömt — men känslan glömmer jag aldrig.\n\nJag har följt klubben sedan dess. Jag tänkte bara att ni skulle veta.`,
      replyOptions: [
        { id: 'reply_warm', label: 'Svara varmt — filen och 4-3-segern lever', replyText: `Kära ${firstName},\n\nTack för att du delade det minnet. Den sortens lojalitet är grunden för allt vi bygger. Din far visste uppenbarligen vad han höll på med när han tog med sig dig den kvällen.\n\n— ${game.managerName}` },
        { id: 'archive_no_reply', label: 'Lägg i arkivet (inget svar)', replyText: undefined },
      ],
    },
    {
      text: `Jag jobbade på bruket i ${origin} i tjugosex år. Jag satt alltid på östra sidan — platsen där vinden tog minst.\n\nJag minns när det hände ett frislags-mål från nära 40 meter i semifinalen ${memYear}. Hela planen blev tyst i fem sekunder innan det exploderade.\n\nJag är ${age} nu och har svårt att gå dit längre. Men jag lyssnar på radio. Hälsa grabbarna.`,
      replyOptions: [
        { id: 'reply_radio', label: 'Svara — berätta att vi lyssnar tillbaka', replyText: `Hej ${firstName},\n\nVi hörde vad du sa. Alla som sitter med radion och följer oss hemifrån är en del av det här laget. Östra sidan är alltid din.\n\n— ${game.managerName}` },
        { id: 'archive_no_reply', label: 'Lägg i arkivet (inget svar)', replyText: undefined },
      ],
    },
    {
      text: `Kära ${club.name}-folk.\n\nJag är änka efter Kjell som spelade i andralaget ${memYear}-${memYear + 6}. Han gick bort förra vintern.\n\nVi hittade hans gamla tröja när vi städade vinden. Jag undrar om ni skulle vilja ha den till klubbens minnesrum? Kjell hade velat det. Han pratade om er till sista dagen.`,
      replyOptions: [
        { id: 'reply_accept_jersey', label: 'Tacka ja — tröjan tillhör klubbens historia', replyText: `Kära ${firstName},\n\nVi tar emot tröjan med stolthet och sorg. Kjell tillhör ${club.name}:s historia — det gör hans tröja också. Den får en fin plats.\n\n— ${game.managerName}` },
        { id: 'reply_decline', label: 'Svara varsamt — tröjan borde stanna i familjen', replyText: `Kära ${firstName},\n\nVad ett vackert erbjudande. Men vi tror att tröjan hör hemma hos er. Kjells minne bär ni med er — det är viktigare.\n\n— ${game.managerName}` },
      ],
    },
  ]

  const template = templates[templateIdx]

  return {
    id: eventId,
    type: 'bandyLetter',
    title: `✉️ Brev från ${firstName} ${lastName}, ${origin}`,
    body: template.text,
    sender: { name: `${firstName} ${lastName}`, role: `${age} år, ${origin}` },
    choices: template.replyOptions.map(opt => ({
      id: opt.id,
      label: opt.label,
      effect: {
        type: 'saveBandyLetter' as const,
        replyText: opt.replyText,
        communityKey: `${firstName} ${lastName}`,
        communityValue: origin,
      },
    })),
    resolved: false,
    priority: 'low',
  }
}
