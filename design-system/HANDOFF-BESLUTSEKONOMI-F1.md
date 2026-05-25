# HANDOFF — F1 Beslutsekonomi UI-mönster

**Datum:** 2026-05-17
**Mock:** `docs/mockups/2026-05-17_design_beslutsekonomi.html`
**Spec som besvaras:** `docs/mockups/2026-05-08_beslutsekonomi_spec.md`
**Open thread:** `design-system/CLAUDE.md` → "F1 Beslutsekonomi UI-mönster"
**Beroende:** SPEC_BESLUTSEKONOMI Steg 1–3 levererade (verifierat i `sprints/SPRINT_BESLUTSEKONOMI_STEG1_3_AUDIT.md`). Backend-mekanik (`max 2 active` + cooldowns) på väg från Code.
**Audience:** Code (implementation), Jacob (acceptans).

---

## Vad mocken besvarar

Tre öppna frågor från `CLAUDE.md`:

1. **Hur ser kö-indikatorn ut när 2 beslut är aktiva och 3:e triggas?**
   → `queue-rail` mellan Active-stack och Secondary-stack. Eyebrow + räknare + chip-rad per källa.
2. **Hur kommuniceras "cooldown 3 omgångar kvar" på en källa?**
   → Cooldown-rad i botten av den sekundär som källan tillhör. Tre amber-prickar tickar ner. Aldrig fristående.
3. **Hopas inkommande beslut i bakgrunden eller blockas helt? Visuell skillnad?**
   → BÅDA, men är olika kategorier. Hopas (deferred) = global budget full, kön växer av tryck. Blockas (cooldown) = källan tyst en stund, krymper av tid. Två separata UI-platser, två separata visuella språk.

---

## Anatomi — tre informationsklasser, tre platser

| Klass        | Plats                                      | Visuell vokabulär                                                                |
|--------------|--------------------------------------------|----------------------------------------------------------------------------------|
| **Active**   | Direkt i Portal-flödet, max 2              | `dec-card` med 2 px `--accent` stripe, budget-prickar (●●/●○/○○) längst upp     |
| **Deferred** | `queue-rail` mellan Active & Secondary     | Eyebrow `⏳ I KÖ` + räknare ("3 nästa veckan") + kategori-chip per källa         |
| **Cooldown** | Botten av källans sekundär                 | `cooldown-row` med amber-prickar (●●● → ●●○ → ●○○ → källan kan tala igen)        |
| **Inbox**    | Bottenrad i Portal                         | `[2 aktiva · 3 i kö · 7 notiser i inboxen]` — separata domäner, samma rad        |

---

## Sex tillstånd att implementera

| #  | Tillstånd                          | Vad som syns                                                                              |
|----|------------------------------------|-------------------------------------------------------------------------------------------|
| 01 | Tutorial (Säsong 1 Omg 1)          | Budget = 1/locked. Tutorial-band ovanför kortet förklarar varför.                         |
| 02 | Lugnt (0 aktiva)                   | Ingen Active-rad, ingen queue-rail. Portal andas.                                         |
| 03 | Normal (1 aktiv)                   | Budget 1/2. Inget queue-rail (det finns plats).                                           |
| 04 | Fullt (2 aktiva + 3 i kö)          | Budget 2/2. Queue-rail visar 3 chip + räknare.                                            |
| 05 | Cooldown (1 aktiv + en källa tyst) | Sekundär för källan rendereras med `dormant`-klass + cooldown-rad i botten.               |
| 06 | Resolution → kön avancerar         | En aktiv resolves → en chip lyfts upp ur queue-rail till active-stack. Inget pop-läge.    |

---

## Token-användning (auktoritativt från `colors_and_type.css`)

