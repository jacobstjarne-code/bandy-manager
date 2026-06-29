# REVIEW — Prövningens processteg-mock (Opus → Design-Fable)

**Datum:** 2026-06-12 · **Mock:** `docs/incoming/2026-06-12_design_provning_processteg.html` (tre telefoner)
**Status:** GODKÄND med tre K-noter (inga blockerare — wiring kan börja, K-noterna åtgärdas i slutversionen).

## Starkt
- Stödmätaren löser regel 14 exakt: Georgia-värde + dimensionsrad med faktorerna som påverkat senast + STOD_LABELS-läsning kursivt. Ingen ny mätartyp — precis specens intent.
- Röstprogressionen syns: warm-voices (Birger/kafferum) i förankring → kommunalrådets cold-voice + Birger kvar varm i förhandling.
- Likvärdiga utvägar med kursiv konsekvensrad: egen nedläggning ≠ fall, §A resolution-copyn bär skillnaden rätt.
- Copy ordagrann ur TEXTPOOLER_PROVNING. Krav-checklist som severity-dots, bygget som cooldown-kanon. Allt enligt beställning.

## K-noter (åtgärda i slutversion)

**K1 — Kommunalrådets namn/parti får INTE hårdkodas.** Mocken visar "Gunnar Wessberg (C)". Politikern genereras i politicianService ur namnpool (Anna Lindgren, Erik Svensson, Lars Karlsson...) + slumpat parti + slumpad agenda. "Wessberg (C)" kan alltså aldrig stämma i ett faktiskt save. Detta är F2-fällan (påhittad fakta i platshållartext) — förlåtlig som mock-exempel, men handoff-noten MÅSTE säga: `{politician.name} ({politician.party})` interpoleras från localPolitician, aldrig hårdkodat. Annars riskerar Code skriva in exempelnamnet.

**K2 — "publiksnitt +12%" matchar inte mekaniken.** Specen (SPEC_MATCHHALL_PROVNING §3, krav 2): publiksnitt ≥ 3-årssnitt × 1,1 = +10%. Mocken visar +12%. Byt till "+10%" ELLER gör generisk ("publiksnitt — godkänt") så texten inte låser en siffra specen inte stödjer.

**K3 — decision-kortets stödmätare (lågprio).** Upprepningen längst ner i telefon 3 saknar hubbens dimensionsrad och konkurrerar med valet om fokus. Rekommendation: STRYK mätaren ur decision-kortet helt — kortet ska vara fokuserat på valet, mätaren bor i hubben. (Om den behålls: lägg till dimensionsraden för konsistens.)

## Wiring-klart
Trädet, Valet och processtegs-hubben kan wiras mot domänmodellen så fort den är byggd (Code §6 i CODE_UPPDRAG, efter svepet). K1–K3 påverkar bara slutversionens copy/layout, inte strukturen.

— Opus, 2026-06-12
