# SPEC — BERÄTTAREN: EN REDAKTION ÖVER LIGGAREN

**Datum:** 2026-09-04 · **Av:** Opus · **Paraply:** MASTER `berattaren-paraply` · **Bygger:** Code · **Grund:** GPT:s minnes-slutprov ("spelet har ett minne, men ingen pålitlig berättare"), konsumentkartan, kodläst `portalBuilder.ts`, `inboxToPortal.ts`, `pickEfterklang.ts`, `portalBeatService.ts`, `decisionBudgetService.ts`, `orsakVerkanService.ts`, `narrativeProcessor.ts`, `clubMemoryService.ts` (k1-läsaren), `DOM_LIGGARE_CLUBID`.
**Binder:** k8 (Portal), k11 (pressen), `berattaren-arsbok-rankning`, `berattaren-callbacks`, `berattaren-beats-idempotens`, `berattaren-aterfall-ersatter-intro`, `berattaren-en-kronologi`, k12 — och sedan 2026-09-04 Attention Engine/push (`stickiness-attention-ar-en-yta`).

## 1. Problemet, med GPT:s ord

"Flera av de bästa sambanden skapades i mitt huvud genom att jag kände igen personer, inte genom att spelet själv knöt ihop dem." Jari gjorde mål mot sin gamla klubb — spelet sa inget. Kristoffer blev årets spelare i en annan klubb — spelet sa inget. Årsboken valde det mätbara (såld spelare) när det viktiga var relationen (mecenatens räddning). Journalistens efterklang låg oförändrad två säsonger. Kristoffers måltorka återkom som ny händelse.

Liggaren har allt detta. Ingen redaktion läser den.

## 2. Redaktionen som den är — fem organ, noll liggarläsning

| Organ | Vad det väljer | Läser | Fönster |
|---|---|---|---|
| `buildPortal` kortpåse | primary/secondary/minimal per omgång | kortens triggers på game-state; fas-, karaktärs-, stale-bias | live |
| Story-slot (`inboxToPortal`) | ett inkorgsitem som story-kort | **inkorgen** (texter producenterna redan skrivit), 7 kinds, FREKVENTA/SÄLLSYNTA-rotation | ≤ 2 omg (sällsynta ≤ 6) |
| `portalBeatService` | ett beat | `PORTAL_BEATS` triggers, `shownBeats`, pivotal cooldown | engångs |
| `decisionBudgetService` | vilka beslut surfar | pendingEvents, tier | 3 aktiva |
| `pickEfterklang` | ≤ 2 minnen | **åtta fickor**: activeAnniversaries, klackEcho, journalist.memory, bandyLetters, boardObjectiveHistory, nemesisTracker, economicCrisisState, lastRivalSale | typvis |

Plus tre konsumenter utanför Portalen: årsboken (k6/k7, läser liggaren men rankar på significance), Krönikan (k1, läser liggaren, per säsong), pressen (storyline_resolution indirekt).

**Diagnos:** varje yta har sin egen minnesmodell. Inkorgen är en skuggliggare av text; Efterklang är en samling caches; årsboken rankar rätt sorts fel. Ingen yta vet vad en annan redan sagt. Det som saknas är inte fler producenter — det är **en redaktör** som läser kanon, vet vad som redan berättats, och delar ut ämnen till ytorna.

## 3. Designen — Redaktören

**En ren funktion** `redaktoren(game, chronology): Agenda` som körs per omgång (och vid matchslut för callbacks). Den läser liggaren via k1-läsaren med `clubId`/`managerId` (DOM_LIGGARE_CLUBID) och returnerar en **agenda**: rankade ämnen, var och ett med:

- `post` (liggarposten), `kind` (triumph/scar/tension/neutral), `familj` (match/anläggning/personer/relationer & pengar/beslut & epok — kartans §10)
- `redaktionellVikt` = `significance` × färskhetsfaktor × **relationsvikt** × otaldhetsfaktor
- `passarYta`: vilka ytor ämnet kan gå till (Portal story / Efterklang / press / årsbok / Granska-callback / kafferum)
- `berättatFörut`: från told-registret (§4)

