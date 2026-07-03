// src/domain/data/stillnessMicroPool.ts
// C-N1 NU-fliken, Lager 4: Mikrohändelser. Opus-text 2026-05-25.
//
// 1–3 per omgång. Bygden, klubben, vädret. Atmosfäriska, icke-actionable, ofta
// torrt roliga. Drar INGA mood-effekter (Q3 låst: stannar narrativ). Namn-lätt —
// roller, inte hårdkodade förnamn — så rösten funkar oavsett save.
//
// Schema matchar STILLNESS_BEATS: body + valfria kontext-taggar. Code viktar mot
// dagen och kan blanda in smallAbsurditiesData. `subtle` = mockens dämpade variant.
//
// BLOCK 1 av 2 (~16). Block 2 följer. Targetar kvalitet, inte handoffens exakta 50 —
// hellre färre som sitter än femtio utfyllda.

import type {
  StillnessWeather,
  StillnessSeasonTime,
  StillnessForm,
  StillnessProximity,
} from './stillnessText'

export interface StillnessMicro {
  body: string
  icon?: string
  weather?: StillnessWeather
  seasonTime?: StillnessSeasonTime
  form?: StillnessForm
  proximity?: StillnessProximity
  subtle?: boolean
}

export const STILLNESS_MICRO: StillnessMicro[] = [
  { body: 'Kaffebryggaren i kafferummet gick sönder igen. Tredje gången i år, och ingen vill ta ansvar för inköpet.', icon: '☕' },
  { body: 'Bryggeriet har börjat dekorera bussen inför bortamatchen. Ingen bad dem, men ingen säger nej heller.', icon: '🚌', proximity: 'eve' },
  { body: 'Tre älgar stod på isen i morse. Vaktmästaren ringde polisen, polisen sa åt honom att prova med en visselpipa.', icon: '🦌', weather: 'cold' },
  { body: 'Vaktmästaren har målat om utvisningsbåset. Ingen hade klagat på färgen, men nu är det gjort.', icon: '🪣' },
  { body: 'Kioskens korvgryta gick varm en timme för tidigt. Lukten spred sig ända ut på parkeringen.', icon: '🌭', proximity: 'eve' },
  { body: 'Klacken har beställt en ny banderoll. Innehållet är hemligt, men tryckeriet lär redan ha läckt formatet.', icon: '🎺' },
  { body: 'Ungdomslaget vann sin cup i helgen. Pokalen står nu i en monter som egentligen är till för A-lagets gamla bucklor.', icon: '🏆', form: 'good' },
  { body: 'Lokaltidningen skrev en helsida om ny asfalt vid vallen. Sportsidan fick en notis.', icon: '📰' },
  { body: 'Det var så kallt i natt att hänglåset till materialboden frös fast. Någon löste det med en tändare.', icon: '🔒', weather: 'cold' },
  { body: 'Bruksbossen tittade förbi träningen utan förvarning. Han sa ingenting, drack kaffe, och åkte igen.', icon: '🏭' },
  { body: 'Snön vräkte ner under natten. Halva styrelsen var ute och skottade läktaren innan frukost.', icon: '🧹', weather: 'snow' },
  { body: 'En gammal supporter lämnade in ett klippalbum från sjuttiotalet. Ingen vet riktigt var det ska förvaras.', icon: '📒' },
  { body: 'Ett par nya klubbor kom med posten. De låg kvar i kartongen i tre dagar innan någon öppnade.', icon: '📦' },
  { body: 'Isteknikern gick åtta varv runt planen och skakade på huvudet. Mildvädret vill inte ge sig.', icon: '🧊', weather: 'mild' },
  { body: 'Efter förlusten var kafferummet tomt vid lunch. Bara termosen stod kvar och pyste.', form: 'poor', proximity: 'day_after', subtle: true },
  { body: 'Någon hade glömt strålkastarna på över natten. Elräkningen lär bli en punkt på nästa styrelsemöte.', icon: '💡' },

  // ── Block 2 ────────────────────────────────────────────────────────────────
  { body: 'Första bilen på parkeringen halv sex igen. Det är alltid samma bil, och ingen frågar längre vem det är.' },
  { body: 'Backens chef gav honom ledigt för bortamatchen, mot att han täcker ett extra skift i jul.', icon: '🔧', proximity: 'eve' },
  { body: 'Någon sprejade derbydatumet på busskuren vid torget. Kommunen målade över det, klacken sprejade tillbaka.', icon: '🚏' },
  { body: 'Spolningen tog längre tid än vanligt i kvällskylan. Vaktmästaren stod kvar tills isen låg blank.', icon: '💧', weather: 'cold' },
  { body: 'Strömmen blinkade till under kvällsträningen. Alla stannade, väntade, och fortsatte när lamporna kom tillbaka.', icon: '⚡' },
  { body: 'Kyrkklockorna hörs ända ner till vallen när vinden ligger rätt.', icon: '🔔', proximity: 'eve' },
  { body: 'Den nya sponsorskylten vid sargen sitter lite snett. Ingen har sagt något till sponsorn än.', icon: '🪧' },
  { body: 'Ungdomstränaren stannade kvar efter passet och sköt straffar ensam i en timme. Gammal vana.', icon: '🥅' },
  { body: 'En gammal back tittade in på träningen. Han sa inget om förr, bara att isen är snabbare nu.' },
  { body: 'Första riktiga frosten kom i natt. Halva orten skrapade rutor för första gången i höst.', icon: '❄️', weather: 'cold', seasonTime: 'early' },
  { body: 'Någons högerhandske har legat i båset i två veckor. Ingen vet vems, ingen tar den.', subtle: true },
  { body: 'Det pratas tabell även i mataffärens kassakö nu. Kassörskan har en egen teori om slutspelet.', seasonTime: 'late' },
  { body: 'En av de gamla lagade en spricka i sargen med en bit plywood. Det håller, säger han, och det gör det.', icon: '🔨' },
]
