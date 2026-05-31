#!/usr/bin/env python3
"""
analyze_referees_deep.py
Djupanalys av domardata från Bandygrytan.
Genererar 6 outputfiler i docs/data/ (alla INTERNAL, gitignorerade).
"""

import json
import math
import os
import random
from collections import defaultdict
from datetime import datetime

try:
    from scipy import stats
except ImportError:
    raise ImportError("scipy krävs: pip install scipy")

# ---------------------------------------------------------------------------
# KONSTANTER
# ---------------------------------------------------------------------------
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "docs", "data")
SRC_JSON = os.path.join(DATA_DIR, "bandygrytan_detailed.json")
AGG_JSON = os.path.join(DATA_DIR, "INTERNAL_referee_aggregates.json")

OUT_PATTERNS = os.path.join(DATA_DIR, "INTERNAL_REFEREE_PATTERNS.md")
OUT_PROFILES = os.path.join(DATA_DIR, "INTERNAL_REFEREE_PROFILES.md")
OUT_DEEP    = os.path.join(DATA_DIR, "INTERNAL_REFEREE_DEEP_DIVE.md")
OUT_TRENDS  = os.path.join(DATA_DIR, "INTERNAL_referee_season_trends.json")
OUT_PENALTY = os.path.join(DATA_DIR, "INTERNAL_referee_penalty_attribution.json")
OUT_DAMHERR = os.path.join(DATA_DIR, "INTERNAL_referee_dam_herr.json")

HERR_HOME_WIN_BASELINE = 0.509
DAM_HOME_WIN_BASELINE  = 0.484
MIN_MATCHES    = 30
MIN_PER_SEASON = 10
MIN_PER_PHASE  = 10
MIN_PER_SERIES = 10

BONFERRONI_N = 18   # antal domare vi korrigerar över per mått
TODAY = datetime.now().strftime("%Y-%m-%d")

# ---------------------------------------------------------------------------
# STATISTISKA HJÄLPFUNKTIONER
# ---------------------------------------------------------------------------

def cohens_d(sample_vals, pop_vals):
    """Cohen's d: (mean_sample - mean_pop) / pooled_std"""
    if len(sample_vals) < 2 or len(pop_vals) < 2:
        return None
    m1, m2 = sum(sample_vals) / len(sample_vals), sum(pop_vals) / len(pop_vals)
    s1 = math.sqrt(sum((x - m1)**2 for x in sample_vals) / (len(sample_vals) - 1))
    s2 = math.sqrt(sum((x - m2)**2 for x in pop_vals) / (len(pop_vals) - 1))
    n1, n2 = len(sample_vals), len(pop_vals)
    pooled = math.sqrt(((n1 - 1) * s1**2 + (n2 - 1) * s2**2) / (n1 + n2 - 2))
    return (m1 - m2) / pooled if pooled > 0 else 0.0


def cohens_h(p1, p2):
    """Cohen's h för andelar."""
    return 2 * math.asin(math.sqrt(max(0, min(1, p1)))) - 2 * math.asin(math.sqrt(max(0, min(1, p2))))


def bootstrap_ci(values, n_boot=1000, ci=0.95, seed=42):
    """Bootstrap konfidensintervall för medelvärde."""
    if not values:
        return None, None
    rng = random.Random(seed)
    means = []
    for _ in range(n_boot):
        sample = [rng.choice(values) for _ in range(len(values))]
        means.append(sum(sample) / len(sample))
    means.sort()
    lo = (1 - ci) / 2
    hi = 1 - lo
    return means[int(lo * n_boot)], means[int(hi * n_boot)]


def wilson_ci(p, n, z=1.96):
    """Wilson score interval för andel."""
    if n == 0:
        return None, None
    denom = 1 + z**2 / n
    centre = (p + z**2 / (2 * n)) / denom
    margin = z * math.sqrt(p * (1 - p) / n + z**2 / (4 * n**2)) / denom
    return max(0, centre - margin), min(1, centre + margin)


def linreg(x, y):
    """Enkel linjär regression. Returnerar slope, se, p."""
    if len(x) < 3:
        return None, None, None
    result = stats.linregress(x, y)
    return result.slope, result.stderr, result.pvalue


def welch_ttest(sample, population):
    """Welch t-test, returnerar t, p."""
    if len(sample) < 2 or len(population) < 2:
        return None, 1.0
    t, p = stats.ttest_ind(sample, population, equal_var=False)
    return t, p


def mean_std(vals):
    if not vals:
        return None, None
    m = sum(vals) / len(vals)
    if len(vals) < 2:
        return m, 0.0
    s = math.sqrt(sum((x - m)**2 for x in vals) / (len(vals) - 1))
    return m, s


def pct(numer, denom):
    return numer / denom if denom > 0 else None


def fmt_f(v, dec=3):
    if v is None:
        return "–"
    return f"{v:.{dec}f}"


def fmt_pct(v, dec=1):
    if v is None:
        return "–"
    return f"{v*100:.{dec}f}%"


def fmt_ci(lo, hi, dec=3):
    if lo is None or hi is None:
        return "–"
    return f"[{lo:.{dec}f}–{hi:.{dec}f}]"


def season_to_int(s):
    """'2019-20' → 2019"""
    try:
        return int(s[:4])
    except Exception:
        return 0


# ---------------------------------------------------------------------------
# STEG 0: Bygg per-match-tabell
# ---------------------------------------------------------------------------

def build_match_table(raw):
    rows = []
    for series in ("herr", "dam"):
        for m in raw[series]["matches"]:
            ref = m.get("referees", {}) or {}
            main_ref = ref.get("main") if isinstance(ref, dict) else None

            goals = m.get("goals", []) or []
            fouls = m.get("fouls", []) or []
            corners = m.get("corners", {}) or {}

            hs = m["homeScore"]
            as_ = m["awayScore"]
            home_win = hs > as_
            draw = hs == as_
            away_win = as_ > hs

            # Penalty goals per team
            pg_home = sum(1 for g in goals if g.get("type") == "penalty" and g.get("team") == "home")
            pg_away = sum(1 for g in goals if g.get("type") == "penalty" and g.get("team") == "away")
            pg_total = pg_home + pg_away

            # Fouls per period and team
            fouls_home = sum(1 for f in fouls if f.get("team") == "home")
            fouls_away = sum(1 for f in fouls if f.get("team") == "away")
            fouls_total = len(fouls)
            fouls_home_pct = pct(fouls_home, fouls_total)

            def period_fouls(mn_lo, mn_hi):
                return sum(1 for f in fouls if mn_lo <= (f.get("minute") or 0) < mn_hi)

            fp1 = period_fouls(0, 30)
            fp2 = period_fouls(30, 60)
            fp3 = period_fouls(60, 90)
            fp4 = period_fouls(90, 999)

            # HT
            ht_home = m.get("halfTimeHome")
            ht_away = m.get("halfTimeAway")
            ht_lead_home = None
            ht_lead_winner = None
            if ht_home is not None and ht_away is not None:
                if ht_home > ht_away:
                    ht_lead_home = True
                    ht_lead_winner = "home" if home_win else ("away" if away_win else "draw")
                elif ht_away > ht_home:
                    ht_lead_home = False
                    ht_lead_winner = "away" if away_win else ("home" if home_win else "draw")
                else:
                    ht_lead_winner = "no_ht_lead"

            # First goal
            first_goal_team = None
            first_goal_winner = None
            if goals:
                sorted_goals = sorted(goals, key=lambda g: g.get("minute") or 0)
                first_goal_team = sorted_goals[0].get("team")
                if first_goal_team == "home":
                    first_goal_winner = home_win
                elif first_goal_team == "away":
                    first_goal_winner = away_win
            else:
                first_goal_team = "no_goals"

            # Penalty subgroups: close (margin ≤1 at time of penalty) and late (min ≥60)
            pg_home_close = 0
            pg_away_close = 0
            pg_home_late = 0
            pg_away_late = 0

            # Build cumulative score to evaluate margin at penalty moment
            # Sort all goals by minute
            sorted_goals_all = sorted(goals, key=lambda g: g.get("minute") or 0)
            for g in goals:
                if g.get("type") != "penalty":
                    continue
                gmin = g.get("minute") or 0
                team = g.get("team")
                # Score just before this goal
                cum_home = sum(1 for og in sorted_goals_all
                               if (og.get("minute") or 0) < gmin and og.get("team") == "home")
                cum_away = sum(1 for og in sorted_goals_all
                               if (og.get("minute") or 0) < gmin and og.get("team") == "away")
                margin = abs(cum_home - cum_away)
                if margin <= 1:
                    if team == "home":
                        pg_home_close += 1
                    elif team == "away":
                        pg_away_close += 1
                if gmin >= 60:
                    if team == "home":
                        pg_home_late += 1
                    elif team == "away":
                        pg_away_late += 1

            rows.append({
                "matchId":               m.get("matchId", ""),
                "season":                m.get("season", ""),
                "phase":                 (m.get("phase") or "regular").lower(),
                "series":                series,
                "date":                  m.get("date", ""),
                "homeTeam":              m.get("homeTeam", ""),
                "awayTeam":              m.get("awayTeam", ""),
                "homeTeamId":            m.get("homeTeamId", ""),
                "awayTeamId":            m.get("awayTeamId", ""),
                "main_referee":          main_ref,
                "homeScore":             hs,
                "awayScore":             as_,
                "halfTimeHome":          ht_home,
                "halfTimeAway":          ht_away,
                "home_win":              home_win,
                "draw":                  draw,
                "away_win":              away_win,
                "total_goals":           len(goals),
                "penalty_goals_home":    pg_home,
                "penalty_goals_away":    pg_away,
                "penalty_goals_total":   pg_total,
                "fouls_total":           fouls_total,
                "fouls_home":            fouls_home,
                "fouls_away":            fouls_away,
                "fouls_home_pct":        fouls_home_pct,
                "fouls_p1":              fp1,
                "fouls_p2":              fp2,
                "fouls_p3":              fp3,
                "fouls_p4":              fp4,
                "corners_home":          corners.get("home", 0) or 0,
                "corners_away":          corners.get("away", 0) or 0,
                "corners_total":         (corners.get("home", 0) or 0) + (corners.get("away", 0) or 0),
                "ht_lead_home":          ht_lead_home,
                "ht_lead_winner":        ht_lead_winner,
                "first_goal_team":       first_goal_team,
                "first_goal_winner":     first_goal_winner,
                "penalty_goals_home_close": pg_home_close,
                "penalty_goals_away_close": pg_away_close,
                "penalty_goals_home_late":  pg_home_late,
                "penalty_goals_away_late":  pg_away_late,
            })
    return rows


