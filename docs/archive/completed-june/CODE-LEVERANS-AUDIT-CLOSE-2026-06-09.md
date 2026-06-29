# CODE-LEVERANS — Audit-stängning (modaler + frivillig-moral)

**Datum:** 2026-06-09
**Stänger:** AUDIT-KLUBB-TRANSFERS — de två sista besluten (Del 1 §3 / Del 2 §5 #10 + Orten moral-fynd). Allt annat är implementerat.
**Advisor:** struken — advisor-tool är en API-beta som inte är tillgänglig i Claude Code (se FABLE-ADVISOR-LOG.md). Kör denna leverans normalt.

## A. Bid/Renew-modaler → ledger-vokabulär
`BidModal` + `RenewContractModal` får LedgerFrame-språket: perforerad marginal + stämpel-CTA ("Lägg bud →" / "Förläng →") så de känns som kontraktspapper. **Applicera den BEFINTLIGA LedgerFrame-vokabulären/komponenterna — ingen ny design.** Transfers-listorna stannar som dashboard (utanför LedgerFrame). Bara de två modalerna rörs.

## B. Frivillig-moral följer pulsen
Ingen ny "uppmuntra"-knapp. `volunteerMorale` ska drifta mot `communityStanding` (pulsen) varje omgång i stället för att vara en fristående orphan-siffra. Hitta där `updatedVolunteerMorale` sätts (`communityProcessor`) och låt den röra sig mot puls — samma drift-mönster som CS→60 mean reversion i roundProcessor (`DRIFT_STRENGTH`-stil), fast målet är `communityStanding`. Frivillig-moralen blir då en avläsning av bygden, inte en mätare utan spak.

## INTE röra
Transfers-listorna (dashboard). Patron/mecenat. Ekonomi-community-aktiviteterna (separata). scheduleGenerator, matchCore.

## Acceptans
- BidModal + RenewContractModal har ledger-ram + stämpel-CTA; listorna oförändrade.
- `volunteerMorale` rör sig mot `communityStanding` över omgångar; ingen ny knapp.
- `npx tsc --noEmit` + test rena.

**Rapportera per punkt.**

---

**Till Code (Sonnet, VS Code):**

Läs `docs/CODE-LEVERANS-AUDIT-CLOSE-2026-06-09.md` och implementera. Detta stänger Klubb/Transfers-auditen.

**Metod:** läs `BidModal`, `RenewContractModal`, samt befintlig LedgerFrame-komponent/vokabulär i kontext först. För B: spåra var `volunteerMorale` sätts i `communityProcessor`. Visa kod.

A. Ge `BidModal` + `RenewContractModal` LedgerFrame-språket (perforerad marginal, stämpel-CTA). Befintlig vokabulär, ingen ny design. Listorna orörda.
B. `volunteerMorale` driftar mot `communityStanding` per omgång (CS-mean-reversion-mönstret, mål = communityStanding). Ingen ny knapp.

**Rör INTE:** Transfers-listorna, patron/mecenat, Ekonomi-aktiviteterna, scheduleGenerator, matchCore.

**Klart =** två modaler med ledger-ram + stämpel · volunteerMorale följer puls · tsc + test rena.

**Rapportera per punkt.**
