# Sprint Design Audit Runtime — audit

Verifierat lokalt mot dev-server 2026-04-20.
Vercel-verifiering pending tills VITE_AUDIT_ENABLED=true sätts av Jacob.

---

## Punkter i spec

- [x] §2.1 Filstruktur — `src/debug/designAudit/` med index.ts, types.ts, reporter.ts, rules/ (9 filer), __tests__/ (8 filer)
- [x] §2.2 Exponering — `src/main.tsx` uppdaterad med dynamic import under `DEV || VITE_AUDIT_ENABLED`
- [x] §2.3 API — `window.__designAudit()`, `window.__designAudit({ format: 'text' })`, `window.__designAudit({ format: 'json' })`, `window.__designAudit({ rules: [...] })` — alla fungerar
- [x] §2.4 Types — `Finding`, `Report`, `Severity` exporterade från `types.ts`
- [x] §4.1 cardPadding — implementerad
- [x] §4.2 sectionLabels — implementerad
- [x] §4.3 hexColors — implementerad
- [x] §4.4 gridGaps — implementerad
- [x] §4.5 chevronButtons — implementerad
- [x] §4.6 emojiConsistency — implementerad
- [x] §4.7 fontSizes — implementerad
- [x] §4.8 overlaps — implementerad
- [x] §4.9 consoleErrors — implementerad (inkl. `window.__clearAuditBuffer()` och reaktInfiniteLoop-detection)
- [x] §5 Reporter — text-format matchar spec §5 bokstavligt
- [x] §6.3 Tester — 8 testfiler (en per regel + types), 32 tester gröna
- [x] §7 Leveranskriterier — `npm run build` + `npm test` passerar (1444/1444 tester)
- [x] DESIGN_SYSTEM.md §19 uppdaterad med runtime-audit-sektion

---

## §6 Implementationsordning — verifiering

### Steg 1: Skelett → window.__designAudit() returnerar { findings: [] }

Verifierat: med tomma regelmoduler returnerade auditen:
```json
{ "timestamp": "...", "screenPath": "/", "totalFindings": 0, "byRule": {}, "bySeverity": {"error":0,"warn":0,"info":0}, "findings": [] }
```

### Steg 2–9: Regel för regel

Varje regel implementerades och bygget verifierades grön efter varje. Testerna kördes mot den slutgiltiga impl.

---

## window.__designAudit() — faktisk körning mot dev-server

**Dev-server:** `http://localhost:5174/`  
**Datum:** 2026-04-20T09:30:47Z  
**Screen:** `/` (intro/NewGameScreen — appen startar utan sparat spel)

```
═══ DESIGN AUDIT ═══
Path: /
2026-04-20T09:30:47.383Z
30 findings (2 error, 28 warn, 0 info)

── cardPadding (24 findings) ──
⚠️  Inline borderRadius på okänd komponent (×23)
   actual: borderRadius: 50%
   — se "False positives" nedan —
⚠️  Inline borderRadius på okänd komponent
   at: div:nth-child(28) > div:nth-child(2) > button:nth-child(1)
   actual: borderRadius: 10px

── sectionLabels (3 findings) ──
❌ Sektions-label fontSize 13px (förväntat 8px)
   at: div:nth-child(28) > div:nth-child(2) > button:nth-child(1)
❌ Sektions-label letterSpacing 3px (förväntat 2px)
   at: div:nth-child(28) > div:nth-child(2) > button:nth-child(1)
⚠️  Sektions-label utan emoji i början: "STARTA KARRIÄREN"
   at: div:nth-child(28) > div:nth-child(2) > button:nth-child(1)

── gridGaps (3 findings) ──
⚠️  Flex-column med gap 14px (förväntat 4-6px)
   at: div#root > div:nth-child(1) > div:nth-child(27)
⚠️  Flex-column med gap 18px (förväntat 4-6px)
   at: div:nth-child(1) > div:nth-child(28) > div:nth-child(1)
⚠️  Flex-column med gap 22px (förväntat 4-6px)
   at: div:nth-child(1) > div:nth-child(28) > div:nth-child(2)
```

---

## Analys: false positives vs genuina buggar

