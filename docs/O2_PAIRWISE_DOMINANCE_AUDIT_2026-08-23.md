# O2 — Pairwise-dominansanalysen (steg 2)

**Datum:** 2026-08-23 · **Underlag:** `DOM_DOMINANS_OCH_FORHANDSDELTAN_2026-08-17.md`, steg 2 av Jacobs order ("noOp-grep först — klart, 13 bekräftade — sedan den fulla pairwise-analysen").

**Metod:** fyra parallella agenter läste var sin klunga av event-konstruktionsfiler i sin helhet, extraherade FULLA effektvektorer per val (inte bara `effect.type`), korsade varje kandidat mot `eventResolver.ts`s faktiska resolution (inklusive id-baserad specialcasing och `multiEffect`/`subEffects`-undertypsswitchen — den fälla steg 1 redan fångade en gång). Två oklarheter som uppstod under körningen verifierades direkt mot `eventResolver.ts` efteråt (se "Verifierat i efterhand" nedan) innan denna fil skrevs.

---

## Status (uppdateras löpande)

**Först, före allt annat:** `offer_pro` (varsel-mallen, `generateVarselEvent`) — hela truppens lön blev 0 kr istället för ×1,5. Fixat, commit `8c37d862` → efterföljande.

**Lager 1 (koden gör inte vad etiketten säger) — KLART, alla tre:**
- `ask_mecenat` (economicCrisisService.ts): okodad "lojalitet −30" wirad mot ny `mecenatHappinessDelta`, tie-break högst happiness, genereringsgrind ≥1 aktiv mecenat. Commit `6e9e6f11`.
- `extend_veteran` (arcService.ts, veteran_farewell): bytt boostMorale → extendContract (contractYears: 2). Commit `09fd3d8c`.
- `let_go` (arcService.ts, contract_drama): bytt boostMorale → multiEffect (boostMorale −25 + ny `releasePlayer`-effekt, spelaren blir faktiskt free agent). Commit `09fd3d8c`.

**Lager 2 (de tre tomma valen) — KLART:**
- `economic_crisis_awareness` (fas 1, "krismöte på Stadshotellet"): konverterad till ambient (`choices: []`). Commit `6e9e6f11`.
- `bandyLetter`/`schoolAssignment`: HÅLLS SOM ÄR (Jacobs dom — differentierad arkivtext per knapp är inte ett tomt val). Verifierat att `HistoryScreen.tsx` redan renderar båda arkiven (rad 246–296) — ingen kodändring behövdes.

**Lager 3 (dominansen):**
- `csPress`: KLART — individual behåller uppsidan men fick en 18% avundsjukerisk, team/system fick egna nischer (bredd / riskfri journalistrelation). Commit `c65f20a7`.
- `sponsorOffer`: KLART (mekanik + siffror) — 8% riskkoppling på plain-varianten, communityStanding/kontraktslängd synliga i accept-subtitlen. Commit `778d616e`. **Öppet:** "synlighetstexten" (platsen stänger ute en bättre sponsor senare) kräver en ny mening — inte skriven av Code, se rapport i chatten 2026-08-24.
- `arcService` (fyra återstående bågar — veteran_peak_event/contract_peak_event åtgärdade under lager 1): RAPPORT LEVERERAD i chatten 2026-08-24, INTE byggd — Jacob dömer per båge.

---

## Sammanfattning

- **Bekräftade dominanspar:** 60+ (exakt lista nedan, per fil/event)
- **Helt identiska val (värre än dominans — inget val alls):** 3 (economic crisis phase 1, alla bandyLetter-svar, alla schoolAssignment-svar)
- **Kostnader som bara finns i text, aldrig i kod:** 20+ instanser
- **Nyupptäckt magnitud-bugg (inte en dominansfråga):** `playerPraiseEvent`s "Fint att höra!"-val ger +5 moral, inte de +3 subtiteln lovar (fältnamnsmiss i multiEffect, se "Verifierat i efterhand")

---

## Materialar-korv-fallet (eventFactories.ts:577), löst

