# DOM (METOD) — LIGGARE-INVENTERINGEN: hur vi hittar de "förliggare"-systemen

**Datum:** 2026-09-02 · **Av:** Opus · **Utlöst av:** Jacob: "spelet byggdes i 9 månader UTAN liggaren; en massa system är skrivna utan den, alltså omoderna jämfört med hur systemet fungerar nu. Hur inventerar vi det?" · **Typ:** metoddom — definierar KRITERIET och METODEN så Codex kodrevision + Opus konsument-analys mäter SAMMA sak, inte divergerar.

## Problemet, exakt
`eventLedger` (kanon) byggdes 2026-09-01+. Allt före det lagrar sina "minnen" i egna fickor: `recentMoments` (var cap-5), `pendingRippleChains` (transient), `managerProfile.diary`, `storylines`, `clubMemory` (re-härleder ur 7 källor), `collectActiveMemories` (9 fält ad hoc), patron/licens/board-state, m.fl. Migrerade hittills: moments, ripple-chains, patron, seasonDecision, de fyra bågarna (burnout/årsbok/press/board). Resten är FÖRLIGGARE.

## KRITERIET — trestegs-testet per system (INTE binärt "använder liggaren")
För varje system som producerar ett "minne", fråga de fyra nivåerna (GPT:s modell + `MIGRATIONSPLAN`s Fas 4+-not):
1. **Skrivs** händelsen durabelt (till liggaren, inte en cappad/transient ficka)?
2. **Hittas** den av en konsument (läser någon den)?
3. **Refereras** den synligt (når spelaren)?
4. **Förändrar** den nästa beat (bågen biter — systemet VET vad som hänt förr)?

Ett **förliggare-system** gör 0 av dessa: lagrar i egen ficka, ingen läser ur kanon. Ett **modernt** gör 1–4. Mellanlägen (skriver men ingen läser; läser men egen ficka) är migrerings-kandidater.

## METODEN — tre svep, korsade

### Svep B (producent, Codex — mekaniskt, bottom-up)
Greppa varje ställe som skriver ett minne till EGEN state förbi liggaren: `recentMoments`-push, `*Log`/`*Memory`/`*History`-fält, `diary`-push, `storylines`-push, `clubMemory`-derivering, `collectActiveMemories`-fälten, patron/licens/board-state-skrivningar. För var och en: skriver den ALSÅ en `logEvent`/`EventLedgerEntry`? Ja → modern. Nej → förliggare-producent. Uttömmande katalog. **Codex styrka; ren greppning.**

### Svep A (konsument, Opus — omdöme, top-down)
För varje SPELARVÄND yta som borde läsa kanon — årsbok, karriärhistorik, press, styrelse, klubbkrönika, orsak/verkan, inbox, portal-beats — vilka händelser refererar den, och läser den dem ur `eventLedger` eller ur en egen ficka? Läser ficka → konsumenten är förliggare. **Opus lane; kräver "vad SKA läsa vad".**

### Korsningen (den prioriterade listan)
- Producent skriver ficka + en konsument läser fickan (inte kanon) → **MIGRERA.** Prioritet efter hur mycket konsumenten LIDER (årsboken led av patron → hög). Detta är listan som betyder något.
- Producent skriver ficka + INGEN konsument läser alls → **dött fält.** Radera-kandidat — MEN kanon-kollen först (patron-läxan: läs designdokument, det kan vara medveten struktur, inte skuld).
- Producent + konsument bägge på liggaren → **modernt, klart.**

## PRIORITETSREGELN — INTE massmigrering
Strangler (`MIGRATIONSPLAN`-invarianten): ett förliggare-system migreras när det ÄNDÅ rörs ELLER när en konsument faktiskt lider av att inte kunna läsa det. **Massmigrering av 9 månaders kod för renhetens skull är big-bang — förbjudet.** Inventeringen producerar en PRIORITERAD lista (vilken konsument lider mest), inte en "migrera allt"-order. Det mesta väntar tills det rörs. Kriteriet för att lyfta något till "gör nu": en spelarvänd yta minns i en ficka det borde minnas i kanon (samma klass som burnout/årsbok/patron).

## SKYDDAT
- **narrativeBeatLog migreras ALDRIG** (`DOM_LIGGARE_COOLDOWN_GRANS`): det är cooldown, inte kanon. En producent som skriver narrativeBeatLog är INTE en förliggare — den är rätt lager. Testet: skriver den en HÄNDELSE (→ borde vara kanon) eller en VISNING/timing (→ narrativeBeatLog, korrekt)?
- **Radera inget på "ser omodernt ut".** Patron såg ut som dubbel skuld, var låst design. Dött-fält-kandidater går genom kanon-koll (docs) före radering.
- **Ingen ny inventeringsfil som dubblerar öppna punkter.** `INVENTERING_2026-08-25/26/31` finns (FÖRE liggaren) — de katalogiserar öppna punkter, INTE förliggare-status. Denna inventering är en NY axel (liggare-modernitet), inte en omkörning av dem.

## ÄGARSKAP
Codex: svep B (producent-katalog) som del av huvudlist-kodrevisionen — greppa minnes-skrivare, flagga vilka som INTE skriver liggaren. Opus: svep A (konsument-analys) + korsningen + prioritetsordningen (vilken konsument lider). Resultatet: en prioriterad förliggare→liggare-lista, INTE en massmigrering. Jacob: inget beslut i metoden — men prioritetslistan blir hans (vilken båge/yta härnäst), samma som steg-2-3-kön.
