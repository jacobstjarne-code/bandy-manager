# Bandy Manager · Design-to-Code Handoff

**Owner:** `/projects/<bandy-manager-design-system>` (this project)
**Target:** `bandy-manager` codebase (React + TS PWA)
**Last sync:** design review round 1 — 8 assets revised

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

## 1 · Logotyp-användning på ljus bakgrund `[ ]`

**Preview:** `preview/brand-logo.html`
**Change:** Logon (`bandymanager-logo.png`) är designad för mörk bakgrund. På ljus bakgrund **måste** den inverteras till svart.

**Code changes**
- Lägg till CSS-helper globalt (t.ex. i `src/styles/globals.css`):
  ```css
  .logo-invert { filter: invert(1) brightness(0); }
  ```
- Varhelst logon används utanför `GameHeader` (onboarding, splash, print-vyer), applicera `.logo-invert` när bakgrunden är ljus.
- Filer att granska: `src/presentation/screens/Intro*.tsx`, `IntroBackground`, eventuella print/share-komponenter.

---

## 2 · GameHeader + PhaseIndicator redesign `[ ]`

**Preview:** `preview/components-header.html`
**Change:** Headern omdesignad — 3-kolumns grid, läsbar subtext, sigill-chip för omgång, SVG-kuvert istället för 🔔. PhaseIndicator har riktig stepper-logik (done → current → upcoming) med checkmark + halo.

**Code changes**
- `src/presentation/components/GameHeader.tsx`:
  - Layout till `grid-template-columns: auto 1fr auto`
  - Subtextfärg: `#C9B89A` (ej `rgba(245,241,235,0.55)`)
  - Subtext i `var(--font-display)` italic
  - Omgångschip: ny underkomponent, border 1px `rgba(196,122,58,0.45)`, bg `rgba(196,122,58,0.18)`
  - Byt 🔔 mot inline-SVG kuvert (se preview för path-data), 16×14 px, stroke `var(--accent)` 1.3 px
- `src/presentation/components/PhaseIndicator.tsx`:
  - Tre tillstånd per steg: `done` (fylld cirkel + checkmark), `current` (halo + filled dot), `upcoming` (outline)
  - Connectors byter opacitet beroende på följande stegs status
  - Bara aktivt stegs label i copper + bold; övriga i `rgba(245,241,235,0.5)` / `#F5F1EB`

---

## 3 · Tag-regel: status utan emoji `[ ]`

**Preview:** `preview/components-tags.html`
**Change:** Status-tags (Redo / Skadad / Bänken / temperatur) är **alltid utan emoji** — färg + text räcker. Kategori-tags i feed/timeline **får** prefix-emoji från `EMOJI_MAP`. Aldrig två emoji per tag, aldrig emoji efter texten.

**Code changes**
- Granska alla förekomster av `tag-*` klasser och ta bort emoji från status-tags.
- Dokumentera regeln i `DESIGN_SYSTEM.md §Tags`.
- Överväg `<Tag variant="status" | "category">` props där category auto-prefixar från `EMOJI_MAP`.

---

## 4 · Screen CTA — context ribbon `[ ]`

**Preview:** `preview/components-cta.html`
**Change:** Screen-stängande CTA ska ha en *fas-ledtråd* ovanför (var du är → vart du är på väg) och en *kontextrad* under (match-tid, motståndare, status). Tre varianter: dashboard→taktik, taktik→match (pulserande), resultat→omg+1.

**Code changes**
- `src/presentation/components/CtaButton.tsx` kan stå kvar; skapa en wrapping-komponent `CeremonialCta` som tar `from`, `to`, `subtext`, `pulse` props.
- Applicera på skärm-botten i Dashboard, TacticsScreen, ResultsScreen.

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

## 6 · BottomNav — custom ikonserie `[⚠]`

**Preview:** `preview/components-bottomnav.html` (flaggad **⚠ Placeholder**)
**Status:** Blockerad — kräver designprojekt.
**Deliverable:** 6 SVGs @ 24×24, line + fill variant, linjevikt 1.75 px, matchar Lucide. Ämnen: klubbhus, radade silhuetter, bandyklubba/klubba+boll, tabellpall, handshake, kyrkotorn/skorsten.
**Code changes (när klart):** Byt emoji-spans i `BottomNav.tsx` mot `<Icon name="hem" />` etc.

---

## 7 · Emoji-kategorisystem — piktogramserie `[⚠]`

**Preview:** `preview/brand-emoji.html` (flaggad **⚠ Placeholder**)
**Status:** Blockerad — kräver designprojekt.
**Deliverable:** 24 SVGs @ 16×16 + 24×24, monokrom (accent eller text-primary), woodcut/linjesnittskänsla. Översättningstabell finns i preview-kortet.
**Code changes (när klart):** `EMOJI_MAP` blir `ICON_MAP` som pekar på SVG-komponenter istället för emoji-strängar. Påverkar alla `SectionLabel`, feed-tags, notiser.

---

## 9 · Intro-flöde — kontinuerlig scen (Ankomsten) `[ ]`

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

## 8 · Klubbmärken — research per ort `[⚠]`

**Preview:** `preview/brand-badges.html` (flaggad **⚠ Placeholder**)
**Status:** Blockerad — kräver eget designprojekt.
**Orter:** Forsbacka, Söderfors, Västanfors, Karlsborg, Målilla, Gagnef, Hälleforsnäs, Lesjöfors, Rögle, Slottsbron, Skutskär, Heros.
**Process:** research (heraldik, bruksindustri, kyrktorn, naturmärken) → 2–3 riktningar per klubb → låsa form.
**Code changes (när klart):** Ersätt generiska SVG:er i `ClubBadge.tsx`.

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
