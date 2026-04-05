# FIXSPEC — Match-flöde UC2 (5 april kväll)

Baserad på UC2-testning. Berör MatchScreen.tsx, MatchHeader.tsx,
StartStep.tsx, TacticStep.tsx, GameShell.tsx.

---

## PROBLEM 1 — Två separata matchinfo-kort

MatchScreen renderar ett card-round med "vs Opponent + BORTA"
OCH sedan `<MatchHeader>` som ETT TILL kort med väder/taktik.
Ska vara ETT progressivt kort.

### Fix

**Fil:** `src/presentation/screens/MatchScreen.tsx`

Slå ihop det inline card-round-blocket och `<MatchHeader>` till
ett enda kort. MatchHeader-komponenten kan behållas men ska
renderas INUTI samma card-round — inte som en separat div.

Kortet ska visa (progressivt):

**Steg 1 (lineup):**
```
OMGÅNG 1
vs Målilla                              BORTA
☁️ +5°C · Bra is
```

**Steg 2 (tactic):**
```
OMGÅNG 1
vs Målilla                              BORTA
☁️ +5°C · Bra is
⚠️ Väderhint (om tillämpligt)
```

**Steg 3 (start):**
```
OMGÅNG 1
vs Målilla                              BORTA
☁️ +5°C · Bra is
Taktik: Högt tempo · Defensivt
"Kompakt. Inga luckor. Vi slår till på kontringar."
```

**Placering:** OVANFÖR stepper (1-2-3). Kortet är statiskt/sticky
medan stegen scrollar under.

Konkret:
1. Flytta roundLabel + "vs opponent" + hemma/borta-tag IN I
   MatchHeader-komponenten (eller skapa ett nytt `<MatchInfoCard>`).
2. Ta bort det separata card-round-blocket i MatchScreen.
3. MatchHeader ska INTE ha egen card-round-wrapper — den får sin
   styling från parent-kortet.

---

## PROBLEM 2 — Väder dubblerat i steg 3

MatchHeader visar väder. StartStep visar OCKSÅ ett väderkort.
Spelaren ser samma väderinfo två gånger.

### Fix

**Fil:** `src/presentation/components/match/StartStep.tsx`

Ta bort väderkortet ur StartStep (sök efter
`{matchWeatherData && (` och ta bort hela blocket som renderar
temperaturen och iskvaliteten). MatchHeader hanterar väder.

---

## PROBLEM 3 — Knappar inkonsistenta mellan steg

Steg 2: `← Tillbaka` (halvbredd) + `Nästa →` (halvbredd)
Steg 3: `← Ändra taktik` (helbredd) + `SPELA MATCHEN →` (helbredd)

### Fix

Använd SAMMA layout på alla steg:
- Alltid halvbredd: `← [Bakåt-text]` (btn-outline) + `[Framåt-text] →` (btn-copper)
- Undantag: "SPELA MATCHEN →" får vara helbredd ensam, men BARA
  om bakåtknappen flyttas uppåt eller tas bort.

**Enklaste lösningen:** Alla steg har halvbredd-par:

Steg 1: (ingen bakåt) + `Välj taktik →`
Steg 2: `← Ändra uppställning` + `Nästa →`
Steg 3: `← Ändra taktik` + `SPELA MATCHEN →`

**Filer:**
- `LineupStep.tsx` — kontrollera att "Nästa"-knappen finns
- `TacticStep.tsx` — ändra "Tillbaka" till "Ändra uppställning"
- `StartStep.tsx` — gör halvbredd-par: `← Ändra taktik` + `SPELA MATCHEN →`

Steg 2 (`TacticStep.tsx`), sök `Tillbaka` och ersätt med:
```
Ändra uppställning
```

Steg 3 (`StartStep.tsx`), ändra knapp-layouten:
```tsx
<div style={{ display: 'flex', gap: 8 }}>
  <button onClick={onBack} className="btn btn-outline" style={{
    flex: 1, padding: '14px', fontSize: 13,
  }}>
    ← Ändra taktik
  </button>
  <button onClick={onPlay} className="btn btn-copper" style={{
    flex: 1, padding: '14px', fontSize: 15, fontWeight: 700,
  }}>
    SPELA →
  </button>
</div>
```

---

## PROBLEM 4 — DoctorFAB synlig under matchflöde

🩺-ikonen flyter i nedre högra hörnet på matchflödet. Stör.

### Fix

**Fil:** `src/presentation/navigation/GameShell.tsx`

I `DoctorFAB`-funktionen, lägg till match-pathen i hide-listan:

```tsx
function DoctorFAB() {
  const navigate = useNavigate()
  const location = useLocation()
  // Hide on doctor, match flow, and live match
  if (location.pathname.includes('doctor') ||
      location.pathname.includes('match')) return null
  // ...
}
```

---

## IMPLEMENTATIONSORDNING

```
1. Problem 4 — DoctorFAB hide (1 min)
2. Problem 3 — Knapp-text + layout (10 min)
3. Problem 2 — Ta bort väderdubblering i StartStep (2 min)
4. Problem 1 — Slå ihop matchinfo-kort (20 min)
```

`npm run build && npm test` efter varje.

---

## UC2 VERIFIERING EFTER FIX

1. Gå till Match-fliken.
2. ✅ ETT kort överst: "Omgång X / vs Opponent / BORTA" + väder.
3. ✅ Stepper (1-2-3) under kortet.
4. Steg 1 (lineup):
   ✅ Kort visar omgång + motståndare + väder.
   ✅ Ingen DoctorFAB (🩺).
5. Steg 2 (taktik):
   ✅ Kort utökat med väderhint.
   ✅ Knappar: "← Ändra uppställning" + "Nästa →" (halvbredd).
6. Steg 3 (start):
   ✅ Kort utökat med taktik + tränarcitat.
   ✅ Atmosfärtext (italic) i body.
   ✅ Sammanfattning + spelläge.
   ✅ INGET separat väderkort (väder redan i toppkortet).
   ✅ Knappar: "← Ändra taktik" + "SPELA →" (halvbredd).
   ✅ Ingen DoctorFAB.
