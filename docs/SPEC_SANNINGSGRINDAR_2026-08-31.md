# SPEC — SANNINGSGRINDAR (checks mot stale status + shippade platshållare)

**Datum:** 2026-08-31 · **Av:** Opus · **Beställd av:** Jacob · **Bakgrund:** `docs/INVENTERING_2026-08-31.md`. Sessionens fynd: ingen falsk BYGGT-lögn, men statusfilerna hade drivit stale åt andra hållet (färdigt kallat öppet, öppet tappat), och två konkreta spelarvända skador — raderad bevarad text (`d0d4d923`) och shippade `[Opus]`-platshållare på nåbara ytor.

**Grundprincip, gäller varje grind nedan:** en check som inte failar bygget är teater. Alla grindar wiras in i `npm run build`/CI. (Motexempel som INTE ska upprepas: M5-textstorleksgrinden är byggd, körd och aldrig CI-kopplad — den fångar noll.)

---

## GRIND 1 — [Opus]-NÅBARHETSGRIND (vänd `opusPlaceholderGate.ts`)

**Rotorsak:** dagens grind *tillåter* `[Opus]` att shippas — den kapar bara antalet per fil (`maxAllowed`). En nåbar, blank platshållare passerar så länge den är allowlistad. Det var precis så sju blanka strängar nådde FatigueFloorConfirm (en yta spelaren står på). Grinden ska skilja **nåbar-och-blank (måste fyllas före merge)** från **overifierad-fallback / dokumentationsmetadata (spårad skuld med klocka)**.

### Ändringar
1. **Utöka allowlist-postens typ** i `tests/grind/opusPlaceholderGate.ts`:
   ```ts
   { file: string; maxAllowed: number; reason: string;
     reachable: boolean;   // når en spelare denna sträng i normalt spel?
     owner: string;        // 'Opus' | 'Code' | 'Jacob'
     since: string }       // ISO-datum posten först loggades
   ```
2. **Ny regel i `scanOpusPlaceholders`:**
   - `reachable: true` med `count > 0` → **ALLTID violation**, `maxAllowed` ignoreras. En nåbar blankett får aldrig shippas. Hard fail.
   - `reachable: false` → violation om `count > maxAllowed` (som i dag) ELLER om `since` är äldre än `STALENESS_DAYS` (default 30 — Jacobs att tuna). Spårad skuld, men med en klocka så den inte bor för evigt.
   - Ingen allowlist-post + `[Opus]` finns → violation (oförändrat).
3. **Steg 0 — försona allowlisten mot verkligheten (denna session):**
   - **TA BORT** `FatigueFloorConfirm.tsx` (maxAllowed 7) och `LineupStep.tsx` (maxAllowed 1) — bägge fyllda 2026-08-31, count nu 0. Stale poster.
   - Re-tagga de fyra kvarvarande med `reachable`/`owner`/`since`:
     - `turneringslageService.ts` → `reachable: false` (strukturellt onåbar fallback-gren)
     - `valetScene.ts` → `reachable: false` (fallback för nod utan CTA, typmässigt overifierad)
     - `KlubbparmOverlay.tsx` → `reachable: false` (chapterAwaitsText-säkerhetsnät)
     - `contentContract.ts` → `reachable: false` (dokumentationsmetadata, aldrig renderad — inte ett läckage alls; överväg helt eget undantag så den inte ens räknas)
4. **Wira in i CI** — en grind-test som anropar `scanOpusPlaceholders()` och failar på varje violation, i `npm run build`-kedjan (samma mönster som `standingPositionReadGate`).

**Godkänt när:** en ny nåbar `[Opus]` på en spelaryta failar bygget omedelbart, en overifierad fallback spåras med ägare + datum och failar när den blir för gammal, och de två stale posterna är borta.

---

## GRIND 2 — BEVARANDETEXT-RADERINGSGRIND (ny)

**Rotorsak:** `d0d4d923` raderade `hallDebateData.ts` och tog med sig fyra bevarandelistade textpooler — motiveringen gällde bara `HALL_DEBATE_EVENTS`, de andra fyra föll osynligt med filen. `BEVARANDELISTA.md`s regel ("ingen rad raderas") har ingen mothake i kod.

