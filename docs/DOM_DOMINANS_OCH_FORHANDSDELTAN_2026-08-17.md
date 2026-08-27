# DOM — DOMINANSREVISIONEN OCH FÖRHANDSDELTAN

**Datum:** 2026-08-17 · **Av:** Opus · **Poster:** O2 + O12 i `SLUTTEST_KO.md`
**Skrivs ihop eftersom de är samma fråga:** när upphör ett val att vara ett val?

---

## Två sätt att förstöra ett beslut

**Dominans:** ett alternativ är minst lika bra på varje dimension och bättre på minst en. Då finns inget val, bara en knapp. Vanliga sponsoroffer ger pengar utan motkostnad; avslag ger "inga effekter".

**Synligt facit:** alternativen skiljer sig, men spelet visar exakt hur mycket före valet. GPT valde det semantiskt rätta svaret på varselsfrågan, fick `+2` moral, och kunde se att derbyrepliken gav `+8`. Rollspel blev ett mätbart mekaniskt straff.

Det andra är värre än det första. Ett dominant val är tomt; ett val med synligt facit **bestraffar aktivt** spelaren för att spela sin roll. Och det lär ut att texten är dekoration och siffran är sanningen — vilket är exakt tvärtemot vad ett textdrivet managerspel behöver.

---

## Regel 1 — vad som gör ett val till ett val

Ett viktigt val ska:

1. Förändra minst **två** system spelaren annars hanterar separat.
2. Ha minst två alternativ där **inget** är svagare på varje dimension.
3. Kunna sammanfattas i en mening spelaren minns.

Uppfylls inte punkt 1 och 2 är det inte ett beslut. Då ska det renderas som ambient (`D1`) eller tas bort — inte som ett kort med knappar.

Detta är samma test som varsel-mallens punkt 4 och 5, i mindre skala. Varsel-mallen beskriver en systemhändelse (två–tre per säsong); den här regeln beskriver alla val.

---

## Regel 2 — vad som visas före och efter

**Före valet:** riktning, vem som berörs, och vad det kostar i en resurs spelaren kan räkna på.

- Riktning: att klacken blir gladare, inte att den blir `+8` gladare.
- Vem: namnet på den som påverkas, när någon påverkas.
- Kostnad: exakta pengar visas alltid. **Pengar är den enda resursen där exakthet inte förstör valet**, eftersom spelaren måste kunna räkna mot kassan — det är hela poängen med varsel-mallens punkt 3.

**Efter valet:** exakt utfall, alla siffror, i klartext. Och i historiken.

**Skillnaden i en mening:** före valet vet spelaren vad hen riskerar; efter valet vet hen vad det kostade. Det är så beslut lärs in — genom konsekvens, inte genom förhandsfacit.

---

## Vad som ska mätas, inte gissas

`U9`:s **val-entropi** är testet: väljer 90 % samma alternativ är det sannolikt inget val. Det mäter dominansen automatiskt över alla händelser, i stället för att någon läser dem en och en.

Två saker att mäta per val:
- Fördelning över alternativen (entropi).
- Andel val där ett alternativ har högst synligt tal på varje dimension.

**Rapportera innan något byggs:** hur många av spelets val har i dag ett strikt dominant alternativ? `2.5`-svepet har läst en del av materialet — går siffran att härleda ur det som redan är kartlagt, eller krävs ett eget pass?

---

## Sponsorerna först

Samma prioritering som varsel-mallen: sponsoroffer är den vanligaste händelsen och den tommaste. Pengar utan motkostnad är dominans i renaste form.

Motvikter som redan finns i spelvärlden och inte kräver nya system:
- **Synlighet** — var loggan hamnar, vad orten tycker om det.
- **Kategoriexklusivitet** — tar du den här kan du inte ta nästa.
- **Lokal legitimitet** — `communityStanding` rör sig.
- **Kontraktslängd** — låser dig i tre säsonger.
- **Risk** — den skumma sponsorn betalar mer och kan spricka.

Den sista är belagd: stickiness-auditen nämnde uttryckligen "den skumma sponsorn" som ett av få val som fungerade. Mekaniken finns alltså delvis — den är bara sällsynt.

---

## Vad domen INTE säger

**Inte att alla siffror ska döljas.** Pengar visas alltid, före och efter. Kassan är resursen spelaren planerar mot.

**Inte att val ska bli svårare att förstå.** Riktning och vem som berörs är *mer* begripligt än `+8`, inte mindre. Ett tal utan referensram säger ingenting om det är mycket.

**Inte att alla val ska vara tunga.** Vardagliga val ska finnas — men som ambient, inte som beslutskort med knappar. `D1` avgör hur den skillnaden ser ut.

---

## Beroenden

- **`D1`** (eventvikterna) — ambient-nivån är vad ett icke-val ska bli. Utan den finns ingenstans att degradera dem till.
- **`U9`** (telemetri) — val-entropin är hur vi vet om domen fungerade.
- **`O5`** (framgångsekonomin) — en kostnad i kronor är bara ett val om kronor är knappa. Vid 11 mkr är ingen sponsorpeng ett beslut.

Regel 2 (vad som visas) kan byggas när som helst och är billig. Regel 1 (dominansen) kräver `D1` och betyder inget förrän `O5` håller.

---

## Godkänd när

Val-entropin över spelets vanliga beslut visar att inget alternativ väljs av mer än 80 % — och att de val där ett alternativ dominerar har flyttats till ambient i stället för att ligga kvar som kort.
