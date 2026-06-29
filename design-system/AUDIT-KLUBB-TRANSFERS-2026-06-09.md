# AUDIT — Klubb + Transfers (domän-genomgång)

**Datum:** 2026-06-09
**Typ:** Design-konsekvens-audit, kodgrundad (ClubScreen-struktur + EkonomiTab djupläst, Transfers-delta mot 2026-05-17-auditen)
**Avgränsning:** `/game/club` (6 flikar) + `/game/transfers` (5 flikar + 3 modaler)
**Status:** Del 1 (struktur + Ekonomi + Transfers) kodgrundad nu. Del 2 (Akademi, Orten/Klubb, OrtenMap, Tränare visuellt) väntar skärmdumpar — se §6.

---

## 0 · Två frågor som styr scope

1. **Landade 2026-05-17-transfers-fixarna?** Den auditen hade 3🟥/7🟧. Om CSS-extraktion + token-fix + emoji-cleanup är gjorda ska jag inte dubbelrapportera. Om inte: de står kvar som öppna.
2. **EkonomiTab visar att score-system + DB-besluten nått Klubb** (Sparkline, Georgia-pengar, tokens). Frågan är om **resten av Klubb-flikarna** fått samma behandling eller bara Ekonomi.

---

## 1 · ClubScreen — strukturell audit (kodgrundad)

Sex flikar: Träning · Ekonomi · Orten · Akademi · 📖 Minne · Tränare.

| # | Sev | Fynd | Åtgärd |
|---|-----|------|--------|
| 1.1 | 🟧 | **Tab-baren är helt inline-styled** (ClubScreen.tsx:88-119). Sex tabs med `borderBottom`, `color`, `fontSize` inline. Samma mönster som Transfers tab-bar och SquadScreen tab-bar — tre olika domäner, tre inline-kopior av samma tab-bar. | Extrahera en delad `<TabBar tabs activeTab onSelect>`-komponent + `.domain-tabbar`-klass. Återanvänds av Club + Transfers + Squad. |
| 1.2 | 🟨 | **Emoji-inkonsekvens i tab-labels:** bara "📖 Minne" har prefix-emoji, de andra fem (Träning/Ekonomi/Orten/Akademi/Tränare) saknar. Antingen alla eller ingen — annars ser Minne "speciell" ut utan att vara det. | Beslut: ta bort 📖 från Minne (rena text-tabs), ELLER ge alla sex emoji. Min läsning: rena text-tabs — tab-baren är chrome, inte kategori-labels. |
| 1.3 | 🟨 | **tabDescriptions finns bara för 3 av 6** (ekonomi/orten/akademi). Träning/Minne/Tränare får ingen beskrivnings-rad → layouten hoppar (vissa tabs har rad, andra inte). | Antingen beskrivning för alla sex, eller ingen. Inkonsekvent vertikal start per flik är skakigt. |
| 1.4 | ✅ | Tab-state via `location.state.tab` + VALID_TABS-guard — robust deep-link-stöd. | — |
| 1.5 | 🟨 | **"Orten"-fliken renderar `<KlubbTab>`** (namnförvirring kod↔UI). Tab heter Orten, komponent heter KlubbTab. Inte en UI-bugg men en underhålls-fälla. | Döp om `KlubbTab` → `OrtenTab` för kod↔UI-paritet (Code-hygien, ej design-block). |

---

## 2 · EkonomiTab — djupläst (kodgrundad)

**Den mest utvecklade Klubb-fliken.** Score-system + DB-besluten har nått hit. Bra utgångsläge — men visar exakt var skulden ligger i resten.

| # | Sev | Fynd | Åtgärd |
|---|-----|------|--------|
| 2.1 | 💎 | **Sparkline integrerad** (kassa-trend, stroke per riktning success/danger, `MIN_POINTS`-gate). Score-system-primitivet används korrekt. Bevara — det är mönstret de andra flikarna ska följa. | — |
| 2.2 | 💎 | **DB-4 Georgia-pengar** (`.h-display-sm` på saldo). Tokens korrekt (`--success`/`--danger`/`--accent`), `formatCurrency`/`formatFinance`. Ingen Tailwind-hex. | — |
| 2.3 | 💎 | **SectionCard-wrapper** med stagger-animation på alla 7 sektioner — konsekvent kort-vokabulär. | — |
| 2.4 | 🟧 | **~80 inline `style={{}}`-objekt.** Varje rad i kassaöversikt, sponsor-lista, community-rader, transaktionshistorik är inline-styled. Tokens är rätt, men formen är inte extraherad. Vid token-ändring måste 80 ställen synkas. | Extrahera `.eco-row`, `.eco-row-total`, `.eco-sponsor-row`, `.eco-community-row` till `club.css` eller `economy.css`. Mindre brådskande än transfers (tokens stämmer) men samma skuld-typ. |
| 2.5 | 🟧 | **Status-emoji som chrome:** licensstatus `✅/⚠️/🔴/❌`. Detta är exakt det 2026-05-17 flaggade för transfers (🟢🟡🔴 window-status). Färgen (`licenseColor`) bär redan statusen — emojin är redundant. | Ta bort status-emoji, behåll färgad text. Eller Lucide-ikon om en symbol behövs. Konsekvent med transfers-beslutet. |
| 2.6 | 🟨 | **Community-rad-emoji (🌭🎫📺🏋️🎄🏫📱🍺🏪🚗):** tio aktivitetsrader med vars sin emoji. Gränsfall — de är *diegetiska innehållsetiketter* (kiosken, lotteriet), inte chrome. Mer försvarbart än status-emoji, men tio i rad blir mycket. | Behåll — de fungerar som content-ikoner (som EventCardInline-tags). Men verifiera visuellt att raden inte blir plottrig (screen behövs). |
| 2.7 | 🟨 | **Feedback-strängar med ✅/✓/✗-prefix** (`sponsorFeedback`, `communityMsg`, "✓ Sparat!"). Chrome-checkmarks. | → Lucide `Check`/`X` eller ren färgad text. Lägre prio. |
| 2.8 | 🟨 | **Transferbudget-slidern:** `accentColor: 'var(--accent)'` på native range-input. Funkar men ostylad i övrigt (native thumb). Inkonsekvent med resten av den polerade fliken. | Överväg styled slider, eller acceptera native som medvetet. Playtest-fråga. |

