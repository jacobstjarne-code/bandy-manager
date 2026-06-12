# TEXTAUDIT — DEL 2 (matchytan)

**Datum:** 2026-06-11 · **Auditör:** Opus (Fable) · Föregående: `TEXTAUDIT-DEL1-2026-06-11.md` (röstkarta + felklasser F1–F6 gäller).

## §1 Granskat & fixat

### preMatchContextStrings.ts — 5 strängar
- **F4 grammatikbugg:** `'{n} poäng från {posword} plats.'` renderade "från tvåan plats" → "från {posword}."
- **F2:** opp_hot "vunnit fyra raka" / "inte tappat poäng på en månad" och opp_cold "förlorat fyra av fem" — formtriggers garanterar inte siffrorna → generaliserade. "Hemma har {opp} inte tappat poäng den här säsongen" → "inte förlorat på länge" (obesegrad ≠ inga poängtapp; kryss tappar en poäng i 2p-systemet).

### WRITING_GUIDELINES — Lärdom #8 tillagd
2-poängssystemet (Jacobs beslut: "två poäng" överallt) + godkänd trop **"dela på poängen"** (oavgjort = en var; "delade poäng", "poängdelning", "delad pott").

### matchCommentary.ts — 17 strängar (hela filen läst, ~950 rader)
- **F1 sport/termer:** "frispark" → bort (offside-poolen omskriven; även "linjedomaren flaggar" struken — osäker bandyfakta, guidelinens verifieringsregel), "armband" → "bindel", "Kosan" → "Kåsan"
- **F2:** goalOpener "1–0!" ×2 → "{score}!" (bortamål först = 0–1) · hot_streak "Tredje målet på två matcher"/"fjärde omgången i rad med poäng" → generaliserade · cup_final-vinst "första vi vunnit på länge" → "en pokal" · "lika bra i september" → "i premiären" (säsongen börjar oktober/november)
- **F4/F5:** "skakar näve" → "skakar hand" · "pokalen hittat hem" (före avslag!) → "en ägare" · "Det största ögonblicket i svensk idrott" → "En av de stora dagarna" · "{team} hade tur" i miss-poolen (fel lag) → neutral · "blåser FÖR?" → begriplig · "står upp i bänken med handskarna i sargen" (obegriplig) → "slår klubban i sargen på väg ut" · "kommer tillbaka och göra" → "gör"
- **Verifierat äkta och BEHÅLLET:** "ruset" (hörnförsvar), "burgaveln", "vallen", "botbänken", "tre-fem-tvåa" (10 utespelare ✓), "10 man" i undertal (11-mannalag ✓), "45 minuter"/"90 minuter", supporter_scandal-poolen (guldstandard), legend-poolerna ({totalGoals}/{seasons} = databackade tokens ✓)

## §2 Code-ordrar
1. **UTF-8-fel** (MCP:n kan inte matcha trasiga bytes): `counter_after_corner_slow[2]` innehåller "det r<0xEF><0xBF>cker inte" → `sed`-fix till "det räcker inte". Rad ~23 i matchCommentary.ts.
2. **{season}-token:** `final_fullTime_win` "SVENSKA MÄSTARE {season}!" och seasonSummary-narrativet "${currentSeason + 1}" — rapportera vad som faktiskt renderas (årtal eller index "2"?). Om index: mappa till årtal.
3. **{minute}-ordinal:** legend-poolerna skriver "{minute}:e minuten" — minut 1/2 blir "1:e/2:e" (ska vara 1:a/2:a). Återanvänd `ordinal()`-helpern från seasonSummaryService.
4. **Dubbla vädersystem:** `weather_heavySnow/thaw/cold/fog/clear` OCH `weatherCold/Snow/Mild/Fog/Good` — kolla om båda konsumeras eller om ett är dött. Rapportera, ta inte bort utan besked.
5. **kickoff hemma/borta:** "{team} tar emot på hemmaplan" + cup "{team} tar emot" — verifiera att {team} alltid är hemmalaget i kickoff-poolernas anrop.
7. **Kaptenstalets slutrad:** alla `CAPTAIN_SPEECH_VARIANTS` slutar "Laget har förlorat tre raka." — verifiera att eventet triggas vid EXAKT 3 raka förluster. Om triggern är ≥3 eller annan: byt slutraden till "Förlusterna har börjat stapla sig." i alla fem varianter.
6. Påminnelse DEL 1: grep-svepet "tre poäng" (inkl. "Tre poäng i gåva" → "Två poäng i gåva", Jacobs beslut).

## §3 Jacob-kön
1. **Emojis i textinnehåll och som ikonografi:** (a) klack-kommentarernas 🎵📣📯 — innehåll, min lutning behåll; (b) `EFTERKLANG_TYPE_ICON` (📅⚔️💸...) och `PORTAL_BEATS.emoji` — ren UI-ikonografi, bör in i emoji-svepets domslut; (c) **season_opener-beatet använder 🏒 — ISHOCKEYKLUBBA i ett bandyspel.** Oavsett emoji-beslut ska den bort.
2. **"Ingen har tagit poäng på deras is i år"** (preMatch, opp_home_unbeaten): guldstandard-citat, men triggern garanterar bara obesegrad (kryss = poäng tappade). Behåll som poetisk licens eller villkora? Jag lämnade den orörd.
3. **"Bandypuls"** i `PLAYER_PRAISE_VARIANTS` — verkligt mediavarumärke (Aftonbladet). Spelets övriga medier är fiktiva. Byta till fiktivt namn eller behålla som verklighetsförankring?

## §4 Status & kvar
**DEL 2 KOMPLETT 2026-06-11:** matchCommentary ✅ (17 fixar) · preMatchContextStrings ✅ (5) · guidelines ✅ (Lärdom #8) · matchLiveText ✅ REN (Opus 06-08, ärlighetsprincipen) · matchLaddningText ✅ REN (Opus 06-07; "alla tolv" ✓ 12-lagsserie, Studenternas ✓) · efterklangText ✅ REN (Opus 05-25; emoji-ikonografi flaggad) · eventCardInlineStrings ✅ REN (tre raka-triggern på verifylistan, Bandypuls på Jacob-kön) · portalBeats ✅ REN (🏒-flaggan) · roundCharacter = logik, ingen text.

**Mönstret bekräftat:** samtliga fel ligger i pre-guideline-text (matchCommentarys äldre pooler, assistantCoach, journalistrubrikerna). Allt daterat Opus 05-25 och senare är rent. Jacobs hypotes ("Opus har inte alltid läst på") stämmer historiskt — och guideline-disciplinen fungerar bevisligen.

**Därefter:** DEL 3 (scener & relationer), DEL 4 (värld & kuriosa) per DEL 1 §4.

— Opus/Fable, 2026-06-11
