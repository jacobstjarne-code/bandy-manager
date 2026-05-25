# HANDOFF — Portal-kurering (inbox → portal)

**Från:** Opus (efter Jacobs playtest av ny build, omg 1-4)
**Datum:** 2026-05-23
**Underlag:** `docs/ANALYS_PORTAL_STATISK_2026-05-23.md` (läs den först — full analys)

## Ramen — läs detta innan något annat

**Detta är INTE "designa fler kort" eller "fler händelsetyper".** Allt berättande
innehåll finns redan — det renderas bara på fel ställe (inboxen, inte portalen).
Prioriteringsmotorn (`portalBuilder`) fungerar klanderfritt. Den sorterar bra
bland de kort den har. Problemet är att de bästa berättelserna aldrig blev kort.

Jacobs diagnos, ordagrant: *"Som det ser ut nu skulle det vara dubbelt så kul att
spela med inboxen som portal — det är där det händer."* Inboxen är kronologisk
och osorterad, ändå roligare. Alltså vinner INNEHÅLLET, inte sorteringen.

**Uppgiften är kurering, inte arkitektur.** Fyll korgen som motorn sorterar ur,
och justera vikterna så berättelser vinner när de finns. Inte bygg om motorn.

## Vad som händer idag (kort)

Portalen visar mestadels funktionella kort: nästa match, tabell, ekonomi,
styrelsemål, skadelista. De berättande händelserna — milstolpar, nemesis,
journalistik, stora resultat — bor i `inboxItems`, finns inte i
`dashboardCardBag`, och når därför aldrig portalen. Dessutom har funktionella
kort höga/breda vikter (styrelsemål weight 87, brett triggande) som skulle tränga
ut berättande kort även om de fanns i bagen.

## Tre frågor till Design

**1. Inbox → portal-lyft: vilka inbox-item-typer förtjänar ett portal-kort?**
Inboxen är i praktiken redan en kandidatlista — det Jacob pekade på i screen 6 är
listan. Förslag att utvärdera:
- JA till portal: karriärsmilstolpe, nemesis, derby-ramning, "het" journalistik
  (tränaren-vägrade-typ), stor seger/förlust (stort målantal eller mot rival).
- NEJ, stannar i inbox: träningsrapporter, rutinnyheter, P19-resultat.
Behöver en regel: vilken inbox-typ → vilket portal-kort, i vilken tier?

**2. Vikt-rebalansering: ska funktionella alltid-kort ha lägre tak?**
`board_objectives` (87), `tabell`, `ekonomi` (alwaysTrue) dominerar. Två vägar att
välja mellan:
- (a) Sänk taket på funktionella kort så berättande kort vinner när de finns.
- (b) Reservera en separat "berättelse-slot" som alltid går till det mest
  dramatiska som triggar, oberoende av de funktionella korten.
Vilken väg? (a) är enklare, (b) garanterar att portalen alltid har ett drama-kort
om det finns något att berätta.

**3. Omgångskaraktär-bias: ska portalen veta vilken sorts dag det är?**
Cup-förstarunda och seriepremiär efter cupförlust ser identiska ut idag.
`seasonPhaseBias` läser säsongsfas men inte omgångens karaktär. Förslag: en
"round-character"-bias (efter förlust, före derby, cup-dag, premiär, efter svit)
analogt med hur C-SD1 — som redan är byggd — läser säsongsslutsfas. Återanvänd
det mönstret. Värt det, eller överbygge?

## Vad Design INTE ska göra

- Inte designa nya händelsetyper eller nya kort-koncept. Allt finns.
- Inte röra `portalBuilder`-algoritmen. Den fungerar.
- Inte lägga till mer system. Detta kopplar ihop två system som redan finns
  (inbox + portal-bag).

## Beroenden
Inga nya. Inbox-systemet och portal-bagen finns båda byggda. Detta är en
mappnings- och vikt-fråga, inte ny funktionalitet. Code-arbetet efteråt blir
litet: lägg till kort i `dashboardCardBag` som läser inbox-item-typer + justera
weights.

— Opus, 2026-05-23
