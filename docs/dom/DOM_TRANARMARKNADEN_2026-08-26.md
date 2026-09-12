# DOM — TRÄNARMARKNADEN

**Datum:** 2026-08-26 · **Av:** Opus · **Post:** `O13` / auditens `M11`
**Beslut:** Jacob, 2026-08-26. Efter avsked spelas säsongen utan dig, och sedan får du en fråga.

**Arbetskartan körd.** Fråga 1: `M11` och `O13` är samma post, öppen sedan 17 aug. Fråga 3: en managerkarriär som slutar vid första avskedet är kortare än genren kräver — och den blir det oavsett hur bra allt annat byggs. Fråga 4: vi byggde att avsked kan hända; motsatsen — att komma tillbaka — saknades. Fråga 5: `worldSeed` väntar sedan `K4` på sin första konsument, och det här är den. Fråga 7: klar när en spelare kan berätta om två klubbar i samma karriär.

---

## Vad som är fel i dag

Game Over erbjuder **Se karriären** eller **Ny karriär**. Ingen arbetslöshet, ingen ny klubb, ingen fortsättning.

Det gör avskedet till slutet på spelet i stället för slutet på ett kapitel. Och det motsäger vad vi just byggde: `Survive`-kontraktet, meritbufferten och styrelsens zon finns alla för att göra avskedet till en konsekvens man bär — inte till en `game over`-skärm.

---

## Lösningen

**Säsongen spelas utan dig.** Efter avskedet simuleras resten av säsongen och den påföljande, och du ser vad som hände. Din klubb klarade sig eller gick ner. Någon annan vann.

**Sedan kommer frågan.** Vill du börja om helt, eller pröva lyckan på tränarmarknaden?

**Erbjudandena är de klubbar som misslyckades medan du satt hemma.** Inte ett urval spelet gör åt dig — en följd av vad som hände. Tre av dem, ur ligans botten.

Det är hela poängen med formen: du får inte ett jobb för att spelet vill att du ska spela vidare, du får det för att någon annan också blev sparkad.

---

## Tre skärpningar

### 1 · Erbjudandena matchar vad du åstadkommit

En manager som vann ligan innan han sparkades får andra samtal än en som gick ner. `managerProfile` bär redan meriterna — titlar, säsonger, renommé.

**Konkret:** hög managerrenommé ger tre erbjudanden, låg ger ett eller inget. Och ett erbjudande från en bättre klubb än den du lämnade ska kräva att du faktiskt presterade innan avskedet.

### 2 · Din gamla klubb kan vara en av de tre

Om den gick illa utan dig kan den ringa tillbaka. Det är brutalt, det händer i verkligheten, och det är den bästa berättelsen i hela mekaniken.

Villkoret: bara om klubben gjorde det **sämre** under din efterträdare.

### 3 · Karriären ska kunna ta slut

Efter tredje avskedet — eller när managerrenomméet fallit under en tröskel — kommer inget samtal. Då är `Ny karriär` det enda som återstår, och det ska stå rakt: *Ingen ringde den här gången.*

En tränarmarknad utan botten är ingen marknad.

---

## Ordningen, och varför den är avsiktlig

**Först ser du säsongen. Sedan får du frågan.**

Att erbjudas ett jobb innan du vet hur det gick är att förlora det ögonblick där avskedet betyder något. Man ska hinna sitta med det.

---

## Vad som redan finns

**`worldSeed` + `rulesetVersion`** — byggt i `K4` 19 aug, noll konsumenter sedan dess. Detta är den. Samma värld, ny klubb.

**`managerProfile`** — bär historik, meriter och renommé över klubbgränsen. Byggd för precis det.

**Auto-simuleringen** — finns i `roundProcessor`s advance-loop.

**Kontrakt A** — `3.3` byggde arkivering före rensning och `HistoryScreen` med snapshot-prop. Den karriären är läsbar, och det är förutsättningen för att den ska kunna fortsätta.

**Vad som saknas:** att byta `managedClubId` utan att generera en ny värld. Code rapporterade 20 aug att `createNewGame` alltid genererar nytt — det är den enda verkliga nybyggnaden.

---

## Vad domen inte är

**Inte en jobbmarknad.** Ingen förhandling, inga anbud, ingen agent. Tre klubbar som är lediga för att de misslyckades.

**Inte en mjukare landning.** Avskedet ska fortfarande svida — det är därför du ser säsongen först och därför samtalet kan utebli.

**Inte en ny värld.** Ligan, klubbarna, spelarna och din historik står kvar. Det är hela värdet.

---

## Rapportera innan bygge

1. Vad kostar det att byta `managedClubId` och återställa det klubbspecifika utan att röra världen?
2. Kan auto-simuleringen köra en hel säsong utan spelarens klubb utan att kräva beslut?
3. Bär `managerProfile` allt som behövs för att bedöma erbjudanden, eller saknas något?
4. Vad händer med `SeasonSummary`-kedjan när managern byter klubb mitt i en karriär — bryts årsboken, eller fortsätter den?

Fråga 4 är den viktigaste. Om årsboken inte kan bära två klubbar är det den posten som ska byggas först.

---

## Godkänd när

En spelare kan berätta om två klubbar i samma karriär, och om vad som hände med den första efter att han lämnade.
