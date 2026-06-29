# FABLE-BRIEF — Orten-fliken, omdesign (densitet + IA)

**Till:** Claude Design (kör på Fable 5)
**Källa:** AUDIT-KLUBB-TRANSFERS-DEL2-2026-06-09.md §2 (Orten — "tätast i hela spelet")
**Yta:** `/game/club` → Orten-fliken (komponent `KlubbTab` + `OrtskartanMap`)
**Status:** LEVERERAD — mock `docs/incoming/2026-06-09_design_orten_recut.html`. Arkiverad för spårbarhet.
**Typ:** Kompositions-omdesign, inte token-städning.

## Kontext & ram
Åtta sektioner + kartan + ~13 progress-barer på en skärm. Orten ligger utanför LedgerFrame. Standard Club-skärm-krom: GameHeader-masthead + Club-flikrad. Rör inte flikraden (tvärdomäns-TabBar-refaktorn är separat Code-uppgift).

## Bevara — rör inte
OrtskartanMap — nod-grafen med Ortenpuls i mitten. Spelets enda visualisering av bygden som nätverk. Bantningen sker runt kartan, inte i den.

## Låsta beslut
1. Progress-bar-differentiering: bara actionable/föränderliga får full bar; statiska sub-värden → kompakta siffror/samlad rad. ~13 → ~4–5.
2. Gold-token bort från Frivilliga-siffrorna (guld = final/mästare).
3. "Neutral"-status döljs (visa tagg bara när relationen rör sig).
4. Lyft kommun-raden (Bjud in / Budget / Bidrag).
5. Säsong = "2026/27" via seasonSpanLabel.

## IA-frågor (rek, kräver kod-verifiering)
6. Engagemang-knapparna: min rek var flytta inkomst-aktiviteter till Ekonomi. UTFALL (Fable, kodgrundat): raderna påverkar bygdens puls, inte inkomst — INTE samma system som Ekonomi → stannar i Orten, med effekt + kostnad synligt (+0.4 puls · 2 tkr).
7. Anläggning: Orten äger, Akademi read-only.

## Output
- `docs/incoming/2026-06-09_design_orten_recut.html`
- OrtskartanMap bevarad. DESIGN-DECISIONS-not med före/efter.

## Fable-fynd utöver redesignen (relä till Opus/Code)
1. Kartan bar ingen info → noder fick status-prickar + subrader (nivå, antal, nästa val). Kartan blir rangordningen i sig.
2. Kommun-agendan var dold mekanik → hint-rad kopplar agendan till spelarens handlingar ("Bandyskolan räknas").
3. Frivillig-moral utan spak (Kjell 31, inget att göra) → föreslår "uppmuntra"-handling eller moral följer puls.
4. Patron/Mecenater = två system för samma fantasi → se CODE-LEVERANS-PATRON-MECENAT (beslut B: differentiera).
5. Styrelseuppdrag "I fara" borde eka på Portalen. Puls fick trendpil.

— Opus, 2026-06-09
