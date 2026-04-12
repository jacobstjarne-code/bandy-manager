import type { SaveGame } from '../../entities/SaveGame'
import type { GameEvent } from '../../entities/GameEvent'
import { getCharacterName } from '../supporterService'

export function generateSupporterEvents(
  game: SaveGame,
  currentRound: number,
  alreadyQueued: Set<string>,
  rand: () => number,
): GameEvent[] {
  const events: GameEvent[] = []
  const sg = game.supporterGroup
  if (!sg) return events

  const elin   = getCharacterName(game, 'youth')
  const sture  = getCharacterName(game, 'leader')
  const tommy  = getCharacterName(game, 'family')
  const rolf   = getCharacterName(game, 'veteran')

  // ── Tifo-eventet — Elin vill organisera tifo (omg 5-7, max en gång per säsong) ──
  if (currentRound >= 5 && currentRound <= 7 && !sg.tifoDone) {
    const eid = `supporter_tifo_${game.currentSeason}`
    if (!alreadyQueued.has(eid) && rand() < 0.7) {
      events.push({
        id: eid,
        type: 'supporterEvent',
        title: `${elin} och tifon`,
        body: `${elin} från klacken hör av sig. Hon och några kompisar vill göra ett tifo till nästa hemmamatch — en stor banderoll med klubbnamnet och ett citat från 1963.\n\n"Vi behöver bara tillgång till en hörna av föreningslokalen och lite tid. Inget kostar något."`,
        choices: [
          {
            id: 'yes',
            label: 'Klart, låna lokalen',
            subtitle: '💛 +5 klackens stämning · ⭐ +2 communityStanding',
            effect: { type: 'multiEffect', subEffects: JSON.stringify([
              { type: 'supporterMood', amount: 5 },
              { type: 'communityStanding', amount: 2 },
            ]) },
          },
          {
            id: 'maybe',
            label: 'Ja men håll det enkelt',
            subtitle: '💛 +2 klackens stämning',
            effect: { type: 'supporterMood', amount: 2 },
          },
          {
            id: 'no',
            label: 'Vi har inte kapacitet just nu',
            subtitle: '💛 -3 klackens stämning',
            effect: { type: 'supporterMood', amount: -3 },
          },
        ],
        resolved: false,
      })
    }
  }

  // ── Konflikt Sture/Elin — omg 9-11, efter tifo, om tifoDone ──────────────────
  if (currentRound >= 9 && currentRound <= 11 && sg.tifoDone && sg.conflictSeason !== game.currentSeason) {
    const eid = `supporter_conflict_${game.currentSeason}`
    if (!alreadyQueued.has(eid) && rand() < 0.5) {
      events.push({
        id: eid,
        type: 'supporterEvent',
        title: `Konflikt i klacken`,
        body: `${sture} hör av sig. Han tycker att ${elin}s tifo var bra, men oroar sig för att klacken "tappat sitt ursprung". Han vill att det ska vara som det alltid har varit.\n\n${elin} hörde talas om det och är upprörd. De pratar inte längre.\n\n"Du behöver inte göra något", säger ${rolf}. "Men det hjälper om du visar att du bryr dig om båda."`,
        choices: [
          {
            id: 'both',
            label: 'Bjud in båda på ett möte med truppen',
            subtitle: '💛 +5 klackens stämning · 💰 engagerar klacken',
            effect: { type: 'multiEffect', subEffects: JSON.stringify([
              { type: 'supporterMood', amount: 5 },
              { type: 'fanMood', amount: 3 },
            ]) },
          },
          {
            id: 'sture',
            label: `Ge ${sture} rätt — traditionen är viktig`,
            subtitle: '💛 -2 klackens stämning · ${elin} besviken',
            effect: { type: 'supporterMood', amount: -2 },
          },
          {
            id: 'elin',
            label: `Ge ${elin} rätt — klacken utvecklas`,
            subtitle: '💛 +3 klackens stämning · +1 communityStanding',
            effect: { type: 'multiEffect', subEffects: JSON.stringify([
              { type: 'supporterMood', amount: 3 },
              { type: 'communityStanding', amount: 1 },
            ]) },
          },
        ],
        resolved: false,
      })
    }
  }

  // ── Tommys öppna brev — om mood < 35 och omg 8-16 ────────────────────────────
  if (currentRound >= 8 && currentRound <= 16 && sg.mood < 35) {
    const eid = `supporter_open_letter_${game.currentSeason}`
    if (!alreadyQueued.has(eid)) {
      const paperName = game.localPaperName ?? 'Lokaltidningen'
      events.push({
        id: eid,
        type: 'supporterEvent',
        title: `${tommy}s öppna brev`,
        body: `${tommy} har skrivit ett öppet brev till ${paperName}. Han skriver om varför han och familjen fortfarande kommer — och vad de hoppas på.\n\n"Vi är inte missnöjda med spelet. Vi är missnöjda med känslan. Det är skillnad."\n\nBrevet har fått många reaktioner i kommentarsfältet.`,
        choices: [
          {
            id: 'respond_publicly',
            label: 'Svara offentligt — tacka för engagemanget',
            subtitle: '💛 +8 klackens stämning · ⭐ +2 communityStanding',
            effect: { type: 'multiEffect', subEffects: JSON.stringify([
              { type: 'supporterMood', amount: 8 },
              { type: 'communityStanding', amount: 2 },
            ]) },
          },
          {
            id: 'meet_privately',
            label: `Bjud in ${tommy} på ett möte`,
            subtitle: '💛 +5 klackens stämning',
            effect: { type: 'supporterMood', amount: 5 },
          },
          {
            id: 'ignore',
            label: 'Låt det passera',
            subtitle: '💛 -2 klackens stämning',
            effect: { type: 'supporterMood', amount: -2 },
          },
        ],
        resolved: false,
      })
    }
  }

  // ── Bortaresa — omg 6-15, om mood >= 50, max en gång per säsong ───────────────
  const hasAwayMatch = game.fixtures.some(f =>
    f.status === 'scheduled' &&
    f.awayClubId === game.managedClubId &&
    !f.isCup &&
    f.roundNumber >= currentRound &&
    f.roundNumber <= currentRound + 3
  )
  if (
    currentRound >= 6 && currentRound <= 15 &&
    sg.mood >= 50 &&
    sg.awayTripSeason !== game.currentSeason &&
    hasAwayMatch
  ) {
    const eid = `supporter_away_trip_${game.currentSeason}`
    if (!alreadyQueued.has(eid) && rand() < 0.45) {
      events.push({
        id: eid,
        type: 'supporterEvent',
        title: `${sture} planerar bortaresan`,
        body: `${sture} hör av sig. Klacken vill hyra en buss till nästa bortamatch.\n\n"${rolf} kommer med. Och ${elin} och hennes kompisar. Vi är tolv stycken hittills. Du behöver inte göra något — vi fixar det. Men det vore kul om du sa att du visste om det."`,
        choices: [
          {
            id: 'encourage',
            label: 'Peppa dem — det är kul!',
            subtitle: '💛 +5 klackens stämning · 💰 +500 kr biljettintäkt om de köper',
            effect: { type: 'supporterMood', amount: 5 },
          },
          {
            id: 'acknowledge',
            label: 'Kul — lycka till!',
            subtitle: '💛 +2 klackens stämning',
            effect: { type: 'supporterMood', amount: 2 },
          },
        ],
        resolved: false,
      })
    }
  }

  return events
}
