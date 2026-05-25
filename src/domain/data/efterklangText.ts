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
  anniversary: [
    'Ett år sedan i dag. Samma motstånd, samma kyla.',
    'För ett år sedan stod ni här. Det känns längre än så.',
  ],
  klackEcho: [
    'Klacken sjunger fortfarande om den kvällen.',
    'Den där sången hörs än, när det vänder rätt.',
  ],
  journalist: [
    '{journalist} ringde efter den matchen. Hon minns bättre än du tror.',
    '{journalist} skrev om det då. Hon har inte glömt.',
  ],
  followUp: [
    'Brevet ligger fortfarande obesvarat i högen.',
    'Den där frågan hänger kvar. Någon väntar än på svar.',
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
