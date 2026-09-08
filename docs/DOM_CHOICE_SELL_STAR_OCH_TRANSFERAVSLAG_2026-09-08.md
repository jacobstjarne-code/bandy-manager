# DOM — choice-sell-star-utan-spelare & choice-transferavslag-dold-moral

**Datum:** 2026-09-08 · **Av:** Opus · **Beställd av:** Jacob (sluttest-25-svepet) · **Källa:** RECON_CHOICE_LABEL_SVANS_2026-09-08, punkt 1 och 16.
Domarna fälldes i chatt men landade aldrig på disk — den här filen är hemvisten Code bygger mot. Filas som aktiva rader i reconcile.

## choice-sell-star-utan-spelare

**Beslut:** Dölj valet. (Inte ett inaktivt skenval.)

Ekonomikrisens fas 3 bygger `Sälj bäste spelaren` ovillkorligt via `bestPlayer?.id`; saknas säljbar icke-legendspelare är `removePlayerId` undefined och `eventResolver` kastar korrekt. Roten är generatorn.

- Generatorn i `economicCrisisService.ts` filtrerar bort säljvalet när ingen behörig icke-legendspelare finns.
- Brödtextens "tre/två vägar" härleds ur faktiskt antal kvarvarande val — aldrig hårdkodat.
- Tömt säljspår: texten erkänner klämman ("ingen att sälja") i stället för att lova ett spår som inte erbjuds. Ärlighetsregeln — inga falska vägar.
- Inget inaktivt/gråtonat skenval: ett val som inte kan tas motsäger ärlighetsregeln; frånvaro är renare än en död knapp.
- `eventResolver` rörs INTE — kastet vid saknat `removePlayerId` är en korrekt invariantvakt. Efter fixen når säljvalet den aldrig utan `removePlayerId`.

**Ägare:** Code. **Klar när:** säljvalet aldrig når resolvern utan `removePlayerId`, och brödtexten speglar faktiskt antal val.

## choice-transferavslag-dold-moral

**Beslut:** Deklarera konsekvensen. (Inte ta bort, inte lämna dold.)

`Avslå` visar bara `Spelaren stannar` men sänker moral `round(5 × transferRejectMoraleWeight)`.

- Avslå-valets undertext ändras: `Spelaren stannar` → `Spelaren stannar · risk för missnöje`. Kvalitativt, aldrig siffran (siffran gör scenen till ett kalkylblad).
- Mekaniken oförändrad — `round(5 × transferRejectMoraleWeight)` står.
- Skäl (svepets mönster): motiverade konsekvenser deklareras (spöksponsorn, punkt 14), omotiverade tas bort (ICA, punkt 15). Den här är motiverad — spelaren ville bort, du sa nej — alltså deklarera.
- Strängen `Spelaren stannar · risk för missnöje` är låst ordagrant (skrivuppgift, Opus). Wira exakt, ändra inte ordalydelsen.

**Ägare:** Code. **Klar när:** avslå-valet visar risken i undertexten och mekaniken står orörd.
