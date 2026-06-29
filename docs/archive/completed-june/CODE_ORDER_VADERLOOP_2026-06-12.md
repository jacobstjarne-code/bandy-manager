# CODE-ORDER — Väderloopen + kartans småfixar

**Datum:** 2026-06-12 · **Av:** Opus · **Prioritet:** efter svepet/DOM-punkterna, FÖRE B1-paketet (väderloopen är en B1-förutsättning).
**Bakgrund:** SYSTEMKARTA fynd 1 — `WeatherEffects.attendanceModifier` har beräknats av weatherService sedan vädersystemet byggdes (snöstorm 0.60, töväder/dålig is 0.70, dimma 0.75, extremkyla 0.80, lätt snö 0.85) men ALDRIG konsumerats. Opus har byggt mottagarsidan i `economyService.ts` (commit-bar nu): ny exporterad `effectiveWeatherAttendance(rawModifier, hasIndoorArena, isBigOccasion)` + optional params i `calcRoundIncome` (`weatherAttendanceModifier`) och `calcAttendance` (`weatherAttendanceModifier`, `hasIndoorArena`). Allt defaultar till 1.0 — byggsteget är icke-brytande tills wiring sker.

## 1. Wira anroparna (Codes del)

**a) economyProcessor (intäktsmutationen) — EXAKT WIRING (Opus läste filen 06-12):** i `processEconomy`, i `calcRoundIncome`-anropet, på raden bredvid `journalistAttendanceModifier: getJournalistAttendanceModifier(game)`, lägg:
```ts
weatherAttendanceModifier: effectiveWeatherAttendance(
  game.matchWeathers?.find(mw => mw.fixtureId === managedHomeMatch?.id)?.effects.attendanceModifier,
  managedClub.hasIndoorArena,
  Boolean(managedHomeMatch?.isFinaldag || managedHomeMatch?.isAnnandagen || (managedHomeMatch?.matchday ?? 0) > 22),
),
```
Timing verifierad: processEconomy läser game.matchWeathers FÖRE trimningen i roundProcessors state-bygge — den färdigspelade matchens väder (pre-genererat förra omgången) finns kvar vid anropet. AI-klubbarnas schablonekonomi rörs inte (ingen attendance i den). Annandags-gratisentrén (val C) nollar matchRevenue EFTER beräkningen — ingen konflikt.

**b) Alla `calcAttendance`-anropare:** skicka `weatherAttendanceModifier: mw?.effects.attendanceModifier` (RÅ — funktionen dämpar själv internt) + `hasIndoorArena: club.hasIndoorArena`. Hitta anroparna med `grep -rn "calcAttendance" src/`.

**c) EkonomiTab (display-estimatet):** för kommande hemmamatch — om MatchWeather redan genererats: skicka faktorn så estimatet stämmer med utfallet; om inte: utelämna (1.0). Ingen prognos-fejk.

**d) Inställd match-fallet:** `effects.cancelled` hanteras redan separat — väderfaktorn ska INTE appliceras dubbelt på inställda matcher (ingen intäkt alls gäller).

**Verifiera:** en hemmamatch i heavySnow ska visa ~40 % lägre publik än samma match i klart väder; SM-final i snöstorm ska visa ~20 % dipp (halverad). Visa två testutfall i redovisningen.

## 2. Birger-kanoniseringen (SYSTEMKARTA fynd 2) — en rad
`generateSupporterGroup` har redan `overrideName`-param för gruppnamnet men leader-namnet plockas ur pool. För MANAGED klubb: tvinga `leader.name = 'Birger'` (textkanon: klackEchoText, hallDebateData och prövningspoolerna använder namnet). Övriga klubbars grupper genereras fritt. Minsta ingrepp: en override-gren i makeChar för leader när clubId === managedClubId — Code väljer renaste vägen, redovisar diffen.

## 3. Kartans grep-paket (SYSTEMKARTA §7 + §9) — rapport, inga ändringar
Per fält, klassa varje träff läser/skriver, rapportera till Opus:
`journalistRelationship` (top-level vs entitet) · `fanMood`-skrivare · `communityStanding`-skrivare · `adjustSupporterMood`-anropare · `politician.corruption|oppositionStrength|popularitet|generosity` · `chemistryStats`-läsare · `hasArtificialIce` · `pendingDecisions` · `patron.demands|wantsStyle` · `club.facilities`-läsare (B1-kollisionen!) · `boardPersonalities` vs `club.board`-läsare · `fanExpectation`-läsare.

## 4. Spec-synk
SPEC_MATCHHALL_PROVNING §5 "väderoberoende publikintäkt" har nu sin motpart: hall klar ⇒ `hasIndoorArena = true` ⇒ faktorn 1.0 via befintliga `effectiveWeatherAttendance`. Ingen extra hall-kod behövs i B1 för denna effekt — den faller ut gratis ur loopen. (Detta var poängen: vi byggde en UTOMHUS-mekanik som hallen sedan konsumerar.)

— Opus, 2026-06-12
