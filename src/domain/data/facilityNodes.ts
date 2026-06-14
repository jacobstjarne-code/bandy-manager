import type { FacilityNodeDef } from '../entities/Community'

// B1 — Utbyggnadsträd: tre grenar, statisk katalog
// Konstis = baseline (inte en nod). Matchhall = kall avfart, isHall=true.
// Ordning inom gren = visningsordning.

export const FACILITY_NODE_DEFS: FacilityNodeDef[] = [
  // ── ANLÄGGNING ──────────────────────────────────────────────────────────
  {
    id: 'varmestuga',
    gren: 'anlaggning',
    label: 'Värmestuga',
    cost: 120000,
    buildRounds: 8,
    requires: [],
    facilitiesBonus: 5,
    capacityBonus: 1000,
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
    buildRounds: 12,
    requires: ['varmestuga'],
    facilitiesBonus: 10,
    capacityBonus: 400,
    consequences: [
      { dim: 'publik',  dir: 'upp', label: '+400 platser, fler på plats' },
      { dim: 'ekonomi', dir: 'upp', label: 'Mer billettintäkt' },
      { dim: 'ekonomi', dir: 'ned', label: 'Kassa −300 tkr' },
    ],
  },
  {
    id: 'belysning',
    gren: 'anlaggning',
    label: 'Belysning träningsplan',
    cost: 240000,
    buildRounds: 6,
    requires: [],
    facilitiesBonus: 5,
    consequences: [
      { dim: 'ungdom',  dir: 'upp',  label: 'Nattträningar möjliga' },
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
    buildRounds: 20,
    requires: ['laktare_ostra'],
    facilitiesBonus: 20,
    capacityBonus: 5000,
    isHall: true,
    consequences: [
      { dim: 'publik',  dir: 'ned', label: 'klacken glesnar' },
      { dim: 'sjal',    dir: 'ned', label: 'Västra Sidan i öppet brott' },
      { dim: 'ekonomi', dir: 'upp', label: 'åretrunt + tv-avtal' },
      { dim: 'ungdom',  dir: 'upp', label: 'träningstid året om' },
    ],
  },

  // ── VERKSAMHET ──────────────────────────────────────────────────────────
  {
    id: 'kiosk',
    gren: 'verksamhet',
    label: 'Kiosk & servering',
    cost: 80000,
    buildRounds: 4,
    requires: [],
    facilitiesBonus: 3,
    consequences: [
      { dim: 'publik',  dir: 'upp', label: 'Folk stannar under paus' },
      { dim: 'ekonomi', dir: 'upp', label: 'Försäljningsintäkter' },
      { dim: 'ekonomi', dir: 'ned', label: 'Kassa −80 tkr' },
    ],
  },
  {
    id: 'traningshall',
    gren: 'verksamhet',
    label: 'Träningshall (ungdom)',
    cost: 380000,
    buildRounds: 14,
    requires: [],
    facilitiesBonus: 8,
    consequences: [
      { dim: 'ungdom',  dir: 'upp', label: 'Inomhusträning hela året' },
      { dim: 'sjal',    dir: 'upp', label: 'Ungdomarna väljer att stanna' },
      { dim: 'ekonomi', dir: 'ned', label: 'Kassa −380 tkr' },
    ],
  },

  // ── AKADEMI ─────────────────────────────────────────────────────────────
  {
    id: 'akademi_2',
    gren: 'akademi',
    label: 'Akademinivå 2',
    cost: 120000,
    buildRounds: 8,
    requires: ['kiosk'],
    facilitiesBonus: 5,
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
    buildRounds: 12,
    requires: ['traningshall', 'akademi_2'],
    facilitiesBonus: 8,
    consequences: [
      { dim: 'ungdom', dir: 'upp', label: '↑↑ Elitakademi' },
      { dim: 'sjal',   dir: 'upp', label: 'Orten ger egna spelare' },
      { dim: 'ekonomi', dir: 'ned', label: 'Kassa −250 tkr' },
    ],
  },
]
