# HANDOFF — Liggar-ramen (`LedgerFrame`) + rond-flödet

**Från:** Design-Claude · **Rev:** 2026-06-09 (Opus-konsoliderad — fyra rättelser låsta)
**Status:** enda korrekta källan. Tidigare 06-08-versionen hade fel säsongsetikett, fel Förbered-stämpel, en-sides-Förbered och konsoliderad Granska — allt rättat här. Vid konflikt: detta dokument + `forbered_trupp_slots`-mocken gäller.

**Mockar (kanoniska):**
- `docs/mockups/2026-06-09_design_forbered_trupp_slots.html` — **Förbered, kanonisk** (Trupp-flik, slot-tilldelning, två tillstånd). Ersätter gamla `forbered_full` (arkiverad).
- `docs/mockups/2026-06-08_design_spela_granska_full.html` — Spela + Granska Översikt
- `docs/mockups/2026-06-08_design_granska_flikar_liggare.html` — Granska Spelare/Shotmap/Analys
- `docs/mockups/2026-06-08_design_liggare_unison.html` — chrome-diff-harness (konsistens-referens, ej finished-kvalitet)

---

## År-modellen (så säsongsetiketten aldrig blir fel igen)

`game.currentSeason` är **startåret som kalenderår** — inte ett ordningstal. Första säsongen = `2026` = bandyåret 2026/27. `seasonSpanLabel(2026)` → `"2026/27"`. SM-mästare benämns med året finalen spelas (mars, andra året): `seasonChampionYear(2026)` → `2027`. Varaktigheter ("8:e säsongen", säsonger-i-klubben) förblir ordningstal och går INTE genom helpern. **`4051/52` och `25/26` var båda fel** — `4051/52` var en basår-additionsbugg (fixad i `seasonYear.ts`), `25/26` en felgissning.

---

## 0 · Kärnan

Rond-flödet renderas som en **liggare** — kommunalt protokollblock: papperston, perforerad marginal, masthead i läder, mono-rubriker, copper-stämpel som enda framåt-handling. Inte ett nytt formspråk: README:s "70-talsliggare, inte 1800-talssigill" applicerad på ytor som redan är dokument. Spela bryter papperet med Stålvallen-LED-tavlan — princip-2-kontrasten.

Ledgern omsluter: **Förbered** (sub-tabbar Trupp | Taktik) · **Spela** (match live) · **Granska** (matchrapporten, 4 flikar). Round-summary-**svepet står UTANFÖR** ledgern med egen lättare form (Designs beslut 06-09 — se §2 Granska).

**Bygg chromen EN gång som `<LedgerFrame>`.** Alla ytor är samma ram + olika children. Då kan flödet aldrig spreta mellan pass.

---

## 1 · `<LedgerFrame>` — kanonisk ram

```tsx
<LedgerFrame
  club={managedClub}                       // crest + namn
  managerName="Jacob"
  season={seasonSpanLabel(game.currentSeason)}  // → "2026/27". ALDRIG hårdkodad sträng.
  round={game.currentMatchday}             // Omg-badge
  phase="forbered"                         // 'forbered' | 'spela' | 'granska' → RPS-strip-state
  stamp={{ label: "Spela matchen →", onClick }}  // fas-handling, se §2 per skärm
  subTabs={['Trupp','Taktik']}             // Förbered: intra-fas-tabbar
  tabs={granskaTabs}                       // Granska: [Översikt·Spelare·Shotmap·Analys]
>
  {children}
</LedgerFrame>
```

`subTabs` (Förbered) och `tabs` (Granska) är samma mekanik — intra-fas-flikar inom en fas. Stämpeln är alltid fasens enda framåt-handling.

### Kanonisk chrome — exakta värden

