# CODE — Samlat uppdrag 2026-05-21 (backlog-rensning)

**Princip:** Vi har ingen byggtids-begränsning. Allt som är tillräckligt
specat för att byggas BRA nu ska byggas nu, inte parkeras. Det här samlar allt
i backloggen som inte väntar på Design (lördag) eller på Opus-text.

**HÅRD REGEL — surface-separation:** Code bygger mekanik. All svensk spelartext
ägs av Opus. Rör INTE text-pooler, skriv INGA nya strängar, byt INTE formuleringar.
Där ett paket nedan rör text står det uttryckligen "Opus tar texten separat".

**Ordning:** Paket 4 + 5 först (små, oberoende, snabba). Sedan Paket 2 (mekanisk
CSS). Sedan Paket 1 (störst — egen playtest efter). Paket 3 är verifiering.

---

## Paket 1 — B2 Annandagen val-mekanik (STÖRST, egen playtest efter)

**Spec:** `docs/ANNANDAGEN_VAL_MEKANIK_2026-05-17.md` (komplett, stegindelad).
**Verifierat ej byggt:** inget `annandagsValGjort`/`pendingAnnandagsVal`-fält i
SaveGame.ts. Texten FINNS redan (`specialDateService.ts` + `specialDateStrings.ts`)
— bygg bara mekaniken, rör inte texten.

**Justering mot B11 (viktig):** Specen antar annandan på "omg 8-9" och räknar
`matchday - currentRound`. Det är föråldrat efter kalender-refaktorn. Hitta
annandagsmatchen via `Fixture.isAnnandagen`-flaggan (finns sedan A4(a) v2 + B11),
inte via hårdkodad omgång. Trigga valet 2 omgångar innan den fixturen för
hemmaklubben.

Bygg stegen i specen:
- **Steg 1:** basal val-mekanik (A standard / B julmarknad / C gratisentré),
  state-fält, ekonomisk effekt, CS-shift. EventCardInline i Portal (mönstret finns).
- **Steg 2:** D-alternativet (mecenat-värd) + era-låsning (survival A+C, fotfäste/
  establishment A+B+C, legacy A+B+C+D). Era finns på `seasonStartSnapshot.era` /
  `currentEra`.
- **Steg 3:** kedjereaktioner till andra system (media-rubrik omg+1, klack omg+2-3,
  kommun/`localPolitician`, mecenat-memory). Services finns alla.

**Kalibrera mot game balance** (specen §"KALIBRERING"): julmarknad +25k mot
survival-månadsbudget, ×2.5 biljetter mot arenakapacitet, gratisentré -100% mot
överlevnad. Justera siffrorna om de spräcker balansen.

**Text:** val-specifika briefing/commentary-varianter är INTE i scope — befintliga
pools räcker. Opus tar ev. pool-utökning separat om Jacob vill.

Detta är de facto starten på B1 (klubbutveckling) — annandan var utpekad som
första subsystem. Ta den ensam, playtesta, innan resten av B1.

---

## Paket 2 — B4 transfers design-system-cleanup (mekanisk)

**Spec:** `design-system/AUDIT-TRANSFERS-2026-05-17.md`. Ingen leverans i
changelog sedan auditen → står kvar. Samma CSS-extraktion som redan gjorts för
Portal/Stålvallen.

- **BLOCK 1:** byt `rgba(34,197,94,…)`→`var(--success)`, `rgba(239,68,68,…)`→
  `var(--danger)`. Inga råa hex/rgba.
- **BLOCK 2:** ~110 inline `style={{}}` över 7 filer → bryt ut till `transfers.css`
  (skapa filen, samma struktur som portal/stålvallen-CSS).
- **BLOCK 3:** emoji-inflation (🔍 💰 🟢🟡🔴 ⏳ ✓ ✕) — ta bort chrome-emoji per
  audit. Behåll inget som inte är genuint kategori-prefix.
- **WARN 1-7:** card-round→card-sharp på 6 data-listor; SectionLabel-emoji
  konsekvent; form-controls → `.form-input`/`.form-select`; TransferPlayerCard
  stripe 3px→2px; modal-radius `12`→token; modal-shadow→token; z-index 300/400→
  `var(--z-modal)` etc.
- **OBSERV:** flexShrink-upprepning, `:focus-visible` på custom-knappar,
  scoutbudget-SectionLabel, outgoing-bid tidsindikering (`bid.roundsRemaining`),
  modal-titel-typografi.

**Saknade tokens:** om `--radius-modal`/`--shadow-modal` inte finns — använd
`--radius-md` (8) och befintlig modal-shadow. Skapa inte nya design-tokens på
egen hand (det är Designs beslut lördag); defaulta till befintliga.

**RÖR INTE:** `WageOverrunWarning` (audit: 💎 POSITIV, bevara oförändrad).
**Text:** OBSERV-3 ("Försäljning möjlig sommaren och vintern" kan missförstås) →
lämna copy till Opus, ändra den inte.

---

## Paket 3 — B4 feature-rester (VERIFIERA först, bygg bara om saknas)

Mycket transfer-arbete har levererats (C-T1, C-T2, C-B1/2/3, C-T9). Två
backlog-rester kan redan vara täckta — verifiera mot kod innan bygge:

- **C-O2 — kafferum/klack-reaktion vid INKOMMANDE bud på egen spelare.**
  `RIVAL_SALE_KAFFERUM` finns (utgående/rival-sale). Verifiera om det finns en
  reaktion när en AI-klubb lägger bud på DIN spelare. Om ja → klart, stryk.
  Om nej → bygg mekaniken (trigger + hook). Texten skriver Opus.
- **C-T10 — lås-ikon för klubblegender i transfers.** `ClubLegend`-typ finns.
  Verifiera om legender visas som osäljbara med lås-markör i transfers-listan.
  Om ja → klart, stryk. Om nej → bygg det visuellt (ren UI, ingen text).

Rapportera vad som visade sig redan byggt.

---

## Paket 4 — E-K1 Cup-fixture date-stamping mid-säsong (liten)

B11 stämplar fixtures med `date`+`tipoffHour` vid säsongsbygget. Cup-rundor som
genereras mitt i säsongen (nästa runda efter föregående spelats) går inte via
samma väg och blir ostämplade. Stämpla dem från lagrad `seasonCalendar` på samma
sätt. Liten lucka, flaggad av Code vid B11-leverans.

---

## Paket 5 — A1.5++ Rotorsak: tomma commentary-events (utredning)

`deriveEventText` (A1.5+) har en fallback-pipeline som räddar Goal/RedCard/Save-
events med tomt `commentary`. Det är ett skydd, inte en fix. Utred matchSimulator/
matchEngine: VAR skapas dessa events utan commentary? Leta mönster — måltyp, sent
i match, straff, hörnmål, interaktiva utfall. Om en källa hittas: fixa där, så
fallbacken blir död kod i stället för kritisk grind. Om ingen enkel källa:
rapportera fyndet ändå (det är värt att veta att fallbacken är permanent nödvändig).

---

## Inte i detta uppdrag

- **D1 Cup-tonen Nivå 3** — ren Opus-text, tas i chatten, inte Code.
- **C-SY1 / C-SY2 / C-N1 / D-ST1 / C-K1** — väntar genuint på Design lördag
  (designrundor, token-arkitektur, urvalslogik). Inte byggbart bra utan det.
- **B1 (utöver annandan) / C-T8** — B1 startar de facto med Paket 1; resten av
  B1 efter playtest. C-T8 ospecat, kräver scope-beslut.

— Opus, 2026-05-21