---

## 3 · Transfers — delta mot 2026-05-17

2026-05-17-auditen står (3🟥/7🟧/6🟨/1💎). Kärnfrågan: hur mycket landade? **Kan inte avgöras utan att se nuvarande kod/screens.** Det jag vet:

- EkonomiTab visar att **score-system + DB-arbetet pågått** sedan dess → troligt att delar av transfers-CSS-extraktionen också gjorts.
- Om `transfers.css` skapades: 🟥 1.2 (inline-skuld) löst.
- Om Tailwind-hex byttes: 🟥 1.1 löst.
- Om emoji-cleanup gjordes: 🟥 1.3 löst.

**Verifiering:** behöver antingen Code-bekräftelse eller screens på de fem transfers-flikarna. Tills dess: behandla 2026-05-17-listan som öppen och **verifiera, inte återskapa**.

Ett nytt designförslag oavsett status — **transfers ↔ liggar-ramen:** Transfers är en dashboard (marknad/listor), så den ska INTE in i LedgerFrame (samma regel som Portal/Trupp). Men **BidModal / RenewContractModal** är blankett-aktiga — de redigerar ett avtal. Övervägande: ge modalerna ledger-vokabulären (perforerad marginal, stämpel-CTA "Lägg bud →") så de känns som kontrakts-papper. Det binder transfers-modalerna till samma språk som rond-flödet utan att tvinga in listorna. Öppen fråga till dig/Opus.

---

## 4 · Cross-domän-mönster (gäller båda + Squad)

Tre saker återkommer i Club, Transfers OCH Squad — de är **system-nivå**, inte per-domän:

1. **Inline tab-bar × 3.** Club, Transfers, Squad har var sin inline-styled tab-bar. → en delad `<TabBar>`-komponent. Störst ROI av allt här.
2. **Inline-rad-skuld.** Varje lista i varje domän är inline-styled. Tokens stämmer i Club/Ekonomi, gör det inte i Transfers (Tailwind-hex). → domän-CSS-filer.
3. **Status-emoji som chrome.** Licensstatus (Club), window-status (Transfers). → färg + ev. Lucide, aldrig semafor-emoji. Diegetiska content-emoji (community-rader, marknad-grupper) får stanna.

---

## 5 · Konsoliderad åtgärdslista

| # | Sev | Åtgärd | Domän | Beror på |
|---|-----|--------|-------|----------|
| 1 | 🟧 | Delad `<TabBar>`-komponent + `.domain-tabbar` | Club+Transfers+Squad | — |
| 2 | 🟥? | Verifiera 2026-05-17 transfers-fixar (CSS/hex/emoji) | Transfers | Screens/Code-svar |
| 3 | 🟧 | Status-emoji → färg+Lucide (licens, window) | Båda | Designbeslut (mitt: ta bort) |
| 4 | 🟧 | EkonomiTab rad-extraktion → `economy.css` | Club | — |
| 5 | 🟨 | Tab-emoji + tabDescription konsekvens (alla/inga) | Club | Designbeslut |
| 6 | 🟨 | KlubbTab→OrtenTab kod-namn-paritet | Club | Code-hygien |
| 7 | ❓ | Transfers-modaler → ledger-vokabulär? | Transfers | Opus/Jacob |

---

## 6 · Vad jag behöver screens på (Del 2)

Fyra Klubb-flikar är täta interaktiva ytor jag inte kan bedöma kompositionellt utan att se dem renderade. Skicka gärna:

1. **Akademi-fliken** (AkademiTab) — ungdomslag, talangutveckling, mentorer, utlåning. Tätt.
2. **Orten-fliken** (KlubbTab + OrtenMap) — lokalstöd, mecenater, kommun, kartan. OrtenMap är en custom-visualisering jag aldrig sett.
3. **Tränare-fliken** (TranareTab) — pixel-auditen sa portrait saknades; vill se nuläget efter manager-portrait-handoffen.
4. **Transfers — Marknad + Scouting-flikarna** — för att avgöra vilka 2026-05-17-fixar som landat (CSS-extraktion, emoji, card-sharp).

Med de fyra kan jag stänga Del 2 och ge en komplett domän-dom.

---

— Design-Claude, 2026-06-09