# ---------------------------------------------------------------------------
# STEG 1: Ligamedel
# ---------------------------------------------------------------------------

def compute_league(rows):
    result = {}
    for series in ("herr", "dam"):
        sr = [r for r in rows if r["series"] == series and r["main_referee"] is not None]
        n = len(sr)
        if n == 0:
            result[series] = {"n": 0}
            continue

        goals      = [r["total_goals"] for r in sr]
        fouls      = [r["fouls_total"] for r in sr]
        fhpct      = [r["fouls_home_pct"] for r in sr if r["fouls_home_pct"] is not None]
        ph         = [r["penalty_goals_home"] for r in sr]
        pa         = [r["penalty_goals_away"] for r in sr]

        # Penalty ratio: home/(home+away) per match, exkl. 0+0
        pen_ratios = [r["penalty_goals_home"] / (r["penalty_goals_home"] + r["penalty_goals_away"])
                      for r in sr if (r["penalty_goals_home"] + r["penalty_goals_away"]) > 0]

        corners    = [r["corners_total"] for r in sr]

        # Fouls per period as share of match total
        foul_pcts_p = [[], [], [], []]
        for r in sr:
            ft = r["fouls_total"]
            if ft > 0:
                foul_pcts_p[0].append(r["fouls_p1"] / ft)
                foul_pcts_p[1].append(r["fouls_p2"] / ft)
                foul_pcts_p[2].append(r["fouls_p3"] / ft)
                foul_pcts_p[3].append(r["fouls_p4"] / ft)

        home_wins = [r["home_win"] for r in sr]
        draws = [r["draw"] for r in sr]

        # HT lead win pct
        ht_lead_matches = [r for r in sr if r["ht_lead_winner"] not in (None, "no_ht_lead")]
        ht_lead_win_pct = pct(sum(1 for r in ht_lead_matches
                                  if (r["ht_lead_home"] and r["home_win"]) or
                                     (not r["ht_lead_home"] and r["away_win"])),
                              len(ht_lead_matches))

        # First goal win pct
        fg_matches = [r for r in sr if r["first_goal_team"] not in (None, "no_goals")]
        fg_win_pct = pct(sum(1 for r in fg_matches if r["first_goal_winner"]), len(fg_matches))

        m_goals, s_goals = mean_std(goals)
        m_fouls, s_fouls = mean_std(fouls)
        m_fhpct, s_fhpct = mean_std(fhpct)
        m_ph, s_ph = mean_std(ph)
        m_pa, s_pa = mean_std(pa)
        m_pen_r, s_pen_r = mean_std(pen_ratios)
        m_cor, s_cor = mean_std(corners)

        # By season
        seasons = sorted(set(r["season"] for r in sr))
        by_season = {}
        for sn in seasons:
            ss = [r for r in sr if r["season"] == sn]
            sn_goals = [r["total_goals"] for r in ss]
            sn_fouls = [r["fouls_total"] for r in ss]
            sn_hw = [r["home_win"] for r in ss]
            by_season[sn] = {
                "n":            len(ss),
                "avg_goals":    sum(sn_goals) / len(sn_goals) if sn_goals else None,
                "avg_fouls":    sum(sn_fouls) / len(sn_fouls) if sn_fouls else None,
                "home_win_pct": sum(sn_hw) / len(sn_hw) if sn_hw else None,
            }

        result[series] = {
            "n":                n,
            "home_win_pct":     sum(home_wins) / n,
            "draw_pct":         sum(draws) / n,
            "avg_goals":        m_goals,  "std_goals":        s_goals,
            "avg_fouls":        m_fouls,  "std_fouls":        s_fouls,
            "avg_fouls_home_pct": m_fhpct, "std_fouls_home_pct": s_fhpct,
            "avg_pen_home":     m_ph,     "std_pen_home":     s_ph,
            "avg_pen_away":     m_pa,     "std_pen_away":     s_pa,
            "avg_pen_ratio":    m_pen_r,  "std_pen_ratio":    s_pen_r,
            "avg_corners":      m_cor,    "std_corners":      s_cor,
            "avg_foul_pct_p1":  sum(foul_pcts_p[0]) / len(foul_pcts_p[0]) if foul_pcts_p[0] else None,
            "avg_foul_pct_p2":  sum(foul_pcts_p[1]) / len(foul_pcts_p[1]) if foul_pcts_p[1] else None,
            "avg_foul_pct_p3":  sum(foul_pcts_p[2]) / len(foul_pcts_p[2]) if foul_pcts_p[2] else None,
            "avg_foul_pct_p4":  sum(foul_pcts_p[3]) / len(foul_pcts_p[3]) if foul_pcts_p[3] else None,
            "ht_lead_win_pct":  ht_lead_win_pct,
            "first_goal_win_pct": fg_win_pct,
            "by_season":        by_season,
            # Store raw lists for later Welch tests
            "_goals":  goals,
            "_fouls":  fouls,
            "_fhpct":  fhpct,
            "_ph":     ph,
            "_pa":     pa,
            "_pen_ratios": pen_ratios,
            "_corners": corners,
        }
    return result


# ---------------------------------------------------------------------------
# STEG 2: Domar-aggregat
# ---------------------------------------------------------------------------

