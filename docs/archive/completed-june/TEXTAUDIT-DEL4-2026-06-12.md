# TEXTAUDIT — DEL 4 (värld & kuriosa) — PÅGÅENDE

**Datum:** 2026-06-12 · **Auditör:** Opus (Fable) · Röstkarta + felklasser per DEL 1. Lärdom #9 (poolsträngar hittar inte på fakta) är nu primärlinsen — DEL 4-filerna är mestadels guideline-era.

## §0 Jacobs beslut inarbetade (2026-06-12)
- **Manager-pronomen:** "han" accepteras som default nu; **könsval vid NameInput + interpolation = Code-backlogpunkt** (läggs i BACKLOG vid commit).
- **Verkliga varumärken:** Bandypuls OCH Bandyplay BEHÅLLS som verklighetsförankring — samma princip som Studenternas, Vasaloppet, Gubbängen, Ljusdal, Vänersborg. Princip: verklig bandygeografi/-media får refereras som omvärld; spelets EGNA klubbar och tidning ({paper}) är fiktiva.

## §1 Granskat & fixat (pass 1)
- **smallAbsurditiesData ✅ REN** — kurerad absurditetshumor på verklig bandynyhetsgrund (banan-straffen, vapen-klubban). Kioskvakten/Vaktmästaren/Materialaren-dialogformen är guldklass.
- **windowDeadlineText — 1 fix:** "Tre poäng ner till strecket" (F2, avståndet är data) → "Det är tätt ner till strecket".
- **upptaktCopy — 2 fixar:** "Hemmaplan i kvart kostar tre poäng mer" (obegriplig) → "avgörs av placeringen"; countdown "Sex poäng räcker" med variabelt {N} (fel vid N<3) → "Full pott räcker". NOTERAT: fasmarkeringarnas 2-poängsmatte är KORREKT ("Sex poäng räcker" vid fasta tre omgångar = tre raka vinster ✓) — guideline-disciplinen biter.
- **seasonSummaryElimText — 1 fix:** "Två matcher till finalen, två som vi inte fick spela" (F2, serieställningen varierar) → "Finalen fick andra spela".

## §1b Pass 2 (anniversary-kvartetten + klackEcho)
- **anniversaryMarkText — 5 fixar / anniversaryKafferumText — 7 fixar / anniversaryKlackText — 2 fixar / anniversaryMemoryRowText — 1 fix:** NY FELKLASS DOKUMENTERAD — **tidsbuggen**: citaten hårdkodar "förra säsongen"/"i fjol"/"ett år sen" medan `yearsAgo` varierar (eyebrown säger korrekt "3 år sedan", citatet motsäger). Alla års-agnostiska nu ("ett annat år", "då", "den här veckan"). Plus "SM-guldet" där ekot kan vara cupguld, typon "Hela rasen"→"resan", "i år igen"→"ett år sedan".
- **KLACK-SYSTEMBUGG till Code:** `ANNIVERSARY_KLACK`-exporten bakar ihop WON+LOST i en pool som matchCore plockar ur UTAN outcome-filter — "VI MINNS GULDET" kan rulla ut på förlustens årsdag. Fix: filtrera på echo.outcome eller gå via pickAnniversaryKlack.
- **klackEchoText — 16 fixar:** 2p-fel ×2 ("Tre poäng mot dem"; "Två poäng. Inte tre" för OAVGJORT — kryss ger EN) · hårdkodade resultat ("tre-fyra", "sex-sex/sju-sju", sju-måls-motivet genom hela heavy_loss-poolen) · "femtonåttiotvå" (obegriplig) → "femtioåtta" · namngivna motståndare (Sandviken/Bollnäs) i pooler där motståndaren varierar → "storstaden"/"de stora" (farbrodern i Bollnäs BEHÅLLS — omvärld per varumärkesprincipen). ACCEPTERAD APPROXIMATION: cause-prefixens "två/tre veckor sedan" inom 1–4-omgångsfönstret står kvar — gubbarna är etablerat opålitliga berättare ("Birger minns olika siffror"), och full korrekthet kräver {delta}-token utan motsvarande vinst.

