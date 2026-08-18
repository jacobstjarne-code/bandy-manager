# Klassificering — alla befintliga beslutshändelser mot varsel-mallen

**Datum:** 2026-08-17 · **Av:** Code · **Underlag:** `docs/DOM_VARSLET_SOM_SYSTEMMALL_2026-08-17.md` (O1)
**Uppdrag:** "Det som kan göras före Grind 1... klassificera alla befintliga händelser mot mallens fem punkter. Hur många uppfyller fem? Fyra? Två? Det talet är utgångsläget."

**Metod:** varje beslutsbärande `GameEvent`/`WeeklyDecision`-typ i kodbasen (inte varje dynamisk instans — en typ som `varsel` räknas en gång, inte en gång per spelare den kan drabba) läst mot sin faktiska effektkod och poängsatt mot de fem kraven. Skrivs till denna fil löpande medan jag går igenom filerna, inte sammanställt i efterhand — samma disciplin som choice-label-svepets runda 2, efter att runda 1:s fynd delvis gick förlorade i en enskild agents context.

**De fem kraven** (mallen, ordagrant):
1. En namngiven institution, plats eller person **som redan finns i spelvärlden** agerar. Inte en ny statist.
2. Konsekvensen träffar minst en spelare eller funktionär spelaren redan har mött.
3. Det finns ett tal spelaren kan räkna på mot en känd resurs.
4. Utfallet ändrar minst **två** system som spelaren annars hanterar separat.
5. Minst två av systemen pekar i motsatt riktning.

**Poängskala:** 5/5 = systemhändelse (mallen uppfylld). 4/5 = "vanlig händelse, inget misslyckande" (mallens egen skrivning). ≤3/5 = under mallens golv.

---

## Löpande klassificering

### Referensfallet

| Händelse | Fil | K1 | K2 | K3 | K4 | K5 | Poäng | Kommentar |
|---|---|---|---|---|---|---|---|---|
| `varsel` (offer_pro/support/nothing) | `eventFactories.ts` | ✓ | ✓ | ✓ | ✓ | ✓ | **5/5** | Mallens eget exempel. Namngiven arbetsgivare (`findEmployerForJob`), träffar specifika truppspelare, 1,5× lön är ett räknebart tal, ändrar trupp+ekonomi+moral, ekonomi säger nej medan trupp/moral säger ja. |

**Tolkningsregel för K1** (tillämpad konsekvent nedan): "institution, plats eller person som redan finns" ska vara en aktör SKILD från spelaren det drabbar — mallens eget exempel 2 (veterankontraktet) namnger uttryckligen Klacken som K1-aktören, inte veteranen själv. En spelares eget agerande (ber om kontrakt, håller tal, går till media) räknar INTE som K1 i sig.

### `eventFactories.ts`

| Händelse | K1 | K2 | K3 | K4 | K5 | Poäng | Kommentar |
|---|---|---|---|---|---|---|---|---|
| `bidWarEvent` | ✓ | ✓ | ✓ | ✗ | ✗ | 3/5 | Rivalklubb namngiven, träffar en truppspelare, konkret bud. Bara förhandlingstaktik — ingen andra-systems-konsekvens, ingen spänning (höja budet har ingen nackdel som visas). |
| `hesitantPlayerEvent` | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | Köpande klubb onämnd i denna text. Bara moral, inget tal. |
| `bidReceivedEvent` | ✓ | ✓ | ✓ | ✓ | ✓ | **5/5** | Köpande klubb namngiven, träffar en känd truppspelare, konkret belopp, ändrar ekonomi OCH trupp, och pengar/trupp pekar isär (sälj för pengarna eller behåll spelaren). Nästan identisk struktur till varslet — obemärkt tills nu. |
| `contractRequestEvent` | ✗ | ✓ | ✓ | ✓ | ✗ | 3/5 | Ingen extern aktör (spelaren begär själv). Lön + moral vid avslag är två system, men valen är rena avvägningar utan spänning inom ett och samma utfall. |
| `unhappyPlayerEvent` | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | Bara moral, inget tal, ingen extern aktör. |
| `generateDayJobConflictEvent` (vila/press/goPro) | ✗ | ✓ | ~ | ~ | ~ | 1–3/5 | Arbetsgivaren är ONÄMND ("jobbet") — skiljer den från varslet trots strukturell likhet. `goPro`-grenen har ett tal (lön×1.5) och rör flera system (lön, moral, proffs-status) men arbetsgivaren har inget namn och ingen plats i spelvärlden. De två enklare valen (vila/press) är ren moral, 1/5. |
| `generatePlayerMediaEvent` | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Journalisten är en återkommande namngiven karaktär, men inget tal, ingen andra-systemseffekt. |
| `generatePlayerPraiseEvent` | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | Enda valet är en kvittering ("Fint att höra!") — inget verkligt beslut alls. |
| `generateCaptainSpeechEvent` | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | Kaptenen är spelarens egen trupp, ingen extern aktör. Bara moral. |
| `generateVarselEvent` | ✓ | ✓ | ✓ | ✓ | ✓ | **5/5** | Referensfallet, se ovan. |
| `generatePromotionOfferEvent` | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | Arbetsgivaren onämnd. Bara moral. |
| `generateShiftConflictEvent` | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | Arbetsgivaren onämnd. Bara moral. |
| `generateCoworkerBondEvent` | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Arbetsgivaren namngiven här (till skillnad från övriga dayjob-event). Bara ett val (ren kvittering), inget tal. |
| `generateJournalistExclusiveEvent` | ✓ | ✓ | ✗ | ✓ | ✗ | 3/5 | Namngiven journalist/tidning, träffar en spelare, ändrar moral+journalistrelation+communityStanding (tre system!) — men inget kr-tal, och "acceptera" har ingen nackdel att väga mot. |
| `generateMecenatInterventionEvent` | ✓ | ✓ | ✓ | ✓ | ✓ | **5/5** | Namngiven mecenat, konkret kr-kostnad, ändrar happiness OCH ekonomi, pengar säger nej medan relationen säger ja. Samma klass som varslet — obemärkt tills nu. |
| `createEconomicStressEvent` (3 varianter) | ✗ | ✗ | ✓ | ~ | ✗ | 1–2/5 | "Materialaren"/"Bussbolaget"/"Kioskvakten" är rolltitlar, inte namngivna institutioner. Träffar ingen spelare. Konkreta kr-tal finns, men bara ett system (ekonomi, en variant även moral). |

