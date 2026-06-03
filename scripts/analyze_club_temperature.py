"""
analyze_club_temperature.py

Beräknar matchup-temperatur (fouls, mål, hörn, hemmafördel) för alla
klubbpar i Elitserien herr. Producerar docs/data/klubb_temperatur.json.

Kör: PATH="/opt/homebrew/bin:$PATH" python3 scripts/analyze_club_temperature.py
"""

import json
import math
import os
import sys

# Lägg till pipeline-katalogen i path så analysis_helpers hittas
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "pipeline"))
from analysis_helpers import bootstrap_ci, wilson_ci


# ── Ladda data ────────────────────────────────────────────────────────────────

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "docs", "data", "bandygrytan_detailed.json")
OUT_PATH  = os.path.join(os.path.dirname(__file__), "..", "docs", "data", "klubb_temperatur.json")

with open(DATA_PATH, encoding="utf-8") as f:
    raw = json.load(f)

matches = raw["herr"]["matches"]
print(f"Laddade {len(matches)} herrmatchar")


# ── Bygg matchup-index ────────────────────────────────────────────────────────

# Kanoniserat par = (sorted_a, sorted_b) — alfabetisk ordning
matchup_data: dict[tuple[str, str], list[dict]] = {}

for m in matches:
    home = m.get("homeTeam", "")
    away = m.get("awayTeam", "")
    if not home or not away:
        continue

    # Fouls totalt per match
    fouls = m.get("fouls", [])
    total_fouls = len(fouls)

    # Mål totalt
    total_goals = m.get("homeScore", 0) + m.get("awayScore", 0)

    # Hörn totalt
    corners = m.get("corners", {})
    total_corners = corners.get("home", 0) + corners.get("away", 0)

    # Hemmavinst-flagga
    hs = m.get("homeScore", 0)
    as_ = m.get("awayScore", 0)
    if hs > as_:
        home_result = "win"
    elif hs == as_:
        home_result = "draw"
    else:
        home_result = "loss"

    key = tuple(sorted([home, away]))
    if key not in matchup_data:
        matchup_data[key] = []

    matchup_data[key].append({
        "home": home,
        "away": away,
        "fouls": total_fouls,
        "goals": total_goals,
        "corners": total_corners,
        "home_result": home_result,
    })

print(f"Unika matchups (alla n): {len(matchup_data)}")


# ── Beräkna statistik per matchup ─────────────────────────────────────────────

def r2(x: float) -> float:
    return round(x, 2)

def compute_matchup(pair: tuple[str, str], records: list[dict]) -> dict:
    team_a, team_b = pair
    n = len(records)

    fouls_list  = [r["fouls"]   for r in records]
    goals_list  = [r["goals"]   for r in records]
    corners_list = [r["corners"] for r in records]

    avg_fouls   = sum(fouls_list)   / n
    avg_goals   = sum(goals_list)   / n
    avg_corners = sum(corners_list) / n

    ci_fouls   = bootstrap_ci(fouls_list,   seed=42)
    ci_goals   = bootstrap_ci(goals_list,   seed=42)
    ci_corners = bootstrap_ci(corners_list, seed=42)

    # Hemmavinst (oavsett vilket lag som är hemma)
    hw = sum(1 for r in records if r["home_result"] == "win")
    draws = sum(1 for r in records if r["home_result"] == "draw")
    home_win_pct = hw / n
    draw_pct     = draws / n
    home_win_ci  = wilson_ci(home_win_pct, n)

    # Per riktning
    a_home = [r for r in records if r["home"] == team_a]
    b_home = [r for r in records if r["home"] == team_b]

    a_home_n = len(a_home)
    b_home_n = len(b_home)

    a_home_win_pct = (
        sum(1 for r in a_home if r["home_result"] == "win") / a_home_n
        if a_home_n > 0 else float("nan")
    )
    b_home_win_pct = (
        sum(1 for r in b_home if r["home_result"] == "win") / b_home_n
        if b_home_n > 0 else float("nan")
    )

    # Asymmetri: abs skillnad i hemmavinst% beroende på vem som är hemma
    if not math.isnan(a_home_win_pct) and not math.isnan(b_home_win_pct):
        asymmetry = abs(a_home_win_pct - b_home_win_pct)
    else:
        asymmetry = float("nan")

    return {
        "team_a": team_a,
        "team_b": team_b,
        "n": n,
        "avg_fouls":   r2(avg_fouls),
        "ci_fouls":    [r2(ci_fouls[0]), r2(ci_fouls[1])],
        "std_fouls":   r2(
            math.sqrt(sum((x - avg_fouls) ** 2 for x in fouls_list) / n)
            if n > 1 else 0.0
        ),
        "avg_goals":   r2(avg_goals),
        "ci_goals":    [r2(ci_goals[0]), r2(ci_goals[1])],
        "avg_corners": r2(avg_corners),
        "ci_corners":  [r2(ci_corners[0]), r2(ci_corners[1])],
        "home_win_pct": r2(home_win_pct),
        "home_win_ci":  [r2(home_win_ci[0]), r2(home_win_ci[1])],
        "draw_pct":     r2(draw_pct),
        "a_home_n":          a_home_n,
        "a_home_win_pct":    r2(a_home_win_pct) if not math.isnan(a_home_win_pct) else None,
        "b_home_n":          b_home_n,
        "b_home_win_pct":    r2(b_home_win_pct) if not math.isnan(b_home_win_pct) else None,
        "asymmetry":         r2(asymmetry) if not math.isnan(asymmetry) else None,
    }


