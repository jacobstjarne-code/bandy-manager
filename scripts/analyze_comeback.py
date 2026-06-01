"""
analyze_comeback.py

Comeback-mekanikens djupanalys — 7 dimensioner.

MINUTKONVENTION — VIKTIGT (verifierat 2026-06-01):
  Bandygrytan loggar halvtid som event typ 13. Event 13 inträffar vid
  median minut 46 i rådata (range 45–53). Event 14 (2H-start) är konstant
  vid minut 45 — en fast markör, inte verklig tidsstämpel.

  Konsekvens: regeln `minute >= 46 ⇒ 2H` är felaktig för ~24% av matcher.
  Events i minut 46–50 som förekommer FÖRE event 13 är tilläggstid 1H.

  Bucketen 46–50 i denna analys är kontaminerad med ~24% 1H-tilläggstid.
  Bucketen 51–55 är kontaminerad med ~5.5% och bedöms som tillförlitlig.

  Finding 041:s "minut 96–100" = rådata 51–55 (46+45=91... konventionen
  lägger till 45 för att skapa ett "120-minuters matchur"). Fönster 51–55
  i denna analys motsvararett fenomenet i finding 041.

  Se docs/data/INTERNAL_MINUTE_CONVENTION.md för fullständig verifiering.

Output:
  docs/data/comeback_mechanics.json
"""

import json
import math
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

# Lägg till scripts/pipeline i sökvägen
sys.path.insert(0, str(Path(__file__).parent / "pipeline"))
from analysis_helpers import wilson_ci, bootstrap_ci, binom_p, cohens_h, bonferroni_p

DATA_PATH = Path(__file__).parent.parent / "docs" / "data" / "bandygrytan_detailed.json"
OUT_PATH  = Path(__file__).parent.parent / "docs" / "data" / "comeback_mechanics.json"

# ── Minut-bucket-definitioner (rådata) ───────────────────────────────────────
BUCKETS = ["46-50", "51-55", "56-60", "61-65", "66-70", "71-75", "76-90", "no_reduction"]

def minute_bucket(minute: int) -> str:
    if   46 <= minute <= 50: return "46-50"
    elif 51 <= minute <= 55: return "51-55"
    elif 56 <= minute <= 60: return "56-60"
    elif 61 <= minute <= 65: return "61-65"
    elif 66 <= minute <= 70: return "66-70"
    elif 71 <= minute <= 75: return "71-75"
    elif minute >= 76:       return "76-90"
    else:                    return "other"

# ── Läs data ─────────────────────────────────────────────────────────────────
with open(DATA_PATH) as f:
    raw = json.load(f)

herr_raw = raw["herr"]["matches"]
dam_raw  = raw["dam"]["matches"]

print(f"Läst: {len(herr_raw)} herr + {len(dam_raw)} dam = {len(herr_raw)+len(dam_raw)} totalt")

# ── Bygg per-match-tabell ────────────────────────────────────────────────────

def build_records(matches: list, series: str) -> list:
    records = []
    for m in matches:
        ht_home = m.get("halfTimeHome")
        ht_away = m.get("halfTimeAway")

        # Behöver halvtidsdata och ej oavgjort vid HT
        if ht_home is None or ht_away is None:
            continue
        if ht_home == ht_away:
            continue

        hs = m.get("homeScore", 0) or 0
        as_ = m.get("awayScore", 0) or 0
        goals = m.get("goals") or []
        fouls  = m.get("fouls") or []

        ht_lead = ht_home - ht_away   # positiv = hemmalaget leder
        trailing_team = "away" if ht_lead > 0 else "home"
        leading_team  = "home" if ht_lead > 0 else "away"

        # Comeback: jagande laget vann matchen
        if trailing_team == "away":
            comeback = as_ > hs
        else:
            comeback = hs > as_

        # Mål av jagande laget i 2a halvlek — använd half-flagga om tillgänglig
        # (schemaVersion 4+), annars fallback till minute >= 46
        def is_h2(g):
            if "half" in g:
                return g["half"] == 2
            return g.get("minute", 0) >= 46

        comeback_goals_raw = [
            g for g in goals if is_h2(g) and g.get("team") == trailing_team
        ]
        # Mål av ledande laget i 2a halvlek
        conceded_goals_raw = [
            g for g in goals if is_h2(g) and g.get("team") == leading_team
        ]

        # Första reducerande mål (första mål av jagande laget i 2H)
        first_red = None
        if comeback_goals_raw:
            first_red = min(comeback_goals_raw, key=lambda g: g["minute"])

        first_red_minute = first_red["minute"] if first_red else None
        first_red_bucket = minute_bucket(first_red_minute) if first_red_minute is not None else "no_reduction"
        first_red_type   = first_red.get("type") if first_red else None

        records.append({
            "matchId":             m["matchId"],
            "season":              m.get("season", ""),
            "phase":               m.get("phase", "regular"),
            "series":              series,
            "homeTeam":            m.get("homeTeam", ""),
            "awayTeam":            m.get("awayTeam", ""),
            "ht_lead":             ht_lead,
            "ht_lead_magnitude":   abs(ht_lead),
            "trailing_team":       trailing_team,
            "leading_team":        leading_team,
            "comeback":            comeback,
            "first_red_minute":    first_red_minute,
            "first_red_bucket":    first_red_bucket,
            "first_red_type":      first_red_type,
            "comeback_goals":      comeback_goals_raw,
            "conceded_goals_leading": conceded_goals_raw,
            "fouls":               fouls,
        })
    return records

