# Strings Pool Inventory

_Regenererad 2026-09-03 (dokhygien, MASTER_OPPET.md `inv-1-strings-pool-inventory-stale`; ursprungligen genererad 2026-05-08)._
_Scannar samtliga `*Strings.ts`-filer i `src/domain/data/` (10 st, mot 5 i maj-versionen) + `matchCommentary.ts` + tre namngivet saknade filer (`hallProvningData.ts`, `seasonDecisionSentences.ts`, `careerBreakText.ts`)._

**Metod:** ett skript (bracket-medvetet, räknar topp-nivå sträng-/mall-litteraler i varje `[...]`-array) räknade om varje leaf-pool i alla 14 filer. Facit jämfört manuellt mot filerna för de fall skriptet inte kunde tolka strukturen (objekt-array-pooler i `eventProcessorStrings.ts`, nästlade stadie-pooler i `hallProvningData.ts`). Siffrorna nedan är alltså mätta mot dagens kod, inte extrapolerade från maj-versionen.

⚠️ = pool with ≤3 variants per random-selection category (repetition risk)

---

## 1. eventCardInlineStrings.ts

| Variable | Variants |
|----------|----------|
| `STAR_PERFORMANCE_VARIANTS` | 6 |
| `PLAYER_PRAISE_VARIANTS` | 6 |
| `CAPTAIN_SPEECH_VARIANTS` | 5 |

All pools OK. Oförändrat sedan maj.

---

## 2. journalistHeadlineStrings.ts

Split pools: `fresh` / `prevLoss` sub-pools for loss/big_loss. Counted separately. Oförändrat sedan maj — samma struktur, samma siffror.

| Bucket | Persona | Pool | Variants |
|--------|---------|------|----------|
| big_win | supportive | — | 5 |
| big_win | sensationalist | — | 5 |
| big_win | analytical | — | 5 |
| big_win | critical | — | 5 |
| win | supportive | — | 5 |
| win | sensationalist | — | 5 |
| win | analytical | — | 5 |
| win | critical | — | 5 |
| draw | supportive | — | 5 |
| draw | sensationalist | — | 5 |
| draw | analytical | — | 5 |
| draw | critical | — | 5 |
| loss | supportive | — | 5 |
| loss | sensationalist | fresh | 5 |
| loss | sensationalist | prevLoss | 3 ⚠️ |
| loss | analytical | fresh | 5 |
| loss | analytical | prevLoss | 3 ⚠️ |
| loss | critical | fresh | 5 |
| loss | critical | prevLoss | 3 ⚠️ |
| big_loss | supportive | — | 5 |
| big_loss | sensationalist | fresh | 5 |
| big_loss | sensationalist | prevLoss | 3 ⚠️ |
| big_loss | analytical | fresh | 5 |
| big_loss | analytical | prevLoss | 3 ⚠️ |
| big_loss | critical | fresh | 5 |
| big_loss | critical | prevLoss | 3 ⚠️ |

6 thin pools — all `prevLoss` sub-pools. Fires only on second consecutive loss, so repetition risk is low in practice. Oförändrat bedömning.

---

## 3. preMatchContextStrings.ts

| POOLS key | Variants |
|-----------|----------|
| `derby` | 5 |
| `win_streak` | 5 |
| `loss_streak` | 5 |
| `table_above` | 4 ⚠️ |
| `table_below` | 4 ⚠️ |
| `opp_hot` | 4 ⚠️ |
| `opp_home_unbeaten` | 4 ⚠️ |
| `opp_cold` | 4 ⚠️ |

Oförändrat sedan maj. Fem pooler på 4 varianter (maj-versionen flaggade dessa som ⚠️ trots 4 — regeln här är ≤3, så de är formellt OK, kvar som marginalfall).

---

## 4. squadNuStrings.ts

**STOR FÖRÄNDRING sedan maj.** Filens egen kommentar (rad 1-3) säger uttryckligen: "Tidigare 3-4 varianter per branch... Utökad till 7-8 varianter per branch" — daterad SAMMA DAG som maj-inventeringen (2026-05-08), men expansionen skedde tydligen efter skanningen. Samtliga åtta branches är nu 8 varianter, noll ⚠️ kvar.