`economic_stress_kiosk`: `lock` (+4000 kr, `effect.type:'finance'`) vs `free` (`noOp`). Grepp över hela kodbasen efter ett fält som skulle hålla en "låst i två år"-bindning (lock/vendorLock/korvavtal, på `SaveGame`/`Club`) — inget sådant fält finns. Ingen id-baserad specialcasing fångar detta `eventId` heller.

**Dom: `lock` dominerar `free` fullständigt.** Den påstådda bindningskostnaden är ren text, aldrig verkställd.

---

## Verifierat i efterhand (två oklarheter agenterna flaggade, nu stängda)

**1. Är `patronHappiness`/`mecenatHappiness`/`patronInfluence` överhuvudtaget hanterade som top-level `effect.type`?** JA, alla tre — `eventResolver.ts:510` (`patronHappiness`, läser `effect.amount`), `:672` (`patronInfluence`, läser `effect.amount` för influence OCH `effect.value` för goodwill), `:684` (`mecenatHappiness`, läser `effect.amount`+`effect.value`). Detta river INTE någon av patron-fyndens dominansslutsatser nedan — de gäller.

Bieffekt av kontrollen: `patron_ignored`s "apologize"-val (`{type:'patronInfluence', amount:0, value:20}`) är INTE en no-op som misstänkt — den ger +20 `goodwill` (inte "relation"/happiness som subtiteln lovar). Fortfarande en textmatchningslucka (fel fält lovat), men inte ett dött val. Flyttad från "misstänkt" till "prosakostnad/-löfte som inte matchar verklig effekt" nedan.

**2. `boostMorale`-fältnamnsinkonsekvensen inuti `multiEffect`/`subEffects`.** `eventResolver.ts:858` läser `sub.amount ?? 5` (default 5 om fältet saknas). De flesta konstruktionsställen använder `amount` (korrekt). Två använder `value` istället:
- `generatePlayerPraiseEvent` ("Fint att höra!", `value: 3` båda spelarna) → `sub.amount` blir `undefined` → **faktisk effekt är +5 (defaultvärdet), inte +3 subtiteln lovar.** Verklig, mätbar magnitud-bugg — spelaren får MER moral än utlovat, tyst.
- `generateCoworkerBondEvent` (`value: 5` båda spelarna) → samma fältmiss, men råkar landa på samma tal som defaulten (5) — INGEN observerbar skillnad i praktiken, ren tur.

`generateVarselEvent`s "support"/"nothing" och `generateJournalistExclusiveEvent`s "accept" använde redan korrekt `amount` — deras dominansfynd nedan gäller som skrivna, ingen halvering till "eventuellt no-op".

---

## Bekräftade dominanspar

### eventFactories.ts
| Event | A (dominerar) | B (dominerad) | Kommentar |
|---|---|---|---|
| hesitantPlayerEvent | convince (+15 moral) | accept (noOp) | zero cost, löftet ("nyckelroll") aldrig verkställt |
| unhappyPlayerEvent | promise (+10 moral) | hold (noOp) | zero cost |
| generateDayJobConflictEvent | vila (+10 moral) | press (−3 moral) | "risk för skada" i press aldrig kodad |
| generatePlayerMediaEvent | talk (+8) | confront (−5) | båda gratis |
| generatePlayerMediaEvent | talk (+8) | ignore (−2) | båda gratis |
| generatePlayerMediaEvent | ignore (−2) | confront (−5) | confront helt dominerad av båda — aldrig rationellt val |
| generateCaptainSpeechEvent | support (+8/+5 lag + storyline) | decline (noOp) | zero cost |
| generateVarselEvent | support (+5 moral/spelare) | nothing (−8 moral/spelare) | bekräftat verklig effekt (amount-fältet korrekt) |
| generatePromotionOfferEvent | encourage (+8) | discourage (−3) | båda gratis |
| generateShiftConflictEvent | skip_warmup (−2) | bench (−5) | båda gratis, bench strikt sämre |
| generateJournalistExclusiveEvent | accept (+10 moral, +5 journalist, +1 community) | decline (−5 journalist) | zero cost, bekräftat verklig effekt |
| generateMecenatInterventionEvent | invite_generic (+8 happiness, gratis) | ignore (noOp) | zero cost |
| createEconomicStressEvent (bus) | shop (noOp) | sign (−5000 kr) | "billigare sen" aldrig kodat — sign är ren förlust |
| createEconomicStressEvent (kiosk) | lock (+4000 kr) | free (noOp) | se materialar-korv-fallet ovan |

