/**
 * Pensionsval-event (C-B3) — när en veteran ställer frågan om sitt slut.
 * Tonregister: reflekterande, konkret, bandyspelar-vardag. Veteranen
 * är en lokal kille med familj — inte en hjälte i avsked, en man som
 * frågar sin tränare något han redan vet svaret på.
 *
 * Plockas slumpat per Player.id-seed så samma veteran får samma citat
 * om scenen återbesöks.
 */

// Citat som visas på Portal-kortet (per åldersregion)
export const RETIREMENT_CARD_QUOTES = {
  young: [  // age 32-34
    '"Kroppen börjar räkna. Inte varje dag, men tillräckligt ofta."',
    '"Jag har börjat fundera. Ingen slutsats ännu."',
    '"Det är inte beslut ännu. Men det är en tanke."',
  ],
  veteran: [  // age 35-36
    '"Varje träning är tyngre. Varje match kostar mer."',
    '"Jag har gett den här klubben mycket. Nu är frågan hur mycket mer."',
    '"Det är en fråga om vad jag orkar, inte om vad jag vill."',
  ],
  elder: [  // age 37+
    '"Jag vet vad kroppen säger. Jag lyssnar, det vet du om mig."',
    '"Det är tid. Frågan är bara hur vi gör det."',
    '"Jag har spelat min sista säsong, tror jag. Det är okej."',
  ],
}

// Tre besluts-knapptexter
export const RETIREMENT_CHOICES = {
  thank:   { label: 'Tack för allt',   effect: 'Du tackar av med värdighet' },
  respect: { label: 'Du bestämmer',    effect: 'Han väljer sin väg' },
  invite:  { label: 'En säsong till',  effect: 'Du ber honom stanna' },
} as const

export type RetirementChoice = keyof typeof RETIREMENT_CHOICES
export type RetirementOutcome = 'retire' | 'continue'

// Response-strängar per val × utfall (flat key: `${choice}_${retired ? 'retired' : 'continued'}`)
export const RETIREMENT_RESPONSES: Record<string, string[]> = {
  thank_retired: [
    '"Det var rätt tidpunkt. Tack för att du sa det."',
    '"Jag är tacksam. Det var ett bra sätt att avsluta."',
    '"Det betyder mer än du tror att du respekterar det."',
  ],
  thank_continued: [
    '"Du trodde det var dags. Jag tror det kan räcka en säsong till."',
    '"Det var välmenat. Men jag tänkte hänga med lite längre."',
    '"Låt mig bevisa att du hade fel att tacka av mig."',
  ],
  respect_retired: [
    '"Det är min tid. Det känns rätt."',
    '"Att du respekterar det gör det lättare."',
    '"Tack för det. Det är ett bra sätt att sluta."',
  ],
  respect_continued: [
    '"Jag väljer att fortsätta. Det finns mer att ge."',
    '"En säsong till. Sedan ser vi."',
    '"Kanske inte svaret du väntade dig. Men det är mitt."',
  ],
  invite_continued: [
    '"En säsong till. Det låter rätt."',
    '"Du tror på mig. Det räcker långt."',
    '"Jag tackar ja. Utan tveksamhet."',
  ],
  invite_retired: [
    '"Jag vet att du ville ha mig kvar. Men kroppen sa nej."',
    '"Det är svårt att säga nej när du ber. Men jag måste."',
    '"Tack för att du frågade. Det var ett bra sätt att avsluta."',
  ],
}

// M60/M67a (textaudit 2026-07-04/05): FAREWELL_MATCH_STRINGS var död kod
// (noll konsumenter) — WIRAD 2026-07-05 i coffeeRoomService.getCoffeeRoomQuote,
// gated på en aktiv veteran_farewell-arc vars spelares sista hemmamatch i
// säsongen är nästa matchade fixture. FAREWELL_MATCH_ATMOSPHERE + FAREWELL_MATCH_KLACK
// nedan är FORTFARANDE ONÅBARA — plain narratörsröst (ociterad) passar inte
// samma kafferumsslot som de citerade FAREWELL_MATCH_STRINGS-replikerna utan
// att blanda register; kräver antingen en egen avskedsmatch-scen eller ett
// beslut om vilken yta som ska bära dem. Opus/Jacob-beslut kvarstår för de två.

// Avskedsmatch atmosphere/klack-strängar
export const FAREWELL_MATCH_STRINGS = [
  '"{player} spelar sin sista match. {members} i klacken har förberett sig."',
  '"{player}s avskedsmatch. Publiken vet. Stämningen är extra laddad."',
  '"Det sista avslaget för {player}. Det är mer i luften än bandy i dag."',
  '"Hemmaplan. {player}s sista match. {leader} och klacken håller i det."',
]

// Legacy exports (kept for forward compatibility)
export const FAREWELL_MATCH_ATMOSPHERE = [
  'Avskedsmatch i dag. Klubbhuset gjorde i ordning kaffe extra. Klacken har målat banderoll.',
  'Sista matchen för en av oss. Det märks på läktarna.',
  'Hela bygden visste innan söndagen kom. I dag står de där.',
]

export const FAREWELL_MATCH_KLACK = [
  'Det han gett oss glöms inte.',
  'Hela klacken sjöng hans namn i halvtid. Han stod kvar och tittade på oss.',
  'Vi har sett det mesta med honom. Idag är den sista.',
  'En sista vinkning mot klacken. Ingen går hem riktigt än.',
]
