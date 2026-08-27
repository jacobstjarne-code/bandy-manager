# Rapport: ordningsbuggen i seasonEndProcessor.ts — vad den faktiskt gör

2026-08-25. Jacobs order: "Ordningsbuggen i seasonEndProcessor: rapportera vad den gör innan du fixar. Ett nytt fynd i den filen är värt att förstå, den har haft tre allvarliga buggar den här veckan." Ren utredning, inget fixat.

## Mekaniken

`seasonEndProcessor.ts` bygger klubbarray i två separata spår som slutar peka på OLIKA data:

**Spår 1 — `updatedClubs`** (rad 210, en kopia av `game.clubs`). Uppdateras genom filens första hälft: säsongsverdikt-rykte (rad 223-229), boardExpectation-stegning (rad 369-377), prispengar/patron/politikerbidrag (rad 265-306). Fryst efter det — inget mer skriver till den.

**Spår 2 — `clubsAfterLicense`** (rad 872, startar som `updatedClubs.map(...)` med pensionerings-/kontraktsutgångsfiltrering). Fortsätter sedan att uppdateras OBEROENDE av spår 1: tvångsnedflyttningens straff vid nekad licens (rad 889-897), AI-transfers (rad 1151: `clubsAfterLicense = aiTransferResult.updatedClubs`), truppkomplettering (rad 1226). **Det är `clubsAfterLicense`, inte `updatedClubs`, som faktiskt sparas för nästa säsong** (rad 1386: `clubs: clubsAfterLicense`).

Mellan dessa två punkter (rad 1252) byggs `seasonEndGameView = { ...game, clubs: updatedClubs }` — den vy `generateSeasonSummary`, `evaluateSeasonGoal`, `deriveSeasonPersonChange`, `deriveRivalryStanding` och `calculateClubEra` alla läser. Kommentaren precis ovanför (rad 1246-1251) förklarar en MEDVETEN design — att `game.players`/`standings`/`fixtures`/`facilityState` ska spegla den AVSLUTADE säsongen, inte nästa säsongs nollställning. Det är rätt tänkt för de fälten. Men `clubs: updatedClubs`-bytet i samma rad är INTE samma medvetna beslut — `updatedClubs` är specifikt "klubbarna FÖRE licenseffekter och AI-transfers", vilket är en annan, sannolikt oavsiktlig, föråldring.

## Vad som faktiskt diskriminerar — verifierat, inte antaget

Två separata skrivvägar finns bara i `clubsAfterLicense`:

1. **Nekad licens, hanterad klubb specifikt** (rad 889-897): `reputation -15`, tre slumpade spelare bortplockade ur `squadPlayerIds`. Träffar BARA `game.managedClubId`.
2. **AI-transfers** (rad 1143-1151, `processAITransfers`): flyttar `finances` och `squadPlayerIds` mellan klubbar. Funktionen tar emot `game.managedClubId` som parameter — läst kod bekräftar att den används för att UTESLUTA hanterad klubb ur AI-AI-transfermarknaden. Divergensen här träffar alltså bara de ELVA AI-klubbarna, aldrig den hanterade klubbens finances/squad.

## Träffar det något spelaren faktiskt ser i dag? Nej — verifierat, inte gissat.

Grep + läsning av samtliga fyra konsumenter av `seasonEndGameView`:

- **`generateSeasonSummary`** (`seasonSummaryService.ts`): läser `club.finances` (start/slutkassa-raden) och `club.boardExpectation` (dom-meningen) för hanterad klubb — båda OPÅVERKADE av divergensen (finances rörs inte av licenseffekten, boardExpectation stegas redan innan spår 1 fryser). Läser ALDRIG `club.reputation` eller `club.squadPlayerIds` — grep, noll träffar i filen.
- **`evaluateSeasonGoal`**, samma fil-familj — samma grep, samma noll träffar på reputation/squadPlayerIds.
- **`deriveRivalryStanding`** (`seasonGoalService.ts:353`): läser bara `rivalClub.name` — ett statiskt fält, opåverkat.
- **`calculateClubEra`** (`clubEraService.ts:11`): läser `game.trainerArc`/`game.communityStanding` — rör `game.clubs` överhuvudtaget inte.

**Slutsats: bugget är strukturellt äkta men i dag LATENT, inte aktivt.** Ingen befintlig yta visar fel siffra på grund av den. Det som gör den värd att fixa ändå: den är en tickande bomb för allt som byggs senare och läser en AI-klubbs finances/squad/reputation ur en säsongsslutsvy — exakt det scenario `RAPPORT_AI_KLUBBAR_SANN_FORANDRING_2026-08-25.md` redan flaggade (en framtida `standingsSnapshot`-ekonomitrend skulle bli en hel säsongs AI-transfer-kassaflöde fel för potentiellt alla elva AI-klubbar). Den hanterade klubbens EGEN nekad-licens-bestraffning (rykte -15, tre spelare bort) är också osynlig i säsongssammanfattningen just nu — inte för att den döljs medvetet, utan för att ingen läsare frågar efter reputation/squadPlayerIds därifrån i dag. Om någon FRAMTIDA text ("Styrelsen drog in tre kontrakt efter den nekade licensen") skulle vilja visa det, skulle den läsa fel array och få en trupp som fortfarande verkar full.

## Rekommendation

Inte brådskande att fixa isolerat — ingen spelare drabbas i dag. Rätt tillfälle: samma commit som `aiTransferLog`/`standingsSnapshot`-ekonomitrenden byggs (redan Jacobs egen instruktion i förra passet: "AI-klubbarnas förändring: bygg transfers och positionstrend"), eftersom den bygget är precis det som skulle göra bugget aktivt. Enklaste fix då: byt `seasonEndGameView`s `clubs: updatedClubs` till `clubs: clubsAfterLicense` (eller ännu hellre, den array som gäller VID DEN TIDPUNKTEN readern faktiskt behöver — kräver att kolla varje konsument en gång till när AI-transferloggen finns, eftersom ordningen mellan `seasonEndGameView`-bygget (rad 1252) och `clubsAfterLicense`s sista skrivning (rad 1226) redan är rätt (1226 < 1252) — bytet är en enrads-ändring, inte en refaktor.