| Element | Spec |
|---|---|
| **Masthead** | bg `#0e0d0b`, padding 9×12. Crest 22px (`#3D3A32`, 1px copper-border-40%). Klubbnamn Georgia 12px `#e8e0d0`. Undertext mono 7px `#8a8270` = `"{managerName} · {season}"` där `{season}` = `seasonSpanLabel(currentSeason)`. Omg-badge mono 8px copper, 1px copper-border-40%, radius 2, padding 2×6. |
| **RPS-strip** | bg `#1a1714`, 2px copper underkant, padding 7, mono 8.5px, letter-spacing 1px, gap 8. Aktiv fas: `⬡ NAMN` copper-br fet. Klar fas: `✓ NAMN` copper-50%. Kommande: grå `#8a8270`. Separator `—` vid `rgba(255,255,255,.12)`. |
| **Sub-/flikrad** | bg `#f4eee1`, 1px rule-strong underkant (sub-tabbar) resp. 1px ink-topp (Granska-flikar). Flik mono 9px (Förbered) / 7.5px (Granska), letter-spacing 1.5px. Aktiv: copper + 2px copper-linje. Förbered: under RPS-stripen. Granska: mellan body och stämpel. |
| **Marginal** | 20px bred, gradient `#e3d9c5→#ece4d4`, 1.5px copper högerlinje. Perforeringar: 7px cirklar, paper-fyllda, `inset 0 0 0 1px rgba(154,74,40,.3)`, **jämnt fördelade responsivt (~80px isär, beräknat ur höjd)** — INTE mockens fasta y-pixlar. |
| **Sektionsrubrik** (`.sh`) | mono 9px, letter-spacing 2px, versal, copper. 1px rule under. Valfri höger-not (`.r`) ink-faint 8px. |
| **Stämpel-CTA** | copper fylld, paper-hi text, **brödtext** 12px fet versal (`--font-body` — se PT-4/T4 nedan), 2px copper-ram, radius 4, padding 13, margin 9×12×12. Fast i botten (flex-shrink:0). Spärrad/ghost (transparent, ink-faint, rule-strong-ram) när fasen inte är komplett. **Alltid den enda framåt-handlingen — aldrig dekorativ.** |
| **Papper** | body `#ece4d4`, upphöjda ytor `#f4eee1`. |
| **Färg/typ** | **Befintliga system-tokens enbart — kopiera INTE mockens `:root`-block.** Mappa varje färg mot palettens token; saknas en → flagga, hitta inte på. Copper `#A25828`/`#C47A3A`, ink `#1f1c16`/`#5c554a`/`#8a8270`, rule `#d8cdb6`/`#c2b598`. Georgia = innehåll, mono = chrome/etiketter. **Inga nya tokens.** |

**T4 (2026-07-13, PT-4-synk):** Stämpel-CTA:n bytte font-family från mono till brödtext (`.lf-stamp` i `ledger.css`, commit `f96d0bf4`) — den här radens ursprungliga "mono 12px fet versal" ljög mot koden och riskerade att mono återinfördes vid nästa ledger-arbete. Konflikten (liggarens genomgående mono-dokumentkänsla vs. sidfotsmallens brödtext-CTA) avgjordes till FLÖDETS igenkänning: stämpeln är den enda framåt-handlande knappen i ledgern, precis som sidfoten är det i introramen — den avancerar, den beskriver inte data. Det är därför den följer `.btn-cta`-mallen, inte liggarens mono-chrome. Ledgerns ÖVRIGA mono (masthead, RPS-strip, sektionsrubriker) är oförändrat — bara den framåt-handlande stämpeln lämnade mono.

---

## 2 · Per skärm — children

### Förbered (`phase="forbered"`, sub-tabbar Trupp | Taktik, stämpel "Spela matchen →")

Den verkliga skärmen (`MatchScreen`) är en trestegs-wizard (Välj trupp → Välj taktik → Starta). I ledgern blir den **två sub-tabbar + stämpel** — wizard-steppern försvinner. Mock: `forbered_trupp_slots`.

**Trupp-fliken** (äger uppställningen):
- Plan: blekgrön yta (`#dde6d4→#d2dcc4`), mittlinje + mittcirkel, höjd ~248px. Elva **tilldelningsbara platser** (26–30px prickar, copper; MV gold), varje med position + spelarnamn + styrka. Mappar mot `MatchScreen`s `lineupSlots` + `assignPlayerToSlot` + `selectedSlotId` (finns redan).
- Tom plats = streckad ring + copper "Välj…". Tap markerar platsen (ring-glow `sel`).
- Bänk-väljare under: lista (avatar + namn + position-not + styrka + "Sätt in"). När en plats är markerad sorterar bänken om så **passande position toppar** med grön "passar"-tagg (`fits`-rad). Räknarpill "10 / 11" i sektionsrubriken.
- Stämpel **spärrad (ghost) "Fyll elvan först"** tills elvan är full; aktiv "Spela matchen →" när komplett.

**Taktik-fliken:** val-rader (Tempo/Press/Hörnskytt), aktivt val = copper-fylld opt-chip. (Befintliga taktikkontroller.)

**ÖPPEN DETALJ (Code/Design):** "Starta"-stegets innehåll — matchläge (quicksim/full/tyst), förväntad publik, arena, ritual-text, ev. avskedsmatch — har inget hem i mocken. Lägg som smal förmatch-rad i botten av Taktik-fliken (ovanför stämpeln) ELLER som confirm vid stämpel-tryck. Lean: Taktik-fot. Bekräfta innan wiring.

### Spela (`phase="spela"`, stämpel tillståndsberoende)
- **Stålvallen-scoreboard** finns redan (`ScoreboardStalvallen`, används av `MatchReportView`). Bg `#0a0908`, full-bredd infälld (margin -13 sidled). Enda mörka ytan, bryter papperet. **Rör inte mekaniken** (Spår A/B: MomentumBar, BRYTPUNKT, HalftimeModal är byggda + pushade).
- Tryck (momentum): tvåfärgad stapel, copper hemma + cold borta, procent under.
- Referat: protokoll-rader, mono minut + Georgia text. Mål = grön-tonad ruta, kort = röd text.
- **Stämpel:** halvtid "Paussnack →", fulltid "Till granskning →". Tillståndsberoende, en sträng räcker inte. **Återanvänd befintlig halvtids/fulltids-kontroll — dubblera inte HalftimeModalen.**

