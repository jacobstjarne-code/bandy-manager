# CODE-ARBETSORDER — text-commit, svep & verifiering

**Datum:** 2026-06-12 · **Av:** Opus · **Prioritetsordning nedan är bindande.**
**Rapportregel (A1-lärdomen):** en commit per huvudpunkt, commit-titeln ska matcha diffen exakt, och redovisningen anger hash + vad diffen faktiskt rör. Inga klar-rapporter utan belägg.

---

## 1. `text:`-commiten — FÖRST, före allt annat

Working tree innehåller ~210 okommittade strängändringar från textauditen (DEL 1–4), spridda över 40+ filer i `src/domain/data/`, `src/domain/data/scenes/`, `src/domain/services/` och `src/presentation/store/gameStore.ts`. `git status` visar exakt vilka. Allt är rena strängbyten med TVÅ undantag som ingår medvetet:

- `journalistRelationshipScene.ts`: lokal funktionsändring (buildStatusText/buildOutlookText tar efternamn istället för hårdkodat "Hon") — inga exporterade signaturer rörda.
- `smFinalVictoryScene.ts`: bodyText/meta använder nu `{playerName}`, `{minute}`, `{arenaCapacity}`.

**KRITISKT — ingår i steg 1, samma commit eller omedelbart efterföljande:** SM-finalscenens render måste interpolera de tre nya tokens. Återanvänd samma mönster/helper som `useCupFinalData` (cup-systern gör redan exakt detta för {playerName}/{minute}). Utan interpolationen renderas `{playerName}` rått i spelets klimaxscen. Verifiera med skärmdump eller testutskrift av renderad bodyText.

Kör `tsc` + tester före commit. Commit-titel: `text: textauditen DEL 1–4 (~210 strängar) + SM-final-tokeninterpolation`.

## 2. Notisdiet-uppdraget

Kör `docs/CODE_UPPDRAG_NOTISDIET_EXPIRES_2026-06-11.md` komplett (notisdiet + obligatorisk `expiresRound` + kondition-0-chipfixen). Observera att DEL C-strängarna som väntade på denna infra redan ligger färdiga i `docs/CODE_UPPDRAG_FORSONING_OPUS_TEXT_2026-06-11.md` DEL C — integrera dem direkt när B3 är byggd, ingen ny Opus-runda behövs.

## 3. Textauditens grep-slutsvep

Kör de åtta grep-kommandona i `docs/TEXTAUDIT-DEL4-2026-06-12.md` §3. Regler:

