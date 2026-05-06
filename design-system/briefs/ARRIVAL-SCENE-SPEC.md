# ArrivalScene — implementations-spec

**Status:** ✅ Design godkänd · ⚠ Code att implementera
**Mock:** `ui_kits/intro_flode/Intro Flode v1.html`
**Källkod:** `ui_kits/intro_flode/artboards.jsx` (allt React-mönster ligger här)
**CSS-tokens:** `colors_and_type.css`

---

## Filosofi

Vägen från klubbval till Dashboard är **EN sammanhängande scen**, inte separata vyer. Spelaren klipper aldrig till svart. Bakgrunden består. Genre-etiketten består. Du har anlänt — nu sitter du där.

Inramningen (klubbnamn + datumrad + styrelse-rad) **dimmas men försvinner inte** när dialogen startar. Den blir scenens minne.

---

## State

```ts
const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
const [arrivalDone, setArrivalDone] = useState(false);

useEffect(() => {
  const t = setTimeout(() => setArrivalDone(true), 3400);
  return () => clearTimeout(t);
}, []);

const arrivalDim = step >= 1;
```

`step` driver **allt**:

| step | Vad visas | CTA-label |
|---|---|---|
| 0 | Bara Ankomsten (auto-fade in) | "Gå in →" (efter 3.4 s) |
| 1 | Ankomsten dimmad + Margareta | "Förstått" |
| 2 | + Pelle | "Det går bra" |
| 3 | + Sture | "Då börjar vi" |
| 4 | Fade-overlay → navigera till `/dashboard` | — |

`arrivalDone` styr bara om CTA i steg 0 är klickbar.

---

## Layout

```
┌──────────────────────────────────────┐
│        ⬩ Ankomsten ⬩                 │  ← stationär, byts aldrig
│                                       │
│        ━ ━ ━ ━                        │  ← progress (4 streck), syns bara step ≥ 1
│                                       │
│            Forsbacka.                 │  ← inramning (dimmas vid step ≥ 1)
│  Onsdag kväll. Lampan vid…            │
│  Pelle. Margareta. Sture.             │
│  Tre kaffekoppar redan på bordet.     │
│                                       │
│  ─────                                │  ← divider (visas step ≥ 1)
│                                       │
│  (M)  MARGARETA · KASSÖR              │  ← CoffeeRow vänster
│       "Truppen är 22…"                │
│                                       │
│       PELLE · ORDFÖRANDE  (P)         │  ← CoffeeRow höger
│                "Plats fem till…"      │
│                                       │
│  (S)  STURE · LEDAMOT                 │  ← CoffeeRow vänster
│       "För många här är det…"         │
│                                       │
│  ┌────────────────────────────┐      │
│  │       Förstått             │      │  ← SceneCTA, label byts per step
│  └────────────────────────────┘      │
└──────────────────────────────────────┘
```

Full viewport. `--bg-scene` bakgrund hela vägen. Ingen GameHeader, ingen BottomNav.

---

## Inramnings-block (Ankomsten)

Tre rader, alltid renderade. Dimning sker via interpolation av `opacity` + `font-size` när `step >= 1`.

| Rad | Default | Dimmad | Innehåll |
|---|---|---|---|
| Klubbnamn | Georgia 26px, `--text-light` | 18px, opacity 0.42 | `{clubName}.` |
| Tid + plats | Georgia italic 16px, `--text-light-secondary`, opacity 0.42 | 12px | `"{weekday} kväll. Lampan vid klubbhuset lyser. De väntar dig där inne."` |
| Styrelse-rad | Georgia italic 16px, opacity 0.42 | 12px | `{chairman}. {treasurer}. {member}.` + `<br/>Tre kaffekoppar redan på bordet.` (sista raden döljs när dimmad) |

Transition: `opacity 0.9s ease-out, font-size 0.6s ease-out`.

`weekday` på svenska: lördag→söndag som "lördag/söndag", annars "måndag", "tisdag" etc.

---

## CoffeeRow

Återanvänd från `CoffeeExchange.tsx` om möjligt. Annars:

```tsx
function CoffeeRow({ initial, name, text, align }: {
  initial: string; name: string; text: string; align: 'left' | 'right';
}) {
  return (
    <div className={`coffee-row coffee-row-${align}`}>
      <div className="initial-circle">{initial}</div>
      <div className="speaker-block">
        <div className="speaker-name">{name}</div>
        <div className="speaker-quote">"{text}"</div>
      </div>
    </div>
  );
}
```

CSS-värden:

```css
.coffee-row {
  display: flex; align-items: flex-start; gap: 12px;
  opacity: 0; animation: fade-in-soft 0.6s ease-out forwards;
}
.coffee-row-right { flex-direction: row-reverse; text-align: right; }

.initial-circle {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--bg-dark-elevated);
  border: 1px solid var(--bg-leather);
  display: flex; align-items: center; justify-content: center;
  font-family: Georgia, serif; font-size: 13px;
  color: var(--text-light-secondary);
  flex-shrink: 0; margin-top: 2px;
}

.speaker-name {
  font-size: 9px; letter-spacing: 1.5px;
  text-transform: uppercase; font-weight: 600;
  color: var(--text-muted); margin-bottom: 2px;
}

.speaker-quote {
  font-family: Georgia, serif; font-size: 13px;
  font-style: italic; line-height: 1.5;
  color: var(--text-light-secondary);
}

@keyframes fade-in-soft {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## Repliker (mall)

Flätar in dynamiska siffror från klubbvalet.

```ts
const margaretaText =
  `Truppen är ${squadSize}. ${expiringContracts} kontrakt går ut i vår. ` +
  `Kassa ${formatKr(cashKr)}, transferbudget ${formatKr(transferBudgetKr)}. ` +
  `Mer har vi inte.`;

