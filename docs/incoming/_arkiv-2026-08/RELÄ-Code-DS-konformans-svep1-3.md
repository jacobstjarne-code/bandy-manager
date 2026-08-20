# RELÄ TILL CODE — DS-konformans, svep 1–3 (samlad ingång)

Källdrivet, 2026-07-02/03. Bara det som är beslutat/verifierat och redo att röras.
Öppna frågor + rena PASS utelämnade. Full kontext: `Överlämning/Audit - DS-konformans svep 1–3`.

Legend: 🟢 mekaniskt · 🟠 domslut fattat · 🔴 verifiera först

---

## 🟢 C1 · Exakta token-matchningar hårdkodade → var()  (svep 1)
- JournalistSecondary:35/37  `rgba(74,102,128)` → `--cold`
- PortalAnniversaryMark:75-77 `rgba(232,185,92)` → `--gold`  (andra grenen använder redan token)
- StillnessSection:136        `rgba(232,185,92)` → `--gold`
Find/replace till `color-mix(in srgb, var(--token) X%, transparent)`. Ingen visuell förändring.

## 🟠 C2 · Guld enas till två tokens — DOMSLUT FATTAT (ratificerat 2026-07-02)  (svep 1)
Två avsiktliga guld: `--gold` (#E8B95C, ceremoni) + `--match-gold` (#D4B860, LED-tavla).
- NextMatchCard:123-181 `#C4A84C` → `--match-gold`  (+ warn/positive-kluster → `--match-warn` / `--match-positive`)
- SM/CupFinalVictory + SeasonSignatureReveal `#D4A460` → `--gold`
Efter detta: exakt två guld, båda tokens. NextMatchCards `headerTagStyle` (se C5) löses i samma drag.

## 🟢 C3 · Radie-drift → token / kanon  (svep 1)
- Piller → `99` överallt (byt 16/20 i Granska/History/SeasonSummary)
- Kort → `var(--radius-md)` (byt rå 8 / magiska 10 / 7 i SquadScreen, SeasonSummary, GameOver, IntroSequence, InboxScreen:326)
Inga nya tokens.

## 🟢 C4 · Sub-8px-etiketter → 8 / .h-micro  (svep 2)
- GranskaOversikt:655 (7) · NextMatchCard:54 (7)
- MatchLaddningScene:190/197 (7.5) · FinalIntroScreen:187/195 (7.5)
Höj till 8 eller `.h-micro`. 7.5-paren är identiska "Serien/Slutspelet"-etiketter i de två
final-uppspelen → de-duplicera samtidigt (samma rot som C-SP5).

## 🟠 C5 · Handrullade taggar → tag-* varianter  (svep 3)
- PlayerCard:761/789 (form) + AkademiTab:231  inline success/ice → `tag-green` / `tag-ice`
- NextMatchCard:257 headerTag → löses med C2
Trait-taggarna (PlayerCard:381-386) avvaktar Design — se D1. Form/akademi kan lyftas nu oavsett.

---

## 🔴 V1 · HalfTimeSummaryScreen — två btn-primary (VERIFIERA)  (svep 2)
Rad 41 (`btn-primary`) + rad 162 (`btn-cta btn-primary`). Olika render-grenar (syns aldrig
samtidigt) = PASS. Samtidiga = degradera rad 41 → `btn-secondary`. En rad att inspektera.

## 🔵 D1 · Trait-emoji + tag-trait-varianter → DESIGN (avvaktar)  (svep 3)
PlayerCard trait-taggar bär 🔥🎭🦁🎓🏅🏘️ (utanför emoji-kartan) + inline-färg. Design avgör
om traits ratificeras som namngivet undantag + eget `tag-trait-*`-set. Blockerar inte C1–C5.

---

## Föreslagen batchning
- **PR-A** — mekaniskt: C1 + C3 + C4. Noll visuell risk, ingen designgranskning.
- **PR-B** — guld + taggar: C2 + C5. Öga-granska tinter; guld-domslutet är låst (bygg, ej diskussion).
- **CHECK** — V1 när HalfTime ändå är öppen. D1 väntar på Design, koppla inte.

Logga avbockade punkter i BACKLOG CHANGELOG.
