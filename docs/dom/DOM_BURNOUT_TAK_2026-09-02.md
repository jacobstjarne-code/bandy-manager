# DOM — BURNOUT-TAKET: valet, återhämtningen, ärret (A+C+D)

**Datum:** 2026-09-02 · **Av:** Opus · **Beslut:** Jacob (A+C+D) · **Utlöst av:** GPT:s burnout-audit 2026-09-02: "efter ett år på hög belastning förändras betydelsen inte längre. 100 blir normaltillstånd. Annars upphör mätaren att kommunicera något."

## Problemet (GPT, kodbekräftat)

Burnout-mätaren når 100 och FASTNAR. GPT:s data: efter elva raka lätta omgångar låg den på 97; vid säsong tre åter på 100. En båge som inte kan gå högre slutar betyda något — och den nuvarande "återhämtningen" (lätt träning) släpper knappt (100→97), så spelaren har ingen verklig väg ner. Mätaren blir en platt siffra, inte en berättelse.

## Domen — en liten båge vid taket: val → återhämtning → ärr

Jacobs val A+C+D, och de tre bildar en egen båge: **du GÖR något vid taket (A), bär priset du valde (C), och det lämnar ett spår (D).** Slutläget blir något du fattar beslut om, inte något som bara händer och nollställs.

### A — det tvingande valet (framgångskurvans mönster)
När burnout legat på MAX (zon 'hog' vid taket) i N omgångar fyrar ett beslut som INTE går att skjuta (samma icke-deferbara mekanik som andra måste-kort). Två grenar, ett nameable avstående:
- **Kliv tillbaka** — välj återhämtning (öppnar C). Priset: du tappar mark.
- **Kör vidare** — vägra. Priset: risken att det blir permanent.

Det är exakt framgångskurvans form: bägge sidor svider, valet är ditt.

**MUST-TIER-BESLUT (Jacob 2026-09-02):** `burnoutCeiling` läggs på MUST-tier (icke-deferbart), inte `'month'` (skjutbar kadens) som defaulten var på tre ställen. Skäl: domen slår redan fast att det är "ett beslut som INTE går att skjuta" — must-tier är bara koden som matchar domen. Ett skjutbart tak-val är inte längre ett tvingande val, det är en påminnelse. → Code: byt de tre `'month'`-flaggorna till must-tier.

### C — återhämtningsvägen (med verkligt pris, och den måste FAKTISKT släppa)
"Kliv tillbaka" öppnar en väg ner från 100 som kostar över tid: påtvingad lätt träning (mekaniken finns — `burnoutTrainingSlowdownUntilRound`), sämre resultat, tålamodskostnad, och — B-varianten infälld som pris — assistenten tar några omgångar (du tappar kontroll, laget driver). **KRITISKT: mätaren ska faktiskt SLÄPPA på den här vägen.** GPT bevisade att den inte gör det idag (100→97 på elva omgångar). C är inte bara "lägg till en väg" — det är att göra återhämtningen verklig OCH villkora den på uppoffringen. Utan att den släpper är valet meningslöst.

**MEKANIK-DOM (2026-09-02): vägval (a), inte (b).** Ett `burnoutCeilingRecoveryUntilRound`-fält (kopiera `burnoutTrainingSlowdownUntilRound`-mönstret) som medan aktivt GOLVAR nettodeltat i `updateManagerBurnout` så det aldrig kan bli positivt — score TRENDAR garanterat ner även under fortsatt press — INTE en hårdsatt/cappad siffra (b). Skäl: mätaren måste fortsätta KOMMUNICERA; (b) återinför exakt problemet vi lagar, en mätare som ljuger om tillståndet, bara i andra riktningen. (a) bevarar att score är en ärlig läsning av press minus återhämtning OCH ger valet ett bett-med-väg-ut. **Byggt av Code i eventResolver (`startBurnoutCeilingRecovery`-subeffekt) enligt detta vägval.**

### D — ärret (och det matar trestegsmodellen)
Oavsett gren lämnas ett PERMANENT spår i manageridentiteten och karriärhistoriken:
- Kör vidare → "härdad men märkt" — en egenskap, nya repliker, en rad i karriärhistoriken.
- Kliv tillbaka → "bröt mönstret" — men det syns att du var där.

Och det avgörande, som binder ihop hela sessionen: **ärret skrivs till diaryn/liggaren, så nästa gång burnout klättrar VET systemet att du varit vid taket förr.** Det matar rakt in i `isBurnoutRelapse` + `BURNOUT_MARK_RELAPSE` vi just byggde (steg 1→2→3). Andra gången du närmar dig taket säger texten inte "första gången" — den säger "du har varit här, du vet vad det kostade".

## SKYDDAT
- **Fyrar BARA vid ihållande MAX**, inte vid en första mild burnout. Den befintliga markbar/hog/relapse-bågen är orörd — detta är TAK-tillägget, inte en omskrivning.
- **C måste ge en VERKLIG release** — GPT:s 100→97-fynd är buggen som ska lagas här. Utan verklig nedgång är hela valet dekoration.
- **Board-tålamodet/framgångskurvan** som taket gränsar mot rörs inte i kalibreringen utan mätning — "kliv tillbaka"-priset (tappa mark) får inte råka trigga en avskedsspiral (samma klass som ekonomins net-negativa säsong: ett bett, inte en spiral).

## GODKÄNT NÄR (mät en dominant-men-pressad karriär, GPT:s Slottsbron-scenario)
1. Burnout på max i N omgångar fyrar det tvingande valet — inte bara en statisk 100:a.
2. "Kliv tillbaka" för FAKTISKT ner mätaren (mot dagens 100→97), mot ett synligt pris.
3. Bägge grenar lämnar ett karriärärr.
4. Ärret matar `isBurnoutRelapse` — en framtida klättring vet historiken (steg 1–3).
5. Framgångskurvan biter: vila kostar mark, kör-vidare riskerar permanens. Ingen avskedsspiral av en enda "kliv tillbaka".
Magnituder (N omgångar vid max, återhämtnings-priset) via mätning + Jacobs känsla. **D-fact.**

## Ägarskap
Code: bygg tak-triggern (N omgångar vid max), de två grenarna, den VERKLIGA återhämtnings-decayen (lagar 100→97-buggen), assistent-övertagandet som pris, och ärret→diary/liggaren. Mallsträngarna `[Opus]`. Opus: valtexten, de två utfallstexterna, ärr-raden — och `BURNOUT_MARK_RELAPSE` bär redan callbacken en framtida klättring behöver. Jacob: magnituderna (hur länge vid max innan valet fyrar, hur brant återhämtnings-priset är) — känslo-kall efter mätning.
