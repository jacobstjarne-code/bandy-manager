# D1 — DOM OCH COPY

**Datum:** 2026-08-19 · **Av:** Opus
**Underlag:** `docs/incoming/Eventkoens-viktning-D1-2026-08-19.dc.html`

---

## Domen: godkänd, med en ändring

Att mappa de tre vikterna på `DecisionCard`s befintliga `shape` och `size` i stället för att bygga nya komponenter är rätt, och av samma skäl som allt annat: en komponent med tre lägen kan inte glida isär, tre komponenter kan.

**Ambient-definitionen är den bästa delen.** Att ett event utan val inte får ett kort är en mekanisk regel, inte en estetisk — den går inte att tolka fel och den kan testas. Det tömmer kön på brus utan att någon behöver bedöma något.

**Pivotal är inte en fjärde ceremoni, och det var min oro.** `EventOverlay` med mörk backdrop finns redan och blockerar redan. Vikten uppfinns alltså inte — den routar rätt event till en behandling som existerar. Det är ett mycket bättre svar än en ny komposition.

---

## Ändringen: konsekvensmarkören får inte vara röd

Förslaget sätter `⚠` plus en rad i `--danger` på kostsamma val.

Rött läses som fel. `O2`/`O12` säger uttryckligen att konsekvensnivåer **inte** är färgkodning av rätt och fel — och en spelare som ser rött på "sälj honom" lär sig att spelet har en åsikt om valet. Det förstör precis det dominansrevisionen ska laga: att val ska vara val, inte prov.

**I stället:** konsekvensmarkören bär vad det kostar, i samma dämpade register som resten av kortets metadata. Inget `⚠`, ingen `--danger`. Ett kostsamt val ser ut som ett val med ett pristal på.

**Undantaget är irreversibilitet**, och den är inte en färg utan ett ord. "Går inte att ändra" är information, inte en varning — och den ska stå oavsett om valet är bra eller dåligt.

---

## Copy — konsekvensmarkören

Fyra nivåer, tre av dem syns.

**Neutral:** ingen markör.

**Positiv:** ingen markör. Att märka ut det goda valet är facit, och `O12` avvisar facit före valet.

**Kostsam:** exakta pengar, alltid. `O12`:s regel — pengar är den enda resurs där exakthet inte förstör valet.

```
Kostar 45 tkr
Kostar 18 tkr/mån
Kostar 45 tkr nu, 6 tkr/mån sen
```

Kostar valet något annat än pengar, namnge resursen utan siffra:

```
Kostar en plats i truppen
Kostar relationen till {namn}
```

**Irreversibel:** en rad under alternativet, i samma dämpade register:

```
Går inte att ändra.
```

Är valet både kostsamt och irreversibelt står båda, kostnaden först.

---

## Copy — "därför nu"-raden

En rad på pivotal-kortet som säger varför beslutet inte kan vänta. Den är hela skälet att kortet blockerar, och utan den är blockeringen godtycklig.

Fem former, valda efter vad som faktiskt driver brådskan. Prioritetsordning uppifrån:

**Deadline finns:**
> Svaret måste komma före {tidpunkt}.

`{tidpunkt}` är det som redan finns i datan — "omgång 14", "transferfönstret stänger", "fredag".

**Någon väntar:**
> {Förnamn} väntar på besked.

**Irreversibelt:**
> Det här går inte att göra ogjort.

**Säsongsavgörande:**
> Det som bestäms här bär hela våren.

**Inget av ovanstående:**
Ingen rad. Och då är eventet sannolikt inte pivotal — regeln är sin egen kontroll. Kan ingen av de fyra raderna sättas, ska vikten sänkas till normal.

Den sista punkten är den viktigaste: **"därför nu"-raden är inte dekoration på pivotal, den är kriteriet för pivotal.**

---

## Batch-av-tre

Stapel med räknare och ett aktivt i taget — godkänt. Två villkor:

**Räknaren visar hur många som väntar, inte hur långt man kommit.** `Två till efter den här` snarare än `1/3`. Det första säger vad som återstår, det andra ser ut som ett formulär.

**Ett pivotal-event får aldrig hamna i en batch.** Om ett dyker upp mitt i en stapel bryts stapeln och pivotal visas ensam. Annars är hela viktningen meningslös.

---

## Å7

Dubbelpaddingen är en mätbar bugg och byggs direkt: `shape: 'sharp'` sätter `padding: '10px 12px'` inuti `.card-sharp` som redan padder.

Granskas inline-beslut renderas som normal-vikt. Inget av dem är pivotal — de är rutinhändelser efter en match.

---

## Vad som byggs, i ordning

1. Å7:s dubbelpadding — bugg, ingen väntan.
2. Ambient-regeln: event utan val får ingen kort, blir `PortalBeat`-rad. Mekanisk, testbar.
3. Konsekvensmarkören enligt copyn ovan.
4. "Därför nu"-raden och pivotal-routing — **kräver att event är klassificerade**, alltså `O19`:s märkning plus `contentContract.ts`. Väntar.

Punkt 1–3 kan byggas nu. Punkt 4 är den som väntar på registret.
