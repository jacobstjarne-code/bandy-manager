import type { SaveGame } from '../entities/SaveGame'
import type { SupporterCharacter, SupporterRole } from '../entities/Community'

// ── Types ────────────────────────────────────────────────────────────────────

export type KlackEventType = 'tifo' | 'conflict' | 'away_trip'

export type KlackDisplay =
  | {
      type: 'event'
      eventType: KlackEventType
      groupName: string
      founded: number
      title: string
      body: string
      note: string
    }
  | {
      type: 'mood'
      extreme: 'low' | 'high'
      groupName: string
      subLabel: string
      title: string
      body: string
      note: string
    }
  | {
      type: 'person'
      groupName: string
      moodLabel: string
      members: number
      role: SupporterRole
      character: SupporterCharacter
      age: number
      quote: string
      favoritePlayerName?: string
    }

// ── Helpers ──────────────────────────────────────────────────────────────────

function deterministicAge(name: string, role: SupporterRole): number {
  const hash = name.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0xffff, 0)
  switch (role) {
    case 'veteran': return 50 + (hash % 20)       // 50–69
    case 'youth':   return 18 + (hash % 7)         // 18–24
    case 'leader':  return 32 + (hash % 18)        // 32–49
    case 'family':  return 35 + (hash % 15)        // 35–49
  }
}

// Context-sensitive quote pools per role
function pickQuote(
  role: SupporterRole,
  mood: number,
  consecutiveWins: number,
  consecutiveLosses: number,
  seed: number,
): string {
  const win = consecutiveWins >= 2
  const lose = consecutiveLosses >= 2
  const sad = mood < 45
  const happy = mood >= 70

  const pools: Record<SupporterRole, string[]> = {
    veteran: win
      ? [
          'Senast vi vann tre i rad köpte jag en ny fana. Den hänger fortfarande kvar.',
          'Det här laget har något. Jag har sett för många säsonger för att ta miste.',
          'Planen sjunger nu. Riktigt, vet du.',
        ]
      : lose
      ? [
          'Jag var där senast det var så här. Det vände. Det vänder igen.',
          'Sture kom inte till matchen. Det säger allt om stämningen just nu.',
          'Planen är tyst. Men vi kommer tillbaka. Vi har gjort det förut.',
        ]
      : sad
      ? [
          'Någon måste säga det: det räcker inte. Inte nu.',
          'Jag minns säsongen -98. Vi var i samma situation. Det gick inte bra.',
        ]
      : happy
      ? [
          'Det är därför vi åker dit match efter match. Just för det här.',
          'Målburen behöver pinor. Jag har glas kvar hemma — kan göra en ny tifo till derbyt.',
        ]
      : [
          'Vi är inte nöjda, men vi är inte heller klara. Inte på långa vägar.',
          'Tre omgångar kvar. Det räcker.',
          'Jag sitter på samma plats sedan 1997. Det ändrar jag inte på.',
        ],

    youth: win
      ? [
          'Det är alltså SÅ här det känns. Okej. Jag förstår nu varför folk aldrig slutar.',
          'Jag målade en ny banderoll inatt. Elin sa det var för rött. Men det syns.',
        ]
      : lose
      ? [
          'Min kompis slutade komma. Jag förstår honom inte. Det här är ju det bästa.',
          'Det här är min första kris som supportar. Elin säger att man inte glömmer den.',
        ]
      : [
          'Jag målar banderollerna. Elin tycker färgen suger men hon lär mig.',
          'Nästa derby gör jag något som man kan se från planen.',
          'Jag frågade Elin hur man sydde en fana. Hon visade mig utan att fråga varför.',
        ],

    leader: win
      ? [
          'Truppen märker att vi är där. Det spelar roll.',
          'Vi höll igång sången hela andra halvlek. Det hördes på planen.',
        ]
      : lose
      ? [
          'Vi sjunger oavsett. Det är vad en klack gör. Alltid.',
          'Stämningen är låg men vi tappar inte varandra. Det är det viktiga.',
        ]
      : [
          'Järnkurvan är till för laget. Inte tvärtom.',
          'Vi jobbar på ett nytt koreografi inför bortamatchen. Tre veckor kvar.',
          'Femtiotre betalande i veckan. Det är vi stolta över.',
        ],

    family: win
      ? [
          'Ungarna frågade om de får komma nästa match också. Vad svarar man?',
          'Min dotter lärde sig lagets namn på en match. Nu rabblar hon truppen.',
        ]
      : lose
      ? [
          'Vi åker ändå. Barnen förstår inte varför man åker när man förlorar. Det är svårt att förklara.',
          'Förlusten satt hårt. Men vi ses nästa omgång. Det är liksom klart.',
        ]
      : [
          'Vi tar hela familjen. Det är billigare än bio och roligare.',
          'Min son vill ha tröja nummer 7. Vet inte vem det är men han är bestämd.',
          'Vi sitter bakom mål. Barnen älskar när det är hörna.',
        ],
  }

  const pool = pools[role]
  return pool[seed % pool.length]
}

