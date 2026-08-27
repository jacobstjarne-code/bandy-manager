# Rapport: M10 — rotorsaken till 600ms-racet, innan fix

2026-08-26. Enligt din instruktion: rotorsak rapporterad innan jag rör koden.

## Vad som är SÄKERT (kodverifierat, inte gissning)

**Fyndet:** `src/presentation/screens/granska/GranskaScreen.tsx:139-144`, funktionen `handleChoice`:

```ts
function handleChoice(eventId: string, choiceId: string, choiceLabel: string) {
  playSound('click')
  setResolvedEventIds(prev => new Set([...prev, eventId]))
  setChosenLabels(prev => ({ ...prev, [eventId]: choiceLabel }))
  setTimeout(() => resolveEvent(eventId, choiceId), 600)
}
```

Kortet flippas till "besvarat" SYNKRONT (lokal `useState`), men den faktiska domänmutationen — `resolveEvent(eventId, choiceId)`, som är det som faktiskt tar bort händelsen ur `game.pendingEvents` och skriver `game.resolvedChoices` — sker först 600ms senare. Ingen `clearTimeout` vid unmount. Det här är den ENDA platsen i presentation/application-lagren som gate:ar en riktig domänmutation bakom en 600ms-timer (jag grep:ade igenom `src/presentation` och `src/application` — övriga 600-träffar är rena animationsfaser i matchminispelen, orelaterade).

**Vad H3-passet (senaste commiten, "pendingEvents-syskoninvarianten") redan friade:** `resolveEvent` självt är korrekt — testar syskoninvarianten (beforeIds − resolvedId = afterIds) i 5 kombinationer, alla gröna. Fyra andra misstänkta mekanismer undersöktes och friades med bevis. Den ENDA outredda tråden kvar var precis den här 600ms-timern — H3-commiten namngav den explicit men rörde den inte.

**Resolvern är säker mot dubbelanrop på samma eventId** (`eventResolver.ts:41-45`): hittas eventet inte längre i kön (redan borttaget) blir andra anropet en tyst no-op. Det betyder: risken är inte dubbel-effekt (t.ex. dubbel sponsorintäkt), risken är UTBYTE — ett senare anrop på samma eventId med ett ANNAT val kan vinna över det ursprungliga, tysta.

## Den bäst underbyggda hypotesen (INTE live-reproducerad — säger det rakt ut)

1. Spelaren svarar på sista obesvarade händelsen på Granska. `resolvedEventIds` flippar direkt → "KLAR — NÄSTA OMGÅNG →"-knappen blir klickbar OMEDELBART, långt innan den köade `resolveEvent` hinner köras 600ms senare.
2. Spelaren trycker KLAR inom det fönstret. `handleContinue` navigerar direkt till `/game/dashboard` — ingen spärr mot väntande timers.
3. GranskaScreen avmonteras. Timern från steg 1 är INTE avbruten och ligger kvar. `game.pendingEvents` innehåller fortfarande den "besvarade" händelsen, eftersom domänskrivningen inte hänt än.
4. `GameShell` renderar om för `/game/dashboard`. Överlagringsspärren mot `EventOverlay` är ruttscopead (bara `/game/review`), inte tillstånds-scopead — den vet inte att just den här händelsen redan "besvarats" optimistiskt. Om händelsen har `priority:'critical'` (flera Granska-hanterade typer har det, t.ex. `economicStress`/`criticalEconomy`/`playerUnhappy`/`mecenatEvent`) dyker den upp igen, helskärm, ovanpå den nyss laddade dashboarden.
5. Om spelaren interagerar med den återuppdykta rutan innan de ursprungliga 600ms passerat — troligt, den dyker upp nästan direkt efter skärmbytet och ser ut som en ny/brådskande fråga — kör `EventOverlay` sitt `resolveEvent` OMEDELBART (ingen delay där). Eftersom händelsen fortfarande fysiskt ligger kvar i kön lyckas det: applicerar valet spelaren råkade trycka på återuppdykningen, tar bort händelsen.
6. När den ursprungliga timern från steg 1 sen kör, hittar den ingenting — tyst no-op. **Spelarens FAKTISKA val (det de såg animera på Granska) tog aldrig effekt. Det som råkade tryckas på den återuppdykta rutan gjorde det istället.**

Kraschar inte, dubblar inget, lämnar saven internt konsistent (om än fel) — vilket förklarar varför en tidigare liveförlust inte går att återskapa i en skriven testkörning: det kräver en specifik interfoliering runt exakt 600ms-gränsen på en riktig enhet, inte bara "klicka snabbt två gånger".

**Vad jag INTE kunnat bekräfta:** jag har inte kört appen eller skrivit ett tajmnings-test — det här är spårat ur koden, inte observerat live. Jag har heller inte uttömmande verifierat exakt vilka händelsetyper som realistiskt ligger kvar i kön VID just det ögonblicket i ett riktigt spelförlopp.

## Ingen testtäckning finns

Sökte igenom `tests/visual/` och alla `__tests__`-filer efter dubbelklick/race/600ms-mönster: noll träffar. Ingen `GranskaScreen.test.tsx` existerar överhuvudtaget. Bekräftar auditens påstående.

## Föreslagen fix

**Resolva domänen synkront i `handleChoice`, skjut bara upp ANIMATIONEN — inte tvärtom.** Konkret: byt ordning så `resolveEvent(eventId, choiceId)` körs OMEDELBART (samma frame som klicket), och låt den 600ms-timern bara styra när kortets VISUELLA exit-animation spelas upp (`resolvedEventIds`/`chosenLabels` kan fortfarande vara kvar för att hålla kortet synligt under animationen — men domänskrivningen är redan klar). Detta tar bort racefönstret helt, istället för att lappa varje ställe som kan racea mot det (EventOverlay, dashboard-kort, etc). Samma mönster som `EventCardInline.tsx` redan delvis har (om än med samma bakvända ordning, 220ms — värt att fixa på samma sätt om du vill, men inte auditens M10-punkt).

Jag bygger detta nu, om du inte säger annat.
