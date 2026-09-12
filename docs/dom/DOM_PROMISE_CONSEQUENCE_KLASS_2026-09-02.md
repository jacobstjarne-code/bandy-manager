# DOM (KLASS) — PROMISE↔CONSEQUENCE i copy: avprecisera eller bekräfta stale

**Datum:** 2026-09-02 · **Av:** Opus · **Typ:** klassdom (täcker flera MASTER-rader mot EN regel, så Code kör dem i bulk) · **Utlöst av:** Opus-radgenomgången — flera "textlucka"-rader är samma klass som O11/`licenseHandlingsplan`: subtiteln lovar en mekanisk effekt koden inte har. Kodläst mot mecenatService.

## Regeln (lärdom #41, nu som körbar klass)

Subtiteln/undertexten spelaren SER är löftet. När den lovar en effekt mekaniken inte levererar finns TRE utfall, och Code avgör per rad genom att läsa subtitel mot `effect`:

1. **Effekten SAKNAS helt** → avprecisera copyn till vad som faktiskt händer (samma som license/O11). INGEN ny mekanik byggs — texten slutar lova. Opus skriver ersättningstexten om den kräver svensk omskrivning; en ren strykning av ett falskt löfte (ta bort "⏰ truppen missar en träningsdag") kräver ingen Opus-text.
2. **Effekten ligger på ANNAT ställe** (eventResolver post-switch via eventId, en separat processor) → subtiteln är SANN, raden är STALE. Bekräfta + stäng. Radera INGET.
3. **Effekten SKA finnas men är en egen feature** → inte denna dom; flagga som egen backlog-rad.

## Kodläst klassificering (mecenatService.ts)

- **`sluttest-mecenat-traningsdag`** — social-event `accept` lovar "⏰ truppen missar en träningsdag", effekt är bara `mecenatHappiness +15`. Utfall 1: träningsdags-kostnaden finns inte. **Avprecisera: ta bort "⏰ truppen missar en träningsdag" ur subtiteln** (eller bygg kostnaden som egen feature — Jacobs kall, men default avprecisera). Ren strykning, ingen Opus-text.
- **`sluttest-mecenat-transferbudget`** (silentShout transfer, "mecenat bidrar") + **`sluttest-mecenat-projektfinans`** (alliance, "projekt finansieras") — lovar pengar, effekt är happiness. Utfall 1 ELLER 3: om mecenat-bidrag ALDRIG blir en riktig kr-effekt → avprecisera; om det ska bli det → egen feature. **Code läser om någon resolver applicerar en kr-effekt på dessa eventId (som retirement-valen gör); om ja → stale (utfall 2), om nej → avprecisera (utfall 1).**
- **`sluttest-mecenat-*` retirement-valen (listen/plan_succession/offer_tribute)** — `effect: noOp` men subtitlar lovar "+5 relation · +3 orten". Koden (kommentar rad ~1607) säger effekten sköts av eventResolver post-switch via eventId. **Utfall 2: STALE. Subtiteln är sann, effekten ligger på annat ställe. Bekräfta + stäng, radera inget.**

## whyNow-klustret — REDAN DÖMT I KODEN (stale)

`sluttest-d1-whynow-mecenat/economicstress/playerunhappy/criticaleconomy`: koden (mecenatService rad ~ silentShout 90+-grenen, O11-kommentaren) säger EXPLICIT att mecenatEvent MEDVETET bara sätter whyNow på 90+-styrelsehotet — de andra sju undertyperna "lämnas medvetet utan whyNow, nedgraderas till normal, precis som domen kräver". Så "saknar whyNow-text" är inte en lucka — det är en DÖMD nedgradering. **Utfall 2: dessa fyra rader är STALE mot O11-domen. Bekräfta att economicStress/playerUnhappy/criticalEconomy följer samma dömda mönster (whyNow bara där en verklig risk uttalas), stäng annars.** Om någon av dem SKA ha whyNow (ett event som uttalar en verklig risk men saknar raden) → då är det EN Opus-textrad, flagga den enskilt.

## Övriga i klassen (Code läser subtitel mot effect, samma tre utfall)
- `sluttest-julmarknad` — subtitle säger kostnad, nettosumman är positiv. Avprecisera subtiteln till nettot.
- `sluttest-kommunens_villkor` — byte-identiska effekter, `finansiering`-fältet läses ej. Utfall 2 (stale) eller avprecisera.
- `sluttest-playerpraise-vila` — "vila"-löftet håller inte mekaniskt. Avprecisera eller bygg vilan (Jacobs kall).
- `sluttest-avskedsvarning-generisk` (`licenseService`) — generisk text, nämner inget konkret. Det är en Opus-TEXTrad (skriv en mindre generisk avskedsvarning), inte avprecisering — flaggas som Opus, inte Code.

## ÄGARSKAP
Code: gå raderna ovan, läs subtitel mot `effect` + resolver-post-switch, tillämpa utfall 1/2/3. Utfall 1 (ren strykning av falskt löfte) + utfall 2 (bekräfta stale) är Code direkt. Utfall 1 som kräver svensk ersättningstext + `avskedsvarning-generisk` → tillbaka till Opus, flaggat per rad. Jacob: default är avprecisera; om en av dem (träningsdags-kostnad, mecenat-transferbidrag, playerpraise-vila) SKA bli en riktig mekanik är det hans kall att lyfta den till egen feature. Opus: eventuella ersättningstexter Code flaggar.
