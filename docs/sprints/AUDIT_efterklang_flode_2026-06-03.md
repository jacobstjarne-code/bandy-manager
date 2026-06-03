# Audit — Playtest-fixar + Efterklang flöde-redesign (2026-06-03)

Samlad runda. Räknaren (`currentMatchday`) och kalendern (`scheduleGenerator.ts`) orörda — alla fixar arbetar runt dem (filtrerar på `isCup`, räknar completed liga-fixtures, läser entry-matchday).

## Punkter i brief

### DEL A — playtest-fixar
- [x] **A1** GranskaOversikt straff-flavor-guard — verifierat via enhetstest (`granskaFlavorText`): `penResult` satt + vinst → `🎯 Straffseger`, förlust → `🎯 Förlust på straffar`; ligamatch (inget penResult) läcker aldrig straff-text (faller i margin-/kryss-grenen). Logiken extraherad till ren funktion för testbarhet; renderad output oförändrad (två färggrenar bevarade).
- [x] **A2** EfterklangThreadModal scroll — verifierat i dev-galleri: modalen öppnas via `createPortal(…, document.body)` ovanför `.screen-enter`-stacking-contexten och CTA-baren; scrollbar, äter inte touch. (Rot: `.screen-enter { animation: fadeIn }` skapar lokal stacking-context — enkel z-index-höjning räckte inte, därav portal.)
- [x] **A3** pickEfterklang-gate — verifierat via test: `< 5` spelade ligamatcher → `[]`; exakt 5 → släpper igenom; cupmatcher räknas inte. Counter-oberoende (`fixtures.filter(completed && !isCup && season)`).
- [x] **A4** EfterklangSecondary timing — gjort som del av B2: gamla `timingParts(currentMatchday)`-raden borttagen helt (ersatt av trådräknare per mock). currentMatchday läcker inte längre in i någon visad tids-text.
- [x] **A5** statsProcessor cup/liga-split — verifierat via test + simulering: nytt `seasonCupStats`-fält, `statsProcessor` grenar på `fixture.isCup`, `careerStats` är fortsatt all-tävling. STATISTIK-tabben läser `seasonStats` (nu liga-only, automatiskt korrekt). CUPEN-tabben fick cup-skyttekungar (`seasonCupStats.goals`). Migration re-summerar förorenad save: test bekräftar att cupmål exkluderas ur liga och hamnar i cup-hinken, careerStats orört.

