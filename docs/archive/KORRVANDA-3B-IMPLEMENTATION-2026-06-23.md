# KORRVÄNDA 3B — implementation-bygg (live-test 2026-06-23, kväll)

**Källa:** Jacobs genomspelning av deployad build (bandy-manager.vercel.app) + 9 skärmar.
**Av:** Fable / Design · **Status:** **kritiskt — flera är regressioner / spel-logik-buggar, inte designval.** Separat från KORRVANDA-3 (som var fynd-dokumentation); detta är vad som faktiskt byggdes och gick fel.

Skala: 🔴 spel-logik-bugg (spelet brutet) · 🟠 implementation-regression (yta byggd fel) · 🟢 ren copy/css · ✓ ok

---

## A · SPEL-LOGIK — högsta prio (spelet är ospelbart här)

| # | Fynd | Kat | Detalj / beslut | Ägare |
|---|---|---|---|---|
| B1 | **Vann cup-förstarundan (Hälleforsnäs 2–3 Lesjöfors) men tas till Omgång 1, får inte spela vidare i cupen** | 🔴 | Cup-avancemanget är brutet: seger registreras (resultatet finns, "Kvar i cupen" visas en sekund) men nästa cup-match schemaläggs aldrig — spelaren dumpas i serie-omgång 1. **Cupträdet måste föra vinnaren till kvartsfinal.** Blockerande. | Code/Opus |
| B2 | **Tabell/Cupen säger samtidigt "Kvar i cupen" OCH "✕ Utslagen" på samma vunna match** | 🔴 | Självmotsägande state: rubrik "Kvar i cupen" (grön) + "Dina cupmatcher: Förstarunda Hälleforsnäs 2–3 Lesjöfors ✕ Utslagen". Vi VANN (3 > 2) men flaggas utslagna. **Vinst/förlust-avläsningen i cupen är inverterad eller läser fel lag.** Hänger ihop med B1 — troligen samma rot: cup-resultatet tolkar fel vinnare. | Code/Opus |

**B1+B2 är nästan säkert samma bugg:** cup-matchens vinnare beräknas/lagras fel → spelaren behandlas som förlorare → inget avancemang + "utslagen"-flagga, men matchresultatet (2–3) visas korrekt. Börja här. Allt annat är kosmetik jämfört med ett brutet cupflöde.

---

## B · REGRESSIONER — yta byggd fel mot vad som beställdes

| # | Fynd | Kat | Detalj / beslut | Ägare |
|---|---|---|---|---|
| B3 | **⚠️ KONSEKVENS-sektionen är HELT BORTA från matchsammanfattningen** | 🟠 | **Detta är exakt det Jacob varnade för.** Beställningen var: *styr upp utseendet på konsekvens-/"Dina val"-sektionen* (M15-mocken). Istället **togs hela sektionen bort.** Mocken var ett omdesign-förslag av en BEFINTLIG sektion — aldrig "ta bort den". **Återställ sektionen, applicera enbart den nya stilen** (utfallsrader, siffra fram). Innehållet (kapten, trötta startande, utfall) ska tillbaka. | Code |
| B4 | **Portal intro-overlay: klick på "Nästa" stänger rutan men en transparent overlay ligger kvar och låser portalen** | 🟠 | Coachmark-overlayn rivs inte ned korrekt. Bubblan försvinner men dess fångst-lager (det genomskinliga blockerande skiktet) blir kvar → hela portalen oklickbar. **Overlayn måste unmounta helt vid "Nästa"/sista steg.** Detta är "Visa intro igen"-flödet (D1) — wiringen finns nu men teardown är trasig. Blockerande för portalen. | Code |
| B5 | **Match-modalen (halvtid) är inte centrerad — ligger till höger — och blir extremt hög på mobil** | 🟠 | Två fel: (a) horisontell centrering saknas (modalen hänger i högerkant); (b) på mobil blir den så hög att den spränger skärmen + krockar med bottennavet (jfr M3). **Centrera horisontellt, kapa höjden** (se nedan, designförslag). | Design→Code |

