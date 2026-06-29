# REVIEW — B1-mocken (Opus → Fable, kopia Code)

**SLUTSTATUS 2026-06-12 em:** Slutversionen (14:50) verifierad — K1 åtgärdad (Åretrunt→Ungdom i trädets matchhall-nod), K2 åtgärdad (🏒→"HIF" i Georgia), plus Jacobs två chatfixar (CTA nowrap/mindre grad; gaffel-knappar staplade i full bredd — likvärdighet via exakt likhet). **MOCKEN SLUTGODKÄND, WIRING-KLAR.** N1–N3 nedan kvarstår som Code-noter för implementationen (N2 kassakostnad på läktarkortet är inte intagen i mocken — hanteras i wiring). §6-svaren nedan gäller oförändrat; handoffens "Öppet till Opus" är besvarat här.

**Datum:** 2026-06-12 · **Granskat:** `2026-06-11_design_b1_klubbutveckling.html` + HANDOFF mot placeringsbeslutet (BACKLOG B1), konsekvensrad-konventionen (#5), kanon (systempatch 06-11) och B1-sprintordningen.

## Dom: GODKÄND — med 2 korrigeringar före Code-wiring + 2 noter

Helheten sitter. Två ingångar/ett träd med mode-prop är exakt placeringsbeslutet. Matchhallen som kall avfart med "Prövning"-tag och pris-före-vinst är rätt läsning av gaffel-regeln — den enda kalla noden i ett varmt träd är ett starkare grepp än briefen bad om. Konstis-baseline som kursiv fotrad ("det är så bandy spelas") istället för nod är precis rätt: en baseline är inte ett mål. Valet-scenens "I år —" först på Akademin-kortet och avstå-raden bär knapp-likvärdighetsbeslutet hela vägen. Gaffelns två röster och den dubbelriktade raden gör det ingen annan yta i spelet gör: säljer ingenting.

## Korrigeringar (innan wiring)

**K1 — Dimensionsdrift i matchhall-noden (trädet).** Nodens konsekvensrad säger `Publik ↓ · Själ ↓ · Ekonomi ↑ · Åretrunt ↑` — men konventionen ni själva ratificerar i samma leverans är **fyra dimensioner: publik · ekonomi · ungdom · själ**. "Åretrunt" är ingen dimension, det är en mekanism. Gaffel-ytans version är korrekt (`Ungdom ↑ träningstid året om`). Trädet-noden ska matcha gaffeln: `Publik ↓ · Själ ↓ · Ekonomi ↑ · Ungdom ↑`. Konventionen överlever bara om den hålls även av sin upphovsman.

**K2 — 🏒 i game-headerns loggplatshållare.** Ishockeyklubba som klubbloggsymbol, i ett bandyspel — samma emoji jag flaggade i portalBeats i går. Byt till initialer ("HIF") eller tom cirkel. Mockar normaliserar; det här får inte normaliseras.

## Noter (för Code, kräver ingen ny mock)

**N1 — Mockens tre telefoner visar OLIKA tidpunkter.** Trädet visar mid-season (Läktare "Pågår · Klar omg 14", Värmestuga "Byggd 2025") medan Valet visar preseason där samma läktare och värmestuga är valbara. Pedagogiskt rätt i mocken — men Code ska inte wira dem som samtidiga tillstånd: trädet renderar alltid AKTUELLT state, Valet renderar bara `available`-noder vid säsongsstart.

**N2 — Läktarkortet i Valet saknar kassakostnad.** `Publik ↑ · Ekonomi ↑ · Ungdom —` men ingen `Kassa −tkr`, medan Värmestuga (−180) och Träningshall (−380) har den. Konventionens ärlighetsregel: köp-val visar alltid kassakostnaden — läktaren med vinsten först (per ordningsregeln) men kostnaden med: `Publik ↑ · Ekonomi ↑ · Kassa −XXX tkr`. Beloppet sätts av domänmodellen.

**N3 — Tillbaka-vägen på yta 1.** Trädet öppnas som egen yta från Orten — mocken saknar back-affordance. Ingen ny mock behövs: standard ←-navigation per befintligt mönster, men Code ska veta att det är push-med-tillbaka, inte flik.

## Svar på §6

**1. "Själ" behålls.** Inte "Orten" — det kolliderar med fliknamnet och skulle läsas som att *fliken* påverkas. "Själ" är spelets eget språk (klubbidentitet, själen i Efterklang-tonen) och får nu en datadefinition så den inte blir dekoration: **Själ = klack-relationen (Birger/Västra Sidan-mood) + identitetsvärdet.** Distinktionen mot Publik fastslås samtidigt, eftersom gaffel-raden visar att de tangerar varandra: **Publik = antal och intäkt** (pulsdrivet, mätbart), **Själ = relation och identitet** (vem vi är för dem som kommer ändå). Klacken kan glesna (Publik ↓) utan öppet brott (Själ —), och tvärtom. Code: dimensionsmappningen in i domänmodellen med exakt dessa definitioner.

**2. Två röster i ingången — stegvisa röster i prövningen.** Ingången hålls till klackledaren + kassören: hjärta mot plånbok, rent. Men processtegen får varsin röstprogression när mekaniken låses: *förankring* = Birger + medlemsmötet (interna), *krav* = förbundet (formellt brev, ingen scen), *kommunförhandling* = kommunalrådet — politicianData-systemet finns redan och ska återanvändas, inte dubbleras — med patronen som möjlig finansiär-joker beroende på relation. En röst per steg ger stegen egen identitet och gör prövningen till en resa genom klubbens relationer. Detta mockas efter mekanik-låsning, per er §5.

## Nästa steg
1. Fable: K1 + K2 i mocken (två minuters ändringar), sen är den wiring-klar.
2. Code: N1–N3 in i B1-implementationen när domänmodellen byggs (efter försoningssvepet + notisdieten per sprintordningen).
3. Opus: mekanik-låsning för prövningens steg (förankring → krav → förhandling → bygge) som egen spec innan processtegen mockas.
4. Städnotis: `DESIGNOMGANGEN-KOMPLETT-2026-06-11 (1).md` i incoming är en dubblett — kan raderas.

— Opus, 2026-06-12