### politicianEvents.ts
| Event | A (dominerar) | B (dominerad) | Kommentar |
|---|---|---|---|
| politician_youth (r4) | promise (+10 relation) | decline (−5) | zero cost, löftet aldrig brutet senare |
| politician_savings (r6) | comply (+10 relation) | pushback (−5) | "kommunbidrag +5 tkr" aldrig kodat |
| politician_prestige (r8) | welcome (+12 relation, +5 reputation) | independent (−5) | zero cost |
| politician_inclusion (r5) | start_program (+6000 kr, +5 fanMood, +3 community) | counter (+1 community) | strikt bättre på allt |
| politician_inclusion (r5) | start_program | already_open (−5 relation) | samma |
| politician_warning (r≥10) | invite (+10 relation) | low_profile (noOp) | zero cost |
| politician_warning (r≥10) | open_letter (+3 community) | low_profile (noOp) | low_profile dominerad av två av tre — nästan en fälla |
| kommot_demand savings | confirm (+10 relation) | pushback (−5) | zero cost |
| kommot_demand youth | confirm (+15 eller −5 beroende på skola) | focus (−8) | dominerar i BÅDA grenarna |
| kommot_demand prestige | welcome (+12 relation) | independent (−5) | zero cost |
| kommot_demand infrastructure | confirm (+10 relation) | later (−5) | zero cost |
| gentjanst (r2, korruption≥50) | yes (+20 relation) | community (+5 relation) | ingen korruptions-/rykte-/styrelsekostnad någonsin kopplad till nepotism-tjänsten |

### sponsorEvents.ts
| Event | Fynd |
|---|---|
| icaMaxiEvent | **INTE ren dominans** — `send_player` bär en DOLD id-baserad slumpeffekt (spelarmoral +5/−3 beroende på discipline) som varken syns i effektvektorn eller i UI-texten. Allvarligare integritetslucka än dominans: ett val ser gratis ut men bär en osynlig nedsida. |

### patronEvents.ts
| Event | A (dominerar) | B (dominerad) | Kommentar |
|---|---|---|---|
| patron_intro (r3) | welcome (+20 happiness) | cautious (+5) | zero cost |
| patron_unhappy | promise (+15) | refuse (−10) | zero cost |
| patron_withdraw | meet (+30) | accept (−50) | avsiktligt asymmetrisk "ge upp"-gren |
| patron_style | agree (+12) | diplomatic (text lovar +5, ger +3) | zero cost, plus textmiss |
| patron_style | diplomatic (+3 verklig) | refuse (text lovar −15, ger −8) | full strikt ordning agree > diplomatic > refuse |
| patron_influence_60 | listen (+15 happiness) | decline (−5) | "inflytande ökar"-löftet aldrig kodat — hela den avsedda avvägningen är påhittad |
| patron_emerge | welcome (relation 20) | cautious (relation 5) | identisk patronData/contribution i övrigt |

### supporterEvents.ts
| Event | A (dominerar) | B (dominerad) | Kommentar |
|---|---|---|---|
| supporter_tifo | yes (+5 mood, +2 community) | maybe (+2 mood) | identisk dold state (tifoDone=true båda), texten säger uttryckligen "inget kostar något" |
| supporter_conflict | both (+5 mood, +3 fanMood) | sture (−2 mood) | sture dominerad av BÅDA andra alternativen — fälla |
| supporter_conflict | elin (+3 mood, +1 community) | sture (−2 mood) | samma |
| supporter_open_letter | respond_publicly (+8 mood, +2 community) | meet_privately (+5 mood) | zero extra cost |
| supporter_open_letter | meet_privately (+5) | ignore (−2) | full strikt ordning: publicly > privately > ignore |
| supporter_away_trip | encourage (+5 mood, gratis) | acknowledge (+2 mood, gratis) | zero cost |

