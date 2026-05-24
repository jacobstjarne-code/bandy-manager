# CODE — ArrivalScene Reboot v2 (2026-05-08)

**Kontext:** Nuvarande ArrivalScene-implementation har klick-stages-progression med en CTA-fade-in-mekanik som inte fungerar (CTA blir aldrig synlig efter klubbval — playtest 2026-05-08). Specen som driver den (`docs/mockups/2026-05-07_arrival_scene_revision_spec.md`) är förkastad.

**Ny approach:** En filmscen, inte en interaktion. Auto-progression över ~9 sekunder. Två repliker (Margareta, Sture) + BoardObjectives-block + ett (1) slut-CTA till dashboard.

**Auktoritativ mock:** `docs/mockups/2026-05-08_arrival-scene-reboot-v2_mock.html`. Öppna lokalt, kör en omgång, läs designnoterna i botten innan du rör kod.

---

## LÄS INNAN DU BÖRJAR

1. **Mocken** — `docs/mockups/2026-05-08_arrival-scene-reboot-v2_mock.html`. Den är auktoritativ för struktur, timing, layout, atmosfär.
2. **Nuvarande implementation** — `src/presentation/screens/ArrivalScene.tsx`. Förstå state-modellen som ska ersättas.
3. **BoardObjectives-rendering** — `src/presentation/components/portal/secondary/BoardObjectivesSecondary.tsx`. Layouten ska användas i scenen — antingen via extrahering till delad komponent eller via duplicering.
4. **Sture-data** — `src/domain/data/arrivalDialogue.ts` har `getStureLine(clubId)`. Behåll. Användning bara för Sture nu, inte Pelle/Kerstin.

---

## ARRIVAL-01 · Riv klick-stages-mekaniken

**Fil:** `src/presentation/screens/ArrivalScene.tsx`

Ta bort:
- `currentStage`-state med 6 lägen (0–5) baserad på klick-progression
- `ctaReady`-state och dess `useEffect`-fade-in-mekanik
- Stage-CTA-rendering med "Sätt dig vid bordet" → "Förstått" → osv (4 olika CTA-texter)
- Diagnostik-loggar från senaste sessionen (om kvar)

Behåll:
- `useNavigate` + `onComplete`-callback-pattern
- `useGameStore`-prenumeration
- `managedClub`-uppslag

---

## ARRIVAL-02 · Implementera auto-progression med 4 stages

**State:**
```ts
const [phase, setPhase] = useState<'setting' | 'margareta' | 'sture' | 'objectives' | 'cta'>('setting')
```

**Auto-progression-timer (en useEffect som kedjar):**
```ts
useEffect(() => {
  const next: Record<typeof phase, [typeof phase, number] | null> = {
    setting:    ['margareta',  1400],   // 1.4s efter setting fade-in
    margareta:  ['sture',      2200],   // 2.2s efter Margareta
    sture:      ['objectives', 2200],   // 2.2s efter Sture
    objectives: ['cta',        1400],   // 1.4s efter objectives
    cta:        null,                    // CTA visas, väntar klick
  }
  const step = next[phase]
  if (!step) return
  const [target, delay] = step
  const t = setTimeout(() => setPhase(target), delay)
  return () => clearTimeout(t)
}, [phase])
```

Total tid från mount till CTA klickbar: ~7.2s + initial setting fade-in (~1.2s) = ~8.4s. Hjärnminne: ungefär 9 sekunder.

**CTA-klick:**
```ts
<button className="btn-scene-cta" onClick={onComplete}>Då börjar vi</button>
```

Inga interna stages mellan repliker. Inget klick förrän slut-CTA.

---

## ARRIVAL-03 · Stack-layout — alla element ackumuleras, tidigare dimmas

Render-ordning i content-stacken:

1. **Setting** — alltid renderad. Klass `.scene-setting`. Modifier `.in` när `phase !== 'setting'` skulle vara fel — `.in` när `phase` är *vilket som helst* utom innan första timer fyrat. Praktiskt: tillstånd `setting-rendered` blir true direkt vid mount, eller via 200ms initial-delay.

   `.dimmed` när `phase !== 'setting'`.

2. **Margareta** — renderad när `phase` har passerat setting (`phase !== 'setting'`).
   `.dimmed` när `phase !== 'margareta'`.

3. **Sture** — renderad när `phase` är 'sture', 'objectives' eller 'cta'.
   `.dimmed` när `phase !== 'sture'`.

4. **BoardObjectives-block** — renderad när `phase` är 'objectives' eller 'cta'.
   **Inte dimmas — full opacity hela vägen.** Det är vad spelaren bär med sig.

5. **Slut-CTA** — renderad när `phase === 'cta'`.

Använd CSS-klasser med transitions istället för opacity-state direkt — se mockens `.scene-replica.in` / `.dimmed`-mönster.

---

## ARRIVAL-04 · BoardObjectives-rendering i scenen

**Två val — välj en, motivera i commit-meddelandet:**

**A.** Extrahera `BoardObjectivesSecondary`s rendering-logik till en återanvändbar komponent (t.ex. `BoardObjectivesList`) som tar `objectives`-prop. Använd den både i Portal-secondary och i ArrivalScene.

**B.** Duplicera layouten i ArrivalScene. Acceptera kort-term-skuld för att hålla scope nere. Skuld noteras i `lessons.md`.

Min rekommendation: **A** om det går snabbt (< 1 timma), annars **B**. ArrivalScene-implementation är prio.

**Datakälla:** `game.boardObjectives` (befintlig domänmodell). Visa max 3 mål — använd `slice(0, 3)` (intro är annan kontext än Portal där 2 är capen). Status, label, ägare, progress/money — exakt samma rendering som Portal-secondary.

---

## ARRIVAL-05 · Setting-text och Margareta-replik

**Setting** (Georgia italic, första stycket fett-fontstyle:normal):

```ts
const club = managedClub.name           // "Forsbacka", "Gagnef", etc
const margaretaName = "Margareta Lindqvist"   // se notering nedan
const stureName = `Sture ${club}`             // klubb-specifik

const setting = (
  <p>
    <strong>{club}.</strong>{' '}
    Onsdag kväll. Lampan vid klubbhuset lyser. De väntar dig där inne. {margaretaName}. {stureName}. Två kaffekoppar redan på bordet.
  </p>
)
```

**Margareta-replik:** generisk första iterationen — flytta varianter till `arrivalDialogue.ts` senare. Hårdkoda nu:

```ts
const margaretaQuote = `"Det här är en gammal klubb. Vi förväntar oss inte mirakel — men vi förväntar oss att det syns att du bryr dig. Tre kontrakt löper ut. Snacka med dom tidigt."`
```

**Sture-replik:** `getStureLine(managedClub.id)` från `arrivalDialogue.ts` (befintligt).

**Notering om namn:** Margareta och Sture är de två röster vi använder. Ägar-fältet i BoardObjectives kommer ge fullnamn för 3 personer (typ "P. Andersson", "K. Nyberg", "M. Lindqvist"). Det är OK att Margareta i setting-texten heter "Margareta Lindqvist" och i mål-blocket "M. LINDQVIST" — det är samma person. Pelle och Kerstin syns *bara* i mål-blocket nu (som ägare av rank- resp. ekonomi-mål).

---

## ARRIVAL-06 · Skip-länk

I header-området, position: absolute top: 28px right: 24px:

```tsx
<button className="scene-skip" onClick={onComplete}>
  Hoppa över ↘
</button>
```

Stylas som mocken visar — 10 px text, muted color, hover → accent. Klick triggar `onComplete` direkt utan att vänta in animationen.

---

## ARRIVAL-07 · Atmosfär (lampans flicker)