### `communityActivitiesEvents.ts` — samlad, allvarligaste fyndet i sweepet

**Ingen av de elva community-händelserna når över 2/5. Ingen träffar en namngiven K1-aktör eller en spelare/funktionär (K2). Detta är en hel featurekategori som strukturellt inte kan bli en systemhändelse i sin nuvarande form** — inte enstaka svaga instanser, utan en genomgående brist i vad kategorin ÄR (byggnadsfrågor riktade mot orten i abstrakt, aldrig mot en person).

| Händelse | K1 | K2 | K3 | K4 | K5 | Poäng | Kommentar |
|---|---|---|---|---|---|---|---|---|
| `community_kiosk_start` | ✗ | ✗ | ✓ | ✗ | ✗ | 1/5 | Ren infrastrukturfråga, ingen aktör, ingen person. |
| `community_kiosk_upgrade` | ✗ | ✗ | ✓ | ✗ | ✗ | 1/5 | Samma. |
| `community_lottery_start` | ✗ | ✗ | ✓ | ✗ | ✗ | 1/5 | Samma. |
| `community_lottery_intensive` | ✗ | ✗ | ✓ | ✗ | ✗ | 1/5 | Samma. |
| `community_julmarknad` | ✓ | ✗ | ✓ | ✗ | ✗ | 2/5 | Lokaltidningen namngiven som förslagsställare, men träffar ingen person, ett system (ekonomi). Se även 2.5-rapporten: subtitle säger "kostnad", effekten är en positiv nettosumma. |
| `community_loppis` | ✗ | ✗ | ✓ | ✗ | ✗ | 1/5 | "Föräldrarna" onämnda. |
| `community_bandyplay` (bandyskola) | ✗ | ✗ | ✓ | ✗ | ✗ | 1/5 | "Kommunen" generiskt, inte ett namn som Älvkarleby. Jämför varslet, som ANVÄNDER en riktig kommun. |
| `community_ismaskin` | ✗ | ✗ | ✓ | ✗ | ✗ | 1/5 | Ren anläggningsfråga. |
| `community_funktionarsdag` | ✗ | ✗ | ✓ | ✗ | ✗ | 1/5 | Samma. |
| `community_fikakväll` | ✗ | ✗ | ✗ | ✗ | ✗ | 0/5 | Texten nämner "500 kr" men effekten (`fanMood +8`) rör aldrig ekonomin — inget tal i den faktiska konsekvensen. |
| `community_bilbingo` | ✗ | ✗ | ✓ | ✗ | ✗ | 1/5 | Ren infrastrukturfråga. |
| `community_anlaggning` (renovering) | ✗ | ✗ | ✗ | ✗ | ✗ | 0/5 | Redan känt (2.5-rapporten, klass b): texten lovar −25 tkr, effekten (`reputation +5`) rör aldrig ekonomin. Poängsatt mot FAKTISK effekt, inte löftet. |

**K2-tolkning för patron/mecenat/politiker-familjerna nedan:** dessa namngivna, återkommande karaktärer räknas som "funktionär spelaren redan mött" i sig själva (samma logik som mallens egen kandidat 3 — mecenatens krav) — inte bara om de pekar på en enskild spelare. Tillämpat konsekvent.

### `patronEvents.ts`

