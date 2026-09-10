# DOM — Polish 5/5: SM-final-skarven (godkänd)

**Datum:** 2026-09-10
**Från:** Opus (dom)
**Granskad mot:** `docs/incoming/HANDOFF-POLISH-5-SMFINAL-SKARV.md` + `Polish-smfinal-skarv.dc.html`
**Verifierat mot kod:** ingen `SceneSeam` finns; `SMFinalPrimary` + `SMFinalVictoryScene` är två separata ytor utan övergång. Skarven är genuint obyggd — Codes c-sp5-avföring rörde inte den.

## Rättelse först

Jag avförde `c-sp5-smfinal-skarv` tidigare på Codes referat ("löst av senare C-SP5-fixar") utan att läsa koden — samma fel som med nudges. Kodläsningen visar att den kosmetiska gold-skarven aldrig byggdes. Mocken re-löser inget; den bygger något som saknas.

## Domen: godkänd, byggbar

Gold-överlämningen är rätt lösning och rätt motiverad. En cross-fade skulle låta steg 1:s gold-fyllning och steg 3:s gold-accent existera samtidigt mitt i övergången → två gold-språk → disciplinbrott. Överlämningen *förvandlar* fyllningen till accenten i stället för att duplicera den, så invarianten håller genom rörelsen: **exakt en gold-fylld yta, eller ingen, aldrig två** — inte bara i vila utan under hela svepet. Det är gold-disciplinen (R3+) applicerad på tid, inte bara på yta. Snyggt.

Timing speglar nedsläckningen (~260ms, samma cubic-bezier, `prefers-reduced-motion`-fallback) — konsistent med Polish 1. Tier-generaliseringen är en ren bonus: en `SceneSeam tier="final"|"semi"|"quarter"`, gold + illustration bara i finalen, koppar typografiskt för kvarts/semi, samma skarv-mekanik.

## Hållpunkter vid bygget

- **Wira bara smfinal/gradering-övergången nu.** `SceneSeam` byggs återanvändbar (den äger "gold-/koppar-CTA → scen"), men retrofit inte andra CTA→scen-övergångar i det här passet — det är ett polish-jobb, inte en global övergångs-refaktor.
- **Reduced-motion måste behålla invarianten.** Hård byte fill → accent är tillåtet (aldrig två fyllningar samtidigt); bara svepet hoppas, gold-accent-landningen behålls.

## Byggbar

Code mot handoffen §5: `SceneSeam` äger övergången, steg 1-CTA behåller sin gold-fyllning, svepet lyfter den till accent, scenen monteras accent-only (noll gold-fyllning). `final.jpg` som optional prop bara `tier="final"`. Ingen ny mekanik, ingen baseline rörd.
