# Granska — visuell separation Presskonferens vs Media

**Datum:** 2026-05-07
**Spec-typ:** Visuell justering, två befintliga sektioner
**Tracker-status:** Playtest-bug E från Code-fix-runda — design-fråga eskalerad

## Rot-problem

Code's inventering visade konkret källa till förvirringen:

`GranskaOversikt.tsx` renderar presskonferens (rad 199–231) och media (rad 269–294) i sekvens. **Båda sektioner använder identisk typografi:** `font-family: var(--font-display); font-style: italic; font-size: 13; color: var(--text-primary)`. Journalist-krediter formateras identiskt i båda.

Skillnaden idag: media har `<SectionLabel>📰 MEDIA</SectionLabel>` som visuell anchor. Presskonferensen har ingen motsvarighet — bara `event.title` som börjar med "🎤 Presskonferens — …". Press-sektionen *flyter ihop* med media-sektionen ovanifrån.

Plus: de har **olika narrativ funktion** men ser likadana ut:
- **Presskonferens:** *coachens egna ord* — direkta citat från användarens karaktär. Personligt.
- **Media:** *vad omvärlden skriver* — externa rubriker, tredje-persons-perspektiv. Distanserat.

Två olika perspektiv ska ge två olika visuella signal.

## Lösning

Två justeringar:

1. **SectionLabel-paritet:** presskonferensen får också en h-label-ankare. `🎤 PRESSKONFERENSEN` som h-label ovanför press-sektionen.

2. **Olika stripes + lätt color-vridning** för att signalera narrativ klass:

| Sektion | Stripe | Anledning |
|---|---|---|
| Presskonferens | `--warm` 3px (relations-stripe) | Personliga citat från användarens karaktär — designsystemets `--warm` är reserverad för relationskort/signaturer. Press är de coachens **personliga ord**, vilket matchar. |
| Media | `--accent` 2px (innehållstyp) | Externa rubriker, samma som andra inhalls-cards. Status quo. |

Stripe-tjocklek-skillnad (3px vs 2px) ger naturlig visuell hierarki utan att skrika.

3. **Optional typografi-vridning** (om steg 1+2 inte räcker efter playtest):
   - Press: behåller Georgia italic (matchar talspråk-citat)
   - Media: byter till Georgia **regular** (inte italic) — neutral redaktionell ton

   Detta är subtil men hjälper användaren att läsa de två sektionerna som *olika röster*.

## Implementation steg

`GranskaOversikt.tsx`:

1. **Press-sektion (rad ~199–231):**
   - Lägg till `<SectionLabel>🎤 PRESSKONFERENSEN</SectionLabel>` ovanför sektionen
   - Wrappa innehållet i en card-wrapper med `border-left: 3px solid var(--warm)` + `border-radius: 0 8px 8px 0`
   - Bibehåll Georgia italic 13px för citat-text
   - `event.title` rendering: ta bort `🎤 Presskonferens — `-prefix från titeln eftersom labeln nu äger det. Visa bara den faktiska titel-fortsättningen ("Coachens första intervju" e.dyl.)

2. **Media-sektion (rad ~269–294):**
   - Behåll befintlig `<SectionLabel>📰 MEDIA</SectionLabel>`
   - Wrappa i card-wrapper med `border-left: 2px solid var(--accent)` + `border-radius: 0 8px 8px 0` (om inte redan så)
   - Optional: byt italic → regular på media-headlines för redaktionell ton

3. **Verifiera mellan-rum:**
   - Padding/margin mellan sektioner ska vara 12-14px så de visuellt skiljs
   - Inga andra sektioner mellan press och media som kan förvirra ordning

## Designprincip — varför stripes

Designsystemet har stripe-system som visuellt språk: 2px accent (innehållstyp), 3px för viktiga/skada-block, `--warm`/`--cold` för relationer/signaturer. Att använda `--warm` 3px för press matchar systemets befintliga grammatik utan att uppfinna ny visuell semantik.

## Edge-cases

- **Ingen presskonferens denna omgång** — sektionen renderas inte alls. Media får hela ytan. OK.
- **Ingen media denna omgång** — press får hela ytan. OK.
- **Båda saknas** — Granska visar vad som annars finns där (inbox-items, etc.). Inga ändringar.

## Tester

- Snapshot på Granska med både press + media
- Snapshot med endast press
- Snapshot med endast media
- npm run build && npm test gröna

## Verifiering i playtest

- Spela en match → Granska efter
- Press-sektion visas med `🎤 PRESSKONFERENSEN`-label + warm-stripe
- Media-sektion visas med `📰 MEDIA`-label + accent-stripe
- Verifierar att de visuellt skiljs ut tydligt
- Code/du bedömer om optional typografi-vridning (italic → regular för media) behövs efter visuell test

## Inte i scope

- Funktionella ändringar (innehåll, generation, ordning)
- Ny press-typ eller media-typ
- Animation mellan sektioner

## Status efter landning

Inte i tracker (det är playtest-bug, inte inlåst system). Bug E i Code-fix-runda → 🟢 efter implementation och Jacob-verifiering.
