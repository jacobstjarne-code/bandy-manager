# INVENTERING — vad finns halvfärdigt

**Datum:** 2026-05-04
**Författare:** Opus
**Syfte:** Lista över features som har påbörjats (datamodell, mockup, eller spec) men inte implementerats färdigt. För att Jacob inte ska behöva komma ihåg vart varje halvfärdig sak ligger.

Källor: workspace search på Moment, SeasonSignature, mockup-mappen, och KVAR.md.

---

## 1. MOMENTS-SYSTEMET

**Vad det är:** Narrativa nedslag som registreras vid betydelsefulla händelser och visas som visuella minnen (t.ex. "derbyseger", "stjärna skadad", "årets match", "mecenat avgick", "klubbens era förändrades").

**Vad finns:**
- `src/domain/entities/Moment.ts` — datamodell med 11 källor (`derby_win`, `star_injury`, `mecenat_left`, `mecenat_costshare`, `captain_crisis`, `nemesis_signed`, `sponsor_positive`, `sponsor_negative`, `transfer_story`, `season_highlight`, `era_shift`)
- `recentMoments: []` initialiseras i `createNewGame.ts`
- `docs/mockups/moments_mockup.html` — fullt utvecklad designmockup med flera scenarios (M2 söndagsträning, M12 årets match, M14 era-shift)

**Vad saknas:**
- Builder-service som skapar Moment-objekt vid relevanta events
- UI-komponent som renderar moments (inline, scene, eller secondary-kort i Portal — ej beslutat)
- Integration i Portal eller säsongssammanfattning eller där det än ska visas

**Bedömning:** Mer komplett påbörjat än PlayerCard 2.0. Datamodellen är genomtänkt. Mockup är aktiv (inte i archive). Trolig orsak till att det inte byggdes färdigt: parkerades när andra prioriteringar kom emellan.

---

## 2. PLAYERCARD 2.0

**Vad det är:** Omdesign av spelarkortet med 10 sektioner — top bar (klubbadge, position, stäng), porträtt, attributstaggar, dagbok, prata-knappar i sticky footer.

**Vad finns:**
- `docs/mockups/archive/playercard_2_mockups.html` — detaljerad mockup, men i archive-mappen

**Vad saknas:**
- Spec
- Implementation

**Bedömning:** Arkiverad — antingen aktivt bortprioriterad eller bortglömd vid städning. Skiljer sig från Moments genom att den inte har infrastruktur i koden.

---

## 3. SÄSONGSSIGNATUR — modifierare ej injicerade

**Vad det är:** Varje säsong har en "signatur" (calm_season, cold_winter, scandal_season, hot_transfer_market, injury_curve, dream_round) som påverkar spelmekaniken.

**Vad finns:**
- `src/domain/entities/SeasonSignature.ts` — datamodell + SEASON_SIGNATURE_DEFS
- `SeasonSignatureRevealScene.tsx` — visar reveal-scen vid säsongsstart
- `SeasonSignatureSecondary.tsx` — Portal-kort som visar nuvarande signatur
- `docs/mockups/saesongssignatur_mockup.html` — designreferens

**Vad saknas:**
- `rumorFrequencyMultiplier` injicerad i rumorService
- `incomingBidMultiplier` injicerad i transferService
- `underdogBoost` (dream_round) injicerad i matchEngine
- `scandalFrequencyMultiplier` — verifiera om injicerad
- `midSeasonInjuryMultiplier` — verifiera om injicerad
- `threeBy30Probability` — verifiera om injicerad

**Bedömning:** Visuellt komplett, mekaniskt halvfärdigt. Spelaren ser scenen, läser texten, får ingen påverkan i spelet. Trolig orsak: feature byggdes "uppifrån och ner" — visuellt först, mekanik sist, mekaniken kom aldrig.

---

## 4. CUP-FAS-INTRODUKTIONER

**Vad det är:** Något som introducerar varje cup-fas (förstarunda, kvartsfinal, semifinal, final) istället för att de bara dyker upp som vanlig portal-omgång.

**Vad finns:**
- Inget. Efterfrågat i playtest 2026-05-04 ("trodde vi skulle ha en sån där händelse innan cupen?")

