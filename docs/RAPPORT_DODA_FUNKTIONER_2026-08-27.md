# Rapport: två döda funktioner — namn, funktion, historik

2026-08-27. Beställt: "skicka namn och vad de gör, så dömer jag." Ingen kod ändrad. Enligt CLAUDE.md: superseterad → radera, text-utan-yta → wira eller dödmarkera, och skillnaden avgörs av om ytan de skrevs för finns kvar.

## 1. `pepTalkService.getPepTalk` (`src/domain/services/pepTalkService.ts`)

**Vad den gör:** ett komplett, färdigskrivet post-match "tränartal"-system. 21 låsta repliker fördelade på fem kategorier (vinst/förlust/oavgjort/kris/topplag), valda deterministiskt (rundnummer som seed) utifrån senaste matchens resultat, klubbens tabellposition, och en säsongsakt-baserad suffix-mening ("Säsongen är ung...", "Det är avgörandet. Inget mer att spara."). Redan korrekt gated (`standing.played === 0 → null`) — kvaliteten på koden är inte problemet.

**Historik (git):** byggd i `f7580371` ("pep-talk — tränarcitat på dashboard efter varje omgång"), alltså MED en yta från början — den gamla `DashboardScreen`. Konsumenten togs bort i `4a417895` ("remove dead DashboardScreen + 6 orphaned dependencies") när Dashboard byttes ut mot dagens Portal-system. `getPepTalk` fick ALDRIG en ny anropare i Portal — noll träffar någonstans i `src/` idag utanför sin egen definition.

**Bedömning jag INTE gör åt dig:** om detta är "superseterad" (Portal har redan en motsvarande post-match-röst någon annanstans, i så fall var?) eller "text-utan-yta" (funktionen har fortfarande inget hem, väntar). Jag har INTE hittat något Portal-kort som fyller samma roll (ett tränarcitat efter varje omgång) — men jag har inte uttömmande sökt efter varje tänkbar "känns ungefär likadan"-yta.

## 2. `inboxService.createBoardFeedbackItem` (`src/domain/services/inboxService.ts`)

**Vad den gör:** genererar ett inbox-meddelande där styrelsen kommenterar lagets tabellposition mot dess förväntan (`boardExpectation`: WinLeague→1:a, ChallengeTop→3:a, MidTable→halva tabellen, AvoidBottom→näst sist, Survive→sist). Tre tonlägen (positiv/neutral/negativ) med fyra färdiga repliker vardera, valda via en hash av position+poäng.

**Historik (git):** skapad i `537834e8` ("Lägg till board service: styrelsebetyg, säsongsutlåtande och tester") — ett tidigt commit som byggde flera styrelse-relaterade funktioner samtidigt. Till skillnad från `getPepTalk` finns INGEN commit i hela historiken som någonsin lade till ett anrop till den från `application`/`presentation`-kod — den ser ut att aldrig ha haft en yta, inte ens en som senare togs bort.

**Varför jag misstänker superseterad, inte text-utan-yta:** mönstret "styrelsens nöjdhet härledd direkt ur tabellposition mot förväntan" är EXAKT det anti-mönster `tests/grind/forbudslistan.ts`s regel `styrelsens-nojdhet` redan dokumenterar och skyddar mot — den regeln säger uttryckligen att styrelsens ton ska komma från `boardPatience`/`getBoardPatienceZone()` (en ackumulerad, levande poäng), inte en engångsberäkning av position mot förväntan. Det talar för att det här var ett förstautkast som `boardPatience`-systemet (byggt senare, med egen låst text från era `#4`/`#13`-domar) ersatte i bättre form — men jag har inte själv spårat exakt VILKET commit som introducerade `boardPatience` för att bekräfta tidsordningen, bara att den nuvarande, levande koden redan pekar bort från det här mönstret.

## Sammanfattning

| Funktion | Hade en yta? | Yta kvar idag? | Min gissning (inte min dom) |
|---|---|---|---|
| `getPepTalk` | Ja (`DashboardScreen`) | Nej, raderad, aldrig återkopplad | Text-utan-yta — väntar, om Portal inte redan gör samma sak |
| `createBoardFeedbackItem` | Aldrig bekräftad | — | Superseterad av `boardPatience`, men grundat på mönster-igenkänning, inte ett spårat "den här ersatte den där"-commit |
