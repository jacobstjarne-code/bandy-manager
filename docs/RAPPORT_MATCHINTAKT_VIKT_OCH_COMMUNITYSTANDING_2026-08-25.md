# Rapport: matchintäktens vikt idag, och vad som styr publiksiffran

2026-08-25. Rättelse mottagen (bortalagsandel var påhittad, byggs inte). Ny riktning: publiken ska ge MER, styrd av communityStanding, inte mindre. Rapport innan bygge.

## Vad väger matchintäkten i dag?

Mätt över alla tolv klubbar (8 seeds/klubb, en full säsongs `calcRoundIncome`-simulering per seed, plus säsongsslutets prispengar/patron/kommunbidrag):

| Klubb | Rep | Tier | Matchintäkt/säsong (snitt) | Total intäkt/säsong | % matchintäkt |
|---|---|---|---|---|---|
| Forsbacka | 85 | WinLeague | 537 361 | 950 959 | **56,5%** |
| Västanfors | 78 | ChallengeTop | 375 749 | 742 515 | 50,6% |
| Karlsborg | 68 | ChallengeTop | 312 653 | 639 492 | 48,9% |
| Målilla | 65 | MidTable | 270 644 | 581 422 | 46,5% |
| Gagnef | 63 | MidTable | 261 470 | 569 041 | 45,9% |
| Lesjöfors | 62 | MidTable | 259 644 | 555 612 | 46,7% |
| Hälleforsnäs | 60 | MidTable | 232 331 | 525 342 | 44,2% |
| Söderfors | 55 | MidTable | 219 351 | 494 344 | 44,4% |
| Skutskär | 52 | AvoidBottom | 171 358 | 436 541 | 39,3% |
| Rögle | 50 | AvoidBottom | 166 408 | 428 634 | 38,8% |
| Slottsbron | 48 | AvoidBottom | 160 303 | 419 322 | 38,2% |
| Heros | 45 | Survive | 142 032 | 391 240 | **36,3%** |

Långt över Sandvikens citerade 7-8%, för alla tolv — inte bara toppen. Modellen lever på gatet redan idag, konsekvent över hela ligan.

## Vad styr publiksiffran? Läser den communityStanding alls?

**Nej.** `calcRoundIncome` (`economyService.ts:217`):

```ts
const attendanceRate = Math.min(0.90, 0.35 + (fanMood / 100) * 0.40 + (position <= 3 ? 0.08 : 0))
```

Läser `fanMood` (klackens/publikens humör, resultat-/atmosfärdrivet) och `position` (liten topp-3-bonus). **`communityStanding` skickas in som parameter till `calcRoundIncome` men används ENDAST för `kommunBidrag` (engångsbetalning omgång 1) — aldrig för attendanceRate, `capacity`, eller `ticketPrice`.** Samma sak för `capacity` (`club.arenaCapacity ?? reputation*7+150`) och `ticketPrice` (`50+reputation*0,3`) — båda rykte-drivna, ingen communityStanding-koppling någonstans i matchintäktskedjan.

Det är alltså exakt det gap Jacob pekade ut: ortsystemets premiss (Bygdens puls, loppisen, kiosken — lokalt engagemang ÄR ekonomin) har byggts som en SIFFRA (communityStanding finns, rör sig, visas) men aldrig kopplats till den kausala kedjan "en klubb som betyder något för orten fyller läktaren."

## Föreslagen viktning

Målet: en Survive-klubb med HÖG communityStanding ska kunna gå plus, samma klubb med LÅG ska gå back — skillnaden ska vara stor nog att göra licensen räddningsbar utan att röra bortamatchernas nollintäkt (oförändrad, per rättelsen).

```ts
const ATTENDANCE_FLOOR = 0.20            // var 0.35 — att ignorera orten kostar golvet
const ATTENDANCE_MOOD_WEIGHT = 0.25      // var 0.40 — matchhumöret väger mindre
const ATTENDANCE_STANDING_WEIGHT = 0.45  // NY — den dominerande termen
const ATTENDANCE_CAP = 0.95              // var 0.90 — högre tak när orten kommer

const attendanceRate = Math.min(
  ATTENDANCE_CAP,
  ATTENDANCE_FLOOR
    + (fanMood / 100) * ATTENDANCE_MOOD_WEIGHT
    + ((communityStanding ?? 50) / 100) * ATTENDANCE_STANDING_WEIGHT
    + (position <= 3 ? 0.08 : 0),
)
```

**Varför denna fördelning:** communityStanding får STÖRRE vikt än fanMood (0,45 mot 0,25) medvetet — fanMood är strukturellt lågt för en klubb som förlorar de flesta matcher (Heros normalläge), så en räddningsväg som lutar på matchhumör vore ingen räddning alls. communityStanding är ORTOGONAL mot resultat — byggs genom civilt engagemang, medieval, community-beslut — exakt den typ av spelaragens Jacob efterfrågar. Golvet sänks (0,35→0,20): att helt ignorera orten ska kosta mer än dagens neutrala baslinje, inte bara ge uteblivet extra. Taket höjs marginellt (0,90→0,95) för att ge headroom när både humör och communityStanding är höga samtidigt.

**Räknat exempel, Heros (rep 45, capacity≈465, ticketPrice≈64):**
- communityStanding=90, fanMood=30 (realistiskt dåligt matchhumör): rate=0,20+0,075+0,405=0,68 → matchRevenue ≈ 465×0,68×64 ≈ 20 246/hemmaomgång.
- communityStanding=20, fanMood=30: rate=0,20+0,075+0,09=0,365 → matchRevenue ≈ 465×0,365×64 ≈ 10 862/hemmaomgång.
- **Skillnad: ~9 384/hemmaomgång × 11 = ~103 000 kr/säsong mellan hög och låg communityStanding.** Tillsammans med de redan kända spakarna (lönesänkning ~48k, kommunbidrags-optimering via samma communityStanding ~24-48k) närmar sig en högengagerad Survive-klubb den ~161 000 kr bortahål-täckningen som krävs för att bryta licensnekan-räknaren.

Bygger detta nu, testar, och mäter enligt ordern (alla tolv + en riktad hög-mot-låg-communityStanding-jämförelse för Heros, eftersom standardstresskriptet aldrig manipulerar communityStanding — den ligger kvar på default 50 genom en AI-spelad karriär om inget särskilt scenario byggs för att bevisa den kausala kedjan).