| Function | Branch | Variants |
|----------|--------|----------|
| `getInjuryText` | days=1 | 8 |
| `getInjuryText` | days≠1 | 8 |
| `getSuspensionText` | matches=1 | 8 |
| `getSuspensionText` | matches≠1 | 8 |
| `getMoraleText` | days>5 | 8 |
| `getMoraleText` | days>2 | 8 |
| `getMoraleText` | morale<25 | 8 |
| `getMoraleText` | default | 8 |
| `getContractText` | expired | 8 |
| `getContractText` | expiring | 8 |

Maj-versionens "High risk — SquadScreen visited every matchday"-varning är inte längre aktuell.

---

## 5. specialDateStrings.ts

| Variable | Variants |
|----------|----------|
| `ANNANDAGSBANDY_COMMENTARY` | 5 |
| `ANNANDAGSBANDY_COMMENTARY_LORE` | 2 ⚠️ |
| `ANNANDAGSBANDY_BRIEFING` | 5 |
| `NYARSBANDY_COMMENTARY` | 5 |
| `NYARSBANDY_BRIEFING` | 5 |
| `FINALDAG_COMMENTARY_PLAYING` | 3 ⚠️ |
| `FINALDAG_COMMENTARY_SPECTATOR` | 2 ⚠️ |
| `FINALDAG_COMMENTARY_LORE` | 4 ⚠️ |
| `FINALDAG_COMMENTARY_3X30` | 2 ⚠️ |
| `FINALDAG_BRIEFING_PLAYING` | 3 ⚠️ |
| `FINALDAG_BRIEFING_SPECTATOR` | **5** (var 1 i maj) |
| `CUPFINAL_COMMENTARY_PLAYING` | 3 ⚠️ |
| `CUPFINAL_COMMENTARY_SPECTATOR` | 2 ⚠️ |
| `CUPFINAL_COMMENTARY_LORE` | 5 |
| `CUPFINAL_BRIEFING_PLAYING` | 3 ⚠️ |
| `CUPFINAL_BRIEFING_SPECTATOR` | 2 ⚠️ |

**Maj-versionens "actual bug" (`FINALDAG_BRIEFING_SPECTATOR`, 1 variant → garanterad upprepning) är åtgärdad — nu 5 varianter.** Special dates är sällsynta (en gång per säsong), så resterande tunna pooler är acceptabla.

---

## 6. activeArcStrings.ts, mentorshipStrings.ts, seasonDecisionSentences.ts, careerBreakText.ts — inga repetitionsrisk-pooler

Fyra filer skannade, ingen av dem innehåller en slumpad varianturvals-pool i den mening resten av dokumentet mäter:

- **`activeArcStrings.ts`** — `getArcHeadline` är en deterministisk `switch`/`case`-byggare (en rubrik per `arc.type`, ingen randomisering).
- **`mentorshipStrings.ts`** — sex exporterade funktioner, var och en returnerar EN deterministisk mening baserat på tröskelvärden (disciplin ≥80, form <40 etc), ingen pool.
- **`seasonDecisionSentences.ts`** — en fast mening per (event.type, choiceId)-par (`SELL_STAR`, `MECENAT_CONFLICT_SIDE`, `FACILITY_BUILD` m.fl.), interpolerad med tokens. Inget slumpmässigt urval — samma mening varje gång samma beslut inträffar.
- **`careerBreakText.ts`** — fasta strängkonstanter + tunna template-funktioner (`careerBreakSeasonIntro` m.fl.), ingen pool.

Detta var de tre filer MASTER_OPPET.md pekade ut som "kända saknade pooler" (plus `activeArcStrings.ts`, upptäckt vid samma skanning). Slutsatsen är att de saknades i maj-dokumentet av rätt anledning på tre av fyra — de har inga pooler att inventera. Se dock `hallProvningData.ts` nedan, som VERKLIGEN hade saknade pooler.

---

## 7. hallProvningData.ts — NY I INVENTERINGEN, hade genuina pooler

Fanns inte alls i maj-dokumentet. Hallprövningens ambient-text (kafferum/klack per stadie) och nyhets-/citat-pooler:

