# FIX: BoardMeetingScreen — tightare kort

Bara denna skärm. `npm run build`. Committa: `fix: tighter board meeting cards`

---

## Ändra i BoardMeetingScreen.tsx

Alla `card-sharp`-kort: ändra padding och marginBottom:

```
VAR: padding: '12px 14px', marginBottom: 10
BLI: padding: '10px 14px', marginBottom: 8
```

Styrelsemedlems-kortet (det stora med citat):
```
VAR: padding: '14px 16px', marginBottom: 24
BLI: padding: '10px 14px', marginBottom: 12
```

Inom styrelsemedlems-kortet, minska avstånd mellan citat:
```
VAR: marginBottom: i < boardMembers.length - 1 ? 14 : 0,
     paddingBottom: i < boardMembers.length - 1 ? 14 : 0,
BLI: marginBottom: i < boardMembers.length - 1 ? 10 : 0,
     paddingBottom: i < boardMembers.length - 1 ? 10 : 0,
```

Ekonomi- och Trupp-raderna: minska marginBottom:
```
VAR: marginBottom: 6 (ekonomi), marginBottom: 4 (trupp)
BLI: marginBottom: 4 (alla rader)
```

## Filer
- `src/presentation/screens/BoardMeetingScreen.tsx`
