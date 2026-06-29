# SPEC — Generationsloopen: klubbens blodsband

**Datum:** 2026-06-22 · **Av:** Opus · **Till:** Code (dataspärr + mekanik + ceremoni-scen + vy) + Opus (copy)
**Status:** Spec-klar. Paketets killer-app #4. Störst retention. Ärver callback (#1) + delar `spine` med #2.
**Tesen:** Loopen sluts redan mekaniskt — pojken (youthIntake) → lärlingen (mentorships) → bäraren/kapten (narrativeLog) → legenden (clubLegends, ≥100 matcher) → som fostrar nästa. Motorn kör hela varvet. Spelaren ser fyra orelaterade händelser utspridda över åtta säsonger, aldrig cykeln. Designens uppgift: rita varvet. Det här är skälet att spela säsong åtta.

---

## ⚠️ DATASPÄRREN — kommer FÖRST (utan den finns ingen tråd)

Idag filtreras mentorskap på `isActive` → historiken tappas när ett mentorskap avslutas. Blodslinjen kräver att avslutade mentorskap MINNS:
```ts
interface MentorshipRecord {
  seniorPlayerId: string
  youthPlayerId: string
  startRound: number
  endSeason?: number
  outcome?: 'graduated' | 'ended'
}
// game.mentorshipHistory: MentorshipRecord[] — sluts aldrig, bara växer
```
Skriv en post när ett mentorskap STARTAR (i youthProcessor/mentorship-skapandet) och stäng den (`endSeason`/`outcome`) när det avslutas. **Detta är enda nya datan + måste byggas före blodslinje-vyn.** Allt annat är konsumtion.

---

## TRE GREPP

### 1. Avskedskapitlet — pensionen blir eftermäle, inte en rad
Idag fyrar pensionen som ett `RetirementDecisionSecondary`-kort + en rad i säsongssammanfattningen. `RetirementData` bär redan `farewell`, `bestMoment`, `careerStats`, `isLegend`. Lyft till en **ceremoni-scen** som fyrar när en legend (eller mångårig spelare) avgår — återanvänd ceremoni-chrome från slutspelsscenerna. Kallar tillbaka karriären (callback-principen): bestMoment + nyckelstats + farewell, och pekar framåt ("Fostrade Henriksson, 17 — som bär bindeln en dag", härlett ur `mentorshipHistory`). **Verifiera tröskeln:** legend = `isLegend`/`clubLegends`; "mångårig" = X säsonger i klubben (Code föreslår tröskel, Opus ratificerar — undvik att varje 34-åring får statsceremoni).

### 2. Blodslinjen — tråden genom åren, i Minne-fliken
Hjärtat. En vy i HistoryScreen/Minne som ritar mentor-kedjan över säsonger via **`spine`-komponenten (delad med #2)**: vem fostrade vem, vem bar bindeln, vem lever vidare som legend. Härledd ur `clubLegends` + `mentorshipHistory` (nytt) + `narrativeLog`. Varje namn länkar till sitt kort/avskedskapitel (tappbar i båda riktningar). Gruppera per position eller per tråd. Växer av sig själv ju fler säsonger — ytan som belönar långt spel.

### 3. Legend-callbacks — loopen talar
Nya `PORTAL_BEATS` (ärver callback-designen, rider beat-primitiven): lärling bär bindeln, lärling debuterar, legendens rekord närmar sig. Trigger läser `mentorshipHistory` + `clubLegends`/`isLegend`. Severity 0–1 (lugna minnen, som Callback-familjen). Opus-copy. Placering: callback-bandet i PORTAL_BEATS (under konsekvens, över generisk atmosfär — samma region som de andra callbacks). nonActionable.

**Kontinuiteten finns redan:** legender kostar lön, dyker upp i kafferummet (`coffeeRoomService` drar ur `clubLegends`), berättas om vid skolbesök (`schoolAssignmentService`), ger målbonus. Spelet behandlar dem redan som klubbens äldste — legend-callbacken säger det bara högt.

---

## BYGGORDNING (delar `spine` med #2)
Om #2 byggs först står `spine` redan klar → #4 återanvänder den props-drivna komponenten rakt av. Om #4 byggs först: bygg `spine` här (fristående, `src/presentation/components/shared/`) och #2 ärver. Bygg den INTE två gånger — kontrollera om komponenten finns innan ny skapas (Lesson: build-bakom-trädet).

---

## VERIFIERING
- Mentorskap startar → `mentorshipHistory`-post skapas; avslutas → `endSeason`/`outcome` sätts. Historiken växer, nollställs aldrig.
- Legend/mångårig spelare pensioneras → avskeds-ceremoni fyrar (ej en rad), läser farewell/bestMoment/careerStats, nämner lärlingen.
- Minne-fliken → blodslinje-vy ritar mentor-kedjan i `spine`, namn länkar i båda riktningar.
- Lärling bär bindeln/debuterar → legend-callback fyrar, severity 0–1, nonActionable.
- Spärren verifierad: ingen blodslinje utan `mentorshipHistory` (bygg den först).

## HANDOFF
Code, i ordning: (1) `mentorshipHistory` + `MentorshipRecord` — skriv vid start, stäng vid avslut (SPÄRR, först). (2) Avskeds-ceremoni-scen (återanvänd slutspels-chrome, läs RetirementData; föreslå mångårig-tröskel). (3) Blodslinje-vy i Minne via delad `spine` (kontrollera om #2 redan byggt den). (4) Legend-callbacks i PORTAL_BEATS. Rapportera mot verifieringen + föreslagen pensionströskel. Copy (avsked, blodslinje-text, callbacks) är Opus — skrivs när strukturen står.