**Relationsvikten** är det som rättar årsboken: familj *personer* och *relationer & pengar* får ×1,4; *beslut & epok* ×1,0; *match* ×0,8 (matcher har redan sin yta i Granska och tabellen). Det är inte en gissning om vad spelare tycker — det är GPT:s fynd som regel: "systemet prioriterar mätbar systempåverkan före relationer". Talet är startvärde; mäts mot GPT:s omkörning.

**Färskhetsfaktorn** har två köer, inte en: *sedan sist* (poster nyare än förra agendan, faktor 1,0 → 0,5 över fyra omgångar) och *för ett år sedan* (årsdagar ur k2, faktor 1,0 på dagen). Allt annat 0,2 — bakgrund, tillgängligt för Krönikan men inte för Portalen.

**Otaldhetsfaktorn**: ett ämne som redan berättats på en yta får 0,3 på samma yta, 0,7 på andra ytor. Eskalering (ny post med samma `semanticKey`-stam, högre significance) nollställer — det är återfall, och återfall får berättas igen, som återfall.

## 4. Told-registret — det som gör beats idempotenta

Nytt fält på saven: `game.ledgerTold: Record<postKey, Array<{ surface, season, matchday }>>` där `postKey = type+semanticKey+season+matchday` (samma identitet som liggaren använder). Varje yta som visar ett ämne skriver en rad. Redaktören läser det.

Det ersätter tre ad hoc-mekanismer med en: `shownBeats` (beats), `lastStorySlotType` (story-rotation), `inboxSentAt`-flaggor (nemesis). Retire-last: de gamla fälten lever tills alla ytor läser registret, sedan stryks de.

**Idempotens** (`berattaren-beats-idempotens`): en producent som vill skapa ett intro för en båge frågar registret + liggaren: finns `storyline_resolution` med samma nyckel? → intro ersätts av återfallsvariant (Opus text per båge, efter Codes inventering) eller hoppas. Burnout och pressen gör redan detta med egna funktioner (`isBurnoutRelapse`, `hasPriorStorylineResolution`); registret gör det till en regel för alla.

## 5. Ytorna — vad var och en tar ur agendan

**Portalen (k8).** En ny kortfamilj `memory_card` i secondary-tier, vikt 55, **max ett per omgång**, aldrig i endgame-kureringen (den är matchen), aldrig när ett beslut väntar på slot (beslut vinner — minnen är bakgrund, `decisionBudget` orörd). Två kickers: **SEDAN SIST** (högst viktade otalda post ≥ 60 sedan förra agendan) och **FÖR ETT ÅR SEDAN** (årsdag ≥ 70). Text: k1:s dispatch (MOMENT_VIEW_TEMPLATES, Krönika-mallar, de fem nya) — ingen ny copy. Story-sloten fortsätter läsa inkorgen tills vidare; på sikt ersätter agendan inkorgs-kandidaterna (retire-last, egen rad).

**Efterklang.** `pickEfterklang` byggs om till att ta kandidater ur agendan i stället för ur åtta fickor: anniversary ← k2; nemesis ← `nemesis_signed`/nemesisTracker (behåll fickan tills en post finns); rivalSale ← `rival_sale`; economicScar ← `decision`/kris-poster; journalist ← `storyline_resolution` (press-bågen) + journalist-relationen (live-state, stannar); klackEcho stannar (live-state, inte minne); followUp ← brev (ingen liggartyp — Code avgör om `letter` blir typ eller om fickan stannar; Opus lutar mot typ, significance 40, familj personer). Premiss/eko-poolerna behålls oförändrade — det är formen som är rätt, källan som är fel. Max 2 som idag. Det löser "oförändrad två säsonger": agendan byter ämne när liggaren fyller på.

**Pressen (k11).** Presskonferensen får **högst en** liggarfråga per tillfälle: agendans högst viktade post ≥ 70 senaste tre omgångarna som pressen inte redan frågat om (registret). Frågestammar nycklade på typ/familj — Opus text nedan. Svarsalternativen återanvänder pressens befintliga svarstyper (avledande/rakt/känslosamt); relationseffekten oförändrad.

