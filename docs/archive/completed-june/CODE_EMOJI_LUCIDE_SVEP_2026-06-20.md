# CODE-ORDER — Emoji→Lucide-svepet (B3 domän 2: knappar + dataetiketter) — 2026-06-20

**Bakgrund:** B3 (emoji-domängränsen, DESIGN-DECISIONS § Systempatch 2026-06-11) tillåter emoji på **sektionsetiketter/översiktsytor (domän 1)** men kräver Lucide-ikon på **knappar (domän 2)** och CSS-markörer (ej emoji) på **dataetiketter/severity (domän 3)**. Inkorgs-ikonerna (`34c2ab41`/`c31607b4`) och ceremoni-heron är redan svepta. Detta stänger resten.

**En yta i taget. Typecheck + tester gröna per yta. Detta är ett rent svep — ingen logik ändras, bara ikon-rendering.**

---

## Steg 0 — Content-grep för full ytlista (Opus kan ej greppa innehåll)

Kör i repot:
```
grep -rn -P '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}\x{2190}-\x{21FF}\x{2B00}-\x{2BFF}]' src/presentation --include=*.tsx --include=*.ts
```
Klassa varje träff:
- **Knapp/CTA/interaktiv kontroll (domän 2)** → byt till Lucide. Lista nedan är de kända; greppet ska fånga ev. fler.
- **Severity/status-markör (domän 3)** → CSS-dot (severity-kortet: "severity-dots är CSS, aldrig emoji"), aldrig Lucide.
- **Sektionsetikett/översikt/scen-rubrik (domän 1)** → LÅT VARA. T.ex. trait-badges (🎓-mentortraiten från läsbarhetsordern), översiktsikoner. Dessa är ratificerat tillåtna.

Tveksamt fall → lämna i rapporten till Jacob, bygg inte om på gissning.

---

## Steg 1 — PlayerCard-knapparna (känd huvudyta)

**Fil:** `src/presentation/components/PlayerCard.tsx`

Omläst mot live 2026-06-20. Tre knapp-grupper bär emoji. Byt emoji-glyfen mot Lucide-ikon (16px, `currentColor`, `strokeWidth` enligt övriga PlayerCard-ikoner), behåll knappetiketternas text och all onClick-logik orörd:

**Översikt-raden:**
- 🗣 (prata/dialog) → `MessageCircle`
- 👑 (kapten) → `Crown`

**Ledarskaps-panelen (3 knappar efter mentor-cutet `#3 (A)`):**
- 😮‍💨 lower_tempo (lugna) → `Wind`
- 🤫 private_talk (enskilt samtal) → `MessageSquare`
- 📣 public_praise (beröm öppet) → `Megaphone`

**Prata-raden:**
- 😊 → `Smile`
- 💪 (motivera) → `Flame`

(Mentor-knappen 🎓 finns INTE längre på panelen — system 1 klipptes i `#3 (A)`. Om en 🎓 dyker upp i greppet är det trait-badgen = domän 1 = lämna.)

Ikon-valen ovan är rimliga default — **Fable får göra en perceptionsaudit på dem efteråt** (samma klass som ceremoni-heron, kunde ej headless-screenshotas). Bygg med dessa, flagga inte för beslut.

---

## Steg 2 — Severity-semaforen (🔴🟡⚪) → CSS-dots

Greppet i Steg 0 visar var de lever. Severity-kortet (Förb 3, ratificerad) säger: severity-nivåer renderas som **CSS-dots**, aldrig emoji-semafor. Byt varje 🔴/🟡/⚪ mot den befintliga severity-dot-primitiven (samma som inkorgens severity-grupper använder — CSS-cirkel med token-färg `--danger`/`--accent`/neutral). Om semafor-emojin sitter i en datalabel utan dot-primitiv i närheten: använd samma `<span className="severity-dot ...">`-mönster som InboxScreen.

Hittar greppet inga 🔴🟡⚪ kvar → notera "severity-semafor redan ren" och hoppa steget (de kan ha försvunnit i tidigare svep).

---

## Steg 2b — EkonomiTab licens-status (✅/⚠️/🔴/❌) → bara färgad text

**Fil:** `src/presentation/components/club/EkonomiTab.tsx`. Flaggad i klubb/transfers-auditen (06-09 §2.5): licensstatusen renderas med `✅/⚠️/🔴/❌` bredvid färgad text, men `licenseColor` bär redan statusen — emojin är redundant. Ta bort status-emojin, behåll den färgade texten (ingen Lucide behövs; färg + ord räcker, samma princip som transfers window-status). Önskas ändå en symbol: Lucide, aldrig semafor-emoji.

---

## Steg 2c — EkonomiTab sponsorFeedback `✅` är load-bearing → refaktorera bort (BESLUTAT 2026-06-20)

**Fil:** `src/presentation/components/club/EkonomiTab.tsx` (~rad 273/286). Code flaggade rätt: `✅`-prefixet i `sponsorFeedback`-strängen styr färgvalet via `sponsorFeedback.startsWith('✅')` (`--success` vs `--text-muted`). Emoji som kontrollflöde är exakt bräckligheten svepet finns för att ta bort. **Beslut: refaktorera nu** (Jacob/Opus 2026-06-20).

- Byt state från `string | null` till `{ success: boolean; text: string } | null`.
- Sätt `{ success: true, text: '${sponsor.name} tecknade avtal! +.../omg' }` på lyckat, `{ success: false, text: 'Ingen intresserad just nu. (2,5 tkr avdraget)' }` på miss — ingen `✅` i strängen.
- Färgvalet läser `sponsorFeedback.success ? '--success' : '--text-muted'`, renderar `sponsorFeedback.text`.
- Codes egen föreslagna lösning, rakt av. ~2 min, ren.

---

## Steg 3 — Dataetikett-emoji (domän 3)

Känd kandidat: marknadsvärde-notiserna i `roundProcessor.ts` — inbox-titlarna byggs med `const arrow = delta > 0 ? '📈' : '📉'`. Detta är en **dataetikett** (domän 3), inte en knapp. Inbox-titlar är ren sträng (kan ej bära JSX-ikon där de sätts), så två vägar — välj den som är minst invasiv:
- (a) Strunta i pilen i titel-strängen och låt InboxScreens ikon-kolumn bära trenden visuellt, eller
- (b) om titeln måste bära riktning: använd `↑`/`↓` (typografiska pilar, ej emoji) som är tillåtna tecken, inte 📈/📉.

Default: **(b)** — minsta ändring, behåller informationen, dödar emojin. Greppet kan visa fler datalabel-emoji (🏒 m.fl.) — samma regel: typografiskt tecken eller Lucide om ytan är JSX, aldrig kvar som emoji på datalabel.

---

## Gate
- Steg 0-greppet kört, träfflistan klassad, inga domän-2/3-emoji kvar i `src/presentation` utöver ratificerade domän-1-undantag (trait-badges, sektionsetiketter).
- PlayerCard renderar Lucide på alla tre knapp-grupper, text + onClick orörda.
- Severity-semafor = CSS-dots eller bekräftat redan ren.
- Marknadsvärde-notisen bär ↑/↓ ej 📈/📉.
- Typecheck + tester gröna. `_adherence`-lint (om en emoji-på-knapp-regel finns) ren.
- **Rapport till Jacob:** full träfflista från Steg 0 med klassning per rad, så domän-1-undantagen är synliga och inget svaldes av misstag.
