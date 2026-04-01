# Fixspec: Cup-snabbsim och Bandydoktorn (INGA WORKAROUNDS)

## Bakgrund
Föregående spec fuskade med workarounds: "tvinga live-läge för cupmatcher" och "göm Bandydoktorn". Denna spec fixa dem på riktigt.

---

## 🔴 FIX 1: Cup-snabbsim ska fungera

### Problem
Snabbsimulering av cupmatcher spelar aldrig matchen. Föregående matchen visas om och om igen tills man väljer livekommentering.

### Root cause
I `src/application/useCases/roundProcessor.ts`, rad ~290, finns:

```typescript
// Skip scheduled cup fixtures for the managed club — they must be played live
if (
  fixture.isCup &&
  fixture.status === FixtureStatus.Scheduled &&
  (fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId)
) {
  hasManagedCupPending = true
  continue
}
```

Detta skippar ALLTID managed club-cupmatcher, oavsett om spelaren har valt snabbsim.

### Riktig fix
Managed club-cupmatcher ska simuleras av advance-funktionen precis som ligamatcher — **om spelaren har satt en lineup** (`game.managedClubPendingLineup !== undefined`). Lineupen sätts av `setPlayerLineup()` i MatchScreen innan `advance()` anropas.

**Ändra blocket i roundProcessor.ts:**

```typescript
// Only skip managed cup fixtures if no lineup has been set (= player hasn't chosen to play yet)
// If managedClubPendingLineup exists, player chose quick-sim — simulate the match normally
if (
  fixture.isCup &&
  fixture.status === FixtureStatus.Scheduled &&
  (fixture.homeClubId === game.managedClubId || fixture.awayClubId === game.managedClubId) &&
  game.managedClubPendingLineup === undefined
) {
  hasManagedCupPending = true
  continue
}
```

Den enda ändringen: lägg till `&& game.managedClubPendingLineup === undefined`.

När lineup finns → matchen simuleras precis som en ligamatch (använder `managedClubPendingLineup` som lineup, genererar AI-lineup för motståndaren). All befintlig logik längre ner i funktionen hanterar redan detta korrekt — den kör `game.managedClubPendingLineup` för home/away beroende på managed club-sida.

### Revert workaround i MatchScreen.tsx
Ta bort den tillagda workarounden som Code lade in:

Ändra tillbaka `handlePlayMatch()`:
```typescript
// REVERT: Ta bort `|| isCupFixture` — cupmatcher SKA kunna snabbsimuleras nu
// VAR: const effectiveLiveMode = useLiveMode || isCupFixture
// BLI: använd useLiveMode direkt igen
if (useLiveMode && nextFixture) {
```

Om Code lade till `isCupMatch`-prop till StartStep — ta bort den och ta bort disable-logiken på snabbsim-togglen. Spelaren ska kunna välja fritt.

### Filer att ändra
| Fil | Ändring |
|-----|---------|
| `roundProcessor.ts` | Lägg till `&& game.managedClubPendingLineup === undefined` i cup-skip-villkoret |
| `MatchScreen.tsx` | Ta bort `effectiveLiveMode`-workarounden, använd `useLiveMode` direkt |
| `StartStep.tsx` | Ta bort eventuell `isCupMatch`-disable på snabbsim-toggle |

### Verifiering
- [ ] Ställ in lag för cupmatch, välj snabbsim → matchen simuleras och resultat visas
- [ ] Cupens bracket uppdateras korrekt efter snabbsimulerad match
- [ ] Välj livekommentering för cupmatch → fungerar som innan
- [ ] Advance via dashboard (utan att ha satt lineup) → cupmatchen skippas korrekt och man får spela den manuellt

---

## 🔴 FIX 2: Bandydoktorn ska fungera

### Problem
Bandydoktorn (AI-rådgivare) visas i UI:t men ger felmeddelande. Jacob frågar vad den är och om den ska vara synlig.

### Root cause
Inte en kodbugg. `BandyDoktorScreen.tsx` och `server.js` är korrekt implementerade. Problemet är att **`ANTHROPIC_API_KEY` environment variable inte är konfigurerad på Render-deployen**.

Servern (server.js rad ~65):
```javascript
const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) return res.status(500).json({ error: 'API key not configured' })
```

### Riktig fix

**Steg 1: Konfigurera API-nyckel på Render**
1. Gå till [Render Dashboard](https://dashboard.render.com)
2. Öppna Bandy Manager-tjänsten
3. Gå till Environment → Environment Variables
4. Lägg till: `ANTHROPIC_API_KEY` = din Anthropic API-nyckel
5. Tryck "Save Changes" → tjänsten restartar

Om du inte har en API-nyckel: https://console.anthropic.com/settings/keys

**Steg 2: Förbättra felmeddelandet i BandyDoktorScreen**
Nuvarande felmeddelande ("Doktorn är inte tillgänglig just nu. API key not configured") är tekniskt och otydligt. Förbättra det.

I `BandyDoktorScreen.tsx`, ersätt catch-blockets felmeddelande:
```typescript
// Nuvarande:
setError(`Doktorn är inte tillgänglig just nu. ${msg}`)

// Nytt — ge tydligare info:
if (msg.includes('API key') || msg.includes('500')) {
  setError('Bandydoktorn kräver en API-nyckel från Anthropic. Konfigurera ANTHROPIC_API_KEY på Render.')
} else {
  setError(`Bandydoktorn kunde inte svara: ${msg}`)
}
```

**Steg 3: Lägg till en kort förklaring överst i BandyDoktorScreen**
Före quick questions, visa vad Bandydoktorn är:
```tsx
{messages.length === 0 && (
  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
    Bandydoktorn är din AI-assistent. Ställ frågor om taktik, spelarval, 
    och matchförberedelser. {questionsLeft} frågor per omgång.
  </div>
)}
```

### Filer att ändra
| Fil | Ändring |
|-----|---------|
| `BandyDoktorScreen.tsx` | Bättre felmeddelande + kort intro-text |
| **Render Dashboard** | Konfigurera `ANTHROPIC_API_KEY` env var |

### Verifiering
- [ ] Öppna Bandydoktorn → intro-text visas
- [ ] Ställ en fråga → svar kommer (om API-nyckel konfigurerad)
- [ ] Utan API-nyckel → tydligt felmeddelande om vad som behövs

---

## ORDNING
1. Fix 1 (roundProcessor.ts) — en rad ändrad
2. Fix 1 revert (MatchScreen.tsx, StartStep.tsx) — ta bort workaround
3. Fix 2 (BandyDoktorScreen.tsx) — bättre felmeddelande + intro
4. Fix 2 (Render) — deploy-config, inte kod

`npm run build` efter steg 1-3. Pusha.
