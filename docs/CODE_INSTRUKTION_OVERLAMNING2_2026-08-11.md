# CODE-INSTRUKTION — ÖVERLÄMNING 2: INVENTERING OCH BYGGE

**Datum:** 2026-08-11 · **Av:** Opus (chat)
**Underlag:** `docs/incoming/Överlämning 2/` — sex fristående HTML-filer plus `LÄS MIG.md`, sign-off:ade av Design.
**Status:** okänd. Leveransen är äldre än den här sluttestserien och ingen har stämt av den mot koden. Delar av den kan vara byggd, delar kan ha byggts på annat sätt, delar kan aldrig ha påbörjats.

**Ligger efter:** `CODE_INSTRUKTION_GRANSKA_DEL4_2026-08-11.md`.

---

## Steg 0 · Inventeringen — RAPPORT, INGET BYGGE

Detta är hela första leveransen. Bygg ingenting förrän rapporten är läst.

För var och en av de sju ytorna i `4 · Audit-syntes (7 ytor).html`, plus de tre understödjande filerna, svara: **byggt / halvbyggt / ej påbörjat / byggt annorlunda än beskrivet.** Med filnamn och symbol som belägg, inte intryck.

Ytorna att stämma av:

1. **Ripple — "därför hände det"** · `rippleEffectService.describeRippleChain` finns enligt Designs egen not. Finns konsumenten? Syns kedjan någonstans i UI?
2. **Veckans beslut + grindad CTA** · Jag har sett grindningen i portalen live, så den delen finns. Är den kopplad till `weeklyDecisionService` som Design beskriver, eller byggd på annat sätt?
3. **Analys→Taktik-bryggan** · `GranskaAnalys` → `TaktikScreen`, justering förvald. Finns kopplingen alls?
4. **Taktik-brädet**
5. **Manager-arc-ytan** · `trainerArc` finns som fält (det dök upp i Club-strippen). Finns ytan?
6. **Gemensam beslutsmodell** · Detta är den enda posten som är arkitektur och inte yta. Rapportera vad som finns i dag: hur många oberoende beslutsvägar existerar (`weeklyDecision`, `pendingEvents`, `deferredDecisions`, transferbud, styrelsekrav)?
7. **Planen** — Designs egen ordning, återgiven nedan.

Plus:

- **Typografi-kanon** (`1 · Typografi-kanon.html`): `.h-num`-skalan 12/15/18, label 9px, emoji ut ur label-rollen. Finns `.h-num` i `global.css`? Är 9px-praxis genomförd? **Notera:** emoji-ut-ur-label-rollen är delvis gjord i den här serien via emoji-svepet — stäm av så vi inte river det som redan är rätt.
- **Live-vy före/efter** (`2 · Live-vy...`): flödesytan 196→528px, tavlan komprimerad, siffror i utfällbar låda, händelse-CTA skild från avancera-CTA. Detta rör `match/` som är märkt under utveckling — rapportera bara, bygg inte.
- **DS-konformanssvep 1–3** (färg+form, typografi+primary, tag+spacing): finns `RELÄ-Code-DS-konformans-svep1-3.md` i `incoming/` som en tidigare relä. Är den körd? Vilka avvikelser står kvar?
- **Emoji→Lucide perceptionsaudit**: överlappar emoji-svepet i del 3. Vad återstår efter det?
- **Portal-orientering (punkt 6)**: överlappar takregeln vi byggde. Är förslaget uppfyllt, motsagt eller orört?

**Rapportformat:** en tabell i `docs/sprints/`, en rad per post, med kolumnerna status · belägg (fil:symbol) · överlapp med sluttestserien · uppskattad storlek om ej byggd.

Överlappskolumnen är den viktigaste. Fyra av posterna rör ytor vi har byggt om de senaste tre dygnen, och Designs beskrivningar är skrivna före det. Där de motsäger nuvarande kod gäller nuvarande kod tills jag dömt annat.

---

## Steg 1–4 · Bygget, i Designs egen ordning

Startas först när steg 0 är rapporterat och jag har dömt vad som gäller. Ordningen är Designs, från `LÄS MIG.md`, och den håller:

0. Kör `debug/designAudit`-harnesset först — det fångar hårda inkonsistenser och finns redan.
1. **Ripple + veckans beslut som en slinga** (fil 4 yta 1+2, fil 5). Prototypen i fil 5 är klickbar och bevisar slingan beslut → grind → orsakskedja med olika följd per val.
2. **Granska-Analys → Taktik** (fil 4 yta 3, fil 6). Prototypen i fil 6 är klickbar.
3. **Manager-arc-ytan + gemensam beslutsmodell** (fil 4 yta 4 + 5b).
4. **Städpass:** `advance()` ut ur Granska-skärmens livscykel — Design flaggar den som latent bugg.

**Baseline före varje yta**, som genom hela den här serien. Prototyperna i fil 5 och 6 är klickbara och kan användas som referens för vad som ska hända — men de är mockups, inte specifikation av vår kodstruktur.

---

## Codes egna poster ur leveransen

Design listar fyra saker som uttryckligen inte är designfrågor. De ska in i steg 0-rapporten med status:

- `roundProcessor`-orkestreringen, körordningen
- `advance()`-sidoeffekten
- den gemensamma beslutsmodellens implementation
- eventuellt dubblerade ripple-utdrag i `roundProcessor`, plus användningen av hint-klustret

Den sista är värd extra uppmärksamhet: **dubblerade utdrag** är samma klass som de fyra dubbelrenderingar vi hittat i den här serien. Om ripple-utdragen dubbleras i `roundProcessor` bör dubbelrenderingsgrinden kunna fånga det — rapportera om entiteten är taggad.

---

## Vad som inte ingår

`match/` och scoreboarden. Live-vyns före/efter rapporteras men byggs inte.

Ceremonifamiljen (`PlayoffIntroScreen`, `QFSummary`, `HalfTimeSummary`, `SimSummary`, `ChampionScreen`, `GameOverScreen`). Den har ett designspår i scen-flödesauditen men ingen implementationsgranskning — den blir ett eget uppdrag.

Längdpasset (fyra simulerade säsonger med bildserier). Det ligger parkerat tills den visuella auditen är klar, enligt beslut.

---

## Text

Ingen ny svensk copy i något av detta. Ripple-kedjans formuleringar, manager-arcens rader och beslutsmodellens texter är mina — märk `[Opus]` och lämna listan.