**Årsboken.** Två rader i stället för en: **Säsongens beslut** (som idag, `pickMostImportantDecisionText`) och ny **Säsongens person** — agendans högst viktade post i familj personer/relationer, oberoende av beslutsraden. Så Jari OCH Hedin får plats. Text: Opus, nedan. k6:s två liggarposter till keyMoments väljs med relationsvikten inräknad.

**Granska (callbacks, k12 + `berattaren-callbacks`).** Vid matchslut frågar redaktören: finns post med `subject` = motståndarens målskytt/matchens spelare och `clubId` = vår (`transfer_sold`, `transfer_story`, `nemesis_signed`)? Finns post med managerns förra `clubId` = motståndaren och ingen tidigare match mot dem sedan bytet? Finns `player_milestone` för en spelare med personligt mål stämplat `managerId` = vår manager, i annan klubb? Texterna är låsta i MASTER (`berattaren-callbacks`). En rad i Granska-ögonblicket, aldrig fler än en.

**Kafferummet.** Läser inte liggaren idag. Får ett eko på agendans post ≥ 60 som är otald på kafferummet: "Det pratas om {Namn}." — en rad, kursiv, som kafferummets egna repliker. Liten, sist.

**Push (Attention Engine, Etapp 1B).** *Tillagt 2026-09-04 efter `RAPPORT_STICKINESS_NOTIFIERINGAR_PWA` + Codex Etapp 1A (MASTER `stickiness-attention-ar-en-yta`).* Notifieringar är en yta i Berättaren, inte en egen redaktion. De narrativa kandidatfamiljerna (kalenderankare, säsongsläge, narrativ återkomst, senare celebration) hämtar sina kandidater ur agendan — samma poster, samma relationsvikt, samma färskhetsköer. Matchförberedelse-loopen (laget ej bekräftat) är ett rent state-open-loop utan narrativ och får vara egen. `ledgerTold` får ytan `push`: ett skickat item skrivs som told, så Portalens memory_card inte säger samma sak nästa morgon — och omvänt: en post Portalen redan visat får 0,3 i push-otaldhet. Attention Engines egna termer behålls för det agendan inte vet: urgency (tid till match), kanal-fatigue/backoff, personalAffinity ur respons, quiet hours, frekvenstak, holdout. Notification history = Portalens story-slot/memory_card, ingen separat lista. Copy: Opus mallbibliotek per röst × familj (`stickiness-copy-roster`), spelvärldens klubbar, textgrind som allt annat. **Konsekvens för ordningen (§9): steg 1–2 byggs före Etapp 1B:s kandidataktivering.**

## 6. Kronologin (`berattaren-en-kronologi`)

Redaktören tar `chronology` som parameter — en (1) funktion `currentChronology(game) → { season, matchday, leagueRound, phase }` som Code bygger (eller lyfter ur `getCurrentLeagueRound`/`matchdayToLeagueRound`) och som ALLA ytor läser för stämplar. "Omgång 4 under omgång 2" kan inte uppstå när det bara finns en klocka.

## 7. Text (Opus — LÅST)

**Portal-kickers:** SEDAN SIST · FÖR ETT ÅR SEDAN. (Kortets rad kommer ur dispatchen.)

**Årsboken, Säsongens person** (en per familj, `{Namn}` ur subject; Code väljer på typ):
- patron_emerge / mecenat_costshare: *{Namn}. Utan honom hade det inte gått i år. Det vet han också.*
- mecenat_withdrawal / patron_withdrawal: *{Namn} lämnade. Det märktes mest på det som inte längre kom.*
- player_milestone / academy_promotion / national_team_callup: *{Namn}. Året då han blev den han skulle bli.*
- retirement / transfer_sold: *{Namn} är borta nu. Orten räknar fortfarande med honom.*
- referee_feud / referee_trust: *{Namn} i svart. Ni pratade mer om honom än om något annat lag.*
- storyline_resolution (journalist): *{Namn}, med anteckningsblocket. Hen skrev historien om er — och ni gav hen den.*

