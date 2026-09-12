# Rapport: sjätte mätningen (punkt 4) + statuskoll på resten av listan

2026-08-25. Punkt 4 kört först, enligt order. Tre av de fyra punkterna visade sig redan klara.

## Punkt 4 — sjätte mätningen: standardkörning, communityStanding orört

Samma script (`h4-alla-tolv-avskedsfrekvens.ts`), oförändrat, communityStanding lämnad på sitt naturliga default (50) genom hela karriären — ingen manipulation, ingen optimering. Resultat **byte-identiskt** med körningen precis före publikfixet:

| Klubb | Före fix | Efter fix, passiv spelare (denna mätning) |
|---|---|---|
| Heros | 100% | **100% — oförändrat** |
| Rögle | 100% | **100% — oförändrat** |
| Slottsbron | 95% | 90% |
| Skutskär | 85% | 80% |

**Svaret på din fråga: en spelare som INTE optimerar orten får exakt samma öde som innan fixet fanns.** Kontraktet är inte för hårt i meningen "skadar passiv spel" — det gör helt enkelt ingenting för passivt spel. Räddningen är opt-in, inte ett golv som lyfter alla.

**Extra körning, för att svara fullständigt (inte beställd, men frågan krävde den för ett komplett svar):** var ligger brytpunkten? Testade Heros vid communityStanding 50/60/65/70/75/80, 20 seeds:

| communityStanding | Avsked |
|---|---|
| 50 | 100% |
| 60 | 100% |
| 65 | 100% |
| 70 | 95% |
| **75** | **5%** |
| 80 | 5% |

**Det är inte en gradient — det är en klippa mellan 70 och 75.** Under tröskeln räddar engagemang nästan ingenting; över den räddar det nästan allt. En spelare som anstränger sig måttligt (communityStanding 60-70, rimligt för normalt spel utan att medvetet maxa community-fliken) får INGEN belöning för ansträngningen — bara den som pressar ända till ~75 ser effekt. Om det är rätt känsla (allt-eller-inget, "orten kommer eller kommer inte") eller om det borde vara en jämnare kurva är ett designval, inte rapporterat som fel — men det är inte den mjuka "mer engagemang → bättre läge"-kurva formeln såg ut att ge på pappret innan den mättes.

## Statuskoll på resten av listan — tre av fyra redan klara

**SPÅR B:** fortfarande fullt byggt (`getNextOpponentTeaserFacts` finns i `nextOpponentTeaserService.ts`, verifierat igen). Ingen ny build behövs.

**Förutsättningsfasen steg 1 — routingfrågan direkt besvarad:** `BoardTalksSection` (ordförandeband+kvittensrad+kravband) sitter i `SeasonTransitionScene.tsx` (Sommaren-routen), rad 156 — direkt mellan "Medan du var borta"-sektionen (rad 141) och "Styrelsen har satt nya mål"-sektionen (rad 163). Verifierat igen, oförändrat sedan det byggdes.

**README i incoming:** rättad, säger redan uttryckligen att de två Designfrågorna INTE är öppna.

**Slutsats: inget av dessa tre kräver arbete.** Väntar på din bekräftelse eller nästa steg innan jag rör dem igen — annars är listan nedskalad till bara punkt 4 (nu besvarad) och AST-grind-rapporten (separat, kommer).
