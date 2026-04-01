# FIX: Header-kontrast + konsistens

## 1. GameHeader — höj kontrast

I `src/presentation/components/GameHeader.tsx`:

```
VAR: color: 'rgba(245,241,235,0.45)'  (BANDY MANAGER)
BLI: color: 'rgba(245,241,235,0.7)'

VAR: color: 'rgba(245,241,235,0.4)'  (spelarnamn/säsong/omgång)
BLI: color: 'rgba(245,241,235,0.65)'
```

## 2. Välj klubb — använd samma header-layout

I `src/presentation/screens/NewGameScreen.tsx`, club selection step:

Ersätt den custom headern med samma layout som GameHeader:
- Vänster: "BANDY MANAGER" (samma font, storlek, färg)
- Höger: "Välj klubb" (bold, 13px) + "jacob · 2026/2027" (10px)
- Tillbaka-pil integrerad till vänster om "BANDY MANAGER"
- Samma bakgrund, border, padding som GameHeader

Layout:
```
[←] BANDY MANAGER                    Välj klubb
                                 jacob · 2026/2027
```

## Filer
- `src/presentation/components/GameHeader.tsx`
- `src/presentation/screens/NewGameScreen.tsx`