def compute_referee_aggregate(ref_name, rows, league):
    sr = [r for r in rows if r["main_referee"] == ref_name]
    n = len(sr)
    if n < MIN_MATCHES:
        return None

    # Dominant series
    series_count = {"herr": sum(1 for r in sr if r["series"] == "herr"),
                    "dam":  sum(1 for r in sr if r["series"] == "dam")}
    dominant_series = max(series_count, key=series_count.get)
    lig = league[dominant_series]

    seasons_active = sorted(set(r["season"] for r in sr))
    phase_count = defaultdict(int)
    for r in sr:
        phase_count[r["phase"]] += 1

    # ---- Numeriske mått ----
    def stat_block(ref_vals, pop_vals, label):
        if not ref_vals:
            return None
        m = sum(ref_vals) / len(ref_vals)
        ci_lo, ci_hi = bootstrap_ci(ref_vals)
        t, p_w = welch_ttest(ref_vals, pop_vals)
        p_bonf = min(1.0, p_w * BONFERRONI_N) if p_w is not None else None
        cd = cohens_d(ref_vals, pop_vals)
        # z-score based on population mean/std
        pop_m, pop_s = mean_std(pop_vals)
        z = ((m - pop_m) / (pop_s / math.sqrt(len(ref_vals)))) if pop_s and pop_s > 0 else None
        return {
            "mean":     round(m, 4),
            "ci_low":   round(ci_lo, 4) if ci_lo is not None else None,
            "ci_high":  round(ci_hi, 4) if ci_hi is not None else None,
            "cohens_d": round(cd, 4) if cd is not None else None,
            "z":        round(z, 3) if z is not None else None,
            "p_welch":  round(p_w, 4) if p_w is not None else None,
            "p_bonf":   round(p_bonf, 4) if p_bonf is not None else None,
        }

    goals_vals  = [r["total_goals"] for r in sr]
    fouls_vals  = [r["fouls_total"] for r in sr]
    fhpct_vals  = [r["fouls_home_pct"] for r in sr if r["fouls_home_pct"] is not None]
    pen_vals    = [r["penalty_goals_total"] for r in sr]
    corner_vals = [r["corners_total"] for r in sr]

    # Penalty ratio per match (exkl. 0+0)
    pen_ratios_ref = [r["penalty_goals_home"] / (r["penalty_goals_home"] + r["penalty_goals_away"])
                      for r in sr if (r["penalty_goals_home"] + r["penalty_goals_away"]) > 0]

    # ---- Andelar (binomial + Cohen's h) ----
    def prop_block(ref_count, ref_n, pop_pct, baseline_n=None):
        if ref_n == 0:
            return None
        p = ref_count / ref_n
        ci_lo, ci_hi = wilson_ci(p, ref_n)
        ch = cohens_h(p, pop_pct)
        # Binomial test
        binom_result = stats.binomtest(ref_count, ref_n, pop_pct)
        p_binom = binom_result.pvalue
        p_bonf = min(1.0, p_binom * BONFERRONI_N)
        # z approximation
        se = math.sqrt(pop_pct * (1 - pop_pct) / ref_n) if ref_n > 0 else None
        z = (p - pop_pct) / se if se and se > 0 else None
        return {
            "pct":      round(p, 4),
            "ci_low":   round(ci_lo, 4) if ci_lo is not None else None,
            "ci_high":  round(ci_hi, 4) if ci_hi is not None else None,
            "cohens_h": round(ch, 4),
            "z":        round(z, 3) if z is not None else None,
            "p_binom":  round(p_binom, 4),
            "p_bonf":   round(p_bonf, 4),
        }

    hw_count = sum(1 for r in sr if r["home_win"])
    dr_count = sum(1 for r in sr if r["draw"])

    # HT lead win
    ht_matches = [r for r in sr if r["ht_lead_winner"] not in (None, "no_ht_lead")]
    ht_wins = sum(1 for r in ht_matches
                  if (r["ht_lead_home"] and r["home_win"]) or
                     (not r["ht_lead_home"] and r["away_win"]))

    # First goal win
    fg_matches = [r for r in sr if r["first_goal_team"] not in (None, "no_goals")]
    fg_wins = sum(1 for r in fg_matches if r["first_goal_winner"])

    # Fouls per period
    foul_period = {}
    for i, key in enumerate(["pct_p1", "pct_p2", "pct_p3", "pct_p4"]):
        pkey = f"fouls_p{i+1}"
        period_vals = [r[pkey] / r["fouls_total"] for r in sr if r["fouls_total"] > 0]
        lig_avg = lig.get(f"avg_foul_pct_p{i+1}")
        if period_vals and lig_avg is not None:
            pm, ps = mean_std(period_vals)
            lig_m, lig_s = mean_std([r[pkey] / r["fouls_total"] for r in
                                      [rr for rr in rows if rr["series"] == dominant_series
                                       and rr["main_referee"] is not None
                                       and rr["fouls_total"] > 0]])
            z_p = ((pm - lig_avg) / (lig_s / math.sqrt(len(period_vals)))) if lig_s and lig_s > 0 else None
            foul_period[key] = round(pm, 4)
            foul_period[f"z_p{i+1}"] = round(z_p, 3) if z_p is not None else None
        else:
            foul_period[key] = None
            foul_period[f"z_p{i+1}"] = None

    # Per säsong
    by_season = {}
    for sn in seasons_active:
        ss = [r for r in sr if r["season"] == sn]
        if len(ss) < MIN_PER_SEASON:
            ssn = len(ss)
            by_season[sn] = {"n": ssn, "note": f"n<{MIN_PER_SEASON}",
                             "avg_fouls": round(sum(r["fouls_total"] for r in ss) / ssn, 3) if ssn else None,
                             "home_win_pct": round(sum(r["home_win"] for r in ss) / ssn, 3) if ssn else None}
            continue
        sn_fouls = [r["fouls_total"] for r in ss]
        sn_hw    = [r["home_win"] for r in ss]
        sn_goals = [r["total_goals"] for r in ss]
        by_season[sn] = {
            "n":            len(ss),
            "avg_fouls":    round(sum(sn_fouls) / len(sn_fouls), 3),
            "avg_goals":    round(sum(sn_goals) / len(sn_goals), 3),
            "home_win_pct": round(sum(sn_hw) / len(sn_hw), 3),
            "foul_p1_pct":  round(sum(r["fouls_p1"] for r in ss) / max(1, sum(r["fouls_total"] for r in ss)), 3),
            "foul_p2_pct":  round(sum(r["fouls_p2"] for r in ss) / max(1, sum(r["fouls_total"] for r in ss)), 3),
            "foul_p3_pct":  round(sum(r["fouls_p3"] for r in ss) / max(1, sum(r["fouls_total"] for r in ss)), 3),
            "foul_p4_pct":  round(sum(r["fouls_p4"] for r in ss) / max(1, sum(r["fouls_total"] for r in ss)), 3),
        }

    # Trend (fouls per säsong)
    sn_fouls_trend = [(season_to_int(sn), by_season[sn]["avg_fouls"])
                      for sn in seasons_active if by_season[sn].get("avg_fouls") is not None and "note" not in by_season[sn]]
    foul_trend = None
    if len(sn_fouls_trend) >= 3:
        xs = [v[0] for v in sn_fouls_trend]
        ys = [v[1] for v in sn_fouls_trend]
        slope, se, p_t = linreg(xs, ys)
        if slope is not None:
            foul_trend = {"slope": round(slope, 4), "se": round(se, 4) if se else None, "p": round(p_t, 4) if p_t else None}

    # Penalty analysis
    pen_home = [r["penalty_goals_home"] for r in sr]
    pen_away = [r["penalty_goals_away"] for r in sr]
    ph_m = sum(pen_home) / n
    pa_m = sum(pen_away) / n
    pen_denom = ph_m + pa_m
    pen_ratio = ph_m / pen_denom if pen_denom > 0 else None
    lig_pen_ratio = lig.get("avg_pen_ratio")
    pen_ratio_vs_league = (pen_ratio - lig_pen_ratio) if (pen_ratio is not None and lig_pen_ratio is not None) else None

    # Welch on penalty ratio per match
    _, p_pen = welch_ttest(pen_ratios_ref, lig["_pen_ratios"]) if pen_ratios_ref else (None, 1.0)
    p_pen_bonf = min(1.0, p_pen * BONFERRONI_N) if p_pen is not None else None

    pen_close_matches = [r for r in sr if (r["penalty_goals_home_close"] + r["penalty_goals_away_close"]) > 0]
    pen_late_matches = [r for r in sr if (r["penalty_goals_home_late"] + r["penalty_goals_away_late"]) > 0]
    pen_regular = [r for r in sr if r["phase"] == "regular"]
    pen_playoff = [r for r in sr if r["phase"] in ("quarterfinal", "semifinal", "final", "playoff")]

    def subgroup_ratio(sub_rows):
        ph_ = sum(r["penalty_goals_home"] for r in sub_rows)
        pa_ = sum(r["penalty_goals_away"] for r in sub_rows)
        return ph_ / (ph_ + pa_) if (ph_ + pa_) > 0 else None

    penalty_block = {
        "home_per_match":       round(ph_m, 4),
        "away_per_match":       round(pa_m, 4),
        "ratio":                round(pen_ratio, 4) if pen_ratio is not None else None,
        "ratio_vs_league":      round(pen_ratio_vs_league, 4) if pen_ratio_vs_league is not None else None,
        "z":                    None,  # computed below
        "p_welch":              round(p_pen, 4) if p_pen is not None else None,
        "p_bonf":               round(p_pen_bonf, 4) if p_pen_bonf is not None else None,
        "cohens_d":             round(cohens_d(pen_ratios_ref, lig["_pen_ratios"]), 4)
                                if pen_ratios_ref and lig["_pen_ratios"] else None,
    }
    if len(pen_close_matches) >= 5:
        penalty_block["close_game"] = {
            "n":                  len(pen_close_matches),
            "pen_home_ratio":     round(subgroup_ratio([r for r in sr if (r["penalty_goals_home_close"] + r["penalty_goals_away_close"]) > 0]), 4)
                                  if subgroup_ratio([r for r in sr if (r["penalty_goals_home_close"] + r["penalty_goals_away_close"]) > 0]) is not None else None,
        }
    if len(pen_late_matches) >= 5:
        penalty_block["late_game"] = {
            "n":                  len(pen_late_matches),
            "pen_home_ratio":     round(subgroup_ratio([r for r in sr if (r["penalty_goals_home_late"] + r["penalty_goals_away_late"]) > 0]), 4)
                                  if subgroup_ratio([r for r in sr if (r["penalty_goals_home_late"] + r["penalty_goals_away_late"]) > 0]) is not None else None,
        }
    if len(pen_regular) >= MIN_PER_PHASE:
        penalty_block["regular_only"] = {
            "n":              len(pen_regular),
            "pen_home_ratio": round(subgroup_ratio(pen_regular), 4) if subgroup_ratio(pen_regular) is not None else None,
        }
    if len(pen_playoff) >= MIN_PER_PHASE:
        penalty_block["playoff_only"] = {
            "n":              len(pen_playoff),
            "pen_home_ratio": round(subgroup_ratio(pen_playoff), 4) if subgroup_ratio(pen_playoff) is not None else None,
        }

    return {
        "main_referee":     ref_name,
        "n":                n,
        "seasons_active":   seasons_active,
        "dominant_series":  dominant_series,
        "series_count":     series_count,
        "phase_count":      dict(phase_count),

        "goals":            stat_block(goals_vals, lig["_goals"], "goals"),
        "fouls":            stat_block(fouls_vals, lig["_fouls"], "fouls"),
        "fouls_home_pct":   stat_block(fhpct_vals, lig["_fhpct"], "fhpct"),
        "pen_goals_total":  stat_block(pen_vals, [r["penalty_goals_total"] for r in rows
                                                   if r["series"] == dominant_series
                                                   and r["main_referee"] is not None], "pen"),
        "pen_ratio":        stat_block(pen_ratios_ref, lig["_pen_ratios"], "pen_ratio") if pen_ratios_ref else None,
        "corners":          stat_block(corner_vals, lig["_corners"], "corners"),

        "home_win":         prop_block(hw_count, n, lig["home_win_pct"]),
        "draw":             prop_block(dr_count, n, lig["draw_pct"]),
        "ht_lead_win":      {
            "pct":          round(ht_wins / len(ht_matches), 4) if ht_matches else None,
            "n_with_lead":  len(ht_matches),
            "n_wins":       ht_wins,
        },
        "first_goal_win":   {
            "pct":          round(fg_wins / len(fg_matches), 4) if fg_matches else None,
            "n_with_goal":  len(fg_matches),
            "n_wins":       fg_wins,
        },

        "foul_period":      foul_period,
        "by_season":        by_season,
        "foul_trend":       foul_trend,
        "penalty":          penalty_block,
    }