### postAdvanceEvents.ts
| Event | A (dominerar) | B (dominerad) | Kommentar |
|---|---|---|---|
| sponsorOffer (ingen rival) | accept (löpande intäkt) | reject (noOp) | ZERO kostnad kodad för en vanlig sponsor — mekaniskt gratis pengar varje gång |

*(sponsorOffer MED rival är korrekt icke-dominant — verklig −6 community-kostnad, bekräftat rätt gated till `choiceId==='accept'`.)*

### hallProcessService.ts
| Event | A (dominerar) | B (dominerad) | Kommentar |
|---|---|---|---|
| hallprocess_d2_s{s} (birger_mötet) | ta_motet (+6 support, garanterat) | skjut_upp (−8, garanterat) | ingen kodad kostnad för ta_motet |
| hallprocess_d3_s{s} (enkäten) | öppenhet (+5, alltid) | ligg_lågt (0 eller −5, aldrig positiv) | "Öppenhet bygger. Och binder." — bindningen aldrig kodad |

**Separat, allvarligare fynd (inte dominans):** `hallprocess_fh1_s{s}` (kommunens villkor) — `ungdomstimmar` och `delad_drift` serialiserar till **byte-för-byte identisk** `hallProcessData`, trots att texten lovar olika odds/löpande kostnad för respektive val. Inget av valen kan vara "fel" eftersom de mekaniskt ÄR samma val med två etiketter. Flaggat som bygg-/wiring-lucka, allvarligare än dominans.

### communityActivitiesEvents.ts
| Event | A (dominerar) | B (dominerad) | Kommentar |
|---|---|---|---|
| community_julmarknad | arrange (+8000 kr, netto) | skip (noOp) | texten säger "kostar 4000, ger 12000" — effekten är en FLAT +8000, ingen nedsida alls |
| community_loppis | support (+5000–8000 kr) | decline (noOp) | "kräver en dag" aldrig kodat |
| community_ismaskin | repair (facilities +5, GRATIS) | postpone (facilities −5) | "kostar 15 000 kr" — pengekostnaden är helt frånvarande ur effekten |
| community_fikakväll | fika (+8 fanMood, gratis) | skip (noOp) | "billigt (500 kr)" — kostnaden finns inte i effekten |
| community_bilbingo | go (+20 000 kr, garanterat) | pass (noOp) | texten ramar in det som riskabelt ("kan ge... om det går bra") — effekten är garanterad och riskfri |
| community_anlaggning | renovate (+5 reputation, GRATIS) | wait (noOp) | "kostar 25 000" saknas; wait:s egna hot ("faciliteter försämras") är också en noOp — hotet är påhittat åt BÅDA hållen |

### mecenatDinnerService.ts
| Fråga | A (dominerar) | B (dominerad) |
|---|---|---|
| q0 | opt0 (+4 happ, +2 community) | opt1 (+1 happ) |
| q1 | opt0 (+6 happ, +3 community, +15 000 kr) | opt1 (+2 happ, +1 community) |

*(q2 är korrekt icke-dominant — genuin avvägning happiness vs community. `DinnerOption.relationship`-fältet är för övrigt dött — satt i data, aldrig läst av resolvern, oavsett vilket val som görs.)*

### csPressEventService.ts
**`individual` dominerar ALLA TRE andra val fullständigt** (team/system/silent) — vinner eller är oavgjort på båda mätta dimensionerna (spelarmoral, journalistrelation) mot varje enskild rival, citatet publiceras oavsett val. Filens egen kommentar flaggar redan `team` som ett "ghost-val" med lägre visuell kontrast — koden bekräftar att det är mekaniskt underlägset, inte bara kosmetiskt nedtonat. Det finns aldrig en mekanisk anledning att välja något annat än `individual`.

