# Textgranskning: Fas 2 — Dubbelliv på riktigt
Datum: 2026-04-04
Granskare: Erik

## Nya texter att granska

### src/domain/services/events/eventFactories.ts (nya event-typer)

| Rad | Text | Eriks kommentar |
|-----|------|-----------------|
| — | "📰 {namn} till {journalist}: 'Jag vill spela'" | |
| — | "Jag tränar varje dag och gör mitt bästa. Men jag sitter bara på bänken. Det är klart att jag funderar på min framtid." | |
| — | "Prata med spelaren privat" | |
| — | "Konfrontera honom om att gå till media" | |
| — | "Ignorera — det blåser över" | |
| — | "📰 {namn1} om {namn2}: 'Bästa jag spelat med'" | |
| — | "Vi har en förståelse på planen som inte kräver ord. {namn2} vet alltid var jag vill ha bollen." | |
| — | "📣 Kaptenen tar ton i omklädningsrummet" | |
| — | "Det räcker nu. Vi är bättre än det här. Varenda en av er vet det. Imorgon börjar vi om." | |
| — | "{namn} erbjuds befordran" | |
| — | "{namn} har erbjudits en befordran som {jobbtitel}. Det innebär mer ansvar, bättre lön — men sämre flexibilitet för bandy." | |
| — | "Uppmuntra honom — jobbet går först" | |
| — | "Be honom tacka nej — bandyn behöver honom" | |
| — | "Schemakrock för {namn}" | |
| — | "{namn} har ett obligatoriskt möte på {jobb} samma dag som nästa match. Han kan inte vara med på uppvärmningen." | |
| — | "OK — han ansluter direkt till match" | |
| — | "Sätt honom på bänken istället" | |
| — | "Arbetskamrater på {arbetsgivare}" | |
| — | "{namn1} och {namn2} jobbar båda på {arbetsgivare}. De pendlar tillsammans och har börjat träna extra på lunchen." | |
| — | "Varsel på {arbetsgivare}" | |
| — | "{arbetsgivare} har meddelat varsel. {X} spelare i truppen berörs: {namn}. De riskerar att förlora jobbet — och kanske behöva flytta." | |
| — | "Stöd spelarna — erbjud extra träning och stöd" | |
| — | "Det är tråkigt, men inte vårt problem" | |

### src/domain/data/localEmployers.ts (arbetsgivare)

| Rad | Text | Eriks kommentar |
|-----|------|-----------------|
| — | "Sandvik AB" / "Gästrike Vatten" / "Göransson Arena" | |
| — | "Edsbyns Elverk" / "Träslöjden Edsbyn" | |
| — | "ABB" / "Västerås stad" | |
| — | "Uppsala kommun" / "Uppsala universitet" | |
| — | "BillerudKorsnäs" / "Söderhamns kommun" | |
| — | "SSAB Borlänge" / "Falu kommun" | |
| — | "Lokala bruket" / "Kommunen" (fallback) | |

## Att tänka på vid granskning

- Stämmer bandyterminologin? (skridskoåkning, inte löpning)
- Låter det som P4-radio / Bandypuls, inte AI?
- Är ortsnamn och företagsnamn rimliga?
- Är tonen rätt för situationen?
- Språkfel, stavfel, konstiga formuleringar?

## Instruktion till Erik

Fyll i "Eriks kommentar"-kolumnen med:
- ✅ (ok)
- ❌ {föreslagen ändring}
- ⚠️ {fråga/tveksamt}

Returnera filen till Jacob.
