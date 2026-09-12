# DOM — GRÄNSEN: liggaren (kanon) kontra narrativeBeatLog (cooldown)

**Datum:** 2026-09-02 · **Av:** Opus · **Utlöst av:** Codex formulerade rätt anda ("liggaren är minnesbanken, använd den genomgående i stället för sekundära system") men drog en för bred slutsats ("narrativeBeatLog får bara finnas som tillfällig bakåtkompatibilitet") och var på väg att flytta finalrotationens cooldown-logik till `eventLedger`. Denna dom drar gränsen så nästa agent inte gör samma överföring.

## Principen — TVÅ lager, olika frågor, ingen ersätter den andra

**`eventLedger` = kanon. Svarar på: "vad HÄNDE i klubbens historia?"** Händelser med substans, lästa av historie-konsumenter (årsbok, press, styrelse, karriärhistorik, orsak/verkan). Append-only, ingen prosa, strukturerad.

**`narrativeBeatLog` = cooldown-lagret. Svarar på: "har vi VISAT den här texten nyligen?"** Poster bär bara `{semanticKey, season, round}` — presentation-timing, för att inte upprepa en rad/ram för snabbt. Läses av cooldown/rotation (`isOnCooldown`, `wasLoggedThisRound`, `rotateSubject`, `pickPoolIndexAvoidingCooldown`).

**Detta är inte "gammalt vs nytt". Det är två OLIKA frågor.** narrativeBeatLog blir ALDRIG överflödig, ersätts ALDRIG av liggaren, är INTE "tillfällig bakåtkompatibilitet". Fas 3-domen (`DOM_HANDELSELIGGAREN` + migrationsplanens Fas 3-revision) slog redan fast: narrativeBeatLog subsumeras INTE. Denna dom befäster det som en stående arkitekturregel.

## Gränsen, operativ (testet nästa agent applicerar)

Fråga om varje sak som ska "till minnesbanken": **är det en HÄNDELSE (vad hände) eller en VISNING (vad vi visade)?**
- **Hände** → `eventLedger`. En SM-final spelades. En patron klev fram. En stjärna skadades. En relation bröts.
- **Visades** → `narrativeBeatLog`. Vilken final-hero-RAM som renderades. Vilket citat-INDEX som drogs. Vilken press-fråga som ställdes. Vilken pool-post som valdes.

**Finalrotationen är gränsfallet som utlöste domen, och den delar sig:**
- Finalen som HÄNDELSE (spelades, resultat, motståndare) → hör i liggaren.
- VILKEN hero/ingress/keyline-ram som visades → narrativeBeatLog. `rotateSubject` ("visa inte samma ram två raka finaler") är COOLDOWN-logik. Att flytta den till `eventLedger` vore att förorena kanon med presentation-timing.

**Dom: `rotateSubject` mot `narrativeBeatLog` är KORREKT. Bygg INTE om finalrotationen att rotera ur `eventLedger`.** Codex committa finalrotationen som den står.

## Varför ripple-chains/moments/patron migrerades MEN narrativeBeatLog inte gör det

Det som migrerades till liggaren (recentMoments, pendingRippleChains, patron-händelser, seasonDecision) var alla HÄNDELSE-minnen i egna fickor — "vad hände" lagrat sekundärt. De hörde i kanon. narrativeBeatLog är inte ett händelse-minne i en ficka; det är cooldown-INFRASTRUKTUR. Skillnaden: migrera händelse-minnen INTO kanon; lämna cooldown-lagret utanför.

## SKYDDAT
- **narrativeBeatLog raderas/deprekeras ALDRIG som "sekundärt system".** Det är ett förstklassigt lager med en egen fråga. Att behandla det som skuld är kategorifelet denna dom finns för att stoppa.
- **En händelse kan skriva BÅDA:** en final skriver en liggarpost (hände) OCH en narrativeBeatLog-post (vilken ram visades). Det är inte dubblering — det är två frågor om samma händelse. Dual-writ av OLIKA data, inte samma.
- **"Använd liggaren genomgående" betyder: sluta lagra HÄNDELSER i sekundära fickor.** Det betyder INTE: flytta cooldown/rotation/timing till liggaren.

## Testet, kort (för nästa gång någon säger "använd minnesbanken")
Bär det substans en historie-konsument vill läsa månader senare? → liggaren.
Är det "har vi visat X nyligen?" → narrativeBeatLog.
Om du är osäker: skulle årsboken/karriärhistoriken vilja rendera det? Ja → kanon. Nej (det är bara timing) → cooldown.

## ÄGARSKAP
Codex: committa finalrotationen med `rotateSubject` mot `narrativeBeatLog` (som byggd). Bygg INTE om den mot `eventLedger`. Alla agenter: denna dom är den stående gränsen — händelser till kanon, visnings-timing till cooldown-lagret. Jacob: ingen kall väntar — principen är hans anda ("använd minnesbanken"), domen bara drar kanten rätt så den inte blir kategorifel.
