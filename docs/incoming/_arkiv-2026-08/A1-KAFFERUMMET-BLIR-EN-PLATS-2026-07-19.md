# A1 — Kafferummet blir en plats (designspec)

**Från:** Design · **Datum:** 2026-07-19 · **Spår:** A (SPEC_SYNTES_PLATS_OCH_DRAMATURGI.md)
**Format:** ytkarta, samma som sidfots-auditen · **Leverans till:** A2 (Code, nybygge) + A3 (Fable, text)

Kafferummet ska bli en plats man går till, där en av stammisarna ställer en fråga till spelaren, och där svaret minns. Interaktiv version + mock: `A1 — Kafferummet blir en plats.dc.html`.

---

## A0 (Codes verifiering — klar, motiveringen)

`CoffeeRoomScene` **finns och är nåbar** — men bara via ett **tvåstegsklick** på sekundärkortet `coffee_room_card` (vikt 60, konkurrerar om en av tre sekundärslots). Den som inte klickar ser **en enda trunkerad rad** av allt rummet rymmer (fyra fasta röster, ~45 vardagsutbyten, resultat-/svit-/deadline-varianter, årsdagsekon, klack-eko, avskedsrader, fatigue-toner). Rummet dubbleras in i flödet som en avhuggen mening i stället för att vara någonstans man går.

**Konsekvens:** A2 är **nybygge, inte wiring**. D4 (kortet blir dörr) är inte en förfining utan själva åtgärden mot dubbleringen.

**A1 avgör:** frågans uppkomst · svarets form · återkomstens plats · portal-kortets roll · ceremoninivå & emoji.
**A1 avgör inte:** frågornas/svarens text (A3, Fable) · sparfält, determinism, nybygget (A2, Code).

---

## Vad som redan finns (rör inte)

Fyra fasta röster + ~45 vardagsutbyten, resultat-/svit-/deadline-varianter, årsdagsekon, klack-eko, avskedsrader, fatigue-toner. Namngivna stammisar: **Sture** och **Magnus**. Determinism via seed på matchday/säsong, anti-upprepning på plats. **Den poolen ska bära det nya, inte ersättas.** Utbytena är i dag slutna tvåreplikersväxlar mellan funktionärer — spelaren står utanför och lyssnar. Det är rummets styrka (levande plats) och dess tak (man kan inte delta).

---

## D1 · Frågans uppkomst — Sture vänder sig om

Frågan poppar **inte** som en ruta ovanpå scenen. Den är *tredje beaten* i ett samtal man redan tjuvlyssnar på. Rummet fade:ar in sina 1–2 ambienta växlar som i dag; sedan — samma fade-rytm, ingen ny yta — vänder sig en av de fasta rösterna (default **Sture**, den etablerade) från sin motpart och tittar upp på spelaren. Repliken adresseras *dig* för första gången. Väggen bryts en gång per besök, och bara då.

- Övergången markeras av **blick och adress**, inte ny chrome: ambient växel = talar-etikett + två repliker mellan tredje part; frågan = Stures etikett + en replik riktad utåt ("Du då — vad säger du?"). Samma typografi, ny mottagare.
- **Gated läge** (som fatigue/anticipation redan är) — kryddar, dominerar inte. Rutinbesök förblir rena tjuvlyssnar-scener.
- Tonregeln håller: understatement, ingen utropsdramatik. Sture frågar som Sture frågar — kort, konkret, mellan raderna.

*Grundning:* FATIGUE-poolens Sture/Magnus · getCoffeeRoomScene gated-lägen (hotStreak, anticipation).

---

## D2 · Svarets form — två repliker i din röst

Svaret ärver Valets **likvärdighetsprincip** men inte dess **form**.

- **Från Valet:** A-1 (inget alternativ förvalt) + A-2 (select→confirm — ett tap markerar, övriga dämpas, en bekräfta-CTA bär valets egen formulering; inget commitas på första tap).
- **INTE med:** valkortens anatomi. Inga horisont-taggar, inga konsekvens-deltan (↑/↓), inga "klar om ~N omg".
- **I stället:** två *kursiva Georgia-repliker* — sånt du skulle kunna säga tillbaka till Sture, i citatröstens register (samma som rummets alla repliker), inte i knapp-look. Markering = kopparram + full opacitet på vald, dämpning på den andra (Valets A-2-mönster), men skalet är en **replik**, inte ett beslutskort. Bekräftelsen är sidfotsmallens `.btn-cta` med valets ord ("Säg det →").
- **Likvärdighet — ingen "rätt" replik:** båda är hållbara hållningar, inte bra/dåligt. Ingen delta i stunden — konsekvensen (om någon) kommer som att svaret *minns* (D3), inte som en siffra. Håller rummet narrativt, inte transaktionellt.

