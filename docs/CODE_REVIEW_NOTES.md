# Kod-genomgång — Kvarvarande problem

## 🔴 Måste fixas

### 1. HistoryScreen.tsx — leather-bar direkt i kod (3 st)
Hall of Fame-sektionen använder `className="leather-bar texture-leather"` direkt, inte via SectionCard. SectionCard-fixen täcker inte detta.
```
Rad ~: <p className="leather-bar texture-leather" style={{ ... }}>🎯 Flest mål i karriären</p>
Rad ~: <p className="leather-bar texture-leather" style={{ ... }}>🏒 Flest matcher</p>
Rad ~: <p className="leather-bar texture-leather" style={{ ... }}>⭐ Bästa snittbetyg</p>
```
**Fix:** Byt till card-label inline pattern (ta bort className, behåll style men ändra color till `var(--text-muted)`).

### 2. HistoryScreen.tsx — saknar Georgia på rubrik
`<h1 style={{ fontSize: 20, fontWeight: 800...` saknar `fontFamily: 'var(--font-display)'`

### 3. RoundSummaryScreen.tsx — Ekonomi-nav pekar till /game/budget
```tsx
onClick={() => navigate('/game/budget')}
```
Om Budget bäddas in i Ekonomi-tab ska denna navigera till `/game/club` med state `{ tab: 'ekonomi' }` istället.

## 🟡 Bör fixas

### 4. Avbryt-knappen i MatchLiveScreen ✅ REDAN FIXAD
Kommentaren i koden: `// Avbryt removed — once match starts, you're committed`

### 5. PreSeasonScreen.tsx — spelarposition visar engelska
`topProspect.position` visar t.ex. "forward" istället för "Forward" (via positionShort). Bör använda `positionShort()`.

### 6. Ingen BandyDoktorScreen-granskning
Ska kontrolleras separat. Nås via Klubb-tab "🩺 Bandydoktorn →".

### 7. PlayerProfileContent.tsx — trolig källa till engelska attributnamn
Spelarprofilen som visas vid klick i Trupp kan visa raw engelska attributnycklar. Bör använda `attributeLabel()`.

## 🟢 Ser bra ut

- **EventScreen** — Ren dark overlay, inga designproblem
- **RoundSummaryScreen** — Tappable cards, bra dark theme
- **SeasonSummaryScreen** — Rik layout, poängkurva, narrativ
- **GameOverScreen** — Dark overlay med karriärstats
- **PreSeasonScreen** — Clean cards med budgetprioritet
- **MatchLiveScreen** — Avbryt borttagen, ljud, halvtidstaktik, pressfrågor
- **NewGameScreen** — Inte granskad (hanteras av Code i mockups)

## Sammanfattning
3 måste-fixar, 3 bör-fixar. Majoriteten av skärmarna ser bra ut efter dagens session.
