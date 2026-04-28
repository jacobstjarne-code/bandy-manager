import type { SaveGame } from '../entities/SaveGame'
import type { ScandalType } from './scandalService'
import { InboxItemType } from '../enums'
import { getCharacterName } from './supporterService'

interface CoffeeQuote {
  speaker?: string
  text: string
}

export interface CoffeeScene {
  exchanges: Array<[string, string, string, string]>
  meta: {
    title: string
    subtitle?: string
  }
}

const GENERIC_EXCHANGES: Array<[string, string, string, string]> = [
  ['Kioskvakten', 'Ingen kommer betala 25 kr för en korv i den här kylan.', 'Kassören', 'Det sa du förra året. Vi sålde slut.'],
  ['Materialaren', 'Tre klubbor gick sönder igår.', 'Vaktmästaren', 'Beställ fem. Det blir kallt i veckan.'],
  ['Kassören', 'Har vi råd med nya tröjor?', 'Ordföranden', 'Har vi råd att INTE ha nya tröjor?'],
  ['Webbredaktören', 'Hemsidan hade 400 besök igår.', 'Kioskvakten', 'Hur många köpte korv?'],
  ['Vaktmästaren', 'Jag var ute klockan fem imorse.', 'Materialaren', 'Du säger det varje dag.'],
  ['Kassören', 'Sponsoravtalet med ICA går ut.', 'Ordföranden', 'Ring dom. Bjud på kaffe. Och korv.'],
  // Placeholder — byts ut mot dynamisk ungdomsspelare i getCoffeeRoomQuote
  ['Ungdomstränaren', '{youthName} i P19 börjar likna något.', 'Materialaren', 'Ge honom inte för stora tröjor.'],
]

// Transfer-triggered exchanges — shown after a sale/buy
const TRANSFER_SALE_EXCHANGES: Array<[string, string, string, string]> = [
  ['Kioskvakten', '{name} lämnade. Synd, folk gillade honom.', 'Kassören', 'Pengarna gör nytta. Det är sporten.'],
  ['Materialaren', 'Tröjan med {name} på hänger fortfarande.', 'Vaktmästaren', 'Ge det ett tag. Det är inte sista tröjan vi hänger.'],
  ['Kassören', 'Affären gick igenom. Pengarna är inne.', 'Ordföranden', 'Bra. Nu handlar det om vad vi gör med dem.'],
  ['Vaktmästaren', '{name} sa hej till alla i korridoren på väg ut.', 'Materialaren', 'Det är det man minns.'],
]

const TRANSFER_BUY_EXCHANGES: Array<[string, string, string, string]> = [
  ['Vaktmästaren', 'Ny kille i omklädningsrummet. Sa knappt hej.', 'Kassören', 'Ge honom en vecka.'],
  ['Materialaren', 'Fick ta fram en ny tröja i förtid.', 'Kioskvakten', 'Numret är bra. Folk gillar jämna nummer.'],
  ['Kassören', 'Nyförvärvet kostar — men det kan bli bra.', 'Ordföranden', 'Det är investeringen som räknas.'],
  ['Kioskvakten', 'Folk frågade redan vem han är.', 'Vaktmästaren', 'Säg att han är ny. Det räcker.'],
]

const TRANSFER_DEADLINE_EXCHANGES: Array<[string, string, string, string]> = [
  ['Kassören', 'Telefonen ringer hela tiden.', 'Ordföranden', 'Svara inte.'],
  ['Materialaren', 'Hörde att folk sniffar runt.', 'Kioskvakten', 'De ska inte ha honom. Punkt.'],
  ['Vaktmästaren', 'Sista dagarna nu. Ryktena flyger.', 'Kassören', 'Lita på tränaren. Han vet vad han gör.'],
]