### Granska (`phase="granska"`, flikar [Översikt·Spelare·Shotmap·Analys], stämpel "Nästa omgång →")

**Beslut 06-09 (Design):** ledgern wrappar **bara matchrapporten** (`MatchReportView`, idag en linjär scroll → blir 4-fliks-liggare). Round-summary-**svepet** (`RoundSummaryScreen` — liga-tabell/form/ekonomi/orten/press/akademi/andra matcher) **står utanför** ledgern och behåller sin nuvarande lättare dashboard-form. Skäl: svepet är en transient mellanrond-scan, inte ett dokument; rapporten är dokumentet.

**Översikt:** resultat-hero Georgia 52px, verdict mono versal (Förlust/Vinst/Oavgjort), flavor-rad under topp-rule (🔥 derby-text — ryms nu). Målskyttar + publik. **INTE** liga-tabell/form — de bor i svepet utanför.
**Spelare:** hela startelvan (11), avatar 22px + namn + position-undertext + mål/kort-not. Betyg Georgia, färg per nivå (hi grön ≥7.5 / mid ink 6–7.4 / lo röd <6).
**Shotmap:** tvådelad skottkarta på paper-hi (vi anfaller upp / de ner). Mål fyllda grön/röd, räddade copper, miss tomma ringar. Lag-legend. Tre score-block: Ditt skottmönster / motståndare (MV-räddn%) / Insikt (gold). **Verifiera: finns shotmap-data idag, eller net-new?**
**Analys:** assistent-citat (SL-avatar, copper-marginal), händelsetidslinje (hemma vänster / borta höger om mitt, mål/kort-ikoner), formspelare inkl. svagaste länk, nyckelinsikter som lista.

**RECONCILE (Code):** rapporten har idag CTA "Fortsätt →", svepet har "Nästa omgång →". Med ledgern: bestäm EN framåt-väg post-match så det inte blir två konkurrerande CTA:er. Antingen blir rapporten landningen (stämpel "Nästa omgång →") eller en deep-dive från svepet (stämpel "Fortsätt →" tillbaka). Bekräfta med Jacob vid wiring.

---

## 3 · Avgränsning — LÅS i DESIGN-DECISIONS.md

1. **Var liggaren gäller:** rond-flödet (Förbered/Spela/Granska-rapport) + dokument-ytor (Historik, Klubbminne, Säsongssammanfattning — andra vågen). **INTE** Portal/Trupp/Transfers OCH **inte** round-summary-svepet — de är listor/dashboards/scans, inte blanketter.
2. **Stämpel = funktionell status** (fas-handling, START/SLUT). Aldrig dekoration ("NY!"/"VIKTIG"). Speglar bara data som redan finns.
3. **LED-tavlan = enda mörka ytan** i flödet. Bryt inte papperet någon annanstans.
4. **Inga nya tokens.** Befintlig copper/paper/Georgia/mono/LED-palett.
5. **Säsongsetikett går alltid via `seasonSpanLabel(currentSeason)`** → "2026/27". Aldrig hårdkodad.

---

## 4 · Implementations-ordning

1. `<LedgerFrame>` — masthead + RPS + marginal + stämpel + sub-/flikrad (~3h). Säsongsetikett via helpern, perforeringar responsivt, befintliga tokens.
2. Spela — wrappa befintlig scoreboard + momentum/referat (~2h). Lägst risk (mekaniken finns).
3. Förbered — Trupp-flik (slot-tilldelning på `lineupSlots`) + Taktik-flik + stämpel-spärr (~3h). Lös Starta-detaljen först.
4. Granska — 4 flikar, restyle av `MatchReportView` (~3h). Svepet rörs inte. Verifiera shotmap-data + reconcile CTA.
5. DESIGN-DECISIONS.md-avgränsning (~30 min).

**Total ~11.5h.** Ramen först — sedan migreras varje skärm separat.

## 5 · Stängda beslut (var öppna)
- ✅ Stämpel-copy per fas: Förbered "Spela matchen →", Spela "Paussnack →"/"Till granskning →", Granska "Nästa omgång →".
- ✅ Scope v1: rond-flödet först, dokumentytorna i andra vågen.
- ✅ Förbered-struktur: sub-tabbar Trupp | Taktik, slot-tilldelning.
- ✅ Granska: bara rapporten wrappas, svepet utanför.
- ⏳ Kvar: Starta-innehållets hem (§2 Förbered), shotmap-data-verifiering + post-match-CTA-reconcile (§2 Granska).

— Design-Claude 2026-06-08, Opus-konsoliderad 2026-06-09
