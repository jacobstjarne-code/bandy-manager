# TEXTLEVERANS — begriplighetsklass C, subtitlar (Opus 2026-09-15)

Svarar mot `begriplighet-klass-c-kandidatlista` (MASTER) + patron-subtiteln ur `genomgang`-domen. Code wire:ar subtitle-fältet och sätter strängarna; Opus äger orden. Alla skrivna mot de VERKLIGA effekterna (kodlästa i `eventResolver.ts` respektive `patronWithdrawalService.ts`), inte mot auditens sammanfattning — auditen var delvis inaktuell (system har inte längre −2 moral, den togs bort i O2-domen).

**Princip:** subtiteln antyder KONSEKVENSKLASSEN, aldrig siffran. Spelaren ska veta vilken sorts sak som står på spel, inte exakt hur mycket. Bandysvensk understatement, ingen AI-ton, ingen utropston.

## 1. csPress fyra val (`CS_PRESS_CHOICE_BUTTONS` → behöver ett subtitle-syskon)

Code: `CS_PRESS_CHOICE_BUTTONS` är idag `Record<PressChoice, string>` (bara label). Lägg ett parallellt `CS_PRESS_CHOICE_SUBTITLES: Record<PressChoice, string>` och rendera det under label. Verkliga effekter (eventResolver.ts): individual = +5 spelaren, +3 journalist, 18% risk en slumpad lagkamrat −4 moral; team = hela truppen +2, riskfritt; system = +4 journalist, riskfritt; silent = −2 journalist, kan göra henne provocative under 30.

- **individual** (`Han har varit avgörande`)
  subtitle: `Lyfter honom — men någon annan i laget kan ta illa upp.`

- **team** (`Hela laget försvarar`)
  subtitle: `Sprider äran. Ingen sticker ut, ingen tar illa upp.`

- **system** (`Det är systemet`)
  subtitle: `Bygger förtroendet hos pressen. Ingen spelare berörs.`

- **silent** (`Ingen kommentar`)
  subtitle: `Journalisten noterar tystnaden. Relationen kyls.`

Not: individual-subtiteln namnger inte lagkamraten ("någon annan"), eftersom effekten träffar en SLUMPAD spelare — texten får inte låtsas veta vem. Det var auditens delfynd: en risk mot någon spelaren inte kan identifiera, nu ärligt formulerad.

## 2. Patron `apologize` (`patronEvents.ts`)

Code verifierade att koden är RÄTT — effekten rör `goodwill` (som fältets egen semantik och eventets triggervillkor kräver), inte `happiness`. Det var subtiteln som lovade fel mätare. Ny subtitle mot rätt mätare:

- **apologize**
  subtitle: `Återställer förtroendet — men ber om ursäkt gör det inte ogjort.`

Byter "gläder patronen" (happiness, fel) mot förtroende (goodwill, rätt). Ingen kodändring — bara subtitelsträngen.

## 3. arc peak-events (`back_him` / `back_joker`, arcService.ts)

Verkliga effekter: `back_him` döljer permanent `developmentRateDelta −4`; `back_joker` döljer `disciplineDelta −4` (ökar avstängningsrisk). Subtitlarna ska visa baksidan utan siffra:

- **back_him** (backa den hungrige)
  subtitle: `Ett tydligt förtroende nu. Det kan kosta i utvecklingen framåt.`

- **back_joker** (backa jokern)
  subtitle: `Håller honom nöjd — men han spelar närmare gränsen.`

## 4. economicStress "vänta" (`eventFactories.ts`)

Verklig effekt: hela truppens moral −2, osynligt. Subtitle:

- **wait / vänta**
  subtitle: `Ingen åtgärd nu. Osäkerheten sätter sig i laget.`

## Leverans till Code

Dessa fyra grupper wire:as som subtitle-strängar. Ingen berättande omskrivning, ingen ordningsändring, ingen mekanik rörd. När de är satta: stäng `begriplighet-klass-c-kandidatlista` (flytta till ARKIV), och patron-delen av `genomgang`-raden.
