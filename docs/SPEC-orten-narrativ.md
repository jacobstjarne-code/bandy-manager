# SPEC: Orten som levande narrativ

## Syfte
Kommun, mecenater och Bygdens puls är tre system som utgör Bandy Managers unika samhällsdimension — det som skiljer spelet från FM/FIFA. Men i nuläget är de begravda under Klubb → Orten och syns aldrig i det normala spelflödet (dashboard → match → round summary → dashboard). Den här specen handlar om att göra systemen synliga, begripliga och underhållande utan att skapa nya mekaniker.

---

## 1. SURFACING — visa det som redan finns

### 1A. Inbox-notiser (HÖGST PRIORITET)
Systemen genererar redan events internt. De MÅSTE synas i inboxen.

**Kommun-events:**
- `🏛️ Politikern X bjöd in dig till kommunfullmäktige` (när relation > 70)
- `🏛️ Bidraget ökade till Y tkr/säsong` (efter lyckad ansökan)
- `🏛️ Nyval! X (Parti) ersätter Y som kommunalråd` (vid politikerbyte)
- `🏛️ Kommunalrådet noterade er storvinst mot Z` (efter vinst med relation > 50)

**Mecenat-events:**
- `👥 Ny mecenat: X vill stödja klubben` (när mecenat aktiveras)
- `👥 X (mecenat) är missnöjd med utvecklingen` (happiness < 30)
- `👥 X drar sig ur som mecenat` (happiness = 0 / deaktiveras)
- `👥 X ökar sitt stöd till Y tkr/säsong` (happiness > 80)

**Implementation:** Lägg till inbox-generering i `roundProcessor.ts` under community standing-uppdateringen. Kolla `mecenat.happiness`-förändringar och `politician.relationship`-förändringar per omgång.

### Filer att ändra:
- `src/application/useCases/roundProcessor.ts` — generera inbox-items
- `src/domain/services/inboxService.ts` — nya factory-funktioner

### 1B. Dashboard-alerts
Viktiga förändringar bör synas som en liten alert under Bygdens puls-kortet på dashen:

- "Ny mecenat intresserad" (gul prick)
- "Kommunbidraget ökade" (grön text)
- "Mecenat missnöjd" (röd text)

**Implementation:** Derivera från senaste inbox-items med typ `Community` / `BoardFeedback`. Visa max 1 alert under CommunityPulse-kortet.

### Filer att ändra:
- `src/presentation/screens/DashboardScreen.tsx` — alert under CommunityPulse
- Eventuellt `src/presentation/components/dashboard/CommunityPulse.tsx`

---

## 2. NARRATIV — förklara varför spelaren ska bry sig

### 2A. Kommun: relation som bar + agenda i klartext
Nu: `Agenda: youth · Relation: 45/100` — data utan kontext.

**Ny design:**
```
🏛️ KOMMUN

Anna Lindström (S)
Agenda: Ungdomssatsning

[==========--------] 63/100  ← relationsbar med färgkodning

"Kommunalrådet vill se satsning på ungdomsverksamhet.
 Hög relation → bättre chans till bidrag."

Kommunbidrag: 15 tkr/säsong
Nästa val: 2029

[📋 Bjud in] [📊 Budget] [📝 Bidrag]
```

**Agendaförklaring (statisk, per agenda-typ):**
- `youth`: "Vill se satsning på ungdomsverksamhet. Stärk akademin och kör bandyskola."
- `prestige`: "Vill att klubben sätter orten på kartan. Slutspel och bra resultat imponerar."
- `infrastructure`: "Vill se investeringar i anläggningar. Uppgradera faciliteter."
- `community`: "Vill att klubben engagerar sig i samhället. Kör föreningsaktiviteter."

### Filer att ändra:
- `src/presentation/components/club/KlubbTab.tsx` — omdesigna kommun-sektionen

### 2B. Mecenater: tom-state + kontext
Nu: "Inga aktiva mecenater. De dyker upp om klubben lyckas."

**Ny tom-state:**
```
👥 MECENATER

Inga mecenater ännu.

Mecenater är lokala företagare som stödjer klubben ekonomiskt.
De lockas av framgång (slutspelsplats) och hög Bygdens puls.

Fokusera på att vinna matcher och engagera bygden —
då kommer intresset.
```

**Aktiv mecenat-rad (förbättrad):**
```
Erik Andersson · Anderssons Bygg
[🤝 Nöjd]                    12 tkr/säsong

"Jag sponsrar så länge vi håller oss i toppen."
```