const STREAK_EXCHANGES: Record<'winning' | 'losing', Array<[string, string, string, string]>> = {
  winning: [
    ['Kioskvakten', 'Hade slut på kaffe vid halvtid igår. Det har aldrig hänt.', 'Vaktmästaren', 'Inte förvånande just nu.'],
    ['Vaktmästaren', 'Grabbarna sjunger i duschen igen.', 'Materialaren', 'Bra tecken.'],
    ['Kassören', 'Biljetterna säljer sig själva nu.', 'Ordföranden', 'Berätta inte — de höjer priset.'],
  ],
  losing: [
    ['Materialaren', 'Det är tyst i duschen efter match numera.', 'Kioskvakten', 'Ja. Ingen vill prata.'],
    ['Kioskvakten', 'Korvförsäljningen har sjunkit. Folk stannar inte kvar efter slutsignalen.', 'Kassören', 'Förstår dom.'],
    ['Vaktmästaren', 'Jag plogade ensam igår. Ingen dröjde kvar.', 'Materialaren', 'Det går över. Det brukar det.'],
  ],
}

const RESULT_EXCHANGES: Record<'win' | 'loss' | 'draw', Array<[string, string]>> = {
  win: [
    ['Kioskvakten', 'Vi sålde dubbelt idag. Seger säljer.'],
    ['Vaktmästaren', 'Publiken sjöng hela vägen ut. Länge sen sist.'],
    ['Kassören', 'Tre poäng och plusresultat. Jag sover gott.'],
  ],
  loss: [
    ['Kioskvakten', 'Tyst vid kiosken efteråt. Ingen ville ha korv.'],
    ['Vaktmästaren', 'Jag plogade ändå i en timme. Isen förtjänade bättre.'],
    ['Kassören', 'Vi behöver inte prata om det. Eller?'],
  ],
  draw: [
    ['Kioskvakten', 'Kryss igen. Folket vet inte om de ska vara nöjda.'],
    ['Vaktmästaren', 'En poäng är en poäng. Isen klagade inte.'],
  ],
}

const SCANDAL_DASHBOARD_OWN: Partial<Record<ScandalType, Array<[string, string, string, string]>>> = {
  municipal_scandal: [
    ['Kioskvakten', 'Hörde att Granskning ringde i veckan.', 'Vaktmästaren', 'Lokaltidningen eller riktiga?" Kioskvakten: "Riktiga.'],
    ['Kassören', 'Jag har räknat fram det tre gånger.', 'Ordföranden', 'Stämmer det?" Kassören: "Det är därför jag räknat tre gånger.'],
    ['Vaktmästaren', 'Politikern har slutat svara.', 'Materialaren', 'Bra. Då slipper han säga något.'],
  ],
  sponsor_collapse: [
    ['Kassören', 'Tröjorna ska tryckas om.', 'Materialaren', 'När då?" Kassören: "När någon betalat.'],
    ['Kioskvakten', 'Han ringde inte ens.', 'Vaktmästaren', 'Bara mejl?" Kioskvakten: "Bara mejl.'],
    ['Ordföranden', 'Nya förfrågningar har inte kommit än.', 'Kassören', 'Det går två veckor till.'],
  ],
  treasurer_resigned: [
    ['Vaktmästaren', 'Är det någon som öppnat kontoret?', 'Kioskvakten', 'Inte sen i tisdags." Vaktmästaren: "Då." Kioskvakten: "Då.'],
    ['Materialaren', 'Jag försökte få fram papperna till skatteverket.', 'Ordföranden', 'Och?" Materialaren: "Pärmen är där hon lämnade den.'],
    ['Kioskvakten', 'Hon kom in på matchen i lördags.', 'Kassören', 'Sa hon något?" Kioskvakten: "Hon köpte korv.'],
  ],
  phantom_salaries: [
    ['Kassören', 'Två poäng.', 'Ordföranden', 'Två." Kassören: "Det är en match.'],
    ['Vaktmästaren', 'Vi hade kunnat göra någonting bättre med tiden.', 'Materialaren', 'Vad menar du?" Vaktmästaren: "Allt.'],
    ['Kioskvakten', 'Det var inte ens samma kassör som lade upp det.', 'Materialaren', 'Spelar ingen roll nu.'],
  ],
  club_to_club_loan: [
    ['Ordföranden', 'Det skulle hjälpa bägge.', 'Kassören', 'Det blev så." Ordföranden: "Hjälpen gick åt fel håll.'],
    ['Vaktmästaren', 'Hörde att de fick poängavdraget igår.', 'Kioskvakten', 'Bra för dem att vi hjälpte till." Vaktmästaren: "Mhm.'],
  ],
  fundraiser_vanished: [
    ['Materialaren', 'Birger frågade igen idag.', 'Kioskvakten', 'Vad sa du?" Materialaren: "Att vi tittar på det.'],
    ['Kioskvakten', 'Vi ska ha medlemsmöte.', 'Vaktmästaren', 'Frivilligt?" Kioskvakten: "Inte direkt.'],
    ['Kassören', 'Polisen har inte hört av sig.', 'Ordföranden', 'Det är en månad sedan." Kassören: "Jag vet.'],
  ],
  coach_meltdown: [
    ['Vaktmästaren', 'Jag plogade tidigt idag. Han var där redan.', 'Materialaren', 'Sa något?" Vaktmästaren: "Bara hej.'],
    ['Kioskvakten', 'Assisterande verkar göra vad han kan.', 'Materialaren', 'Han är inte tränaren, det är skillnaden." Kioskvakten: "Vi får hoppas.'],
    ['Kassören', 'Ingen frågar efter ett presskonferensdatum.', 'Ordföranden', 'Bra." Kassören: "Ja. Det är bra.'],
  ],
}