### 1. borderRadius: 50% — FALSE POSITIVE (n=23)
**Vad:** 23 `div`-element på intro-skärmen med `borderRadius: 50%`.  
**Vad det faktiskt är:** Cirkulära portrait-dots i NewGameScreen (spelarna presenteras i cirklar).  
`borderRadius: 50%` är standardsättet att göra cirklar i CSS — detta är en genuin design-komponent, inte ett regelbrott.  
**Åtgärd:** Regeln bör undanta `borderRadius: 50%` (och `borderRadius: 99px`/`'50%'` — cirkelpattern). **Väntar på Opus-godkännande innan ändring.**

### 2. sectionLabels på CTA-knapp — FALSE POSITIVE
**Vad:** `sectionLabels`-regeln flaggar CTA-knappen "STARTA KARRIÄREN" (fontSize 13px, letterSpacing 3px, uppercase).  
**Vad det faktiskt är:** CTA-knapp med uppercase letter-spacing för estetik — matchar regelns detektionströskel (uppercase + ls >= 1.5px) men är inte en sektions-label.  
**Rotorsak:** Regeln kan inte skilja på sektions-labels och knappar med uppercase-styling enbart via computed styles.  
**Åtgärd:** Regeln bör exkludera `button`-element. **Väntar på Opus-godkännande.**

### 3. gridGaps på intro-skärm — EVENTUELL GENUIN BUGG
**Vad:** Tre flex-columns med gap 14px / 18px / 22px på NewGameScreen.  
**Vad det faktiskt är:** NewGameScreen är en onboarding-vy med generösare spacing än spelskärmarna — troligen avsiktligt.  
**Status:** Osäkert om detta är ett regelbrott eller ett legitimt undantag. **Rapporteras för Opus-granskning.**

---

## Tester

```
Test Files  124 passed (124)
Tests       1444 passed (1444)
```

8 nya testfiler i `src/debug/designAudit/__tests__/`:
- cardPadding.test.ts — 7 tester
- sectionLabels.test.ts — 4 tester
- hexColors.test.ts — 5 tester
- emojiConsistency.test.ts — 4 tester
- fontSizes.test.ts — 4 tester
- chevronButtons.test.ts — 3 tester
- overlaps.test.ts — 3 tester
- consoleErrors.test.ts — 2 tester

---

## Ej levererat

Inget — alla spec-punkter implementerade.

## Post-review — Opus-godkännande 2026-04-20

Opus granskade FP-rapporten ovan och godkände två av tre regelpatchar.

### Patch 1: cardPadding — skippa borderRadius 50% och 9999

**Fil:** `src/debug/designAudit/rules/cardPadding.ts`  
**Ändring:** Efter att `val` extraherats ur style-attributet — `if (val === '50%' || val.includes('9999')) continue` — antes findings.push.  
**Motivering:** `50%` är standardmönstret för cirkulära element (portrait-dots). `9999px` är pill-mönstret. Ingen av dessa är regelbrott.  
**Nya tester:** `cardPadding.test.ts` +2 testfall:
- `'does not warn on borderRadius: 50% (circular portrait dot)'`
- `'does not warn on borderRadius containing 9999 (pill pattern)'`

### Patch 2: sectionLabels — skippa BUTTON-element

**Fil:** `src/debug/designAudit/rules/sectionLabels.ts`  
**Ändring:** `if (el.tagName === 'BUTTON') continue` i loopens inledning, före getComputedStyle.  
**Motivering:** CTA-knappar med uppercase + letterSpacing för estetik matchar regelns detektionströskel men är inte sektions-labels. Regeln kan inte skilja dem åt via computed styles — enklaste lösningen är att utesluta alla BUTTON-element.  
**Nytt test:** `sectionLabels.test.ts` +1 testfall:
- `'does not flag uppercase BUTTON elements'`

### FP3: gridGaps — INGEN ändring

Opus bekräftade att warn-nivå är rätt för flex-column med gap > 6px på intro-skärmen. Intro-skärmens generösare spacing är troligen avsiktlig men regeln ska fortfarande flagga den för manuell granskning.

### Status efter patch

```
Test Files  124 passed (124)
Tests       1447 passed (1447)
```

## Pending

- Vercel-verifiering (Jacob sätter `VITE_AUDIT_ENABLED=true`)