herr_records = build_records(herr_raw, "herr")
dam_records  = build_records(dam_raw, "dam")
all_records  = herr_records + dam_records

print(f"Giltiga HT-underlägen (ej oavgjort HT): {len(herr_records)} herr, {len(dam_records)} dam, {len(all_records)} totalt")

# ── Baseline ─────────────────────────────────────────────────────────────────

def compute_baseline(records: list, label: str) -> dict:
    n = len(records)
    c = sum(1 for r in records if r["comeback"])
    rate = c / n if n > 0 else 0.0
    ci = wilson_ci(rate, n)
    print(f"  Baseline ({label}): {c}/{n} = {rate:.4f} [{ci[0]:.4f}, {ci[1]:.4f}]")
    return {"n": n, "comebacks": c, "rate": round(rate, 6), "ci_low": round(ci[0], 6), "ci_high": round(ci[1], 6)}

print("\nBaseline:")
baseline_herr = compute_baseline(herr_records, "herr")
baseline_dam  = compute_baseline(dam_records, "dam")
baseline_all  = compute_baseline(all_records, "herr+dam")

# ── Dimension 1: Per HT-margin ────────────────────────────────────────────────

print("\nDimension 1: Per HT-margin (herr)")
by_ht_margin = {}
for mag, label in [(1, "1"), (2, "2"), (None, "3plus")]:
    if mag is not None:
        subset = [r for r in herr_records if r["ht_lead_magnitude"] == mag]
    else:
        subset = [r for r in herr_records if r["ht_lead_magnitude"] >= 3]
    n = len(subset)
    c = sum(1 for r in subset if r["comeback"])
    rate = c / n if n > 0 else 0.0
    ci = wilson_ci(rate, n)
    p = binom_p(c, n, baseline_herr["rate"])
    print(f"  +{label}: {c}/{n} = {rate:.3f} [{ci[0]:.3f}, {ci[1]:.3f}] p={p:.4f}" if p else f"  +{label}: {c}/{n} = {rate:.3f}")
    by_ht_margin[label] = {
        "n": n, "comebacks": c, "rate": round(rate, 6),
        "ci_low": round(ci[0], 6), "ci_high": round(ci[1], 6),
        "binom_p_vs_baseline": round(p, 6) if p is not None else None,
    }

    # För +1: titta på 51-55-fönstret specifikt
    if mag == 1:
        window_51_55 = [r for r in subset if r["first_red_bucket"] == "51-55"]
        w_c = sum(1 for r in window_51_55 if r["comeback"])
        w_n = len(window_51_55)
        w_rate = w_c / w_n if w_n > 0 else 0.0
        print(f"    +1 fönster 51-55: {w_c}/{w_n} = {w_rate:.3f}")
        by_ht_margin["1_window_51_55"] = {"n": w_n, "comebacks": w_c, "rate": round(w_rate, 6)}

# ── Dimension 2: Utvisningsanalys i 51-55-fönstret ───────────────────────────

print("\nDimension 2: Utvisningar i 51-55-fönstret (alla herr-matcher med HT-underläge)")

fouls_in_window = []    # alla utvisningar min 51-55 i relevanta matcher
fouls_vs_leading = []   # utvisningar mot ledande laget i fönstret

all_fouls_h2 = []       # alla utvisningar i 2H (proxy för ligamedel)
leading_fouls_h2 = []   # utvisningar mot ledande i 2H