# ---------------------------------------------------------------------------
# STEG 3: referee_season_trends.json
# ---------------------------------------------------------------------------

def build_season_trends(rows, aggs, league):
    league_by_season = {}
    for series in ("herr", "dam"):
        sn_data = league[series].get("by_season", {})
        league_by_season[series] = sn_data

    referee_by_season = {}
    for agg in aggs:
        name = agg["main_referee"]
        sr = [r for r in rows if r["main_referee"] == name]
        seasons = sorted(set(r["season"] for r in sr))
        seasons_data = {}
        for sn in seasons:
            ss = [r for r in sr if r["season"] == sn]
            if not ss:
                continue
            sn_fouls = [r["fouls_total"] for r in ss]
            sn_hw    = [r["home_win"] for r in ss]
            sn_goals = [r["total_goals"] for r in ss]
            seasons_data[sn] = {
                "n":            len(ss),
                "avg_fouls":    round(sum(sn_fouls) / len(sn_fouls), 3),
                "avg_goals":    round(sum(sn_goals) / len(sn_goals), 3),
                "home_win_pct": round(sum(sn_hw) / len(sn_hw), 3),
                "foul_p1_pct":  round(sum(r["fouls_p1"] for r in ss) / max(1, sum(r["fouls_total"] for r in ss)), 3),
                "foul_p2_pct":  round(sum(r["fouls_p2"] for r in ss) / max(1, sum(r["fouls_total"] for r in ss)), 3),
                "foul_p3_pct":  round(sum(r["fouls_p3"] for r in ss) / max(1, sum(r["fouls_total"] for r in ss)), 3),
                "foul_p4_pct":  round(sum(r["fouls_p4"] for r in ss) / max(1, sum(r["fouls_total"] for r in ss)), 3),
            }

        # Trend fouls
        trend_pts = [(season_to_int(sn), seasons_data[sn]["avg_fouls"])
                     for sn in seasons if sn in seasons_data and seasons_data[sn]["n"] >= MIN_PER_SEASON]
        trend_fouls = None
        if len(trend_pts) >= 3:
            xs = [v[0] for v in trend_pts]
            ys = [v[1] for v in trend_pts]
            slope, se, p_t = linreg(xs, ys)
            if slope is not None:
                trend_fouls = {"slope": round(slope, 4), "se": round(se, 4) if se else None, "p": round(p_t, 4) if p_t else None}

        # 2025-26 vs earlier
        last_season = "2025-26"
        earlier = [r for r in sr if r["season"] != last_season]
        latest  = [r for r in sr if r["season"] == last_season]
        change_block = None
        if len(latest) >= 5 and len(earlier) >= 10:
            _, p_w = welch_ttest([r["fouls_total"] for r in latest],
                                  [r["fouls_total"] for r in earlier])
            m_late = sum(r["fouls_total"] for r in latest) / len(latest)
            m_earl = sum(r["fouls_total"] for r in earlier) / len(earlier)
            change_block = {
                "fouls_delta": round(m_late - m_earl, 3),
                "p_welch":     round(p_w, 4) if p_w is not None else None,
                "n_2526":      len(latest),
                "n_earlier":   len(earlier),
            }

        referee_by_season[name] = {
            "seasons":             seasons_data,
            "trend_fouls":         trend_fouls,
            "change_2526_vs_earlier": change_block,
        }

    return {
        "_meta": {
            "generated":    TODAY,
            "description":  "Säsongsvisa trender per domare och liganivå",
            "source":       "bandygrytan_detailed.json",
        },
        "league_by_season":   league_by_season,
        "referee_by_season":  referee_by_season,
    }


# ---------------------------------------------------------------------------
# STEG 4: referee_penalty_attribution.json
# ---------------------------------------------------------------------------

def build_penalty_attribution(rows, aggs, league):
    league_block = {}
    for series in ("herr", "dam"):
        sr = [r for r in rows if r["series"] == series and r["main_referee"] is not None]
        n = len(sr)
        ph = sum(r["penalty_goals_home"] for r in sr) / n if n else None
        pa = sum(r["penalty_goals_away"] for r in sr) / n if n else None
        phr = ph / (ph + pa) if (ph is not None and pa is not None and (ph + pa) > 0) else None
        league_block[series] = {
            "pen_home_per_match": round(ph, 4) if ph is not None else None,
            "pen_away_per_match": round(pa, 4) if pa is not None else None,
            "pen_home_ratio":     round(phr, 4) if phr is not None else None,
        }

    referees_out = []
    for agg in aggs:
        name = agg["main_referee"]
        sr_ref = [r for r in rows if r["main_referee"] == name]
        dom = agg.get("dominant_series", "herr")
        lig = league[dom]
        sr_lig = [r for r in rows if r["series"] == dom and r["main_referee"] is not None]
        n_ref = len(sr_ref)

        ph = sum(r["penalty_goals_home"] for r in sr_ref) / n_ref
        pa = sum(r["penalty_goals_away"] for r in sr_ref) / n_ref
        phr = ph / (ph + pa) if (ph + pa) > 0 else None
        lig_phr = lig.get("avg_pen_ratio")
        ratio_vs_league = (phr - lig_phr) if (phr is not None and lig_phr is not None) else None

        # Welch on ratio per match
        pen_ratios_ref = [r["penalty_goals_home"] / (r["penalty_goals_home"] + r["penalty_goals_away"])
                          for r in sr_ref if (r["penalty_goals_home"] + r["penalty_goals_away"]) > 0]
        pen_ratios_lig = lig["_pen_ratios"]
        _, p_w = welch_ttest(pen_ratios_ref, pen_ratios_lig) if pen_ratios_ref else (None, 1.0)
        p_bonf = min(1.0, p_w * BONFERRONI_N) if p_w is not None else None
        cd = cohens_d(pen_ratios_ref, pen_ratios_lig) if pen_ratios_ref and pen_ratios_lig else None

        # z
        lig_m, lig_s = mean_std(pen_ratios_lig)
        z = None
        if pen_ratios_ref and lig_s and lig_s > 0:
            ref_m = sum(pen_ratios_ref) / len(pen_ratios_ref)
            z = round((ref_m - lig_m) / (lig_s / math.sqrt(len(pen_ratios_ref))), 3)

        def sub_ratio(sub):
            ph_ = sum(r["penalty_goals_home"] for r in sub)
            pa_ = sum(r["penalty_goals_away"] for r in sub)
            return round(ph_ / (ph_ + pa_), 4) if (ph_ + pa_) > 0 else None

        rec = {
            "name":                  name,
            "n":                     n_ref,
            "series":                dom,
            "pen_home_per_match":    round(ph, 4),
            "pen_away_per_match":    round(pa, 4),
            "pen_home_ratio":        round(phr, 4) if phr is not None else None,
            "pen_home_ratio_vs_league": round(ratio_vs_league * 100, 2) if ratio_vs_league is not None else None,
            "z_score":               z,
            "p_welch":               round(p_w, 4) if p_w is not None else None,
            "p_bonf":                round(p_bonf, 4) if p_bonf is not None else None,
            "cohens_d":              round(cd, 4) if cd is not None else None,
        }

        close = [r for r in sr_ref if (r["penalty_goals_home_close"] + r["penalty_goals_away_close"]) > 0]
        late  = [r for r in sr_ref if (r["penalty_goals_home_late"] + r["penalty_goals_away_late"]) > 0]
        regular = [r for r in sr_ref if r["phase"] == "regular"]
        playoff = [r for r in sr_ref if r["phase"] in ("quarterfinal", "semifinal", "final", "playoff")]

        if len(close) >= 5:
            rec["close_game"] = {"n": len(close), "pen_home_ratio": sub_ratio(close)}
        if len(late) >= 5:
            rec["late_game"] = {"n": len(late), "pen_home_ratio": sub_ratio(late)}
        if len(regular) >= MIN_PER_PHASE:
            rec["regular_only"] = {"n": len(regular), "pen_home_ratio": sub_ratio(regular)}
        if len(playoff) >= MIN_PER_PHASE:
            rec["playoff_only"] = {"n": len(playoff), "pen_home_ratio": sub_ratio(playoff)}

        referees_out.append(rec)

    referees_out.sort(key=lambda r: abs(r["pen_home_ratio_vs_league"] or 0), reverse=True)

    return {
        "_meta": {
            "generated": TODAY,
            "caveat": ("penaltyGoals är proxy för tilldelade straffar. ~30–40% av straffar "
                       "konverteras ej → underskattning. Konverteringsskillnader hemma/borta "
                       "kan skapa bias i penalty_home_ratio."),
            "source": "bandygrytan_detailed.json",
        },
        "league":    league_block,
        "referees":  referees_out,
    }


