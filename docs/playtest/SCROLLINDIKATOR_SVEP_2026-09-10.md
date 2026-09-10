# Scrollindikator — vy-svep 2026-09-10

## Fråga

Var hjälper Granskas nya scrollpil spelaren att förstå att mer innehåll finns, utan att bli en generell dekoration på varje lång sida?

## Metod

Kodläsning av samtliga explicita vertikala scrollbehållare och fasta/sticky bottenytor i `src/presentation`, följd av mobilprov i dev-scener vid 390 px. Särskilt provade: Portal full/grind/avbrottsbudget, Granska, EventOverlay/brytpunkt, presskonferens, Game Over, lönekrav, årsbok, karriäruppehåll, klubb/historik, inkorg, spelarbyte, landslagsuttagning, slutspelsintro/-summeringar, halvtid, mecenatmiddag, hallprövning och Valet.

## Dom

### Bekräftat behov

- **Portalens innehållsrika lägen.** Den fasta CTA-stacken (ibland både simulering, nästa-åtgärd och primärknapp) ligger framför kortstacken medan själva scrollen ägs av `GameShell`. I `portal-full` och `portal-interruption-budget` kan ett händelsekort och dess svarsalternativ fortsätta bakom CTA:n utan en tydlig signal. Samma villkor som i Granska: mer innehåll finns bakom fast botten-chrome. Scrollindikator ska visas endast när scroll återstår och placeras ovanför hela den uppmätta CTA-stacken.

### Avvakta spelbevis

- **Årsboken (`SeasonSummaryScreen`).** Lång, men nästa avskurna dokumentsektion syns tydligt och skärmen saknar fast botten-CTA.
- **Finalens startelvor (`FinalIntroScreen`).** Knappen kan ligga under 22 namn, men den avskurna listan signalerar fortsatt scroll. Följ upp först om riktig finalgenomspelning visar tvekan.
- **Lönekraven.** Kan bli långt med många spelare, men räknaren `N spelare — X/N mötta` och den fortsatta spelarlistan bär orienteringen.

### Ingen indikator

- Klubb, trupp, historik, inkorg och sparningar: konventionella list-/dokumentskärmar med synligt fortsatt innehåll.
- EventOverlay, brytpunkt, presskonferens, landslagsuttagning, spelarbyte och övriga modaler: aktuella 390 px-tillstånd ryms; modalens egen scroll är en säkerhetsventil, inte ett observerat orienteringsfel.
- Slutspelsintro, kvartsfinalsummering, mästarskärm, halvtid, karriäruppehåll och Game Over: primär handling ryms och är synlig.
- Valet: kortlistans avskurna nästa alternativ signalerar scroll; ingen fast bottenyta döljer fortsättningen.

## Implementationsgräns

Kopiera inte Granskas lokala logik in i Portal. Granska äger sin scrollbehållare; Portalens scroll ägs av `GameShell`. Nästa pass bör först göra scrollägaren tillgänglig för Portal och därefter återanvända en liten gemensam indikator med containerref, klickscroll och `hasMore`-mätning. Visa den aldrig globalt för alla GameShell-rutter.
