# CODE — TOTALORDER 2026-08-17

**Av:** Opus (chat)
**Läget:** `main` = `c5fa24f7`, **går inte att bygga**. Live = `2539fb2`, alltså flera dygn efter. Det senare upptäcktes av GPT under Skutskär-auditen, inte av oss.

Detta är hela kön i en fil, i körordning. Har du redan gjort något — säg det och gå vidare; rapportera vad som var klart så jag kan stryka det ur kön i stället för att gissa.

**Underlagsdokument, alla i repot:**
- `CODE_INSTRUKTION_LANGSPEL_10SASONGER_2026-08-17.md`
- `CODE_INSTRUKTION_SOMMAREN_2026-08-17.md`
- `DOM_FRAMGANGSEKONOMIN_2026-08-17.md` (**pausad**, se ETAPP 6)
- Skutskär-auditen och långspelsauditen (uppladdade, ej i repo)

**Två regler genom hela ordern.** Rapportera-först betyder rapportera-först: bygg inget i de punkterna. Och GPT kör en visuell audit plus två nya tiosäsongstest efter det här arbetet — varje ombyggnad ska därför kunna pekas ut i efterhand, alltså separata commits med rotorsak, inte ett svep.

---

# ETAPP 1 — main måste kunna byggas

Allt annat är meningslöst innan detta är klart.

**1.1** `seasonEndProcessor.ts:1178` — `resolveContractExtension` anropas med tre argument, kräver fyra (`profile, currentSeason, seed, managerName`). Sannolikt från ditt M-04-arbete med displayName. Skicka det kanoniska displaynamnet.

**1.2** `tsc --noEmit` och Vite-build som **obligatoriska CI-grindar**. Main har varit obyggbar och ingen märkte det.

**1.3** Deploy-hashen som synlig releasegrind: det ska gå att se på en rad om live och main är i synk. GPT fick reda ut det manuellt mitt i en audit.

Rapportera hash när main bygger och live är i synk. Etapp 2 börjar inte innan dess.

---

# ETAPP 2 — förtroendebrott

Fyra saker där appen påstår något som inte är sant, eller kastar bort spelarens data.

**2.1 · Karriärminnet.** `seasonEndProcessor.ts:1240` gör `.slice(-5)`. Efter tio säsonger var år 1–5 borta. Behåll en kompakt sammanfattning per säsong för hela karriären — säsong, placering, poängrad, titlar, ekonomi vid årets slut, narrativt ankare. Begränsa detaljdata, inte säsongsidentitet. Test vid 1, 5, 6, 10 och 20 säsonger. Migrera inte bakåt — de åren är borta.

Detta går först i etappen: varje spelad säsong under tiden är fem år en framtida spelare tappar.

**2.2 · Råa mallvariabler.** `{motståndare}` och `{resultat}` renderas ordagrant. Rotorsaken är hittad av GPT: `finalBody` skapas på `AnslagOverlay.tsx:72` **innan** playoff-interpoleringen muterar `variantBody` på 98–101. Flytta beräkningen efter all interpolation.

Plus en grind: faila om `/\{[^}]+\}/` matchar i någon renderad textnod, över alla visuella scener. Samma princip som dubbelrenderingsgrinden. Rapportera antalet träffar — hittar den tokens vi inte kände till är det fyndet, inte grinden.

**2.3 · Finalbeats efter eliminering.** Efter semifinaluttåg följde "Finalen. Birger…". Gatea finalevent på att klubben är aktuell finalist i bracketen **vid konsumtion**, inte vid generering. Rensa köade slutspelsevent vid eliminering. Bygg ihop med H-02 från tvåsäsongsauditen om den inte är klar — det är en rensningsregel, inte två.

**2.4 · Val som lovar mer än de gör.** "Ge honom vila" ger bara `boostMorale +10` (`eventFactories.ts:199–204`) — spelaren blev matchens bästa direkt efteråt. Varselvalet lovar "risk att spelare lämnar" och ger bara `boostMorale` (`eventFactories.ts:340–345`).

**Grepa ALLA choice-labels och deras faktiska state-diff. Rapportera varje val där texten lovar mer än effekten.** Bygg inget förrän jag sett listan — vissa löften ska wiras, andra ska skrivas om, och det avgörs per fall.

Detta är tredje gången i serien: prototypen som hävdade att ripple-slingan fanns, "tre kontrakt löper ut" som inte existerade, och nu dessa två. Klassen är att text skriver checkar domänen inte täcker.

---

# ETAPP 3 — avskedsvägen

Spelets största konsekvens är i dag ett kraschtillstånd.

