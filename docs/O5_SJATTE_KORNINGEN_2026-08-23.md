# Acceptanstestet, rerun efter scope-utökningen (2026-08-23)

Samma 20 seeds, Västanfors, 8 säsonger. Mekanismen (position+objektiv i samma buffert, upprepade missar oskyddade) är verifierad korrekt via 17 nya enhetstester och en fristående regressionskontroll (2322/2322 gröna). Det här dokumentet handlar om vad som INTE ändrades och varför.

## Utfallet: identiskt sex-av-tjugo, en säsong förskjuten

Diff mot förra körningen: **exakt samma sex seeds sparkas** (70000/70003/70004/70005/70006/70013) — enda skillnaden är att seed 70004 nu sparkas säsong 4 i stället för säsong 5. Avskedstalet står kvar på 30 % (6/20).

**Seed 70014 (målscenariot) förblir fixat** — det var aldrig i tvivel, det är verifierat direkt i enhetstesterna (`boardService.test.ts`, räkneexemplet med tre golden-säsonger). Scope-utökningen löste exakt det den skulle lösa. Den löste bara inte de sex andra.

## Varför inte? Rotorsaken ligger utanför bufferns räckvidd

Bufferten (nu utökad) skyddar HELA säsongsslutstermen — position + objektiv. Den skyddar ALDRIG den **löpande omgångstermen** (vinst/förlust/förlustsvit, `updateRunningBoardPatience`) — det är ett separat, redan kalibrerat och LÅST system (Grind 1-passet, streak-taket på fem omgångar). Ingen del av den här ordern rörde det.

Position-trajektorierna för de sex:

| Seed | Placeringar | Notering |
|---|---|---|
| 70000 | 4, 2, 4, 7, 9 | Stadig nedgång från vid-ankaret till botten |
| 70003 | 5, 2, 3, 6, 4 | Slutar PÅ ankaret (4) sista säsongen — sparkas ändå |
| 70004 | 5, 1, **guld**, 4, 6 | Vann ligan säsong 2, sparkad två säsonger senare |
| 70005 | 5, 4, 8, 3, 5, 8 | Erratiskt, mycket oavgjort (streak-signal, inte position) |
| 70006 | 5, 2, 4, 6, 5, 4, 12 | Kollaps sista säsongen (12:a) |
| 70013 | **guld**, 3, 6, 6 | Vann ligan säsong 1, sparkad tre säsonger senare |

**Två av sex (70004, 70013) har samma FORM som 70014** — ett guld eller en toppsäsong tidigt, sedan en nedgång som slutar i avsked. Skillnaden mot 70014: BARA en golden-säsong (inte tre), vilket bankar för lite kredit (en golden ChallengeTop-säsong ≈ +7,5, långt under taket 20) för att täcka flera efterföljande halvsvaga säsongers ackumulerade skada — särskilt när skadan till stor del kommer från den löpande termen (förlustsviter mitt i säsongen), som bufferten aldrig rör.

De andra fyra (70000, 70003, 70005, 70006) ser mer ut som genuin, utdragen nedgång över flera säsonger snarare än "en enda dålig säsong efter lysande år" — precis den typ av misslyckande Grind 1-passet dömde som GILTIGT ("en svår klubb kan misslyckas utan sabotage"), fast nu synligt hos en LÄTT klubb också.

## Kriteriet, ärligt bedömt

**"En framgångsrik klubb ska inte sparkas för att den lyckats"** — uppfyllt för det konkreta fall som utlöste ordern (70014). Delvis öppen fråga för 70004/70013 — en enda golden-säsong är strukturellt annorlunda från tre, men om EN toppsäsong ska räcka för att köpa flera säsongers nedgångsskydd är en ny magnitudfråga, inte samma bugg som löstes idag.

**"År åtta ska det finnas minst ett ekonomiskt val där båda alternativen svider"** — oförändrat från förra körningen, fortsatt väl stött: 42 % av säsongssamplen hade en kassa under billigaste tillgängliga åtagande, 60/143 sampel, spritt över hela spelet inte bara tidiga år.

## Rekommenderas inte, bara lagt fram — Jacobs bord

Tre vägar härifrån:
1. **Godta 30 % som avsikt** — Grind 1:s princip ("misslyckande utan sabotage ska vara möjligt") gäller nu även LÄTT-klubben, inte bara SVÅR. Bygg inget mer.
2. **Sjätte pass på den löpande termen** — undersök om förlustsvit-taket (redan låst i Grind 1) ändå är för hårt när det upprepas över FLERA säsonger i följd, inte bara inom en säsong.
3. **Höj MERIT_BUFFER_CAP** så en enda golden-säsong bankar mer relativt kredit — påverkar då även Skutskär-typklubbar (redan kalibrerade i Grind 1), inte bara Västanfors-typ.

Ingen av de tre är byggd. Domen väntar.
