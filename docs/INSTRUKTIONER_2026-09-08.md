# INSTRUKTIONER 2026-09-08 — ägare: Codex / Code / Design

Ägar-taggad kö ur passen 2026-09-07 → 09-08. Terse med flit. Status: KLAR / BLOCKERAD (på vem) / ATT GÖRA.
MASTER ligger ocommittad hos ett annat dokumentpass — raderna nedan får inte skrivas live där; de stäms av i reconcile-passet (se CODE).

## CODE

1. liggare-ny-5 (license-router) — KLAR, byggd `649c82c2` mot DOM_LICENSE_EVENT_KALLVAL_2026-09-08. Åtgärd: markera MASTER-raden `klar` med hashen i reconcile.
2. MASTER-reconcile (när andra agentens fil släpps) — INTE mekanisk merge:
   - Markera `klar` mot hash: avsked/H4 → `acff6f6f`; regressionsvit → `50bddd86`+`ce586367`; license-event → `649c82c2`; sluttest-25 → `230c81c5`. ARCH-001 redan stängd på MASTER:108.
   - `ci-visuella-baselines-rod`: den inkommande ändringen återställer den avslutad→verifierad. AVVISA — den stängda statusen vinner.
   - avsked-raderna: se till att `acff6f6f`-siffrorna vinner över de stale inkommande.
3. Push — opushade: `acff6f6f`, `50bddd86`, `ce586367`, `230c81c5`, `649c82c2`. (`df65b78c`/ARCH ligger redan på origin/main.)
4. LOBBY_PRESS false-attribution (stående regel oavsett gren): den befintliga `accepted`/`declined`-texten i landslagText.ts (`Du ringde förbundskaptenen` / `Du lät det vara`) får ALDRIG ytas som automatisk flavour — bara som följd av ett verkligt val.
5. sluttest-25, tre öppna poster — BLOCKERAD på Opus-dom (se OPUS). Bygg inte förrän avsett beteende är domat.
6. saveConflictTwoTabs — bara om den flakar igen i CI: fixen är deterministisk tab-synk, inte tidsbunden. Höj INTE timeouten.
7. Stående ARCH-regel: ny extraktion kräver en verkligt avgränsad concern. Ingen radmålsjakt.

## CODEX

1. avbrottsbudget-d — BLOCKERAD på Jacob. Domen motsäger nuvarande KF3-modell → riktig ombyggnad, inte wiring. Bygg inte förrän scope bekräftats (det är en modelländring, inte en buggfix).
2. Mätkön är tom (avsked klar, 10k `acff6f6f`, ingen ny körning).

## DESIGN (självplockar inte — måste pekas)

1. primary-*-domkorrigeringen — "why"-texten i CI-baseline runda 2 pekar på fel scennamn; ingendera primary-scenen visar en hierarki-regression. Rätta domtexten före Jacobs CI-signoff.
2. 25-listan finns kvar men är INTE pekad — väntar på Jacobs pekning, inte en instruktion här.

## ÖPPNA BESLUT (Jacob)

1. lobbypress-mekanik-spec — gaffel: A) journalistnotis (Opus skriver texten, Code lägger liten trigger, mekaniken överges) eller B) återuppliva mekaniken (Code bygger uttagningschans-hook, öppnar scopet du stängde 2026-07-21). Radnamnet lutar B; ditt beslut.
2. avbrottsbudget-d — bekräfta att KF3-ombyggnaden är i scope.
3. sluttest-25 — go för Opus att döma de tre?
4. Design 25-listan — peka eller håll?
5. Bild: mecenatmiddag v2 (generera prompten nedan); och katalogen (60 KB) stryper MCP:n — behöver en mindre fil/utbrytning för att bild-greppen ska kunna filas.

## OPUS (jag)

1. sluttest-25, tre poster — dom avsett beteende (bug vs avsikt), pending ditt go: (a) ekonomikris-säljval utan säljbar spelare, (b) dolt moralstraff vid avslaget bud, (c) weekly decision som faller tyst till `noop`.
2. lobbypress — på din gaffel: A → jag skriver notistexten; B → till Code.
3. Bild-prompter — jag skriver; katalog-greppen kan inte filas förrän katalogfilen går att läsa.

## OFILAT (fastnat i chatt, katalog/MASTER blockerade)

- saveConflict-flaken (last-inducerad, ej bugg) — här, ej i LESSONS.
- mecenatmiddag reviderad prompt + grepp (cartoony-fix: döda svarta konturer/cel-shading, platta färgfält; location: mecenatens eget ståtliga-men-återhållna hem, ej klubbhus; figurer rakt bakifrån) — här, ej i katalogen (filen timeoutar MCP:n).