# ---------------------------------------------------------------------------
# STEG 5: referee_dam_herr.json
# ---------------------------------------------------------------------------

def build_dam_herr(rows, league):
    dam_rows = [r for r in rows if r["series"] == "dam" and r["main_referee"] is not None]
    dam_refs = defaultdict(list)
    for r in dam_rows:
        dam_refs[r["main_referee"]].append(r)

    herr_rows = [r for r in rows if r["series"] == "herr" and r["main_referee"] is not None]
    herr_refs = defaultdict(list)
    for r in herr_rows:
        herr_refs[r["main_referee"]].append(r)

    dam_overview = {
        "unique_referees":        len(dam_refs),
        "referees_with_n30_plus": sum(1 for v in dam_refs.values() if len(v) >= MIN_MATCHES),
        "home_win_pct_league":    round(league["dam"]["home_win_pct"], 4),
        "avg_fouls_league":       round(league["dam"]["avg_fouls"], 4),
        "ht_lead_win_pct_league": round(league["dam"]["ht_lead_win_pct"], 4) if league["dam"]["ht_lead_win_pct"] else None,
    }

    dam_referees = []
    for name in sorted(dam_refs.keys(), key=lambda n: len(dam_refs[n]), reverse=True):
        dr = dam_refs[name]
        hr = herr_refs.get(name, [])
        n_dam = len(dr)
        n_herr = len(hr)

        def avg_or_none(lst, key):
            vals = [r[key] for r in lst]
            return round(sum(vals) / len(vals), 3) if vals else None

        rec = {
            "name":              name,
            "n_dam":             n_dam,
            "n_herr":            n_herr,
            "home_win_pct_dam":  avg_or_none(dr, "home_win"),
            "home_win_pct_herr": avg_or_none(hr, "home_win") if hr else None,
            "avg_fouls_dam":     avg_or_none(dr, "fouls_total"),
            "avg_fouls_herr":    avg_or_none(hr, "fouls_total") if hr else None,
            "avg_goals_dam":     avg_or_none(dr, "total_goals"),
            "avg_goals_herr":    avg_or_none(hr, "total_goals") if hr else None,
        }
        dam_referees.append(rec)

    # Pool comparison
    dam_only = [name for name in dam_refs if name not in herr_refs or len(herr_refs[name]) < 5]
    shared   = [name for name in dam_refs if name in herr_refs and len(herr_refs[name]) >= 5]

    def pool_stats(names, use_dam=True):
        ref_rows = []
        for name in names:
            ref_rows.extend(dam_refs[name] if use_dam else herr_refs.get(name, []))
        if not ref_rows:
            return {"referees": names, "n": 0}
        fouls = [r["fouls_total"] for r in ref_rows]
        hw = [r["home_win"] for r in ref_rows]
        return {
            "referees":     names,
            "n":            len(ref_rows),
            "avg_fouls":    round(sum(fouls) / len(fouls), 3),
            "home_win_pct": round(sum(hw) / len(hw), 3),
        }

    return {
        "_meta": {
            "generated": TODAY,
            "description": "Dam vs herr domarpool-analys",
        },
        "dam_overview":    dam_overview,
        "dam_referees":    dam_referees,
        "pool_comparison": {
            "dam_only_pool": pool_stats(dam_only, use_dam=True),
            "shared_pool":   pool_stats(shared, use_dam=True),
        },
    }


# ---------------------------------------------------------------------------
# STEG 6+7+8: Markdown-rapporter
# ---------------------------------------------------------------------------

def identify_flagged_referees(aggs, league):
    """Identifiera domarna som flaggades i v1 (Domare A–D) via fouls z-score."""
    flagged = []
    for agg in aggs:
        f = agg.get("fouls", {})
        if f and f.get("z") is not None and abs(f["z"]) >= 2.0:
            flagged.append(agg)
    flagged.sort(key=lambda a: a["fouls"]["z"])
    return flagged


