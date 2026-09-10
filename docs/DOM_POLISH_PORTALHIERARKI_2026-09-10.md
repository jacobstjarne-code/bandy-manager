# DOM — Polish 2/5: Portalhierarki (godkänd)

**Datum:** 2026-09-10
**Från:** Opus (dom)
**Granskad mot:** `docs/incoming/HANDOFF-POLISH-2-PORTALHIERARKI.md` + `Polish-portalhierarki.dc.html`
**Rad:** `ci-en-primary-taktik-hierarki`s portal-syskon / polish-kö 2/5 (grundfynd: Grind 3, Portalen översköljs, kön → 44)

## Domen: godkänd, byggbar

Viktstegen T0–T4 (PortalBeat/Situation ambient → T1 primär enda CTA → T2 story andra rösten → T3 sekundärer recederar som grupp → T4 inkorg-rad) träffar grundfyndet: Portalen läste som en vägg när allt talade samtidigt. Fixen är vikt, inte nya komponenter.

Konsistent med primär-domen: T1 är enda ytan med gradient + kopparbård + CTA, och story-slot är andra rösten men aldrig andra knappen (vill story driva handling blir den T1 den omgången). Samma "en primär per yta"-regel som taktik och beslutskort — portalhierarkin ärver den, öppnar ingen ny.

Token-fixen är dokumenterad (§3): `--warm` (#8c6e3a, inget `--gold` finns), `--ice` för kall etikett, `--cold` för stripe, `color-mix` för ljusare varianter (inga påhittade `-light`). Code bygger mot verkliga tokens.

## Hållpunkten — pin T3-taket och inkorg-tröskeln lågt

Det här är där grind-fixen står och faller. Grind 3:s fel var kö-LÄNGDEN (44), inte stylingen. T4-inkorgen som en dämpad rad är rätt svar — kön blir en väg, inte en vägg. MEN §5 säger "överskott degraderas till T3 ELLER inkorg" utan att sätta T3-taket eller `N`. Om T3 är ocapat hamnar överskottet i en stapel uniforma T3-kort, och då är väggen tillbaka — bara tystare.

Så: sätt ett lågt T3-tak (t.ex. 2–3 sekundärkort som kort), allt därutöver → inkorgs-raden (T4), och `N` lågt (~3) så kön kollapsar tidigt. Att capa bara T1/T2 räcker inte; det är T3-taket + låg inkorg-tröskel som faktiskt hindrar att 44-kön bygger om väggen. Verifiera mot just det fallet: lång kö → en rad, inte en stapel.

## Byggbar

Code mot handoffen (§5) + den här domen: tier-klasser på befintliga Portal-block, enforce en T1 + en T2 + lågt T3-tak + inkorgs-rad när kön > ~3, verkliga tokens per §3. Ingen ny komponent, ingen baseline rörd.