for r in herr_records:
    for f in r["fouls"]:
        m = f.get("minute", 0)
        team = f.get("team", "")
        if 46 <= m:
            all_fouls_h2.append(f)
            if team == r["leading_team"]:
                leading_fouls_h2.append(f)
        if 51 <= m <= 55:
            fouls_in_window.append(f)
            if team == r["leading_team"]:
                fouls_vs_leading.append(f)

total_window_fouls   = len(fouls_in_window)
leading_window_fouls = len(fouls_vs_leading)
window_leading_ratio = leading_window_fouls / total_window_fouls if total_window_fouls > 0 else 0.0

total_h2_fouls   = len(all_fouls_h2)
leading_h2_fouls = len(leading_fouls_h2)
h2_leading_ratio = leading_h2_fouls / total_h2_fouls if total_h2_fouls > 0 else 0.0

print(f"  Fönster 51-55: {total_window_fouls} utvisningar, {leading_window_fouls} mot ledande ({window_leading_ratio:.3f})")
print(f"  Hela 2H:       {total_h2_fouls} utvisningar, {leading_h2_fouls} mot ledande ({h2_leading_ratio:.3f})")

foul_analysis = {
    "window_51_55": {
        "total_fouls":   total_window_fouls,
        "fouls_vs_leading_team": leading_window_fouls,
        "leading_ratio": round(window_leading_ratio, 6),
    },
    "full_2h_baseline": {
        "total_fouls":   total_h2_fouls,
        "fouls_vs_leading_team": leading_h2_fouls,
        "leading_ratio": round(h2_leading_ratio, 6),
    },
    "ratio_vs_baseline": round(window_leading_ratio / h2_leading_ratio, 4) if h2_leading_ratio > 0 else None,
    "note": "Utvisning mot ledande lag = proxy för 'ledande laget straffas / spenderas'. Alla herr-matcher med klar HT-ledning.",
}

# ── Dimension 3: Måltyper i 51-55-fönstret vs resten av 2H ───────────────────

print("\nDimension 3: Måltyper i 51-55-fönstret")

def goal_type_dist(goals_list: list) -> dict:
    n = len(goals_list)
    if n == 0:
        return {"open": 0, "penalty": 0, "corner": 0, "n": 0}
    types = defaultdict(int)
    for g in goals_list:
        types[g.get("type", "open")] += 1
    return {
        "n": n,
        "open":    round(types["open"] / n, 4),
        "penalty": round(types["penalty"] / n, 4),
        "corner":  round(types["corner"] / n, 4),
        "n_open": types["open"],
        "n_penalty": types["penalty"],
        "n_corner": types["corner"],
    }

# Alla mål (jagande + ledande) i herr-matcher med klar HT-underläge
all_goals_51_55 = []
all_goals_56_90 = []
for r in herr_records:
    all_goals_in_match = r["comeback_goals"] + r["conceded_goals_leading"]
    for g in all_goals_in_match:
        m = g.get("minute", 0)
        if 51 <= m <= 55:
            all_goals_51_55.append(g)
        elif 56 <= m:
            all_goals_56_90.append(g)

gt_51_55 = goal_type_dist(all_goals_51_55)
gt_56_90 = goal_type_dist(all_goals_56_90)
print(f"  51-55: n={gt_51_55['n']}, open={gt_51_55['open']:.3f}, penalty={gt_51_55['penalty']:.3f}, corner={gt_51_55['corner']:.3f}")
print(f"  56-90: n={gt_56_90['n']}, open={gt_56_90['open']:.3f}, penalty={gt_56_90['penalty']:.3f}, corner={gt_56_90['corner']:.3f}")

goal_types_analysis = {
    "window_51_55": gt_51_55,
    "window_56_90": gt_56_90,
    "penalty_lift_abs": round(gt_51_55["penalty"] - gt_56_90["penalty"], 4),
    "corner_lift_abs":  round(gt_51_55["corner"] - gt_56_90["corner"], 4),
    "note": "Alla mål (jagande + ledande lag) i herr-matcher med klar HT-underläge.",
}

# ── Dimension 4: Power-play-proxy ────────────────────────────────────────────

print("\nDimension 4: Power-play-proxy (utvisning mot motståndare de senaste 10 min)")

def has_recent_foul_vs_leading(comeback_goal: dict, fouls: list, leading_team: str, window_minutes: int = 10) -> bool:
    """Returnerar True om det finns en utvisning mot ledande laget inom window_minutes före målet."""
    goal_min = comeback_goal.get("minute", 0)
    return any(
        f.get("team") == leading_team and goal_min - window_minutes <= f.get("minute", 0) < goal_min
        for f in fouls
    )

total_comeback_goals = 0
power_play_proxy_goals = 0

