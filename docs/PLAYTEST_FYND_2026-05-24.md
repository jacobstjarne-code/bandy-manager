# PLAYTEST-FYND — 2026-05-24 kväll (Forsbacka-spelet)

Samlade fynd från Jacobs playtest. Ingen är crash-class — allt är trimning av ett
spel som fungerar. Grupperade per system så de blir rena Code-uppdrag.

## 1. Inbox-titlar bär för lite — repetition (PRIORITERA, billigt)

**Symptom:** Inboxen känns repetitiv. Flera poster med identiska titlar:
- "Helena Wikström · Allehanda" (flera, olika datum)
- "Träning: Fysik" (upprepat)
- "Matchresultat: 3-7" / "7-4" — utan motståndare eller omgång

**Rotorsak (verifierad i `inboxService.ts`):** `createMatchResultItem` sätter titeln
`Matchresultat: ${homeScore}-${awayScore}`. Ingen motståndare, ingen omgång. Body bär
"Ni förlorade 3-7 hemma" men TITELN — det man skannar i listan — saknar vem och när.
Samma mönster för media ("Helena Wikström · Allehanda") och träningsrapporter.

**Fix:** Berika titlarna så de är självständigt läsbara i listan:
- Matchresultat: `Matchresultat: Forsbacka–Västanfors 3–7` (eller `... 3–7 (omg 5)`).
  Motståndarnamnet finns via `relatedFixtureId` → fixture → klubbnamn.
- Media: lägg rubrikens kärna i titeln, inte bara "Helena Wikström · Allehanda".
  Just nu är journalistnamnet titeln; artikelämnet borde vara det.
- Träningsrapport: `Träning: Fysik` → `Träning: Fysik (omg N)` eller fokus-resultat,
  så två fysikpass inte ser identiska ut.

**Surface:** Titlarna är svensk text → OPUS skriver titelformlerna, inte Code. Code
kopplar in motståndare/omgång-datan. Tvådelat.

## 2. Bud kvar i VIKTIGT efter accept (diagnos klar, fix ej skriven)

**Symptom:** Accepterat bud på Erik Ström (kvitto på dash, "Fans reagerar"-post finns),
men "Inkommande bud — Erik Ström" ligger kvar i VIKTIGT-sektionen.

**Rotorsak:** Inbox-poster är historik med stabila id:n, städas avsiktligt inte. Men
en bud-post ska lämna VIKTIGT när budet får status `accepted`/`rejected`/`expired`.
Just nu rankas en avslutad affär som öppen att-agera-på.

**Fix (ej färdigläst):** Bud-postens prioritet ska följa budets status. Antingen flytta
till NYHETER när `TransferBid.status !== 'pending'`, eller para posten med sin upplösning.
Kräver att VIKTIGT-sorteringen kan läsa bud-status. ÅTERSTÅR: läsa hur VIKTIGT-sektionen
sorteras innan fix skrivs.

## 3. Cup-helg erbjuder bandyskola (diagnos klar, fix ej skriven)

**Symptom:** Inför cup-semifinal var primary-kortet "ORTEN: Kommunen erbjuder bidrag om
ni startar en bandyskola" — fel ögonblick för ett lugnt rekryteringsbeslut.

**Rotorsak (verifierad):** `getRoundCharacter` sätter `cup_day` korrekt. Men
`CHARACTER_BIAS.cup_day` är `{ next_match: 1.5, board_objectives: 0.6 }` — boostar bara
nästa-match-kortet (10→15) och dämpar styrelsemål. Den rör INTE kommun-/community-events
(`event_critical` vikt 95, `patron_demand` 70). Så ortsbeslutet vinner primary ändå.

**Fix (ej skriven):** `cup_day` ska dämpa lugna orts-/kommun-beslut (community/patron/
kommun-events) som den dämpar styrelsemål — en cup-helg ska inte erbjuda bandyskola.
Plus: verifiera att kommun-bidrag inte felklassas som `critical` priority. ÅTERSTÅR:
läsa var kommun-eventet skapas + dess priority innan fix skrivs.

## 4. Events efter semifinal — troligen RÄTT, ingen åtgärd

Inga events att reagera på efter semin, fyra efter nästa omgång. Jacob misstänker själv
att det är rätt (event-kö släpper i takt, tung matchdag håller igen). Inget pekar på fel.
Lämna tills vidare; om mönstret känns tomt över flera omgångar, mät event-kötakten då.

## 5. Events efter match — VERIFIERAT i kod, prion är rätt (men en designfråga finns)

**Jacobs fråga:** Inga events att svara på efter match, trots matnyttigt i inboxen —
är prion fel?

**Verifierat (`postMatchEventService.ts`):** Post-match genererar BARA två event-typer,
båda `priority: 'low'` med `choices: []` (inga beslut): insändare (`fanLetter`) och
motståndarcitat (`opponentQuote`, kräver marginal ≥3). Kodkommentaren: "auto-resolveras
i Reaktioner-kortet, no player decision required". Så att portalen är tom på BESLUT efter
match är by design — post-match är atmosfär, inte beslut. Beslut (bud/kontrakt/kommun/
patron) genereras i andra flöden vid omgångsövergång, inte efter match. PRION ÄR RÄTT.
(Rättelse: Opus gissade "kön släpper i takt" tidigare — fel skäl. Rätt skäl: post-match
producerar aldrig beslut till att börja med.)

**DESIGNFRÅGA (ej bugg, Jacob äger):** Inboxen visar "matnyttigt" som ANTYDER handling
utan att erbjuda den. Nemesis Sondre Almlund: "Är det dags att värva honom istället?" —
läter som ett beslut, är en inbox-post utan val. Frågan är inte "är prion fel" utan
"går gränsen mellan information (inbox) och beslut (portal) på rätt ställe?". När en
inbox-text antyder handling men inget val ges, uppstår en liten diskrepans. Ingen åtgärd
nu — men värt att tänka på: ska nemesis-antydan bli ett faktiskt värva-beslut, eller ska
texten sluta antyda handling den inte erbjuder?

## Öppna sedan tidigare (ej från denna playtest)
- Arc-namn-fix: byggd? (CODE_UPPDRAG_ARC_NAMN_2026-05-24) — verifiera i spel.
- Final-corner% 29,6 mot mål 16,7 — enda avvikelsen i stress-datan. Titt vid tillfälle.
- Trupp Fas 3-krokar — aktiveras när systemen (C-K1, Manager v1, R5, managerNote) finns.

— Opus, 2026-05-24