const pelleText =
  `Plats ${expectedRankLow} till ${expectedRankHigh}. Inget kvalspel. ` +
  `Och håll bygden med oss — tomma läktare är dåligt för bandyn och dåligt för budgeten.`;

const stureText =
  `För många här är det här säsongens enda samling. Glöm inte det.`;
```

`formatKr(380000) → "380 tkr"`. `formatKr(1200000) → "1.2 mkr"`.

`expectedRankLow/High` baseras på klubbens svårighetsgrad (lågt seedrade → 9–12, mellan → 5–8, topp → 1–4).

Ledamotens replik bör varieras lätt per klubb (kulturell flagga: bruksandan, tomma helger, ungdom, stuga vid sjön — vad som passar orten). Tre-fyra varianter räcker; randomisera vid säsongsstart.

---

## Progress

```tsx
{step >= 1 && (
  <div className="beat-progress">
    {[0, 1, 2, 3].map(i => (
      <span key={i} className={`dot ${i < step ? 'active' : ''}`} />
    ))}
  </div>
)}
```

```css
.beat-progress { display: flex; gap: 4px; justify-content: center; }
.beat-progress .dot {
  width: 24px; height: 2px; border-radius: 1px;
  background: var(--border-dark); opacity: 0.3;
}
.beat-progress .dot.active {
  background: var(--accent); opacity: 0.8;
}
```

Ankomsten räknas inte. 4 steck = Margareta, Pelle, Sture, Då-börjar-vi.

---

## Bakgrund + glow

```css
.arrival-scene {
  position: relative;
  min-height: 100vh;
  background: var(--bg-scene);
  color: var(--text-light);
}

.arrival-scene::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(
    ellipse 60% 40% at 50% 0%,
    color-mix(in srgb, var(--accent) 8%, transparent) 0%,
    transparent 70%
  );
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.8s ease-out;
}

.arrival-scene.dim::before { opacity: 0.3; }
```

Klassen `dim` toggleas när `step >= 1` (du är inomhus nu).

---

## CTA

```tsx
const ctaLabel =
  step === 0 ? 'Gå in →' :
  step === 1 ? 'Förstått' :
  step === 2 ? 'Det går bra' :
  step === 3 ? 'Då börjar vi' : null;

const ctaDisabled = step === 0 && !arrivalDone;

<button
  className="scene-cta"
  disabled={ctaDisabled}
  onClick={() => {
    if (step === 4) return;
    if (step === 3) {
      setStep(4);
      setTimeout(() => navigate('/dashboard'), 800);
    } else {
      setStep(s => (s + 1) as 0|1|2|3|4);
    }
  }}
>
  {ctaLabel}
</button>
```

```css
.scene-cta {
  width: 100%; padding: 14px;
  background: var(--bg-dark-elevated);
  color: var(--text-light);
  border: 1px solid var(--bg-leather);
  border-radius: 8px;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  font-family: var(--font-body);
  transition: background 0.15s, border-color 0.15s;
}
.scene-cta:hover {
  background: var(--accent-deep);
  border-color: var(--accent);
}
.scene-cta:disabled {
  opacity: 0; pointer-events: none;
}
```

I steg 0 fade:as CTA in via `animation: fade-in-static 0.6s ease-out forwards; animation-delay: 3400ms;` (eller via `arrivalDone` + opacity-transition).

---

## Steg 4 — exit

```tsx
{step === 4 && (
  <div className="arrival-exit">
    <span>→ Dashboard</span>
  </div>
)}
```

```css
.arrival-exit {
  position: absolute; inset: 0; z-index: 5;
  background: var(--bg-scene);
  display: flex; align-items: center; justify-content: center;
  opacity: 0;
  animation: fade-in-static 0.8s ease-out forwards;
}
.arrival-exit span {
  font-size: 11px; color: var(--text-muted);
  letter-spacing: 3px; text-transform: uppercase;
}
```

`navigate('/dashboard')` triggas via setTimeout 800ms efter att step blivit 4 (matchar fadens varaktighet).

---

## Förbjudet

- DifficultyTag i scenen
- "⬩ TRE SAMTAL ⬩", "⬩ Styrelsemötet ⬩" eller andra genre-etiketter — det är **Ankomsten** hela vägen
- Knapp "Tillbaka"
- GameHeader, BottomNav
- Route-byten mellan steg 0–3
- Klippning till svart mellan rörelser
- Att ta bort Ankomstens text när dialog börjar (den ska *dimmas*, inte tas bort)

---

## Filer som ersätts

Följande befintliga filer slås samman till `ArrivalScene.tsx`:

- `IntroBackground.tsx` (om den finns)
- `IntroNarrative.tsx` (om den finns)
- Eventuella separata `BoardMeetingScene.tsx` / `ArrivalScreen.tsx`

Routing: en route `/intro` som renderar `<ArrivalScene clubData={...} onComplete={() => navigate('/dashboard')} />`.

---

## Props

```ts
interface ArrivalSceneProps {
  clubName: string;
  chairman: string;
  treasurer: string;
  member: string;
  squadSize: number;
  expiringContracts: number;
  cashKr: number;
  transferBudgetKr: number;
  expectedRankLow: number;
  expectedRankHigh: number;
  currentDate: Date;
  onComplete: () => void;
}
```

---

## Referenser

- `ui_kits/intro_flode/artboards.jsx` — komplett React-implementation att översätta rakt av
- `ui_kits/intro_flode/Intro Flode v1.html` — CSS, animations, tokens
- `colors_and_type.css` — design-tokens
- `DESIGN-DECISIONS.md` § "Intro-flöde — kontinuerlig scen (Ankomsten)"