---

## C · CTA BAKOM NAV — återkommer på FLER scener (mönstret är inte fixat brett)

| # | Fynd | Kat | Detalj | Ägare |
|---|---|---|---|---|
| B6 | **"Ankomsten"-scenen: ingen CTA** (igen) | 🟠 | Scen-intron (Ankomsten) har samma sjuka — CTA:n finns inte/ligger bakom navet. Match-INTROT fixades (bra!) men scen-modalerna ärvde inte fixen. | Code |
| B7 | **"Tre raka"-scenen: ingen CTA** (igen) | 🟠 | Samma. Pre-portal-scenen "Tre raka / Gagnef" visar text men ingen knapp framåt. | Code |

**Mönster-eskalation:** CTA-fixen applicerades på match-intro men INTE på de narrativa pre-portal-scenerna (Ankomsten, Tre raka, Cuphelgen…). De delar troligen en `SceneShell`-komponent som behöver samma `--bottom-nav-height`-regel + garanterad CTA. **Fixa SceneShell centralt, inte scen för scen.** Detta är tredje gången CTA-mot-nav dyker upp → CTA-bottennav-mockfixen (levererad) gäller även dessa scener.

---

## D · DESIGN — konsekvens-kommunikation (obegriplig)

| # | Fynd | Kat | Detalj / beslut | Ägare |
|---|---|---|---|---|
| B8 | **KONSEKVENS-kortet i portalen är obegripligt:** kedje-ikon + "Ole Carlsson är borta ett tag." — ingen orsak, ingen koppling | 🟠 | Det här är legibel-konsekvens-idén implementerad **utan kedjan** — bara verkan ("borta ett tag"), ingen orsak. **Att ta bort kortet är INTE ett alternativ** (Jacob): konsekvens-traden ska finnas. **Code/Opus måste bygga datat bakom** — orsak→verkan-kedjan ("Förlusten mot X → Ole skadad → borta 3 omg") ur ripple-traden. Kortet ska visa kedjan, inte en lös mening. Designen finns i `2026-06-22_legibel_konsekvens_design.html` — bygg motorn (RippleTrace) så ytan får sitt innehåll. | Code/Opus |

---

## Designförslag — match-modalens höjd (B5)
Modalen blir för hög för att den staplar allt vertikalt. Effektivisera ytan:
- **Centrera horisontellt** (`margin-inline:auto` / flex-center) — grundbugg först.
- **Kapa höjden:** resultat + halvtid-rubrik i en kompakt header; byteslistan scrollar i egen begränsad höjd (max ~40dvh); CTA sticky i botten. Samma mönster som CTA-bottennav-mocken (M3-sektionen) — den löser exakt det här. Modalen ska aldrig bli högre än `100dvh − nav − marginal`.
- Om det fortfarande är trångt: överväg en kompaktare byteslista (en rad per spelare, namn + position + kondition-%, inga feta kort).

---

## Prioritetsordning (rekommenderad)
1. **🔴 B1+B2** — cup-avancemang/vinnar-logik. Spelet är ospelbart förbi cupens förstarunda. Allt annat väntar.
2. **🟠 B4** — portal-overlay låser hela portalen. Blockerande.
3. **🟠 B3** — återställ konsekvens-sektionen i matchsammanfattningen (regression, Jacob flaggade risken).
4. **🟠 B6+B7** — CTA på SceneShell (Ankomsten/Tre raka). Central fix.
5. **🟠 B5** — match-modal centrering + höjd.
6. **🔵 B8** — konsekvens-kortet: **bygg datat bakom** (RippleTrace orsak→verkan). Ej ett alternativ att ta bort kortet — konsekvensen ska synas med sin kedja.

## Vad som FUNKAR (kvittens)
- ✅ **CTA i match-intro** — nu korrekt ovanför navet. Fixen fungerar där den applicerats.
- ✅ Portal, Tabell-vy, Cup-trädets layout, Trupp, matchlive-scoreboard — ser bra ut (utöver buggarna ovan).
