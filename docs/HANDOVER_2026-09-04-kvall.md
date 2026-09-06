# HANDOVER 2026-09-04 (kväll) — till nästa Opus-chat

Läs detta först, sedan root `CLAUDE.md`, `docs/MASTER_OPPET.md`, `docs/DOMLOGG_2026-08-31.md §1`, `docs/LESSONS.md`, senaste `HANDOVER`. Verifiera workspace-verktygen vid start (de varierar). Jacobs preferenser gäller: exekvera direkt, inga man-timmar, avsluta inte konversationer, skriv svensk text direkt (spec:a den aldrig till Code), en dom = en rad + en fil + DOMLOGG-index.

## Vad den här veckan var

Sju GPT-speltest + två Claude Design-granskningar mötte en kodbas som just fått en **händelseliggare**. Mönstret genom allt: *spelet har ett minne men ännu ingen pålitlig berättare*. Veckan byggde berättaren. Rollfördelning som hållit: **GPT speltestar**, **Codex/Code bygger** (Codex brett-mekaniskt, i domänen), **Opus dömer och skriver svensk text**, **Jacob äger domän + beslut + illustrationer (Gemini/Nano)**. Fyra agenter i ett träd → sekvensering är Jacobs, ingen väntar ut någon (LESSONS #51, tre kollisioner på två dagar).

## Var spelet står (se `RAPPORT_HELHETSGENOMGANG_2026-09-04.md`)

Innehållsmässigt nästan klart, redaktionellt halvvägs. Bär: personer och relationer (burnout, mecenat, brev, Kristoffers mål). Saknas: att systemen *berättar* vad de gjorde. Positionering: **"ett managerspel som minns dig"**, inte "FM för bandy". Release-mål: **november 2026, mjuk oktober** (bandyns säsong; annandagen är julafton). Modell: **gratis + supporter (Hattrick)**. Distribution: **PWA, ingen store**.

## Berättaren — kärnan i allt

`redaktoren(game, chronology)` (byggd) ger rankad agenda över liggaren: significance × relationsvikt (personer/relationer 1,4, match 0,8) × färskhet (tre köer) × otaldhet (`ledgerTold`), eskaleringsreset via `semanticKeyStem`. Sju ytor. **Byggda (Codex, ej committat vid handover):** steg 1–8 — ledgerTold, currentChronology, redaktören, Portal memory_card, årsbok Säsongens person, Efterklang på agendan, push-adapter, kafferum. **Kvar:** steg 9 (återfall — dom står, `DOM_ATERFALL_ARCS`), callbacks (kräver managerId), press k11, F→B-migreringar.

## Opus-domar som ligger, byggbara nu (Code)

Alla i DOMLOGG §1 med fil:
- `DOM_FORMATIONER_V2` — **BYGGD** (18ff34e3). Sex uppställningar, femman bak, heightMode.
- `SPEC_B12_GRANSKA_MATCHENS_SAMBAND` — Matchens samband-kort, text låst, `origin:'TRANSITION'`.
- `DOM_LIGGARE_CLUBID` — managerId + subjectSnapshot; låser upp callbacks.
- `SPEC_BERATTAREN` — hela redaktionen; push är en yta i den, inte egen redaktion.
- `DOM_AKADEMI_LIGGARE` — åtta typer, attribution ur `loanBonus`, junior-20 (Jacobs kall).
- `DOM_ATERFALL_ARCS` — steg 9, per producent VARIANT/SKIP/PER INSTANS.
- `SPEC_FORHANDLING_TERMER` — c-t8: handpenning/boende/jobb/ansikte, värde≠kostnad.
- `STICKINESS_COPY_REGISTER` — ~45 pushmallar, fem röster, permission-flöde.
- `DOM_KALIBRERING_AVSKED_HEROS` — **baslinjen flyttad** (Survive-undantaget, se nedan): mät per avskedsorsak.
- `RAPPORT_OMSPARNING_SYSTEM` — sex nya typer (`liggare-ny-*`, rapporterade, väntar Codes RAW v2).
- `ILLUSTRATIONER_KATALOG` — 35 bilder, 19 prompter klara att köra.

## Veckans viktigaste enskilda fynd

**Survive-tier kunde inte sparkas sportsligt** — explicit kodundantag + test som krävde immunitet. Heros "100 % avsked" var 100 % licensnekan; H4-klippan är sannolikt en licensklippa. GPT:s tre SVÅR-karriärer utan avsked bevisade gaten, inte balansen. Codex öppnade väg A (tre miss + tålamod ≤ 15). **Kalibreringsrundan får inte köras på gammal baslinje.** LESSONS: en assertion som kräver att något aldrig händer är en dom, hör i DOMLOGG.

## Codes/Codex kö (byggbart utan input, håll lanes: liggare / motor / akademi+förhandling)

Block 1 (sanningen en): steg 9 · sex nya typer efter RAW · F→B-migreringar (Granska nästa-match PRIO 2, header, managersektion) · subjectSnapshot.
Block 2 (taktik): B12 · formationsskript utanför tsconfig · kalibrering A/B/C ny baslinje.
Block 3 (personer): akademins åtta · c-t8 · junior-20.
Plus stängbara småfixar från styrelsetestet (burnout relief+tak, licens under Dina val, AI-dubbelflytt är redan klar, nostalgibrev-ålder) och npm-audit.

## Jacobs öppna beslut (★ = blockerar)

★ Survive-A/B · ★ junior-20 (kort + tröskel) · supporter-modell + när backend-passet börjar · release-fönster nov 2026 · kanaler (Bandypuls/klubbar/lokaltidningar) · Erik vs Gemini för fyra momentbilder · Vercel main→preview (brådskande, prod-deploy vid varje push) · backend/dataskydd för push · 1.4-diffarna (CI röd på 109 baselines) · illustrationer (19 prompter i katalogen; Hälleforsnäs klippa-korr + Slottsbron ev.).

## Ocommittat vid handover

Codex/Code: steg 8 + tidigare pass ligger lokalt (Jacob sekvenserar commit). Opus: alla dagens docs (ovan) + MASTER/DOMLOGG/LESSONS/kanon/kalibreringsdomen/stilbibeln — bara docs, ingen kodkrock. Jacobs illustrationer i `public/assets/illustrations/` + `docs/incoming/`.

## Metodlärdomar som är nya (LESSONS #53–56 + veckan)

Dumpordning ≠ spelordning (dev-scen bevisar inget före kodläsning) · skriv-utan-läs (producent utan konsument = kunskap ingen berättar) · filter med dolt antagande utesluter tyst · "hittas inte" efter tre generiska sökningar är ett statuspåstående (gå till domänarkiven) · fixtur-tester som bygger omöjligt state · liggarkontraktet nu i CLAUDE.md §B (varje system-spec svarar: skriver/läses-via-redaktören/känner-igen-återfall).

## Godkänt-när för hela liggararbetet

GPT kör minnes-slutprovet igen (fyra säsonger): spelet självt kan skriva karriärmeningen ur årsböcker + Krönika; Jari-mot-oss och återkomsten till gamla klubben får sina rader; ingen avslutad båge återkommer som ny; ingen händelse bär fel omgång. Det är release-tröskeln för det som gör spelet till vad det är.
