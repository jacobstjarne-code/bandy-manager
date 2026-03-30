import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent } from '../../entities/GameEvent'

export function generateCommunityActivitiesEvents(
  game: SaveGame,
  currentRound: number,
  alreadyQueued: Set<string>,
  rand: () => number,
): GameEvent[] {
  const events: GameEvent[] = []
  const ca = game.communityActivities

  // Kiosk start — round 1, kiosk === 'none'
  if (currentRound === 1 && (ca?.kiosk ?? 'none') === 'none') {
    const eid = 'community_kiosk_start'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Kioskfrågan',
        body: 'Föreningen saknar ordentlig kioskverksamhet. Vill ni starta en enkel kiosk? Det kostar 3 000 kr men ger löpande intäkter.',
        choices: [
          {
            id: 'start',
            label: 'Starta enkel kiosk (−3 000 kr)',
            effect: { type: 'setCommunity', amount: -3000, communityKey: 'kiosk', communityValue: 'basic' },
          },
          {
            id: 'skip',
            label: 'Skippa det',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Kiosk upgrade — round 8, kiosk === 'basic'
  if (currentRound === 8 && ca?.kiosk === 'basic') {
    const eid = 'community_kiosk_upgrade'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Uppgradera kiosken',
        body: 'Kiosken går bra. Ni kan investera i bättre utrustning för 8 000 kr och fördubbla intäkterna.',
        choices: [
          {
            id: 'invest',
            label: 'Investera (−8 000 kr)',
            effect: { type: 'setCommunity', amount: -8000, communityKey: 'kiosk', communityValue: 'upgraded' },
          },
          {
            id: 'keep',
            label: 'Behåll som det är',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Lottery start — round 3, lottery === 'none'
  if (currentRound === 3 && (ca?.lottery ?? 'none') === 'none') {
    const eid = 'community_lottery_start'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Föreningslotten',
        body: 'Kassören föreslår att sälja föreningslotter. Billig att komma igång, ger lite extra varje omgång.',
        choices: [
          {
            id: 'start',
            label: 'Sätt igång (−1 000 kr)',
            effect: { type: 'setCommunity', amount: -1000, communityKey: 'lottery', communityValue: 'basic' },
          },
          {
            id: 'skip',
            label: 'Inte nu',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Lottery intensive — round 12, lottery === 'basic'
  if (currentRound === 12 && ca?.lottery === 'basic') {
    const eid = 'community_lottery_intensive'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Intensifiera lottförsäljningen',
        body: 'Med en kampanj kan ni sälja mer lotter och öka intäkterna markant — men det kräver mer volontärtid.',
        choices: [
          {
            id: 'push',
            label: 'Kör hårdare (−2 000 kr)',
            effect: { type: 'setCommunity', amount: -2000, communityKey: 'lottery', communityValue: 'intensive' },
          },
          {
            id: 'keep',
            label: 'Behåll lagom nivå',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Julmarknad — round 7, one-time
  if (currentRound === 7 && !ca?.julmarknad) {
    const eid = 'community_julmarknad'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Julmarknad på planen',
        body: `${game.localPaperName ?? 'Lokaltidningen'} föreslår en julmarknad på planen. Kostar 4 000 men ger 12 000 i intäkter och gott rykte.`,
        choices: [
          {
            id: 'arrange',
            label: 'Arrangera julmarknad',
            effect: { type: 'setCommunity', amount: 8000, communityKey: 'julmarknad', communityValue: 'true' },
          },
          {
            id: 'skip',
            label: 'Inte i år',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Loppis — round 4, 40% chance, one-time
  if (currentRound === 4 && rand() < 0.4) {
    const eid = 'community_loppis'
    if (!alreadyQueued.has(eid)) {
      const loppisAmount = Math.floor(5000 + rand() * 3000)
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Loppis till förmån för laget',
        body: 'Föräldrarna till juniorspelarna vill arrangera en loppis. Kräver en dag men ger 5 000–8 000 kr.',
        choices: [
          {
            id: 'support',
            label: 'Stötta initiativet',
            effect: { type: 'income', amount: loppisAmount },
          },
          {
            id: 'decline',
            label: 'Tack men nej',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Bandyskola — round 2, one-time
  if (currentRound === 2 && !ca?.bandyplay) {
    const eid = 'community_bandyplay'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Bandyskola för barn',
        body: 'Kommunen erbjuder bidrag om ni startar en bandyskola för barn 8–12 år. Ger 6 000/säsong och rekryterar framtida spelare.',
        choices: [
          {
            id: 'start',
            label: 'Starta bandyskolan',
            effect: { type: 'setCommunity', amount: 6000, communityKey: 'bandyplay', communityValue: 'true' },
          },
          {
            id: 'pass',
            label: 'Inte kapacitet just nu',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Ismaskin — round 10, 40% chance, one-time
  if (currentRound === 10 && rand() < 0.4) {
    const eid = 'community_ismaskin'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Ismaskinen krånglar',
        body: 'Ismaskinens motor börjar krångla. Reparation kostar 15 000 kr. Skjuter ni upp det riskerar ni sämre is.',
        choices: [
          {
            id: 'repair',
            label: 'Reparera nu (−15 000 kr)',
            effect: { type: 'tempFacilities', amount: 1 },
          },
          {
            id: 'postpone',
            label: 'Skjut upp det',
            effect: { type: 'tempFacilities', amount: -1 },
          },
        ],
        resolved: false,
      })
    }
  }

  // Funktionärsdag — round 5, one-time
  if (currentRound === 5 && !ca?.functionaries) {
    const eid = 'community_funktionarsdag'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Rekrytera funktionärer',
        body: 'Föreningen behöver fler funktionärer. En rekryteringsdag kostar 2 000 men ger 15 nya frivilliga och sänker personalkostnader.',
        choices: [
          {
            id: 'arrange',
            label: 'Arrangera rekryteringsdag (−2 000 kr)',
            effect: { type: 'setCommunity', amount: -2000, communityKey: 'functionaries', communityValue: 'true' },
          },
          {
            id: 'skip',
            label: 'Vi klarar oss',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Fikakväll — round 9, 50% chance, one-time
  if (currentRound === 9 && rand() < 0.5) {
    const eid = 'community_fikakväll'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Fikakväll för supportrarna',
        body: 'Arrangera en fikakväll med spelarna. Billigt (500 kr) men höjer fanMood med 8 poäng.',
        choices: [
          {
            id: 'fika',
            label: 'Klart vi fixar fika',
            effect: { type: 'fanMood', amount: 8 },
          },
          {
            id: 'skip',
            label: 'Inte just nu',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Bilbingo — round 14, 35% chance, one-time
  if (currentRound === 14 && rand() < 0.35) {
    const eid = 'community_bilbingo'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Bilbingo!',
        body: 'Idén om en bilbingo dök upp på styrelsemötet. Kräver lite jobb men kan ge 20 000 kr om det går bra.',
        choices: [
          {
            id: 'go',
            label: 'Vi kör bilbingo',
            effect: { type: 'income', amount: 20000 },
          },
          {
            id: 'pass',
            label: 'För krångligt',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  // Anläggningsrenovering — round 16, 30% chance, one-time
  if (currentRound === 16 && rand() < 0.3) {
    const eid = 'community_anlaggning'
    if (!alreadyQueued.has(eid)) {
      events.push({
        id: eid,
        type: 'communityEvent',
        title: 'Anläggningsrenovering',
        body: 'Omklädningsrummen behöver renoveras. Kostar 25 000 men ger +5 reputation och håller spelarna nöjdare.',
        choices: [
          {
            id: 'renovate',
            label: 'Renovera (−25 000 kr)',
            effect: { type: 'reputation', amount: 5 },
          },
          {
            id: 'wait',
            label: 'Får vänta',
            effect: { type: 'noOp' },
          },
        ],
        resolved: false,
      })
    }
  }

  return events
}
