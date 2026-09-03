# Bandy Manager · Design-to-Code Handoff

**Owner:** `/projects/<bandy-manager-design-system>` (this project)
**Target:** `bandy-manager` codebase (React + TS PWA)
**Last sync:** 2026-05-17 — F1 Beslutsekonomi UI levererad

**⚠️ DENNA FIL ÄR HISTORISK.** Skriven när designsystemet ännu levde som ett separat
claude.ai-projekt ("detta projekt" nedan syftar på det, inte på `design-system/`-mappen
i repot — flytten in i kodprojektet skedde 2026-05-05, se `design-system/CLAUDE.md`s
RECENT CHANGES). **Levande design-lane-kö:** `design-system/briefs/DESIGN-KO-2026-07-02.md`
(Fable-koherensrevisionen) — dit, inte hit, går nya fynd. Punkterna nedan är omverifierade
mot dagens kod 2026-09-03 (dokhygien, MASTER_OPPET.md `inv-1-handoff-stale`) — status
uppdaterad där koden redan hunnit ikapp.

---

## Aktiva handover-paket (separata filer)

Nyare leveranser ligger i egna `HANDOFF-*.md`-filer bredvid denna tracker. Lista underhålls här, detaljer i sub-filen.

- **2026-05-17 — F1 Beslutsekonomi UI-mönster** — `HANDOFF-BESLUTSEKONOMI-F1.md`. Mock: `docs/mockups/2026-05-17_design_beslutsekonomi.html`. Status: **UI implementerat 2026-05-16** (`PortalActiveBudget`, `PortalQueueRail`, `CooldownRow`, `PortalInboxCounter`, tutorial-band). 73/73 tester gröna. **Backend-wiring saknas:** `deferredDecisions[]`-population (roundProcessor) + CooldownRow-integration i source-secondary-kort. Pixel-audit kan ske på implementerade delar redan nu.

---

## ⚠️ ENDA DESIGNSYSTEMET ÄR DETTA PROJEKT

**Det finns bara ett designsystem för Bandy Manager: detta projekt.** Allt — färger, typografi, knappar, kort, headers, ikoner, copy-regler, komponenter, tokens — är definierat här och **ingen annanstans**.

**Code (utvecklare) ska:**
1. **Alltid läsa detta projekt först** innan UI ändras. Aldrig från minnet, aldrig från äldre conventions.
2. **Aldrig konsultera `bandy-manager/docs/DESIGN_SYSTEM.md`** — den filen är **arkiverad och inaktuell**. Om något står där som krockar med detta projekt: detta projekt vinner. Alltid.
3. **Aldrig uppfinna nya knapp-, tag-, kort- eller färgvarianter.** Om du inte hittar mönstret här → fråga designsystemet, lägg inte till nya regler i koden.

**Vid konflikt:** detta projekt > codebasens DESIGN_SYSTEM.md > Code:s minne. Inga undantag.

**Filer som är källa:**
- `colors_and_type.css` — alla design-tokens (färg, font, spacing, radii, shadows, scoreboard, säsongsbakgrunder)
- `DESIGN-DECISIONS.md` — låsta beslut (✅), pågående (🚧), avvisat (❌)
- `preview/components-*.html` — komponentkanon (buttons, tags, cards, header, cta, bottomnav, nextmatch)
- `preview/brand-*.html` — brand (logo, badges, icons)
- `ui_kits/*/` — färdiga skärm-mockar
- `briefs/*.md` — implementations-specs per område
- `README.md` — filosofi, regler, "do/don't"
- `SYNC.md` — vad som är synkat mellan design och code

**Codebasens `docs/DESIGN_SYSTEM.md` ska antingen tas bort eller ersättas av en stub som pekar hit.** Tills dess: ignorera den.

---

Every item below links a design decision to the file in the codebase that must change. Status legend:

| Symbol | Meaning |
|---|---|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Done in code |
| `[⚠]` | Blocked / pending research |

---

## 1 · Logotyp-användning på ljus bakgrund `[x]`