### arcService.ts (playerArc)
Genomgående mönster: varje "peak event" i en karaktärsbåge har ett STÖDJANDE val som ger positiv moral med noll kostnad, och ett "hårt"/avvisande val som ger negativ moral — enda axeln som mäts är moral, så det stödjande valet dominerar alltid:

| Arc | A (dominerar) | B (dominerad) |
|---|---|---|
| hungrig_peak_event | back_him (+5 moral) | pressure (−5) / alternatives (−15) |
| joker_peak_event | back_joker (+8) | bench_joker (−10) |
| veteran_peak_event | extend_veteran (+10) | farewell_veteran (−20) / wait_veteran (noOp) |
| vetfinal_ceremony | ceremony_flowers (+15 hela laget) | ceremony_simple (+5 bara veteranen) — flowers är en strikt delmängdsöverlägsen effekt |
| ledare_peak_event | give_word (+10 hela laget) | take_charge (−5 bara kaptenen) |
| contract_peak_event | extend_now (+10) | wait_drama (−5) / let_go (−25) |

**Viktigt sidofynd:** `extend_veteran` förlänger ALDRIG kontraktet mekaniskt (bara moral + storyline-textval), `extend_now` höjer ALDRIG lönen, `let_go` tar ALDRIG bort spelaren från truppen — alla tre etiketter beskriver en konsekvens som aldrig sker i speltillståndet. Samma klass som materialar-korvens bindning: texten lovar, koden levererar inte.

### bandyGalaService.ts
| Event | A (dominerar) | B (dominerad) |
|---|---|---|
| event_gala_{season} | attend (+3 reputation, +5 fanMood, eller +1 reputation) | skip (noOp) |

"Fokusera på träning" (skip) har ingen tränings-/utvecklingsbonus kodad — attend är strikt bättre i alla grenar.

### weeklyDecisionService.ts (systerformatet WeeklyDecision, samma resolver-mönster)
| Beslut | A (dominerar) | B (dominerad) |
|---|---|---|
| corner_extra_training | +3 cornerSkill | noOp |
| supporter_conflict_mediate | +5 supporterMood (garanterat) | 50/50-chans på +3/−4 — A vinner mot VARJE utfall av B |
| reporter_klacken | +3 community | −2 community |
| family_section_request | +3 community, +4 supporterMood | −3 supporterMood |
| legacy_youth_showcase | +4 community | noOp |
| survival_emergency_lotto | +5000 kr, +3 supporterMood | −2 supporterMood |

*(Korrekt icke-dominanta, verifierade: `player_weekend_off`, `away_trip_bus`, `tifo_contribution`, `training_corners_vs_matchprep`, `scout_opponent_corners` — kostnaden verkligen avdragen — `ismaskin_offer`, `legacy_naming_arena`, `survival_wage_freeze`.)*

---

## Helt identiska val — värre än dominans

| Event | Fynd |
|---|---|
| `event_crisis_awareness` (economicCrisisService, fas 1) | `accept_meeting` och `propose_club` producerar BYTE-FÖR-BYTE samma resolver-objekt. Inget val existerar egentligen — det är samma knapp i två etiketter. |
| Alla bandybrevsvar (bandyLetterService, 3 mallar × 2 val) | Moralbonusen (+3 alla truppspelare) appliceras OVILLKORLIGT oavsett vilket svar spelaren väljer — `replyText` styr bara arkiverad flavor-text, aldrig effekten. |
| Alla skoluppgiftssvar (schoolAssignmentService, 2–3 val per uppgift) | Ren arkivering, noll stat-effekt oavsett val — bekräftat avsiktligt nolleffekt-läge (inte en bugg, men värt att veta att "valet" är kosmetiskt). |

---

## Nästan-dominans (verklig avvägning, men värd uppmärksamhet)

| Event | Fynd |
|---|---|
| economic crisis fas 3 | `take_loan` (+300 000 kr) dominerar `ask_mecenat` (+200 000 kr) — `ask_mecenat`s påstådda "lojalitet −30" är ALDRIG kodad (bekräftat i `contentContract.ts:271` — domen kände redan till luckan men den är fortfarande inte täppt). Fri vinst på 100 000 kr för att välja fel enligt berättelsen. |
| economic crisis fas 2 | `accept_loss` dominerar `present_plan` på den kodade vektorn — den påstådda sponsorförlusten (Holmström Bygg) är ren efterklangstext (`efterklangText.ts:99-105`), ingen `sponsorIncome`-effekt kopplad. |

