# ArrivalScene — stegvis-ackumulativ (rätt modell, ersätter beat-modell-spec)

**Datum:** 2026-05-07 (revidering 2)
**Spec-typ:** Korrigering — ersätter felaktig beat-modell-spec från tidigare i samma session
**Mock:** `docs/mockups/2026-05-07_arrival_scene_revision_mock.html`
**Status:** Code's commit 7d2960b implementerade beat-modell (helskärm-per-replik) baserat på min felaktiga spec. Ska backas till stegvis-ackumulativ enligt denna revidering.

## Process-fel som ledde hit

Jag tolkade Jacobs feedback "som tidigare board-meeting" som "BoardMeetingScene's beat-modell — en replik åt gången, föregående försvinner". Det var fel. Jacob menade *"som första sekvensen (IntroSequence) gör — text byggs upp stegvis på samma skärm"* — alltså ackumulativ inom EN skärm.

ARRIVAL-SCENE-SPEC.md hade rätt princip från början: *"Inramningen dimmas men försvinner inte. Den blir scenens minne."*

Code's commit 7d2960b ska backas. Denna spec är korrigeringen.

## Rätt modell: stegvis-ackumulativ

EN skärm hela scenen igenom. Bakgrund består. Genre-label överst består. Beat-progress (4 streck) består. Föregående repliker dimmas men försvinner inte — de blir scenens minne.

## Stages (inte "beats" — visuellt EN skärm hela vägen)

| Stage | Vad som syns | Vad som dimmas | CTA |
|---|---|---|---|
| 1 | Setting-prolog (full opacity) | — | "Sätt dig vid bordet" |
| 2 | + Margareta-replik (full) | Setting dimmas till 0.4 | "Förstått" |
| 3 | + Pelle-replik (full) | Setting + Margareta dimmas | "Det går bra" |
| 4 | + Sture-replik (full) | Setting + Margareta + Pelle dimmas | "Då börjar vi" |
| 5 | Fade-overlay → /dashboard | — | (auto) |

Vid sista stage syns alla fyra element på skärmen: setting + 3 repliker. Aktuell replik är full opacity, allt föregående är 0.4.

## Layout (matchar mockfilen)

```
┌──────────────────────────────────────┐
│        ⬩ Ankomsten ⬩                │  ← persistent
│        ━ ━ ━ ━                        │  ← progress (alla aktiva vid stage 4)
│                                       │
│  Forsbacka.                           │  ← setting (dimmad efter stage 1)
│  Onsdag kväll. Lampan vid bordet…     │
│                                       │
│  MARGARETA                            │  ← speaker-label
│  "Vi har väntat på dig…"              │  ← replik (dimmad efter stage 2)
│                                       │
│  PELLE                                │
│  "Truppen är bra. Men kassan…"        │  ← replik (dimmad efter stage 3)
│                                       │
│  STURE                                │
│  "Inte förrän nyårsafton…"            │  ← aktuell replik (full opacity)
│                                       │
│  [        Då börjar vi        ]       │  ← CTA per stage
└──────────────────────────────────────┘
```

Padding och vertikal rytm är kompakt nog att alla 4 element + header + CTA får plats på 380px-mobil-höjd.

## CSS-tokens (designsystem-konformt)

- Bakgrund: `var(--bg-portal)`
- Genre-label: 9px weight 600 letter-spacing 4 copper opacity 0.7
- Progress: 24px × 2px streck, accent fyllda + opacity 0.8 vid aktiv, border-dark + opacity 0.3 vid kommande
- Setting-prolog: Georgia italic 13px text-light-secondary line-height 1.6
- Setting "Forsbacka" prefix: Georgia regular 14px text-light bold weight 600
- Speaker-label: 9px weight 600 letter-spacing 2 copper opacity 0.85
- Quote: Georgia 14px text-light line-height 1.55
- Dimmed-state: opacity 0.4 (transition 0.5s ease)
- CTA: outline-stil — transparent bg, 1.5px accent border, text-light, 12px×16px padding

## State-arkitektur