**Preview:** `preview/brand-logo.html`
**Change:** Logon (`bandymanager-logo.png`) är designad för mörk bakgrund. På ljus bakgrund **måste** den inverteras till svart.

**Verifierat 2026-09-03:** `src/presentation/components/Logo.tsx` löser detta redan, fast med en annan mekanism än den föreslagna CSS-klassen — `variant='dark'|'light'` prop, `light` (default) ger krämvit filter för mörka läderytor, `dark` finns för ljusa ytor men "ej använt i appen ännu" (appen är genomgående mörk-tematiserad, ingen ljus yta har uppstått som behöver den). Mekanismen finns och fungerar; TODO-kommentaren i filen väntar bara på en riktig inverterad logo-asset istället för CSS-filtret (FAS 3, se BRAND-BRIEF.md) — kosmetisk finish, inte en saknad funktion.

---

## 2 · GameHeader + PhaseIndicator redesign `[x]`

**Preview:** `preview/components-header.html`
**Change:** Headern omdesignad — 3-kolumns grid, läsbar subtext, sigill-chip för omgång, SVG-kuvert istället för 🔔. PhaseIndicator har riktig stepper-logik (done → current → upcoming) med checkmark + halo.

**Verifierat 2026-09-03:** `GameHeader.tsx` har `display: 'grid'`, `var(--font-display)`-subtext, egen inline `EnvelopeIcon`-komponent (ersätter 🔔), samt `lucide-react`-ikoner genomgående. `PhaseIndicator.tsx` har exakt den beskrivna tre-tillstånds-logiken (`state = i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'upcoming'`), med opacitetsstyrda connectors och egen styling per tillstånd. Byggt under emoji→Lucide-svepet (N-1–N-5, `f9b7aeeb`/`b83cf967`), inte som en egen HANDOFF-leverans — därför stod den kvar som `[ ]` här trots att koden redan hunnit ikapp.

---

## 3 · Tag-regel: status utan emoji `[x]`

**Preview:** `preview/components-tags.html`
**Change:** Status-tags (Redo / Skadad / Bänken / temperatur) är **alltid utan emoji** — färg + text räcker. Kategori-tags i feed/timeline **får** prefix-emoji från `EMOJI_MAP`. Aldrig två emoji per tag, aldrig emoji efter texten.

**Verifierat 2026-09-03:** Status-tags (t.ex. `SquadStatusCard.tsx`s "N redo"/"N skadade") renderar ren `tag tag-green`/`tag tag-red` utan emoji. Reglen lever i praktiken sedan emoji→Lucide-svepet; ingen separat `<Tag variant>`-prop byggdes, men regeln hålls av konvention i alla granskade förekomster.

---

## 4 · Screen CTA — context ribbon `[ ]`

**Preview:** `preview/components-cta.html`
**Change:** Screen-stängande CTA ska ha en *fas-ledtråd* ovanför (var du är → vart du är på väg) och en *kontextrad* under (match-tid, motståndare, status). Tre varianter: dashboard→taktik, taktik→match (pulserande), resultat→omg+1.

**Code changes**
- `src/presentation/components/CtaButton.tsx` kan stå kvar; skapa en wrapping-komponent `CeremonialCta` som tar `from`, `to`, `subtext`, `pulse` props.
- Applicera på skärm-botten i Dashboard, TacticsScreen, ResultsScreen.

**Verifierat 2026-09-03:** Genuint fortsatt öppen — noll träffar på `CeremonialCta` eller motsvarande `from`/`to`/`pulse`-mönster i `src/`. Portalens `getNextActionCue` (`nextActionCue.ts`, byggd `0c8c6365`) löser en näraliggande men INTE identisk fråga (en generell "vad nu?"-rad, inte en per-CTA fas-ledtråd) — förväxla inte de två.

---

## 5 · Button system — hover, loading, focus-ring, disabled copper `[x]`