---

## Kostnader/löften som bara finns i text (samlad lista, alla filer)

1. `generateDayJobConflictEvent` / press: "risk för skada" — inget skadefält.
2. `generateVarselEvent` / nothing: "risk att spelare lämnar" — kodkommentaren bekräftar själv att ingen avhoppsmekanik finns.
3. `politician_savings` / comply: "kommunbidrag +5 tkr" — bara relation ändras.
4. `patron_influence_60` / listen: "inflytande ökar" — inget influence-fält rörs.
5. `patron_ignored` / apologize: text lovar "+15 relation", verklig effekt är +20 goodwill (annat fält).
6. `patron_style` / diplomatic, refuse: siffermissmatch (+5 lovat/+3 verkligt, −15 lovat/−8 verkligt).
7. `createEconomicStressEvent` (bus) / sign: "billigare sen" — ingen framtida besparing existerar.
8. `createEconomicStressEvent` (kiosk) / lock: "låst i två år" — se materialar-korv-fallet.
9. `sponsorEvents.ts` icaMaxiEvent / send_player: OMVÄND lucka — en dold, verklig effekt (slumpad moral ±) nämns INGENSTANS i UI-texten.
10. `community_julmarknad`: text "kostar 4000, ger 12000", effekt flat +8000.
11. `community_loppis`: "kräver en dag" — ingen tidskostnad.
12. `community_ismaskin`: "kostar 15 000 kr" — ingen pengaeffekt alls.
13. `community_fikakväll`: "billigt (500 kr)" — ingen pengaeffekt.
14. `community_bilbingo`: framställs som riskabelt, är garanterat; utlovad "+5 fanMood" saknas också.
15. `community_anlaggning`: "kostar 25 000" saknas; "faciliteter försämras" (wait:s hot) är också en noOp.
16. `hallprocess_d3_s{s}` / öppenhet: "Öppenhet bygger. Och binder." — bindningen aldrig kodad.
17. `hallprocess_fordyring` / pausa: "Bygget står" — inget spårat dröjsmålsfält.
18. Mecenat-sociala event (accept): "truppen missar en träningsdag" — ingen träningseffekt kopplad.
19. Mecenat alliance (accept): "vi delar på kostnaden" — ingen klubbfinansiell effekt kodad.
20. `extend_veteran`/`extend_now`/`let_go` (arcService): alla tre påstår kontrakts-/lönekonsekvenser som aldrig sker i speltillståndet.
21. `event_gala_{season}` / skip: "fokusera på träning" — ingen träningsbonus kodad.

---

## Nya id-baserade specialfall funna (utöver den kända listan)

- `sponsorOffer`-events bär top-level-fält (`terminateSponsorId`/`communityStandingDelta`), inte per-val — korrekt gated till `choiceId==='accept'`, bekräftat.
- `hallprocess_fh1_s{s}`: inget id-baserat specialfall alls är roten — det är en DATA-lucka (två val serialiserar identiskt), inte en resolver-gren som skiljer dem åt fel.
- Resten av de granskade filerna (bandyLetterService, schoolAssignmentService, economicCrisisService, postMatchEventService, arcService, seasonGoalService, burnoutReliefService, bandyGalaService, playoffNarrativeService) har INGA nya id-baserade specialfall — alla går genom den generiska `effect.type`-switchen, bekräftat genom att korsa varje val-id mot resolverns fullständiga specialfallslista.

---

## Inte granskningsbart härifrån (kräver annan fils kontext)

- `patron_emerge` / decline-grenen (strukturellt annorlunda utfall, inte vektorjämförbar).
- `hallprocess_fh2_s{s}` (patronens erbjudande) — `finansiering`-strängen konsumeras nedströms i ekonomi-/patrontjänster som inte var i scope för denna audit.