| Händelse | K1 | K2 | K3 | K4 | K5 | Poäng | Kommentar |
|---|---|---|---|---|---|---|---|---|
| `patron_intro` | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Inget kr-tal (bara "bidrag varje säsong" i text, inget i effekten), bara relationssystemet rörs. |
| `patron_unhappy` | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Samma. |
| `patron_withdraw` | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | "Acceptera att han lämnar" antyder ekonomisk konsekvens men effekten är bara `patronHappiness -50` — ett system. |
| `patron_style` (spelstil) | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Bara relation. |
| `patron_bonus` | ✓ | ✓ | ✓ | ✗ | ✗ | 3/5 | Konkret 20 000 kr, men bara ETT val (ren kvittering — "Tacka varmt" är enda alternativet, inget riktigt beslut). |
| `patron_influence_60` | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Bara relation/inflytande. |
| `patron_ignored` | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Redan känt (2.5-rapporten): effekten rör fel fält (patience, inte happiness som texten lovar). Poängsatt mot faktisk effekt — ändå bara ett system. |
| `generatePatronEmergenceEvent` (welcome/cautious/decline) | ✓ | ✓ | ✓ | ✗ | ✗ | 3/5 | Konkret tkr/säsong-tal, men effekten i VALET är bara initial happiness — det löpande bidraget är ett framtida system, inte en konsekvens av DETTA beslut. |

**Ingen patron-händelse når 4/5 eller 5/5.** Hela familjen saknar K3 (nästan alltid) och K4 genomgående — relationssystemet är praktiskt taget alltid den enda hävstången, aldrig kopplat till ett samtidigt ekonomiskt eller sportsligt val inom SAMMA beslut.

### `mecenatService.ts`

| Händelse | K1 | K2 | K3 | K4 | K5 | Poäng | Kommentar |
|---|---|---|---|---|---|---|---|---|
| `generateMecenatIntroEvent` | ✓ | ✓ | ✓ | ✗ | ✗ | 3/5 | tkr/säsong nämns men är en framtida ström, inte en effekt av DETTA val — effekten är bara happiness. |
| `generateSocialEvent` (jakt/middag/golf/m.fl.) | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | "⏰ truppen missar en träningsdag" i subtitle — **påhittad effekt**, ingen tränings-/formeffekt finns i koden. Bara happiness rörs. Ny not utanför detta uppdrag, för choice-label-svepets fortsatta lista. |
| `generateSilentShoutEvent` (media, 30+) | ✓ | ✓ | ✗ | ✗ | ✗ | 1/5 | Enda valet är "Noterat" — ingen verklig gaffel. |
| `generateSilentShoutEvent` (transfer, 50+) | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | "💰 mecenat bidrar" i subtitle — **påhittad effekt**, ingen transferbudget-koppling finns, bara happiness. |
| `generateSilentShoutEvent` (taktik, 70+) | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | "taktikpress" i subtitle men ingen taktikeffekt i koden. |
| `generateSilentShoutEvent` (hot, 90+) | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Bara happiness, trots dramatisk text. |
| `generateMecenatConflictEvent` | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Två namngivna mecenater med motsatta viljor — äkta spänning i TEXTEN, men mekaniskt bara happiness×2, ett system. |
| `generateMecenatAllianceEvent` | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | "💰 projekt finansieras" i subtitle — **påhittad effekt**, ingen anläggnings-/projekteffekt finns, bara happiness×2. |
| `checkMecenatRetirement` → `listen`/`plan_succession` | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Bara happiness/`hasAnnouncedRetirement`, inget kr-tal. |
| `checkMecenatRetirement` → **`offer_tribute`** | ✓ | ✓ | ✓ | ✓ | ✓ | **5/5** | **Dold systemhändelse, obemärkt tills nu.** `eventResolver.ts`s post-switch-block ger −25 000 kr (finance) + +3 communityStanding + +5 happiness — TRE system i EN effekt, och pengar/community-vinst pekar i motsatt riktning mot kostnaden. Samma klass som varslet, byggd i en annan del av koden (mecenat-avgångens specialgren) än där man skulle leta. |

**Tre påhittade bieffekter hittade i denna familj** (löpande träningsdag, transferbidrag, projektfinansiering nämnda i subtitle utan motsvarande effekt) — nya fynd, inte tidigare rapporterade i choice-label-svepet. Läggs till den listan separat.

### `politicianEvents.ts`

**Genomgående mönster, viktigare än enskilda poäng:** politiker-familjen handlar med `politicianRelationship`/`boardPatience`/`communityStanding` — abstrakta poängskalor, ALDRIG kronor mot en känd kassa. K3 ("ett tal spelaren kan räkna på mot en känd resurs") tolkas strikt som ett verkligt kr-belopp, matchande varslets 1,5× lön — inte en godtycklig poängdelta. Det är därför hela familjen fastnar under 5/5 trots att flera val äkta rör 2-3 system samtidigt OCH pekar isär.

| Händelse | K1 | K2 | K3 | K4 | K5 | Poäng | Kommentar |
|---|---|---|---|---|---|---|---|---|
| `politician_youth` | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Bara relation. |
| `politician_savings` | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Redan känt (2.5): "comply" lovar kommunbidrag +5 tkr i text, effekten rör bara relation — påhittad effekt. |
| `politician_prestige` | ✓ | ✓ | ✗ | ✓ | ✗ | 3/5 | "welcome" ändrar relation+reputation (två system) men båda pekar samma väg — ingen spänning. |
| `politician_inclusion` | ✓ | ✓ | ✓ | ✓ | ✗ | 4/5 | Konkret 6 000 kr/säsong, tre system (kommunbidrag+fanMood+communityStanding) i "start_program" — men alla pekar UPPÅT, ingen kostnad att väga mot. Närmast 5/5 i hela politiker-familjen. |
| `politician_warning` (låg relation) → `board_contact` | ✓ | ✓ | ✗ | ✓ | ✓ | 4/5 | boardPatience +2 MEN relation −3 — genuin spänning mellan två system, men ingen kr-summa. De tre andra valen i samma event (invite/open_letter/low_profile) är enkla, 2/5. |
| `kommunmote`-kraven (savings/youth/prestige/inclusion/infrastructure, 5 varianter) | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Alla samma mönster — ett system, ingen kr-summa. |
| `gentjanst` → `no`-valet | ✓ | ✓ | ✗ | ✓ | ✓ | 4/5 | Relation ned, styrelsens tålamod upp — äkta spänning, ingen kr-summa. `yes`/`community` är enkla, 2/5. |

