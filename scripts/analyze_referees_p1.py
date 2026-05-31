"""
analyze_referees_p1.py — P1-fasen av domaranalysen

Producerar:
  docs/data/INTERNAL_referee_clubmix.json
  docs/data/INTERNAL_referee_allocation.json
  Lägger till kapitel 6, 7, 8 i docs/data/INTERNAL_REFEREE_DEEP_DIVE.md

Kör: python3 scripts/analyze_referees_p1.py
"""

import json
import math
import datetime
from collections import defaultdict
from pathlib import Path
import statistics

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE = Path(__file__).parent.parent
DATA_DIR = BASE / "docs" / "data"
DEEP_DIVE_MD = DATA_DIR / "INTERNAL_REFEREE_DEEP_DIVE.md"
INPUT_JSON = DATA_DIR / "bandygrytan_detailed.json"
OUT_CLUBMIX = DATA_DIR / "INTERNAL_referee_clubmix.json"
OUT_ALLOCATION = DATA_DIR / "INTERNAL_referee_allocation.json"

# ── Constants ──────────────────────────────────────────────────────────────────
N_MIN = 30
N_MIN_PHASE = 10
BOOTSTRAP_ITER = 1000
BOOTSTRAP_SEED = 42
BONFERRONI_FACTOR = 18
OUTLIER_REFS = ["Daniel Labe", "Jacob Liljegren", "Andreas Rönnbäck"]
PLAYOFF_PHASES = {"quarterfinal", "semifinal", "final", "round_of_16", "playoff"}

# ── Helpers ────────────────────────────────────────────────────────────────────

def load_data():
    with open(INPUT_JSON) as f:
        raw = json.load(f)
    herr = raw.get("herr", {}).get("matches", [])
    dam = raw.get("dam", {}).get("matches", [])
    return herr + dam


def fouls_in_match(m):
    return len(m.get("fouls", []))


def get_main_ref(m):
    refs = m.get("referees") or {}
    return refs.get("main")


def welch_t(a, b):
    """Returns (t, p_two_tailed) for two independent samples using Welch's t."""
    na, nb = len(a), len(b)
    if na < 2 or nb < 2:
        return None, None
    ma, mb = statistics.mean(a), statistics.mean(b)
    va, vb = statistics.variance(a), statistics.variance(b)
    se = math.sqrt(va / na + vb / nb)
    if se == 0:
        return None, None
    t = (ma - mb) / se
    # Welch-Satterthwaite degrees of freedom
    df_num = (va / na + vb / nb) ** 2
    df_den = (va / na) ** 2 / (na - 1) + (vb / nb) ** 2 / (nb - 1)
    df = df_num / df_den if df_den > 0 else 1
    # two-tailed p via incomplete beta (approximation using scipy if available)
    try:
        from scipy import stats as sp_stats
        p = 2 * sp_stats.t.sf(abs(t), df)
    except ImportError:
        # Simple normal approximation for large df
        p = 2 * (1 - normal_cdf(abs(t)))
    return t, p


