# DOM — beslutskortens primär-regel (tre beslut)

**Datum:** 2026-09-08 · **Av:** Opus · **Beställd av:** Jacob (beslut a/b/c) · **Grund:** GPT:s `Beslutskort-brief.dc.html` (konsolidering, källpekad mot `CODE_DECISION_CARD_KONSOLIDERING_2026-06-20` + `DecisionCard.tsx`/`DecisionChoices.tsx`/`SceneChoiceButton.tsx`), `DESIGN-BRIEF-BESLUTSKORT-2026-09-08`. Stänger de tre raderna `decisioncards-likriktning`, `design-p4-brytpunkt-knappar`, `design-d4-primary-utspadd` som EN primär-regel. GPT:s skärpning var rätt: det var inte tre ritningar, det var tre beslut.

## a) När visas kopparknappen (fylld primär)

Kopparknappen visas ENDAST på asymmetriska val med reell konsekvensskillnad — ett val som faktiskt väger tyngre. Symmetriska val (två likvärdiga vägar) → all-outline, ingen koppar. Signalen ska betyda något; visas den överallt dör den. Frånvaron var redan löst (symmetriska → outline); det här låser närvaron.

## b) Knappspråk

`.btn`-vokabulären är standard överallt. Scenernas Georgia-pilknapp (`SceneChoiceButton`) behålls som det ENDA medvetna ceremoni-undantaget — scenerna är ett annat register (Sture-Forsbacka-högtid), och att tvinga in dem i `.btn` plattar det. Dokumenterat här som undantag. Inga andra knappspråk-undantag får smyga in; är det inte en scen är det `.btn`.

## c) Primär-rangordning — en primär per yta, alltid

Ingen yta visar två primärer samtidigt.
- **Taktik:** primär-hierarkin (Följ rådet vs Bäst för dagens match) avgörs i `DESIGN-BRIEF-TAKTIKTAVLA-VIKTNING-2026-09-08` uppgift 2 — en bär huvudtrycket, den andra tonas ner.
- **Portal:** primär-slotten är REDAN rangordnad i kod via `initCardBag`-vikterna (SM-final 100 > cupfinal 98 > `transfer_deadline_close` 90 > derby 80 > patron 70 > spectator 50 > next_match 10). Ingen ny rangordning behövs — SM-finalen vinner redan över transfer-deadlinen, avsiktligt (mästerskapet är största ögonblicket). CI-R2:s `primary-event-vs-farewell` och `primary-smfinal-vs-deadline` var RESEED-ARTEFAKTER (abs-säsongsetiketten böt vilken trigger som fyrade i dev-scenen), inte regressioner i hierarkin. Läst i `initCardBag.ts` 2026-09-08 — vikterna står. RÄTTELSE: tidigare formulering "actionable händelse > farewell / deadline > smfinal" var fel, den motsade den medvetna viktordningen.

## SKYDDAT / ägarskap

Ingen visuell baseline rörs förrän domen (nu fälld) implementerats. Design mockar a + b (kort-form + knappvikt + ceremoni-undantaget) per `DESIGN-BRIEF-BESLUTSKORT`. Code wirar alla tre + Portal-rangordningen (c) efter Designs mock. Opus: denna dom. Jacob: besluten givna.