**Ingen politiker-händelse når 5/5.** Två val (`board_contact`, gentjänstens `no`) har fyra av fem — de saknar bara ett verkligt kr-tal. Om ett av dessa värden byttes till ett kronbelopp (t.ex. ett bidrag som riskeras) skulle de sannolikt bli systemhändelser.

### `sponsorEvents.ts`

| Händelse | K1 | K2 | K3 | K4 | K5 | Poäng | Kommentar |
|---|---|---|---|---|---|---|---|---|
| `icamaxi_visit` → `send_player` | ✓ | ✓ | ✓ | ✓ | ✗ | 4/5 | ICA Maxi namngiven, konkret 5 tkr, tre system (income + communityStanding + en dold slumpad spelares moral via en specialgren i resolvern, odeklarerad i texten) — men allt pekar uppåt, ingen kostnad att väga. |

### `supporterEvents.ts`

| Händelse | K1 | K2 | K3 | K4 | K5 | Poäng | Kommentar |
|---|---|---|---|---|---|---|---|---|
| `supporter_tifo_` → `yes` | ✓ | ✓ | ✗ | ✓ | ✗ | 3/5 | Elin namngiven, supporterMood+communityStanding, men gratis — inget att väga. |
| `supporter_conflict_` (Sture/Elin) | ✓ | ✓ | ✗ | ✓ | ✗ | 3/5 | Genuin konflikt mellan två namngivna karaktärer, men ingen kr-summa och inget val kostar något konkret. |
| `supporter_open_letter_` (Tommy) | ✓ | ✓ | ✗ | ✓ | ✗ | 3/5 | Samma mönster. |
| `supporter_away_trip_` → `subsidize` | ✓ | ✓ | ✓ | ✓ | ✗ | 4/5 | Konkret 5 000 kr, tre system (income+supporterMood+communityStanding) — men kostnaden ger BARA vinster, ingen nackdel att väga mot pengarna. Näst starkast i klack-familjen. |

**Klack-familjen har rätt namngivna personer och rätt flersystemseffekter, men saknar nästan alltid ett pris som gör ont** — precis vad mallen varnar för ("Inte tvåvalsdilemman... skillnaden mot varslet är att det kostade pengar i en känd kassa").

### `economicCrisisService.ts`

| Händelse | K1 | K2 | K3 | K4 | K5 | Poäng | Kommentar |
|---|---|---|---|---|---|---|---|---|
| Fas 1 — `awareness` | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Anders Lindgren namngiven, men bara fastransition, inget tal. |
| Fas 2 — `pressure` → `present_plan` | ✓ | ✓ | ✓ | ✗ | ✗ | 3/5 | Holmström Bygg namngiven, konkret −20 000 kr, men ett system (ekonomi). |
| Fas 3 — `decision` → **`sell_star`** | ✓ | ✓ | ✓ | ✓ | ✓ | **5/5** | **Dold systemhändelse.** Johan Bergstedt (ekonomichef) namngiven, träffar den faktiskt bästa spelaren i truppen, konkret 350 000 kr, ändrar ekonomi OCH trupp, pengar och lagstyrka pekar rakt isär. Strukturellt identisk med varslet — spelaren säljer en känd person för att rädda klubben. |
| Fas 3 — `decision` → `take_loan` | ✓ | ✗ | ✓ | ✗ | ✗ | 3/5 | 300 000 kr konkret, men "löpande kostnad" i etiketten verkar INTE implementerad som en faktisk återkommande skuld i `resolveEconomicCrisis` — misstänkt påhittad effekt, inte verifierad i detalj här men flaggas som en lucka värd att kontrollera separat. |
| Fas 3 — `decision` → `ask_mecenat` | ✓ | ✓ | ✓ | ✗ | ✗ | 3/5 | Redan känt (denna sessions (a)-svep): "lojalitet −30" i etiketten är en helt påhittad effekt — ingen mecenat-happiness rörs alls. Hade varit en stark kandidat (pengar mot en namngiven relation) om den effekten faktiskt fanns. |

**Ekonomikrisens `sell_star`-val är den starkaste dolda systemhändelsen i hela sweepet efter mecenatens `offer_tribute`.** Två av tre val i samma händelse (`take_loan`, `ask_mecenat`) missar bara för att en utlovad bieffekt saknas i koden — reparera dem (se choice-label-svepets öppna (b)-lista) och hela krisbeslutet blir tre äkta vägar istället för en.