for r in herr_records:
    if not r["comeback"]:
        continue
    for g in r["comeback_goals"]:
        total_comeback_goals += 1
        if has_recent_foul_vs_leading(g, r["fouls"], r["leading_team"]):
            power_play_proxy_goals += 1

pp_rate = power_play_proxy_goals / total_comeback_goals if total_comeback_goals > 0 else 0.0
print(f"  Comeback-mål: {total_comeback_goals}, varav {power_play_proxy_goals} med utvisning mot motståndaren senaste 10 min = {pp_rate:.3f}")

power_play_proxy = {
    "total_comeback_goals": total_comeback_goals,
    "goals_with_recent_foul_vs_leading": power_play_proxy_goals,
    "proxy_rate": round(pp_rate, 6),
    "method": "Utvisning mot ledande laget inom 10 minuter före comeback-mål. Proxy — exakt pågående man-up okänt.",
    "limitation": "Vi vet inte om utvisningen fortfarande pågick vid målögonblicket. 10-minutersfönstret är konservativt.",
}

# ── Dimension 5: Klubbdistribution ───────────────────────────────────────────

print("\nDimension 5: Klubbdistribution (herr, jagande lag)")

club_stats = defaultdict(lambda: {"n": 0, "comebacks": 0})

for r in herr_records:
    # Jagande lag = trailing_team
    team = r["homeTeam"] if r["trailing_team"] == "home" else r["awayTeam"]
    club_stats[team]["n"] += 1
    if r["comeback"]:
        club_stats[team]["comebacks"] += 1

total_comebacks_herr = baseline_herr["comebacks"]

club_distribution = []
for team, s in sorted(club_stats.items(), key=lambda x: -x[1]["comebacks"]):
    n = s["n"]
    c = s["comebacks"]
    rate = c / n if n > 0 else 0.0
    ci = wilson_ci(rate, n)
    share_of_total = c / total_comebacks_herr if total_comebacks_herr > 0 else 0.0
    club_distribution.append({
        "team": team,
        "n_trailing": n,
        "comebacks": c,
        "comeback_rate": round(rate, 4),
        "ci_low": round(ci[0], 4),
        "ci_high": round(ci[1], 4),
        "share_of_total_comebacks": round(share_of_total, 4),
    })

# Flagga om enskild klubb driver >20%
top_club = club_distribution[0] if club_distribution else None
if top_club and top_club["share_of_total_comebacks"] > 0.20:
    print(f"  VARNING: {top_club['team']} svarar för {top_club['share_of_total_comebacks']:.1%} av alla comebacks — fenomenet kan vara klubb-drivet")
else:
    print(f"  Top-klubb: {top_club['team']} = {top_club['share_of_total_comebacks']:.1%} av alla comebacks")

print("  Top 5:")
for c in club_distribution[:5]:
    print(f"    {c['team']}: {c['comebacks']}/{c['n_trailing']} = {c['comeback_rate']:.3f} [{c['ci_low']:.3f}, {c['ci_high']:.3f}] (andel av totalt: {c['share_of_total_comebacks']:.1%})")

# ── Dimension 6: Fas-fördelning ───────────────────────────────────────────────

print("\nDimension 6: Fas-fördelning (herr)")

PHASE_GROUPS = {
    "regular":    ["regular"],
    "playoff":    ["quarterfinal", "semifinal", "final", "playoff"],
    "other":      ["qualification", "round_of_16"],
}

by_phase = {}
for group_label, phases in PHASE_GROUPS.items():
    subset = [r for r in herr_records if r["phase"] in phases]
    n = len(subset)
    c = sum(1 for r in subset if r["comeback"])
    rate = c / n if n > 0 else 0.0
    ci = wilson_ci(rate, n)
    p = binom_p(c, n, baseline_herr["rate"])
    by_phase[group_label] = {
        "phases": phases, "n": n, "comebacks": c,
        "rate": round(rate, 6),
        "ci_low": round(ci[0], 6), "ci_high": round(ci[1], 6),
        "binom_p_vs_baseline": round(p, 6) if p is not None else None,
    }
    print(f"  {group_label}: {c}/{n} = {rate:.3f} [{ci[0]:.3f}, {ci[1]:.3f}] p={p:.4f}" if p else f"  {group_label}: {c}/{n} = {rate:.3f}")

# ── Dimension 7: Säsongsstabilitet ───────────────────────────────────────────

print("\nDimension 7: Säsongsstabilitet (herr)")

