# Steg 3-revert — Stripes återställda — Audit 2026-05-06

Ref: `design-system/DESIGN-DECISIONS.md § "Stripes och klammer — genomgående visuellt språk"`

Bakgrund: SPRINT_B2_STRIPES_AUDIT tog bort 6 stripes. Beslut 2026-05-06 vänder
detta — stripes är genomgående visuellt språk. Kompletterande signaler behålls.

---

## Återställda stripes (6 filer)

| Fil | Stripe | Kompletterande signal (behålls) |
|-----|--------|--------------------------------|
| `InboxScreen.tsx:113` | `borderLeft: item.isRead ? '3px solid transparent' : '3px solid var(--accent)'` | Bakgrunds-tint `rgba(196,122,58,0.06)` på oläst |
| `TabellScreen.tsx:60+273` | `getRowBorderColor` återskapad + `borderLeft: \`3px solid ${getRowBorderColor(row.position)}\`` | Background-tinter (managed, top-3, nedflyttning) |
| `RoundSummaryScreen.tsx:402` | `borderLeft: relevant ? '2px solid var(--accent)' : '2px solid transparent'` | Bold + accent-text-färg på relevant rad |
| `GranskaForlop.tsx:139` | `borderLeft: isRivalMatch ? '2px solid var(--accent)' : '2px solid transparent'` | 🔥-prefix på rivallagets namn |
| `TransferPlayerCard.tsx:46` | `borderLeft: isScouted ? '3px solid var(--accent)' : '3px solid transparent'` | `<span className="tag tag-copper">Scoutad</span>` |
| `ActiveBidsList.tsx:315` | `borderLeft: isAlreadyScouted ? '3px solid var(--accent)' : '3px solid transparent'` | `<span className="tag tag-copper">Scoutad</span>` |

---

## Ej rörda (BEHÅLLS från B2)

- `.card-tap`-klassen i `global.css` — kvar
- 5 secondary cards med `.card-tap` — kvar
- Tabell poäng 13/700, målskillnad 11/600 — kvar
- Danger-block stripes — aldrig ändrade
- Scoutad-taggar — kvar (dubbel-signal: stripe + text)
- 🔥-prefix i GranskaForlop — kvar
- Bakgrunds-tint i InboxScreen — kvar

---

## Build

```
npm run build → rent (0 fel), 4.19s
```

## Verifiering

Alla 6 stripes bekräftade via grep. Awaiting browser-playtest:
- Tabell: vänstra zon-stripes per position
- Inbox: oläst = stripe + tint (dubbel-signal)
- Scoutad: stripe + tag-copper
- RivalMatch: stripe + 🔥-prefix
