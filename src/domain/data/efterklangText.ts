// src/domain/data/efterklangText.ts
// C-SY1 #1 Efterklang på Portal. Opus-text 2026-05-25.
//
// EfterklangSecondary = en --cold Portal-secondary (memory/eko-domän, inte action).
// Max 2 minnen (Q1 låst). Varje rad kopplar ett förflutet till nuet med ett ↻-eko.
// Tonen är dämpad och eftertänksam — ett minne som klingar, inte en uppmaning.
// Bandysvensk understatement, lätt vemod. ↻-markören renderas av Code.
//
// {journalist}/{motståndare}/{spelare}/{rival}/{ar} interpoleras av Code ur minnets data.

export const EFTERKLANG_EYEBROW = '⏳ Efterklang' // Code lägger till "· {n} minnen"

export const EFTERKLANG_TYPE_ICON: Record<string, string> = {
  anniversary:    '📅',
  klackEcho:      '📣',
  journalist:     '📰',
  followUp:       '✉️',
  boardObjective: '🎯',
  nemesis:        '⚔️',
  economicScar:   '💸',
  rivalSale:      '🔄',
}

export type EfterklangType =
  | 'anniversary'      // ett tidigare resultat, +1 år
  | 'klackEcho'        // klackens minne av en kväll
  | 'journalist'       // tidigare journalist-kontakt
  | 'followUp'         // obesvarat brev / öppen tråd
  | 'boardObjective'   // styrelsens tidigare mål/löfte
  | 'nemesis'          // återkommande motståndare
  | 'economicScar'     // tidigare ekonomisk kris
  | 'rivalSale'        // spelare såld till rival

/** ↻-eko-raden per minnestyp. Kort, eftertänksam, kopplar då till nu. */
export const EFTERKLANG_ECHO: Record<EfterklangType, string[]> = {
  // Textaudit domän 2 (2026-07-03): anniversaries kan vara 1–5 år gamla och
  // dagens motståndare är inte samma som då — inga årtals- eller motståndarclaims.
  anniversary: [
    'Samma vecka, ett annat år. Samma kyla.',
    'Ni stod här då också. Det känns längre sedan än det är.',
  ],
  klackEcho: [
    'Klacken sjunger fortfarande om den kvällen.',
    'Den där sången hörs än, när det vänder rätt.',
  ],
  journalist: [
    '{journalist} ringde efter den matchen. Minnet på redaktionen är längre än du tror.',
    '{journalist} skrev om det då. Det är inte glömt.',
  ],
  followUp: [
    'Det brevet kom från någon som bryr sig på riktigt. Inte alla gör det.',
    'Den sortens fan som skriver har sett era säsonger. Det märks på varje rad.',
  ],
  boardObjective: [
    'Styrelsens löfte från i höstas hänger kvar i rummet.',
    'Målet de satte upp då är inte glömt, hur tyst det än är om det.',
  ],
  nemesis: [
    '{motståndare} igen. Det tar visst aldrig riktigt slut mellan er.',
    'Samma motståndare som förra gången det gjorde ont.',
  ],
  economicScar: [
    'Det var nära att ta slut i vintras. Kassan minns.',
    'Räkenskaperna såg becksvarta ut för inte så länge sedan.',
  ],
  rivalSale: [
    '{spelare} bär {rival}s färger nu. Det svider fortfarande.',
    'Ni sålde {spelare} dit. Han hälsar inte längre när ni möts.',
  ],
}

// Resolutions-medveten efterdyning (Opus-copy 2026-06-03). När budgetkrisen är
// överstånden minns ärret HUR du överlevde. Premiss = du/ni-faktum (uppställning),
// echo = världens röst tillbaka (payoff). {spelare} interpoleras endast för sold_star.
export type EconomicResolutionType = 'sold_star' | 'loan' | 'mecenat' | 'natural_recovery'

export const ECONOMIC_SCAR_AFTERMATH: Record<EconomicResolutionType, { premiss: string; echoes: string[] }> = {
  sold_star: {
    premiss: 'Ni sålde {spelare} för att rädda kassan.',
    echoes: [
      'Laget är tunnare där han stod.',
      'Alla minns vem som fick gå när det brann.',
    ],
  },
  loan: {
    premiss: 'Kommunlånet löper fortfarande.',
    echoes: [
      'Räntan äter sin del varje månad, tyst.',
      'Kommunen glömmer inte vem som knackade på.',
    ],
  },
  mecenat: {
    premiss: 'Mecenaten täckte krisen åt er.',
    echoes: [
      'Han räddade er — och han vet om det.',
      'Det finns en räkning som inte står i böckerna.',
    ],
  },
  natural_recovery: {
    premiss: 'Ni red ut krisen utan att sälja.',
    echoes: [
      'Sponsorn är borta. Spelarna är kvar.',
      'Ni klarade er. Knappt, men utan att sälja själen.',
    ],
  },
}
