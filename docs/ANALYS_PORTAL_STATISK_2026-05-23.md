# ANALYS — Portalen känns statisk fast mekanismen är dynamisk (2026-05-23)

**Av:** Opus. **Utlöst av:** Jacobs playtest av ny build (omg 1-4, Heros).
Observationen: "portalen ser ut exakt som tidigare, inget fokus" + "massor i
inboxen känns intressantare än det som ligger på portalen".

## Jacobs skarpaste formulering (2026-05-23)

"Som det ser ut nu skulle det vara dubbelt så kul att spela med inboxen som
portal — det är där det händer." Det är den exakta diagnosen. Inboxen är
KRONOLOGISK och osorterad, ändå känns den roligare. Alltså är det inte
sorteringen som vinner — det är INNEHÅLLET. Inboxen är i praktiken en
kandidatlista för vad portalen borde visa. Kurerings-arbetet är redan gjort,
omedvetet: det Jacob pekade på i screen 6 ÄR listan över vad som förtjänar
portal-plats.

**Viktig nyansering — algoritmen har INTE gått fel.** Den sorterar klanderfritt
bland de kort den har. Problemet är att de bästa berättelserna aldrig blev kort.
Trasig sorteringsfunktion vore en sak att fixa; tom korg är en annan. Det är det
senare. Det betyder att fixen är mindre och renare än "bygg om prioriteringen".

## Kärnfyndet — det är INTE en statisk portal

Portalen har en fullt dynamisk prioriteringsmotor: `portalBuilder.ts` +
`dashboardCardBag` (28 kort) + `seasonPhaseBias` + stale-tracking. Den filtrerar
på triggers, viktar per fas, dämpar kort som visats för ofta, och plockar topp-N
per tier (1 primary, 3 secondary, 4 minimal). Det är välbyggt. Jacobs instinkt
att "vi åtgärdade det här" är korrekt — mekanismen FINNS och fungerar.

**Så varför känns det statiskt?** Tre konkreta skäl, alla i kod/data — inte i
arkitekturen. Det är därför det är förvirrande: motorn går, men bränslet och
utväxlingen gör att utfallet blir samma kort varje gång.

---

## Skäl 1 — Det intressantaste innehållet finns inte som portal-kort

Inboxen (screen 6) visar det levande spelet: **Karriärsmilstolpe (Kevin Lund),
Nemesis (Kari Kjellberg), journalistik ("Tränaren vägrade..."), matchresultat
10-5.** Inget av detta finns som kort i `dashboardCardBag`. Bagen har 28 kort,
men de "berättande" händelserna — milstolpar, nemesis, journalist-rubriker,
matchefterspel — bor i `inboxItems`, inte i portal-bagen.

Resultatet: portalen kan bara prioritera bland de kort som finns, och de korten
är mestadels *funktionella* (nästa match, tabell, ekonomi, styrelsemål, skadelista)
snarare än *berättande*. Det intressanta är byggt — men det renderas i inboxen,
en kronologisk lista bakom en kuvert-ikon, inte på portalen.

**Detta är inte en bugg. Det är ett designhål:** ingen har specat att inboxens
bästa innehåll ska kunna lyftas till portalen. De två systemen (portal-bag vs
inbox) lever parallellt och pratar inte med varandra.

## Skäl 2 — De funktionella korten har högre eller låst vikt

Titta på weights i bagen:
- `board_objectives` weight 87, trigger: finns ouppfyllda mål (= nästan alltid)
- `next_match` weight 10 men `alwaysTrue` — alltid primary om inget annat triggar
- `tabell` weight 30, `alwaysTrue`
- `ekonomi` weight 25, `alwaysTrue`

Styrelsemål (87) slår nästan allt i secondary varje omgång eftersom målen sällan
är uppfyllda tidigt på säsongen. Så styrelsemål-kortet (0/5 skador, 0/1 anläggning)
ligger kvar omgång efter omgång — exakt vad Jacob ser i screen 1/2/4. Det är
"intressant" en gång, sen är det brus, men dess höga vikt + sällan-uppfyllda
trigger gör att stale-biasen är det enda som dämpar det, och stale-bias bottnar
vid 0.1 (försvinner aldrig helt).

**Effekten:** de få höga-vikt-korten med breda triggers dominerar. De berättande
korten som finns (derby weight 80, event_critical 95) triggar bara ibland, så
mellan derbyn och kriser faller portalen tillbaka på samma funktionella stack.

## Skäl 3 — Portalen vet inte vilken "sorts dag" det är

Screen 1 (cup-förstarunda) och screen 4 (seriepremiär efter cupförlust) ser
nästan identiska ut. `seasonPhaseBias` justerar vikter per SÄSONGSFAS (tidig/sen
liga, playoff, spectator) men inte per OMGÅNGENS KARAKTÄR. En cup-utslagning, en
seriepremiär, en match efter en förlustsvit, en match före derby — alla får samma
kort-stack om de råkar ligga i samma säsongsfas. C-SD1 (som ÄR byggd) gör exakt
den här sortens dag-vet-vad-den-är för säsongsslutet. Ingen har gjort det för
portalen i stort.

---

## Är detta värt att ta till Design?

**Ja — men inte som "fixa portalen". Som en specifik, avgränsad fråga:**
*"Hur lyfter vi inboxens berättande innehåll till portalen, och hur gör vi
kort-vikterna känsligare för omgångens karaktär?"*

Det är ett genuint designspår, inte en bugg, av tre skäl:
1. Det kräver beslut om VILKET inbox-innehåll som förtjänar portal-plats
   (milstolpe ja, träningsrapport nej) — en redaktionell bedömning.
2. Det kräver en vikt-/trigger-omdesign så funktionella kort (styrelsemål,
   tabell) inte tränger ut berättande kort omgång efter omgång.
3. Det är INTE mer system — det är att koppla ihop två system som redan finns
   (inbox + portal-bag). Det går emot mönstret från sessionen (designen springer
   före bygget); här är bygget klart och designen behöver komma ikapp med en
   prioriteringsregel.

**Vad Design INTE ska göra:** designa fler kort eller fler händelsetyper. Allt
finns redan. Detta är ren kurering: en regel för vad som når portalen och i
vilken ordning, inte ny funktionalitet.

## Konkret frågeställning till Design

1. **Inbox→portal-lyft:** vilka inbox-item-typer förtjänar ett portal-kort?
   (Förslag att utvärdera: milstolpe, nemesis, derby-ramning, "het" journalistik,
   stor seger/förlust. INTE: träningsrapporter, rutinnyheter.)
2. **Vikt-rebalansering:** ska funktionella alltid-kort (board_objectives 87,
   tabell, ekonomi) ha lägre tak så berättande kort vinner när de finns? Eller
   en separat "berättelse-slot" som alltid reserveras för det mest dramatiska?
3. **Omgångskaraktär-bias:** ska `seasonPhaseBias` kompletteras med en
   "round-character"-bias (efter förlust, före derby, cup-dag, premiär) analogt
   med hur C-SD1 läser säsongsslutsfas?

## Öppna trådar (oförändrade, ej portal)
- R1 kafferumsrader — Opus skriver, ej gjort.
- Målmotorn — 10-5 dök upp IGEN (screen 6). Andra höga matchen. Mät-uppdrag
  behövs: batch-sim cup + liga, fördelning (snitt/median/percentil/andel vid cap).
  Lutar nu mer mot kalibrering än otur.

— Opus, 2026-05-23
