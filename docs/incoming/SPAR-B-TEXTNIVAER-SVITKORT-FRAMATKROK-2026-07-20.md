# Spår B — textnivåer (B5), svitkort (B4), framåtkrok (B3)

**Från:** Design · **Datum:** 2026-07-20 · **Format:** ytkarta + mock, samma som sidfots-auditen
**Leverans till:** Code (wiring — datat finns i alla tre) + Fable (text när formerna är låsta)
Interaktiv version + mockar: `Spår B — textnivåer, svitkort, framåtkrok.dc.html`

Ordningen är avsiktlig: **B5 → B4 → B3**. B5 sätter nivå-vokabuläret som B4 (svitcitat = karaktärsnivå) och B3 (kroken = konsekvens+atmosfär) lutar sig mot.

**Design avgör:** formen (B5), rösten + avgränsningen (B4), placeringen + vikten (B3).
**Design avgör inte:** texten (Fable) · wiring/sparfält/determinism (Code — datat är byggt).

---

## B5 · De fyra textnivåerna — ett uttryck var

**Grund:** `WRITING_GUIDELINES DEL 8` (2026-07-19). Guiden delar all speltext i fyra nivåer och konstaterar problemet ordagrant: *textauditen har dömt sanning och ton, aldrig vikt — en atmosfärsrad ser i dag ut ungefär som en konsekvensrad, vilket tvingar spelaren att läsa allt för att veta vad som var viktigt.* Guiden säger uttryckligen att nivån ska framgå av **form**, inte av ännu en mening ("OBS, viktigt:" är en design-bugg, inte ett textproblem — Designs domän).

Fyra fasta behandlingar, kaskaderande kontrast, byggda ur tokens som redan finns:

| Nivå | Uttryck | Formregel |
|---|---|---|
| **1 · Beslut** (måste läsas, påverkar ett val NU) | Georgia 700 16px, koppar 3px-stripe + kopparsken, fylld yta | Högst kontrast, störst. **Position: överst, kan inte scrollas förbi.** Bär alltid en handling. |
| **2 · Konsekvens** (förklarar vad ett val ledde till) | Georgia-numeral + ↑/↓-delta i semantisk färg, ankrad i data | Medelkontrast. Efter faktumet, aldrig överst. |
| **3 · Karaktär** (bygger relation, plats, minne) | Kursiv Georgia (`.h-quote`), namngiven röst, tunn koppar-vänsterlinje | Läses som röst, inte chrome. Ingen fylld yta. |
| **4 · Atmosfär** (färg, får hoppas över utan förlust) | Dämpad `--text-muted`, kursiv, `.h-micro` (9–11px), ingen ram | Lägst kontrast, minst. Aldrig egen yta — löper i marginalen av annat. |

**Före/efter:** samma fyra-raders briefing renderad platt (samma storlek/färg/rytm → spelaren måste läsa alla fyra för att hitta beslutet) vs nivåindelad (beslutet läses först utan ansträngning; atmosfären får finnas utan att kosta).

**Dom:** blir en DS-kanon — fyra klasser (t.ex. `.txt-beslut / -konsekvens / -karaktar / -atmosfar`) som textauditen sedan kan döma **vikt** mot, inte bara sanning och ton. Vikten sitter i position + kontrast + storlek, aldrig i en extra mening.

---

## B4 · Kris- och svitkortet — egen röst, akut form

**Grund:** svitdetektionen finns (`coffeeRoomService` winning/losing, `trainerArcService` crisis vid ≥3 raka förluster). Två beslut åt Design.

### B4·1 — Röst: funktionären, inte journalisten, aldrig tränaren

- **✗ Tränaren** — utesluten. Spelaren *är* tränaren (samma slutsats som fällde coach-citaten, pool 3). En tränarröst har ingen talare.
- **~ Journalisten** — äger redan ett reaktivt kort med severity (kall/varm). Lägger man sviten där dubblas journalistytan, och sviten blir nyhet i stället för känsla.
- **✓ Funktionären** — kassören, ordföranden, vaktmästaren: klubbhusets register. Sviten känns lokalt *innan* den blir nyhet. Sture-understatement, inte rubrik.

Ren arbetsdelning: **journalisten bär extern press** (media, rubrik, relation), **funktionären bär intern temperatur** (klubbhusets oro/tysta glädje). Förlustsvit oroar kassören; segersvit gör ordföranden stillsamt nöjd. Tonen byter tecken, talaren stannar i klubbhuset.