const SCANDAL_DASHBOARD_OTHER: Partial<Record<ScandalType, Array<[string, string, string, string]>>> = {
  municipal_scandal: [
    ['Kioskvakten', 'Politiker bråkar om {KLUBB}-bidraget igen.', 'Vaktmästaren', 'Igen?" Kioskvakten: "Tredje gången på fem år.'],
    ['Kassören', '{KLUBB} ska skolas av kommunen.', 'Ordföranden', 'Det skulle vi också." Kassören: "Vi har ingen mark att sälja.'],
    ['Materialaren', 'Hörde att {KLUBB} fick stryk i fullmäktige.', 'Vaktmästaren', 'Av vem?" Materialaren: "Alla.'],
  ],
  sponsor_collapse: [
    ['Kioskvakten', '{KLUBB} förlorade en sponsor i veckan.', 'Kassören', 'Stor?" Kioskvakten: "Lagom.'],
    ['Vaktmästaren', 'Tror dom hade Borgvik Bygg också.', 'Materialaren', 'Då har dom det jobbigt." Vaktmästaren: "Det har alla.'],
    ['Ordföranden', '{KLUBB} söker ny huvudsponsor enligt tidningen.', 'Kassören', 'Lycka till.'],
  ],
  treasurer_resigned: [
    ['Materialaren', '{KLUBB}s kassör är borta.', 'Kioskvakten', 'Vad hände?" Materialaren: "Personliga skäl, står det.'],
    ['Kassören', 'Hörde att {KLUBB} inte kan göra transfers nu.', 'Ordföranden', 'Inte?" Kassören: "Pärmarna är låsta.'],
    ['Vaktmästaren', 'Hon var hyfsat ung.', 'Kioskvakten', 'Vem?" Vaktmästaren: "{KLUBB}s kassör.'],
  ],
  phantom_salaries: [
    ['Kassören', '{KLUBB} fick två poäng dragna.', 'Ordföranden', 'På vad?" Kassören: "Spelare som inte fanns.'],
    ['Kioskvakten', 'Skatteverket var tydligen klara med {KLUBB}.', 'Materialaren', 'Och?" Kioskvakten: "Det stod två poäng på fakturan.'],
    ['Vaktmästaren', 'Bra att vi har vår kassör.', 'Materialaren', 'Hon räknar två gånger." Vaktmästaren: "Tre.'],
  ],
  club_to_club_loan: [
    ['Ordföranden', '{KLUBB} och deras grannar gjorde en deal.', 'Kassören', 'Kreativ?" Ordföranden: "Det säger Förbundet.'],
    ['Materialaren', 'Tre poäng nästa säsong för {KLUBB}.', 'Vaktmästaren', 'Det är en tabellplats." Materialaren: "Minst.'],
    ['Kioskvakten', 'Hörde att kassören sitter på båda klubbarnas kontor.', 'Vaktmästaren', 'Då blev det som det blev.'],
  ],
  fundraiser_vanished: [
    ['Kassören', '{KLUBB}s korv-pengar är borta.', 'Vaktmästaren', '300 spänn?" Kassören: "300 tusen.'],
    ['Kioskvakten', 'Klacken i {KLUBB} står utanför kansliet.', 'Materialaren', 'Och?" Kioskvakten: "Ingen kommer ut.'],
    ['Ordföranden', 'Det är en sån grej man lär sig av.', 'Kassören', 'Att räkna oftare." Ordföranden: "Mhm.'],
  ],
  coach_meltdown: [
    ['Vaktmästaren', '{KLUBB}s tränare är borta.', 'Kioskvakten', 'Vad hände?" Vaktmästaren: "Personliga skäl.'],
    ['Materialaren', 'Han ringde en kollega här i veckan.', 'Kassören', 'Sa något?" Materialaren: "Sa att han söker hjälp.'],
    ['Kioskvakten', 'Det är såna grejer man inte glädjs över.', 'Vaktmästaren', 'Nej." Kioskvakten: "Spelar ingen roll vilket lag.'],
  ],
}

