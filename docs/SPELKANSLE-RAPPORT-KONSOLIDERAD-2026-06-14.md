# SPELKÄNSLE-RAPPORT — KONSOLIDERAD (batch 1–5)

**Build:** 678bf5d · **Datum:** 2026-06-14 · **Av:** Design (Fable) → **Opus**
**Underlag:** ~100 screens, TVÅ hela säsonger genomspelade (premiär → SM-vägen → slutspel → säsong 2-start). Alla faser sedda i kontext.

> **Läs detta först:** Jacob och jag är de enda som sett bilderna. Opus har inte gjort det. Allt nedan — textskav, buggar, grafiska glitchar — är observerat i as-built 678bf5d, inte härlett ur kod eller mockar. Där jag skriver "bugg" menar jag något jag SÅG gå fel på skärmen, inte en kodgissning. Korsa mot kartan; men dessa observationer finns bara här.

---

## DEL A · DOM I EN MENING

Spelet är narrativt och visuellt rikt och byggt med omsorg — ceremonin, minnet, beats och scenerna sitter. Det som återstår är **inte omdesign** utan tre system som inte byggdes färdigt, plus en handfull rena buggar. Spänningskurvan har ingen död mittsäsong (hypotesen falsifierad — mitten är tätast). Rösten har inte driftat på två säsonger.

---

## DEL B · 🟥 BUGGAR & GLITCHAR jag såg på skärmen (bara jag har sett dessa)

Dessa är konkreta defekter, inte designval. Var och en med var jag såg den.

| # | Var | Vad jag såg | Sannolik natur |
|---|-----|-------------|----------------|
| BUG-1 | **Cup-match avgjord på straffar** (omg 3, Karlsborg) | Live-tavlan visar "5–5 · FT" utan straffindikator; kommentarsflödet säger "den är klar" samtidigt. **Granska visar rätt** ("Straffar 3–1 · FÖRLUST"). Straffresultatet når summaryn men ALDRIG live-tavlan. | Spellogik + saknad scoreboard-rad. Straffvinnaren propageras inte till matchstate live. |
| BUG-2 | **Säsong 2027/28-start** | Portalen renderas **helt svart/blackad** — innehåll finns men i spök-opacity. | Transition/overlay fastnar i mid-fade. Samma kontrast-klass som Minne-fliken hade (nu fixad där). |
| BUG-3 | **Semifinal-portal** | Slutspels-kortet visar **"Kvartsfinalen. Första gången någonsin vi är här…"** PÅ semifinalen. | Rund-beaten auto-rensas inte vid rundövergång → bär förra rundans text. |
| BUG-4 | **Semifinal-portal** (följd av BUG-3) | **Fokusera-kortet följer med** KF→SF. Jacob: "borde släckts oavsett vid semi." | Samma mekanism som BUG-3 — rund-specifik beat saknar auto-rensning vid övergång. |
| BUG-5 | **Minne-fliken** | "Cupfinalen förlorades 5–5" — men laget åkte ut i **semifinal**, inte final. | Minnesgeneratorn etiketterar fel runda. |
| BUG-6 | **Minne-fliken** | Tomma fornsäsonger 2022–2025 renderas (före karriärstart) med "Inga händelser". | Renderar säsonger som inte existerar för spelaren. |
| BUG-7 | **"Vänder ur"-strängen** | "Gagnef vänder ur. Och vänder ur. Och vänder ur." (batch 1) → "Karlsborg vänder ur. Och vänder ur. Och vänder ur." (batch 2). | Mall-sträng som dubblerar — läser som render-bugg, inte stilgrepp. |
| BUG-8 | **Lagfoto-fliken** | Uppställningen klipps i högerkant (spelare utanför 394px-ramen). | Overflow, ej responsiv till telefonbredd. |

---

## DEL C · 🟥 DE TRE OBYGGDA SYSTEMEN (störst spelkänsle-påverkan)

### C1 · Endgame/portal-kurering (R3) — auditens enskilt största fynd

