# Design-not: squad-pulse start-state ändrad 2026-05-25

**Av:** Opus. **Gäller:** SquadPulseHero, NU-vyns topp. **Status:** ändrat i kod (Jacob beslut).

## Vad som ändrades och varför

Din edge-spec sa: "<5 datapunkter → visa bara aktuellt värde + 'Pulse-data byggs upp' som
auto-rad." I praktiken producerade den en kontradiktion: heron visade samtidigt ett värde
med delta ("61 ↓5") OCH "Pulse-data byggs upp" (skärmdump från Jacobs playtest). Det läste
som inkoherent — ett konkret värde och ett påstående om att data saknas, på samma kort.

Djupare problem: "Pulse-data byggs upp" är konceptuellt fel. Komponenterna — fitness, moral,
skador — är kända från omgång 1. Puls-värdet är beräkningsbart direkt. Det enda som faktiskt
byggs upp är TRENDEN (sparkline-formen och deltan över tid). Så att hålla inne värdet och
status-raden tills omgång 5 dolde information vi redan hade.

## Nya start-states (ändrat)

- **0 omgångar** (ingen match spelad): kvar som förut — kompakt kort, "Pulse-data byggs upp."
  Här är det korrekt: vi har bokstavligen ingen data.
- **1 omgång:** värde + en RIKTIG komponent-rad ("Truppen är frisk." / "Två skadade...").
  Ingen delta (kräver två punkter). Graf-ytan = tunn spacer (en punkt kan inte rita linje).
- **2–4 omgångar:** värde + delta + riktig auto-rad (inkl. trend-rader). Graf-ytan = spacer.
- **5+ omgångar:** full sparkline-linje + expand med sub-sparklines (oförändrat, din ritning).

"Pulse-data byggs upp" finns nu BARA i 0-data-fallbacken.

## Den enda kvarvarande Design-frågan (din call)

Själva GRAFEN (sparkline-linjen) är fortfarande tom — tunn spacer — omgång 1–4, och tänds
först vid 5 punkter. Det behöll jag medvetet: det var ditt tröskelval, och en tvåpunkts-linje
är trivial (rak sträcka). Sparkline-primitiven har dessutom en intern `MIN_POINTS = 5`-spärr
som ritar "—" under det, så att visa grafen tidigare kräver en `minPoints`-prop på Sparkline.

**Opus rekommendation:** behåll 5-punkters-tröskeln för linjen. Heron är nu levande ändå
(värde + delta + status-rad från start), så tomheten Jacob klagade på är borta utan att linjen
behöver ritas på tunt underlag. Men om du vill att linjen ska börja byggas synligt redan från
2 punkter — säg till, då lägger Code en `minPoints`-prop. Din yta, ditt val.

— Opus, 2026-05-25