- **Rapportera träfflistorna till Opus för dom — ändra ingen text själv**, med ETT undantag:
- **Mekaniskt tillåtet:** "tre poäng"/"Tre poäng" → "två poäng"/"Två poäng" där det otvetydigt avser segerpoäng (Jacobs beslut, Lärdom #8). Inkluderar "Tre poäng i gåva" → "Två poäng i gåva". Tveksamma träffar (t.ex. "tre raka", poäng som inte är segersumma) går till Opus-listan istället.
- Svepet täcker de filer auditen inte radläste: spectatorMarkText, stillnessMicroPool, watchOthersReflectionText, clubExtendedInfo, activeArcStrings, csPressEventText, anslag/, media/, namn-/datafilerna samt samtliga services-strängar.

## 4. Verifypunkterna (rapportera punkt för punkt)

1. **ANNIVERSARY_KLACK outcome-filter** (`anniversaryKlackText.ts`): exporten blandar WON+LOST; matchCore plockar utan filter → "VI MINNS GULDET" kan visas på förlustens årsdag. Fixa: filtrera på echo.outcome eller gå via `pickAnniversaryKlack`.
2. **sundayTrainingScene roster-casting:** scenen hårdkodar Henriksson/Lindberg/Bergström med relationseffekter mot spelare som inte finns. Casta från truppen: först på is = högst lojalitet/professionalism, telefonen = lägst träningsvilja, frysaren = lägst moral, tre skyttar = forwards. Texterna får {efternamn}-interpolation.
3. **UTF-8-felet** i `matchCommentary.ts` (`counter_after_corner_slow`, ~rad 23): trasiga bytes i "det r??cker inte" — MCP:n kunde inte matcha. `sed`-fix till "det räcker inte".
4. **boardMeetingScene förväntnings-beat:** "Plats fem till åtta. Inget kvalspel." är hårdkodad förväntan säsong 2+. Redovisa: renderar boardMeetingScene (beats) eller boardMeetingCopy (A/B/C) säsong 2+? Om beats lever: läs förväntningen från objectives.
5. **Kaptenstalets trigger** (`eventCardInlineStrings`): alla varianter slutar "Laget har förlorat tre raka." Verifiera trigger = exakt 3 raka. Om ≥3 eller annat: byt slutraden till "Förlusterna har börjat stapla sig." i alla fem.
6. **Dubbla vädersystem** i matchCommentary (`weather_*` OCH `weatherX`): vilka konsumeras? Rapportera, ta inte bort utan besked.
7. **kickoff-poolens hemma-antagande:** verifiera att {team} alltid är hemmalag i kickoff/cup_kickoff-anropen ("{team} tar emot på hemmaplan").
8. **Minut-ordinaler:** "{minute}:e" i legend-/cupfinal-pooler ger "1:e/2:e" — använd `ordinal()`-helpern från seasonSummaryService.
9. **`--disabled-opacity`:** tokenen finns i kompileringen men #8 (disabled-mekanismen) står som KVAR. Redovisa: är mekanismen wirad någonstans, eller bara tokenen definierad? Om bara definierad — notera explicit, räkna inte som klar.

## 5. Därefter: svepet vidare

#10 (tomma kort-resten) → #12 (taktik-pitch, mock: `docs/incoming/2026-06-11_design_taktikpitch_kontrast.html`) → #8 (delade primitiver). #9 är stängd sånär som på 🏒-grepen som ingår i punkt 3 ovan.

**Valfria förbättringar (egen commit, lågprio):** {lastName}-interpolation i transferResponseText-kafferumspoolerna + {akademispelare}-token i boardMeetingCopy · isHome-param till pickHeadline · NameInput-könsval (BACKLOG-punkt, Jacobs beslut: "han" default tills dess).

## 6. EFTER svepet: B1 + prövningen (nästa stora paket)

När 1–5 är redovisade och gröna öppnar B1-implementationen, i denna ordning:

**a) FacilityTree-domänmodellen + två lägen.** Källor: `docs/incoming/HANDOFF-B1-KLUBBUTVECKLING-2026-06-11.md` (slutversion 06-12 14:50, SLUTGODKÄND) + `docs/REVIEW-B1-MOCK-OPUS-2026-06-12.md` N1–N3: mockens telefoner visar OLIKA tidpunkter — trädet renderar aktuellt state, Valet bara available-noder vid säsongsstart · läktarkortet får kassakostnad i konsekvensraden · yta 1 = push med tillbaka-navigation, inte flik. Dimensionsmappningen in i domänmodellen med exakt dessa definitioner: **Själ = klackMood-delta + identitetsvärde, Publik = antal + intäkt.**

**b) Prövningens tillståndsmaskin.** `docs/SPEC_MATCHHALL_PROVNING_2026-06-12.md` §0–4: HallTrial-interfacet, stödmätaren (startvärde ur klackMood+puls, tre decisions + passiv matchresultatpåverkan), kravchecklistan, förhandlingen via politicianData-återanvändning, bygget på byggsloten med 25 %-fördyringsevent. Kalibrera kassabeloppen mot ekonomimodellen — flagga om de bryter balansen istället för att tyst justera.

**c) Textpoolerna integreras ordagrant.** `docs/TEXTPOOLER_PROVNING_2026-06-12.md` §A–E är färdig copy med förlagskod — typerna (HallTrialStage m.m.) definieras av domänmodellen i (b), strängarna rörs inte. §F:s integrationsnoter är bindande: hallDebateData ÅTERANVÄNDS i förankringen (komplettera, ersätt inte), och hall-atmosfärens utfasning är VILLKORAD — hemmamatch + stage 'klar'; utomhuspoolen lever kvar för bortamatcher.

Fables processtegs-mockar (beställda 06-12, `BESTALLNING_FABLE_PROVNINGSSCENER_2026-06-12.md`) landar parallellt — vänta inte på dem för (a) och (b); hubben renderas med befintliga mönster tills mockarna är godkända.

— Opus, 2026-06-12
