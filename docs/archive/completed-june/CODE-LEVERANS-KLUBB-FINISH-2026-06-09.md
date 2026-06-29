# CODE-LEVERANS — Klubb-domänen, slutpass (audit-rester)

**Datum:** 2026-06-09
**Källa:** AUDIT-KLUBB-TRANSFERS Del 1 + Del 2, konsoliderad åtgärdslista. Stänger Klubb-domänen.
**Bakgrund:** Orten-redesign · TabBar · CSS (squad/tabs/transfers) · patron/mecenat — klara. Masthead-🟥 = falskt positivt (GameHeader läser redan `seasonSpanLabel`). Detta tar kvarvarande Klubb-item. Transfers Scouting-listan + två öppna designfrågor (modaler→ledger, moral-spak) ligger kvar separat.

## Del 1 — Synliga/funktionella (låsta beslut)
1. **Anläggning → en ägare (Akademi read-only).** [Del2 §1.4/§5] Orten äger anläggningen (satt i Orten-redesignen). I `AkademiTab`: gör anläggnings-raden read-only — visa nivån, ta bort upgrade-knappen där, ev. liten "Uppgraderas i Orten"-hänvisning. Ingen dubbel-uppgradering.
2. **Akademi stjärn-legend.** [Del2 §8] Mini-legend en gång överst i talang-listan: "★ = potential · CA = nuläge". Gör den osynliga regeln synlig (hög CA + få stjärnor = färdig; låg CA + många = råtalang).
3. **EkonomiTab status-emoji → färg + Lucide.** [Del1 §2.5] Licensstatus `✅/⚠️/🔴/❌` → behåll `licenseColor`, byt emojin mot Lucide-ikon eller ren färgad text. Konsekvent med no-emoji-policyn (samma beslut som window-status i Transfers).
4. **Tränare "Belastning"-sparkline fallback.** [Del2 §3] < MIN_POINTS datapunkter → visa INTE tom graf, visa status-rad ("Frisk · ingen belastning än"). Samma regel som PlayerRow-sparkline (handoff 05-31). Verifiera att Ekonomi-sparklinen redan har samma gate.
5. **tabDescriptions konsekvens.** [Del1 §1.3] Idag har bara 3 av 6 Club-flikar en beskrivnings-rad → layouten hoppar per flik. Lås: ge alla sex en kort en-rads beskrivning, så vertikal start är konsekvent. (Lägg till korta för Träning/Minne/Tränare.)

## Del 2 — Hygien (efter Del 1, lägre risk)
6. **KlubbTab → OrtenTab.** [Del1 §1.5] Döp om komponenten för kod↔UI-paritet (fliken heter Orten). Uppdatera importen i `ClubScreen`. Ren rename, ingen beteendeändring.
7. **EkonomiTab inline → `economy.css`.** [Del1 §2.4] ~80 inline `style={{}}` (kassa-rader, sponsor-lista, community-rader, transaktionshistorik) → `.eco-row`/`.eco-row-total`/`.eco-sponsor-row`/`.eco-community-row`. Tokens stämmer redan — ren extraktion, ingen visuell ändring. Behåll diegetiska community-emoji (🌭🎫 osv) — content, inte chrome.

## INTE röra
Orten-redesignen (klar). Patron/mecenat. scheduleGenerator, matchCore. Diegetiska community-emoji.

## Acceptans
- Anläggning uppgraderas bara på ett ställe (Orten); Akademi visar read-only.
- Stjärn-legend synlig en gång överst i talang-listan.
- Inga semafor-emoji på licensstatus.
- Tränare-belastning visar status-rad, inte tom graf, vid säsongsstart.
- Alla sex Club-flikar har beskrivnings-rad — ingen layout-hopp.
- OrtenTab-rename klar, import uppdaterad.
- EkonomiTab inline-skuld extraherad till `economy.css`, utseendet oförändrat.
- `npx tsc --noEmit` + test rena.

**Rapportera per punkt.**

---

**Till Code (Sonnet, VS Code):**

Läs `docs/CODE-LEVERANS-KLUBB-FINISH-2026-06-09.md` och implementera. Del 1 (synliga/funktionella) först, committa, sedan Del 2 (hygien).

**Metod:** läs `AkademiTab`, `EkonomiTab`, `TranareTab`, `ClubScreen` i kontext och spåra render-flödet innan du rör något. Visa kod, inte bara slutsatser.

**Del 1:** (1) Anläggning read-only i AkademiTab — Orten äger. (2) Stjärn-legend "★ = potential · CA = nuläge" överst i talang-listan. (3) Licensstatus-emoji → Lucide/färgad text. (4) Tränare-belastning sparkline: < MIN_POINTS → status-rad, inte tom graf. (5) tabDescriptions för alla sex Club-flikar (korta), så layouten inte hoppar.

**Del 2 (efter Del 1):** (6) Döp om `KlubbTab` → `OrtenTab`, uppdatera importen. (7) EkonomiTab ~80 inline-stilar → `economy.css` (`.eco-row` etc.), tokens oförändrade, behåll diegetiska community-emoji.

**Rör INTE:** Orten-redesignen, patron/mecenat, scheduleGenerator, matchCore.

**Klart =** anläggning en ägare · legend synlig · ingen semafor-emoji · sparkline-fallback · alla flikar beskrivningsrad · OrtenTab-rename · economy.css · tsc + test rena.

**Rapportera per punkt.**