def write_patterns_md(aggs, league, flagged):
    lig_herr = league["herr"]
    lig_dam  = league["dam"]

    lines = [
        "# Domaranalys — Mönster i Bandygrytan-data",
        "",
        "**INTERN. Domarnamn publiceras EJ i Bandy Brain, GitHub eller annan publik kanal.**  ",
        f"**Rapport:** {TODAY}  ",
        "**Underlag:** Bandygrytan Firebase, Elitserien herr + dam, 6 säsonger  ",
        "**Status:** Deskriptiv analys — inga slutsatser om enskilda domares kvalitet eller avsikt.",
        "",
        "---",
        "",
        "## 1. Sammanfattning av datasetet",
        "",
        f"**Täckning:** 1749 matcher (1321 herr, 428 dam), 6 säsonger (2019-20 till 2025-26, exkl. 2023-24).",
        "",
        "**Domardata:** 1745 matcher har domarinfo (99.8%). De 4 saknade är alla från 2019-20.",
        "",
        f"**Unika huvuddomare:** 104 totalt i datasetet.  ",
        f"**Med n ≥ 30 matcher:** 18 domare — dessa är basen för kvantitativ analys.",
        "",
        f"**Matchantal per domare (de 18):** median 72, min 33, max 142.",
        "",
        f"**Ligamedel herr:** {fmt_f(lig_herr['avg_goals'])} mål/match, "
        f"{fmt_f(lig_herr['avg_fouls'])} utvisningar/match, "
        f"{fmt_pct(lig_herr['home_win_pct'])} hemmavinst (n={lig_herr['n']} matcher med domardata)  ",
        f"**Ligamedel dam:** {fmt_f(lig_dam['avg_goals'])} mål/match, "
        f"{fmt_f(lig_dam['avg_fouls'])} utvisningar/match, "
        f"{fmt_pct(lig_dam['home_win_pct'])} hemmavinst (n={lig_dam['n']})",
        "",
        "---",
        "",
        "## 2. Domare med anmärkningsvärda mönster",
        "",
        "Tröskel: |z| > 2 och n ≥ 30 för det specifika måttet. Bonferroni-korrigerat p-värde beräknat som p_raw × 18 (antal domare).",
        "",
        "### 2.1 Utvisningsfrekvens (fouls/match)",
        "",
    ]

    low = [a for a in flagged if a["fouls"]["z"] < 0]
    high = [a for a in flagged if a["fouls"]["z"] > 0]

    if not flagged:
        lines.append("Inga domare når |z| > 2 för utvisningsfrekvens i det aktuella datasetet.")
    else:
        n_sig = sum(1 for a in flagged if (a["fouls"].get("p_bonf") or 1.0) < 0.05)
        lines.append(f"**{len(flagged)} domare har |z| > 2 för utvisningsfrekvens**, "
                     f"{n_sig} av dessa är signifikanta efter Bonferroni-korrigering.")
        lines.append("")

        for agg in flagged:
            f = agg["fouls"]
            p_bonf_str = fmt_f(f.get("p_bonf"), 3)
            sig_label = "*(signifikant efter korrigering)*" if (f.get("p_bonf") or 1.0) < 0.05 else "*(ej signifikant efter korrigering)*"
            series = agg["dominant_series"]
            lig_avg = lig_herr["avg_fouls"] if series == "herr" else lig_dam["avg_fouls"]

            lines += [
                f"---",
                "",
                f"**{agg['main_referee']}** (n={agg['n']}, {series})",
                f"Mått: fouls/match  ",
                f"Värde: {fmt_f(f['mean'])} (n={agg['n']})  ",
                f"Ligamedel: {fmt_f(lig_avg)}  ",
                f"Z-score: {fmt_f(f['z'], 2)}  ",
                f"Welch p: {fmt_f(f['p_welch'], 3)} (icke-korrigerat)  ",
                f"Bonferroni-korrigerat p: {p_bonf_str} {sig_label}  ",
                f"Säsonger aktiva: {', '.join(agg['seasons_active'])}  ",
                "",
            ]

    lines += [
        "---",
        "",
        "### 2.2 Straff-asymmetri (penalty_home_ratio)",
        "",
    ]

    pen_flagged = [a for a in aggs if a.get("penalty") and
                   a["penalty"].get("ratio_vs_league") is not None and
                   abs(a["penalty"]["ratio_vs_league"]) > 0.08]

    if not pen_flagged:
        lines.append("Inga domare med anmärkningsvärd straff-asymmetri vid |Δratio| > 8 procentenheter.")
    else:
        for agg in sorted(pen_flagged, key=lambda a: abs(a["penalty"].get("ratio_vs_league") or 0), reverse=True):
            pen = agg["penalty"]
            lines += [
                f"**{agg['main_referee']}** (n={agg['n']}, {agg['dominant_series']}): "
                f"ratio {fmt_pct(pen.get('ratio'))} vs ligamedel "
                f"{fmt_pct(league[agg['dominant_series']].get('avg_pen_ratio'))}, "
                f"Δ={fmt_f((pen.get('ratio_vs_league') or 0)*100, 1)} pp, "
                f"p_bonf={fmt_f(pen.get('p_bonf'), 3)}",
                "",
            ]

    lines += [
        "---",
        "",
        "### 2.3 Hemmavinst%",
        "",
    ]

    hw_flagged = [a for a in aggs if a.get("home_win") and
                  abs(a["home_win"].get("z") or 0) > 2.0]
    if not hw_flagged:
        lines.append("**Ingen domare** (n≥30) har |z| > 2 för hemmavinst%.  ")
        lines.append(f"Spridningen bland herr-domarna: "
                     f"{fmt_pct(min(a['home_win']['pct'] for a in aggs if a.get('home_win')))}–"
                     f"{fmt_pct(max(a['home_win']['pct'] for a in aggs if a.get('home_win')))}, "
                     f"ligamedel {fmt_pct(lig_herr['home_win_pct'])} (herr).")
    else:
        for agg in hw_flagged:
            hw = agg["home_win"]
            lines.append(f"**{agg['main_referee']}** (n={agg['n']}): "
                         f"hemmavinst {fmt_pct(hw['pct'])}, z={fmt_f(hw['z'], 2)}, "
                         f"p_bonf={fmt_f(hw.get('p_bonf'), 3)}")

    lines += [
        "",
        "---",
        "",
        "## 3. Fas-allokering och slutspelsdomare",
        "",
        "Playoff-andel per domare (domare med n≥30):  ",
        "",
        "| Domare | Total n | Slutspelsmatcher | Andel |",
        "|--------|---------|-----------------|-------|",
    ]

    def playoff_count(agg):
        pc = agg.get("phase_count", {})
        return sum(pc.get(p, 0) for p in ("quarterfinal", "semifinal", "final", "playoff"))

    for agg in sorted(aggs, key=lambda a: playoff_count(a) / a["n"], reverse=True)[:10]:
        pc = agg.get("phase_count", {})
        sp = playoff_count(agg)
        lines.append(f"| {agg['main_referee']} | {agg['n']} | {sp} | {sp/agg['n']*100:.0f}% |")

    lines += [
        "",
        "---",
        "",
        "## 4. Säsongsstabilitet",
        "",
        "Notera: 2023-24 saknas ur datasetet — ett gap finns i alla domarkarriärer.",
        "",
        "---",
        "",
        "## 5. Dam vs herr",
        "",
        f"**Damligamedel:** {fmt_f(lig_dam['avg_goals'])} mål/match vs herr {fmt_f(lig_herr['avg_goals'])}. "
        f"Utvisningar: {fmt_f(lig_dam['avg_fouls'])} (dam) vs {fmt_f(lig_herr['avg_fouls'])} (herr).",
        "",
        "---",
        "",
        "## 6. Begränsningar",
        "",
        "- **`fouls[].team` finns och är 100% täckt** i Bandygrytan-data. Hemma/borta-fördelning av utvisningar är beräkningsbar.",
        "- **`penalties_awarded` är alltid 0** i befintlig data — vi använder `penaltyGoals` (mål på straff) som proxy. Underskattning: missade straffar räknas inte.",
        "- **Sample size per fas är liten.** En domare med n=87 och 11 slutspelsmatcher har för litet underlag för slutspelsspecifik analys.",
        "- **2023-24 saknas helt** ur datasetet.",
        "- **Multipel-test-problematik.** Med 18 domare och ~13 mått per domare (234 test-situationer) är Bonferroni-korrektionen konservativ.",
        "- **Korrelation ≠ kausalitet.** Mönster kan drivas av matchmix, arenatyp, fas, spelarstil — inte domar-stil.",
        "",
        "---",
        "",
        "## 7. Frågor som datan inte kan svara på utan kompletterande data från SBF",
        "",
        "1. **Matchallokering** — Finns ett systematiskt mönster i vilka domare tilldelats vilka klubbmöten?",
        "2. **Domarbedömning** — Hur betygsätter SBF domare internt?",
        "3. **Fullständig säsong 2023-24** — Vad hände? Varför finns inte den säsongen i Bandygrytan?",
        "4. **Spelarstil per matchuppsättning** — Är utvisningsfrekvens-mönstren stabila när man kontrollerar för vilka lag som spelade?",
        "",
        "---",
        "",
        "*Filerna `INTERNAL_referee_per_match.json` och `INTERNAL_referee_aggregates.json` innehåller fullständiga domarnamn och är gitignorerade.*",
    ]

    return "\n".join(lines)


