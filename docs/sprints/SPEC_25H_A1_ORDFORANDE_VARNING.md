# Sprint 25h A1 — Ordförande-varning vid köpbekräftelse

**Status:** UI-SPEC TILL CODE
**Estimat:** 2-3h
**Förutsätter:** Lager 2A backend (eventProcessor wage tracking) — KLAR

---

## SYFTE

Ge spelaren en *förvarning* från ordföranden FÖRE de bekräftar ett köp
som överskrider lönebudgeten. Backend-trackingen av löneöverskridanden
finns redan i Lager 2A — det här är UI-lagret som varnar i förväg så
spelaren förstår konsekvensen *innan* de klickar "köp".

Designprincip: Inte hindra spelaren, inte gråmaska köpknappen. Bara
visa varningen och låta dem välja informerat.

---

## TEKNISK ÄNDRING

### TransferScreen.tsx + ContractScreen.tsx

När spelaren initierar ett köp eller en kontraktsförlängning som skulle
*ta klubben över wageBudget*, visa en varning innan bekräftelse.

**Beräkning:**

```typescript
const totalSalaryAfter = currentManagedSalary + newPlayerSalary
const weeklyWageEquivalentAfter = Math.round(totalSalaryAfter / 4)
const wouldExceedBudget = weeklyWageEquivalentAfter > managedClub.wageBudget
const overrunPct = wouldExceedBudget
  ? Math.round(((weeklyWageEquivalentAfter - managedClub.wageBudget) / managedClub.wageBudget) * 100)
  : 0
```

För kontrakt: `currentManagedSalary` ska räknas *exklusive* spelarens
nuvarande lön (eftersom den ersätts med nya lönen).

För köp: `currentManagedSalary` är total nuvarande, plus den nya spelarens
lön läggs till.

### UI

Innan bekräftelse-knappen visas en av tre varianter beroende på
överskridande:

**Variant 1: Lätt överskridande (1-15%)**

```
⚠️ Ordföranden vill prata
"Det här går nära kanten. Vi kommer att överskrida budgeten med ~12% om
du gör det här. Hanterbart en kort tid, men inte hela säsongen."
[Avbryt] [Bekräfta köp]
```

**Variant 2: Märkbart överskridande (16-30%)**

```
⚠️ Ordföranden är orolig
"Det här går inte ihop. Lönelistan tål inte ett till. Om du gör det här
blir det ett samtal med Licensnämnden om ett halvår."
[Avbryt] [Bekräfta köp ändå]
```

**Variant 3: Allvarligt överskridande (>30%)**

```
🚨 Ordföranden vädjar
"Du är tränaren och du fattar besluten. Men jag måste säga det här: om
vi går över budget en gång till kommer styrelsen att kräva en plan.
Och planen kommer att kosta dig spelare."
[Avbryt] [Bekräfta köp ändå]
```

### Texter (välj en av 3 per variant baserat på season-seed)

**Variant 1 (lätt):**
1. "Det här går nära kanten. Vi kommer att överskrida budgeten med ~{PCT}% om du gör det här. Hanterbart en kort tid, men inte hela säsongen."
2. "Vi tar oss en titt till på siffrorna. Du är ~{PCT}% över budget med det här köpet. Det går — men det måste finnas en plan för andra halvan av säsongen."
3. "Det är ett bra namn du fått tag i. Men budgeten klarar inte ~{PCT}% överskridande hela året. Tänk på det."

**Variant 2 (märkbart):**
1. "Det här går inte ihop. Lönelistan tål inte ett till. Om du gör det här blir det ett samtal med Licensnämnden om ett halvår."
2. "Jag har varit ordförande i tolv år. Det jag säger nu säger jag av erfarenhet, inte av tradition: vi har inte täckning. Tänk om."
3. "Du är tränaren och du fattar besluten. Men jag måste säga det här: om vi går över budget en gång till kommer styrelsen att kräva en plan."

**Variant 3 (allvarligt):**
1. "Det här är inte en varning, det är en vädjan. ~{PCT}% över budget är inte hanterbart. Det blir poängavdrag, inte om — utan när."
2. "Jag tänker säga ja till slut, för det är ditt beslut. Men jag säger ja motvilligt och jag vill att du skriver under på att du är medveten om konsekvenserna."
3. "Som ordförande har jag ett ansvar för klubbens långsiktighet. Det här köpet hotar den. Tänk noga."

### Token

`{PCT}` ersätts med `overrunPct`-värdet vid render.

---

## KOMPONENT

Skapa `<WageOverrunWarning>`-komponent (eventuellt i
`src/components/transfer/`):

```tsx
interface WageOverrunWarningProps {
  overrunPct: number
  seasonSeed: number  // för texturval
  onCancel: () => void
  onConfirm: () => void
}
```

Komponenten:
1. Beräknar variant baserat på overrunPct (lätt/märkbart/allvarligt)
2. Plockar text-variant baserat på seasonSeed
3. Renderar varningstext + två knappar
4. Stylas som befintlig modal/panel-design

---

## ANVÄNDNING

I TransferScreen och ContractScreen:

```tsx
const [showWageWarning, setShowWageWarning] = useState(false)

const handleBuyAttempt = () => {
  if (wouldExceedBudget) {
    setShowWageWarning(true)
  } else {
    confirmPurchase()
  }
}

return (
  <>
    {/* befintlig UI */}
    <button onClick={handleBuyAttempt}>Köp</button>

    {showWageWarning && (
      <WageOverrunWarning
        overrunPct={overrunPct}
        seasonSeed={game.currentSeason}
        onCancel={() => setShowWageWarning(false)}
        onConfirm={() => {
          setShowWageWarning(false)
          confirmPurchase()
        }}
      />
    )}
  </>
)
```

---

## VERIFIERING

**Manuell:**
1. Skapa scenario där managed club är 5% under wageBudget
2. Försök köpa spelare som tippar dig 10% över → variant 1 visas
3. Försök köpa spelare som tippar dig 25% över → variant 2 visas
4. Försök köpa spelare som tippar dig 40% över → variant 3 visas
5. Verifiera att "Avbryt" tar dig tillbaka utan köp
6. Verifiera att "Bekräfta köp" går igenom som vanligt

**Test:**
- Inget nytt unit-test krävs — UI-rendering testas via befintliga
  TransferScreen-tester om de finns. Annars manuell verifiering.

---

## VAD SOM INTE INGÅR

- **Hindrande av köp.** Spelaren ska alltid kunna gå vidare. Varningen
  är informationsöverföring, inte gatekeeping.
- **Disabled-state på köpknappen.** Inte heller. Bara modal-varning.
- **Push till mobil.** Bara skärm-varning.
- **Spara historik över ignorerade varningar.** Trackingen av
  överskridande sker per omgång i Lager 2A — inte per köpbeslut.

---

## COMMIT

```
feat: ordförande-varning vid lönebudget-överskridande (Sprint 25h A1)

Ger spelaren förvarning före köpbekräftelse om köpet skulle ta klubben
över wageBudget. Tre varianter (lätt/märkbart/allvarligt) baserat på
överskridande-procent. Hindrar inte köpet — bara informerar.

Komponent: <WageOverrunWarning>. Används i TransferScreen och
ContractScreen.

Tester: 1895/1895 (inga nya unit-tester, manuell UI-verifiering).
```