### B4·2 — Avgränsning: signaturen är väder, sviten är puls

`season_signature_card` = säsongslång tonalitet ("hela vintern blir kall") — lugn, långsam, 2px vänster-stripe, Georgia-versal namn, "aktiv signatur"-tag, neutral fakta-rad. Svitkortet = akut och kortlivat ("just nu tre raka"). De får inte läsa lika. Tre drag skiljer dem:

1. **Form-rutor** — sviten visas som FormSquares (F F F / V V V), inte en färgton. Ankrar den i data; signaturen har ingen sådan form.
2. **Topp-stripe** — stripe på *toppen* som fadar (transient), inte signaturens stilla vänsterkant. Läser "nu", inte "hela säsongen".
3. **Röst-rad** — funktionärscitat (karaktärsnivå, B5·3), inte signaturens neutrala fakta-rad. Klubbhus, inte väderleksrapport.

**Dom:** funktionärsröst; skiljs från season_signature på de tre dragen; tecknet (V-svit/F-svit) byter färg och ton men behåller formen. Två parametrar åt Fable: funktionärens svit-repliker (segertyst / förlusttyst) och tröskeln (crisis ≥3 finns; segersvit-tröskeln sätter Code ur samma winning-detektion).

---

## B3 · Framåtkroken i Granska — förbereder, avancerar inte

**Grund:** `getNextOpponentTeaserFacts` är byggd (motståndarform, obesegrad svit på planen, serieläge, tidigare möte). Servicekommentaren är explicit: *"Granska ska sluta i nästa laddade sak — Design äger PLACERINGEN, var i Granska-flödet och vilken vikt mot CTA:n. Fable äger MALLEN."*

### B3·1 — Placering: sist, ovanför CTA:n

Granska stänger i dag i administration ("KLAR — NÄSTA OMGÅNG"). Kroken flyttar slutet från *ett avslut* till *en riktning framåt*: den sitter direkt ovanför CTA:n, som sista innehållsblocket. Spelaren läser en rad om nästa motstånd, sedan trycker de vidare. Den **förbereder**; den avancerar inte. Sidfotsmallen (`.btn-cta`) äger fortfarande den enda framåt-handlingen.

### B3·2 — Vikt: B5-nivå 2–4, aldrig nivå 1

Här möts B3 och B5. Kroken bär *ingen* beslutstext — den kräver inget val, så den får inte se ut som ett beslut. Den läser som **konsekvens** (motståndarens form som V/F-rutor + serieläge, databackad) buren av en tunn **atmosfärsrad** (Fables krok-mening). Visuellt: is-tonad, dämpad, under CTA:ns vikt, aldrig kopparfylld, aldrig egen pil. Vore den nivå-1-form skulle den konkurrera med sidfoten om blicken — precis det den inte får (samma dubbel-primär-fälla som PT-5).

**Dom:** krokraden är Granskas sista block, direkt ovanför CTA:n; B5 nivå 2–4; is-tonad/dämpad/formrutor + rad/ingen pil/ingen kopparfyllning. Fable skriver mallen ("Nästa: {opponent} {hemma/borta}. {form-mening}.") med tokens ur servicen; alla fakta databackade (WRITING_GUIDELINES #9).

---

## Sammanfattning

| # | Fråga | Dom |
|---|---|---|
| B5 | Fyra textnivåers form | Kaskaderande kontrast: beslut (koppar-stripe/Georgia 700/överst) → konsekvens (numeral+delta) → karaktär (kursiv citat-linje) → atmosfär (dämpad micro). Vikt i position+kontrast+storlek. → fyra `.txt-`-klasser. |
| B4 | Svitkortets röst + avgränsning | Funktionären (ej journalist, ej tränare). Skiljs från season_signature på tre drag: form-rutor, transient topp-stripe, funktionärscitat. Akut puls, inte säsongsväder. |
| B3 | Framåtkrokens placering + vikt | Granskas sista block ovanför CTA:n. B5 nivå 2–4 (konsekvens+atmosfär), aldrig nivå 1: is-tonad, dämpad, formrutor + rad, ingen pil. Sidfoten behåller enda avanceringen. |

**Kedjan:** B5 sätter nivå-formerna → B4:s svitcitat är karaktärsnivå (B5·3), B3:s krok är konsekvens+atmosfär (B5·2–4). Fable skriver texten när formerna är låsta; Code wirar (datat finns i alla tre). Nästa `.txt-*`-klasser till `global.css` före första nivå-passet.
