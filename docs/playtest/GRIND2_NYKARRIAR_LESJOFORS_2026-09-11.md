# Grind 2 — separat ny Lesjöfors-karriär, 2026-09-11

## Denna körning är inte godkänd

Två säsonger genomförda i UI från ny karriär på MEDEL. Pinned commit:
`5d78cc14478f99b6f32533503b59fe255e75e1d6`. Egen origin127.0.0.1:5184 och
exporterad kodkopia. Jacobs localhost:3000 och befintliga save är orörda.
Inga ändringar av matchmotor, balans eller save för att styra resultat.

Det här är en annan körning än `GRIND_2_ATERPROV_2026-09-11.md`.
Den parallella rapporten och dess historiska grinddom skrivs inte över.
Det nya konkreta invariantbrottet nedan kräver separat åtgärd.

2026/27: femma24p, semifinal (Målilla3–1, Forsbacka0–3).
2027/28: fyra28p, kvartsfinal2–3 mot Målilla; avgörandet3–4 hemma.
59 egna matcher,1 175 passiva checkpoints. Huvudsakligen UI-Snabb med läst
Granska; dessutom första cupens första halvlek, år1QF1 och år2QF5 i Full.
Årsbok2027/28 är slutpunkten. Ingen match av tredje säsongen spelad.

## Spår A

1. Burnout-taket höll: exakt step_back2026/global20 och push_through2027/global14.
   Inga andra terminala val/återkomster trots100 båda åren. Före/efter:
   00327→00328 och00803→00804. Separat motsägande återfallstext föreår2taket:
   ”Förra gången höll jag ut” trots stepped_back (00689).
2. Kafferum underkänt: HÄLLEFORSNÄS ÅKTE HEM upprepas00415(2026/26)→
   00811(2027/15), andra gången efter bortaseger. Materialarens fyra flaskor
   upprepas00879(2027/20)→00992(2027/28). `derby_win` och `big_derby_win`
   saknar coffeeSemanticKey/cooldown i postVictoryNarrativeService.
   Produktens kafferumsselektor bekräftar exakt samma texter från savarna.
   Den tidigare fixerade `playoff_win`-grenen höll däremot över båda säsongerna.
3. event_gala_2026 löstes00685→00686 och återkom aldrig. event_gala_2027
   vid nästa års övergång är en ny upplaga, inte repris.
4. Exakt supporter_conflict_* genererades inte: saknad täckning, inte pass.
   Tifo nejår1 och jaår2(global10), därefter missat slumpvillkor inomfönstret.
   Veckans musikmedling/öppna brevet får inte ersätta detta scenprov.
5. Kö: max10 deferred, max3 aktiva inklusive veckoval/handlingsscen.
   Inga dubbla olösta ID eller återkomster av terminalt lösta ID. Alla63
   valhändelser som låg deferred nådde pending. Fruset Granska fungerade
   för ismaskin00240→00241 och burnout. Tre övergångspensionerade events
   saknar separat spelarsvar och bokförs inte som lyckade resolutioner.

## Spår B

Två distinkta säsonger: akademisatsning och Tuomas debutmål första året;
krisstart, sex raka vinster, etablering och smärtsamt femmatchersuttåg andra.
Primär matchhandling var tydlig och nystarten hade tom inkorg. Årsbokens
landningar och flera vardagsröster fungerar. Fullmatchens paussnack och
hörn-/slutminutsval gav nerv. Galan kändes däremot tunn som enbart textval.

Körytmen är tekniskt bättre men gamla efterklanger och omärkta försenade
beröm skaver. Exempel: ”Ni ligger sex” först införQF5 när tabellen visarfyra;
KRÄVER SVAR innehåller rena notiser; straffseger hemma blir ”en poäng borta”;
tabellpoäng läcker in i slutspel; säsongsavskedet säger buss hem efter
hemmamatch. Henriksson sägs vara med landslaget men startar i klubblaget.
Jakten visar åtta sammansatta svar, sedan fel mecenatnamn. Januari kommer
före29/30december. Live påstår obeställt formationsbyte; Granska förnekar
hörnmålet som kom ur det interaktiva hörnvalet. Detta är följdutredningar,
inte belägg för att ändra den kalibrerade matchbalansen.

## Full rapport och repro

[Full rapport med separat logik-/upplevelsedel](/Users/jacobstjarne/.codex/.chatgpt-projects/g-p-6a8ec5100cac8191be785ee306e6a1a2/artifacts/bandy-grind2-nykarriar-2026-09-11/RAPPORT.md).

Samma evidensmapp innehåller `save-manifest.json` (27 vanliga SaveGame-JSON,
SHA256, route/säsong/globalomgång), `event-lifetimes.json`, `decisions.json`,
`canonical-ledger.json`, `selector-audit.json`, `EXPERIENCE.md`, hela råloggen
i `alla-checkpoints.tar.gz` och de passiva observer-/granskningsskripten.
Återimport ska ske i separat testprofil, inte i Jacobs save.

Råloggens hjälpfält newLedger hade fel id-antagande; domen använder fulla
snapshots och kanoniska poster. Resolutions räknas via resolutionId, inte
som nya val när metadata kompletteras vid rollover.

Main17d55e4 kontrollerades efteråt: derbygrenarna och burnout-återfallstexten
är oförändrade från testpinnen. Parallella nyare årsboksfixar underkänns
inte av observationer från den äldre pinnen.
