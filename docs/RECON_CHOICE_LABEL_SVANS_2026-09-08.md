# Recon: choice-label-svepets förlorade svans

**Datum:** 2026-09-08  
**Verifierad kod:** `852c6112`  
**Källa:** `CHOICE_LABEL_SVEP_2026-08-17.md`, särskilt `sluttest-25-delvis`

## Slutsats

Den ursprungliga oitemiserade listan går inte att återskapa ordagrant: de cirka tjugo agentfynd som aldrig skrevs till fil finns inte i git eller i rapporten. Den här reconen gör därför det enda sanningsenliga substitutet: den bygger en ny statisk katalog över dagens val och verifierar den namngivna rest som den bevarade rapporten faktiskt pekar ut.

Den nya katalogen innehåller **242 statiskt deklarerade val** i produktionskod. Dynamiskt konstruerade val och specialeffekter följdes därefter manuellt till sina resolvers och fokustester. Av den rekonstruerbara tjugopostssvansen är **17 undanröjda eller medvetet omformulerade** och **3 verkligt öppna**. Inget nytt produktionsfel göms bakom ordet "stale" nedan.

`sluttest-25-delvis` kan därmed stängas som recon-arbete, men de tre öppna resterna ska få egna rader. Att fortsätta kalla den för "cirka tjugo okända fynd" skapar bara en permanent, omöjlig arbetsorder.

## Punkt-för-punkt

| # | Ursprunglig/restfråga | Dagens status | Belägg |
|---:|---|---|---|
| 1 | `criticalEconomy/sell_star` erbjuds utan säljbar spelare | **ÖPPEN** | `economicCrisisService.ts` bygger fortfarande valet ovillkorligt och använder `bestPlayer?.id`; `eventResolver.ts` kastar korrekt om `removePlayerId` saknas. Roten är generatorn, inte resolvern. |
| 2 | Bandyplay som strukturell nettoförlust | **KLAR** | Systemet omdefinierades till streaming med synlig start-/driftsekonomi och sponsorkoppling; `sluttest-bandyplay-nettoforlust` är `klar` i MASTER. |
| 3 | Kioskens dolda break-even | **KLAR** | Ekonomiytan visar brytpunkten; `sluttest-kiosk-breakeven` är `klar`. |
| 4 | `kommunens_villkor`: två byte-identiska skenval och oläst finansiering | **STALE/LÖST** | `hallProcessService.ts` har nu ett enda verkligt kommunval som skriver `finansiering:'kommun'`, startar bygget och bär kanonisk klubbkostnad; `hallProcessTruth.test.ts`. |
| 5 | `politician_savings/comply` lovar kommunbidrag utan effekt | **KLAR** | Valet ger `politicianRelationship +8` och `kommunBidragChange +5000`; `politicianEventTruth.test.ts` verifierar verkligt årsdelta. |
| 6 | `patron_ignored/apologize` lovar fel patronmätare | **KLAR** | Texten säger nu tålamod och `patronInfluence`-resolovern lägger `value` på `goodwill`; `patronInfluenceTruth.test.ts`. |
| 7 | `detOmojligaValet/keep` lovar ospårat licensproblem | **KLAR** | Den falska licensklausulen är struken. Testet kräver kassa oförändrad, CS/fanMood och att spelaren stannar; `detOmojligaValetSell.test.ts`. |
| 8 | `community_anlaggning/renovate` saknar pengar/facilities | **KLAR** | `multiEffect`: −25 000 kr och +15 facilities; `renovateWaitEffects.test.ts`. |
| 9 | `community_ismaskin/repair` saknar kostnad | **KLAR** | `multiEffect`: −15 000 kr och +5 facilities. `postpone` använder den äldre `tempFacilities:-1`-skalan, vars resolver betyder −5 facilities, i linje med texten. |
| 10 | Risk­sponsorns exponering lovar följder men gör inget | **KLAR** | `applyRiskySponsorMaturation` tar bort sponsorn, räknar clawback, sänker communityStanding och rensar kontraktet; `sponsorProcessorRiskyMaturation.test.ts`. |
| 11 | Mecenatens sociala ja lovar en okodad träningsdag | **KLAR** | Falska löftet är struket; valet lovar och ger endast +15 relation; `mecenatSocialBudget.test.ts`. |
| 12 | SilentShout lovar mecenatfinansierad transfer | **KLAR** | Finansieringslöftet är struket; valet visar och ger +10 relation; `mecenatSocialBudget.test.ts`. |
| 13 | Mecenatalliansen lovar projektfinansiering | **KLAR** | Kropp/undertext lovar inte längre pengar; valet ger +10 relation på båda; `mecenatSocialBudget.test.ts`. |
| 14 | Spöksponsorn lägger in dold permanent styrelseledamot | **KLAR** | Undertexten deklarerar nu `ny styrelseledamot`; `spoksponsorTruth.test.ts` verifierar pengar, CS och riktig `BoardMember`. |
| 15 | ICA-besöket lottar dold spelarmoral | **KLAR** | Den dolda specialeffekten är borttagen; valet ger exakt +5 tkr/+2 CS; `icaMaxiEventTruth.test.ts`. |
| 16 | Transferbudets `reject` säger bara att spelaren stannar men sänker moral 2–13 | **ÖPPEN — PRODUKTDOM** | `eventFactories.ts` visar fortsatt `Spelaren stannar`; `eventResolver.ts` applicerar fortsatt `round(5 × transferRejectMoraleWeight)`. Mekaniken är riktig och dokumenterad, men UI berättar inte om den. Jacob/Design behöver döma synlig risk kontra avsiktlig överraskning. |
| 17 | Julmarknaden kallas kostnad trots +8 tkr netto | **STALE/LÖST** | Undertext `+8 tkr netto`, state +8 000; `sluttest-julmarknad` är stängd. |
| 18 | Ekonomikrisens `ask_mecenat` erbjuds utan mecenat och kostar ingen lojalitet | **KLAR** | Generatorn kräver aktiv mecenat, väljer den med högst happiness och sparar mål-id/−30; resolvern applicerar både +200 tkr och −30; `economicCrisisAmbientAndAskMecenat.test.ts`. |
| 19 | `weeklyDecisionService` ligger utanför EventChoice-instrumentet | **ÖPPEN — TEKNISK VAKT** | Alla dagens 14 id:n har explicita resolvergrenar och centrala premisser kastar högt. Men `WeeklyDecision.id` är fortfarande fri `string` och `resolveWeeklyDecision` har `default → noop`; ett framtida nytt id kan därför bli en tyst no-op. Bygg exhaustiv id-typ eller en parity-grind mellan pool och resolver. |
| 20 | `varsel/offer_pro` sätter lönen till 0 | **KLAR** | Fabriken använder nu `Math.round(p.salary * 1.5)` och dedikerade tester verifierar aldrig noll samt verkligt högre lön; `varselOfferProSalary.test.ts`. |

