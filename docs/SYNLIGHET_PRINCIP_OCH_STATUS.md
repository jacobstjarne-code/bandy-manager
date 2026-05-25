# SYNLIGHET FÖRE SYSTEM — styrande princip + statusavstämning

**Datum:** 2026-05-21
**Av:** Opus, efter GPT-granskning + Design-Claude-diagnos + B8-leverans
**Status:** Levande ledstjärna. Detta dokument är sanningen C-SY1 vilar på —
inte ett chattfönster.
**Syfte:** Fånga den princip som styrt hela veckans arbete, och stämma av
GPT-granskningens fem tickets mot vad som FAKTISKT är byggt. Annars lever
insikten bara så länge rätt samtal är öppet.

---

## 1 · Principen

GPT-granskningen och Design-Claude konvergerade från olika håll på samma sak:

> **Ni har byggt djup. Nu måste spelaren känna djupet.**

Bandy Manager lider inte av brist på system. Det har klackEcho, journalist.memory,
pendingFollowUps, nemesisTracker, volunteerMorale, transferpersonligheter,
cooldowns, relationer, Moment-feed — mer reaktivitet under huven än de flesta
managerspel. Risken är den omvända: **spelet kan vara rikt i koden men platt i
upplevelsen**, för att rikheten aldrig ytas där spelaren mentalt befinner sig
("vad ska jag göra nu?"-vyn).

Den farliga reflexen är att fortsätta bygga system i tron att det löser känslan.
Det gör det inte. Det som behövs är synlighet, hierarki, kausalitet — inte fler
flaggor i state.

**Styrande regel framåt:** innan en ny feature specas, fråga om problemet är
"systemet saknas" eller "systemet syns inte". Är det det andra — bygg synlighet,
inte system.

---

## 2 · GPT:s fem tickets — faktisk status

Ärlig avstämning. Skilj på "råvara byggd" (B8 dukade bordet) och "spelaren ser
det" (obyggt). Inget av de fyra är synligt för spelaren ännu.

| # | Ticket | Råvara | Synligt för spelaren | Bor i |
|---|---|---|---|---|
| 1 | Efterklang på Portal (1–3 aktiva minnen) | ✅ `collectActiveMemories` (B8, 9 källor, viktad ström) | ❌ ingen renderingsyta | C-SY1 |
| 2 | Orsakskrok på reaktiva texter | — (textrefaktor, ej påbörjad) | ❌ | C-SY1 |
| 3 | Portal-hierarki (en primär, en sekundär) | ✅ `countPendingInterrupts` (B8, mäter trängseln) | ❌ ingreppet ogjort | C-SY1 |
| 4 | Efter-match-kvitto | ✅ `managerChoiceLog` på MatchReport (B8, överlever strip) | ❌ ingen kvitto-rad | C-SY1 |
| 5 | 15-min extern playtest | — | se §3 | Jacob |

**Slutsats:** B8 byggde råvaran till tre av fyra (efterklang, hierarki-mätning,
kvitto). Noll renderas. Ticket 2 (orsakskrok) är orörd. GPT:s faktiska mål — att
spelaren ska *känna* djupet — är inte uppnått på en enda punkt. Det är C-SY1:s
hela uppdrag, och det väntar på Design.

Moment-feeden (`recentMoments`) är samma historia, separat verifierad i
AUDIT_SYNLIGHET_2026-05-21: levande, skrivs varje runda från 6+ källor, ingen
renderingsyta. Den hör hemma i ticket 1:s yta.

---

## 3 · Playtest — ärlig status (en datapunkt, inte en rapport)

Vad som faktiskt är observerat hittills:

- **Tid till första match: snabb (bekräftat av Jacob).** GPT:s metrik 1 besvarad,
  och väl — onboarding-till-match är inte där spelaren tappas.

Vad som INTE är testat ännu (GPT:s tre övriga metriker, alla "känns", inte
mätbara i kod):

- "Vad ska jag göra nu?" — vyklarhet, otestad
- "Spelar det här någon roll?" — kausalitetskänsla, otestad (detta är exakt vad
  ticket 1+2 finns för)
- "Vill du spela en match till?" — återvändar-impuls, otestad

**Detta är inte en fullständig playtest-rapport, och ska inte behandlas som en.**
Det är en datapunkt. De tre öppna frågorna är vad nästa spelsession + Designrundan
ska stänga. C-SY1 ska designas mot dem, inte mot magkänsla — och just nu har vi
bara svar på den minst kritiska av de fyra.

---

## 4 · Vad detta betyder för prioritering

C-SY1 är GPT-granskningens olösta kärna och bör rimligen vara det som händer
direkt efter Designrundan — före B1 (klubbutveckling), före nya system. Vi har
lagt en vecka på infrastruktur (kalender, matchmotor, urval, dukning); principen
säger att nästa steg är att göra det synligt, inte bygga mer.

B8 sänkte tröskeln rejält: ticket 1 och 4 har sin data redo, så Designrundan kan
fokusera på *yta och hierarki*, inte på datamodell. Ticket 1 (efterklang) är
fortsatt högst värde — mest direkt synliggörande av befintlig data.

Öppna frågor för Designrundan (oförändrade från skissen, nu med B8-data på plats):
- Ticket 1: är efterklang en secondary (vikt 60–70) eller egen tier? Hur väljer
  pickern 1–3 av `collectActiveMemories`-strömmen?
- Ticket 3: får primary mer dominans? Kollapsas secondary? Lyfts veckans beslut?
  (Nu med `countPendingInterrupts` som faktisk mätare av trängseln.)
- Ticket 4: renderas `managerChoiceLog` som 1 rad? Vilka val är värda en rad?
- Ticket 2: behövs orsakskrok separat, eller löser ticket 1:s yta kausaliteten?

---

— Opus, 2026-05-21
