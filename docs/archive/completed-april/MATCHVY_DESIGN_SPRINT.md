# MATCHVY DESIGN SPRINT — Levande bandykänsla

Samlad spec för att göra matchvyn till spelets starkaste
upplevelse. Berör MatchLiveScreen, StatsFooter, scoreboard,
kontroller, och StartStep.

---

## 1. ATMOSFÄRKORT (Steg 3) — "📣 PEP-TALK"

**Nuläge:** Kortet med atmosfärtext hänger löst utan rubrik.
**Fix:** Ge det en section label som alla andra kort:

```tsx
<div className="card-round" style={{
  marginBottom: 12, padding: '14px 16px',
}}>
  <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '2.5px',
    textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
    📣 PEP-TALK
  </p>
  <p style={{
    fontFamily: 'var(--font-display)',
    fontStyle: 'italic', fontSize: 14, lineHeight: 1.6,
    color: 'var(--text-secondary)',
  }}>
    {getPreMatchAtmosphere(...)}
  </p>
</div>
```

**Fil:** `StartStep.tsx` — kirurgisk fix, direkt edit av Opus.

---

## 2. UTVISNING PÅ SCOREBOARDEN

**Nuläge:** Utvisningsraden renderas UNDER scoreboarden som
en separat div. Ser inte ut som en riktig resultattavla.

**Önskat:** Utvisningen ska visas INUTI det svarta scoreboard-
fältet, precis under målsiffrorna. Liknar en riktig bandy-
tavla där utvisade spelare visas i en liten ruta.

**Fix i MatchLiveScreen.tsx:**

Flytta utvisningsraden INUTI scoreboard-diven (den med
`background: '#0A0A0A'`). Placera den efter väderraden,
INNANFÖR scoreboard-containern:

```tsx
{/* Inside scoreboard div, after weather */}
{hasSusp && (
  <div style={{
    display: 'flex', justifyContent: 'space-between',
    padding: '4px 16px',
    fontSize: 10, fontWeight: 700, letterSpacing: '1px',
    color: '#FF4444',
    fontFamily: 'Courier New, monospace',
    opacity: hasSusp ? 1 : 0,
    transition: 'opacity 0.3s ease',
    height: 18,
  }}>
    <div>{homeSusp.length > 0 ? `UTÖ ${homeSusp.join(' ')}` : ''}</div>
    <div>{awaySusp.length > 0 ? `UTÖ ${awaySusp.join(' ')}` : ''}</div>
  </div>
)}
```

LED-stil: monospace, rött, versaler. Samma designspråk som
målsiffrorna (Courier New, textShadow-glow).

---

## 3. KONTROLLKNAPPAR — RUBRIK + GRUPPERING

**Nuläge:** Knapparna (⏸ ⏩ 🔄 🔊) flyter utan sammanhang.

**Fix:** Lägg till en liten label och ge dem mer visuellt
sammanhang med scoreboarden:

```tsx
<div style={{
  background: 'var(--bg-surface)',
  padding: '8px 16px 6px',
  borderBottom: '1px solid var(--border)',
}}>
  <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
    {/* knappar */}
  </div>
</div>
```

Labeln "Match-verktyg" som Jacob föreslog kan läggas till,
men risken är att det blir för texttungt. Knappikonerna är
redan tydliga. Testa utan label först — om det fortfarande
känns löst, lägg till.

---

## 4. INTENSITETSMÄTARE — Momentum, inte divider

**Nuläge:** En 3px hög svart bar som ändrar bredd. Ser ut
som en CSS-divider, inte som en mätare.

**Önskat:** En levande momentum-indikator som visar hur
matchen flödar. Två varianter att välja mellan:

### Alt A: Dubbel momentum-bar (hemma ← → borta)
```
[====HEMMA====|===BORTA===]
```
Baren visar vem som dominerar just nu. Hemma-sidan i
accent/copper, borta-sidan i muted/grå. Mittstrecket
rör sig baserat på bollinnehav/intensitet.

```tsx
<div style={{ height: 6, display: 'flex', overflow: 'hidden',
  borderRadius: 3, margin: '0 16px 4px' }}>
  <div style={{
    width: `${homeMomentum}%`,
    background: 'linear-gradient(90deg, var(--accent), var(--accent-dark))',
    transition: 'width 1s ease-out',
  }} />
  <div style={{
    flex: 1,
    background: 'var(--border)',
  }} />
</div>
```

### Alt B: Vertikal intensitetspuls
Istället för en horisontell bar — en liten pulsande punkt
eller EKG-liknande linje som "slår snabbare" vid hög
intensitet. Knyter an till Bygdens Puls-estetiken.

**Rekommendation:** Alt A är enklare och tydligare. Alt B
är visuellt starkare men svårare att implementera.

---

## 5. MATCHVY — LEVANDE UPPLEVELSE (framtida sprint)

Idéer vi pratat om men inte implementerat:

### Publik-ljud-indikator
En liten "volym-bar" som visar publikens engagemang:
```
🔊 ████████░░  (hög stämning)
🔈 ███░░░░░░░  (tyst)
```
Knyts till fanMood + intensitet + mål.

### Rörlig boll-ikon
En liten punkt som rör sig horisontellt mellan de
två lagikonerna i scoreboarden. Visar vem som har
bollen just nu (attackingTeam). Subtil animation.

### Väder-effekter i commentary-flödet
Redan implementerat: SnowOverlay vid HeavySnow.
Kan utökas med:
- Dimma: commentary-items fadear mer (opacity 0.6)
- Töväder: commentary-text i blått (kallt)
- Klar kyla: extra glitter-effekt

### "Tidningslöp" vid mål
Vid mål: en kort "banner" som glider in uppifrån:
```
┌──────────────────────────────┐
│ ⚡ MÅL! Karlsson 2-1 (34')  │
└──────────────────────────────┘
```
Försvinner efter 3 sekunder. Mer impact än bara
highlighted text i feeden.

---

## 6. LISTA vs PLAN — Visuell harmonisering

**Nuläge:** Plan-vyn har snyggare formationsdiagram och
knappar. Lista-vyn har grundläggande styling.

**Princip:** Lista ska använda samma visuella komponenter:
- Samma tab-switcher-stil (bg-elevated/accent toggle)
- Spelarcirklar med tröjnummer (inte bara text)
- Samma "Generera bästa elvan"-knapp
- Samma formation-selector

**Fil:** `LineupStep.tsx` (lista-renderings), `PitchLineupView.tsx`
(plan-renderings). Harmonisera till EN visuell standard.

Tab-switchern bör matcha TabellScreen/ClubScreen-mönstret:
samma storlek, samma färger, samma border-bottom-accent.

---

## IMPLEMENTATIONSORDNING

```
1. Atmosfärkort rubrik (2 min — Opus direkt)
2. Utvisning inuti scoreboard (15 min — Opus/Code)
3. Momentum-bar alt A (15 min — Code)
4. Kontrollknappar gruppering (5 min — Code)
5. Lista/Plan harmonisering (30 min — Code)
6. Tidningslöp vid mål (20 min — Code, framtida sprint)
7. Publik/väder-effekter (framtida sprint)
```