## Tre egna MASTER-rader

### `choice-sell-star-utan-spelare`

**Ägare:** Jacob/Design → Code efter dom.  
**Beskrivning:** Fas 3 i ekonomikrisen erbjuder `Sälj bäste spelaren` även när ingen icke-legendspelare finns. Resolvern kastar då avsiktligt eftersom `removePlayerId` saknas.  
**Minsta dom:** dölj säljvalet och skriv om brödtextens "tre/två vägar" efter faktiskt antal val, eller visa ett sant inaktivt val. Ingen resolver-bryggfix.

### `choice-transferavslag-dold-moral`

**Ägare:** Jacob/Design.  
**Beskrivning:** `Avslå` visar bara `Spelaren stannar`, men sänker spelarens moral med ett dynamiskt spann.  
**Domfråga:** ska valytan åtminstone säga `Spelaren stannar · risk för missnöje`, eller är reaktionen en avsiktligt dold efterkonsekvens? Mekaniken ändras inte utan dom.

### `choice-weeklydecision-exhaustiveness`

**Ägare:** Code.  
**Beskrivning:** dagens fjorton weekly decisions är implementerade, men typ-/resolverkontraktet är öppet och har en tyst `default → noop`.  
**Rekommenderad fix:** gör id-mängden sluten och resolver-switch exhaustiv, eller bygg ett test som kräver exakt samma id-mängd i `makeDecisions` och `resolveWeeklyDecision`. Behåll avsiktliga per-val-`noop`; förbjud bara okända besluts-id:n.

## Avgränsning och varningsplikt

- **Såg:** dagens statiska katalog har 242 val; de tjugo namngivna resterna ovan har följts till aktuell kod och tester.
- **Kan inte återfås:** exakt vilka cirka tjugo rader de ursprungliga tre agenterna hade i sin förlorade output. Att påstå en ordagrann rekonstruktion vore fabricerat.
- **Inträffade inte är inte kan inte inträffa:** katalogen bevisar struktur, inte sannolikheten att varje val nås i en vanlig karriär.
- Den här reconen ändrar ingen produktmekanik. De tre öppna posterna är separerade för nästa pass i stället för att döljas i paraplyraden.
