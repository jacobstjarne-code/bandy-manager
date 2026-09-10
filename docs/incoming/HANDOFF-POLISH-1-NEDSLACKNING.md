# HANDOFF — Polish 1/5: Nedsläckning (in-match scen-övertagande)

**Från:** Design
**Till:** Code
**Pairas med mock:** `Polish-nedslackning.dc.html`
**Grundfynd:** `pt6-nedslackning-timing` (match-eventets fade för seg)
**Rör:** Match-vyn när ett event-overlay tar över. **Ingen mekanik** — bara dim + timing.

---

## 0 · TL;DR

När ett matchevent tar över dimmas allt **utom resultattavlan**. Tavlan är ankaret — spelaren släpper aldrig matchen ur sikte medan hen väljer. Underlaget faller till ~34% ljus under en scrim; scenen stiger. Den gamla faden var för seg; den nya är snärtig och överlappande.

Detta är en **designintention**, inte något koden bär idag.

---

## 1 · Skiktning (z-index)

| Skikt | z | Behandling under övertagande |
|---|---|---|
| **Resultattavlan** | 5 | Oförändrad — lyser kvar, full styrka |
| Scrim | 6 | `rgba(0,0,0,0.6)`, `top:54px` (når aldrig tavlan), fade in 260ms |
| Underlaget (feed, momentumbar, kontroller) | under scrim | `filter:brightness(0.34) saturate(0.7)`, 260ms |
| Scenen | 7 | Stiger 220ms (opacity + translateY + scale 0.98→1), delay 80ms |

Scrim-värdet är samma som match-modalerna (`rgba(0,0,0,0.6)`, ingen blur — DS §8). Ingen annan yta tänds/släcks — bara detta scen-övertagande.

---

## 2 · Timing (grundfyndet)

- **Ingång:** dim 260ms · scen 220ms med 80ms delay → **överlappande**, inte sekventiellt. Scenen börjar stiga medan dimningen fortfarande löper. Total upplevd övergång ~380ms.
- **Utgång:** scen ut 180ms · underlaget tänds tillbaka 220ms.
- Ease: dim `ease`, scen-transform `cubic-bezier(0.25,0.46,0.45,0.94)` (samma som TacticPreview, DS Animation).

Det gamla problemet var att faden kändes utdragen. Kuran här är kort och överlappad — inga långa transitions (DS: "No bouncy springs, no long transitions").

---

## 3 · Vad som INTE ändras

- Resultattavlan (LED, `--led-us`/`--led-them`/`--led-score`) rörs inte.
- Event-logiken, scen-innehållet, valens konsekvenser — allt orört.
- Detta gäller bara in-match event-overlay. Portal-modaler och andra scrims har sin egen (redan godkända) behandling.

---

## 4 · Implementation

- Lägg `.match-dimmed`-state på match-view-containern när ett event-overlay monteras: dim-filter på underlags-wrappern, scrim med `top` = scoreboard-höjd, scen på z 7.
- Bind fade-timingen enligt §2. Respektera `prefers-reduced-motion` → hoppa transform, behåll dim (instant).
- Estimat: ~45 min (CSS-state + timing, ingen ny komponent).

---

— Design