**3.1 · `managerFired`-guard på alla `/game`-rutter.** `GameShell.tsx:38–49` skyddar bara mot saknat game. I fired-state kan dashboarden väckas eller så kraschar det (`Cannot read properties of undefined (reading 'status')`). Detta byggs oavsett vad 3.3 landar på.

**3.2 · `BoardPatienceMinimal`.** Beställd sedan ripple-rundan, inte byggd. Ingen produktionskomponent läser `boardPatience` före `GameOverScreen`. Kvalitativa zoner, inte råtal: **Stabilt · Under press · Ultimatum**. Portalens befintliga minimal-familj, samma mönster som `EconomyMinimal`. Baseline.

Skälet den inte kan vänta: utan den kommer avskedet som en överraskning, och ett avsked utan varning är godtyckligt, inte dramatiskt.

**3.3 · RAPPORTERA — post-firing-kontraktet.** `GameOverScreen.tsx:37–39` navigerar till `/` utan att rensa save, så huvudmenyn visar FORTSÄTT. Två möjliga kontrakt: rent karriärslut (arkivera sammanfattning, rensa aktiv save, erbjud Historik + Ny karriär) eller job market (behåll managerprofil och historik, välj ny klubb, återställ klubbspecifik state). Rapportera vad var och en kostar. Jag dömer.

---

# ETAPP 4 — kontext och identitet

Fem fixar där två källor beskriver samma sak och glider isär. Samma klass som `RoundSummaryScreen` mot `GranskaScreen`.

**4.1 · Standings parity.** Dashboarden visade 5:e, slutspelsintrot seedade 6:a, årsboken sparade 5:e — samma säsong, samma 21 poäng. En kanonisk slutställning med samma tie-breaker för dashboard, bracket, Historik och `SeasonSummary`.

**4.2 · Derbyrepliken.** Två vägar in, vilket är varför min tidigare order inte räckte: `preferIds` filtreras inte genom kontext (`pressConferenceService.ts:28, 36, 41`), **och** `win_derby` är klassad som generic `win` (rad 423). Stäng båda. Specialtaggar sätts till `generic: none`.

**4.3 · Varsel-dedupen.** `postAdvanceEvents.ts:281–307` kollar `event_varsel_s{season}`, fabriken skapar `event_varsel_{employer}_{season}` (`eventFactories.ts:321`). Gemensam ID-funktion, regressionstest för resolved och pending.

**4.4 · Byggflikens copy och lås.** `FacilityTree.tsx:231` säger "val görs i säsongsstarten", men bygge är löpande. Copy till **"Ett bygge åt gången"**. Och `facilityNodes.ts:162–168`: Akademi 3 kräver både `traningshall` och `akademi_2` — lista varje krav med uppfyllt/ej uppfyllt separat.

**4.5 · Årsbokens styrelsemening.** "2:a plats uppfyller styrelsens krav på att vinna ligan". Härled ur samma objective-resultat som påverkar `boardPatience`, inte ur placeringstier. Tabelltest över placering × mål × uppfyllt/misslyckat.

Plus, i samma etapp: årsbokens råa nyckel `captain_rallied_team`, dubblerade kaptensevent, och event märkt `O33` i en 22-omgångssäsong. Det sista är sannolikt kalenderindex mot ligaomgång — separera dem.

---

# ETAPP 5 — Sommaren

Bygg enligt `CODE_INSTRUKTION_SOMMAREN_2026-08-17.md`. **Variant 1e** i `docs/incoming/Sommaren-sasongsovergangen-2026-08-17.dc.html` är vald; 1a–1d är förkastade.

All text är låst i ordern. Fem punkter där är rapportera-först — vilka zoner `getBurnoutZone` returnerar, om säsongsavslutet har en händelsetyp mina tre radformer inte täcker, vilket fält som bär "slutspel inte rimligt", hur skärmen hakas in i flödet, och att omgångsantalet härleds och inte hårdkodas.

En sak ur Skutskär-auditen som skärper ordern: burnout följde med oförändrat över sommaren, och GPT bekräftar att ingen återhämtning erbjuds. Golvet på 30 i återhämtningsregeln är alltså det enda som gör burnout till något annat än en räknare — bygg det som specificerat, inte som en full nollställning.

---

# ETAPP 6 — geometrigrinden

Bredda tap-target-grinden till de ~28 meningsfullt nav-bärande scenerna, **enbart för geometrimätning**: `BottomNav` monterad i mätläget, inte i det som fotograferas, så ingen baseline ändras och ingen bilddiff behöver granskas. Hoppa de fyra `EXTRA_HEIGHT`-scenerna.