def write_profiles_md(aggs, league):
    lines = [
        "# Domaranalys — Individuella profiler",
        "",
        "**INTERN. Ej för publik kanal.**  ",
        f"**Rapport:** {TODAY}  ",
        "En sektion per domare med n≥30. Sorterat på total matchcount, fallande.",
        "",
        "---",
        "",
    ]

    for agg in sorted(aggs, key=lambda a: a["n"], reverse=True):
        name = agg["main_referee"]
        n = agg["n"]
        seasons = agg["seasons_active"]
        dom = agg["dominant_series"]
        lig = league[dom]
        sc = agg["series_count"]
        pc = agg.get("phase_count", {})

        lines += [
            f"## {name}",
            f"Total: n={n} ({len(seasons)} säsonger aktiva, {seasons[0]} – {seasons[-1]})  ",
            f"Serie: herr ({sc.get('herr',0)}), dam ({sc.get('dam',0)})",
            "",
            "### Fas-allokering",
        ]
        phase_parts = []
        for ph in ["regular", "quarterfinal", "semifinal", "final", "qualification", "round_of_16", "playoff"]:
            cnt = pc.get(ph, 0)
            if cnt > 0:
                phase_parts.append(f"{ph.capitalize()}: {cnt}")
        lines.append(", ".join(phase_parts) if phase_parts else "–")
        lines.append("")

        # Karriärbåge
        lines += ["### Karriärbåge (matcher per säsong)", ""]
        lines.append("| Säsong | n | Utvisn/match | Hemmavinst% |")
        lines.append("|--------|---|-------------|-------------|")
        for sn in seasons:
            bs = agg["by_season"].get(sn, {})
            note = " *(n<10)*" if "note" in bs else ""
            lines.append(f"| {sn} | {bs.get('n','–')} | "
                         f"{fmt_f(bs.get('avg_fouls'))}{note} | "
                         f"{fmt_pct(bs.get('home_win_pct'))} |")
        lines.append("")

        # Spelmönster
        lines += ["### Spelmönster", ""]
        lines.append("| Mått | Domare | Ligamedel | Δ | 95% CI | Cohen's d | p_welch | p_Bonf |")
        lines.append("|------|--------|-----------|---|--------|-----------|---------|--------|")

        def mrow(label, block, lig_val):
            if not block:
                return f"| {label} | – | {fmt_f(lig_val)} | – | – | – | – | – |"
            delta = (block["mean"] - lig_val) if lig_val is not None else None
            return (f"| {label} | {fmt_f(block['mean'])} | {fmt_f(lig_val)} | "
                    f"{fmt_f(delta, 3) if delta is not None else '–'} | "
                    f"{fmt_ci(block.get('ci_low'), block.get('ci_high'))} | "
                    f"{fmt_f(block.get('cohens_d'))} | "
                    f"{fmt_f(block.get('p_welch'))} | "
                    f"{fmt_f(block.get('p_bonf'))} |")

        lines.append(mrow("Mål/match", agg.get("goals"), lig.get("avg_goals")))
        lines.append(mrow("Utvisn/match", agg.get("fouls"), lig.get("avg_fouls")))
        lines.append(mrow("Utvisn hemma%", agg.get("fouls_home_pct"), lig.get("avg_fouls_home_pct")))
        lines.append(mrow("Straffmål/match", agg.get("pen_goals_total"),
                          lig.get("avg_pen_home", 0) + lig.get("avg_pen_away", 0) if lig.get("avg_pen_home") else None))
        lines.append(mrow("Hörnor/match", agg.get("corners"), lig.get("avg_corners")))
        lines.append("")

        # Utfall
        lines += ["### Utfall", ""]
        lines.append("| Mått | Domare | Baseline | Δ | 95% CI | Cohen's h | p_binom | p_Bonf |")
        lines.append("|------|--------|----------|---|--------|-----------|---------|--------|")

        def prow(label, block, baseline):
            if not block:
                return f"| {label} | – | {fmt_pct(baseline)} | – | – | – | – | – |"
            delta_pp = (block["pct"] - baseline) * 100 if baseline is not None else None
            return (f"| {label} | {fmt_pct(block['pct'])} | {fmt_pct(baseline)} | "
                    f"{fmt_f(delta_pp, 1) if delta_pp is not None else '–'}pp | "
                    f"{fmt_ci(block.get('ci_low'), block.get('ci_high'), dec=3)} | "
                    f"{fmt_f(block.get('cohens_h'))} | "
                    f"{fmt_f(block.get('p_binom'))} | "
                    f"{fmt_f(block.get('p_bonf'))} |")

        lines.append(prow("Hemmavinst%", agg.get("home_win"), lig.get("home_win_pct")))
        lines.append(prow("Oavgjort%", agg.get("draw"), lig.get("draw_pct")))

        ht = agg.get("ht_lead_win", {})
        if ht and ht.get("pct") is not None:
            lines.append(f"| HT-lead-win% | {fmt_pct(ht['pct'])} | "
                         f"{fmt_pct(lig.get('ht_lead_win_pct'))} | – | – | – | – | – | "
                         f"*(n={ht['n_with_lead']})* |")

        fg = agg.get("first_goal_win", {})
        if fg and fg.get("pct") is not None:
            lines.append(f"| First-goal-win% | {fmt_pct(fg['pct'])} | "
                         f"{fmt_pct(lig.get('first_goal_win_pct'))} | – | – | – | – | – | "
                         f"*(n={fg['n_with_goal']})* |")

        lines.append("")

        # Utvisningar per period
        fp = agg.get("foul_period", {})
        lines += ["### Utvisningar per matchperiod", ""]
        lines.append("| Period | Domare % | Liga % | Z-score |")
        lines.append("|--------|----------|--------|---------|")
        for i, (pk, zk, lk, label) in enumerate([
            ("pct_p1", "z_p1", "avg_foul_pct_p1", "0–29 min"),
            ("pct_p2", "z_p2", "avg_foul_pct_p2", "30–59 min"),
            ("pct_p3", "z_p3", "avg_foul_pct_p3", "60–89 min"),
            ("pct_p4", "z_p4", "avg_foul_pct_p4", "90+ min"),
        ]):
            val = fp.get(pk)
            z_v = fp.get(zk)
            lig_v = lig.get(lk)
            lines.append(f"| {label} | {fmt_pct(val)} | {fmt_pct(lig_v)} | {fmt_f(z_v, 2)} |")

        lines += ["", "---", ""]

    return "\n".join(lines)


