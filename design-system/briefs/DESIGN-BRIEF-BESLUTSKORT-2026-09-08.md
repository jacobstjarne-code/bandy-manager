# DESIGN-BRIEF — beslutskorten: enhetlig form + knappviktshierarki

**Datum:** 2026-09-08 · **Av:** Opus · **Kör:** Design · **Bygger:** Code efter dom · **Grund:** `decisioncards-likriktning`, `design-p4-brytpunkt-knappar`, `design-d4-primary-utspadd` (MASTER), `DecisionChoices.tsx`. Konsoliderar tre relaterade rader — MASTER säger uttryckligen "ta i ett svep".

## Problemet (kodläst)

Beslutskorten har olika visuell tyngd utan systematik, och knapparna är IDENTISKA i vikt även när valen skiljer sig i art (notis vs dilemma vs brytpunkt). Knapp-copyn är generisk ("Välj den ena/andra vägen"). Konsekvensfälten FINNS i modellen (`consequenceLevel`, `costLabel`, `irreversible` — i `economicCrisisService.ts:162`, `communityRenewalService.ts:290`) men bär ingen visuell signal i UI:t. Brytpunkten eskalerar idag bara via en vänsterstripe; knapparna följer inte med.

## Uppgift

1. **Enhetlig kort-anatomi.** Alla beslutskort samma grundform (rubrik · kropp · val), så de läser som EN familj oavsett vilket system som skickade dem. Idag varierar de godtyckligt.
2. **Knappviktshierarki.** Primärvalet bär mer visuell vikt än de sekundära. Ett oåterkalleligt eller dyrt val (`irreversible`/`costLabel`/`consequenceLevel`) får en visuell markör — inte bara text i kroppen, utan något ögat fångar innan man trycker.
3. **Eskaleringssignal på knapparna, inte bara stripen.** Notis < dilemma < brytpunkt ska synas i kortets och knapparnas vikt. Vänsterstripen finns; låt knapparna eskalera med den.

## Behåll / gräns

- DS-tokens och befintlig grundstruktur. Ingen ny copy i den här briefen — om knapp-copyn ("Välj den ena/andra vägen") ska bytas är det en Opus-textuppgift, flagga den separat.
- Ingen visuell baseline rörs förrän Design dömt och Code wirar mot domen.

## Ägarskap

Design: rita enhetlig kort-form + knappviktshierarki + eskaleringssignal mot de tre punkterna. Code: wirar efter domen, inga baselines rörda dessförinnan. Opus: ev. ny knapp-copy om Design ber om den. Jacob: gav go 2026-09-08.
