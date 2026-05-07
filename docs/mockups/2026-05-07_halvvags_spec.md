# Halvvägs (säsongs-halvtid) — retroaktiv mock & justeringsspec

**Datum:** 2026-05-07
**Spec-typ:** Retroaktiv mock + diff mot existing implementation
**Anledning:** SPRINT_TECH1_AUDIT.md flaggade explicit: *"Halvtidsvalet saknar mock (bryter CLAUDE.md § MOCK-DRIVEN DESIGN för interaktiva komponenter). Visuell drift ej kontrollerad."*

## Bakgrund

`HalfTimeSummaryScreen.tsx` triggas vid säsongs-halvvägs (efter omgång 11 av 22, "halvtid" i serietid — inte match-halvtid). Implementerad i Sprint TECH-1 Del 4 (commit `1cde1a9`/`8e1869b`) utan föregående mock-kontroll. Funktionellt verifierad i kod, ej visuell-spec'd.

Denna mock dokumenterar **avsedd visuell anatomi** mot designsystemet, plus identifierar driften från existing implementation.

## Skärm-arkitektur

Full-screen skärm med fixed footer. Tre huvudzoner:

1. **Header** — klubbnamn + "HALVVÄGS"-rubrik (Georgia 32px copper) + subtitel
2. **Scrollable content-block** — fyra kort: Tabelläge, Höstens stunder, Spelarsituation (arc), Inför våren (coach-tips)
3. **Fixed footer** — "Inriktning vårsäsongen"-label + tre val (single-select) + Fortsätt-CTA

Designsystemets `.card-sharp`-klass används för alla content-block. `.h-label`-klass för section-labels.

## Drift mot existing implementation

| Punkt | Existing | Designsystem | Åtgärd |
|---|---|---|---|
| Section-labels | Inline `style={{ fontSize: 8, fontWeight: 600, ... }}` upprepat per sektion | `.h-label`-klassen finns för exakt detta | Code: ersätt inline-styles med `<p className="h-label">…</p>` |
| Choice-knappar (inactiva) | `.btn-ghost` | `.btn-ghost` är `bg-surface + border-dark + text-secondary` | OK |
| Choice-knappar (selected) | `.btn-copper` (existerar inte i `_base.css`) | Anpassad selected-state: solid accent + vit text | Code: ersätt `.btn-copper` med inline-styling enligt mocken (eller skapa `.btn-segmented-active` om mönstret återanvänds) |
| Fortsätt-CTA | `.btn-primary` med `width: 100%, letterSpacing: '2px', textTransform: 'uppercase', opacity: chosen ? 1 : 0.4` | `.btn-cta` finns specifikt för full-width primära CTA: 14px weight 700, letter-spacing 1.5, radius 12 | Code: byt till `className="btn btn-cta btn-primary"`. Disabled-state hanteras via `disabled`-prop, inte opacity manuellt |
| `.texture-wood` | Används som bakgrund | Inte i `_base.css` — möjligen legacy texture-klass | Code: verifiera om klassen finns i `global.css` eller om det är dead reference |
| Headers utan emoji-prefix | `📊 TABELLÄGE`, `⚡ HÖSTENS STUNDER`, `🔔 SPELARSITUATION`, `💡 INFÖR VÅREN` | Designsystemets h-label är designad för emoji-prefix | OK — matchar konventionen |

Plus: TODO-kommentaren `{/* TODO(FAS 1): byt mot piktogram · statistik · se ICON-BRIEF.md */}` är inkonsekvent — vissa labels har den, andra inte. Code kan rensa upp det när `ICON-BRIEF.md`-piktogram-systemet implementeras.

## Tonal-anteckningar

- **"HALVVÄGS"** är bra rubrik — kort, definitivt, beskriver vad som händer.
- **"Inför vårsäsongen"** subtitel — perfekt. Bandyspelets natur är höst+vår med uppehåll i januari.
- **Choice-text** är OK men **effekt-text avslöjar mekaniken** ("+5 kondition, +3 moral"). Det är acceptabelt eftersom det är ett serietäldrigt val — spelaren ska veta vad valet ger. Inte alltid önskvärt i mer narrativa val (jfr WeeklyDecisionSecondary där effekt-text är mer suggestiv: "−3 tkr · +bortasupport").

Eventuell framtida finputs: byt "+10 form, men ökad skaderisk" till "Hård spring, slitna ben" eller liknande för att matcha bandyspråket. Inte akut.

## Implementation steg (om Code vill putsa)

1. Ersätt inline section-label-styles med `<p className="h-label">…</p>`
2. Byt `.btn-copper` (selected-state) till anpassad selected-styling enligt mocken
3. Byt Fortsätt-CTA från manuell inline-styling till `className="btn btn-cta btn-primary"`
4. Verifiera `.texture-wood` — om dead, ta bort
5. Inga test-ändringar behövs — funktionalitet är oförändrad

Code kan göra detta som ren visuell putsning utan funktionella ändringar. Eller hoppa det helt om existing rendering är "good enough" — funktionellt fungerar skärmen.

## Inte i scope

- Funktionella ändringar (val-effekter, summary-generation)
- Ny information på skärmen (befintliga sektioner är välbalanserade)
- Animation/transition mellan sektioner
- Audio-pingar vid val

## Status

Mock på disk. Frågan om visuella justeringar är **ej akut** — Code kan ta dem i nästa pass av designsystem-migrering eller skippa om existing räcker. Mock fungerar primärt som *referens* mot designsystemet och som dokumentation för framtida regression.