| Pool | Variants |
|------|----------|
| `PROVNING_AMBIENT.forankring.kafferum` | 4 |
| `PROVNING_AMBIENT.forankring.klack` | 2 ⚠️ |
| `PROVNING_AMBIENT.krav.kafferum` | 3 ⚠️ |
| `PROVNING_AMBIENT.krav.klack` | **1 ⚠️ — garanterad upprepning** |
| `PROVNING_AMBIENT.forhandling.kafferum` | 2 ⚠️ |
| `PROVNING_AMBIENT.forhandling.klack` | **1 ⚠️ — garanterad upprepning** |
| `PROVNING_AMBIENT.bygge.kafferum` | 2 ⚠️ |
| `PROVNING_AMBIENT.bygge.klack` | 2 ⚠️ |
| `HALL_ATMOSPHERE` | 8 |
| `HALL_KLACK_BASE` | 2 ⚠️ |
| `HALL_NEWS_POSITIVE` | 8 |
| `HALL_NEWS_NEGATIVE` | 12 |
| `HALL_NEWS_OUTDOOR_PRIDE` | 8 |
| `BOARD_HALL_QUOTES.supporter` | 3 ⚠️ |
| `BOARD_HALL_QUOTES.ekonom` | 4 |
| `BOARD_HALL_QUOTES.traditionalist` | 4 |
| `BOARD_HALL_QUOTES.modernist` | 4 |

**Två nya "actual bugs"** (1 variant, garanterad upprepning): `PROVNING_AMBIENT.krav.klack` och `PROVNING_AMBIENT.forhandling.klack`. Lägre akut prioritet än squadNuStrings-fallet var — hallprövningen är ett flersäsongsförlopp med låg besöksfrekvens per stadie, inte en varje-omgång-yta — men samma klass av fel.

---

## 8. Övriga nya `*Strings.ts`-filer sedan maj (utan repetitionsrisk-pooler)

- **`assistantFFStrings.ts`** — nio 3-variant-pooler (`near`/`center`/`far`/`sprint`/`build`/`earlyBall`/`shoot`/`chipPass`/`layOff`, alla 3 ⚠️). Assistentens formationsförslag-kommentarer; besöksfrekvens ej verifierad denna sweep.
- **`eventProcessorStrings.ts`** — objekt-array-pooler (title+body), inte rena strängpooler: `WAGE_OVERRUN_WARNING_TEXT` (3 ⚠️), `WAGE_OVERRUN_DEDUCTION_TEXT` (3 ⚠️). `RISKY_SPONSOR_OFFERS` (4 poster) och `MECENAT_WITHDRAWAL_TEXT` (3, personlighets-nycklade) är INTE repetitionspooler — förstnämnda är en meny av fyra distinkta erbjudanden, den andra ett uppslag per mecenat-personlighet. `MECENAT_WITHDRAWAL_FALLBACK` (array av samma tre) är den enda genuina 3-variant-poolen här.
- **`facilityFinancingStrings.ts`** — `KOMMUN_OFFER_LINES`/`KOMMUN_HOLD_LINES`/`MECENAT_OFFER_LINES`, alla 6. OK.

---

## 9. matchCommentary.ts

Stor fil, 985 rader (var ~750 i maj). Räknat om i sin helhet — flera helt nya kategorier har tillkommit sedan majinventeringen (cup-omarbetningen, is-försämring). Sektioner med ≤3 varianter flaggade.

### Core match events (high frequency)
| Key | Variants |
|-----|----------|
| `goal` | 11 |
| `neutral` | 29 |
| `save` | 10 |
| `corner_miss` | 10 |
| `fullTime` | 8 |
| `goalOpener` | 8 |
| `goalLead` | 8 |
| `goalExtend` | 8 |
| `cornerGoal` | 8 |
| `miss` | 8 |
| `suspension` | 8 |
| `atmosphere` | 8 |
| `goalEqualizer` | 8 |
| `kickoff` | 5 |
| `halfTime` | 5 |
| `powerPlayGood` | 5 |
| `goalReducing` | 5 |
| `goalLate` | 5 |
| `corner` | 5 |
| `derby_kickoff` | 5 |
| `derby_neutral` | 5 |
| `situational_dominating` | 5 |
| `situational_under_pressure` | 5 |
| `tactical_shift` | 5 |
| `freekick_danger` | 5 |