**R3-handoffen specade hård borttagning av kafferum/journalist/signatur i slutspel. Den byggdes aldrig.** Bevis: **semifinal match 1, jag ligger under 0–2 (en förlust från utslagning), och portalen ber mig ta ställning till en sponsorbastu** (Per-Olof Nilsson, 3 val) + läsa journalistrelationer + nemesis + burnout + kommun-cooldown + efterklang. Jacobs ord: *"lite fel fokus?"* — exakt. När matchpucken ligger emot dig ska portalen vara EN sak: matchen.

Detta gäller även slutspurten (omg 20–21) och säsong 2-start. **Försoning = R3-specen som aldrig kördes:** endgame-fas hård-döljer icke-match-kort (inte dämpar). Prioritet 1 över allt kosmetiskt.

### C2 · Notis-dieten (A8) — ackumulering utan gräns

51 olästa omg 16, 59 vid säsong 2-start. NYHETER-gruppen ensam ~28 rader. Severity-grupperna + token-dots ÄR byggda (semafor-emojin borta ✓) — men volymen är ohanterlig. Aggregering (träningsrapporter → en rad), inga egna matchresultat i inkorgen, nollställ vid säsongsskifte.

### C3 · Avbrottsstapling + budget — mittsäsongen staplar 5–7 element/portal

Verklig och återkommande (logg i batch 3). Känns fullt men inte kaotiskt — hierarkin håller. **Budgeten behövs, men ska gallra BESLUT (kapten/sponsor/annandag/akademi), inte narrativa band (efterklang/kafeterian/journalist).** Detta är datan budget-ombyggnaden väntade på.

---

## DEL D · SPELKÄNSLE-TEMAN (Opus reläets 6 teman, besvarade)

1. **Spänningskurvan:** ingen död mittsäsong. Mitten är tätast (kaptenval→annandag→sponsor→akademi→nemesis→VM→burnout). **Hypotesen falsifierad.**
2. **Avbrottsstapling:** = C3. Bekräftad.
3. **Puls vs fanMood:** puls rör sig (Orten 83▼, trend + mean-reversion); **klack-mood ligger parkerat på 60 hela säsong 1** → fanMood ser död ut. **Reverterings-/reaktionskurva behövs** (mood ska reagera på derby/resultat/annandagen).
4. **Onboarding:** spelets styrka. Narrativ-lett, tonen håller. Inga 🟥. (Klubbkartans Sverige-silhuett är svag — läses knappt som karta.)
5. **Textskav:** se DEL E.
6. **Avsked:** pensionsvalet feldesignat (DEL E) — annars ej triggat.

---

## DEL E · TEXTSKAV & COPY (bara jag har läst dessa i kontext)

| Var | Skav | Fix |
|-----|------|-----|
| Match-laddning (Gagnef, omg 1) | "Det som hände i höstas räknas inte i dag" — **omg 1 säsong 1, ingen höst finns.** Antar historik spelaren inte har. | Villkora bort säsong 1. |
| Kommentarläge (återkommer) | "Lite hawaii över detta" — anglicism mot bandysvensk understatement. | Byt sträng. |
| Burnout (omg 11→13→15→20→KF→säsong 2) | "Jag måste tänka klart över helgen" loopar **6+ gånger.** Jacob: "många helger blir det." Borde ESKALERA mot säsongsslut, inte loopa. | Bredda pool + eskaleringskurva. |
| Anteckningar-fliken | Varierad nu (✓) men "Albin vill spela mer. Underförstått — jag håller med" upprepas ordagrant för 2 spelare. | Fler varianter. |
| Pressrubrik | "Knappt — och knappt räcker inte alltid" på 3 ytor (Portal+Inkorg+Media). | Unik per yta. |
| **Pensionsval** | Knapparna har **två konkurrerande fetstilar på samma rad** ("Tack för allt" + "Du tackar av med värdighet"). Följer inte decision-card-mallen. | En primär etikett + mono-konsekvensrad under (bastu-modallen är mallen). 🟧 design |

---

## DEL F · GRAFISKA AVVIKELSER mot ratificerat system (fidelity)