*Grundning:* ValetScene A-1 (noPresetNote) + A-2 (toggleSelect → confirmCta) · h-quote/kursiv Georgia = rummets röstregister.

---

## D3 · Återkomsten — svaret citeras tillbaka okallat

En senare omgång, utan att spelaren öppnar något, dyker svaret upp som **en av de vanliga fade-in-växlarna**. Sture (eller Magnus, till Sture) refererar vad du sa — som bruksklubbs-vardag, inte som callback-ceremoni. Ingen ny yta, ingen historik-flik, ingen "du valde X"-kvittens. Minnet lever där samtalet lever.

- Seedas på det sparade svaret + matchday (Codes sak) — landar en gång, deterministiskt, inte varje besök.
- Ligger som gated tillägg i `getCoffeeRoomScene`-poolen, samma prioritetslogik som victory-echo/farewell (starkt, ovillkorat, en gång).
- Tonen är *bekräftelse genom att ha hört*, inte belöning. Rummet minns för att en plats minns, inte för att spelaren "vann".

*Grundning:* getCoffeeRoomQuote:s pendingVictoryEcho/farewell-prioritet.

---

## D4 · Portal-kortet — coffee_room_card blir dörr, inte kopia

Åtgärden mot A0:s dubblering. I dag renderar kortet en trunkerad rad av samtalet inline (vänsterstripe, vikt 60) — rummet är på två ställen samtidigt.

- **A1:** kortet visar att rummet är "öppet" i dag med en **lockrad + DS-chevron** (16×16, radie 4, koppar `›`). Tap = gå in i rummet. Samtalet bor på *ett* ställe.
- Kortet behåller sitt skal (`--bg-portal-surface` + vänsterstripe) och sin sekundär-vikt — det är *innehållet* som byter roll, från kopia till lockbete.
- När en fråga väntar lyfts lockraden ("Sture har något på hjärtat i dag."); annars en neutral "dörren står öppen"-rad utan att avslöja samtalet.

*Grundning:* DS chevron-nav · Portal secondary-card-skal · vikt oförändrad, roll ändrad.

---

## D5 · Ceremoninivå & emoji — dömd

**Rummet är INTE ceremoninivå.** Ceremoni = en gång per säsong, läder, typografisk hjälte (Valet, cupfinal, avskedsmatch). Kafferummet = återkommande, varmt, vardag ("Tisdag förmiddag"). Att lägga ett svar i det gör det till en *plats med ett samtal*, inte ceremoni — så lyft det **inte** till läder-typografisk hjälte; behåll det varma `--bg-scene`-registret och den kursiva rösten.

**Men ☕ i scenhuvudet ska ändå bort.** Emoji-regeln är sluten: emoji = domänkategori i sektionsetiketter på *overview-ytor*. Ett scenhuvud är varken overview-etikett eller ceremoni — det är sitt eget register (genre-ögonbryn + Georgia-titel + kursiv setting). Där är ☕ dekoration, och dekorativ emoji är förbjuden. VictoryTrophy tappar emoji för att den är för *stor* för den; kafferummet för att den är för *stillsam* för den. Åt två håll, samma slutsats.

*Grundning:* DS emoji-regel (overview-etiketter only) · VictoryTrophy "B3: ingen emoji på ceremoninivå" · SceneHeader-registret.

---

## Sammanfattning

| # | Beslut | Dom |
|---|---|---|
| D1 | Frågans uppkomst | Sture vänder sig till spelaren som tredje beaten — väggen bryts en gång, samma fade-rytm, gated läge. |
| D2 | Svarets form | Två kursiva repliker i din röst; Valets A-1/A-2-likvärdighet, men inte valkortens anatomi (ingen tagg/delta/horisont). |
| D3 | Återkomsten | Svaret citeras tillbaka okallat i den ambienta stacken, seedat, en gång — inget arkiv, ingen kvittens. |
| D4 | Portal-kortet | coffee_room_card blir dörr, inte kopia: lockrad + chevron in i rummet. Skal & vikt oförändrade, roll ändrad. |
| D5 | Ceremoni & emoji | Inte ceremoni (behåll varmt register). ☕ bort ur scenhuvudet — dekorativ emoji förbjuden utanför overview-etiketter. |

**R1-kedjan A2 ska kunna skriva ut i commit:** Sture frågar → svaret sparas i SaveGame → syns i rummet → spelaren väljer → svaret citeras tillbaka en senare omgång.

**A3 (Fable)** skriver frågorna, svarsparen och återkomstraderna när formen ovan är fastställd — inte tidigare.