Bakgrunden ska ha en subtil pulserande varm-ton överst. Mocken har det via `:before`-pseudoelement på `.scene-frame` med `radial-gradient` och `lamp-flicker`-keyframe-animation.

Återskapa i React: lägg till en `<div className="arrival-lamp-overlay" />` absolut-positionerad inom scenens root, samt definitionerna i `global.css`. Eller direkt i komponenten med `style={{ animation: 'lamp-flicker 4s ease-in-out infinite' }}` — mindre snyggt men funktionellt.

CSS-keyframes från mocken (kopiera till global.css om de inte finns):
```css
@keyframes lamp-flicker {
  0%, 100% { opacity: 0.85; }
  35%      { opacity: 1; }
  55%      { opacity: 0.7; }
  72%      { opacity: 0.95; }
}
```

---

## VAD DU INTE SKA GÖRA

- **Inte återinföra klick-CTA mellan stages.** "Sätt dig vid bordet" / "Förstått" / "Det går bra" / "Då börjar vi"-sekvensen är borta. ETT (1) slut-CTA: "Då börjar vi". Klick → dashboard.
- **Inte använda `ctaReady`-fade-in-mekanik.** CTA visas direkt när `phase === 'cta'`. Ingen separat opacity-state.
- **Inte rendera Pelle eller Kerstin som dialog-repliker.** De finns i mål-blocket som ägare. Det räcker.
- **Inte dimma BoardObjectives-blocket.** Repliker dimmas, mål-blocket inte. Spelaren ska bära med sig målen in i Portal — de är aktuella, inte minne.
- **Inte ändra `getStureLine` eller `STURE_PER_CLUB`.** Dessa är intakta och rätt.
- **Inte röra BoardMeetingScene.** Den är en separat scen för andra ändamål och påverkas inte.

---

## ACCEPTANSKRITERIER

- [ ] Spelaren kan klicka klubbval → väntar 8-9 sekunder utan klick → ser auto-progression
- [ ] Phase-progression: setting → margareta → sture → objectives → cta — *utan klick mellan*
- [ ] Föregående repliker dimmas till opacity 0.4 när nästa är aktuell
- [ ] BoardObjectives-blocket dimmas inte — full opacity från det visas till slut
- [ ] Slut-CTA "Då börjar vi" visas efter `phase === 'cta'`. Klick → `onComplete()` (navigerar till dashboard)
- [ ] Skip-länk i övre höger hörn — klick → omedelbar `onComplete()`
- [ ] Lampans flicker-animation i bakgrunden (subtil, 4s-cykel)
- [ ] Total tid från mount till CTA klickbar: ~9 sekunder
- [ ] Ingen `ctaReady`-state, ingen klick-stage-räknare, ingen CTA-fade-in-mekanik
- [ ] Tester gröna (uppdatera ArrivalScene-tester eller markera som obsoleta)

---

## RAPPORTERA

För varje ARRIVAL-XX punkt: ✅ / ⚠️ / ❌ med en mening om vad som gjordes. Pusha som sammanhållen commit eller en commit per delsteg om du föredrar.

Slutrapportera mot denna fil. Jacob playtester när du klar.

---

## OUT OF SCOPE — separat insats

- **Klubb-specifik setting-text per arketyp.** Idag är "Lampan vid klubbhuset lyser. Onsdag kväll." generiskt för alla klubbar. Forsbacka är järnbruksklubb, Gagnef är skogsbygd, Edsbyn är kungariket — varje förtjänar egen settings-variant. Senare iteration.
- **Ljudlandskap.** Vinden, en dörr som öppnas, klacken som hörs i bakgrunden. För stort scope nu.
- **Margareta-replik-varianter.** Idag generisk hardcoded. Senare flyttas till `arrivalDialogue.ts` med varianter baserade på truppstorlek, antal kontrakt, etc.
- **Visuella personankare** (foto/illustration/färg per ledamot). Inte i v1.