### DEL B — Efterklang flöde-redesign (mock 2026-06-03_design_efterklang_flode.html)
- [x] **B1** Datamodell — `premiss: string` + rivalSale `soldPlayerName`/`buyerClubName` på `EfterklangMemory`; `opponentShort?` på `JournalistMemory` (fångas i `eventResolver` ur senaste ligamatchens motståndare); `lastRivalSaleInfo` på SaveGame (sätts i roundProcessor när rival_sale-momentet fyrar).
- [x] **B2** EfterklangSecondary → flöde — verifierat i dev-galleri (skärmdump `screenshots/efterklang_flode_app.png`): generisk rubrik `⬩ EFTERKLANG ⬩` + `2 trådar` höger; per rad vem (ikon + mono-uppercase namn + chevron) → premiss (dämpad, opacity 0.78) → eko (italic Georgia, citationstecken). Hela raden tappbar.
- [x] **B3** Namnfärg — verifierat: warm-light default (journalist = warm-light, INTE mockens blå `.cold` — B3 åsidosätter mocken: två toner totalt), nemesis + rivalSale = dämpad danger-rosa (`var(--match-warn)` = #E8A090, befintlig token, ingen hårdkodad hex).
- [x] **B4** Premiss-copy — Opus-copy 2026-06-03 ordagrant, verifierad per typ via test (journalist per event ± opponentShort, nemesis, rivalSale + fallback, anniversary delta 1/N, klackEcho per vikt, boardObjective, economicScar per fas, followUp).
- [x] **B5** Tråd-modal — verifierat i dev-galleri (skärmdump `screenshots/efterklang_modal_nemesis.png`): klick på nemesis-raden öppnar Theos tråd (OMG 16, "3 mål mot oss"), inte journalistens. Rad-identitet = tråd-identitet (bug #1 löst). Ingen strukturändring utöver A2-scrollfixen.

## Kod-verifiering
- `npm run build` — ren
- `npm test` — 1071/1071 grönt (+21 nya: A1×5, A3×3, B4×11, A5-migration×2; samt 3 uppdaterade roundProcessor-tester gjorda tävlings-medvetna)

## Pixel-jämförelse (Princip 4)
- `screenshots/efterklang_flode_app.png` mot `screenshots/efterklang_flode_mock.png` + mocken. Struktur, padding (11/13/12), font-storlekar (8/9/11/12.5px), letter-spacing (4px titel, 1.5px namn), border-left warm 2px — matchar. Avvikelse: journalist-namnet är warm-light, inte mockens blå (medvetet per B3).

## Edge-cases verifierade
- A3-gate: 4 vs 5 ligamatcher; cup-only-save (0 liga) → `[]`.
- A5-migration: save UTAN `seasonCupStats` re-summeras; save MED `seasonCupStats` lämnas orörd (ingen dubbel-recompute).
- journalist-premiss: big_win tar aldrig opponentShort-svansen; saknad opponentShort → fallback ", omg {N}.".
- rivalSale: enrich saknas → fallback-premiss.

## Avvikelser / antaganden flaggade till Jacob
- **economicScar phase-mismatch:** briefens premiss-tabell antog faser `acute`/`recovering` som inte finns i koden. Faktiska faser: `awareness | pressure | decision | resolved` (resolved filtreras bort). Mappning: `decision` → `Kassan är tom — igen.` (acute), `awareness`/`pressure` → `Inte länge sedan kassan var tom.`. Strängen `Ni reser er ur krisen, sakta.` (recovering) saknar matchande aktiv fas → **oanvänd**. Vill du ha den, behövs en `recovering`-fas eller annan trigger.
- **Ikoner:** mocken ritade 💔/🎯 för rivalSale/nemesis; behöll befintliga `EFTERKLANG_TYPE_ICON` (🔄/⚔️) — 🎯 krockar med boardObjective, och ikonerna är Opus-text-data.
- **rivalSale objectName:** sätts nu till spelarnamnet när enrich finns (annars "Rivalförsäljning") — mer konkret namn i rad + modaltitel.

## Tillägg samma dag — economicScar resolutions-medveten efterdyning

Löser den tidigare flaggade "oanvänd recovering-sträng": economicScar har nu TVÅ grenar.
- [x] **§1** `resolveEconomicCrisis`-effekten stämplar `resolvedMatchday` (counter-oberoende, senaste completed ligamatch) + återanvänder befintlig `outcome` som resolutionType (inget dublett-fält) + `soldToSurvivePlayerName` (fångas FÖRE `removePlayerId`). Verifierat via test per resolutionsväg.
- [x] **§2** pickEfterklang: A. aktiv kris oförändrad. B. `resolved` inom 10-omg-fönster → vägspecifik premiss/echo; utanför fönster eller saknad `resolvedMatchday` (gammal save) → ingen economicScar.
- [x] **§3** `ECONOMIC_SCAR_AFTERMATH` i efterklangText (Opus-copy 2026-06-03), fyra vägar. Gamla "Ni reser er ur krisen, sakta." fanns aldrig i koden (bara i kommentar) — kommentaren ersatt.
- **Verifiering:** dev-galleri visar 4 efterdynings-varianter + 1 aktiv kris (`screenshots/efterklang_economicscar_variants.png`). 1078/1078 test grönt (+7 nya).
- **Avvikelse:** spec bad om nytt `resolutionType`-fält; befintliga `outcome` håller exakt samma värde → återanvänt för att undvika dublett (flaggat).
