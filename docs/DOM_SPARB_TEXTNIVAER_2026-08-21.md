# DOM — SPÅR B: TEXTNIVÅERNA SOM DS-KANON

**Datum:** 2026-08-21 · **Av:** Opus · **Post:** 37 i `SLUTTEST_KO.md`
**Underlag:** `incoming/SPAR-B-TEXTNIVAER-SVITKORT-FRAMATKROK-2026-07-20.md` (Design),
WRITING_GUIDELINES DEL 8, D1-eventviktningen (KLAR), GRIND1 v3, Skutskär-auditen 2026-08-20.

---

## B5 · De fyra textnivåerna — GODKÄND som DS-kanon

Fyra `.txt-`-klasser (`beslut / konsekvens / karaktar / atmosfar`) enligt Designs
formregler, in i `global.css`. Vikten sitter i position + kontrast + storlek, aldrig
i en extra mening.

**Precisering 1 — en viktkanon, inte två.** D1:s eventviktning (pivotal/normal/
ambient) och B5:s textnivåer är samma hierarki på två plan och mappas fast:
pivotal ↔ nivå 1 (beslut), normal ↔ nivå 2 (konsekvens), ambient ↔ nivå 4
(atmosfär). Nivå 3 (karaktär) är ingen egen viktnivå — det är en RÖST som kan bära
nivå 2–4 men aldrig nivå 1: ett beslut talar aldrig i citat. Ett event på D1-nivå X
får aldrig textform från en högre B5-nivå.

**Precisering 2 — textauditen får en femte domkategori: VIKT.** Protokollet dömer i
dag sanning och ton. Efter första nivåpasset kan en rad dömas för att stå på fel
nivå (atmosfär i beslutsform, beslut utan beslutsform). Domen är alltid ett
klassbyte, aldrig en tillagd mening.

## B4 · Svitkortet — GODKÄND: funktionären, skild från signaturen

Designs röstval står: funktionären, inte journalisten, aldrig tränaren. Skutskär-
auditen (20 aug) bekräftar registret live — kassörens röst (Birgit/Bertil) höll
mellan ytor och godkändes. Rösten finns; kortet ger den en yta till.

**Koppling till GRIND1, bindande:** svitkortet är den SYNLIGA delen av den löpande
boardPatience-termen — det svar textytan ger på Skutskär-auditens High 1
("trenden ska synas under säsongen"). Kortet och patience-zonen läser samma
`consecutiveLosses` ur `trainerArcService` — aldrig en egen tröskel, aldrig en egen
räknare. Förlusttröskeln är crisis ≥3 (finns); segersvit-tröskeln sätter Code
symmetriskt ur samma winning-detektion.

De tre särskiljningsdragen mot `season_signature_card` (form-rutor, transient
topp-stripe, funktionärscitat) godkänns som Design skrivit dem.

## B3 · Framåtkroken — GODKÄND: sist i Granska, nivå 2–4, aldrig nivå 1

Placeringen (sista blocket ovanför CTA:n) och vikten (konsekvens + atmosfär,
is-tonad, ingen pil, ingen kopparfyllning) godkänns. Sidfoten behåller den enda
avanceringen.

**Gate, ur Skutskär-auditens High 3:** kroken renderas ENDAST när en nästa match
för managerklubben faktiskt existerar. Efter slutspelsuttåg, säsongsslut eller
avsked: ingen krok. Auditen såg en omvärldsrad påstå att Västanfors väntade borta
efter att klubben slagits ut — kroken får aldrig ärva den felklassen.

## Ordning

1. Code: `.txt-`-klasserna (B5) i `global.css` + nivåmappningen mot D1.
2. Code: B4-kortets form + B3-wiring (datat finns i `getNextOpponentTeaserFacts`
   respektive svitdetektionen).
3. Fable: funktionärens svitrepliker (segertyst/förlusttyst) + krokmallen
   ("Nästa: {opponent} {hemma/borta}. {form-mening}.") i ETT pass när formerna är
   låsta.
4. Textauditens VIKT-kategori aktiveras efter första nivåpasset.

## Godkänd när

En spelare kan hitta beslutet i en fyraradersbriefing utan att läsa alla fyra
raderna — och textauditen kan döma en rad för fel vikt utan att citera en enda
extra mening.
