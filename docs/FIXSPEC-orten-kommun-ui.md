# FIXSPEC: Orten, kommun, mecenater, faciliteter & UI-buggar

## Status: Redo för Claude Code
Berör >5 filer, kräver npm run build && npm test-iteration.

---

## 1. STRAFFAR i MatchLiveScreen (live-visning under match)

**Prioritet: HÖGST — spelarupplevelsen bryts**

### Bakgrund
Under pågående live-match: om förlängning slutar oavgjort ska straffar spelas. Straffomgångarna visas INTE i live-flödet (feed). Funktionaliteten finns i matchStepByStep.ts (steps med `phase: 'penalties'`, `penaltyRound`-data) men renderas inte i live-feedet.

MatchDoneOverlay och MatchResultScreen fixades redan (deriverar penaltyResult från steps). Men under SJÄLVA matchen syns inte straffarna.

### Verifiera
1. `matchStepByStep.ts` — genereras MatchSteps med `phase: 'penalties'`? Har de `penaltyRound`-data?
2. `MatchLiveScreen.tsx` — renderas penalty-steps i feed? Sök efter `penaltyRound` i renderingsloopen.
3. Om inte: lägg till rendering av straffomgångar (hemma vs borta, mål/miss, löpande totalställning)

### Förväntad rendering
Varje straffomgång bör visa:
- Minut (t.ex. "str. 1")
- Hemma: ✅ Mål / ❌ Miss med spelarnamn
- Borta: ✅ Mål / ❌ Miss med spelarnamn
- Löpande ställning (t.ex. "Straffar: 2–1")

### Filer
- `src/domain/services/matchStepByStep.ts` — granska output
- `src/presentation/screens/MatchLiveScreen.tsx` — feed-rendering

---

## 2. UTVISNINGAR — lagsida i nyckelmoment

### Bakgrund
MatchResultScreen visar utvisningar i "Nyckelmoment" men det är oklart om händelsen placeras visuellt på rätt sida.

### Verifiera
1. `matchEngine.ts` / `matchStepByStep.ts` — sätts `clubId` på RedCard-events?
2. MatchResultScreen: `isHome = e.clubId === fixture.homeClubId` → `textAlign: isHome ? 'left' : 'right'`
3. Om `clubId` sätts korrekt: verifiera rendering visuellt
4. Om inte: fixa i match engine

### Filer
- `src/domain/services/matchEngine.ts`
- `src/domain/services/matchStepByStep.ts`
- `src/presentation/screens/MatchResultScreen.tsx`

---

## 3. MECENATER — konsolidering av systemen

### Bakgrund
Tre separata system för ekonomiskt stöd:
1. **`game.mecenater`** (KlubbTab "Mecenater") — fullt system med mecenatService.ts
2. **`game.patron`** (EkonomiTab "Övriga intäkter") — enklare patron-system
3. **`game.localPolitician`** (KlubbTab "Kommun") — kommunbidrag

### Problemen
- "Patron" och "Mecenat" är samma koncept men separata system
- Patronen visas i Ekonomi men bor konceptuellt i Orten
- Mecenaterna syns inte i Ekonomi-tabben (deras bidrag)
- Terminologi: "Patron" vs "Mecenat" — ska heta "Mecenat" överallt

### Lösning
- **Orten (KlubbTab)** = hemmet för mecenater OCH kommun. Fullständig info här.
- **Ekonomi (EkonomiTab)** = visar ekonomiskt avtryck (bidrag/säsong, kommunbidrag) med hänvisning "Se Orten"
- Konsolidera terminologi: "Mecenat" på alla ställen (inte "Patron")
- Mecenater och Kommun-sektionerna ska ha samma typografiska upplägg:
  - Namn: 13px fontWeight 600
  - Undertext: 11px text-muted
  - Relation/happiness-indikator med färgkodning
  - Aktionsknappar med samma stil

### Filer
- `src/presentation/components/club/KlubbTab.tsx`
- `src/presentation/components/club/EkonomiTab.tsx`
- Ev. SaveGame.ts om patron → mecenat-migration

---

## 4. FACILITETER — konsolidering och hem

### Bakgrund
Faciliteter visas på TRE ställen:
- **KlubbTab** ("Orten"): "🏟️ Faciliteter" (anläggningar, ungdomskvalitet, rekrytering, utveckling) + "🏗️ Anläggning" (facility projects)
- **AkademiTab**: "🏫 Akademinivå" med uppgraderingsknapp + `upgradeFacilities`

### Problem
- Faciliteter "bor" inte tydligt någonstans
- Uppgraderingsalternativ är utspridda
- "Anläggning" och "Faciliteter" i KlubbTab är separata sektioner som bör vara en

### Lösning
- **Orten (KlubbTab)** är hemmet. Slå ihop "🏟️ Faciliteter" och "🏗️ Anläggning" till EN sektion
- Visa uppgraderingsalternativ (anläggning, akademi-uppgradering, ev. ismaskin/ljus/kiosk etc.)
- Akademiuppgradering speglas i AkademiTab (knappen finns kvar där)
- Övriga facilities-data (youth quality etc.) visas primärt under Orten, sekundärt under Akademi

### Filer
- `src/presentation/components/club/KlubbTab.tsx`
- `src/presentation/components/club/AkademiTab.tsx`
- Ev. `src/domain/services/facilityService.ts`

---

## 5. POLITIKER — fullständig implementation

### Bakgrund
Det finns en rudimentär implementation i gameStore (`interactWithPolitician`) med tre knappar:
- Bjud in till match
- Presentera budget
- Ansök om bidrag

Grundlogiken fungerar men saknar djup: agenda-bonusar, matchresultat-koppling, bättre feedback.

Se även `docs/FEATURE_ORTENS_MAKTSPEL.md` för eventuell befintlig spec.

### Förbättringar
- **Bjud in**: koppla till matchresultat via pending follow-up (vinst → extra relationsboost)
- **Bjud in**: agendabonus (prestige + topp 4 = +3, youth + bandyskola = +2)
- **Presentera budget**: differentiera reaktion baserat på ekonomins faktiska siffror
- **Ansök om bidrag**: bidragsstorlek beroende på relation, agenda-match, communityStanding
- Bättre UX: visa cooldown-status direkt på knappen, inte bara som felmeddelande
- Relation-barometer synlig (StatBar-komponent)

### Filer
- `src/presentation/store/gameStore.ts` — utöka `interactWithPolitician`
- `src/presentation/components/club/KlubbTab.tsx` — UI-förbättringar
- `src/domain/services/politicianService.ts` — flytta beräkningslogik hit

---

## Prioritetsordning

1. **Straffar live-visning** (#1) — spelarupplevelsen bryts
2. **Utvisningar lagsida** (#2) — enkelt att verifiera/fixa
3. **Mecenater konsolidering** (#3) — designbeslut + refaktor
4. **Faciliteter konsolidering** (#4) — strukturell omorganisering
5. **Politiker fullständig** (#5) — mest arbete, redan fungerande grund
