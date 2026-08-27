# Förslag: licensräkneverket som ackumulator, inte binär räknare

2026-08-26. Steg 1-3 i byggordningen (EkonomiTab → varningen → kaskaden) klara, testade, gröna. Detta är steg 4 — ett FÖRSLAG, inget byggt. Du dömer magnituderna.

## Nuvarande mekanik (det som ska bort)

`checkLicenseStatus` är en fyrstegs tillståndsmaskin: `clear → first_warning → point_deduction → license_denied`, ETT steg framåt per säsong med `netResult<=0`, HELT nollställd till `clear` av EN enda säsong med `netResult>0`. Minneslös, exakt som du sa.

## Förslag: en poäng, samma princip som meritbufferten

Ersätt de fyra diskreta stegen med en numerisk `licenseRiskScore` (0-100):

```ts
const LICENSE_RISK_BAD_SEASON_PENALTY = 20   // varje säsong med netResult<=0
const LICENSE_RISK_GOOD_SEASON_RELIEF = 12   // varje säsong med netResult>0 — lättnad, inte amnesti
// Trösklar, bevarar EXAKT samma kadens som dagens system för en klubb som
// bara går back: 20/40/60/80 matchar dagens 1:a/2:a/3:e/4:e raka förlustår.
const LICENSE_RISK_WARNING_THRESHOLD = 40
const LICENSE_RISK_POINT_DEDUCTION_THRESHOLD = 60
const LICENSE_RISK_DENIED_THRESHOLD = 80
```

**Varför 20/12, inte 20/20:** om lättnaden vore lika stor som straffet skulle en klubb som växlar förlust-vinst-förlust-vinst ligga still för evigt — fullt skyddad så länge den aldrig går back två år i rad. Med 12 i lättnad eroderar en sådan klubb sakta (+8 netto per två-säsongerscykel) — den överlever längre än en klubb som bara går back, men en strukturellt ostabil ekonomi hinner ikapp den till slut. Det är bilden "ett bra år köper lättnad, inte amnesti" ger, räknat.

**Räknat exempel:**
- Konsekvent dålig klubb (förlust varje säsong): 20→40→60→80 — nekad år 4, EXAKT som i dag.
- En förlust, sedan frisk: 20→8→0(golv) — inget bestående men en riktig kostnad för det dåliga året, inte total amnesti samma säsong.
- Blandat (F,F,V,F,F,V,F,F...): 20,40,28,48,68,56,76,96 — kris efter åtta säsonger trots var tredje år positiv. En strukturellt skör ekonomi hinns ikapp, en instabil men grundfrisk klubb överlever längre.
- Frisk klubb (vinst varje år): ligger kvar på 0 (golvet), aldrig i riskzon.

## Konsekvens för det redan byggda (viktigt att se innan du dömer)

EkonomiTab:s "Raka förlustår: X av 4" och inbox-fältens `licenseYearsCounted`/`licenseYearsRequired` (steg 1-2, redan byggda och gröna) är designade kring det GAMLA diskreta räkneverket. Om ackumulatorn godkänns behöver de skrivas om till att visa poängen istf årsräkningen — t.ex. "Risknivå: 68/100" med samma färglogik. Det är en uppföljande, mindre ändring (samma komponenter, ny siffra) — inte ett nytt bygge, men värt att veta innan du dömer att det tillkommer.

## Väntar på din dom

Godkänn magnituderna som de står, justera dem, eller ge en annan riktning. Bygger inget förrän du sett detta — sedan uppdateras EkonomiTab/inboxfälten i samma pass som ackumulatorn själv.
