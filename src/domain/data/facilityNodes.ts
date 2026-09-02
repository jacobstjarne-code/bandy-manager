import type { FacilityNodeDef } from '../entities/Community'

// B1 — Utbyggnadsträd: tre grenar, statisk katalog
// Konstis = baseline (inte en nod). Matchhall = kall avfart, isHall=true.
// Ordning inom gren = visningsordning.
// financing (B1 §1/§8): kommun gated på politician.relationship (+ ev. communityStanding),
// mecenat på aktiv villig mecenat. Egen kassa alltid implicit (full cost). Lägre tröskel
// ju mindre/mer ungdomsinriktad noden är. Matchhallen går genom prövningen men
// återanvänder samma finansieringsmodell; hallprocessen ska inte bära en parallell kostnadstabell.
//
// upkeepCost (O5 kraft 2, Jacobs dom 2026-08-17, byggd 2026-08-23): cost/12
// avrundat till närmaste 100. De nio ordinarie noderna (allt utom
// matchhall/isHall — samma "fullt träd"-definition som O17s isFacilityTreeFull)
// summerar till 143 400 kr/säsong, mätt mot en simulerad medelklubbs (rykte
// 60) bruttoårsintäkt (426 063 kr via calcRoundIncome) — 33,7 %, domens
// eget mått ("en tredjedel av en normal säsongsintäkt"). Betalas en gång
// per säsong (calcRoundIncome, isFirstRound), inte veckovis.