all_matchups_raw = []
for pair, records in matchup_data.items():
    stats = compute_matchup(pair, records)
    all_matchups_raw.append(stats)

# Filtrera n ≥ 6 för de flesta listor
n6 = [m for m in all_matchups_raw if m["n"] >= 6]
print(f"Matchups med n≥6: {len(n6)}")


# ── Ligamedel ─────────────────────────────────────────────────────────────────

all_fouls   = [r["fouls"]   for m in matches for r in [{"fouls": len(m.get("fouls", [])), "goals": m.get("homeScore", 0) + m.get("awayScore", 0), "corners": m.get("corners", {}).get("home", 0) + m.get("corners", {}).get("away", 0)}]]
all_goals   = [m.get("homeScore", 0) + m.get("awayScore", 0) for m in matches]
all_corners = [m.get("corners", {}).get("home", 0) + m.get("corners", {}).get("away", 0) for m in matches]
league_avg_fouls   = r2(sum(len(m.get("fouls", [])) for m in matches) / len(matches))
league_avg_goals   = r2(sum(all_goals) / len(matches))
league_avg_corners = r2(sum(all_corners) / len(matches))

print(f"Ligamedel: fouls={league_avg_fouls}, goals={league_avg_goals}, corners={league_avg_corners}")


# ── Toppar ────────────────────────────────────────────────────────────────────

all_sorted_fouls   = sorted(n6, key=lambda x: x["avg_fouls"],   reverse=True)
all_sorted_goals   = sorted(n6, key=lambda x: x["avg_goals"],   reverse=True)
all_sorted_cold    = sorted(n6, key=lambda x: x["avg_fouls"])

# Asymmetri: kräv n≥4 per riktning
asym_eligible = [
    m for m in all_matchups_raw
    if m["asymmetry"] is not None
    and m["a_home_n"] >= 4
    and m["b_home_n"] >= 4
]
all_sorted_asym = sorted(asym_eligible, key=lambda x: x["asymmetry"], reverse=True)

top_warm      = all_sorted_fouls[:10]
top_cold      = all_sorted_cold[:10]
top_goals     = all_sorted_goals[:10]
most_asym     = all_sorted_asym[:10]

# Utskrift till terminal
print("\n── TOP 10 VARMASTE MATCHUPS (fouls/match) ──")
for i, m in enumerate(top_warm, 1):
    print(f"  {i:2}. {m['team_a']} – {m['team_b']}: {m['avg_fouls']} fouls/match (n={m['n']}, CI=[{m['ci_fouls'][0]}, {m['ci_fouls'][1]}])")

print("\n── TOP 10 KALLASTE MATCHUPS ──")
for i, m in enumerate(top_cold, 1):
    print(f"  {i:2}. {m['team_a']} – {m['team_b']}: {m['avg_fouls']} fouls/match (n={m['n']})")

print("\n── TOP 10 MEST MÅLRIKA ──")
for i, m in enumerate(top_goals, 1):
    print(f"  {i:2}. {m['team_a']} – {m['team_b']}: {m['avg_goals']} mål/match (n={m['n']})")

print("\n── TOP 10 MEST ASYMMETRISKA (hemmafördelsvariansen) ──")
for i, m in enumerate(most_asym, 1):
    print(f"  {i:2}. {m['team_a']} – {m['team_b']}: asymmetri={m['asymmetry']} ({m['team_a']} hemma: {m['a_home_win_pct']} | {m['team_b']} hemma: {m['b_home_win_pct']}) n_a={m['a_home_n']} n_b={m['b_home_n']}")


# ── Spara JSON ────────────────────────────────────────────────────────────────

out = {
    "_meta": {
        "description": "Matchup-temperatur per klubbpar, Elitserien herr 2019-2026",
        "n_matchups_total": len(all_matchups_raw),
        "n_matchups_n6plus": len(n6),
        "league_avg_fouls":   league_avg_fouls,
        "league_avg_goals":   league_avg_goals,
        "league_avg_corners": league_avg_corners,
    },
    "all_matchups": sorted(all_matchups_raw, key=lambda x: x["avg_fouls"], reverse=True),
    "top_warm":        top_warm,
    "top_cold":        top_cold,
    "top_goals":       top_goals,
    "most_asymmetric": most_asym,
}

os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
with open(OUT_PATH, "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)

print(f"\nSparade {OUT_PATH}")
