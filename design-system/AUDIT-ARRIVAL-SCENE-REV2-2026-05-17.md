# AUDIT — ArrivalScene rev2 visuell audit

**Datum:** 2026-05-17
**Audit-typ:** Visuell audit i kod (rendering inte verifierad — kräver Code-skärmdumpar för 🟢)
**Commit som auditeras:** `8fab004` (stegvis-ackumulativ enligt Open Threads punkt 4)
**Filer:** `src/presentation/screens/ArrivalScene.tsx` (168 rader) + `src/styles/global.css` rader 974–1148.
**Audience:** Code (åtgärder), Jacob (acceptans).

---

## Sammanfattning

| Bedömnings­punkt från OPEN THREADS | Status | Anmärkning |
|------------------------------------|--------|------------|
| Stegvis-ackumulativ är i kod | ✅ OK | Phase-state-machine korrekt implementerad i `useEffect`-kedjan. |
| Föregående repliker dimmas via `.scene-dimmed` | 🟧 PARTIELL | **Dimning sker, men via `.in.dimmed`-modifier, INTE `.scene-dimmed`-klassen som specen refererar.** Legacy-klassen `.scene-dimmed` finns kvar i CSS men används inte av ArrivalScene rev2. |
| CTA döljs under timing-fönstret | ✅ OK | `.scene-cta-area` har `pointer-events: none` + `opacity: 0` tills `phase === 'cta'`. |
| Exit-overlay funkar | ✅ OK | `Hoppa över ↘`-knappen finns (rad 64) och `onComplete` navigerar till `/game/dashboard`. |

Tre fynd att åtgärda. Inget är 🟥 BLOCK — alla 🟧 WARN eller 🟨 OBSERV.

---

## Åtgärdslista (från auditen)

| # | Severity | Åtgärd | Vem |
|---|----------|--------|-----|
| A1 | 🟧 | Uppdatera `CLAUDE.md` OPEN THREADS punkt 4 → byt `.scene-dimmed` mot `.in.dimmed`-mönstret. | Design/Opus |
| A2 | 🟧 | Refaktor: `.arrival-board-card` → använd `.portal-secondary-card`-klassen istället för duplicerad anatomi. | Code |
| A3 | 🟨 | Lägg `transition: background 0.4s ease` på `.beat-progress .dot` så färgändring smyger in. | Code |
| A4 | 🟨 | Lägg `aria-label="Hoppa över introduktionen"` på `.scene-skip`. | Code |
| A5 | 🟨 | Inline-eyebrow i `ArrivalScene` (raderna 122–128) → ersätt med `<div className="portal-card-eyebrow">`. | Code |

Inga 🟥 BLOCK. Scenen kan playtestas som den är.

*(Full audit-rapport från Design — endast åtgärdslistan extraherad här. Detaljer för varje punkt finns i ursprungliga audit-filen från Design.)*