### Ändringar
1. **`BEVARANDELISTA.md` får ett maskinläsbart block** — ett fönstrat block (```` ```bevarandelista ````) med skyddade `export`-identifierare, en per rad, synkat med människoprosan ovanför. Prosan förklarar; blocket är sanningen grinden läser. (Format: bara export-namnet, t.ex. `HALL_NEWS_POSITIVE` — grinden greppar namnet i `src/`.)
2. **Ny grind `tests/grind/preservationGate.ts`** (samma metod som `opusPlaceholderGate`: kodbas-brett grep, `stripComments`, exkl. tester): för varje skyddat namn i blocket, greppa `src/` — **noll förekomster utanför kommentar = violation** (bevarad text raderad). Rapportera namnet + att det ska återställas ur git-historiken.
3. **Wira in i CI.**

**Godkänt när:** en radering av en bevarandelistad pool failar bygget med namnet på det som togs bort. (Detta hade stoppat `d0d4d923` i sitt spår.)

---

## BATCH 2 — BILLIGA SANNINGSGRINDAR (Code, permanenta, lägre brådska)

**GRIND 3 — commit-hash-existens.** En grind som greppar `SLUTTEST_KO.md` + `BACKLOG.md` efter `KLAR <hash>` / `(\`[0-9a-f]{7,}\`)`-mönster och kör `git cat-file -e <hash>` på var och en. Saknad/feltypad hash = violation. Fångar fabricerade och feltypade referenser.

**GRIND 4 — supersede-pekare.** En grind som hittar domar/specar med "ersätter"/"superseterar DOM_X"/"överspelar" och verifierar att DOM_X bär en ⛔-markör i sitt filhuvud. Fångar de två domar vi hittade utan pekare (FRAMGANGSEKONOMIN, AH2B_BUDGETTRYCK).

**REGEL 5 — härledda fakta genereras, skrivs aldrig.** En statusrad som är ett härledbart git-faktum (okommitterat antal, "HEAD på X", "fil finns") får inte stå som handskriven prosa i en statusfil — den genereras eller utelämnas. ("203 filer okommitterat" satt stale i fyra dagar överst i BACKLOG för att den var handskriven.) Grind valfri; regeln i CLAUDE.md är minimum.

---

## PROCESSREGLER — ADOPTERAS NU (inte kod)

Dessa fångar det ingen grind kan: att en rapport routas till bygge på tro.

**REGEL A — "rapporterad" ≠ "verifierad", hård statusskillnad.** En öppen-post har två tillstånd. Bara den **kodlästa** får byggas mot. Ingen post routas till bygge förrän någon läst den faktiska filen — inte en rapport, inte minnet, inte en sammanfattning. (Detta var precis steget som hoppades den här sessionen. Code införde språket "reported, not double-checked" mitt i — gör det till regel.)

**REGEL B — adversariell stickprovskontroll som default.** Varje öppen-lista över ~10 poster får ett slumpat stickprov verifierat av en ANNAN agent/instans än den som skrev listan, före åtgärd. Träffgraden rapporteras. Under `HITRATE_MIN` (default 70 % — Jacobs att tuna) = hela listan är otillförlitlig, verifieras om post för post. (Det var detta som räddade oss: Code spot-checkade sju, 2 höll. Institutionalisera det så det inte hänger på att en enskild instans råkar vara disciplinerad.)

**Ärlig gräns:** Regel B är det närmaste vi kommer en check mot att en instans äger både arbetet OCH domen över arbetet — den låter en andra part granska by default. Men ingen regel fångar att en miss beskrivs bort i efterhand med en fin formulering. Det är karaktär, inte infrastruktur.

---

## ÄGARSKAP & ORDNING
Code bygger. Ordning: **GRIND 1 + GRIND 2 först** (de fångar de två konkreta spelarvända skadorna vi faktiskt led), sen batch 2. Regel A + B adopteras omedelbart, kostar noll. Jacob: två tal att tuna — `STALENESS_DAYS` (grind 1) och `HITRATE_MIN` (regel B); defaultarna ovan duger tills du säger annat. Opus: fyller `BEVARANDELISTA.md`s maskinläsbara block och håller det synkat när text får/tappar en yta.