### `arcService.ts` — spelararcarnas "peak"-beslut

Sex arc-typer (`hungrig_breakthrough`, `joker_redemption`, `veteran_farewell`, `ledare_crisis`, `contract_drama`, `derby_echo`) bygger flerfasiga narrativ (building → peak → resolving) kring namngivna truppspelare. `derby_echo` och `lokal_hero` har inga interaktiva val alls (ren inbox/storyline-utväxling) — uteslutna ur poängsättningen, de är inte beslut.

| Händelse | K1 | K2 | K3 | K4 | K5 | Poäng | Kommentar |
|---|---|---|---|---|---|---|---|---|
| `hungrig_breakthrough` (peak, journalistfråga) | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | Avsändare är rollen "Journalist", inget namn. Bara moral. |
| `joker_redemption` (peak, styrelsefråga) | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | "Styrelseordföranden" utan namn. Bara moral. |
| `veteran_farewell` (peak, presspress) | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | Bara moral. |
| `veteran_farewell` (avtackningsceremoni) | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | "Truppen" som avsändare, inget namn. Bara moral (om än lagbrett). |
| `ledare_crisis` (peak, spelarmöte) | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | Kaptenen själv agerar — ingen extern aktör. Bara moral. |
| `contract_drama` (peak, framtidsbesked) | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | Bara moral, inget tal (trots att "avhopp"/"du får gå" antyder ekonomi/trupp — aldrig implementerat i valets effekt). |

**Hela arc-familjens interaktiva beslut fastnar på 1/5.** Systemet bygger rätt saker för K2 (namngivna, redan mötta spelare) och för långsiktigt minne (`O3`/`O18`-anda), men varje enskilt VAL är strukturellt en ren moral-spak: ingen extern namngiven aktör, inget kr-tal, inget andra system. De är atmosfäriskt starka men mekaniskt enkla — exakt "fyra av fem, ingen skam, men inte en systemhändelse" fast utan att ens nå fyra.

### `hallProcessService.ts` — matchhall-prövningens FSM (06-12-modellen)

Det mest strukturellt sammansatta systemet i sweepet (7 stadier, stöd-meter, krav-check, kommunförhandling, byggfördyring). Ändå landar varje enskilt VAL lågt — kravet på ett riktigt kr-tal MOT ett känt utfall är det som konsekvent saknas.

| Händelse | K1 | K2 | K3 | K4 | K5 | Poäng | Kommentar |
|---|---|---|---|---|---|---|---|
| D1 `medlemsmotet` (Lyssna/Ta ordet) | ✓ | ✗ | ✗ | ✗ | ✗ | 1/5 | "Medlemmarna" som namngiven institution (samma logik som "Klacken" i mallens exempel). Effekten är bara `support`-mätaren (abstrakt, inget kr). |
| D2 `birger_mote` (Ta mötet/Vänta) | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Birger är en återkommande namngiven klackfigur, redan mött. Bara `support`-delta, inget kr. |
| D3 `enkaten` (Svara öppet/Avböj) | ✗ | ✗ | ✗ | ✗ | ✗ | 0/5 | "Lokaltidningen" är generisk, ingen namngiven journalist. Bara `support`-delta. |
| Krav-uppfyllt → förhandling | ✗ | ✗ | ✗ | ✗ | ✗ | 0/5 | Ren statusövergång, inget val med konsekvens. |
| FH1 `kommunens_villkor` (Ungdomstimmar/Delad drift) | ✗ | ✗ | ✗ | ✗ | ✗ | 0/5 | "Kommunalrådet" utan namn (jmf `{patron}`-interpolationen i nästa event, som visar att namn FINNS när avsikten är att använda dem). **Se bugg-fynd nedan — valen är dessutom identiska i effekt.** |
| FH2 `patronens_erbjudande` (Borgen/Tacka nej) | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Namngiven patron, redan mött. Effekten sätter bara `finansiering`-flaggan (display-label), inget kr-belopp i just detta steg. |
| Fördyring (Skjut till/Pausa) | ✗ | ✗ | ✓ | ✗ | ✗ | 1/5 | "Byggledaren" utan namn. Riktigt kr-tal (−360 000, −20 % av byggsumman mot känd kassa) men ensamt system (bara finance). |

**Bugg-fynd (redan känt, upptäckt oberoende igen här):** `hallProcessService.ts:343-357` — `kommunens_villkor`s två val (`ungdomstimmar` "Ungdom ↑ · drift −/säsong" vs `delad_drift` "Lägre uppsida · högre ja-odds") producerar **byte-identisk effekt** (`{ finansiering: 'kommun', stage: 'bygge', stageStartedRound: currentRound }` — ordagrant samma för båda). Detta är samma fynd som redan står dokumenterat i `docs/CHOICE_LABEL_SVEP_2026-08-17.md` under "kommunens_villkor — rapport, inget byggt" (väntar på Jacobs dom: slå ihop till ett val, eller bygg en verklig skillnad). Ingen ny information — noterat här bara för att poängsättningen ovan (0/5) annars vore obegriplig utan sammanhanget.

### `weeklyDecisionService.ts` — de 16 veckobesluten