### NY sedan maj — cup & cupfinal (kategorin fanns inte i maj-inventeringen)
| Key | Variants |
|-----|----------|
| `cup_atmosphere` | 8 |
| `cup_finalweekend_atmosphere` | 6 |
| `cup_kickoff` | 5 |
| `cup_goal` | 4 |
| `cup_fullTime_win` | 4 |
| `cup_fullTime_loss` | 4 |
| `cup_final_kickoff` | 4 |
| `cup_final_goal` | 4 |
| `cup_final_fullTime_win` | 4 |
| `cup_final_fullTime_loss` | 4 |
| `cup_goalOpener` | **1 ⚠️ — garanterad upprepning** |

**Ny "actual bug":** `cup_goalOpener` har bara 1 variant. Cup-öppningsmål är inte sällsynt (var cupmatch har högst ett), värt en snabb utökning.

### Thin pools — medium frequency
| Key | Variants |
|-----|----------|
| `kickoff_home_arena` | 4 ⚠️ |
| `cornerVariant` | 4 ⚠️ |
| `secondHalf` | 4 ⚠️ |
| `situational_tight` | 4 ⚠️ |
| `situational_opened_up` | 4 ⚠️ |
| `player_duel` | 4 ⚠️ |
| `offside_call` | 4 ⚠️ |
| `momentum_swing_home` | 4 ⚠️ |
| `momentum_swing_away` | 4 ⚠️ |
| `counter_after_corner_slow` | 3 ⚠️ |

### Thin pools — playoff/derby (low frequency)
| Key | Variants |
|-----|----------|
| `playoff_kickoff` | 3 ⚠️ |
| `quarterfinal_kickoff` | 3 ⚠️ |
| `semifinal_kickoff` | 3 ⚠️ |
| `final_kickoff` | 3 ⚠️ |
| `semifinal_goal` | 3 ⚠️ |
| `final_goal` | 3 ⚠️ |
| `final_fullTime_win` | 3 ⚠️ |
| `final_fullTime_loss` | 2 ⚠️ |
| `playoff_general` | 3 ⚠️ |
| `derby_goal` | 3 ⚠️ |
| `derby_suspension` | 3 ⚠️ |
| `derby_fullTime` | 2 ⚠️ |

### Thin pools — overtime/penalty
| Key | Variants |
|-----|----------|
| `overtimeNoGoal` | 25 |
| `overtimeStart` | 3 ⚠️ |
| `overtimeGoal` | 3 ⚠️ |
| `overtimeEnd` | 2 ⚠️ |
| `penaltyStart` | 3 ⚠️ |
| `penaltyWinHome` | 2 ⚠️ |
| `penaltyWinAway` | 2 ⚠️ |

### Weather + NY: is-försämring
| Key | Variants |
|-----|----------|
| `weather_heavySnow` | 6 |
| `weather_thaw` | 6 |
| `weather_cold` | 5 |
| `weather_miss_thaw` | 5 |
| `weather_fog` | 4 ⚠️ |
| `weather_miss_fog` | 4 ⚠️ |
| `weather_goal_heavySnow` | 4 ⚠️ |
| `weather_goal_thaw` | 4 ⚠️ |
| `weather_clear` | 3 ⚠️ |
| `weather_miss_heavySnow` | 3 ⚠️ |
| `weatherCold` | 3 ⚠️ |
| `weatherSnow` | 3 ⚠️ |
| `weatherMild` | 3 ⚠️ |
| `weatherFog` | 3 ⚠️ |
| `weatherGood` | 3 ⚠️ |
| `iceDeterioration_snow` (NY) | 3 ⚠️ |
| `iceDeterioration_thaw` (NY) | 3 ⚠️ |