**Preview:** `preview/components-buttons.html`
**Changes** (UX-notes från review):
- **Hover-state:** −1 px `translateY` + `filter: brightness(1.05)` + djupare skugga.
- **Loading-variant:** egen state, 10 px spinner + kursivt verb ("Sparar…", "Skickar…").
- **Focus-ring:** `outline: 2px solid var(--accent); outline-offset: 2px` för alla `.btn`.
- **Disabled copper:** bleka till `#B8A48C` @ 0.5 opacity (ej grå border) — håller paletten.
- **Hit-target 44 px** för icon-only i primära ytor (BottomNav, FAB).
- **Segmented toggle**-mönster tillagt (Lista/Kort).
- **Ghost danger-variant** för destruktiva handlingar innan bekräftelse.

**Code changes**
- `src/presentation/components/Button.tsx` (eller motsvarande):
  - Lägg till `:hover`, `:focus-visible` pseudos i CSS
  - Ny `loading` prop + spinner-komponent
  - `:disabled` på `.btn-primary` får `background: #B8A48C; opacity: 0.5`
- Ny komponent `SegmentedToggle` i `src/presentation/components/`.

---

## 6 · BottomNav — custom ikonserie `[x]`

**Preview:** `preview/components-bottomnav.html` (flaggad **⚠ Placeholder**)
**Status:** Blockerad — kräver designprojekt.
**Deliverable:** 6 SVGs @ 24×24, line + fill variant, linjevikt 1.75 px, matchar Lucide. Ämnen: klubbhus, radade silhuetter, bandyklubba/klubba+boll, tabellpall, handshake, kyrkotorn/skorsten.
**Code changes (när klart):** Byt emoji-spans i `BottomNav.tsx` mot `<Icon name="hem" />` etc.

**Verifierat 2026-09-03:** Löst annorlunda än specat — `BottomNav.tsx` importerar `lucide-react` direkt (`Home`/`Users`/`Swords`/`Table2`/`Building2`/`Hammer`/`ArrowLeftRight`), `strokeWidth={isActive ? 2.2 : 1.8}` matchar den efterfrågade linjevikten. Inga custom-ritade SVG:er (klubbhus/skorsten-motiven) togs fram, men målet — emoji ersatt med konsekventa line-ikoner — är uppfyllt via befintlig Lucide-uppsättning. Ingen ny designleverans krävs om inte den unika woodcut-känslan prioriteras separat.

---

## 7 · Emoji-kategorisystem — piktogramserie `[x]`

**Preview:** `preview/brand-emoji.html` (flaggad **⚠ Placeholder**)
**Status:** Blockerad — kräver designprojekt.
**Deliverable:** 24 SVGs @ 16×16 + 24×24, monokrom (accent eller text-primary), woodcut/linjesnittskänsla. Översättningstabell finns i preview-kortet.
**Code changes (när klart):** `EMOJI_MAP` blir `ICON_MAP` som pekar på SVG-komponenter istället för emoji-strängar. Påverkar alla `SectionLabel`, feed-tags, notiser.

**Verifierat 2026-09-03:** Löst via samma emoji→Lucide-svep som punkt 6 (N-1–N-5, `docs/sprints/OVERLAMNING2_STEG0_INVENTERING_2026-08-22.md` rad 32) — `Icon.tsx`/`lucide-react` fungerar som den efterfrågade `ICON_MAP`-ersättningen, importerad i 11+ filer inkl. `PlayerCard.tsx`, `InboxScreen.tsx`, `GameHeader.tsx`. Woodcut-stilriktningen realiserades inte (Lucides linjeikoner istället), men funktionsmålet (inga hand-skrivna emoji-strängar kvar i UI-chrome) är uppfyllt.

---

## 9 · Intro-flöde — kontinuerlig scen (Ankomsten) `[x]`

**Preview:** `ui_kits/intro_flode/Intro Flode v1.html`
**Decision:** `DESIGN-DECISIONS.md` § "Intro-flöde — kontinuerlig scen"
**Change:** Hela vägen från klubbval till Dashboard är **EN scen** med fyra `step`-tillstånd. Aldrig route-byten, aldrig klippning till svart, aldrig olika headers. Bakgrunden består (`--bg-scene`), genre-etiketten består ("Ankomsten").