**Den rikaste fyndkategorin i hela sweepet.** Till skillnad från de flesta andra filerna är effekterna här verkliga och kr-beloppen riktiga — inga påhittade effekter hittades. Tre beslut träffar 5/5 utan att någon markerat dem som systemhändelser.

| Beslut | K1 | K2 | K3 | K4 | K5 | Poäng | Kommentar |
|---|---|---|---|---|---|---|---|---|
| `corner_extra_training` | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | Spelarens egen begäran — ingen extern aktör (samma regel som arc-familjen). |
| `player_weekend_off` | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | Spelarens egen begäran. |
| **`away_trip_bus`** | ✓ | ✓ | ✓ | ✓ | ✓ | **5/5** | Ledaren+veteranen (namngivna, redan mötta) ordnar bussresa, ber om 3000kr. A-valet: −3000kr **och** +8 supporterstämning — riktig spänning inom samma val (kostnad vs vinst, olika system). |
| **`tifo_contribution`** | ✓ | ✓ | ✓ | ✓ | ✓ | **5/5** | Samma mönster: ungdomsfiguren ordnar tifo, ber om 2000kr. A: −2000kr **och** +6 stämning. |
| `supporter_conflict_mediate` | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Veteran+ungdom (namngivna) i konflikt, men bara stämning ändras, inget kr. |
| `reporter_klacken` | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Ledaren namngiven, men bara kommunstatus. |
| `training_corners_vs_matchprep` | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | Internt tränarbeslut, ingen extern aktör. |
| `scout_opponent_corners` | ✗ | ✗ | ✗ | ✗ | ✗ | 0/5 | "Scouten" är en roll, ingen person. Effekten träffar ingen spelare/funktionär. |
| `ismaskin_offer` | ✓ | ✗ | ✓ | ✓ | ✓ | 4/5 | "Kommunen" som namngiven institution (samma logik som "Klacken"), men träffar ingen spelare/funktionär — bara kassa+kommunstatus. Annars fullt: riktigt kr-tal, två system, spänning inom valet. |
| `family_section_request` | ✓ | ✓ | ✗ | ✓ | ✗ | 3/5 | Familjefiguren namngiven och möjlig K2, men bara stämning/kommunstatus (inget kr) och A-valet är enkelriktat positivt (ingen spänning). |
| **`legacy_naming_arena`** (era: legacy) | ✓ | ✓ | ✓ | ✓ | ✓ | **5/5** | Kommunen (institution) + veteranen (namngiven, "är emot") — A: +20 000kr engångssumma **men** −6 supporterstämning. Klassisk pengar-mot-stolthet-spänning. |
| `legacy_youth_showcase` (era: legacy) | ✓ | ✓ | ✗ | ✗ | ✗ | 2/5 | Ledaren namngiven, men bara kommunstatus. |
| `survival_wage_freeze` (era: survival) | ✗ | ✗ | ✗ | ✓ | ✓ | 2/5 | "Kassören" är en roll, ingen person, och träffar ingen specifik spelare. Ironiskt nog: ett lönebeslut utan ett enda kr-tal. Två system (boardPatience/supporterMood) pekar åt olika håll inom A-valet, men K1/K2/K3 saknas helt. |
| `survival_emergency_lotto` (era: survival) | ✓ | ✓ | ✓ | ✓ | ✗ | 4/5 | Ledaren (namngiven) föreslår lotteri, +5000kr **och** +3 stämning i A — men båda positiva, ingen spänning (K5 saknas). |

**Tre dolda systemhändelser i en enda fil** (`away_trip_bus`, `tifo_contribution`, `legacy_naming_arena`) — fler än i någon annan genomsökt fil. Mönstret som gör dem 5/5 är konsekvent: en namngiven, redan mött supporterfigur ber om ett konkret kr-belopp, och "ja"-valet kostar pengar samtidigt som det ger något annat (stämning eller status) — äkta spänning i en enda rad kod, inte i separata val.

### `postAdvanceEvents.ts` — spöksponsorn och det omöjliga valet

| Händelse | K1 | K2 | K3 | K4 | K5 | Poäng | Kommentar |
|---|---|---|---|---|---|---|---|---|
| `ghostSponsorOffered` (Tacka ja/nej) | ✗ | ✗ | ✓ | ✓ | ✓ | 3/5 | "En affärsman" är anonym, inget namn — och effekten träffar ingen spelare/funktionär, bara kassa+kommunstatus. Annars fullt: 150 000kr, två system, äkta spänning i ja-valet (pengar upp, status ner). |
| **`detOmojligaValet` (Sälj/Behåll)** | ✓ | ✓ | ✓ | ✓ | ✓ | **5/5** | Licensnämnden (namngiven institution) kräver kapital. Målet är en specifik, redan mött akademispelare "hela orten älskar" — sälj-valet ger 180 000kr men kostar kommunstatus, fanMood OCH journalistRelationship (fyra system, inte bara två). **Strukturellt den renaste träffen i hela sweepet vid sidan av varslet självt** — namngiven institution, namngiven redan-mött spelare, riktigt kr-tal mot känd kassakris, fyra system, uttalad spänning ("räddar klubben, men skadar ditt rykte" — texten SÄGER K5 rakt ut). |