### Thin pools — contextual/situational
| Key | Variants |
|-----|----------|
| `context_player_hot_streak` | 4 ⚠️ |
| `context_season_opener` | 3 ⚠️ |
| `context_title_race` | 3 ⚠️ |
| `context_relegation` | 3 ⚠️ |
| `context_cup_final` | 3 ⚠️ |
| `context_comeback_chasing` | 3 ⚠️ |
| `context_protecting_lead` | 3 ⚠️ |
| `context_player_drought` | 3 ⚠️ |
| `context_captain_moment` | 3 ⚠️ |
| `context_fan_favorite` | 3 ⚠️ |
| `context_suspension_frustration` | 3 ⚠️ |
| `context_suspension_tactical` | 3 ⚠️ |
| `context_shorthanded_surviving` | 3 ⚠️ |
| `context_shorthanded_conceding` | 3 ⚠️ |

### Thin pools — referee
| Key | Variants |
|-----|----------|
| `referee_strict` | 4 ⚠️ |
| `referee_lenient` | 3 ⚠️ |
| `referee_inconsistent` | 3 ⚠️ |

### Thin pools — supporter
| Key | Variants |
|-----|----------|
| `supporter_goal_home` | 8 (var 4 ⚠️ i maj) |
| `supporter_scandal_recent` | 8 |
| `supporter_kickoff` | 4 ⚠️ |
| `supporter_halfTime` | 4 ⚠️ |
| `supporter_late_home` | 4 ⚠️ |
| `supporter_late_silent` | 4 ⚠️ |
| `supporter_goal_conceded` | 3 ⚠️ |
| `supporter_attendance_low` | 3 ⚠️ |

### Thin pools — legend
| Key | Variants |
|-----|----------|
| `legend_goal` | 12 |
| `legend_assist` | 4 ⚠️ |
| `legend_gk_save` | 3 ⚠️ |
| `legend_late` | 3 ⚠️ |

### Thin pools — trait commentary (getTraitCommentary)
| Trait / Event | Variants |
|---------------|----------|
| `traitGoals.hungrig` | 3 ⚠️ |
| `traitGoals.joker` | 3 ⚠️ |
| `traitGoals.veteran` | 3 ⚠️ |
| `traitGoals.lokal` | 3 ⚠️ |
| `traitGoals.ledare` | 3 ⚠️ |
| `traitSuspensions.joker` | **6** (var 2 ⚠️ i maj) |
| `traitSuspensions.hungrig` | **6** (var 1 ⚠️ i maj — den andra "actual bug" som fanns då) |
| `traitSuspensions.veteran` | 3 ⚠️ |
| `traitSuspensions.lokal` | 3 ⚠️ |
| `traitSuspensions.ledare` | 3 ⚠️ |

**Maj-versionens andra "actual bug" (`traitSuspensions.hungrig`, 1 variant) är åtgärdad — nu 6 varianter**, liksom `traitSuspensions.joker` (2→6). `traitSuspensions.veteran/lokal/ledare` fick ingen motsvarande utökning — kvar på 3.

---

## Priority for expansion (2026-09-03)

### Actual bugs (1 variant = no randomness) — BÅDA MAJ-BUGGARNA ÅTGÄRDADE, TVÅ NYA HITTADE
- ~~`FINALDAG_BRIEFING_SPECTATOR`~~ — åtgärdad, nu 5.
- ~~`traitSuspensions.hungrig`~~ — åtgärdad, nu 6.
- **`cup_goalOpener`** (matchCommentary.ts) — NY, 1 variant, cupmatcher är inte sällsynta.
- **`PROVNING_AMBIENT.krav.klack`** och **`PROVNING_AMBIENT.forhandling.klack`** (hallProvningData.ts) — NYA, 1 variant vardera. Lägre frekvens (hallprövning, inte varje omgång) men samma felklass.

### High risk — high-frequency thin pools
squadNuStrings.ts-varningen från maj är löst (alla branches 8 varianter nu). Kvarvarande hög-frekvens-kandidater:
- `corner`/`corner_miss`-familjen är redan väl täckt (5/10).
- `traitGoals.*` (5 traits, alla 3 ⚠️) — spelas varje mål av en spelare med trait, potentiellt frekvent för klubbar med flera trait-bärare.

### Low risk — rare triggers
Playoff, final, overtime, cupfinal, special dates, hallprövnings-stadier: tunna pooler avfyras sällan i samma session. `assistantFFStrings.ts`s nio 3-variant-pooler (formationsförslag) inte frekvensverifierade denna sweep — flagga för nästa regenerering om assistenten visar sig besökas ofta.