### Filer att ändra:
- `src/presentation/components/club/KlubbTab.tsx` — mecenatsektionen

### 2C. Narrativ tråd — hur systemen hänger ihop
Överst i Orten-tabben (under Bygdens puls) bör det finnas en subtil koppling:

```
Hög Bygdens puls → fler mecenater intresserade → större kommunbidrag
```

Inte som en separat text utan som en liten footer i Bygdens puls-kortet:
"Påverkar mecenat-intresse och kommunbidrag."

(Redan implementerat i nuvarande Bygdens puls-text, men kan skärpas.)

---

## 3. FACILITETER — konsolidering

### Problem
Faciliteter visas på TRE ställen:
- KlubbTab: "🏟️ Faciliteter" (youth quality etc) + "🏗️ Anläggning" (projects)
- AkademiTab: "🏫 Akademinivå" med uppgraderingsknapp

### Lösning
Slå ihop "🏟️ Faciliteter" och "🏗️ Anläggning" till EN sektion i KlubbTab.
Visa uppgraderingsalternativ (inklusive akademi) här.
Behåll akademiuppgradering i AkademiTab (speglas).

### Filer att ändra:
- `src/presentation/components/club/KlubbTab.tsx`
- `src/presentation/components/club/AkademiTab.tsx`

---

## 4. POLITIKER — fördjupning

### 4A. Cooldown synlig på knappar
Nu: man trycker och får "Du har redan pratat med politikern nyligen".
Bättre: knappen är disabled med text "Tillgänglig omgång X".

### 4B. Agenda-bonus synlig
Efter lyckad interaktion, visa HUR agenda-match påverkade resultatet:
"Anna uppskattade att ni kör bandyskola. Relation +5 (agenda-bonus +2)."

### 4C. Matchresultat-koppling
Om du bjuder in politikern och sedan vinner → extra relationsboost.
Visa i inbox: "Kommunalrådet var imponerad av segern mot X."

### Filer att ändra:
- `src/presentation/store/gameStore.ts` — `interactWithPolitician` med utökad logik
- `src/presentation/components/club/KlubbTab.tsx` — UI-förbättringar
- `src/domain/services/politicianService.ts` — flytta beräkningslogik hit
- `src/application/useCases/roundProcessor.ts` — matchresultat-koppling

---

## 5. OVERLAY-KONSISTENS

Alla overlays/modaler ska använda samma backdrop:
- Bakgrund: `rgba(0,0,0,0.6)` (INTE 0.85 eller 0.96)
- Kort: `var(--bg)` med `var(--border)`, `border-radius: 12px`
- Stäng: klick utanför stänger

**Redan fixade:**
- ✅ SubstitutionModal (denna session)
- ✅ RenewContractModal (denna session)
- ✅ BidModal (denna session)

**Kvar att verifiera:**
- HalftimeModal
- EventOverlay
- TutorialOverlay
- PhaseOverlay

### Filer att verifiera:
- `src/presentation/components/match/HalftimeModal.tsx`
- `src/presentation/components/EventOverlay.tsx`
- `src/presentation/components/TutorialOverlay.tsx`
- `src/presentation/components/match/PhaseOverlay.tsx`

---

## Prioritetsordning

1. **Inbox-notiser** (1A) — mest impact, systemen blir synliga i spelflödet
2. **Kommun relationsbar + agenda-klartext** (2A) — gör politiker-systemet begripligt
3. **Mecenater narrativ** (2B) — tom-state + mecenat-rader med känsla
4. **Faciliteter konsolidering** (3) — strukturell ordning
5. **Politiker fördjupning** (4) — cooldown, agenda-bonus, matchkoppling
6. **Dashboard-alerts** (1B) — kompletterande surfacing
7. **Overlay-konsistens** (5) — verifiera resterande overlays

---

## Berör filer (totalt)
- `src/application/useCases/roundProcessor.ts`
- `src/domain/services/inboxService.ts`
- `src/domain/services/politicianService.ts` (ny eller utökad)
- `src/presentation/components/club/KlubbTab.tsx`
- `src/presentation/components/club/AkademiTab.tsx`
- `src/presentation/components/club/EkonomiTab.tsx`
- `src/presentation/screens/DashboardScreen.tsx`
- `src/presentation/components/dashboard/CommunityPulse.tsx`
- `src/presentation/store/gameStore.ts`
- `src/presentation/components/match/HalftimeModal.tsx`
- `src/presentation/components/EventOverlay.tsx`
