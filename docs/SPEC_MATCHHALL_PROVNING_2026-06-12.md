# SPEC — Matchhallens prövning: mekanik (B1 Sprint 4)

**Datum:** 2026-06-12 · **Av:** Opus · **Till:** Code (domänmodell) + Fable (processtegs-mockar efter denna låsning)
**Bygger på:** REVIEW-B1-MOCK §6-svaren · gaffel-mocken (ingången, godkänd) · B1-sprintordningen · befintliga system: weekly-decision, politicianData, patronData, klack-mood (Birger/Västra Sidan), Bygdens puls, mecenat-kravmekaniken.
**Designprincip:** prövningen är en resa genom klubbens relationer, inte en byggkö. Varje steg har eget tryck, egen röst och egen avbrottskonsekvens (D2: noll konsekvens är frånvaro). Inga nya UI-mönster — stegen återanvänder weekly-decision, scen-kanon och cooldown-kortet.

---

## §0 Tillståndsmaskinen

```ts
interface HallTrial {
  stage: 'vilande' | 'forankring' | 'krav' | 'forhandling' | 'bygge' | 'klar' | 'nedlagd'
  support?: number            // 0–100, bara under forankring
  kravStatus?: KravChecklist  // bara under krav
  startedSeason: number
  stageStartedRound: number
  cooldownUntilSeason?: number  // efter fall/nedläggning
  finansiering?: 'egen' | 'kommun' | 'patron'  // sätts i förhandlingen
}
```

Trädet-nodens tag speglar stage: "Prövning" (vilande) → "Förankring · stöd 54" → "Krav 1/3" → "Förhandling" → "Bygge · klar omg N" (cooldown-kanon) → byggd-state. Portalen får beat vid varje stegskifte (befintligt beat-system).

**Snabbaste väg: 3 säsonger.** Förankring (S1) → krav + förhandling (S2) → bygge (S2–S4). Det är medvetet längre än Akademins "om tre säsonger" — hallen är spelets största enskilda förändring.

## §1 Förankring (≈10 omgångar, samma säsong)

**Start:** "INLED FÖRANKRING" i gaffeln. Kostar inget i kassa. Omedelbar konsekvens: klack-pool + kafferum får prövnings-strängar nästa omgång (Opus skriver poolen i processtegs-textpasset).

**Stödmätaren (0–100), startvärde:** `40 + (klackMood − 50) × 0.4 + (puls − 50) × 0.3`, clamp 15–70. En klubb i sämja startar ~55, en i konflikt ~30.

**Under fasen:** 3 förankrings-decisions ur weekly-decision-systemet (Opus skriver copy):
1. **Medlemsmötet** (omg +3): lyssna-linje (+8 stöd, Själ —) eller övertyga-linje (+14 eller −10, 60/40 vägt mot klackMood)
2. **Birger ber om möte** (omg +6): ta mötet (+6 stöd, klackMood +) eller skjut upp (−8 stöd)
3. **Lokaltidningens enkät** (omg +8): öppenhet (+5, puls-koppling) eller ligg lågt (0, men −5 om stödet < 45 — tystnad tolkas)

Matchresultat påverkar passivt: derbyseger +3, derbyförlust −3, tre raka förluster −5 ("inte läge att prata hall nu").

**Avslut (omgång stageStartedRound + 10):** medlemsmötet röstar.
- **Stöd ≥ 60:** vidare till krav. Beat + kafferum.
- **40–59: bordlagt.** Kan återupptas nästa säsong med startvärde = slutvärde − 5. Noden visar "Bordlagd · kan väckas igen".
- **< 40: faller.** Cooldown 2 säsonger. Själ-hit om spelaren inleder igen direkt efter cooldown utan att klackMood förbättrats.

**Avbryta själv:** alltid möjligt. Konsekvens: liten klackMood-vinst ("han lyssnade"), cooldown 1 säsong.

## §2 Krav (≤ en säsong, formellt — ingen scen, checklist i gaffel-ytan)

