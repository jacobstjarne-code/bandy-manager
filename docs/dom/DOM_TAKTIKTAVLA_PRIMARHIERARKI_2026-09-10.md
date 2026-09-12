# DOM — Taktiktavlan: primär-hierarkin (1a)

**Datum:** 2026-09-10
**Från:** Opus (dom) — Jacob ratificerar
**Underlag:** `docs/incoming/HANDOFF-TAKTIKTAVLA-VIKTNING.md` + `Taktiktavla-viktning.dc.html` (Design)
**Rör:** Förbered → Taktiktavlan. Raderna `sluttest-a8-viktning` + `ci-en-primary-taktik-hierarki`.

## Domen: 1a — assistenten bär primären

Kopparn ligger på **"✓ Följ assistentens råd"**. **"Ställ upp bäst för dagens match"** blir outline-genväg (kvar, men tyst). Inte 1b.

### Varför

1. **Konsistens.** Assistenten är redan rösten på Portal, i kafferummet och i pärmen. Taktikens primär ska vara samma röst, inte en min-max-knapp bredvid den. 1b degraderar rösten till en textlänk och gör assistenten till ett verktyg — mot allt spelet byggt runt en tränarröst som bär.
2. **Identitet.** Spelets tes är liggaren, minnet, berättaren — inte optimering. Att lyfta "auto-optimera bästa XI" till primär (1b) sätter mätbar optimering överst, fel signal för ett spel vars poäng är att det är en historia, inte ett kalkylblad.
3. **Riskasymmetri.** 1a:s risk (en van manuell-optimerare tycker rådet tar plats) är liten och redan dämpad — den manuella vägen finns kvar som outline-genväg, ett tryck bort. 1b:s risk (rösten tystnar) är strukturell och träffar spelets kärna.

## Det ceremoniella registret — låst (§3)

Skärmstängaren **SPELA OMGÅNG →** (`.btn-cta`) är INTE en in-content-primär. In-content-primären är **flat koppar** (`--accent-dark`); CTA:n är **koppargradienten** (`#DD9555 → #8B4820`). Två register, inte två primärer — det är mekaniken som får DS §5 ("en primär per skärm") att hålla, och den godkänns härmed som princip.

Samma princip legitimerar beslutskort-briefens rad 2: scenens Georgia-pilknapp är tillåten som ett tredje, dokumenterat ceremoni-register, precis som `.btn-cta` här. Ingen ny dom krävs där — den ärver den här.

## Portal-slotten (§4) — ärver, ingen egen dom

"En primär per skärm" på Taktik och "ett kort vinner primärslotten" på Portal är samma regel. Portal-sidan är redan avgjord i `DOM_BESLUTSKORT_PRIMARREGEL_2026-09-08`: rangordningen ligger i `initCardBag`-vikterna (SM-final 100 > deadline 90, avsiktligt), och R2-diffarna (`primary-event-vs-farewell`, `primary-smfinal-vs-deadline`) var reseed-artefakter. Taktik-domen sätter principen; Portal ärver den. Ingen ny primär-dom öppnas.

## Implementation (Code, efter Jacobs nick)

- Ingen ändring av SVG-planen (280×400) eller viktnings-spakarna (Mentalitet · Tempo · Press med konsekvens-rader). De är klara.
- Exakt en kontroll får `.btn-primary` (flat koppar): "✓ Följ assistentens råd". Den andra, "Ställ upp bäst för dagens match", får `.btn-outline` — kvar som genväg, tyst.
- `.btn-cta` (SPELA OMGÅNG →) orörd.
- Ingen visuell baseline rörs innan bygget.

## Kvar för Opus

Copy-nyans om outline-genvägens etikett behöver skärpas när Code wirar; annars ingen text. Assistent-citatet och konsekvens-raderna är redan låsta.
