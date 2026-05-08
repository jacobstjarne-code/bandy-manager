# Strings Pool Inventory
_Generated 2026-05-08. Scans `*Strings.ts` files + `matchCommentary.ts` in `src/domain/data/`._

⚠️ = pool with ≤3 variants per random-selection category (repetition risk)

---

## 1. eventCardInlineStrings.ts

| Variable | Variants |
|----------|----------|
| `STAR_PERFORMANCE_VARIANTS` | 6 |
| `PLAYER_PRAISE_VARIANTS` | 6 |
| `CAPTAIN_SPEECH_VARIANTS` | 5 |

All pools OK.

---

## 2. journalistHeadlineStrings.ts

Split pools: `fresh` / `prevLoss` sub-pools for loss/big_loss. Counted separately.

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

6 thin pools — all `prevLoss` sub-pools. These only fire on a second consecutive loss, so repetition risk is low in practice.

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

5 pools at 4 variants. Low-frequency triggers reduce repetition risk, but worth expanding.

---

## 4. squadNuStrings.ts

Inline pools inside exported functions.

| Function | Branch | Variants |
|----------|--------|----------|
| `getInjuryText` | days=1 | 3 ⚠️ |
| `getInjuryText` | days≠1 | 4 ⚠️ |
| `getSuspensionText` | matches=1 | 3 ⚠️ |
| `getSuspensionText` | matches≠1 | 3 ⚠️ |
| `getMoraleText` | morale<25 | 3 ⚠️ |
| `getMoraleText` | days>5 | 3 ⚠️ |
| `getMoraleText` | days>2 | 3 ⚠️ |
| `getMoraleText` | default | 3 ⚠️ |
| `getContractText` | expired | 3 ⚠️ |
| `getContractText` | expiring | 4 ⚠️ |

High repetition risk on morale + injury text — SquadScreen is visited frequently.

---

## 5. specialDateStrings.ts

Special-date commentary and briefings.

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
| `FINALDAG_BRIEFING_SPECTATOR` | 1 ⚠️ |
| `CUPFINAL_COMMENTARY_PLAYING` | 3 ⚠️ |
| `CUPFINAL_COMMENTARY_SPECTATOR` | 2 ⚠️ |
| `CUPFINAL_COMMENTARY_LORE` | 5 |
| `CUPFINAL_BRIEFING_PLAYING` | 3 ⚠️ |
| `CUPFINAL_BRIEFING_SPECTATOR` | 2 ⚠️ |

Note: `FINALDAG_BRIEFING_SPECTATOR` has only 1 variant — guaranteed repeat every Finaldag.
Special dates are rare (once per season), so most thin pools are acceptable, but the 1-variant case is an actual bug.

---

## 6. matchCommentary.ts

Large file. Sections with ≤3 variants flagged. High-frequency categories listed first.

### Core match events (high frequency)
| Key | Variants |
|-----|----------|
| `goal` | 11 |
| `save` | 10 |
| `corner` | 10 |
| `neutral` | 28 |
| `miss` | 8 |
| `suspension` | 8 |
| `cornerGoal` | 8 |
| `atmosphere` | 8 |
| `fullTime` | 8 |
| `kickoff` | 5 |
| `halfTime` | 5 |
| `powerPlayGood` | 5 |
| `goalReducing` | 5 |
| `goalLate` | 5 |
| `derby_kickoff` | 5 |
| `derby_neutral` | 5 |
| `situational_dominating` | 5 |
| `situational_under_pressure` | 5 |
| `tactical_shift` | 5 |
| `freekick_danger` | 5 |

### Thin pools — medium frequency
| Key | Variants |
|-----|----------|
| `goalOpener` | 3 ⚠️ |
| `goalLead` | 3 ⚠️ |
| `goalEqualizer` | 3 ⚠️ |
| `goalExtend` | 3 ⚠️ |
| `kickoff_home_arena` | 4 ⚠️ |
| `counter_after_corner_slow` | 3 ⚠️ |
| `cornerVariant` | 4 ⚠️ |
| `secondHalf` | 4 ⚠️ |
| `situational_tight` | 4 ⚠️ |
| `situational_opened_up` | 4 ⚠️ |
| `player_duel` | 4 ⚠️ |
| `offside_call` | 4 ⚠️ |
| `momentum_swing_home` | 4 ⚠️ |
| `momentum_swing_away` | 4 ⚠️ |

### Thin pools — playoff/cup/derby (low frequency)
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
| `overtimeStart` | 3 ⚠️ |
| `overtimeGoal` | 3 ⚠️ |
| `overtimeEnd` | 2 ⚠️ |
| `overtimeNoGoal` | 25 |
| `penaltyStart` | 3 ⚠️ |
| `penaltyWinHome` | 2 ⚠️ |
| `penaltyWinAway` | 2 ⚠️ |

### Thin pools — weather
| Key | Variants |
|-----|----------|
| `weather_heavySnow` | 6 |
| `weather_thaw` | 6 |
| `weather_cold` | 5 |
| `weather_fog` | 4 ⚠️ |
| `weather_clear` | 3 ⚠️ |
| `weather_miss_heavySnow` | 3 ⚠️ |
| `weather_miss_thaw` | 3 ⚠️ |
| `weather_miss_fog` | 2 ⚠️ |
| `weather_goal_heavySnow` | 2 ⚠️ |
| `weather_goal_thaw` | 2 ⚠️ |
| `weatherCold` | 3 ⚠️ |
| `weatherSnow` | 3 ⚠️ |
| `weatherMild` | 3 ⚠️ |
| `weatherFog` | 3 ⚠️ |
| `weatherGood` | 3 ⚠️ |

### Thin pools — contextual/situational
| Key | Variants |
|-----|----------|
| `context_season_opener` | 3 ⚠️ |
| `context_title_race` | 3 ⚠️ |
| `context_relegation` | 3 ⚠️ |
| `context_cup_final` | 3 ⚠️ |
| `context_comeback_chasing` | 3 ⚠️ |
| `context_protecting_lead` | 3 ⚠️ |
| `context_player_hot_streak` | 4 ⚠️ |
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
| `supporter_kickoff` | 4 ⚠️ |
| `supporter_halfTime` | 4 ⚠️ |
| `supporter_late_home` | 4 ⚠️ |
| `supporter_late_silent` | 4 ⚠️ |
| `supporter_goal_home` | 4 ⚠️ |
| `supporter_goal_conceded` | 3 ⚠️ |
| `supporter_attendance_low` | 3 ⚠️ |
| `supporter_scandal_recent` | 8 |

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
| `traitSuspensions.joker` | 2 ⚠️ |
| `traitSuspensions.hungrig` | 1 ⚠️ |

`traitSuspensions.hungrig` is a 1-variant pool — guaranteed repeat. `traitSuspensions.joker` at 2 variants will alternate predictably.

---

## Priority for expansion

### Actual bugs (1 variant = no randomness)
- `FINALDAG_BRIEFING_SPECTATOR` (specialDateStrings.ts)
- `traitSuspensions.hungrig` (matchCommentary.ts)

### High risk — high-frequency thin pools
SquadScreen is opened every matchday; injury/morale/contract text repeats quickly:
- `getInjuryText` both branches (squadNuStrings.ts)
- `getSuspensionText` both branches (squadNuStrings.ts)
- `getMoraleText` all branches (squadNuStrings.ts)
- `goalOpener` / `goalLead` / `goalEqualizer` / `goalExtend` (matchCommentary.ts — shown most matches)

### Low risk — rare triggers
Playoff, final, overtime, cup final, special dates: thin pools rarely fire in the same session.