Avgör först: renderas `event-overlay` och `press-conference` med en riktig nav under sig, eller är de `pendingScene`-dolda? De är strukturellt identiska med `MatchLaddningScene` — exakt komponentklassen B-01 gällde. Och notera din egen z-index-observation: `zIndex 300` mot navens `100` betyder att ett koordinattryck inte *kan* nå navet, men att CTA:n kan ritas ovanpå navikonerna. Det är en renderingsdefekt som ser ut som en klickbugg och inget test vi har fångar den. Rapportera, bygg inte.

---

# ETAPP 7 — rapportera-först, inget bygge

Fyra utredningar. Svaren avgör vad som byggs efter GPT:s nya tester.

**7.1 · Svårighetsgradsmodellen (C-01, det största fyndet i Skutskär-auditen).** `offerSelectionService.ts:9–17` sätter difficulty enbart från renommé. Skutskär har 52 och blir hard — men styrelsekravet är `AvoidBottom`, tålamod sjunker bara i botten tre (`seasonEndProcessor.ts:680–698`), och två missade delmål kostar −10 tillsammans (`:895–902`). GPT tankade medvetet en hel säsong och blev femma; styrelsen blev *mer nöjd*; reservelvan vann 10–4 borta.

Rapportera: vad krävs för att härleda difficulty ur truppstyrka, ekonomi, faciliteter och styrelsens förväntan i stället för renommé? Och separat: vad krävs för att en klubb i nedflyttningsstrid faktiskt tappar `boardPatience`?

**7.2 · Kanonisk matchkontext.** Presskonferensen rapporterar straffsegrar som "Oavgjort", cupfinal som "Två viktiga poäng", hemmakryss som "En poäng på bortaplan", clean-sheet efter 9–8. Fem symptom, fem egna felaktiga härledningar ur `homeScore`/`awayScore`.

Rapportera: hur många ställen klassificerar matchutfall självständigt? Vad **saknas** i `matchTypeAxes` (finns sedan Granska del 4) för presskonferensens behov? Vad är minsta ändringen som gör alla fem symptomen omöjliga?

**Villkoret jag redan sätter:** en kontextmodell, inte två. Ett parallellt `MatchOutcomeContext` vid sidan av `matchTypeAxes` är två sanningar om samma match.

**7.3 · Narrativt minne.** "Finalen. Birger…" ordagrant år 5, 7, 8, 9, 10. Samma Tord-modal stoppade två semifinalomgångar i rad.

Rapportera: hur många oberoende cooldown-/dedupmekanismer finns? Hur många distinkta narrativa event-typer, och hur många behöver `semanticKey`? Kan nyckeln härledas maskinellt ur befintliga ID:n eller kräver varje event ett manuellt beslut? Är svaret trehundra typer börjar vi med pivotal beats och lämnar ambient orörda.

**7.4 · Renommé nedåt.** Skutskär tankade en säsong och renommét *steg* 52 → 56. Rapportera vad som skulle krävas för ett säsongsvis renommédelta ur placering mot förväntan. Bygg inget — det är en balansfråga.

---

# ETAPP 8 — pausat, bygg inte

**Framgångsekonomin** (`DOM_FRAMGANGSEKONOMIN_2026-08-17.md`) är **pausad**, och skälet är Skutskär-auditen. Domen antog att nedsidan fanns och behövde kalibreras mot. Den finns inte — en svag klubb kan inte misslyckas. Löneinflation och driftskostnad mot ett sådant spel blir dekoration i den övre halvan och godtyckliga i den nedre. Nedsidan (7.1) byggs först.

**Dynasty state, burnoutkonsekvens och eventköns viktning** ligger hos mig. Eventköns viktning går till Design i dag.

---

## Ordning och form

1 → 2 → 3 → 4 → 5 → 6 → 7. Etapp 7 är rapporter och kan skrivas parallellt med bygget om det passar bättre.

**En commit per fix, med rotorsak.** GPT kör visuell audit och två nya tiosäsongstest efter detta — varje ändring ska kunna pekas ut i efterhand. Ett svep är inte tolkningsbart.

**Kalibrering görs aldrig i klump.** Om något i etapp 4 eller 7 leder till en balansändring: en åt gången, `npm run stress` före och efter, mittpunkt-kalibrerad som de skalade ripple-deltana.

**Innan något markeras klart:** browser-verifiering enligt CLAUDE.md — rapportera vad du **såg**. Snapshots gröna, `npm run build && npm test`, `lint:design`, `lint:text-guard`. Audit i `docs/sprints/`.

**Språkfelen** i båda auditerna: samla dem i en lista till mig i stället för att fixa dem en och en. Jag skriver om raderna.