export function getCoffeeRoomQuote(game: SaveGame): CoffeeQuote | null {
  // Victory echo takes priority
  if (game.pendingVictoryEcho) {
    return { text: game.pendingVictoryEcho.coffeeLine }
  }

  const round = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)

  if (round === 0) return null

  const lastFixture = game.fixtures
    .filter(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => b.matchday - a.matchday)[0]

  // Multiplier 11 (coprime to 7 och 3) gör att idx roterar genom alla värden per omgång
  const seed = round * 11 + game.currentSeason * 31

  let soldItem: typeof game.inbox[number] | undefined
  let boughtItem: typeof game.inbox[number] | undefined
  for (const item of (game.inbox ?? []).slice(-10)) {
    if (!soldItem && (item.type === InboxItemType.Transfer || item.type === InboxItemType.TransferBidReceived)) soldItem = item
    if (!boughtItem && item.type === InboxItemType.TransferOffer && !item.isRead) boughtItem = item
    if (soldItem && boughtItem) break
  }
  const deadlineRound = round >= 13 && round <= 15

  // Detect form streak (last 3 managed league matches)
  const recentManaged = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup &&
      (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
    .sort((a, b) => b.matchday - a.matchday)
    .slice(0, 3)

  const getResult = (f: typeof recentManaged[0]) => {
    const isHome = f.homeClubId === game.managedClubId
    const my = isHome ? f.homeScore : f.awayScore
    const their = isHome ? f.awayScore : f.homeScore
    return my > their ? 'win' : my < their ? 'loss' : 'draw'
  }

  let streakType: 'winning' | 'losing' | null = null
  if (recentManaged.length >= 3) {
    const results = recentManaged.map(getResult)
    if (results.every(r => r === 'win')) streakType = 'winning'
    else if (results.every(r => r === 'loss')) streakType = 'losing'
  }

  if (streakType && seed % 3 === 0) {
    const idx = Math.abs(seed * 13) % STREAK_EXCHANGES[streakType].length
    const ex = STREAK_EXCHANGES[streakType][idx]
    return { speaker: ex[0], text: `"${ex[1]}" — ${ex[2]}: "${ex[3]}"` }
  }

  if (deadlineRound && seed % 5 === 0) {
    const idx = Math.abs(seed * 3) % TRANSFER_DEADLINE_EXCHANGES.length
    const ex = TRANSFER_DEADLINE_EXCHANGES[idx]
    return { speaker: ex[0], text: `"${ex[1]}" — ${ex[2]}: "${ex[3]}"` }
  }
  if (soldItem && seed % 3 === 0) {
    const idx = Math.abs(seed * 7) % TRANSFER_SALE_EXCHANGES.length
    const ex = TRANSFER_SALE_EXCHANGES[idx]
    const soldPlayer = soldItem.relatedPlayerId
      ? game.players.find(p => p.id === soldItem.relatedPlayerId)
      : null
    const name = soldPlayer ? soldPlayer.lastName : 'spelaren'
    return { speaker: ex[0], text: `"${ex[1].replace('{name}', name)}" — ${ex[2]}: "${ex[3]}"` }
  }
  if (boughtItem && seed % 3 === 1) {
    const idx = Math.abs(seed * 11) % TRANSFER_BUY_EXCHANGES.length
    const ex = TRANSFER_BUY_EXCHANGES[idx]
    return { speaker: ex[0], text: `"${ex[1]}" — ${ex[2]}: "${ex[3]}"` }
  }

  // Scandal reference (25% chance when recent scandal this season)
  const recentScandal = (game.scandalHistory ?? []).find(s =>
    s.season === game.currentSeason &&
    s.triggerRound >= round - 1 &&
    s.type !== 'small_absurdity'
  )
  if (recentScandal && seed % 4 === 0) {
    const isOwn = recentScandal.affectedClubId === game.managedClubId
    const pool = isOwn ? SCANDAL_DASHBOARD_OWN[recentScandal.type] : SCANDAL_DASHBOARD_OTHER[recentScandal.type]
    if (pool && pool.length > 0) {
      const ex = pool[Math.abs(seed * 17) % pool.length]
      if (!isOwn) {
        const affectedClub = game.clubs.find(c => c.id === recentScandal.affectedClubId)
        const secondaryClub = recentScandal.secondaryClubId
          ? game.clubs.find(c => c.id === recentScandal.secondaryClubId)
          : null
        const klubb = affectedClub?.name ?? 'grannklubben'
        const andraKlubb = secondaryClub?.name ?? 'grannklubben'
        const sub = (s: string) => s.replace(/\{KLUBB\}/g, klubb).replace(/\{ANDRA_KLUBB\}/g, andraKlubb)
        return { speaker: sub(ex[0]), text: `"${sub(ex[1])}" — ${sub(ex[2])}: "${sub(ex[3])}"` }
      }
      return { speaker: ex[0], text: `"${ex[1]}" — ${ex[2]}: "${ex[3]}"` }
    }
  }

  const lastHash = game.lastCoffeeQuoteHash ?? -1
  // pick avoiding the index that matches lastHash to prevent same quote two rounds in a row
  const pick = <T>(arr: T[]): T => {
    const idx = Math.abs(seed) % arr.length
    const lastIdx = ((lastHash % arr.length) + arr.length) % arr.length
    if (idx === lastIdx && arr.length > 1) {
      return arr[(idx + 1) % arr.length]
    }
    return arr[idx]
  }

  if (lastFixture && (seed % 2 === 0)) {
    const isHome = lastFixture.homeClubId === game.managedClubId
    const myScore = isHome ? lastFixture.homeScore : lastFixture.awayScore
    const theirScore = isHome ? lastFixture.awayScore : lastFixture.homeScore
    const result: 'win' | 'loss' | 'draw' = myScore > theirScore ? 'win' : myScore < theirScore ? 'loss' : 'draw'
    const pool = RESULT_EXCHANGES[result]
    const [speaker, text] = pick(pool)
    return { speaker, text }
  }

  const volunteers = game.volunteers ?? []
  const exchange = pick(GENERIC_EXCHANGES)
  const speakerName = volunteers.length > 0
    ? volunteers[Math.abs(seed + 3) % volunteers.length]
    : exchange[0]

  // Resolve dynamic placeholders
  let text = `"${exchange[1]}" — ${exchange[2]}: "${exchange[3]}"`
  if (text.includes('{youthName}')) {
    const youthPlayers = game.youthTeam?.players ?? []
    const youthName = youthPlayers.length > 0
      ? youthPlayers[Math.abs(seed + 5) % youthPlayers.length].lastName
      : 'någon i P19'
    text = text.replace('{youthName}', youthName)
  }

  // 15% chance: club legend reference
  const legends = game.clubLegends ?? []
  if (legends.length > 0 && seed % 7 === 0) {
    const legend = legends[Math.abs(seed + 11) % legends.length]
    const generalPool: Array<[string, string, string, string]> = [
      ['Materialaren', `${legend.name} var nere på akademiträningen igår. Grabbarna lyssnade.`, 'Vaktmästaren', 'Det är så det ska vara.'],
      ['Kioskvakten', `${legend.name} köpte korv. Sa inget. Men han såg glad ut.`, 'Kassören', 'Det betyder något.'],
      ['Vaktmästaren', `${legend.name} ringer fortfarande när vi vinner.`, 'Materialaren', 'Naturligtvis.'],
      ['Kassören', `${legend.name} satt på läktaren i lördags. Ensam. Men han var här.`, 'Materialaren', 'Det räcker.'],
      ['Kioskvakten', `${legend.name} hälsade på efter matchen. Pratade med alla. Som om han aldrig slutat.`, 'Vaktmästaren', 'Det är hans grej.'],
    ]
    // youthCoach-pool: legenden som ungdomstränare
    const youthCoachPool: Array<[string, string, string, string]> = [
      ['Materialaren', `${legend.name} hade en P19-grabb inne i veckan. En och en. Över en timme.`, 'Vaktmästaren', 'Det är så dom byggs.'],
      ['Kioskvakten', `${legend.name} står på isen kvart i sju varje morgon nu.`, 'Vaktmästaren', 'Det gör han tills han inte kan längre.'],
      ['Vaktmästaren', `${legend.name} sa att en av P19-killarna ska upp i vår.`, 'Materialaren', 'Sa han vilken?" Vaktmästaren: "Nej. Han säger inget innan det är klart.'],
      ['Materialaren', `${legend.name} skällde på grabbarna igår. Riktigt skällde.`, 'Kioskvakten', 'Bra." Materialaren: "Bra.'],
      ['Kassören', `${legend.name} har börjat ringa föräldrarna också.`, 'Ordföranden', 'Vad pratar dom om?" Kassören: "Läxor.'],
      ['Kioskvakten', `${legend.name} satt och tittade på P16-matchen i söndags. Antecknade.`, 'Materialaren', 'Han ser något vi inte ser.'],
    ]
    // scout-pool: legenden som scout
    const scoutPool: Array<[string, string, string, string]> = [
      ['Materialaren', `${legend.name} hade fyra namn på pappret. Tre av dem är värda att titta på.`, 'Vaktmästaren', 'Det räcker.'],
      ['Kioskvakten', `${legend.name} är borta hela helgen. Tre matcher på tre orter.`, 'Kassören', 'Det är så dom är.'],
      ['Kassören', `${legend.name} ringde i tisdags. Sa bara "inte han".`, 'Ordföranden', 'Då sparade vi pengar.'],
      ['Vaktmästaren', `${legend.name} hittade en kille i Norrland. Hade kollat honom tre gånger.`, 'Materialaren', 'Tre?" Vaktmästaren: "Han litar inte på första intrycket.'],
      ['Kioskvakten', `${legend.name} kom hem från bortamatchen på kvällen. Klockan var över elva.`, 'Vaktmästaren', 'Han kunde åkt på morgonen." Kioskvakten: "Han kunde det. Men det gör han inte.'],
      ['Materialaren', `${legend.name} sa nej till en agent som ringde.`, 'Kassören', 'Vad sa han?" Materialaren: "Att han hittar killar själv.'],
    ]
    const pool = legend.role === 'youth_coach' ? youthCoachPool
      : legend.role === 'scout' ? scoutPool
      : generalPool
    const refIdx = Math.abs(seed + 13) % pool.length
    const ref = pool[refIdx]
    return { speaker: ref[0], text: `"${ref[1]}" — ${ref[2]}: "${ref[3]}"` }
  }

  // 20% chance: replace with supporter-karaktär-citat
  const sg = game.supporterGroup
  if (sg && (seed % 5 === 0)) {
    const leader  = getCharacterName(game, 'leader')
    const veteran = getCharacterName(game, 'veteran')
    const youth   = getCharacterName(game, 'youth')
    const family  = getCharacterName(game, 'family')
    const favPlayer = game.players.find(p => p.id === sg.favoritePlayerId)
    const favName = favPlayer ? favPlayer.lastName : 'spelaren'
    const groupName = sg.name

    // Rykte-reaktioner: academyNoticed och reputationWarning
    const resolvedIds = new Set(game.resolvedEventIds ?? [])
    const season = game.currentSeason
    if (resolvedIds.has(`rep_academy_${season}`)) {
      return { speaker: youth, text: `"Såg ni? LANDSLAGET tittar på oss!" — ${leader}: "Jag vet. Det är stor grej."` }
    }
    if (resolvedIds.has(`rep_warning_${season}`)) {
      return { speaker: veteran, text: `"Det var bättre förr. Och jag menar det den här gången." — ${family}: "Kom igen nu, Sture."` }
    }

    const supporterQuotes: Array<[string, string, string, string]> = [
      [leader, `${groupName} är med oavsett. Det är det enda som gäller.`, veteran, 'Det är vad vi alltid sagt.'],
      [youth,  `${favName} är den bäste just nu. Ingen pratar om det tillräckligt.`, leader, 'Jag vet. Han levererar.'],
      [veteran, `Jag har följt laget i trettio år. Det här laget har något.`, family, 'Barnen älskar matchdagarna.'],
      [family, `${youth} hade med sig en ny banderoll. Det var fin.`, leader, 'Hon lägger ner mer tid än oss alla.'],
      [youth,  `Bortaresan var bäst i år. Vi var nitton stycken.`, veteran, `${leader} förstår att organisera.`],
      [leader, `Klacken börjar växa. Folk märker det.`, family, 'Det syns när man sitter på läktaren.'],
      [veteran, `${favName} — den killen är orten igenom.`, youth, 'Alla älskar honom. Han är en av oss.'],
    ]

    const qIdx = Math.abs(seed + 9) % supporterQuotes.length
    const sq = supporterQuotes[qIdx]
    return { speaker: sq[0], text: `"${sq[1]}" — ${sq[2]}: "${sq[3]}"` }
  }

  return { speaker: speakerName, text }
}