export const FACILITY_NODE_DEFS: FacilityNodeDef[] = [
  // ── ANLÄGGNING ──────────────────────────────────────────────────────────
  {
    id: 'varmestuga',
    gren: 'anlaggning',
    label: 'Värmestuga',
    cost: 120000,
    upkeepCost: 10000,
    buildRounds: 8,
    requires: [],
    facilitiesBonus: 5,
    // M62 (2026-07-05, Jacob-delegerat beslut): 1000 → 100. En värmestuga är
    // komfort/retention, inte ny åskådarkapacitet — 1000 hade nästan tredubblat
    // en snittarena (bas 200–700) före den faktiska läktarutbyggnaden (+400).
    capacityBonus: 100,
    financing: { kommun: { share: 0.3, minRelation: 40 }, mecenat: { share: 0.4 } },
    consequences: [
      { dim: 'publik', dir: 'upp', label: 'Folk stannar längre' },
      { dim: 'sjal',   dir: 'upp', label: 'Kaffe i kylan — en del av ritualerna' },
      { dim: 'ekonomi', dir: 'ned', label: 'Kassa −120 tkr' },
    ],
  },
  {
    id: 'laktare_ostra',
    gren: 'anlaggning',
    label: 'Läktare — östra',
    cost: 300000,
    upkeepCost: 25000,
    buildRounds: 12,
    requires: ['varmestuga'],
    facilitiesBonus: 10,
    capacityBonus: 400,
    financing: { kommun: { share: 0.3, minRelation: 55, minStanding: 50 }, mecenat: { share: 0.4 } },
    consequences: [
      { dim: 'publik',  dir: 'upp', label: '+400 platser, fler på plats' },
      { dim: 'ekonomi', dir: 'upp', label: 'Mer biljettintäkt' },
      { dim: 'ekonomi', dir: 'ned', label: 'Kassa −300 tkr' },
    ],
  },
  {
    id: 'belysning',
    gren: 'anlaggning',
    label: 'Belysning träningsplan',
    cost: 240000,
    upkeepCost: 20000,
    buildRounds: 6,
    requires: [],
    facilitiesBonus: 5,
    financing: { kommun: { share: 0.4, minRelation: 45 }, mecenat: { share: 0.4 } },
    consequences: [
      { dim: 'ungdom',  dir: 'upp',  label: 'Kvällsträning möjlig' },
      { dim: 'publik',  dir: 'noll', label: 'Inga effekter på läktaren' },
      { dim: 'ekonomi', dir: 'ned',  label: 'Kassa −240 tkr' },
    ],
  },
  {
    // Kall avfart — öppnar gaffelscenen, aldrig direktköp
    id: 'matchhall',
    gren: 'anlaggning',
    label: 'Matchhall',
    cost: 1800000,
    upkeepCost: 150000,
    buildRounds: 20,
    requires: ['laktare_ostra'],
    facilitiesBonus: 20,
    capacityBonus: 5000,
    isHall: true,
    financing: { kommun: { share: 0.4, minRelation: 45 }, mecenat: { share: 0.4 } },
    // Påståendekartan, byggnodernas löften (2026-08-27, Jacobs dom): "Klacken
    // glesnar" struken — koden gör MOTSATSEN (hasIndoorArena skyddar mot
    // väder, HÖJER publiken, effectiveWeatherAttendance). Att lova en
    // nackdel som inte finns är lika illa som att lova en fördel som inte
    // finns. "+ tv-avtal" struket — rent påhitt, noll kod, och ett tv-avtal
    // i en fiktiv bandyliga är ett nytt system, inte en nodeffekt. "Bandy
    // året om" och "Träningstid året om" är sanna av konstruktion (en
    // inomhushall tillåter faktiskt det, oavsett årstid) — kvar.
    consequences: [
      { dim: 'sjal',    dir: 'ned', label: 'De trognaste i öppet brott' },
      { dim: 'ekonomi', dir: 'upp', label: 'Bandy året om' },
      { dim: 'ungdom',  dir: 'upp', label: 'Träningstid året om' },
    ],
  },

  // ── VERKSAMHET ──────────────────────────────────────────────────────────
  {
    // Påståendekartan, byggnodernas löften (2026-08-27): "Försäljnings-
    // intäkter" var tidigare oviart — nu WIRAD (economyService.ts,
    // KIOSK_NODE_SALES_BONUS_MULT), byggd nod höjer kiosk-sqrt-raten 25%.
    id: 'kiosk',
    gren: 'verksamhet',
    label: 'Kiosk & servering',
    cost: 80000,
    upkeepCost: 6700,
    buildRounds: 4,
    requires: [],
    facilitiesBonus: 3,
    financing: { kommun: { share: 0.3, minRelation: 40 }, mecenat: { share: 0.4 } },
    consequences: [
      { dim: 'publik',  dir: 'upp', label: 'Folk stannar under paus' },
      { dim: 'ekonomi', dir: 'upp', label: 'Försäljningsintäkter' },
      { dim: 'ekonomi', dir: 'ned', label: 'Kassa −80 tkr' },
    ],
  },
  {
    // B1 §8 — portad från gamla modellen (strålkastare, +10% sponsor).
    // Påståendekartan (2026-08-27, Jacobs dom): "+10% sponsorintäkt" var
    // rent påhitt (noll kod) — struket, INTE wirat. En sponsor-bonus hade
    // varit billig att koda, men domen behandlar den som samma klass av
    // fabricerat löfte som matchhallens tv-avtal, inte som en att fylla i.
    id: 'stralkastare',
    gren: 'verksamhet',
    label: 'Strålkastare',
    cost: 80000,
    upkeepCost: 6700,
    buildRounds: 5,
    requires: [],
    facilitiesBonus: 5,
    financing: { kommun: { share: 0.3, minRelation: 40 }, mecenat: { share: 0.4 } },
    consequences: [
      { dim: 'publik',  dir: 'upp', label: 'Kvällsmatcher i bättre ljus' },
      { dim: 'ekonomi', dir: 'ned', label: 'Kassa −80 tkr' },
    ],
  },
  {
    // B1 §8 — portad från gamla modellen (gym). Påståendekartan (2026-08-27,
    // Jacobs dom): mekanismen (facilitiesBonus→club.facilities→
    // facilityMultiplier, trainingService.ts) FINNS men är generisk — delad
    // av alla nio noder, inte gym-specifik, och aldrig bokstavligen 15%.
    // "+15% träningseffekt" struket, siffran var påhittad.
    id: 'gym',
    gren: 'verksamhet',
    label: 'Gym',
    cost: 150000,
    upkeepCost: 12500,
    buildRounds: 8,
    requires: [],
    facilitiesBonus: 8,
    financing: { kommun: { share: 0.3, minRelation: 40 }, mecenat: { share: 0.4 } },
    consequences: [
      { dim: 'ungdom',  dir: 'upp', label: 'Snabbare utveckling' },
      { dim: 'sjal',    dir: 'upp', label: 'Spelarna kan bygga styrka året om' },
      { dim: 'ekonomi', dir: 'ned', label: 'Kassa −150 tkr' },
    ],
  },
  {
    // Påståendekartan, byggnodernas löften (2026-08-27, Jacobs dom): "Ungdomarna
    // väljer att stanna" struken — samma klass som strålkastarens sponsorlöfte
    // och matchhallens tv-avtal. En anläggning som håller kvar ungdomar är en
    // mekanism vi inte har; akademispelares utveckling styrs av developmentRate
    // (arcService.ts), inte av byggnader. Ett lojalitetslöfte inget system bär.
    id: 'traningshall',
    gren: 'verksamhet',
    label: 'Träningshall (ungdom)',
    cost: 380000,
    upkeepCost: 31700,
    buildRounds: 14,
    requires: [],
    facilitiesBonus: 8,
    financing: { kommun: { share: 0.4, minRelation: 50 }, mecenat: { share: 0.5 } },
    consequences: [
      { dim: 'ungdom',  dir: 'upp', label: 'Inomhusträning hela året' },
      { dim: 'ekonomi', dir: 'ned', label: 'Kassa −380 tkr' },
    ],
  },

  // ── AKADEMI ─────────────────────────────────────────────────────────────
  {
    id: 'akademi_2',
    gren: 'akademi',
    label: 'Akademinivå 2',
    cost: 120000,
    upkeepCost: 10000,
    buildRounds: 8,
    requires: ['kiosk'],
    facilitiesBonus: 5,
    financing: { kommun: { share: 0.3, minRelation: 40 }, mecenat: { share: 0.5 } },
    consequences: [
      { dim: 'ungdom', dir: 'upp', label: 'Strukturerat ungdomsprogram' },
      { dim: 'sjal',   dir: 'upp', label: 'Egna spelare i framtiden' },
      { dim: 'ekonomi', dir: 'ned', label: 'Kassa −120 tkr' },
    ],
  },
  {
    id: 'akademi_3',
    gren: 'akademi',
    label: 'Akademinivå 3',
    cost: 250000,
    upkeepCost: 20800,
    buildRounds: 12,
    requires: ['traningshall', 'akademi_2'],
    facilitiesBonus: 8,
    financing: { kommun: { share: 0.4, minRelation: 55 }, mecenat: { share: 0.5 } },
    consequences: [
      { dim: 'ungdom', dir: 'upp', label: 'Elitakademi' },
      { dim: 'sjal',   dir: 'upp', label: 'Orten ger egna spelare' },
      { dim: 'ekonomi', dir: 'ned', label: 'Kassa −250 tkr' },
    ],
  },
]
