# CODE-ORDER — Hall-prövningen: böj tillbaka till 06-12-modellen

**Datum:** 2026-06-19
**Från:** Opus
**Ersätter:** `CODE_UPPDRAG_KOMMUNFORMEL_2026-06-19.md` (MOOT — se §X nedan) + min `SPEC_HALLPROVNING_2026-06-19.md` (ÖVERSPELAD).
**Gällande design:** `SPEC_MATCHHALL_PROVNING_2026-06-12.md` (mekanik) + `TEXTPOOLER_PROVNING_2026-06-12.md` (text, integrera ordagrant) + mock `docs/incoming/2026-06-12_design_provning_processteg (1).html` (UI).

---

## Varför
Dagens `hallProcessService.ts` (commit-kedjan `c3aae6b2`→`3d7d8389`) byggde en parallell modell mot en spec som inte kände till 06-12-triaden: tre stöd-axlar istället för en, diskreta event istället för en stage-hub, påhittad kravMultiplikator istället för finansieringsvägar, och INGEN Själ-pris-wiring (hela poängen med hallen). 06-12-designen är grundad (stödformel ur klackMood+puls), återanvänder befintliga mönster, och har färdig text. Vi böjer maskinen dit.

**Detta är ett OMARBETE, inte greenfield.** Filen `hallProcessService.ts` och `FacilityState`-tillståndet behålls som struktur; det är formen + innehållet som ändras.

## Vad som ÅTERANVÄNDS från dagens bygge (rör ej)
- `canStartBuild`-grindens PLATS (isHall-grenen) — bara villkoret ändras (se §6).
- Analysen att `hallDebateService` + hall-delen av `hallDebateEvents` ersätts (annandagsbandyn orörd) — den håller, fortsätt.
- Att tillståndet bor på `FacilityState` — håller, men formen ändras (§0).

## Vad som RIVS från dagens bygge
- De tre stötta-fälten (`klackStotta`/`styrelseStotta`/`kommunStotta`) → EN `support`.
- `calcMaxKommunAndel` + hela `buildKommunEvent`-andelslogiken (commit `3d7d8389`) — ingen andel-av-kostnad i 06-12-modellen. Bra hantverk, fel grund. Tas bort.
- `kravMultiplikator` (×1.0/1.2/1.4) — ersätts av finansieringsvägarnas fasta kostnader (§4).
- Min fas-text från idag (krav/kommun/retry-labels inline) — överspelad av TEXTPOOLER, integrera den ordagrant istället.

---

## §0 Tillståndet → `HallTrial` (SPEC_MATCHHALL_PROVNING §0)
Ersätt `FacilityState.hallProcess` med:
```ts
interface HallTrial {
  stage: 'vilande' | 'forankring' | 'krav' | 'forhandling' | 'bygge' | 'klar' | 'nedlagd'
  support?: number              // 0–100, bara under forankring
  kravStatus?: { kapital: boolean; underlag: boolean; styrelse: boolean }
  startedSeason: number
  stageStartedRound: number
  cooldownUntilSeason?: number
  finansiering?: 'egen' | 'kommun' | 'patron'
}
```
(optional på FacilityState, ingen migration; undefined = vilande.)

## §1 Förankring (SPEC §1 + TEXTPOOLER §B)
- **Stödformel (startvärde):** `clamp(40 + (klackMood−50)*0.4 + (puls−50)*0.3, 15, 70)`. Grundad, inte godtycklig.
- **Tre decisions** ur `PROVNING_DECISIONS_FORANKRING` (TEXTPOOLER §B, integrera ordagrant): medlemsmotet (omg+3), birger_mote (omg+6), enkaten (omg+8). Deltas i SPEC §1 (lyssna +8/övertyga +14|−10 60/40-vägt mot klackMood; ta mötet +6/skjut −8; öppenhet +5/ligg lågt 0 men −5 om stöd<45).
- **Passiv matchpåverkan:** derbyseger +3, derbyförlust −3, tre raka förluster −5.
- **Avslut (stageStartedRound+10):** ≥60 → krav · 40–59 → bordlagt (återuppta nästa säsong, startvärde −5) · <40 → faller (cooldown 2 säsonger). Resolution-copy ur `PROVNING_RESOLUTION`.
- **Avbryt själv:** alltid, liten klackMood-vinst, cooldown 1 säsong (`nedlagd_egen`).