/**
 * getCoffeeRoomScene — returnerar 1-3 exchanges för Kafferummet-scenen.
 * Returnerar null om ingen omgång spelats (säsongsstart) eller data saknas.
 *
 * Exchange-format: [speakerA, textA, speakerB, textB] — samma format
 * som GENERIC_EXCHANGES internt. Texten levereras *utan* citationstecken;
 * komponenten lägger på dem vid render.
 */
export function getCoffeeRoomScene(game: SaveGame): CoffeeScene | null {
  const round = game.fixtures
    .filter(f => f.status === 'completed' && !f.isCup)
    .reduce((max, f) => Math.max(max, f.roundNumber), 0)
  if (round === 0) return null

  const matchday = game.currentMatchday ?? 0
  if (matchday === 0) return null

  // Pool: GENERIC + ev. STREAK om streak finns
  const pool: Array<[string, string, string, string]> = []
  // Filtrera bort placeholder-rader med oresolverade tokens
  for (const ex of GENERIC_EXCHANGES) {
    if (ex[1].includes('{youthName}')) {
      const youthName = (game.youthTeam?.players ?? [])[0]?.lastName
      if (!youthName) continue
      pool.push([ex[0], ex[1].replace('{youthName}', youthName), ex[2], ex[3]])
    } else {
      pool.push(ex)
    }
  }

  // Streak-exchanges som tilläggspool när streak finns
  const recentManaged = game.fixtures
    .filter(
      f =>
        f.status === 'completed' &&
        !f.isCup &&
        (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId),
    )
    .sort((a, b) => b.matchday - a.matchday)
    .slice(0, 3)
  if (recentManaged.length >= 3) {
    const results = recentManaged.map(f => {
      const isHome = f.homeClubId === game.managedClubId
      const my = isHome ? f.homeScore : f.awayScore
      const their = isHome ? f.awayScore : f.homeScore
      return my > their ? 'win' : my < their ? 'loss' : 'draw'
    })
    if (results.every(r => r === 'win')) pool.push(...STREAK_EXCHANGES.winning)
    else if (results.every(r => r === 'loss')) pool.push(...STREAK_EXCHANGES.losing)
  }

  if (pool.length === 0) return null

  // Deterministiskt antal 1-3 baserat på matchday
  const count = Math.min(pool.length, (matchday % 3) + 1)
  const seed = round * 11 + game.currentSeason * 31

  // Plocka `count` distinkta index
  const used = new Set<number>()
  const exchanges: Array<[string, string, string, string]> = []
  for (let i = 0; i < count; i++) {
    let idx = Math.abs(seed * (i + 7)) % pool.length
    let guard = 0
    while (used.has(idx) && guard < pool.length) {
      idx = (idx + 1) % pool.length
      guard++
    }
    used.add(idx)
    exchanges.push(pool[idx])
  }

  return {
    exchanges,
    meta: {
      title: 'Kafferummet',
      subtitle: 'Tisdag förmiddag · några stannade kvar efter mötet',
    },
  }
}