- **Active stripe:** `--accent` (#C47A3A) — sponsor/mecenat-relationella använder `--warm` (#8c6e3a) per severity-systemet
- **Queue-rail:** `--accent` opacity 0.04 bakgrund + opacity 0.18 border
- **Cooldown-prickar:** `--warm` (#8c6e3a) — tystnad är ackumulerande tid, inte alarm
- **Tutorial-band:** `--accent` opacity 0.10 → 0.04 gradient + opacity 0.25 border
- **Dormant-sekundär:** `border-left` på opacity 0.3, bakgrund på rgba(34,29,24,0.5), body-opacity 0.55

Inga nya tokens uppfunna. Allt finns i `colors_and_type.css`.

---

## Implementationspunkter för Code

### 1. Budget-prickar

```tsx
<span className="active-budget">
  {[...Array(maxBudget)].map((_, i) => (
    <span
      key={i}
      className={`budget-dot ${
        i < activeCount ? 'on' : (isSeason1Round1 && i >= 1 ? 'locked' : 'off')
      }`}
    />
  ))}
</span>
```

`maxBudget` = 2 normalt, 1 vid `currentSeason === 1 && currentRound === 1`. Andra sloten visas alltid (också i Säsong 1 Omg 1) men som `.locked` så strukturen är konstant.

### 2. Queue-rail

```tsx
{deferred.length > 0 && (
  <QueueRail
    count={deferred.length}
    chips={uniqueBy(deferred, d => d.source).map(d => ({
      icon: SOURCE_ICONS[d.source],
      label: SOURCE_LABELS[d.source],
      tone: SOURCE_TONES[d.source], // 'accent' | 'warm' | 'cold'
    }))}
  />
)}
```

Renderas mellan `PortalEventSlot` och första `<PortalSecondaryCard>` i `PortalScreen.tsx`. Maximalt 4 chip — om fler källor finns: ersätt sista med `+N fler`.

### 3. Cooldown-rad på sekundär

```tsx
{source.cooldown && source.cooldown.roundsLeft > 0 && (
  <CooldownRow
    roundsLeft={source.cooldown.roundsLeft}
    totalRounds={source.cooldown.totalRounds}
  />
)}
```

`CooldownRow` renderas i botten av `SourceSecondaryCard` (kommunen, akademin, lokaltidningen, mecenaten, etc.). Visar `roundsLeft` prickar fyllda (`.left`), resten `.spent`. Inga prickar = ingen rad. När `roundsLeft === 0` försvinner raden och kortet återgår från `dormant` till `active`-styling.

### 4. Inbox-rad

Befintlig rad i `EventCardInline.tsx` rad 140 ("X notiser i inboxen") flyttas till en egen `<PortalInboxCounter>` i botten av `PortalScreen`. Format: `[N] aktiva · [M] i kö · [K] notiser i inboxen`. Saknade kategorier göms (visa inte "0 i kö").

### 5. Tutorial-band (Säsong 1 Omg 1)

Renderas mellan `active-section` och första `dec-card` när `currentSeason === 1 && currentRound === 1 && hasAnyActive`. Försvinner från och med Omg 2 — vi flaggar inte att budget höjs, det märks naturligt när 2:a sloten används.

---

## Krockar att respektera

- **Stripe-regler.** 2 px copper på Active, 2 px warm på sponsor/mecenat. `--cold` används aldrig här — det reserveras för severity (journalist-relation, cold_winter). Bryt inte den distinktionen.
- **CTA-knappar.** Använd `.btn .btn-primary` / `.btn .btn-outline` på decision-options när det är en `getActionsForEvent`-driven action. Här i mocken är de `.dec-option`-grid (egen layout, 2-kolumn), eftersom weeklyDecisions har egen anatomi från `2026-05-07_weekly_decision_mock.html`. Det är konsekvent.
- **Tonalitet.** "Lugnar sig", "nästa veckan", "3 omgångar kvar". Inga utropstecken, inga "FULLT!"-banners, inga toaster.
- **Inbox är inte kön.** Två separata kategorier. Räknarna får aldrig vara samma siffra.

---

## Vad jag inte byggde — bevakas

- **Animation på resolve → queue advancement.** State 06 visar slutläget, inte transitionen. Min rekommendation: ingen animation, bara fadeIn på det nya kortet (250 ms). Vill Jacob ha mer rörelse är det en separat ändring.
- **Klicka-på-chip för att förhandsvisa kommande decision.** Övervägt och avvisat: kön är information, inte navigation. Klick → ingenting.
- **Vad händer om 6+ källor vill in samtidigt?** Spec säger queue växer. Mocken visar max 3 chip. Implementation: ersätt sista med `+N fler` chip. Skulle bli ovanligt men inte omöjligt vid säsongsbyte.

---

## Verifiering före merge

1. Mock renderas i `docs/mockups/2026-05-17_design_beslutsekonomi.html` — alla 6 tillstånd syns på desktop, ett per kolumn, scrollbar mobil.
2. Code implementerar `PortalQueueRail` + `CooldownRow` + `PortalInboxCounter` enligt anatomi ovan.
3. Jacob playtestar Säsong 1 Omg 1 → tutorial-bandet syns. Omg 2 → tutorial-bandet borta, budget 1/2. Omg 17 + spamma triggers → queue-rail växer korrekt.
4. Pixel-audit i kontext med 4+ sekundärer aktiva — hierarki håller? Cooldown-raden får inte konkurrera med Active-stacken.

---

## Filer som ska in (förslag)

- `docs/mockups/2026-05-17_design_beslutsekonomi.html` — denna mock
- `design-system/HANDOFF-BESLUTSEKONOMI-F1.md` — denna handover (uppdatera `HANDOFF.md` med pekare hit)
- Uppdatera `design-system/CLAUDE.md` → "RECENT CHANGES" med "2026-05-17 — F1 Beslutsekonomi UI-mock + handover levererade"
- Uppdatera `design-system/CLAUDE.md` → "OPEN THREADS" → flytta F1 från "KRITISKT NU" till status "väntar på Code's implementation"