### `characterPlayerService.ts` — karaktärsspelarnas fyra livshändelser

| Händelse | K1 | K2 | K3 | K4 | K5 | Poäng | Kommentar |
|---|---|---|---|---|---|---|---|---|
| `veteran_retirement` (Hedersbetygelse/Planera) | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | Spelarens egen situation, ingen extern aktör. |
| `jubilee` (Ceremoni/Internt) | ✗ | ✓ | ✓ | ✓ | ✓ | 4/5 | Ceremoni-valet: +5 samhällsstöd **men** −3 000kr — äkta spänning, riktigt kr-tal. Missar bara K1 (klubbens egen ceremoni, ingen extern namngiven aktör agerar PÅ klubben). |
| `captain` (Utse/Ingen kapten) | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | Internt lagbeslut. |
| `hungrig_wants_more` (Stötta/Be stanna) | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | Spelarens egen ambition, ingen extern aktör. |

`jubilee` är den nästan-träff värd att notera: samma "namngiven-aktör-saknas"-mönster som gör att arc-familjens beslut stannar på 1/5, men här räddas den av att kassaeffekten redan är riktig — visar att K1 är den strukturellt svåraste barriären att klara i spontana spelarhändelser (det kräver alltid NÅGON UTANFÖR spelaren/klubben som agerar).

### `bandyLetterService.ts` — bandybrevet

| Händelse | K1 | K2 | K3 | K4 | K5 | Poäng | Kommentar |
|---|---|---|---|---|---|---|---|---|
| `bandyLetter` (Svara/Arkivera) | ✗ | ✗ | ✗ | ✗ | ✗ | 0/5 | Avsändaren är en NY engångskaraktär genererad varje gång (namn/ort/ålder slumpas deterministiskt ur listor) — motsatsen till mallens "redan finns i spelvärlden"-krav. Ren arkiv-flavor (`saveBandyLetter`), ingen spelmekanisk effekt alls. Korrekt klassad som ren atmosfär — inget fel i att den är 0/5, den försöker inte vara ett beslut. |

### `schoolAssignmentService.ts` — skoluppgiften

| Händelse | K1 | K2 | K3 | K4 | K5 | Poäng | Kommentar |
|---|---|---|---|---|---|---|---|---|
| `schoolAssignment` (tre svarsalternativ) | ✗ | ✓ | ✗ | ✗ | ✗ | 1/5 | Akademispelaren är verklig och redan i truppen (K2), men samtliga tre val har identisk mekanisk effekt — bara arkivtext (`saveSchoolAssignment`), ingen siffra ändras alls oavsett svar. Ren atmosfär. |

### `mecenatDinnerService.ts` — mecenat-middagen (jakt/bastu/whisky)

Samma namngivna, redan mötta mecenat som gav `offer_tribute` 5/5 i mecenatService-sektionen ovan — men här delar middagens tre frågor aldrig upp verkligt kr-tal OCH äkta spänning i SAMMA val, vilket håller alla tre strax under ribban.

| Fråga | K1 | K2 | K3 | K4 | K5 | Poäng | Kommentar |
|---|---|---|---|---|---|---|---|---|
| `q0` (Trivsel) | ✓ | ✓ | ✗ | ✓ | ✗ | 3/5 | Tre system (happiness/communityStanding/relationship) men inget kr, och båda alternativen rör sig i samma riktning (ingen spänning). |
| `q1` (Bidrag till omklädningsrum) | ✓ | ✓ | ✓ | ✓ | ✗ | 4/5 | Riktigt kr (+15 000, mecenatens bidrag) — men BÅDA alternativen är odelat positiva. Ingen kostnad, ingen nedsida — därför ingen spänning trots fyra system. |
| `q2` (Konkurrens om mecenatens pengar) | ✓ | ✓ | ✗ | ✓ | ✓ | 4/5 | Äkta spänning ("Konkurrensen är sund" ger +communityStanding men −happiness/−relationship) — men inget kr-tal i det steget. |

**Mönstret upprepar sig:** när ett mecenat-möte har ett riktigt kr-tal (q1) saknas spänningen (allt är en gåva), och när spänningen finns (q2) saknas kr-talet. De två egenskaperna som tillsammans definierar en systemhändelse dyker aldrig upp i samma val här — trots att scenen annars är mallens mest uppenbara kandidatmiljö (namngiven, redan mött mecenat, återkommande scen).

---

## SLUTSUMMERING

**Metod:** varje interaktivt VAL (inte varje händelsetyp) poängsattes 0–5 mot mallens fem kriterier. Händelser utan mekaniskt skiljande val (ren arkiv-flavor: `bandyLetter`, `schoolAssignment`) räknas separat nedan, inte i huvudtabellen, eftersom "val" i mallens mening kräver att alternativen faktiskt gör olika saker.

| Poäng | Antal | Andel |
|---|---|---|
| **5/5 — systemhändelse** | **9** | 9% |
| 4/5 — vanlig, nära ribban | 10 | 10% |
| 3/5 | 17 | 17% |
| 2/5 | 27 | 27% |
| 1/5 | 31 | 31% |
| 0/5 | 7 | 7% |
| **Totalt bedömda val** | **101** | 100% |

