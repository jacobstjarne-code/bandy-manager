# RELÄ TILL OPUS/CODE — Försoningssprinten (2026-06-11)

**Från:** Design (Fable) · **Underlag:** visuell-konsekvens-audit Del 1–14 mot build 050bb22, ~80 screens, en hel säsong genomspelad.
**Detta dokument är arbetsordern.** Detaljerna ligger i de refererade filerna — läs dem i den ordning de nämns.

---

## 0 · Vad som hänt sedan sist (30 sekunder)

1. Hela appen är auditerad mot designsystemet (14 del-audits + konsoliderad karta).
2. **Designsystemet är patchat FÖRST** — B-besluten är tagna av Jacob 2026-06-11 och ratificerade. Varje fix nedan pekar nu på en bindande regel, inte en audit-åsikt.
3. Tre mockar för ytorna som aldrig fick design är klara.

**Domen:** designen är rätt; driften är koncentrerad till halvfärdig wiring, aldrig-designade ytor och saknade delade primitiver. Det här är en städsprint, inte en omdesign.

---

## 1 · Synka designsystemet (före all kod)

Nya/ändrade filer i `design-system/` (Jacob har dem):

| Fil | Vad |
|---|---|
| `DESIGN-DECISIONS.md` | § "Systempatch 2026-06-11" — B1–B8 + typografiska scenen + Tal & enheter + severity-skalan + 4 skördade mönster + 6 delade primitiver |
| `colors_and_type.css` | `--led-us` / `--led-them` (vi/dom ratificerad) · `--disabled-opacity: 0.4` |
| `README.md` | Ny tagline · emoji-regelns nya domängräns · LED-vi/dom · illustrationer i §Imagery · Bury Fen = studio-vinjett · hårda regler **11–15** (tal & enheter, tomma kort, färgnycklar, graf-förankring, disabled) |
| `preview/components-scene-typographic.html` | NY kanon — tredje ceremoninivån |
| `preview/rules-tal-enheter.html` | NY kanon — ✓/✗-exempel |
| `preview/rules-severity-skala.html` | NY kanon — 4 nivåer, fasta uttryck |

---

## 2 · FÖRST: wiring-redovisningen (A1 — blockerar resten)

Build 050bb22 motsade klar-rapporterna. Code redovisar per yta vilken commit som påstods innehålla vad:

| Yta | Status i 050bb22 |
|---|---|
| Förbered | Legacy-wizard — INGET av greenlit LedgerFrame |
| Match live | HALVT wirad — LedgerFrame-krom OVANPÅ legacy-krom (4 headerband) |
| Granska | Pre-fork-version — recut 06-09 ej inne |
| Halvtidsmodal | Nära godkänd ✓ |

Innan redovisningen är gjord ska inga Förbered/Granska-kosmetiska fixar göras — de ytorna ERSÄTTS (mockar finns: `2026-06-09_design_forbered_trupp_slots.html`, `2026-06-09_design_granska_oversikt_recut.html`, `2026-06-08_design_granska_flikar_liggare.html`).

## 3 · Fix-ordning (efter A1)

Full lista: `audits/FORSONINGSKARTA-KONSOLIDERAD-2026-06-10.md` (§A 🟥, §D 🟧 per domän, §F grep-lista) + Del 14-tillägg. Kortversion i prioritetsordning:

**🟥 (bryter helheten):**
1. Dubbelkromen på match — legacy göms på wirade skärmar + EN omgångsdefinition (serieomgång; mastheaden räknar fel)
2. MINNE-flikens kontrast (oläslig)
3. `positionLabel()`-helpern — MV/B/YH/MF/A överallt (tre strata: engelska, GOA/DEF/HAL)
4. Pill-CTA-svepet → `.btn-cta` 12px uppercase (4 generationer pills)
5. RPS-stripens semantik (✓/⬡, rätt fas aktiv i Förbered)
6. SM-final-uppspelet → **mock: `2026-06-11_design_smfinal_uppspel.html`** (illustration finns: `assets/illustrations/final.jpg`)
7. Inbox — **mock: `2026-06-11_design_inkorg_recut.html`** (design) + notis-dieten (Opus: aggregera träningsrapporter, inga egna matchresultat, deadline-krav på beslut, arkivera vid säsongsskifte)

**🟧 systemiska (en PR var, träffar många ytor):**
8. Delade primitiver: tal/valuta-formatter (regel 11) · severity-dots (ersätter 🔴🟡⚪) · disabled-mekanismen (regel 15) · delad TabBar · EN decision-card (Portal-varianten)
9. Emoji-svepet per nya regeln (B3): chrome-emoji (✨🔄💡🎥⚡😡🔮…) → Lucide; data-sektionsetiketter emoji-fria (redan as-built i Granska — ratificerat)
10. Tomma kort-svepet (regel 12) + graf-förankring (regel 14: Stämningskurvan, KONDITION-sparklinen, belastnings-sparklinen)
11. LED: vi/dom-tokens in (`--led-us`/`--led-them`), Georgia-namn ÖVER tavlan (inte trunkerad mono), LED-rött ut ur halvtidsmodalen, beat-blur → scrim (B2)
12. Taktik-pitchen — **mock: `2026-06-11_design_taktikpitch_kontrast.html`** (is-ton, permanent legend)

**🟨 + grep-listan:** per kartan §D/§F och Del 14 (scen-eyebrow-differentiering, kontraktsradens valuta, årsboks-numrering, Lagfoton-tomtillstånd, m.m.)

## 4 · Till Opus specifikt (gameplay, inte pixlar)

- **Notis-dieten** (punkt 7) — regler för vad som ALDRIG skapas
- **Beslut utan deadline får inte existera** — `expiresRound` obligatorisk ("Utse kapten" låg 5 omgångar utan tryck)
- **Story-slot-rotationen verkar inaktiv** (samma Kafeterian 3+ omgångar) — verifiera mot kurerings-spec
- **Frivillig-moral utan spak** (Kjell 31) + **kondition 0 utan varning** — två mätare utan handling, från Orten-recuten/Del 12
- **Anteckningar/årsboks-copy-pooler** behöver varianter (×5-repetitionerna) — Opus skriver, Design granskar ton

## 5 · Verifiering

Efter sprinten: Jacob fotar om samma flöden (samma checklist), Design kör en kort re-audit mot kartan — grön/kvarstår per fynd. Regressions-skydd: de fem nya hårda reglerna (11–15) + emoji-regeln in i `_adherence`-lintet där det går (grep-barer finns i kartans §F).

---

*Design står by för frågor under sprinten. Konsekvensraden (förståelse-rundan) och illustrations-katalogens låsning tas EFTER städningen — blanda inte in dem nu.*
