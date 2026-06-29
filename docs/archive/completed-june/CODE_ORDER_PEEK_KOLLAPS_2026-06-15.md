# CODE-ORDER — Peek-kollaps i SectionCard (genomspelnings-fynd)

**Datum:** 2026-06-15 · **Av:** Opus · **Modell:** Sonnet (en komponent, tydlig spec)
**Källa:** Jacobs genomspelning. Kollapsen vi byggde (NU 2 rad E) döljer ALLT innehåll under rubriken → en ovan/ouppmärksam spelare ser bara rubrik + "Visa allt →" och fattar inte att innehåll finns. Bryter den ratificerade regeln "Ett kort utan innehåll renderas inte — eller talar" (DESIGN-DECISIONS): en helt dold sektion ÄR ett tomt kort ur spelarens synvinkel.

## Rotorsak (verifierad)
`SectionCard.tsx`: `{!collapsed && children}` är binär — allt eller inget. Kollapsad = bara rubrikraden syns.

## Fixen — peek-kollaps (CSS-höjdklamp, Väg B)
I kollapsat läge: dölj inte innehållet helt. Visa en glimt (~en rads höjd) med mjuk fade-ut nedåt, så att (a) spelaren ser ATT innehåll finns, (b) får en aptitretare, (c) fade-kanten signalerar "mer nedanför". "Visa allt →" expanderar.

Ersätt den binära renderingen:
```tsx
// FÖRE:
{!collapsed && children}

// EFTER:
{collapsible && collapsed ? (
  <div
    style={{
      position: 'relative',
      maxHeight: 'var(--peek-height, 32px)',
      overflow: 'hidden',
    }}
  >
    {children}
    {/* fade-ut nedåt — signalerar "mer finns" */}
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, height: 24,
      background: 'linear-gradient(to bottom, transparent, var(--bg-surface))',
      pointerEvents: 'none',
    }} />
  </div>
) : (
  children
)}
```
(Bekräfta att korten har `--bg-surface` som faktisk bakgrund — om SectionCard ligger på annan yta, matcha gradientens slutfärg mot den faktiska kortbakgrunden så faden tonar mot rätt färg, inte en felfärgad kant.)

**Peek-höjden ~32px** = ungefär en rad. Justera om sektionernas radhöjd skiljer sig; målet är "en glimt", inte "halva innehållet".

## Detaljer
- `marginBottom: collapsed ? 0 : 6` på rubrikraden: behåll ett litet mellanrum även kollapsad nu när innehåll visas under (ändra till `collapsed ? 4 : 6` eller liknande — rubriken ska inte klistra mot peek-raden).
- "Visa allt →" / "Dölj ↑"-knappen oförändrad — den fungerar, den blir bara ärlig nu när det syns vad som visas/döljs.
- Gäller alla `collapsible`-SectionCards (OrtenTab, EkonomiTab). Ingen call-site behöver ändras — fixen är helt i komponenten.

## Verifiering
Klubbflikarna: varje kollapsad sektion ska visa första raden + fade + "Visa allt →". Ingen sektion ska se tom ut. lint:design rent.

## Commit
`fix: peek-kollaps — kollapsade sektioner visar glimt av innehåll (genomspelnings-fynd)`

— Opus, 2026-06-15
