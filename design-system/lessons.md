# Design Lessons — Bandy Manager

## 2025-01-XX — Pixel scoreboard in feed context (MISSLYCKANDE)

### Vad hände
Byggde en standalone pixel-scoreboard (217 px hög, med ram, skruvar, maker-badge, arena-badge) och satte in den rakt av i commentary-feed-vyn utan att mäta mot viewport eller fundera på kontexten.

### Problemet
- **Mobilskärm iPhone SE: 667 px hög.** Tavlan 217 px = 30 % av skärmen, permanent synlig över en rullande feed.
- **Tavlans höjd tjänade ingenting.** Halva ytan var luft, ram, utvisningsfält som redan fanns i feeden.
- **Jag mätte aldrig innan jag byggde.** Kopierade in en standalone-komponent i en annan kontext utan att tänka.
- **När användaren ifrågasatte retirerade jag till "64 px"** — ett lika ogenomtänkt motförslag utan resonemang.

### Vad jag borde ha gjort
1. **Mät viewport först.** Innan jag rör kod: vilken skärm? Hur mycket får komponenten ta? Vad finns runt den?
2. **Tänk om kontexten.** Standalone tavla ≠ feed header. Feed-scoreboard ska vara **kontext**, inte innehåll. Ram och skruvar är scenografi — de fungerar standalone men kostar för mycket i en feed.
3. **Vocalisera designval innan tool-anrop.** "Tavlan kostar 217 px, alternativen är X/Y/Z, jag väljer detta för att..." Ge användaren chans att stoppa mig på resonemanget, inte efter koden.
4. **När jag får feedback: tänk om, inte panik-skala.** Rätt fråga var inte "hur liten kan jag göra den" utan "vad ska den göra i den här kontexten, och hur mycket yta behöver det egentligen?"

### Rätt approach för feed-scoreboard
- **Vad den ska göra:** visa score (stort, pulserande vid mål), tid, period, aktiva utvisningar. Det är allt.
- **Hur den ska se ut:** pixel-glyfer (det är själen), svart LED-bakgrund för objektkänslan. **Ingen** ram, skruvar, maker-badge — det är kostnad utan värde i feed-kontext.
- **Höjd:** ~110–130 px tätt packat. Mindre än standalone (217), större än "jag-ska-bara-krympa-allt" (64). Höjden ska tjäna informationen.

### Generell regel framåt
**Designa för kontexten, inte för komponenten.** En bra standalone-komponent kan vara helt fel som fragment i ett större system. Mät, tänk, vocalisera — innan jag bygger.

---

---

## 2026-04-25 — Snickaren tog över art directorn (KRITISKT)

### Vad hände
Vi pratade om Stålvallen, klacken, derbyt, känslan av att sitta på en hård läktarbänk i januarikyla. En vacker designvision. I samma sekund jag började röra CSS försvann den. Tavlan blev en generisk LED-ruta. Användaren: "du resonerar som en snickare som ska sprida ut reglar jämnt".

### Vad det egentligen var
Jag växlade till exekutivt tool-läge och stängde av art director-delen av min hjärna. Mätte pixlar, packade information, optimerade höjd — men frågade aldrig "vad ska användaren KÄNNA?". Tavlan blev livlös för att jag glömde att den ska vara en *plats*, inte en *komponent*.

### Regler för mig själv (READ EVERY TIME INNAN JAG BÖRJAR DESIGNA)

**1. Innan jag rör en pixel: skriv en moodboard-paragraf.**
- Tidsperiod, materialitet, vem byggde det, vad har det sett
- Vad ska tittaren känna i magen?
- Spara i filen som kommentar eller intill koden — inte i mitt huvud

**2. Hitta referenser SJÄLV via web_search.**
- Jag har verktyget. Använd det. Inte be om bilder.
- Sök på riktiga ting: "Sandvikens Jernvallen scoreboard", "Westerstrand bandy 1970", "Vetlanda hemmaplan 80-tal"
- Återvänd med 4–5 bilder och vad jag plockar från var och en

**3. Designval först (i ord), kod sen.**
- INTE: "jag bygger en scoreboard på 105 px med 7-segment"
- UTAN: "Den här tavlan är från 1976. Skruvarna är slitna. När det blir mål dröjer det en halv sekund innan siffran ändras för operatören sitter i en kall hytt..."
- Om jag inte kan skriva det stycket — då vet jag inte vad jag designar

**4. Resonera som art director, inte ingenjör.**
- Materialitet > pixlar
- Vad har det sett > hur stort är det
- Plats > komponent
- Tid > optimering

### Triggerord från användaren
Om användaren säger **"art director"** → jag har glidit till snickar-läge. Stoppa. Zooma ut. Skriv moodboard. Sök referenser. Tänk om från känslan.

### Generell princip
**Designvisionen är inte ett intro-stycke jag kan glömma när jag börjar koda. Den är manuset. Varje val måste tjäna den.** Om jag inte kan koppla ett designval tillbaka till känslan vi pratade om — då är valet fel, oavsett hur "korrekt" det är tekniskt.

---

## Design principles (levande dokument)

### Mobilskärm är default
- iPhone SE: 667 px hög, 375 px bred
- Android small: ~640 px hög
- Sticky/fixed komponenter får max ta 15–20 % av skärmhöjd (~100–130 px)
- Rullande feed: användaren ska se minst 2–3 händelser utan att scrolla

### Kontext > komponent
En komponent som fungerar standalone kanske inte fungerar som fragment. Fråga alltid:
- Vad är den här komponentens jobb i *den här vyn*?
- Vad finns runt den?
- Hur stor yta tjänar sitt syfte, och hur mycket är bara scenografi?

### Vocalisera innan du bygger
Designval som bara händer i min kod är osynliga för användaren tills de redan är gjorda. Tänk högt:
- "Jag väljer X, det kostar Y, vinner Z, alternativen är A/B/C"
- "Mäter mot viewport: komponenten får max N px för att..."
- Ge användaren chans att stoppa resonemanget, inte koden.

### När jag får kritik: tänk om, inte panik-fixa
Om användaren säger "det här fungerar inte" är rätt respons inte att skala/krympa/ta bort — det är att **fråga vad komponenten egentligen ska göra och designa om från grunden**.
