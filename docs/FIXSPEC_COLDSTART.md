# FIXSPEC: Kallstart — omgång 1 ska kännas inbjudande

Dashen i omgång 1 är tom och trist. Fixar:

---

## FIX A: Välkomstkort istället för lös onboarding + nudgar

Omgång 1 (game.fixtures ingen completed): slå ihop onboarding-hinten och nudgarna till ETT kort:

```tsx
{isFirstRound && (
  <div className="card-round" style={{ margin: '0 0 6px', padding: '14px' }}>
    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: 6 }}>
      Välkommen, {game.managerName}.
    </p>
    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
      Säsongen 2026/27 börjar. {club.name} förväntar sig att du bygger något att vara stolt över. Börja med att sätta din startelva.
    </p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Samma nudgar men inline */}
      {nudges.map(n => (
        <div key={n.text} onClick={n.onClick} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: n.done ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }} />
          <span style={{ textDecoration: n.done ? 'line-through' : 'none', opacity: n.done ? 0.5 : 1 }}>{n.text}</span>
        </div>
      ))}
    </div>
  </div>
)}
```

Dölj den vanliga onboarding-hinten och "ATT GÖRA"-sektionen om `isFirstRound`.

`isFirstRound` = inga completed fixtures för managed club:
```typescript
const isFirstRound = !game.fixtures.some(f => f.status === 'completed' && (f.homeClubId === game.managedClubId || f.awayClubId === game.managedClubId))
```

---

## FIX B: 2×2 gridden — anpassa för omgång 1

**Tabell-cell omgång 1:** Visa "📊 Tabell" men istället för meningslöst "1, 0p, +0", visa:
```
📊 TABELL
12 lag · 22 omgångar
Start 1 okt – Final mar
```

Villkor: `standing.played === 0` → visa säsongsinfo. `standing.played > 0` → visa vanlig tabell.

**Senast-cell omgång 1:** Tomt `<div />` renderas. Byt till klubb-intro:
```
🏟 {club.name}
{club.region}
Faciliteter: {club.facilities}
```

Eller visa styrelsens förväntning:
```
🎯 Styrelsens mål
"Topp 6"
"Håll budgeten"
```

Villkor: `!lastResult` → visa alt-kort. `lastResult` → visa vanlig senast.

---

## FIX C: Cup-enradskortet — visa info

Cup one-liner visar bara "🏆 CUPEN ›" utan text. Lägg till cupstatus:

```tsx
<span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
  {cupStatus.eliminated ? 'Utslagna'
    : nextCupFixture ? `${getCupRoundLabel(nextCupRound)} md ${nextCupFixture.matchday}`
    : cupBye ? 'Direktkval. till kvartsfinal'
    : 'Startar snart'}
</span>
```

Enradskortet ska ALLTID ha info-text — aldrig bara label + ›.

---

## FIX D: Expanded CupCard åter

Nuvarande `showExpandedCup`-logik döljer den detaljerade CupCard och visar bara enraden. Men CupCard var bra — den visade motståndare, hemma/borta, matchdag.

Fix: visa CupCard (expanded) ISTÄLLET FÖR enraden när det finns en schemalagd cupmatch:

```typescript
const showExpandedCup = game.cupBracket && !cupEliminated && !!nextCupFixture
```

Om `showExpandedCup`: rendera `<CupCard>` i sin fulla form under enrads-korten.
Om INTE: rendera enraden med status-text (fix C).

INTE båda samtidigt (det var den dubbel-cup-buggen).

---

## FIX E: Dagboken hamnar under CTA

I screenshoten: "🎓 Tobias Dal (P19)..." skymtar under den bruna CTA-knappen. Dagboken renderas EFTER CTA.

Fix: flytta DailyBriefing OVANFÖR 2×2-gridden (efter matchkortet, före gridden). Ordningen ska vara:

1. Välkomstkort ELLER (Onboarding + ATT GÖRA)
2. NextMatchCard
3. DailyBriefing
4. 2×2 grid
5. Enrads-kort
6. CupCard/PlayoffCard (expanded)
7. CTA

---

## ORDNING

A → E → B → C → D. Committa: `fix: cold-start dashboard — welcome card, grid, cup`