seasons = sorted(set(r["season"] for r in herr_records))
by_season = {}
for season in seasons:
    subset = [r for r in herr_records if r["season"] == season]
    n = len(subset)
    c = sum(1 for r in subset if r["comeback"])
    rate = c / n if n > 0 else 0.0
    ci = wilson_ci(rate, n)
    by_season[season] = {
        "n": n, "comebacks": c,
        "rate": round(rate, 6),
        "ci_low": round(ci[0], 6), "ci_high": round(ci[1], 6),
    }
    print(f"  {season}: {c}/{n} = {rate:.3f} [{ci[0]:.3f}, {ci[1]:.3f}]")

# ── Fönsteruppdelning (51-55 vs övriga) ───────────────────────────────────────

print("\nFönsteruppdelning (herr): comeback-rate per bucket")

window_breakdown = {}
all_buckets_data = BUCKETS  # definierat i toppen

for bucket in all_buckets_data:
    if bucket == "no_reduction":
        subset = [r for r in herr_records if r["first_red_bucket"] == "no_reduction"]
        n = len(subset)
        c = sum(1 for r in subset if r["comeback"])
        rate = c / n if n > 0 else 0.0
        ci = wilson_ci(rate, n)
        # Om ingen reducering = nästan aldrig comeback
        window_breakdown[bucket] = {
            "n_with_first_red": n,
            "comebacks": c,
            "comeback_rate": round(rate, 6),
            "ci": [round(ci[0], 6), round(ci[1], 6)],
        }
        print(f"  {bucket}: {c}/{n} = {rate:.3f}")
    else:
        subset = [r for r in herr_records if r["first_red_bucket"] == bucket]
        n = len(subset)
        c = sum(1 for r in subset if r["comeback"])
        rate = c / n if n > 0 else 0.0
        ci = wilson_ci(rate, n)
        p = binom_p(c, n, baseline_herr["rate"])
        window_breakdown[bucket] = {
            "n_with_first_red": n,
            "comebacks": c,
            "comeback_rate": round(rate, 6),
            "ci": [round(ci[0], 6), round(ci[1], 6)],
            "binom_p_vs_baseline": round(p, 6) if p is not None else None,
        }
        print(f"  {bucket}: {c}/{n} = {rate:.3f} [{ci[0]:.3f}, {ci[1]:.3f}] p={p:.4f}" if p else f"  {bucket}: {c}/{n} = {rate:.3f}")

# ── Bygg och spara JSON ───────────────────────────────────────────────────────

window_51_55_rate = window_breakdown.get("51-55", {}).get("comeback_rate", None)

output = {
    "_meta": {
        "description": "Comeback-mekanikens djupanalys — 7 dimensioner",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "series": "herr + dam (baseline per serie, djupanalys på herr)",
        "baseline_comeback_rate_herr": baseline_herr["rate"],
        "baseline_n_herr": baseline_herr["n"],
        "baseline_comeback_rate_dam": baseline_dam["rate"],
        "baseline_n_dam": baseline_dam["n"],
        "window_51_55_comeback_rate": window_51_55_rate,
        "minute_convention": "raw_minutes: 2H = 46-90+. Finding-notation adds 45 (raw 51-55 = finding 96-100)",
    },
    "baselines": {
        "herr": baseline_herr,
        "dam":  baseline_dam,
        "combined": baseline_all,
    },
    "by_ht_margin": by_ht_margin,
    "foul_analysis_window_51_55": foul_analysis,
    "goal_types_window_51_55": goal_types_analysis,
    "power_play_proxy": power_play_proxy,
    "club_distribution": club_distribution,
    "by_phase": by_phase,
    "by_season": by_season,
    "window_breakdown": window_breakdown,
}

OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
with open(OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\nSparat: {OUT_PATH}")
print(f"\n=== SAMMANFATTNING ===")
print(f"Baseline comeback-rate (herr): {baseline_herr['rate']:.4f} ({baseline_herr['comebacks']}/{baseline_herr['n']})")
print(f"Fönster 51-55 comeback-rate:   {window_51_55_rate:.4f}" if window_51_55_rate else "Fönster 51-55: ingen data")
print(f"HT +1 comeback-rate:           {by_ht_margin.get('1', {}).get('rate', 'N/A')}")
print(f"HT +2 comeback-rate:           {by_ht_margin.get('2', {}).get('rate', 'N/A')}")
print(f"HT +3+ comeback-rate:          {by_ht_margin.get('3plus', {}).get('rate', 'N/A')}")
print(f"Power-play-proxy rate:         {power_play_proxy['proxy_rate']:.4f}")