(`varsel`/`generateVarselEvent` räknas en gång — den förekommer i två tabeller ovan, referensfallet och eventFactories.ts-sektionen, men är samma händelse.)

**De åtta 5/5-träffarna** (ingen av dem tidigare identifierad eller byggd som "systemhändelse" — alla hittades genom denna genomläsning):

1. `varsel` — referensfallet, mallens egen källa.
2. `bidReceivedEvent` (eventFactories.ts) — namngivet köparlag, namngiven spelare, riktigt kr-bud, ekonomi vs trupp.
3. `generateMecenatInterventionEvent` (eventFactories.ts) — namngiven mecenat, riktigt kr, happiness vs ekonomi.
4. `checkMecenatRetirement` → `offer_tribute` (mecenatService.ts) — namngiven mecenat, −25 000kr, tre system.
5. `sell_star` (economicCrisisService.ts) — namngiven funktionär (Johan Bergstedt) presenterar, namngiven bästa-truppen-spelare säljs för 350 000kr, ekonomi vs trupp.
6. `away_trip_bus` (weeklyDecisionService.ts) — namngivna klackfigurer, −3 000kr, kassa vs stämning.
7. `tifo_contribution` (weeklyDecisionService.ts) — samma mönster, −2 000kr.
8. `legacy_naming_arena` (weeklyDecisionService.ts, era-gated) — kommunen + namngiven veteran, +20 000kr men −stämning.
9. `detOmojligaValet` (postAdvanceEvents.ts) — Licensnämnden, namngiven akademispelare, 180 000kr, fyra system, uttalad spänning i texten.

(Listan blev nio, inte åtta — uppdaterat i tabellen ovan.)

**Riktmärket i mallen är 2–3 systemhändelser per säsong, aldrig mer än en per omgång.** Nio redan existerande 5/5-kandidater, utspridda över åtta olika filer och triggade av separata, icke-koordinerade villkor, betyder att flera av dem strukturellt KAN trigga samma säsong utan att någon kod hindrar det — det är inte byggt som en pool med cooldown mellan varandra, bara internt per händelsetyp. Det är alltså inte "vi saknar systemhändelser", det är "vi har fler än riktmärket vill ha, ovetande om varandra, och ingen delad spärr."

**Näst-högsta gruppen (4/5, 10 st)** är nästan uteslutande en enda-kriterium-bort-fall: `ismaskin_offer` och `q1`/`q2` (mecenatDinnerService) saknar bara K2 respektive K3/K5 i olika kombinationer. Det bekräftar mallens egen linje — "uppfylls fyra av fem är det en vanlig händelse, ingen skam" — snarare än att avslöja ett systematiskt hål.

**Nästan två tredjedelar (65 av 101, 64%) landar på 2/5 eller lägre.** Det är inte ett larm — mallen är uttryckligen inte tänkt för vardagshändelser — men det visar hur ovanlig kombinationen namngiven-aktör + kr-tal + flersystem-spänning faktiskt är i den existerande händelsemassan, vilket ger perspektiv på varför riktmärket ligger på 2–3 per säsong, inte fler.

**De strukturella mönstren värda Jacobs uppmärksamhet:**
- **K1 (extern namngiven aktör) är den vanligaste bristen.** Spelarens egen begäran (arc-familjen, characterPlayerService, weeklyDecisionService's spelarval) räknas aldrig som K1 — och det är rätt enligt mallens egen distinktion, men det förklarar varför hela kategorier (arcService.ts peak-events) fastnar på 1/5 trots stark K2.
- **`communityActivitiesEvents.ts` är strukturellt oförmöget** att nå en systemhändelse i sin nuvarande form — ingen händelse i filen har en namngiven K1-aktör eller ett K2-mål.
- **`politicianEvents.ts` handlar aldrig i riktiga kronor** — hela familjen byter bara abstrakta relationspoäng, vilket permanent stänger K3.
- **Tre nya "påhittad effekt"-buggar hittades under sweepet, tillagda i choice-label-svepets öppna lista:** `generateSocialEvent`s träningsdags-rad, silentShout-transferns mecenat-rad, `generateMecenatAllianceEvent`s projektfinansierings-rad (alla i `mecenatService.ts`). `hallProcessService.ts`s `kommunens_villkor`-bugg (identisk effekt oavsett val) dök också upp här men var redan känd och dokumenterad — ingen ny information, bara en cross-referens.

**Körorder:**
- **Jacob:** avgör om de nio redan-5/5-händelserna ska döpas om/märkas som systemhändelser i UI (t.ex. en särskild ram eller etikett), eller om de ska förbli omärkta men räknas mot säsongens 2–3-riktmärke ändå. Detta styr om nästa steg är "bygg fler" eller "räkna om vad som redan finns."
- **Code:** de fyra påhittad-effekt-buggarna (tre i mecenatService.ts + hallProcessService.ts's identiska förhandlingsval) läggs till choice-label-svepets öppna (b)-lista — de är samma felklass, inte en ny.
- **Bygg inget nytt ännu:** O5 (framgångsekonomin) och U1 (svårighetsmodellen) är fortfarande oöppnade — den här rapporten är underlaget för Grind 1, inte en byggorder.
