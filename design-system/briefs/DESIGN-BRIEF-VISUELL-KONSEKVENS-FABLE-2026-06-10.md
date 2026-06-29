# DESIGN-BRIEF — Visuell-konsekvens-audit (Fable-i-Design)

**Datum:** 2026-06-10
**Modell:** Claude Design på Fable 5 (färskt öga, har inte lagt lapparna).
**Karaktär:** Konsekvens-audit av *as-built*-appen mot den ratificerade standarden. INTE redesign, INTE kvalitets-/smakkritik, INTE den systemiska lång-loop-frågan. Bara: läser ytorna som ETT system, var driften ligger, hur den försonas mot standarden.

## Bakgrund — varför nu
Uttrycket har glidit isär över många generationer (mock + direkt-kod). DB-1…DB-9-passet (2026-06-05) drog tillbaka mycket, men det var *beslutsfattande* — inte en full nulägesinventering mot standarden som den ser ut nu. Och flera delar lämnades medvetet uppskjutna. Ingen har gått igenom hela appen med ett öga och frågat: läser hörnen som *varandra*? Det är det här passet.

## Den enda standarden (prioordning)
1. `design-system/colors_and_type.css` — tokens + typroller. Genererad spegel av `src/styles/global.css` (den hårda källan). Spegeln kan inte ljuga.
2. `design-system/DESIGN-DECISIONS.md` — låsta beslut + principer.
3. `design-system/README.md` — filosofi, do/don't.
4. `design-system/preview/*.html`, `ui_kits/*` — komponent- och skärm-kanon (vad det SKA se ut som).

**Vid konflikt mellan filerna vinner token/DESIGN-DECISIONS över README-prosan** — README är äldre kontext och har känd drift. Bekräftade exempel (head start):
- README "Section label — 8px / 2px-ls" + design-regel #3 → **inaktuellt**. Ratificerat: `.h-label` 9px / 2.5px (DESIGN-DECISIONS 2026-06-05, ~30 ytor använde redan 9/2.5).
- README "Score hero — 36px Georgia" → föregår `.h-display-hero` (52px, ceremoniell, R2-1) + DB-3 ScoreBlock.
Hittar du fler README-vs-token-krockar: flagga dem. Dokumentets egen drift är ett fynd.

## Vad som ÄR kanon — relitigera INTE, mät MOT
De tre principerna (nostalgi-med-jobb, förstärkning/kontrast, 70-talsliggare ej 1800-talssigill). DB-1…DB-9. R2-1…R2-3. Q1–Q4. Reserv-principen + tre-lager visuell rikedom (ceremoni avbryter / miljö omger / innehåll informerar). Score-primitiverna (LED · ScoreBlock 2px medvetet vassast · Sparkline). Guld-gränsen DB-2. Scen-typografin `.h-scene-*`. Illustrationssystemet (domänregel: bild endast vid ögonblick). LedgerFrame §LF-1…5.
**Principiellt avvisat** (om du ser det = fynd, inte förslag): pastisch (pergament/sigill/"herr Patron"), AI-slop (yt-gradienter på stora ytor, generic emoji), polerad Stålvallen v2.
Föreslå inga nya tokens, komponentvarianter eller smakändringar. Allt mäts mot det som redan står.

## Vad som är MEDVETET uppskjutet — "hitta" inte som nytt
- **DB-1 Fas 2** — alpha-snap till 5 kanoniska steg (6/18/30/35/55%). Alpha-floran (7/8/12/14/25/40%) lever tokeniserad *med flit* tills ett visuellt playtest-pass. Hård-snäpp inte.
- **Glow-steget (35%)** — varje box-shadow flaggas manuellt, auto-konverteras ej.
- **SquadScreen CA-glow/fitness** — Tailwind-rgb + glow, väntar glow-passet.
- **Commentary feed** (riktning B "Rytmen") — väntar Stålvallen-tavlan.
- **Ikoner / BottomNav-ikoner / klubbmärken (12) / emoji-piktogram** — på is, kvalitetsskäl.
- **Match-grafik utöver scoreboard** (shotmap, formation-row, subs) — backlog.
Lokalisera, bekräfta status. Föreslå inte att de "fixas nu".

## De två halvorna — och vad Design kan se
Visuell konsekvens har två halvor:
1. **Token/kod-drift** — hårdkodad hex, `${color}`-hex-append, legacy-alias-bruk (`--color-primary`, `--accent-dim` m.fl. lever "until screens migrated"), inline-reimpl av `.h-scene-*`/`.h-label`, off-scale radie, bespoke-Georgia per yta. Detekteras i KODEN mot standarden, gripbar. **Den här halvan ser du inte** (du har inte kodbasen) — Opus/Code kör den.
2. **Renderad visuell koherens** — läser ytorna som ett system; strata ögat ser; rytm/hierarki/spacing-drift som är token-laglig men visuellt inkonsekvent; ceremoni-vs-miljö-vs-innehåll-lagren som glidit. **DEN HÄR HALVAN ÄR DIN.** Och den kräver att se de faktiska renderade skärmarna.

## Capture — knuten (löses innan audit)
Du arbetar från det du matas.
- **SUBJEKT = as-built-skärmdumpar av den körande appen.** Där bor driften.
- **REFERENS = designsystem-filerna + kanon-mockarna** (vad det SKA se ut som).
- **Auditera ALDRIG mockarna som subjekt** — de är idealet, inte driften.

Jacob fångar prioritetsytorna från körande appen (han når tillstånden spelet gömmer). Checklista:
- Portal i 2–3 säsongsfaser (okt-varm, jan-kall, mars) + minst en med signatur aktiv
- Match-flöde: laddning (scen + band) · uppställning · live-scoreboard · halvtid · Taktik/Byte-modaler · Granska
- Trupp · Transfers · Scouting
- Klubb-flikarna: Orten · Akademi · Ekonomi · Tränare · Klubbminne
- Scener: Ankomst · SM-final-seger · cup · kris/nedflyttning
- Inkorg · Tabell · Säsongssammanfattning

## Leverans — försoningskarta, inte observationer
För varje yta/komponent:
- **Stratum** — vilken generation (föregår tokens? inline-reimpl av kanon-typroll? legacy-alias? bespoke-Georgia? alpha-flora? off-scale radie? ren?)
- **Avvikelse** — mot vilken specifik standard-rad
- **Försoning** — den konkreta fixen (mot existerande token/roll/komponent, aldrig en ny)
- **Prio** — bryter helheten (läser som ett annat system) > kosmetiskt

Rangordnad lista. Vill du föreslå att en yta *redesignas* för kvalitet — det är utanför scope, flagga separat, fäll inte in i konsekvens-kartan.