**Byggt RÄTT ✅:** scoreboard (vi/dom + Georgia-namn + röd tid), säsongsetikett 2026/27 globalt (4051/52 borta), inkorgens severity-dots, match-live-krom (dubbelkrom borta i live), NU-flikens empty-states + Stämningskurvans förankring, ring-legend vid taktikplan, Annandagen-illustration, cooldown-kort, scen-sekvenserna (Grundserien klar / Fyra lag kvar), matchpuck-tag, gold-CTA-eskalering.

**Route-lokalt svept / EJ klart 🟧 (sitter bara där route:n rörts):**
- **CTA under bottennav** — 5+ ceremoni-ytor (Gagnef-laddning, Annandagen, derby, alla slutspels-scener). **HIDDEN_PATHS-svepet överfälligt.**
- **pill-CTA** kvar i onboarding (spel-ytor svepta).
- **disabled-state (B8)** ej byggd — oläslig beige kvarstår.
- **emoji→Lucide (B3)** ej svept (✨🎥⚡📰🔄💾📁💡📌 + 🎯/🤝/🏆 som modal-heron).
- **positionLabel (A5)** — tre strata kvar (MV/B/YH/MF/A vs engelska vs koder).
- **tkr/mån + heltal (regel 11)** — "5 678 kr/mån", decimal-styrka kvar.
- **gold→copper** — hattrick-milstolpar gold (DB-2-inflation, 4+ instanser).
- **tomma kort (regel 12)** — FORM-rad, snittbetyg-sektion, fornsäsonger.
- **scoreboard-redundans** — score+tid på både LED-tavla OCH intensitetsbar-rad (Jacob). Stryk ur intensitetsraden.
- **taktik-pitch kontrast** — is-yta ≈ papper, kontrastfix ej byggd.
- **tab-overflow** — Transfers (5) + Klubb (6) klipps utan affordans. Delad TabBar med fade.
- **Klubb-vylängd** — lös med sektions-kollaps ("Visa allt →"), INTE fler flikar (redan 6).

---

## DEL G · RANGORDNAD ÅTGÄRDSLISTA till Opus → Code

| Prio | Åtgärd | Källa |
|------|--------|-------|
| 1 🟥 | **R3 endgame-kurering** — hård-dölj icke-match-kort i slutspel/avgörande | C1 |
| 2 🟥 | **Rund-text + Fokusera auto-rensas** vid playoff-rundövergång | BUG-3,4 |
| 3 🟥 | **Straffresultat → live-tavla** (+ summary stämmer redan) | BUG-1 |
| 4 🟥 | **Säsong 2-start svart bild** | BUG-2 |
| 5 🟥 | **Notis-diet** (aggregering + nollställning) | C2 |
| 6 🟧 | **HIDDEN_PATHS** — dölj BottomNav på alla ceremoni-/scen-ytor | DEL F |
| 7 🟧 | **Delade primitiver** — positionLabel · tkr/mån-formatter · severity · TabBar(fade) | DEL F |
| 8 🟧 | **Avbrottsbudget** — gallra beslut, inte narrativ | C3 |
| 9 🟧 | **fanMood-reaktionskurva** | DEL D §3 |
| 10 🟧 | **Pensionsval** + **scoreboard-redundans** + **taktik-pitch-kontrast** (designfixar) | DEL E,F |
| 11 🟧 | **Globala svep** — emoji→Lucide, disabled B8, gold→copper, tomma kort, Klubb-kollaps | DEL F |
| 12 🟨 | **Copy-pooler** — burnout-eskalering, "vänder ur", "hawaii", pressrubrik | DEL E |

**Bug-buntning:** BUG-3 + BUG-4 är samma mekanism (rund-rensning) → en fix. BUG-5 + BUG-6 är samma yta (minnesgeneratorn). BUG-2 + Minne-kontrasten är samma klass (overlay-opacity).

**Mönster genom hela auditen:** det som krävde EN komponent blev rätt; det som krävde ett GLOBALT svep sitter bara där route:n redan rörts. Det är det starkaste argumentet för att bygga de delade primitiverna (prio 7) snarare än att fortsätta svepa route för route.

— Design-Fable, konsoliderad spelkänsle-rapport (2 säsonger, build 678bf5d)