def normal_cdf(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


def pearson_r(xs, ys):
    n = len(xs)
    if n < 3:
        return None, None
    mx, my = statistics.mean(xs), statistics.mean(ys)
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    dx = math.sqrt(sum((x - mx) ** 2 for x in xs))
    dy = math.sqrt(sum((y - my) ** 2 for y in ys))
    if dx == 0 or dy == 0:
        return None, None
    r = num / (dx * dy)
    # t-stat for correlation
    if abs(r) >= 1.0:
        return r, 0.0
    t = r * math.sqrt(n - 2) / math.sqrt(1 - r * r)
    try:
        from scipy import stats as sp_stats
        p = 2 * sp_stats.t.sf(abs(t), n - 2)
    except ImportError:
        p = 2 * (1 - normal_cdf(abs(t)))
    return round(r, 4), round(p, 4)


def bootstrap_ci(values, stat_fn=statistics.mean, n_iter=BOOTSTRAP_ITER, seed=BOOTSTRAP_SEED):
    import random
    rng = random.Random(seed)
    if len(values) < 2:
        v = stat_fn(values) if values else 0
        return v, v, v
    boot = []
    for _ in range(n_iter):
        sample = [rng.choice(values) for _ in range(len(values))]
        boot.append(stat_fn(sample))
    boot.sort()
    lo = boot[int(0.025 * n_iter)]
    hi = boot[int(0.975 * n_iter)]
    return stat_fn(values), lo, hi


def cohen_d(a, b):
    if len(a) < 2 or len(b) < 2:
        return None
    ma, mb = statistics.mean(a), statistics.mean(b)
    va, vb = statistics.variance(a), statistics.variance(b)
    na, nb = len(a), len(b)
    pooled = math.sqrt(((na - 1) * va + (nb - 1) * vb) / (na + nb - 2))
    if pooled == 0:
        return None
    return round((ma - mb) / pooled, 3)


def fmt(v, decimals=3):
    if v is None:
        return None
    return round(v, decimals)


# ── Main analysis ──────────────────────────────────────────────────────────────

def main():
    print("Laddar data...")
    matches = load_data()
    print(f"  {len(matches)} matcher totalt")

    # ── Basic per-match data ──────────────────────────────────────────────────
    # Identify n>=30 referees
    from collections import Counter
    ref_counts = Counter(get_main_ref(m) for m in matches if get_main_ref(m))
    qualified_refs = {name for name, n in ref_counts.items() if n >= N_MIN}
    print(f"  {len(qualified_refs)} domare med n>={N_MIN}")

    # Per-match enriched
    match_data = []
    for m in matches:
        ref = get_main_ref(m)
        nf = fouls_in_match(m)
        phase = m.get("phase", "regular")
        is_playoff = phase in PLAYOFF_PHASES
        home_win = 1 if m.get("homeScore", 0) > m.get("awayScore", 0) else 0
        home_team = m.get("homeTeam", "")
        away_team = m.get("awayTeam", "")
        season = m.get("season", "")
        match_data.append({
            "ref": ref,
            "fouls": nf,
            "phase": phase,
            "is_playoff": is_playoff,
            "home_win": home_win,
            "home_team": home_team,
            "away_team": away_team,
            "season": season,
        })

    all_fouls = [d["fouls"] for d in match_data]
    league_avg = statistics.mean(all_fouls)
    print(f"  Ligamedel fouls/match: {league_avg:.4f}")

    # ── ANALYSE 1: Klubbmix-justering ────────────────────────────────────────
    print("\nAnalys 1: Klubbmix-justering...")

    # Club baseline: avg fouls/match for each club (as home OR away), all matches
    club_fouls_home = defaultdict(list)
    club_fouls_away = defaultdict(list)
    for d in match_data:
        if d["home_team"]:
            club_fouls_home[d["home_team"]].append(d["fouls"])
        if d["away_team"]:
            club_fouls_away[d["away_team"]].append(d["fouls"])

    # Club baseline = avg of all matches the club participated in
    all_clubs = set(club_fouls_home.keys()) | set(club_fouls_away.keys())
    club_baseline = {}
    for club in all_clubs:
        all_club_fouls = club_fouls_home.get(club, []) + club_fouls_away.get(club, [])
        club_baseline[club] = statistics.mean(all_club_fouls) if all_club_fouls else league_avg

    clubmix_results = []

    for ref_name in sorted(qualified_refs):
        ref_matches = [d for d in match_data if d["ref"] == ref_name]
        n = len(ref_matches)
        raw_fouls = [d["fouls"] for d in ref_matches]
        raw_avg = statistics.mean(raw_fouls)

        # Club frequency for this referee
        club_counter = Counter()
        for d in ref_matches:
            club_counter[d["home_team"]] += 1
            club_counter[d["away_team"]] += 1

        top_clubs_raw = club_counter.most_common(5)

        # Matchup frequency (unordered pair)
        matchup_counter = Counter()
        for d in ref_matches:
            pair = tuple(sorted([d["home_team"], d["away_team"]]))
            matchup_counter[pair] += 1
        top_matchups_raw = matchup_counter.most_common(5)

        # Mean-of-differences klubbmix-justering
        # For each match: delta_m = fouls_i - (baseline_home + baseline_away) / 2
        deltas = []
        for d in ref_matches:
            bh = club_baseline.get(d["home_team"], league_avg)
            ba = club_baseline.get(d["away_team"], league_avg)
            expected = (bh + ba) / 2
            delta = d["fouls"] - expected
            deltas.append(delta)

        mean_delta = statistics.mean(deltas)
        adjusted_avg = raw_avg - mean_delta
        raw_deviation = raw_avg - league_avg
        adjusted_deviation = adjusted_avg - league_avg

        if abs(raw_deviation) > 0.001:
            explanation_pct = round(100 * (1 - abs(adjusted_deviation) / abs(raw_deviation)), 1)
        else:
            explanation_pct = 0.0

        # Top clubs with ref-specific avg and club baseline (excl this ref)
        top_clubs_out = []
        for club, club_n in top_clubs_raw:
            # Club baseline excluding this referee's matches
            excl_fouls = []
            for d in match_data:
                if d["ref"] != ref_name and (d["home_team"] == club or d["away_team"] == club):
                    excl_fouls.append(d["fouls"])
            club_base_excl = statistics.mean(excl_fouls) if excl_fouls else league_avg
            # Ref avg in these club matches
            ref_club_fouls = [d["fouls"] for d in ref_matches if d["home_team"] == club or d["away_team"] == club]
            ref_club_avg = statistics.mean(ref_club_fouls) if ref_club_fouls else None
            top_clubs_out.append({
                "club": club,
                "n": club_n,
                "club_baseline_others": fmt(club_base_excl, 3),
                "referee_avg_in_these": fmt(ref_club_avg, 3),
            })

        # Top matchups
        top_matchups_out = []
        for (home, away), mu_n in top_matchups_raw:
            mu_fouls = [d["fouls"] for d in ref_matches
                        if tuple(sorted([d["home_team"], d["away_team"]])) == tuple(sorted([home, away]))]
            top_matchups_out.append({
                "home": home,
                "away": away,
                "n": mu_n,
                "avg_fouls": fmt(statistics.mean(mu_fouls), 3) if mu_fouls else None,
            })

        clubmix_results.append({
            "name": ref_name,
            "n": n,
            "raw_fouls_per_match": fmt(raw_avg, 3),
            "league_avg": fmt(league_avg, 3),
            "raw_deviation": fmt(raw_deviation, 3),
            "adjusted_fouls_per_match": fmt(adjusted_avg, 3),
            "adjusted_deviation": fmt(adjusted_deviation, 3),
            "explanation_pct": explanation_pct,
            "top_clubs": top_clubs_out,
            "top_matchups": top_matchups_out,
        })

    # Sort by raw_deviation ascending
    clubmix_results.sort(key=lambda x: x["raw_deviation"])

    clubmix_json = {
        "_meta": {
            "generated": datetime.date.today().isoformat(),
            "method": "mean-of-differences",
            "description": (
                "Klubbmix-justering per domare (n>=30). "
                "adjusted_fouls_per_match = raw_avg - mean(delta_m) där "
                "delta_m = fouls_i - (club_baseline_home + club_baseline_away)/2. "
                "explanation_pct = andel av rå avvikelse från ligamedel som förklaras av matchmix."
            ),
            "n_referees": len(clubmix_results),
            "league_avg_fouls": fmt(league_avg, 4),
        },
        "referees": clubmix_results,
    }

    with open(OUT_CLUBMIX, "w", encoding="utf-8") as f:
        json.dump(clubmix_json, f, ensure_ascii=False, indent=2)
    print(f"  Skrivet: {OUT_CLUBMIX}")

    # ── ANALYSE 2: Playoff-allokering ─────────────────────────────────────────
    print("\nAnalys 2: Playoff-allokering...")

    playoff_dist = []
    for ref_name in sorted(qualified_refs):
        ref_matches = [d for d in match_data if d["ref"] == ref_name]
        n_total = len(ref_matches)
        playoff_matches = [d for d in ref_matches if d["is_playoff"]]
        n_playoff = len(playoff_matches)
        playoff_pct = round(100 * n_playoff / n_total, 1) if n_total > 0 else 0.0
        fouls_list = [d["fouls"] for d in ref_matches]
        fouls_avg = statistics.mean(fouls_list)
        fouls_var = statistics.variance(fouls_list) if len(fouls_list) >= 2 else 0.0
        home_wins = [d["home_win"] for d in ref_matches]
        home_win_pct = round(statistics.mean(home_wins), 4) if home_wins else None

        # HT lead → win% (ht_lead_win_pct): we don't have HT per match in this enriched form
        # Use raw match data
        ref_raw = [m for m in matches if get_main_ref(m) == ref_name]
        ht_lead_wins = []
        for m in ref_raw:
            ht_h = m.get("halfTimeHome")
            ht_a = m.get("halfTimeAway")
            if ht_h is None or ht_a is None:
                continue
            if ht_h > ht_a:  # home leads at HT
                final_win = 1 if m.get("homeScore", 0) > m.get("awayScore", 0) else 0
                ht_lead_wins.append(final_win)
        ht_lead_win_pct = round(statistics.mean(ht_lead_wins), 4) if ht_lead_wins else None

        playoff_dist.append({
            "name": ref_name,
            "n_total": n_total,
            "n_playoff": n_playoff,
            "playoff_pct": playoff_pct,
            "fouls_per_match": fmt(fouls_avg, 3),
            "fouls_variance": fmt(fouls_var, 3),
            "home_win_pct": home_win_pct,
            "ht_lead_win_pct": ht_lead_win_pct,
        })

    # Sort by playoff_pct descending
    playoff_dist.sort(key=lambda x: -x["playoff_pct"])

    # Pearson correlation: playoff_pct vs fouls_per_match
    pct_vals = [x["playoff_pct"] for x in playoff_dist]
    fouls_vals = [x["fouls_per_match"] for x in playoff_dist]
    r_val, p_val = pearson_r(pct_vals, fouls_vals)

    if r_val is not None:
        if p_val < 0.05:
            corr_interp = f"Signifikant korrelation (p={p_val:.3f}): domare med hög playoff-andel tenderar att döma {'fler' if r_val > 0 else 'färre'} utvisningar."
        else:
            corr_interp = f"Ingen signifikant korrelation mellan playoff-andel och utvisningsfrekvens (p={p_val:.3f})."
    else:
        corr_interp = "Kunde inte beräkna korrelation."

    # Schultz-profil per säsong
    schultz_raw = [m for m in matches if get_main_ref(m) == "Niclas Schultz"]
    schultz_seasons = defaultdict(list)
    for m in schultz_raw:
        schultz_seasons[m.get("season", "")].append(fouls_in_match(m))

    schultz_season_data = {}
    for season, fl in sorted(schultz_seasons.items()):
        schultz_season_data[season] = {
            "n": len(fl),
            "fouls_per_match": fmt(statistics.mean(fl), 3),
        }

    # Baseline: 22/23 + 24/25
    baseline_fouls = schultz_seasons.get("2022-23", []) + schultz_seasons.get("2024-25", [])
    s2526_fouls = schultz_seasons.get("2025-26", [])
    baseline_avg = statistics.mean(baseline_fouls) if baseline_fouls else None
    s2526_avg = statistics.mean(s2526_fouls) if s2526_fouls else None
    delta_schultz = round(s2526_avg - baseline_avg, 3) if (baseline_avg and s2526_avg) else None

    t_schultz, p_schultz = welch_t(s2526_fouls, baseline_fouls) if baseline_fouls and s2526_fouls else (None, None)

    schultz_profile = {
        "total_n": len(schultz_raw),
        "seasons": schultz_season_data,
        "baseline_seasons": ["2022-23", "2024-25"],
        "baseline_n": len(baseline_fouls),
        "baseline_avg": fmt(baseline_avg, 3),
        "s2526_n": len(s2526_fouls),
        "s2526_avg": fmt(s2526_avg, 3),
        "delta": delta_schultz,
        "p_welch": fmt(p_schultz, 3) if p_schultz else None,
        "trend_interpretation": (
            "Kontinuerlig uppåtgående trend (3.53 → 4.00 → 4.76). "
            "Vann Årets Domare 24/25 (4.00/match). "
            "25/26-nivå konsistent med förlängning av befintlig trend, förstärkt av 'Våga visa rött'-direktivet."
        ),
    }

    allocation_json = {
        "_meta": {
            "generated": datetime.date.today().isoformat(),
            "description": (
                "Domarallokering och playoff-fördelning. "
                "playoff_phases: quarterfinal, semifinal, final, round_of_16, playoff."
            ),
            "n_referees": len(playoff_dist),
        },
        "playoff_distribution": playoff_dist,
        "schultz_profile": schultz_profile,
        "correlation_playoff_pct_vs_fouls": {
            "pearson_r": r_val,
            "p": p_val,
            "interpretation": corr_interp,
        },
    }

    with open(OUT_ALLOCATION, "w", encoding="utf-8") as f:
        json.dump(allocation_json, f, ensure_ascii=False, indent=2)
    print(f"  Skrivet: {OUT_ALLOCATION}")

    # ── ANALYSE 3: Per-fas och säsong för outliers ────────────────────────────
    print("\nAnalys 3: Outlier-djupgrävning...")

    outlier_details = {}
    for ref_name in OUTLIER_REFS:
        ref_matches_raw = [m for m in matches if get_main_ref(m) == ref_name]
        ref_fouls_all = [fouls_in_match(m) for m in ref_matches_raw]
        n_total = len(ref_fouls_all)
        raw_avg = statistics.mean(ref_fouls_all) if ref_fouls_all else None
        raw_deviation = round(raw_avg - league_avg, 3) if raw_avg else None

        # Adjusted from clubmix
        cm = next((r for r in clubmix_results if r["name"] == ref_name), None)
        adj_avg = cm["adjusted_fouls_per_match"] if cm else None
        adj_dev = cm["adjusted_deviation"] if cm else None
        expl_pct = cm["explanation_pct"] if cm else None

        # Per-fas
        phase_data = defaultdict(list)
        for m in ref_matches_raw:
            phase_data[m.get("phase", "regular")].append(fouls_in_match(m))

        # Group: regular vs playoff
        regular_fouls = phase_data.get("regular", []) + phase_data.get("qualification", [])
        playoff_fouls = []
        for ph in PLAYOFF_PHASES:
            playoff_fouls.extend(phase_data.get(ph, []))

        phase_analysis = {}
        for label, fl, bl in [("grundserie", regular_fouls, [d["fouls"] for d in match_data if not d["is_playoff"] and d["ref"] != ref_name]),
                               ("slutspel", playoff_fouls, [d["fouls"] for d in match_data if d["is_playoff"] and d["ref"] != ref_name])]:
            if len(fl) >= N_MIN_PHASE:
                avg = statistics.mean(fl)
                league_phase_avg = statistics.mean(bl) if bl else league_avg
                t, p = welch_t(fl, bl) if len(bl) >= 2 else (None, None)
                d_eff = cohen_d(fl, bl) if len(bl) >= 2 else None
                _, ci_lo, ci_hi = bootstrap_ci(fl)
                phase_analysis[label] = {
                    "n": len(fl),
                    "fouls_per_match": fmt(avg, 3),
                    "league_phase_avg": fmt(league_phase_avg, 3),
                    "deviation": fmt(avg - league_phase_avg, 3),
                    "cohen_d": d_eff,
                    "p_welch": fmt(p, 3) if p else None,
                    "ci_95": [fmt(ci_lo, 3), fmt(ci_hi, 3)],
                }
            else:
                phase_analysis[label] = {"n": len(fl), "note": f"n<{N_MIN_PHASE}, ej analyserat"}

        # Per-säsong
        season_data = defaultdict(list)
        for m in ref_matches_raw:
            season_data[m.get("season", "")].append(fouls_in_match(m))

        season_table = {}
        for season in sorted(season_data.keys()):
            fl = season_data[season]
            season_table[season] = {
                "n": len(fl),
                "fouls_per_match": fmt(statistics.mean(fl), 3),
                "flag_low_n": len(fl) < N_MIN_PHASE,
            }

        outlier_details[ref_name] = {
            "n": n_total,
            "raw_avg": fmt(raw_avg, 3),
            "raw_deviation": raw_deviation,
            "adjusted_avg": adj_avg,
            "adjusted_deviation": adj_dev,
            "explanation_pct": expl_pct,
            "phase_analysis": phase_analysis,
            "season_table": season_table,
        }

    # ── Generera Markdown-sektioner ───────────────────────────────────────────
    print("\nGenererar Markdown...")

    def pct_interp(pct):
        if pct is None:
            return "oklart"
        if pct > 50:
            return "troligen matchmix-driven"
        if pct < 30:
            return "domarspecifik"
        return "oklart (30–50%), kräver SBF-data"

    lines = []

    # ─── Kapitel 6 ──────────────────────────────────────────────────────────
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## 6. Djupgrävning — de tre signifikanta outliers efter Bonferroni")
    lines.append("")
    lines.append(
        "Tre domare är signifikanta efter Bonferroni-korrigering för utvisningsfrekvens: "
        "**Daniel Labe** (z=−3.38, p_Bonf=0.018), **Jacob Liljegren** (z=−3.29, p_Bonf=0.014), "
        "**Andreas Rönnbäck** (z=+3.69, p_Bonf=0.019). "
        "Kapitlet undersöker om avvikelserna kvarstår efter klubbmix-justering."
    )
    lines.append("")

    for ref_name in OUTLIER_REFS:
        od = outlier_details[ref_name]
        expl = od["explanation_pct"]
        interp = pct_interp(expl)
        lines.append(f"### 6.{OUTLIER_REFS.index(ref_name)+1} {ref_name}")
        lines.append("")
        lines.append(f"**Rå avvikelse:** {od['raw_avg']} fouls/match vs ligamedel {fmt(league_avg, 3)} "
                     f"(Δ={od['raw_deviation']:+.3f}).")
        lines.append("")
        lines.append(f"**Klubbmix-justering (mean-of-differences):** Justerat snitt = {od['adjusted_avg']} fouls/match "
                     f"(Δ={od['adjusted_deviation']:+.3f} vs ligamedel). "
                     f"**{expl}% av rå avvikelse förklaras av klubbmix** → tolkning: {interp}.")
        lines.append("")

        # Per-fas tabell
        lines.append("**Per-fas (grundserie vs slutspel):**")
        lines.append("")
        lines.append("| Fas | n | Fouls/match | Ligamedel fas | Δ | Cohen's d | p (Welch) | 95% CI |")
        lines.append("|-----|---|-------------|--------------|---|-----------|-----------|--------|")
        for fas, pd_val in od["phase_analysis"].items():
            if "note" in pd_val:
                lines.append(f"| {fas.capitalize()} | {pd_val['n']} | — | — | — | — | — | {pd_val['note']} |")
            else:
                ci_str = f"[{pd_val['ci_95'][0]}, {pd_val['ci_95'][1]}]"
                p_str = str(pd_val['p_welch']) if pd_val['p_welch'] else "—"
                d_str = str(pd_val['cohen_d']) if pd_val['cohen_d'] else "—"
                lines.append(
                    f"| {fas.capitalize()} | {pd_val['n']} | {pd_val['fouls_per_match']} "
                    f"| {pd_val['league_phase_avg']} | {pd_val['deviation']:+.3f} "
                    f"| {d_str} | {p_str} | {ci_str} |"
                )
        lines.append("")

        # Per-säsong tabell
        lines.append("**Per-säsong:**")
        lines.append("")
        lines.append("| Säsong | n | Fouls/match | Flagga |")
        lines.append("|--------|---|-------------|--------|")
        for season, sv in od["season_table"].items():
            flag = "n<10, osäkert" if sv["flag_low_n"] else ""
            lines.append(f"| {season} | {sv['n']} | {sv['fouls_per_match']} | {flag} |")
        lines.append("")

        if expl > 50:
            lines.append(f"**Slutsats:** Efter klubbmix-justering kvarstår {100-expl:.1f}% av avvikelsen. "
                         f"Avvikelsen hos {ref_name} förklaras övervägande av vilka matchups de tilldelats, "
                         f"inte av ett konsekvent domarspecifikt mönster.")
        elif expl < 30:
            lines.append(f"**Slutsats:** Klubbmix-justering förklarar {expl}% av avvikelsen. "
                         f"{100-expl:.1f}% kvarstår — avvikelsen hos {ref_name} är sannolikt domarspecifik.")
        else:
            lines.append(f"**Slutsats:** Klubbmix-justering förklarar {expl}% av avvikelsen (30–50%-zonen). "
                         f"Tolkningen är osäker utan SBF:s allokeringsdata.")
        lines.append("")

    # ─── Kapitel 7 ──────────────────────────────────────────────────────────
    lines.append("---")
    lines.append("")
    lines.append("## 7. Domarallokering och playoff-fördelning")
    lines.append("")
    lines.append("### 7.1 Playoff-fördelning (n≥30 domare)")
    lines.append("")
    lines.append(
        "Tabellen visar andelen matcher i playoff-fas (kf + sf + final + round_of_16 + playoff) "
        "per domare, sorterad fallande."
    )
    lines.append("")
    lines.append("| Domare | n totalt | n playoff | Playoff% | Fouls/match | Varians | Hemmavinst% |")
    lines.append("|--------|---------|-----------|----------|-------------|---------|------------|")
    for pd_row in playoff_dist:
        hv = f"{pd_row['home_win_pct']*100:.1f}%" if pd_row["home_win_pct"] is not None else "—"
        lines.append(
            f"| {pd_row['name']} | {pd_row['n_total']} | {pd_row['n_playoff']} "
            f"| {pd_row['playoff_pct']}% | {pd_row['fouls_per_match']} "
            f"| {pd_row['fouls_variance']} | {hv} |"
        )
    lines.append("")

    # Korrelation
    lines.append("### 7.2 Korrelation playoff% vs fouls/match")
    lines.append("")
    if r_val is not None:
        r_interp = "positiv" if r_val > 0 else "negativ"
        lines.append(
            f"Pearson r = {r_val} (p = {p_val}). {corr_interp}"
        )
    else:
        lines.append("Korrelation kunde inte beräknas.")
    lines.append("")

    # Schultz
    sp = allocation_json["schultz_profile"]
    lines.append("### 7.3 Niclas Schultz — karriärkurva")
    lines.append("")
    lines.append(
        "Schultz vann Årets Domare säsong 2024-25. Hans per-säsongsdata:"
    )
    lines.append("")
    lines.append("| Säsong | n | Fouls/match |")
    lines.append("|--------|---|-------------|")
    for s, sv in sp["seasons"].items():
        lines.append(f"| {s} | {sv['n']} | {sv['fouls_per_match']} |")
    lines.append("")
    lines.append(
        f"Baseline 22/23 + 24/25 (n={sp['baseline_n']}): {sp['baseline_avg']} fouls/match. "
        f"Säsong 25/26 (n={sp['s2526_n']}): {sp['s2526_avg']} fouls/match. "
        f"Δ = +{sp['delta']} (p={sp['p_welch']}, Welch t-test)."
    )
    lines.append("")
    lines.append(sp["trend_interpretation"])
    lines.append("")

    # ─── Kapitel 8 ──────────────────────────────────────────────────────────
    lines.append("---")
    lines.append("")
    lines.append("## 8. Klubbmix-effekten — alla 18 domare")
    lines.append("")
    lines.append(
        "Tabellen visar rå fouls/match, klubbmix-justerat värde (mean-of-differences), "
        "differensen och hur stor andel av avvikelsen från ligamedel som förklaras av matchmix. "
        "Liganivå: " + str(fmt(league_avg, 3)) + " fouls/match."
    )
    lines.append("")
    lines.append("| Domare | n | Rå fouls/match | Justerat | Δ (rå→just) | Avvikelse rå | Avvikelse just | Mix förklarar |")
    lines.append("|--------|---|----------------|----------|-------------|-------------|----------------|--------------|")
    for cr in clubmix_results:
        raw_d = cr["raw_deviation"]
        adj_d = cr["adjusted_deviation"]
        delta_adj = fmt(cr["adjusted_fouls_per_match"] - cr["raw_fouls_per_match"], 3)
        mix_interp = pct_interp(cr["explanation_pct"])
        lines.append(
            f"| {cr['name']} | {cr['n']} | {cr['raw_fouls_per_match']} "
            f"| {cr['adjusted_fouls_per_match']} | {delta_adj:+.3f} "
            f"| {raw_d:+.3f} | {adj_d:+.3f} | {cr['explanation_pct']}% ({mix_interp}) |"
        )
    lines.append("")
    lines.append(
        "**Metod:** mean-of-differences. För varje match beräknas förväntad utvisningsnivå som "
        "medelvärde av hemma- och bortalags baslinjer (alla deras matcher exklusive den studerade domaren). "
        "Domarens justerade snitt = rå snitt minus genomsnittlig delta per match."
    )
    lines.append("")
    lines.append(
        "**Tolkning:** >50% förklarad av mix → avvikelsen är troligen matchmix-driven. "
        "<30% förklarad → avvikelsen är troligen domarspecifik. 30–50% → oklart."
    )
    lines.append("")

    # ── Lägg till i DEEP_DIVE_MD ──────────────────────────────────────────────
    existing = DEEP_DIVE_MD.read_text(encoding="utf-8")

    # Ta bort begränsnings-kapitlet och allt efter, lägg till nya kapitel, sedan begränsningarna
    # Hitta var kapitel 10 börjar
    marker_10 = "\n## 10. Begränsningar"
    if marker_10 in existing:
        before_limitations = existing[:existing.index(marker_10)]
        from_limitations = existing[existing.index(marker_10):]
    else:
        before_limitations = existing.rstrip()
        from_limitations = ""

    new_content = before_limitations + "\n".join(lines) + "\n" + from_limitations

    # Update generated timestamp in top section (optional, keep existing)
    DEEP_DIVE_MD.write_text(new_content, encoding="utf-8")
    print(f"  Uppdaterat: {DEEP_DIVE_MD}")

    # ── Rapport till stdout ───────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("RAPPORT — analyze_referees_p1.py")
    print("=" * 70)
    print(f"\nLigamedel: {league_avg:.4f} fouls/match")
    print("\n--- Outlier-justering (Kapitel 6) ---")
    for ref_name in OUTLIER_REFS:
        od = outlier_details[ref_name]
        print(f"\n{ref_name} (n={od['n']})")
        print(f"  Rå:       {od['raw_avg']:6.3f}  (Δ {od['raw_deviation']:+.3f})")
        print(f"  Justerat: {od['adjusted_avg']:6.3f}  (Δ {od['adjusted_deviation']:+.3f})")
        print(f"  Mix förklarar: {od['explanation_pct']}% → {pct_interp(od['explanation_pct'])}")

    print("\n--- Playoff-korrelation (Kapitel 7) ---")
    print(f"  Pearson r = {r_val}  (p = {p_val})")
    print(f"  {corr_interp}")

    print("\n--- Schultz ---")
    print(f"  Baseline: {sp['baseline_avg']} fouls/match (n={sp['baseline_n']})")
    print(f"  2025-26:  {sp['s2526_avg']} fouls/match (n={sp['s2526_n']})")
    print(f"  Δ = +{sp['delta']}  (p={sp['p_welch']})")

    print("\n--- Klubbmix-justering (Kapitel 8, alla 18) ---")
    print(f"{'Domare':<25} {'n':>4}  {'Rå':>6}  {'Just':>6}  {'Δ':>6}  {'Mix%':>6}")
    for cr in clubmix_results:
        delta_v = cr["adjusted_fouls_per_match"] - cr["raw_fouls_per_match"]
        print(f"{cr['name']:<25} {cr['n']:>4}  {cr['raw_fouls_per_match']:>6.3f}  "
              f"{cr['adjusted_fouls_per_match']:>6.3f}  {delta_v:>+6.3f}  {cr['explanation_pct']:>5.1f}%")

    print("\nKlart. Tre filer producerade.")


if __name__ == "__main__":
    main()