```ts
const [currentStage, setCurrentStage] = useState<0 | 1 | 2 | 3 | 4>(0)

// Stage 0 = setting, 1-3 = repliker, 4 = exit-fade
const stages = [
  { type: 'setting', cta: 'Sätt dig vid bordet' },
  { type: 'replica', speaker: 'Margareta', body: getStureLine('margareta'), cta: 'Förstått' },
  { type: 'replica', speaker: 'Pelle',     body: getStureLine('pelle'),     cta: 'Det går bra' },
  { type: 'replica', speaker: 'Sture',     body: getStureLine('sture'),     cta: 'Då börjar vi' },
]

// Render: ALLA stages t.o.m. currentStage syns i stack-order. 
// Endast currentStage har full opacity — föregående är dimmade.
```

## Render-logik

```tsx
{/* Setting visas alltid (vid stage 0 full, sedan dimmad) */}
<div className={`as-setting ${currentStage > 0 ? 'dimmed' : ''}`}>
  <strong>Forsbacka.</strong> Onsdag kväll. Lampan vid bordet…
</div>

{/* Repliker visas EFTER de blivit aktuella, dimmas EFTER nästa kommer */}
{stages.slice(1, currentStage + 1).map((stage, i) => {
  const stageIndex = i + 1
  const isCurrent = stageIndex === currentStage
  return (
    <div key={stageIndex} className={`as-replica ${!isCurrent ? 'dimmed' : ''}`}>
      <div className="as-speaker">{stage.speaker}</div>
      <div className="as-quote">"{stage.body}"</div>
    </div>
  )
})}
```

Klick på CTA → `setCurrentStage(s => s + 1)`. Vid stage 4 → fade-overlay + onComplete.

## Implementation steg — backa Code's commit

`src/presentation/screens/ArrivalScene.tsx`:

1. **Backa beat-modell-implementationen** (commit 7d2960b). Återgå till stage-baserad render.
2. **State:** `currentStage: 0|1|2|3|4` istället för `currentBeat`.
3. **Render:** ackumulativ stack — alla stages t.o.m. currentStage syns. Endast currentStage är full opacity, föregående dimmade till 0.4.
4. **Setting-prolog persisterar** från stage 0 hela vägen. Dimmas vid stage > 0.
5. **CTA per stage** (samma som tidigare).
6. **setTimeout cleanup** behålls från fix A (commit 9c45abc).
7. **CSS:** wrap stage-element i `.as-replica`-klass med transition opacity 0.5s. `.dimmed`-modifier för opacity 0.4.
8. **Borttagning:** beat-progress-rendering kan behållas (4 streck visas baserat på `currentStage` istf `currentBeat` — visuellt samma).

## Vad jag fick fel tidigare och varför

Tidigare beat-modell-spec sa "föregående beats är borta när nästa visar". Det var fel tolkning — Jacob ville aldrig att repliker ska försvinna, han ville att de ska dimmas så samtalet bygger upp visuellt på samma skärm.

Lärdom: när Jacob säger "som första sekvensen" (IntroSequence S0/S1) refererar han till **hur text-rytmen byggs upp på en skärm**, inte att nästa scen ska tas in som ny route. "Board-meeting"-referensen var till mönstret med stage-progression och CTA per beat — inte till att föregående beat ska försvinna.

## Tester

- Snapshot per stage (4 st: setting, +margareta, +pelle, +sture)
- Stage 4 CTA → fade-overlay + onComplete
- Dimmed-state-rendering: föregående repliker har klassen `.dimmed`
- npm run build && npm test gröna

## Verifiering i playtest

- Starta nytt spel → välj klubb → ArrivalScene
- Stage 1: bara setting + "Sätt dig vid bordet"-CTA
- Stage 2: setting dimmad + Margareta full-opacity
- Stage 3: setting + Margareta dimmade + Pelle full
- Stage 4: alla föregående dimmade + Sture full
- Allt syns på en skärm vid sista stage — samtalet är "scenens minne"
- Sista CTA → fade → /game/dashboard

## Effekt på existing artefakter

- `design-system/briefs/ARRIVAL-SCENE-SPEC.md` — den ursprungliga specen var **rätt** i sin princip. Kan uppdateras med ny CTA-text om så önskas, men ackumulativ-modellen behöver inte ändras.
- Tidigare i denna session: `2026-05-07_arrival_scene_revision_spec.md` (beat-modell) — **obsolet**, ersätts av denna fil.
- `design-system/ui_kits/intro_flode/Intro Flode v1.html` — gamla kafferumsraderna kan vara giltiga om de ackumulerar. Verifiera mot ursprunglig spec.