## §2 Krav (SPEC §2) — ingen scen, checklist i hub
Tre krav gröna samtidigt: kapital (kassa ≥1200 tkr ELLER patron-borgen), underlag (publiksnitt ≥ 3-säsongssnitt × 1,1), styrelsebeslut (ja om senaste måluppfyllelse ≥50%). Uppfyllda → förhandling. Checklist renderas i hubben (mock: `.krav`-blocket, tre gröna dots). **Publiksnittskravet = ×1,1 (+10%), inte +12%** (mock-`(1)` K2).

## §3 Förhandling (SPEC §3 + TEXTPOOLER §C)
- **Röst:** kommunalrådet via politicianData (porträttlös cold-voice). Odds ur befintlig kommunrelation (portal-eskaleringens värde). **Ingen maxKommunAndel-formel.**
- **Två decisions** ur `PROVNING_DECISIONS_FORHANDLING` (ordagrant): kommunens_villkor (ungdomstimmar / delad drift), patronens_erbjudande (borgen / tacka nej). `{patron}`/`{politician.name} ({politician.party})` interpoleras — ALDRIG hårdkodat namn (mock K1, F2-fällan).
- **Utfall:** JA med villkor / NEJ (cooldown 2, kräver bättre relation) / JA-via-patron. Avbryt här: kommunrelation −.

## §4 Bygget (SPEC §4)
Tar byggsloten (preseason visar "Matchhallen byggs — kassan är låst"). Ett fördyrings-event vid halvtid (25% risk) ur `PROVNING_EVENT_FORDYRING`. Kan ej avbrytas efter spadtaget.

**⚠️ RECONCILE-KOSTNAD (Opus glosade detta, Jacob/playtest avgör — Code får INTE gissa):** noden `matchhall` har `cost: 1_800_000` (1,8 mkr). 06-12-specens §4 har absoluta tal −2800 egen / −1600 kommun / −900 patron — de ÄR FÖRÅLDRADE (skrevs före noden byggdes; 2,8 mkr > nodens 1,8 mkr går inte ihop som netto). **Trolig korrekt läsning:** nodens 1,8 mkr = grundkostnad (sanning), finansieringsvägen drar NER klubbens netto därifrån (egen = full 1,8 mkr; kommun täcker sin andel; patron täcker sin). Använd INTE 06-12:s 2800-tal. Men lås inte de exakta andelarna i kod — flagga för Jacob vid implementering, balanseras mot ekonomimodellen + Eriks playtest.

## §5 Hallen klar — SJÄL-PRISET (SPEC §5 + TEXTPOOLER §D) — DEN STORA SAKNADE BITEN
När `stage === 'klar'`: byt utomhus-atmosfärpoolen mot `HALL_ATMOSPHERE` i matchCommentary för HEMMAMATCHER (bortamatcher på utomhusvallar behåller utomhuspoolen — växeln sitter på hemma + klar). Plus `HALL_KLACK_BASE` post-hall. Ekonomi ↑ (åretrunt + väderoberoende), Ungdom ↑ (akademibonus), Publik byter karaktär (golv upp, tak ned, netto ur klackMood vid invigning). **Det här är konsekvensen — texten ÄR priset, ingen mätare.** Min 06-19-modell hoppade över detta helt.

## §6 Grind + ambient + nod-subs
- `canStartBuild` isHall-gren: öppen när `hallTrial.stage` nått bygge/klar (ersätt dagens `phase === 'godkand'`).
- **Ambient (TEXTPOOLER §A):** `PROVNING_AMBIENT` matas in i kafferum/klack per stage (seedat på matchday, som KLACK_ECHO).
- **Nod-subs (TEXTPOOLER §E):** `HALLNODE_SUBS` på trädnoden per stage; stödmätarlägen `STOD_LABELS` (low/mid/high).

## §X kommun-formel-ordern är MOOT
`CODE_UPPDRAG_KOMMUNFORMEL_2026-06-19.md` opererade på `buildKommunEvent`/`maxKommunAndel` som rivs här. Bygg INTE den. `calcMaxKommunAndel` (commit `3d7d8389`) tas bort i detta omarbete.

## Gate
build + test + lint:design. Eftersom detta river funktioner andra ev. importerar: verifiera anropssiter (eventProcessor/roundProcessor/communityProcessor) före rivning. Rapportera commit + vilka gamla tester som ersattes.