**Vad saknas:**
- Beslut om vad det ska vara: scen (som BoardMeetingScene), moment (om Moments-systemet byggs ut), portal-card, eller eget format
- Spec
- Implementation

**Bedömning:** Inte påbörjat. Hör ihop med Moments-frågan ovan — om Moments byggs ut kan cup-faser bli moment-källor (t.ex. ny kategori `cup_phase_start`).

---

## 5. KAPITEL C-MODIFIERARE

**Vad det är:** Specade men inte injicerade modifierare i samma kategori som Säsongssignatur, men under Klubbminnet/Kapitel C.

**Vad finns:**
- KVAR-not 2026-04-30: "rumorFrequencyMultiplier + incomingBidMultiplier ej i rumorService/transferService. underdogBoost (dream_round) ej i matchEngine."

**Vad saknas:**
- Samma som punkt 3 — överlapp med Säsongssignatur. Möjligen samma sak.

**Bedömning:** Verifiera om detta är samma sak som punkt 3 eller separat.

---

## 6. PORTAL-WIDGETS — texter ej kurerade

**Vad det är:** EventCardInline-texter implementerades (a075d8e). Men tidigare KVAR-noteringar nämner att flera Portal-secondary-kort (kafferum, journalist, klubbminnet, säsongssignatur) har sina egna textpooler som potentiellt är placeholder.

**Vad finns:**
- `KafferumScene` ✅ kurerad
- `BandyLetterService` ✅ kurerad
- `SupporterEvents` ✅ kurerad
- `JournalistRelationshipScene` — verifiera
- `KlubbminnetSecondary` — verifiera
- `SeasonSignatureRevealScene` — verifiera

**Vad saknas:**
- Verifiering vilka som har riktig text vs placeholder

---

## 7. SPRINT 28-C SKÄRMDUMP-AUDIT — fix-lista

**Vad det är:** 10 vyer som skulle bli skärmdump-värdiga. Levererad audit men fixar ej implementerade.

**Vad finns:**
- `docs/SCREENSHOT_AUDIT_2026-05-03.md` — strukturell audit klar

**Vad saknas:**
- Live-skärmdumpar för verifiering
- Implementation av fix-listan (~3h 15 min Code + 4 mocks)

**Bedömning:** Inte påbörjad. Väntar på Jacobs playtest med skärmdump.

---

## SAMMANFATTNING

| # | Feature | Datamodell | Service/builder | UI | Mockup | Spec | Bedömning |
|---|---------|-----------|----------------|-----|--------|------|-----------|
| 1 | Moments | ✅ | ❌ | ❌ | ✅ aktiv | ❌ | Bygg klart |
| 2 | PlayerCard 2.0 | n/a | n/a | ❌ | ✅ archive | ❌ | Beslut: dö eller leva |
| 3 | Säsongssignatur-modifierare | ✅ | partial | ✅ | ✅ | ✅ | Komplettera mekanik |
| 4 | Cup-fas-introduktioner | ❌ | ❌ | ❌ | ❌ | ❌ | Beslut: form (scen/moment/card) |
| 5 | Kapitel C-modifierare | partial | ❌ | partial | ❌ | partial | Verifiera överlapp m. #3 |
| 6 | Portal-texter | ✅ | n/a | ✅ | n/a | n/a | Verifiera vilka som är placeholder |
| 7 | Sprint 28-C fix-lista | n/a | n/a | n/a | partial | ✅ | Vänta på playtest |

---

## REKOMMENDATION

Innan ny feature-utveckling påbörjas: bygg klart Moments-systemet ELLER fatta beslut att det är dött. Det är det mest påbörjade halvfärdiga och har troligen mest stylevärde av punkterna ovan.

Om Moments byggs klart: cup-fas-introduktioner (#4) kan rimligen bli moment-källor — då löses det parallellt utan ny scen-infrastruktur.

PlayerCard 2.0 (#2) — fråga Jacob om den ska tillbaka från archive eller bekräftas död.

Säsongssignatur-modifierare (#3 + #5) — verifiera överlapp först. Sen liten injektions-runda i 3 filer.

---

## SKICKA INTE INVENTERINGEN VIDARE

Det här dokumentet är en arbetsledningsverktyg, inte en spec. Uppdateras när nya halvfärdiga grejer dyker upp eller när någon avbockas.
