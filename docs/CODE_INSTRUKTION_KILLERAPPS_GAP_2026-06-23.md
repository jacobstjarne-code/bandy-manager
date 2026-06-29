# CODE-INSTRUKTION — killer-apps #2/#4: strukturella gap efter render-flödesspårning

**Datum:** 2026-06-23 · **Av:** Opus · **Till:** Code
**Bakgrund:** Leveransrapporten sa "stommen står, 1184/1184 gröna, all copy = OPUS_COPY-markörer". Opus spårade render-flödet och fyllde de markörer som FANNS (4 portal-beats + nemesis-kortet i TranareTab — committade). Men tre delar är inte copy-skuld — de är obyggda datakällor/vyer. Gröna tester bevisar att inget kraschar, inte att featuren renderas i kontext.

## GAP 1 — managerNarrativeLog skrivs aldrig (#2 tenure-arc har ingen datakälla)
**Symptom:** TranareTab "📖 BANAN" läser `profile.narrativeLog ?? []` och filtrerar `e.text !== '// OPUS_COPY'`. Men:
- `generateManagerProfile` (managerProfileService.ts) initierar INTE `narrativeLog`.
- Ingen kod skriver `narrativeLog` — verifierat i managerProfileService; inga pushes sedda i roundProcessor.
- Typen finns (`ManagerNarrativeEntry`, ManagerProfile.ts) och läsaren finns — men inget producerar data → arcen renderas aldrig.

**Bygg skrivställena för de fem ögonblicken** (push `ManagerNarrativeEntry` med `text: '// OPUS_COPY'` som placeholder — Opus skriver texten efteråt):
- **arrival** — i `generateManagerProfile` eller save-init: en post `{type:'arrival', season:startSeason, matchday:0, text:'// OPUS_COPY'}`.
- **burnout_peak** — i roundProcessor där `updateManagerBurnout` körs: när burnoutScore passerar BURNOUT_TRIGGER_THRESHOLD (70) uppåt FÖRSTA gången en säsong, push en post. Dedup på säsong.
- **era_shift** — i roundProcessor där `era_shift`-Momentet redan skapas (recentMoments): parallellt, push en narrativeLog-post med samma säsong/matchday.
- **rivalry** — när en nemesis först etableras (deriveNemesis ger non-null och ingen tidigare rivalry-post finns): push en post. Dedup.
- **milestone** — vid karriärmilstolpe (t.ex. careerWins-jämn 50/100, eller säsong 5 i klubben): push en post.

Alla med `text: '// OPUS_COPY'`. Initiera `narrativeLog: []` i generateManagerProfile så fältet aldrig är undefined.

**RAPPORTERA:** var varje skrivställe lades, och vilka variabler som är i scope vid var (så Opus kan skriva text som refererar rätt: motståndarnamn vid rivalry, era-namn vid era_shift, etc).

## GAP 2 — blodslinje-vyn finns inte (#4)
**Symptom:** HistoryScreen.tsx har flikarna seasons/letters/school/photos + Hall of Fame + Rekord. Ingen blodslinje-vy. Ingen separat fil (sökt: Blod/Bloodline/Lineage/Arv — inga träffar).
**Bygg:** blodslinje-vyn enligt `SPEC_GENERATIONSLOOPEN` — mentor-kedjan ritad via `Spine` (finns i components/shared/). Härled ur `clubLegends` + `mentorshipHistory` + spelarnas narrativeLog. Lägg som egen flik i HistoryScreen eller egen Minne-vy. Namn länkar i båda riktningar (mentor ↔ adept).
**RAPPORTERA:** var vyn lades, och om någon copy behövs (rubriker/tomtillstånd) → markera `// OPUS_COPY`.

## GAP 3 — avskeds-ceremonin finns inte (#4)
**Symptom:** RetirementDecisionSecondary.tsx är det BEFINTLIGA pensionsvals-kortet (läser `decision.quote` ur retirementText.ts). Ingen ny avskeds-CEREMONI-scen hittad (sökt: Cerem/Avsked/Eftermäle — bara CeremonyCupFinal/SmFinal, den befintliga slutspels-chrome:n).
**Bygg:** avskeds-ceremonin enligt `SPEC_GENERATIONSLOOPEN` — scen som fyrar när en legend/mångårig spelare (isLegendEligible — Code bekräftade dessa villkor används) pensioneras. Återanvänd chrome från CeremonyCupFinal/SmFinal. Läser RetirementData (farewell, bestMoment, careerStats). Distinkt från pensionsvals-kortet — detta är firandet, inte beslutet.
**RAPPORTERA:** var scenen lades, vilken trigger, och markera ceremonins text `// OPUS_COPY`.

## COPY-HANDOFF
När GAP 1–3 står med `// OPUS_COPY`-markörer i skrivställen/vyer → tillbaka till Opus. Opus skriver: de fem narrativeLog-texterna, blodslinje-rubriker/tomtillstånd, avskeds-ceremonins text. Opus skriver INTE blint innan skrivställena finns — texten måste referera variabler som bara finns i kontext.

## ORDNING
GAP 1 (datakälla, minst arbete, gör tenure-arcen levande) → GAP 2 (blodslinje, återanvänder Spine) → GAP 3 (ceremoni, återanvänder slutspels-chrome). Rapportera per gap mot specens verifieringssteg.