## §1c Pass 3 (stillness/specialDate/funktionärer)
- **stillnessText — 8 fixar:** F2-siffror i taggade beats (taggen är ett spann, siffran exakt: "sex omgångar", "Tolv omgångar in", "Tre raka", "Fyra matcher utan poäng", "Tolv dagar", "bäst av fem") → spann-språk. **NY FYNDKLASS — världsbygge:** "hallen" om EGNA klubben som spelar utomhus (premissen för hela halldebatten + prövningen) → "vallen". Samma fel fixat i boardMeetingCopys settings ("Bandyhallens kontor/VIP-rum", "Bandyhallen" → klubbhuset/vallen/sponsorhörnan), +3 fixar där.
- **specialDateStrings — 5 fixar:** Jacobs lore-fil, verklig Studan/Sävstaås-historia KORREKT (Zeke 2011, 3×30-finalen, Sävstaås-spöket) — FREDAD-klass. Fixat: driftande tidsclaims ("för 16 år sedan", "Den 24:e startar nu" — blir fel när spelåren går), väderclaim i icke-grindrad pool, "Derbyt" hårdkodat + fel fallback. Fest-emojis (🎄🎆🏆) i briefing-strängar LÄMNADE som innehållsmarkör per emoji-domslut (a) — gråzon avgjord mot innehåll, säg till om fel.
- **functionaries — 6 fixar:** F2-rundor i fas-pooler ("omgång tolv", "Sju omgångar kvar", "Tre omgångar kvar" ×2 — faserna spänner flera omgångar) · "löparsniack" (obegriplig) → "läktarsnacket" · "vågades" · "finale". Galleriet i övrigt starkt (Kurt-citatet, mamma Britta).
- **spectatorPrimaryText — 1 fix:** "Magnus vill ha besked" — ungdomsledaren GENERERAS ur kvinnonamnpool (functionaries) → "Ungdomsledaren vill ha besked". F2-namn + kön i ett.

## §3 STÄNGNINGSSTRATEGI — resterande filer via grep-svep
Felklasskatalogen är komplett efter 4 delar. Resterande olästa filer (spectatorMarkText, stillnessMicroPool, watchOthersReflectionText, clubExtendedInfo, activeArcStrings, csPressEventText, anslag/, media/, namn-/datafilerna) + ALLA services-strängar täcks av Codes slutsvep nedan — träffarna rapporteras till Opus för texdom, Code ändrar inget själv (textregeln).

### CODE-SLUTORDER — textauditens grep-svep (körs EFTER text-commiten)
```
grep -rn "tre poäng\|Tre poäng" src/          # F3: 2-poängssystemet (inkl "Tre poäng i gåva"→"Två")
grep -rn "period\|frispark\|straffspark\|mittzon\|offside.*flagg\|linjedomar" src/   # F1 fel sport
grep -rni "hallen\|bandyhall" src/domain/data src/domain/services   # världsbygge: egen klubb = utomhus
grep -rn "i fjol\|förra säsongen\|ett år sen\|för .* år sedan" src/domain/data   # tidsbuggen
grep -rnE '"[^"]*(tre|fyra|fem|sex|sju|åtta) (raka|mål|matcher|omgångar|poäng)' src/domain/data   # F2-siffror — Opus dömer träff för träff
grep -rn "Henriksson\|Lindberg\|Bergström\|Sandviken\|Bollnäs\|Västerås" src/domain/data src/domain/services   # F2-namn (omvärldsreferenser OK per varumärkesprincipen — Opus dömer)
grep -rn "Hon \|henne" src/domain   # journalist-könsbuggen på övriga ytor
grep -rn "Vänersborg\|Edsbyn" src/   # TILLÄGG 06-12: skrivguiden DEL 1 förbjuder som klubbar; smallAbsurditiesDatas "Forsbacka åkte till Vänersborg" → Opus-dom
grep -rn "🏒" src/   # domslut c
```
Plus de tidigare öppna verifypunkterna: SM-final-interpolationen (KRITISK), sundayTraining-castingen, ANNIVERSARY_KLACK outcome-filtret, boardMeetingScene förväntnings-beatet, kaptenstals-triggern, dubbla vädersystemen, kickoff-hemma, minut-ordinaler, UTF-8-sed:en, isHome-param (valfri), {lastName}-interpolation (valfri), NameInput-könsval (backlog).

## §4 Slutstatus DEL 4
**Granskat & fixat:** smallAbsurditiesData ✅ · windowDeadlineText ✅ · upptaktCopy ✅ · seasonSummaryElimText ✅ · anniversary-kvartetten ✅ · klackEchoText ✅ · stillnessText ✅ · specialDateStrings ✅ · functionaries ✅ · spectatorPrimaryText ✅ (+ boardMeetingCopy hall-fixarna, retroaktivt DEL 3)
**Täcks av grep-svepet (§3):** spectatorMarkText · stillnessMicroPool · watchOthersReflectionText · clubExtendedInfo · activeArcStrings · csPressEventText · anslag/ · media/ · namn-/datafilerna (communityNames, localEmployers, refereeData, rivalries, playerTraits, regionGeography, regionalClimate, seasonPhases/seasonEndPhase) · samtliga services-strängar

**TEXTAUDITEN ÄR DÄRMED KOMPLETT** som läspass. Kvar: (1) text-commiten, (2) Codes grep-svep enligt §3 med Opus-dom över träffarna, (3) verifypunkterna. Totalt över DEL 1–4: **~210 strängar fixade i 40+ filer**, fyra auditdokument, två nya lärdomar i skrivguiden (#8 tvåpoängssystemet, #9 poolsträngar hittar inte på fakta), fyra namngivna fyndklasser utöver F1–F6 (tidsbuggen, världsbygge-hallen, könsbuggen, klack-outcome-systembuggen).

— Opus/Fable, 2026-06-12