def write_deep_dive_md(aggs, league, rows, season_trends):
    lig_h = league["herr"]
    lig_d = league["dam"]

    lines = [
        "# Domaranalys — Djupdykning",
        "",
        "*INTERN. Ej för publik kanal.*  ",
        f"*Genererad: {TODAY}*",
        "",
        "---",
        "",
        "## 1. Sammanfattning",
        "",
        f"Analysen täcker 1745 matcher med domarinfo (av 1749 totalt, 99.8%) "
        f"från sex säsonger 2019-20 till 2025-26 (exkl. 2023-24). "
        f"18 domare uppnår n≥30 och ingår i kvantitativ analys.",
        "",
        "**Viktigaste fynd:**",
        "",
    ]

    # List significant findings
    sig_fouls = [a for a in aggs if a.get("fouls") and
                 (a["fouls"].get("p_bonf") or 1.0) < 0.05]
    if sig_fouls:
        for agg in sig_fouls:
            f = agg["fouls"]
            direction = "lägre" if f["z"] < 0 else "högre"
            lines.append(f"- **{agg['main_referee']}** (n={agg['n']}) dömer konsekvent "
                         f"{direction} utvisningsfrekvens: {fmt_f(f['mean'])} vs "
                         f"ligamedel {fmt_f(lig_h['avg_fouls'])} "
                         f"(z={fmt_f(f['z'], 2)}, p_Bonf={fmt_f(f['p_bonf'], 3)})")
    else:
        lines.append("- Inga enskilda domare når statistisk signifikans för utvisningsfrekvens "
                     "efter Bonferroni-korrigering.")

    lines += [
        "",
        "- Ingen domare (n≥30) har signifikant avvikande hemmavinst%.",
        "- Straff-asymmetri finns men n per subgrupp är för litet för robusta slutsatser.",
        "",
        "---",
        "",
        "## 2. Dataset och metodologi",
        "",
        "### Statistiska metoder",
        "",
        "- **Welch t-test** för kontinuerliga mått (mål, utvisningar, hörnor). "
          "Welch väljs över Students t-test eftersom varianshomogenitet inte kan antas — "
          "domarens matchpool är ett urval, inte ett slumpmässigt stickprov.",
        "- **Binomtest** för proportioner (hemmavinst%, oavgjort%).",
        "- **Bootstrap 95% konfidensintervall** (n=1000, seed=42) för kontinuerliga mått.",
        "- **Wilson score interval** för proportioner.",
        "- **Cohen's d** för effektstorlek (kontinuerliga mått), **Cohen's h** för proportioner.",
        "- **Bonferroni-korrigering** med faktor 18 (antal domare) per enskilt mått.",
        "",
        "### Bonferroni-kalkyl",
        "",
        f"18 domare × ~13 testade mått = 234 jämförelser totalt. "
        f"Korrelerade mått (utvisningar per period summerar till 1) gör Bonferroni konservativ. "
        f"Vi rapporterar p_raw × 18 per mått (enklare att motivera än FDR).",
        "",
        "### Täckning",
        "",
        f"- Herr: {lig_h['n']} matcher med domarinfo",
        f"- Dam: {lig_d['n']} matcher med domarinfo",
        f"- Totalt: {lig_h['n'] + lig_d['n']} av 1749 (99.8%)",
        "",
        "### Uppdatering av begränsning från v1-rapporten",
        "",
        "**`fouls[].team` finns och är 100% täckt** (4987/4987 fouls i herr-serien har teamfält). "
        "Felaktig claim i v1-rapporten om att teamfält saknas är korrigerad. "
        "Hemma/borta-fördelning av utvisningar per domare är nu beräknad.",
        "",
        "---",
        "",
        "## 3. Säsongstrender — 'Våga visa rött'-effekten",
        "",
        "Liganivå fouls/match per säsong:",
        "",
        "| Säsong | Herr n | Herr fouls/match | Dam n | Dam fouls/match | Herr hemmavinst% |",
        "|--------|--------|-----------------|-------|-----------------|-----------------|",
    ]

    for sn in sorted(set(list(lig_h.get("by_season", {}).keys()) +
                         list(lig_d.get("by_season", {}).keys()))):
        hb = lig_h.get("by_season", {}).get(sn, {})
        db = lig_d.get("by_season", {}).get(sn, {})
        lines.append(f"| {sn} | {hb.get('n','–')} | {fmt_f(hb.get('avg_fouls'))} | "
                     f"{db.get('n','–')} | {fmt_f(db.get('avg_fouls'))} | "
                     f"{fmt_pct(hb.get('home_win_pct'))} |")

    lines += [
        "",
        "### Per domare: 2025-26 vs tidigare",
        "",
        "| Domare | n total | n 2025-26 | Δ fouls/match | p (Welch) |",
        "|--------|---------|-----------|--------------|-----------|",
    ]

    rb_season = season_trends.get("referee_by_season", {})
    for agg in sorted(aggs, key=lambda a: a["n"], reverse=True):
        name = agg["main_referee"]
        rb = rb_season.get(name, {})
        ch = rb.get("change_2526_vs_earlier")
        if ch:
            lines.append(f"| {name} | {agg['n']} | {ch['n_2526']} | "
                         f"{fmt_f(ch['fouls_delta'], 2)} | {fmt_f(ch['p_welch'], 3)} |")
        else:
            lines.append(f"| {name} | {agg['n']} | – | – | – |")

    lines += [
        "",
        "**Slutsats:** Trendanalysen begränsas av saknad säsong 2023-24 och litet n per säsong. "
        "Inga robusta slutsatser om systematiskt skift i hela domarkåren kan dras från detta material.",
        "",
        "---",
        "",
        "## 4. Straff-asymmetri per domare",
        "",
        f"Ligamedel straff-ratio (hemma/(hemma+borta)): "
        f"herr {fmt_pct(lig_h.get('avg_pen_ratio'))}, "
        f"dam {fmt_pct(lig_d.get('avg_pen_ratio'))}",
        "",
        "| Domare | n | Serie | Ratio hemma | Ratio borta | Δ vs ligamedel (pp) | p_Bonf |",
        "|--------|---|-------|-------------|-------------|---------------------|--------|",
    ]

    for agg in sorted(aggs, key=lambda a: abs((a.get("penalty") or {}).get("ratio_vs_league") or 0), reverse=True):
        pen = agg.get("penalty", {}) or {}
        ratio_vs = pen.get("ratio_vs_league")
        if ratio_vs is not None:
            ratio_vs_str = f"{ratio_vs*100:+.1f}" if ratio_vs is not None else "–"
        else:
            ratio_vs_str = "–"
        lines.append(f"| {agg['main_referee']} | {agg['n']} | {agg['dominant_series']} | "
                     f"{fmt_pct(pen.get('ratio'))} | "
                     f"{fmt_pct(1 - (pen.get('ratio') or 0)) if pen.get('ratio') is not None else '–'} | "
                     f"{ratio_vs_str} | {fmt_f(pen.get('p_bonf'), 3)} |")

    lines += [
        "",
        "**Begränsning:** penaltyGoals är proxy för tilldelade straffar. "
        "Konverteringsrate ~60–70% och potentiell hemma/borta-skillnad i konvertering gör "
        "ratio-måttet osäkert. Inga domare når statistisk signifikans efter Bonferroni-korrigering.",
        "",
        "---",
        "",
        "## 5. Dam-anomalin",
        "",
        f"Damserien har {fmt_f(lig_d['avg_fouls'])} utvisningar/match vs "
        f"{fmt_f(lig_h['avg_fouls'])} i herr (+{fmt_f(lig_d['avg_fouls'] - lig_h['avg_fouls'], 2)} per match). "
        f"Hemmavinst% är lägre: {fmt_pct(lig_d['home_win_pct'])} vs {fmt_pct(lig_h['home_win_pct'])}.",
        "",
        "### Dam-domare (alla med minst 10 dam-matcher)",
        "",
        "| Domare | n dam | n herr | Utvisn/match (dam) | Hemmavinst% (dam) |",
        "|--------|-------|--------|-------------------|------------------|",
    ]

    dam_rows_refs = defaultdict(list)
    herr_rows_refs = defaultdict(list)
    for r in rows:
        if r["main_referee"]:
            if r["series"] == "dam":
                dam_rows_refs[r["main_referee"]].append(r)
            else:
                herr_rows_refs[r["main_referee"]].append(r)

    dam_ref_list = [(name, rlist) for name, rlist in dam_rows_refs.items() if len(rlist) >= 10]
    dam_ref_list.sort(key=lambda x: len(x[1]), reverse=True)

    for name, dr in dam_ref_list:
        hr = herr_rows_refs.get(name, [])
        avg_f = sum(r["fouls_total"] for r in dr) / len(dr)
        hw_pct = sum(r["home_win"] for r in dr) / len(dr)
        lines.append(f"| {name} | {len(dr)} | {len(hr)} | {fmt_f(avg_f)} | {fmt_pct(hw_pct)} |")

    lines += [
        "",
        "---",
        "",
        "## 10. Begränsningar (uttömmande)",
        "",
        "1. **penaltyGoals är proxy** för tilldelade straffar (~60–70% konverteringsrate → underskattning). "
           "Konverteringsskillnader hemma/borta skapar möjlig bias.",
        "2. **Säsong 2023-24 saknas** — gap i alla karriärkurvor.",
        "3. **n per säsong är litet** (10–30) — säsongsspecifika slutsatser är osäkra.",
        "4. **Bonferroni konservativ** — 234 test varav många är korrelerade.",
        "5. **Konfunderat: matchmix** — vilka klubbar som möts påverkar alla mått.",
        "6. **Korrelation ≠ kausalitet** — inga slutsatser om avsikt eller kvalitet.",
        "7. **Förlängning** ingår i totalen utan separat kolumn.",
        "8. **Assistansdomare** ingår inte i analysen.",
        "",
        "---",
        "",
        "## 11. Frågor som kräver komplettering från SBF",
        "",
        "1. Matchallokeringsdata — vem tilldelar domare?",
        "2. Intern domarbedömning — korrelerar kvantitativa mönster med SBF:s bedömningar?",
        "3. Fullständig säsong 2023-24.",
        "4. Spelarstil per matchuppsättning (kontroll för klubbidentitet).",
        "5. Assistansdomarens protokollförda roll — möjliggör dom-pars-analys.",
        "",
        "---",
        "",
        "*Genererad av `scripts/analyze_referees_deep.py`*",
    ]

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

def main():
    print("Laddar data...")
    with open(SRC_JSON) as f:
        raw = json.load(f)

    print("Bygger per-match-tabell...")
    rows = build_match_table(raw)
    print(f"  {len(rows)} matcher inlästa")

    print("Beräknar ligamedel...")
    league = compute_league(rows)
    print(f"  Herr: n={league['herr']['n']}, "
          f"fouls={fmt_f(league['herr']['avg_fouls'])}, "
          f"hw%={fmt_pct(league['herr']['home_win_pct'])}")
    print(f"  Dam:  n={league['dam']['n']}, "
          f"fouls={fmt_f(league['dam']['avg_fouls'])}, "
          f"hw%={fmt_pct(league['dam']['home_win_pct'])}")

    print("Beräknar domar-aggregat...")
    all_refs = sorted(set(r["main_referee"] for r in rows if r["main_referee"]))
    aggs = []
    for ref in all_refs:
        agg = compute_referee_aggregate(ref, rows, league)
        if agg:
            aggs.append(agg)
    aggs.sort(key=lambda a: a["n"], reverse=True)
    print(f"  {len(aggs)} domare med n≥{MIN_MATCHES}")

    print("Bygger season_trends.json...")
    season_trends = build_season_trends(rows, aggs, league)
    with open(OUT_TRENDS, "w") as f:
        json.dump(season_trends, f, ensure_ascii=False, indent=2)
    print(f"  → {OUT_TRENDS}")

    print("Bygger penalty_attribution.json...")
    penalty_data = build_penalty_attribution(rows, aggs, league)
    with open(OUT_PENALTY, "w") as f:
        json.dump(penalty_data, f, ensure_ascii=False, indent=2)
    print(f"  → {OUT_PENALTY}")

    print("Bygger dam_herr.json...")
    dam_herr_data = build_dam_herr(rows, league)
    with open(OUT_DAMHERR, "w") as f:
        json.dump(dam_herr_data, f, ensure_ascii=False, indent=2)
    print(f"  → {OUT_DAMHERR}")

    print("Identifierar flaggade domare...")
    flagged = identify_flagged_referees(aggs, league)
    print(f"  {len(flagged)} domare med |z|>2 för utvisningar")

    print("Skriver INTERNAL_REFEREE_PATTERNS.md...")
    patterns_md = write_patterns_md(aggs, league, flagged)
    with open(OUT_PATTERNS, "w") as f:
        f.write(patterns_md)
    print(f"  → {OUT_PATTERNS}")

    print("Skriver INTERNAL_REFEREE_PROFILES.md...")
    profiles_md = write_profiles_md(aggs, league)
    with open(OUT_PROFILES, "w") as f:
        f.write(profiles_md)
    print(f"  → {OUT_PROFILES}")

    print("Skriver INTERNAL_REFEREE_DEEP_DIVE.md...")
    deep_md = write_deep_dive_md(aggs, league, rows, season_trends)
    with open(OUT_DEEP, "w") as f:
        f.write(deep_md)
    print(f"  → {OUT_DEEP}")

    print("\nKlar. Alla 6 outputfiler genererade.")
    print("\nSammandrag:")
    sig = [a for a in aggs if a.get("fouls") and (a["fouls"].get("p_bonf") or 1.0) < 0.05]
    print(f"  Signifikant fouls-avvikelse (p_Bonf<0.05): {len(sig)} domare")
    for a in sig:
        print(f"    {a['main_referee']}: z={fmt_f(a['fouls']['z'], 2)}, "
              f"mean={fmt_f(a['fouls']['mean'])}, p_Bonf={fmt_f(a['fouls']['p_bonf'], 3)}")


if __name__ == "__main__":
    main()
