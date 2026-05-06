# Steg 3 — B2 Stripes-implementation (Mock 1) — Audit 2026-05-06

Ref: `docs/diagnos/2026-05-05_design_krockar.md § DIAGNOS B`
Mock: `docs/mockups/2026-05-05_stripes_alternativ.html`
Beslut: `design-system/DESIGN-DECISIONS.md § "Stripes-mönstret"`

---

## 3.1 — `.card-tap` CSS-klass tillagd

`src/styles/global.css` — placerad direkt före `.card-stack`:

```css
.card-tap {
  cursor: pointer;
  transition: filter 0.15s ease;
}
.card-tap:hover  { filter: brightness(1.08); }
.card-tap:active { filter: brightness(0.95); }
```

Brightness-baserat — funkar på alla bakgrundsfärger. Matchar HANDOFF #5 button-states.

---

## 3.2 — `.card-tap` applicerad på 5 klickbara secondary cards (stripes BEHÅLLS)

| Fil | Ändring |
|-----|---------|
| `portal/secondary/KlackenSecondary.tsx` | `className="card-tap"` på root-div |
| `portal/secondary/CoffeeRoomSecondary.tsx` | `className="card-tap"` på root-div |
| `portal/SituationCard.tsx` | `className="card-tap"` på root-div |
| `clubselection/OfferCard.tsx` | `className="card-tap"` på root-div |
| `clubselection/ClubExpandedCard.tsx` | `className="card-tap"` på root-div |

`borderLeft: '2px solid var(--accent)'` behålls på alla fem — secondary cards är en godkänd kategori per DESIGN-DECISIONS.md § Stripes.

---

## 3.3 — Stripes borttagna (6 filer)

| Fil | Rad | Åtgärd |
|-----|-----|--------|
| `InboxScreen.tsx:113` | Tog bort `borderLeft`. Oläst rad: `background: 'rgba(196,122,58,0.06)'` — tintad bakgrund för olästa meddelanden. |
| `TabellScreen.tsx:273` | Tog bort `borderLeft: \`3px solid ${getRowBorderColor(row.position)}\``. `getRowBorderColor`-funktionen (rad 55–60) borttagen som oanvänd. Befintlig background-logik (managed-gradient, top-3 tint, nedflyttning-tint) behållen. |
| `RoundSummaryScreen.tsx:402` | Tog bort `borderLeft: relevant ? '2px solid var(--accent)' : '2px solid transparent'`. Behöll bold + accent-text-färg på relevant rad. Padding omskriven till `padding: '3px 6px'` (kombinerade `padding: '3px 0'` + `paddingLeft: 6`). |
| `GranskaForlop.tsx:139` | Tog bort `borderLeft`. Lade till `'🔥 '`-prefix på motståndar-lagets namn (hem eller borta) när `isRivalMatch === true`. Accent-text-färg kvarstår inte (den var inte i originalet). |
| `TransferPlayerCard.tsx:46` | Tog bort `borderLeft: isScouted ? '3px solid var(--accent)' : '3px solid transparent'`. Lade till `<span className="tag tag-copper" style={{ flexShrink: 0 }}>Scoutad</span>` intill Bud-knappen när `isScouted`. |
| `ActiveBidsList.tsx:315` | Tog bort `borderLeft: isAlreadyScouted ? ... : ...`. Lade till `<span className="tag tag-copper">Scoutad</span>` i korts knapp-kolumn när `isAlreadyScouted`. `alignItems: 'flex-end'` tillagt på knappdiven. |

---

## 3.4 — Tabell-styling-fix

| Element | Förut | Nu |
|---------|-------|----|
| Poäng-span (`{row.points}`) | `fontSize: 14, fontWeight: 800` | `fontSize: 13, fontWeight: 700` |
| Målskillnad-span (`{goalDiff}`) | `fontSize: 12, fontWeight: 600` | `fontSize: 11, fontWeight: 600` |

---

## 3.5 — Behållna danger-block stripes (ej rörda)

- `PlayerCard.tsx:446` — `borderLeft: '3px solid var(--danger)'` på skadeblock ✓
- `RoundSummaryScreen.tsx:364` — `borderLeft: '3px solid var(--danger)'` på skade-alert ✓

---

## 3.6 — Inte i scope (explicit ute)

| Fil | Typ |
|-----|-----|
| `SeasonSummaryScreen.tsx:251,266` | Säsongssignatur citatblock + narrativ summary |
| `VictoryQuote.tsx:15` | Segerscens citatblock (`--match-gold`) |
| `ClubMemoryEventRow.tsx:18`, `ClubMemoryLegendsBlock.tsx:35` | Klubbminne |
| `CounterInteraction.tsx:134`, `FreeKickInteraction.tsx:129` | Match-interaktion utfall |
| `SeasonSignatureSecondary.tsx:38` | Calm/scandal-stripe (ej severity-tokens) |
| `MatchHeader.tsx:61` | `atmo.borderAccent` — kräver kontext |
| `CommentaryFeed.tsx:230–367` | 15 stripes — väntar Stålvallen B-redesign |
| `PlayoffIntroScreen.tsx:73` | Kolumn-separator, gränsfall |
| `JournalistSecondary.tsx:62` | Severity-stripe (`var(--cold)`/`var(--warm)`) — godkänd domän |

---

## Verifieringsgrep

```
grep -rn 'borderLeft' src/presentation/ --include='*.tsx'
```

Kvarstående träffar: danger-blocks, secondary cards med card-tap, explicit ute-ur-scope-specialfall. Ingen okategoriserad krock-stripe kvar.

---

## Build

```
npm run build → rent (0 fel), 4.07s
```

---

## Visuell verifiering

Awaiting browser-playtest:
- Inbox: olästa rader ska visa tintad bakgrund (inte stripe)
- Tabell: inga vänster-stripes, lättare poäng-typografi
- RoundSummary: relevanta matcher highlightas via fet+accent-färg utan stripe
- Transfer: Scoutad-tag synlig intill spelare med scoutrapport
- Secondary cards: brightness-shift vid hover
- GranskaForlop: 🔥-prefix på rivalens namn
