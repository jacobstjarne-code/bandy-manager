# FIX: Välj klubb-skärmen

Bara denna skärm. `npm run build` efter. Committa: `fix: club selection screen layout`

---

## 1. Sidhuvud — lägg till game header-stil

Ersätt den enkla headern med samma mörka header som resten av spelet:

```tsx
{/* Header — samma stil som GameHeader */}
<div style={{
  background: 'var(--bg-dark)',
  padding: '14px 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}}>
  <button
    onClick={() => setStep('name')}
    style={{ background: 'none', border: 'none', color: 'var(--text-light-secondary)', padding: 4, fontSize: 18, cursor: 'pointer' }}
  >
    ←
  </button>
  <div style={{ textAlign: 'center' }}>
    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--text-light-secondary)', margin: 0 }}>
      BANDY MANAGER
    </p>
  </div>
  <div style={{ textAlign: 'right' }}>
    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-light)', margin: 0, fontFamily: 'var(--font-display)' }}>
      Välj klubb
    </p>
    <p style={{ fontSize: 10, color: 'var(--text-light-secondary)', margin: 0 }}>
      {managerName} · 2026/2027
    </p>
  </div>
</div>
```

Ta bort den gamla headern (`<div style={{ padding: '16px 20px', borderBottom... }}>`).

---

## 2. Kompaktare klubbkort

Ändra varje klubbknapp:
- Padding: `14px 16px` → `10px 14px`
- Gap mellan korten: `10` → `6`
- Gap inuti kortet: `5` → `3`
- Flavor-text + region + stjärnor på EN rad:

```tsx
<button
  key={club.id}
  onClick={() => setSelectedClubId(isSelected ? null : club.id)}
  style={{
    width: '100%',
    padding: '10px 14px',
    background: isSelected ? 'rgba(196,122,58,0.08)' : 'var(--bg-elevated)',
    border: `1px solid ${isSelected ? 'rgba(196,122,58,0.4)' : 'var(--border)'}`,
    borderRadius: 'var(--radius)',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    transition: 'all 0.15s',
    cursor: 'pointer',
  }}
>
  {/* Rad 1: Namn + svårighetsgrad */}
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontWeight: 600, fontSize: 14, color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
      {club.name}
    </span>
    <span style={{
      fontSize: 10, fontWeight: 600, color: club.color,
      padding: '1px 7px', background: `${club.color}20`, borderRadius: 20,
    }}>
      {club.label}
    </span>
  </div>
  {/* Rad 2: Flavor + region + stjärnor */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {club.flavor}
    </span>
    <span style={{ color: 'var(--text-secondary)', fontSize: 10, flexShrink: 0 }}>{club.region}</span>
    <ReputationStars value={club.reputation} />
  </div>
</button>
```

Ändra gap på listan:
```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
```

---

## Filer
- `src/presentation/screens/NewGameScreen.tsx`
