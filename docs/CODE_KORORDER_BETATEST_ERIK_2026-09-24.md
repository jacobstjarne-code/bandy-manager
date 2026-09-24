# KÖRORDER — betatest Erik, 2026-09-24

## Mål

Åtgärda de kod- och textproblem som Eriks första hela genomspelning visade. Gör
små, separata commits. Ändra inte navigationslayouten eller kafferummets visuella
layout; Codex tar de delarna och browserverifierar även denna leverans.

Arbeta från senaste `main`. Bevara allt befintligt ocommittat arbete som inte hör
till ordern. Kör relevanta riktade tester per punkt och hela sviten efter rebase
mot dåvarande HEAD.

## A. Direkta fixar

### A1. Bandytermen: spola, aldrig sopa

Gör en fullständig sökning i all spelarvänd copy. När texten beskriver skötsel av
isen eller banan ska `sopa banan` och böjningar av samma uttryck ersättas med
`spola banan`/korrekt böjning av `spola`. Byt inte metaforiska eller orelaterade
förekomster av ordet *sopa* blint.

Lägg en liten textguard som misslyckas om den felaktiga is-termen återkommer i
spelarvänd kod. Historiska dokument och fixtures som uttryckligen provar gammal
save-migrering får undantas.

### A2. Spelarvärden ska visas som heltal

Efter några omgångar visas form och totalvärde med många decimaler. Hitta alla
spelarvända ytor där de värdena presenteras och använd en gemensam formatterare
som avrundar till heltal. Runda endast i presentationslagret; ändra inte sparad
precision, beräkningar eller matchmotor.

Testa minst positiva decimaler, `.5`, noll och ett värde som förändrats över
flera omgångar. Ingen UI-sträng för form eller total får innehålla decimalpunkt
eller decimalkomma.

### A3. Kvitto efter genomförd spelaraffär

När ett köp eller en försäljning faktiskt har genomförts ska spelaren omedelbart
få en tydlig engångsnotis via spelets befintliga notis/toast-system. Inte vid
listning, bud eller kontraktsförslag.

Notisen ska innehålla:

- köp: spelarnamn, klubb in och slutlig kostnad;
- försäljning: spelarnamn, klubb ut och slutlig intäkt.

Den får inte dubbleras vid reload eller återöppnad vy. Testa också att spelaren
efter genomförd affär finns i exakt rätt trupp och inte ligger kvar i den gamla.

### A4. Orten i säsongssummeringen

Nu skrivs varje liten rörelse ut med samma följdfras, exempelvis elva meningar
med `det märks på läktaren först`. Ersätt händelselistan med en faktarad byggd
från säsongens verkliga värden:

`Orten: 50 → 69 under säsongen. Lägst 46, högst 71.`

Använd riktiga start-, slut-, min- och maxvärden och hantera oförändrat värde
utan att påstå att orten vänt eller dragit sig undan. En rad, ingen upprepning.
Testa Eriks exempel samt en helt oförändrad säsong.

## B. Rotorsaksutredning före motorändring

### B1. Hörn- och straffval försvinner i långa perioder

Reproducera över minst en hel säsong med deterministiska seeds. Logga per managed
match om hörn-/straffinteraktionen var möjlig, vilken grind som avgjorde det och
om användaren redan hade förbrukat något dedupe-/once-state. Mönstret som ska
förklaras är: valen finns i början, försvinner efter några matcher, återkommer
efter halva säsongen och försvinner igen.

Kontrollera särskilt att säsongs-/halvsäsongsnycklar, match-ID, cup/serie och
snabb-/liveläge inte delar felaktigt dedupe-state. Fixa rotorsaken och lägg en
invariant som visar att en gammal interaktion inte kan spärra en senare giltig
match. Lägg inte in en UI-workaround eller högre slumpchans för att maskera felet.

### B2. Straffprocenten måste vara sann

Spåra den visade procenten till samma sanningskälla som det faktiska utfallet.
Mät visad sannolikhet mot utfall över många seeds, separat för relevanta
skytt-/målvaktsnivåer. Avgör om felet är formattering, fel spelare, annan formel
i UI än i motorn eller en felkalibrerad motor.

Om UI och motor skiljer sig: gör dem identiska och testa det. Om de redan är
identiska: rapportera fördelningen innan någon kalibrering görs; ändra inte
procentsatsen på känsla.

### B3. Bänkspelare och flygande byten

Kartlägg först hur matchminuter, form, trötthet och statistik idag tilldelas
startelva respektive bänk. I bandy innebär uttagen bänk normal rotation, inte
noll minuter. Ta fram en minimal modell där utespelare på bänken får rimlig
speltid utan att summan av lagets spelade minuter eller matchhändelser blir
inkonsekvent. Målvakten behandlas separat.

Detta påverkar motor, utveckling och belastning. Leverera mätning + föreslagen
invariant innan en bred kalibrering. Om rotfelet bara är att bänken alltid får
exakt noll kan den mekaniska bokföringsfixen göras i egen commit, men rapportera
före/efter för form och fatigue över en säsong.

## C. Textsvep — rapport först

Gå igenom all spelarvänd text, inte bara enstaka riktade sökningar. Skapa
`docs/BETATEST_TEXTSVEP_2026-09-24.md` med en tabell/radlista:

1. fil och rad/nyckel;
2. nuvarande text;
3. klass;
4. varför den skaver;
5. konkret omskrivning;
6. om omskrivningen kräver mer data eller villkor i kod.

Minst dessa klasser ska sökas:

- fel bandyterminologi eller översatt managerspråk;
- AI-fyndighet: abstrakta paradoxer, symmetriska one-liners och saker som
  försöker låta kloka utan att säga något;
- bisatser och fragment som felaktigt står som egna meningar;
- mekaniska upprepningar inom samma vy, säsong eller händelsekedja;
- historik- och tillståndspåståenden som koden inte faktiskt har gatat;
- onaturliga rollord som `assistenten` när en människa skulle beskriva passningen
  eller använda personens namn;
- inkonsekvent bandyordlista, CTA-ton, versalisering och personnamn/efternamn.

Direktkorrigera bara entydiga stavfel, grammatikfel och A1. Övriga omskrivningar
ska vara kandidater tills Jacob har fällt textdom. För varje tillståndspåstående:
utred datan före ny copy; döp inte om ett sanningsfel till en snyggare mening.

## Leverans och grindar

- En commit för A1+A2, en för A3, en för A4, separata commits för varje fix i B.
- Textsvepsrapporten i egen commit; inga massomskrivningar i samma commit.
- Riktade tester ska visa rotorsaken, inte bara Eriks exempel.
- Hela sviten grön efter rebase mot senaste `main`.
- Rapportera exakt vad som inte gick att reproducera. Skriv inte `fixat` för B1–B3
  utan före/efter-mätning.
