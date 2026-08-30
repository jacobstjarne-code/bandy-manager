#!/usr/bin/env python3
"""Recompute the source numbers used by findings 002, 018, 025 and 045."""

from __future__ import annotations

import json
import math
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "docs" / "data" / "bandygrytan_detailed.json"
OUT_PATH = ROOT / "docs" / "data" / "finding_corrections_002_018_025_045.json"

sys.path.insert(0, str(ROOT / "scripts" / "pipeline"))
from club_names import normalize_club  # noqa: E402


def wilson(successes: int, total: int, z: float = 1.959963984540054) -> list[float]:
    if total == 0:
        return [0.0, 0.0]
    p = successes / total
    denominator = 1 + z * z / total
    centre = (p + z * z / (2 * total)) / denominator
    margin = z * math.sqrt((p * (1 - p) + z * z / (4 * total)) / total) / denominator
    return [round(100 * (centre - margin), 4), round(100 * (centre + margin), 4)]


def fisher_two_sided(a: int, b: int, c: int, d: int) -> float:
    """Two-sided Fisher exact p-value for [[a,b],[c,d]], without scipy."""
    row1, row2 = a + b, c + d
    successes = a + c
    total = row1 + row2

    def probability(x: int) -> float:
        return (
            math.comb(successes, x)
            * math.comb(total - successes, row1 - x)
            / math.comb(total, row1)
        )

    observed = probability(a)
    low = max(0, row1 - (total - successes))
    high = min(row1, successes)
    return min(1.0, sum(probability(x) for x in range(low, high + 1) if probability(x) <= observed + 1e-15))


def pct(numerator: int, denominator: int) -> float:
    return round(100 * numerator / denominator, 4) if denominator else 0.0


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    regular = [match for match in data["herr"]["matches"] if match.get("phase") == "regular"]

    goals = sum((m.get("homeScore") or 0) + (m.get("awayScore") or 0) for m in regular)
    corners = sum(sum((m.get("corners") or {}).get(side, 0) for side in ("home", "away")) for m in regular)
    corner_goals = sum((m.get("cornerGoalsHome") or 0) + (m.get("cornerGoalsAway") or 0) for m in regular)

    league = {
        "matches": len(regular),
        "goals": goals,
        "corners": corners,
        "corner_goals": corner_goals,
        "goals_per_match": round(goals / len(regular), 4),
        "corners_per_match": round(corners / len(regular), 4),
        "corner_goals_per_match": round(corner_goals / len(regular), 4),
        "corner_goal_share_pct": pct(corner_goals, goals),
        "corner_conversion_pct": pct(corner_goals, corners),
        "corner_conversion_ci95_pct": wilson(corner_goals, corners),
    }

    team_totals: dict[str, dict[str, object]] = defaultdict(
        lambda: {"matches": 0, "corners": 0, "corner_goals": 0, "goals": 0, "variants": set()}
    )
    for match in regular:
        for side, score_key, corner_goal_key in (
            ("home", "homeScore", "cornerGoalsHome"),
            ("away", "awayScore", "cornerGoalsAway"),
        ):
            raw_name = match[f"{side}Team"]
            name = normalize_club(raw_name)
            totals = team_totals[name]
            totals["matches"] += 1
            totals["corners"] += (match.get("corners") or {}).get(side, 0)
            totals["corner_goals"] += match.get(corner_goal_key) or 0
            totals["goals"] += match.get(score_key) or 0
            totals["variants"].add(raw_name)

    teams = {}
    for name in ("Västerås SK", "Vetlanda BK"):
        raw = team_totals[name]
        team_matches = int(raw["matches"])
        team_corners = int(raw["corners"])
        team_corner_goals = int(raw["corner_goals"])
        team_goals = int(raw["goals"])
        teams[name] = {
            "variants": sorted(raw["variants"]),
            "matches": team_matches,
            "corners": team_corners,
            "corner_goals": team_corner_goals,
            "goals": team_goals,
            "corners_per_match": round(team_corners / team_matches, 4),
            "corner_goals_per_match": round(team_corner_goals / team_matches, 4),
            "corner_goal_share_pct": pct(team_corner_goals, team_goals),
            "corner_conversion_pct": pct(team_corner_goals, team_corners),
            "corner_conversion_ci95_pct": wilson(team_corner_goals, team_corners),
        }

    vsk = teams["Västerås SK"]
    vetlanda = teams["Vetlanda BK"]
    pooled_conversion_test = {
        "difference_percentage_points_vsk_minus_vetlanda": round(
            float(vsk["corner_conversion_pct"]) - float(vetlanda["corner_conversion_pct"]), 4
        ),
        "fisher_exact_two_sided_p": round(
            fisher_two_sided(
                int(vsk["corner_goals"]), int(vsk["corners"]) - int(vsk["corner_goals"]),
                int(vetlanda["corner_goals"]), int(vetlanda["corners"]) - int(vetlanda["corner_goals"]),
            ),
            6,
        ),
    }

    phases = {}
    for phase in ("quarterfinal", "semifinal", "final"):
        matches = [m for m in data["herr"]["matches"] if m.get("phase") == phase]
        ht_leads = ht_wins = 0
        for match in matches:
            ht_home, ht_away = match.get("halfTimeHome"), match.get("halfTimeAway")
            if ht_home is None or ht_away is None or ht_home == ht_away:
                continue
            ht_leads += 1
            if (ht_home > ht_away and match["homeScore"] > match["awayScore"]) or (
                ht_away > ht_home and match["awayScore"] > match["homeScore"]
            ):
                ht_wins += 1
        total_goals = sum((m.get("homeScore") or 0) + (m.get("awayScore") or 0) for m in matches)
        phases[phase] = {
            "matches": len(matches),
            "goals": total_goals,
            "goals_per_match": round(total_goals / len(matches), 4),
            "matches_with_ht_lead": ht_leads,
            "ht_leader_wins": ht_wins,
            "ht_lead_win_pct": pct(ht_wins, ht_leads),
            "ht_lead_win_ci95_pct": wilson(ht_wins, ht_leads),
        }

    qf, sf = phases["quarterfinal"], phases["semifinal"]
    phase_test = {
        "difference_percentage_points_qf_minus_sf": round(
            float(qf["ht_lead_win_pct"]) - float(sf["ht_lead_win_pct"]), 4
        ),
        "fisher_exact_two_sided_p": round(
            fisher_two_sided(
                int(qf["ht_leader_wins"]), int(qf["matches_with_ht_lead"]) - int(qf["ht_leader_wins"]),
                int(sf["ht_leader_wins"]), int(sf["matches_with_ht_lead"]) - int(sf["ht_leader_wins"]),
            ),
            6,
        ),
    }

    output = {
        "_meta": {
            "analysis": "Recomputation for findings 002, 018, 025 and 045",
            "source": str(DATA_PATH.relative_to(ROOT)),
            "phase_for_corner_metrics": "regular",
            "club_names": "normalized with scripts/pipeline/club_names.py",
        },
        "league_corner_metrics": league,
        "team_corner_metrics": teams,
        "vsk_vs_vetlanda": pooled_conversion_test,
        "playoff_ht_lead_by_phase": phases,
        "quarterfinal_vs_semifinal": phase_test,
    }
    OUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