**Pressens liggarfrågor** (stam; journalistens namn ur befintlig pool):
- referee_feud: *Det sägs att ni och {Domare} inte kommer överens. Är det domaren eller er som är problemet?*
- patron_withdrawal / mecenat_withdrawal: *{Namn} har dragit sig tillbaka. Hur klarar klubben sig utan de pengarna?*
- patron_emerge: *Vem är {Namn}, egentligen — och vad vill han ha tillbaka?*
- era_shift: *Det pratas om en ny epok i klubben. Är det ni eller tabellen som bestämmer det?*
- star_injury: *{Namn} är borta länge. Vem bär laget nu?*
- transfer_sold (om sålda spelaren utmärkt sig): *{Namn} gör mål varje vecka — för någon annan. Ångrar ni försäljningen?*
- scandal: *Vi måste fråga om {ämne}. Vad hände egentligen?*

**Kafferummet:** *Det pratas om {Namn}.*

## 8. Vad som INTE byggs

Ingen ny minneslagring. Inga nya liggartyper utom eventuellt `letter` (Code avgör). Ingen ny text utöver §7 och återfallsvarianterna (efter inventering). Inkorgen och story-sloten rivs inte — de retireras retire-last när agendan bevisat sig. Klackekot och journalistrelationen förblir live-state, inte minne.

## 9. Ordning (Code)

1. `ledgerTold` + `currentChronology` (grunden, små).
2. `redaktoren()` som ren funktion med tester: relationsvikt, två färskhetsköer, otaldhet, eskalering.
3. Portal `memory_card` (k8) — första konsument, mätbar i GPT:s omkörning.
4. Årsbokens "Säsongens person" + k6 med relationsvikt.
5. Granska-callbacks (kräver clubId-domen byggd).
6. Efterklang på agendan (fickor retire-last).
7. Pressens liggarfråga (k11).
8. Kafferummet.
9. Beats-idempotens över alla producenter (efter Codes inventering; Opus återfallstext).

Varje steg grönt för sig; inget steg kräver nästa.

## 10. Godkänt när

GPT kör slutprovet igen (fyra säsonger, samma frågor). Godkänt om: Jari-mål-mot-oss och återkomsten till gamla klubben får sina rader; årsboken nämner både beslutet och personen; journalistens efterklang byter ämne mellan säsonger; ingen avslutad båge återkommer som ny; ingen händelse bär fel omgång; och GPT:s karriärmening kan skrivas av spelet självt ur årsböckerna och Krönikan. Det sista är det egentliga kriteriet.

## Ägarskap

**Code:** steg 1–9, strangler, en pass per steg. **Opus:** text låst ovan; återfallsvarianter efter inventering; dömer omkörningen. **Jacob:** ingen kall utom relationsviktens tal om GPT:s omkörning visar att den slår fel.

## Implementationsstatus 2026-09-04

Steg 1–9 är byggda och lokalt verifierade. Efterklang använder agendan för de historiska källor som har säker kanon och skriver `surface: efterklang`; pressen väljer högst en färsk, tillräckligt tung och otald liggarfråga, bär exakt postnyckel genom den befintliga presshändelsen och skriver `surface: press` först efter surfacing-budgeten. Kafferummet dekorerar sin befintliga scen med högst en namngiven agendapost med vikt ≥60, sist och kursivt, och skriver `surface: coffee_room` först när scenen avslutas. Alla tre behåller de live-/cachekällor och legacyvägar som stranglern uttryckligen kräver; ingen ny minneslagring har införts. Steg 9 följer `DOM_ATERFALL_ARCS_2026-09-04.md`: personbågar räknar kanoniska resolutioner per spelare över säsonger (normal → låst variant → skip), derbyekot minns föregående utfall mot samma motståndare under säsongen och skolkonflikten känner igen samma elev nästa år. Därmed är hela specens Code-del genomförd; kvarvarande godkännande är GPT:s fyrsäsongs-slutprov enligt §10.