Förbundet/kommunen ställer tre krav som ska vara gröna samtidigt:
1. **Kapital:** kassa ≥ 1 200 tkr ELLER borgenär (patron-relation ≥ tröskel låser upp patron-spåret; mecenat-systemets relationsvärde återanvänds)
2. **Underlag:** publiksnitt innevarande säsong ≥ klubbens 3-säsongssnitt × 1,1 (pulsen blir spak)
3. **Styrelsebeslut:** ja om senaste måluppfyllelse ≥ 50 % (B/mellan-state), annars kräver styrelsen en säsong till av resultat

Uppfyllda → förhandling. Tidsramen ute → bordlagt (inte fall — kraven är opersonliga).

## §3 Kommunförhandling (≈8 omgångar)

**Röst:** kommunalrådet via politicianData — systemet ÅTERANVÄNDS, ingen ny karaktär. Basodds från befintlig kommunrelation (portal-eskaleringens värde).

**2 förhandlings-decisions** där klubben väljer vad den ger:
- **Ungdomstimmar** i hallen till kommunen (Ungdom ↑ i konsekvensraden, men driftskostnad/säsong)
- **Delad drift** (lägre Ekonomi-uppsida, högre ja-odds)
- **Patron-jokern:** om patron-relation hög erbjuder patronen sig som finansiär — eget pris via befintliga kravmekaniken (patronen ÄGER en del av hallen narrativt; krav-arc:en fortsätter efter bygget)

**Utfall:** JA med villkor (alltid villkor — villkoren är de val som gjordes) · NEJ (cooldown 2 säsonger, omprövning kräver bättre kommunrelation) · JA-via-patron.
**Avbryta i detta steg:** kommunrelation − (slösad förhandlingstid).

## §4 Bygget (2 säsonger)

- Tar **byggsloten**: preseason-valet visar "Matchhallen byggs — kassan är låst i den" de två säsongerna. Max-ett-bygge-regeln gäller.
- Kassa: −2 800 tkr egen / −1 600 vid kommun / −900 vid patron (kalibreras mot ekonomimodellen — Code flaggar om beloppen bryter balansen).
- **Ett byggevent** (foot-radens "kan misslyckas"): vid byggets halvtid 25 % risk för fördyring-decision: skjut till +20 % kassa ELLER pausa en säsong (stödet och relationerna består — pengarna fattas).
- **Kan inte avbrytas** efter spadtaget. Det ska kännas i gaffel-copyn före.

## §5 Hallen klar — effekterna

- **Ekonomi ↑:** åretrunt-intäkt per säsong + väderoberoende publikintäkt (ingen mildvinter-dipp)
- **Ungdom ↑:** träningstidsbonus i akademisystemet
- **Publik:** modellen byter karaktär — golv höjs (väderskydd), tak sänks något (klacken glesnar): nettot beror på klackMood vid invigningen
- **Själ — priset verkställs i SPRÅKET:** utomhus-poolen (kåsan, vallen, snön, "äkta bandykväll") fasas ut ur atmosfär/anslag/efterklang för hall-varianter som Opus skriver. Västra Sidan får en egen arc (försoning eller utvandring, klackMood-styrd). Det här är spelets enda permanenta identitetsskifte — texten ÄR konsekvensen, inte en mätare.

## §6 Avgränsningar v1
Ingen alternativ-arena under bygget (bygget sker bredvid). Inga mellanlägen (halvtak). Hallen kan inte rivas. Processtegs-scenerna mockas av Fable EFTER denna spec (per handoff §5); tills dess renderas stegen i gaffel-ytan med befintliga mönster (checklist = kravkortet, stöd = mätare i konsekvensrad-stil).

## §7 Ordning
1. Code: domänmodell + tillståndsmaskin + förankringens stödmätare (efter notisdiet + svep, per sprintordningen)
2. Opus: prövningens textpooler — **KLART 2026-06-12: `docs/TEXTPOOLER_PROVNING_2026-06-12.md`** (ambient per steg, alla decisions, hall-atmosfären, stödmätarlägen, nod-subs)
3. Fable: processtegs-mockar (förankringsscenen + förhandlingsscenen; krav är checklist, bygge är cooldown-kanon)

— Opus, 2026-06-12
