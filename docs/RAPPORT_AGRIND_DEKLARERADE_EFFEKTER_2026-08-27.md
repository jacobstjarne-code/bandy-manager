# Rapport: A-GRIND — vad kostar det att göra `consequences[]` till deklarerade effekter?

2026-08-27. Report-only, ingen kod ändrad.

## Dagens skick

`FacilityConsequence` (`Community.ts:91-95`) är fri text:

```ts
export interface FacilityConsequence {
  dim: 'publik' | 'ekonomi' | 'ungdom' | 'sjal'
  dir: 'upp' | 'ned' | 'noll'
  label: string
}
```

`label` renderas (`FacilityTree.tsx`s `ConsekvensRad`) och splittas till gains/costs i valet-scenen (`valetScene.ts:150-151`) — det är ALLT. Ingenting läser `label` för att avgöra om effekten faktiskt ska hända. Det är strukturellt identiskt med `contentContract.ts`s problem innan O11: en fri textrad som PÅSTÅR en koppling utan att någon typ tvingar fram att kopplingen finns.

## Vad `contentContract.ts` faktiskt kostade — den enda jämförbara datapunkten i kodbasen

- `contentContract.ts`: 324 rader (95 rader × 6 fält)
- `content-contract-guard.ts` (ratchet, samma mönster som `ds-guard.mjs`): 55 rader
- `contentContract.test.ts`: 128 rader
- **Totalt: ~507 rader för skelettet.** Men skelettet är INTE samma sak som färdig täckning — efter flera sessioner är fortfarande bara 9/95 rader `filled: true`. Domens egen text: "Att fylla i alla 96 korrekt kräver att varje källa läses individuellt — inte något att gissa sig igenom." Skelettet tvingar fram en rad per typ (TS-kompileringstid, `AssertNoMissingIds`); det GÖR INTE jobbet att avgöra om påståendet är sant.

## Facilitetsnodernas motsvarande siffra

9 vanliga noder (matchhall är kall avfart, egen väg) × 2-3 icke-kostnads-consequences vardera ≈ **20 claims**, mot 95 i contentContract — ungefär en femtedel i radantal.

Av dessa 20, efter denna sessions rättningar (kiosk wirad, stralkastare/matchhall/gym rättade per dom):
- **Redan BACKADE via en riktig mekanism** (capacityBonus→arenaCapacity, kioskens sqrt-bonus): ~4
- **Sanna av konstruktion, ingen mekanik behövs** (kvällsträning möjlig efter belysning, bandy året om i en inomhushall — fysiska fakta, inte spelmekaniska påståenden): ~5
- **Undantagna per påståendekartans egen definition** (framtid/tillståndsvisning — akademi_2/3:s "i framtiden"-rader): ~4
- **Ren atmosfär, ingen backning krävs** (sjal-dimension utan specifik utfallssiffra): ~5
- **KVAR, olöst:** traningshalls "Ungdomarna väljer att stanna" — påstår en retentionseffekt, ingen sådan mekanik finns. Samma klass som stralkastare/gym var innan din dom — väntar på samma typ av beslut (wira eller stryk).

Så till skillnad från `contentContract` (95 rader, i praktiken outforskat territorium) är facilitetsnodernas verkliga innehåll REDAN kartlagt av det här passet. Kvar är en (1) olöst claim, inte tjugo.

## Kostnadsestimat för själva SKELETTET (schema + grind, inte innehållsutredningen — den är redan gjord)

Given ovanstående är redan-utrett, återstår bara den mekaniska delen:

1. **Ny typ** — ersätt `label: string` med en diskriminerad union, t.ex.:
   ```ts
   type FacilityEffect =
     | { kind: 'flavor' }                                    // atmosfär, ingen backning krävs
     | { kind: 'trueByConstruction' }                          // sant per definition (inomhushall→året-runt-träning)
     | { kind: 'mechanical'; hook: string }                    // pekar på en verifierbar kodplats
   ```
   ~30-50 rader, `Community.ts`.

2. **Migrera de 9 nodernas ~20 claims** till den nya formen — mekaniskt arbete nu när utredningen redan finns, ~1-2 timmar, ~100 rader diff i `facilityNodes.ts`.

3. **Grind** (samma mönster som `ds-guard.mjs`/`content-contract-guard.ts`): för varje `kind:'mechanical'` — verifiera att `hook`-strängen pekar på en funktion/konstant som faktiskt existerar (kan göras som en enkel `grep`-baserad koll, likt `forbudslistan.ts`, inte en fullständig typkontroll av att hooken GÖR rätt sak — det senare är bortom vad en grind rimligen kan avgöra automatiskt). ~60-80 rader + test.

**Totalt skelett: ~200-260 rader.** Ungefär hälften av `contentContract`s skelett i absoluta tal, proportionerligt mindre än en femtedel eftersom facilitetsnodernas verkliga innehåll redan är utrett (contentContract har 86/95 rader kvar att ens LÄSA).

## Vad grinden INTE löser

Precis som `content-contract-guard.ts` bara verifierar att en rad FINNS (inte att den är sanningsenlig), skulle en `consequences[]`-grind bara verifiera att en deklarerad `hook` PEKAR på något som existerar — inte att koden faktiskt gör vad labeltexten påstår. Den sortens verifiering (matchar "+400 platser" verkligen `capacityBonus:400`?) gjordes manuellt i det här passet och måste göras manuellt igen för varje ny nod. Grinden fångar framtida REGRESSION (en hook som pekar på något som raderats), inte framtida FELAKTIGA påståenden vid skapandet.

## Slutsats

Skelettet är billigt (~200-260 rader, en session). Det dyra arbetet — avgöra per claim om den är backad, sann-av-konstruktion, eller påhitt — är redan gjort för 19 av 20 claims i det här passet. En (traningshall) väntar på din dom, samma mönster som de tre du redan gav.

**Ägare: Jacob.** Bygg skelettet nu, eller vänta tills traningshall-domen finns så migreringen kan göras i ett svep istf två?