**Code changes**
- Skapa `src/presentation/screens/ArrivalScene.tsx` som ersätter befintliga separata Intro-vyer (`IntroBackground`, ev. `IntroNarrative` etc).
- State: `const [step, setStep] = useState(0)` (0–4) + `const [arrivalDone, setArrivalDone] = useState(false)` med `setTimeout(..., 3400)` på mount.
- Layout: full viewport, `--bg-scene` bakgrund, genre-etikett "⬩ Ankomsten ⬩" stationär överst.
- Inramningsblock (klubbnamn + datumrad + styrelse-rad) renderas alltid — `opacity` och `font-size` interpoleras när `step >= 1`.
- Dialog-block bygger upp tre `CoffeeRow` kumulativt (Margareta steg 1, Pelle steg 2, Sture steg 3).
- CTA-rad: label byts efter `step`. Steg 0 fade:as in efter 3.4s.
- Steg 4: full-cover overlay som faden in och navigerar till `/dashboard`.
- Återanvänd `CoffeeRow` från `CoffeeExchange.tsx` om möjligt — initial-cirkel 32px, `--bg-dark-elevated` bg, `--bg-leather` border, Georgia 13px italic för citat, 9px uppercase letter-spacing 1.5 för speakerName.
- Animationer: `fade-in-soft` (8px translateY, 0.7s) för CoffeeRow; `fade-in-static` för progress/divider/CTA.

**Dynamiska data per klubb**
- `clubName` från valet
- `chairman` / `treasurer` / `member` namn
- `squadSize`, `expiringContracts`, `cashKr`, `transferBudgetKr` flätas i Margaretas replik
- Veckodag från `currentDate`

**Förbjudet i denna scen**
- DifficultyTag
- Headers från andra skärmar (GameHeader, BottomNav)
- Genre-etiketter som byts ("Tre samtal", "Styrelsemötet" etc) — det är *Ankomsten* hela vägen
- Knapp "Tillbaka"

**Referens-källor:**
- `ui_kits/intro_flode/artboards.jsx` — komplett komponent-kod att översätta
- `ui_kits/intro_flode/Intro Flode v1.html` — CSS/animations + tokens

---

## 8 · Klubbmärken — research per ort `[x]`

**Preview:** `preview/brand-badges.html` (flaggad **⚠ Placeholder**)
**Status:** Blockerad — kräver eget designprojekt.
**Orter:** Forsbacka, Söderfors, Västanfors, Karlsborg, Målilla, Gagnef, Hälleforsnäs, Lesjöfors, Rögle, Slottsbron, Skutskär, Heros.
**Process:** research (heraldik, bruksindustri, kyrktorn, naturmärken) → 2–3 riktningar per klubb → låsa form.
**Code changes (när klart):** Ersätt generiska SVG:er i `ClubBadge.tsx`.

**Verifierat 2026-09-03:** `ClubBadge.tsx` har redan riktiga per-klubb-definitioner för samtliga tolv orter (unikt primary/secondary-färgpar + symbol, t.ex. `club_forsbacka`: hammare, `club_soderfors`: stjärna) — inte generiska placeholder-SVG:er. Detta är samma fil som huvud-CLAUDE.md räknar som ett permanent undantag från token-grinden ("12 klubbars unika heraldik — data, inte design-system").

---

## Arbetsflöde för Claude Code

När Claude Code arbetar i codebasen, låt den läsa detta projekt direkt:

```
Innan du ändrar UI, läs:
  /projects/<id>/README.md
  /projects/<id>/HANDOFF.md
  /projects/<id>/preview/<relevant card>.html
  /projects/<id>/colors_and_type.css
```

Färdigställ en punkt → byt status till `[x]` här och i `SYNC.md`.

Nya krav eller frågor → ställ dem *till designsystemet* (detta projekt) innan koden ändras, så att design och code inte driver isär.