// ── Main function ─────────────────────────────────────────────────────────────

export function getKlackDisplay(game: SaveGame, currentMatchday: number): KlackDisplay | null {
  const sg = game.supporterGroup
  if (!sg) return null

  const arc = game.trainerArc
  const consecutiveWins = arc?.consecutiveWins ?? 0
  const consecutiveLosses = arc?.consecutiveLosses ?? 0
  const seed = currentMatchday * 17 + game.currentSeason * 7

  // ── Mode A: Händelse (within 3 matchdays) ─────────────────────────────────
  const EVENT_WINDOW = 3

  if (sg.tifoDoneMatchday && sg.tifoDone && currentMatchday - sg.tifoDoneMatchday <= EVENT_WINDOW) {
    return {
      type: 'event',
      eventType: 'tifo',
      groupName: sg.name,
      founded: sg.founded,
      title: 'Tifo inför derbyt',
      body: `${sg.veteran.name} har jobbat i veckor. Igår hängde den från läktaren — svart-gul fana, texten "VI STANNAR". Hela truppen såg den.`,
      note: `+12 mood · ${sg.members} medlemmar`,
    }
  }

  if (sg.conflictMatchday && sg.conflictSeason === game.currentSeason && currentMatchday - sg.conflictMatchday <= EVENT_WINDOW) {
    return {
      type: 'event',
      eventType: 'conflict',
      groupName: sg.name,
      founded: sg.founded,
      title: 'Spricka i klacken',
      body: `${sg.veteran.name} och ${sg.youth.name} ser saker på olika sätt nu. Det märks. Klacken är tystare än vanligt.`,
      note: `mood påverkat · ${sg.members} medlemmar`,
    }
  }

  if (sg.awayTripMatchday && sg.awayTripSeason === game.currentSeason && currentMatchday - sg.awayTripMatchday <= EVENT_WINDOW) {
    return {
      type: 'event',
      eventType: 'away_trip',
      groupName: sg.name,
      founded: sg.founded,
      title: 'Bortaresan — alla kom hem',
      body: `Tretton stycken. Lång buss, sen natt. ${sg.leader.name} säger det var den bästa resan på år. Klacken är sammansvetsad.`,
      note: `+8 mood · ${sg.members} medlemmar`,
    }
  }

  // ── Mode B: Stämning (extreme mood) ──────────────────────────────────────
  if (sg.mood < 40) {
    const lowTitles = [
      `${sg.veteran.name} fanns inte där`,
      'Sektionen tystnar',
      'Klacken håller sig borta',
    ]
    const lowBodies = [
      `Första gången på flera år. "Jag kunde inte se det," sa ${sg.veteran.name} i morse. Hemmaplansfördelen bleknar.`,
      `${sg.leader.name} skickade ett kort meddelande till gruppen: "Vi ses nästa gång." Inget mer.`,
    ]
    return {
      type: 'mood',
      extreme: 'low',
      groupName: sg.name,
      subLabel: 'tystnar',
      title: lowTitles[seed % lowTitles.length],
      body: lowBodies[seed % lowBodies.length],
      note: `mood ${sg.mood} · ${sg.members} medlemmar`,
    }
  }

  if (sg.mood >= 80) {
    const highTitles = [
      'Järnkurvan brinner',
      `${sg.leader.name} ropar upp ny koreografi`,
      'Orten lever',
    ]
    const highBodies = [
      `${sg.members} röster i samma takt. Det hörs ända från parkeringen. Laget hör det.`,
      `Nya tifon sitter redan klart. ${sg.veteran.name} jobbade hela helgen.`,
    ]
    return {
      type: 'mood',
      extreme: 'high',
      groupName: sg.name,
      subLabel: 'i brand',
      title: highTitles[seed % highTitles.length],
      body: highBodies[seed % highBodies.length],
      note: `mood ${sg.mood} · ${sg.members} medlemmar`,
    }
  }

  // ── Mode C: Person i fokus (default, roterar per matchday % 4) ────────────
  const roles: SupporterRole[] = ['leader', 'veteran', 'youth', 'family']
  const role = roles[currentMatchday % 4]
  const character = sg[role]
  const age = deterministicAge(character.name, role)
  const quote = pickQuote(role, sg.mood, consecutiveWins, consecutiveLosses, seed)

  const favPlayer = game.players.find(p => p.id === character.favoritePlayerId)
    ?? game.players.find(p => p.id === sg.favoritePlayerId)
  const favoritePlayerName = favPlayer ? `${favPlayer.firstName} ${favPlayer.lastName}` : undefined

  return {
    type: 'person',
    groupName: sg.name,
    moodLabel: sg.mood >= 65 ? `mood ${sg.mood}` : sg.mood >= 40 ? `mood ${sg.mood}` : `mood ${sg.mood}`,
    members: sg.members,
    role,
    character,
    age,
    quote,
    favoritePlayerName,
  }
}
