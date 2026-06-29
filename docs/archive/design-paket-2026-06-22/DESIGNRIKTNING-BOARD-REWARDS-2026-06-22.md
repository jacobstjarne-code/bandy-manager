# DESIGNRIKTNING — Board-rewards: verkliga men inneslutna löften

**Datum:** 2026-06-22 · **Av:** Fable / Design · **Till:** Opus (balans) + Code
**Gäller:** Code-audit prio 4 ("boardObjectiveService rewards är bara text"). Den meatigaste — och den jag skulle börja med. Plus: den löser prio 5 (sponsorNetworkMood) på köpet.

## Problemet, skarpt
`successReward`/`failureConsequence` är strängar. Enda mekaniska följden är `±3/5 patience` vid säsongsslut (seasonEndProcessor) + sack-triggern. **Du fattar in-säsongs-beslut mot styrelsens löften — men löftena är dekor.** Det är inte ett sidosystem: styrelsens mål är *säsongens motivations-ryggrad*. En hålig kärnloop är värre än en hålig utkant.

## Princip: verkligt men inneslutet — mjukt som default, hårt sällan
Gör INTE rewards till systemiska budget-bonusar rakt av. Transferbudget-injektioner spräcker ekonomin (det var min invändning i handovern). I stället en **belöningsstege**, mestadels mjuk:

**MJUKA belöningar (default, ekonomiskt säkra):**
- **Förtroende som kompounderar.** Uppfyllt mål → patience-headroom *och* en kvarstående "förtroende"-nivå. Två säsonger i rad uppfyllt → styrelsen ger något konkret men *inneslutet* (se nedan). Förtroendet är minnet som gör nästa mål viktigare.
- **Narrativ beat.** Ett uppfyllt flaggskeppsmål förtjänar ett ögonblick — en anslag/scen-nivå (ni har infra:n). Inte en inbox-rad bland andra.
- **Sponsor-goodwill** → här kopplas prio 5 in (nästa stycke).

**HÅRDA belöningar (sällan, kapade):**
- En engångs, *taket-begränsad* "förtroendepott" (liten transfer-/facility-slant) — bara vid kompounderat förtroende, aldrig per mål. Balansen hålls för att den är sällsynt och kapad.

**MISSLYCKANDE — gör det kännbart, inte tyst:**
- Idag: −5 patience i det tysta. Lyft ägarens reaktion till en *synlig* beat (eskalerande ton: notering → varning → ultimatum). Då känns nästa mål tyngre. Misslyckandet ska ha en röst, inte bara en siffra.

## Den eleganta kopplingen — prio 4 löser prio 5
**Board-rewards är den naturliga konsumenten för `sponsorNetworkMood`.** Idag rör sig fältet (ripple + transfers) men ingen läser det. Knyt ihop:

- Uppfyllt styrelsemål → sponsor-goodwill → `sponsorNetworkMood ↑`.
- `sponsorNetworkMood` → liten, kontinuerlig modifierare på sponsorintäkt (1 konsument räcker).

Då får styrelse-rewards sin *inneslutna ekonomiska hävstång* (via sponsorhumör, inte via budget-injektion — säkert), OCH `sponsorNetworkMood` får äntligen sin konsument. **Två fynd, en wire.** Och min *legibel konsekvens*-design (derby → sponsor +5) blir sann: deltan landar någonstans.

## Order
- **Opus (balans):** vikta belöningsstegen — vad är mjukt, vad är det sällsynta hårda, var ligger taket på "förtroendepotten", hur stor är sponsorintäkts-modifieraren per `sponsorNetworkMood`-punkt.
- **Code:** `sponsorNetworkMood` → sponsorintäkts-modifierare (löser prio 5). Uppfyllt mål → `sponsorNetworkMood`-delta + ev. förtroende-nivå-fält. Misslyckande-reaktion som synlig beat (ärver `PortalBeat`/anslag).
- **Design (jag):** kan mocka belönings-beaten + misslyckande-beaten + förtroende-stegen visuellt om ni vill se ytan innan bygge — säg till.

Detta gör styrelsens löften verkliga utan att hota ekonomin, och städar bort ett attrapp-fält i samma drag.
