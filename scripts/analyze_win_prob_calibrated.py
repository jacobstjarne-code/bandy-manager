#!/usr/bin/env python3
"""Build and validate Bandy-Brain's calibrated match-state win model.

Validation uses three rolling chronological folds. The published scenario
curve comes from the latest fold: train through 2022-23 and calibrate 2024-25.

Only matches whose goal log reproduces the final score are used. Team strength
is a sequential pre-match Elo rating, updated after each match.
"""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

import numpy as np
from scipy.optimize import minimize_scalar
from scipy.special import softmax
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import log_loss
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler


DATA = Path("docs/data/bandygrytan_detailed.json")
OUTPUT = Path("docs/data/win_prob_calibrated_herr.json")
REPORT = Path("docs/data/ANALYS_WIN_PROB_CALIBRATED.md")
TRAIN_SEASONS = ["2019-20", "2020-21", "2021-22", "2022-23"]
CALIBRATION_SEASON = "2024-25"
ROLLING_FOLDS = [
    (["2019-20", "2020-21"], "2021-22", "2022-23"),
    (["2019-20", "2020-21", "2021-22"], "2022-23", "2024-25"),
    (TRAIN_SEASONS, CALIBRATION_SEASON, "2025-26"),
]
EVALUATION_MINUTES = [15, 30, 45, 60, 75, 84, 89]
MAX_MINUTE = 90
CLASS_NAMES = ["away", "draw", "home"]


def outcome_index(match: dict) -> int:
    home = match.get("homeScore", 0) or 0
    away = match.get("awayScore", 0) or 0
    return 2 if home > away else 0 if home < away else 1


def goal_log_is_complete(match: dict) -> bool:
    goals = match.get("goals") or []
    return (
        sum(goal.get("team") == "home" for goal in goals) == (match.get("homeScore", 0) or 0)
        and sum(goal.get("team") == "away" for goal in goals) == (match.get("awayScore", 0) or 0)
    )


def goal_diffs_by_minute(match: dict) -> dict[int, int]:
    changes: dict[int, int] = defaultdict(int)
    for goal in match.get("goals") or []:
        minute = int(goal.get("minute", 0) or 0)
        changes[minute] += 1 if goal.get("team") == "home" else -1
    return changes


def feature_vector(minute: int, diff: int, elo_difference: float) -> list[float]:
    """Continuous state features; Elo difference is scaled by 400 points."""
    time = minute / MAX_MINUTE
    magnitude = abs(diff)
    sign = int(np.sign(diff))
    return [
        time,
        time**2,
        time**3,
        time**4,
        diff,
        diff * time,
        diff * time**2,
        diff * time**3,
        diff * time**4,
        magnitude,
        magnitude * time,
        magnitude * time**2,
        magnitude * time**3,
        sign,
        sign * time,
        sign * time**2,
        sign * time**3,
        elo_difference,
        elo_difference * time,
        elo_difference * time**2,
    ]


def build_rows(matches: list[dict]) -> tuple[list[dict], dict]:
    ratings = defaultdict(lambda: 1500.0)
    rows: list[dict] = []
    excluded_by_season = defaultdict(int)
    included_by_season = defaultdict(int)

    for match in sorted(matches, key=lambda item: (item.get("date", ""), str(item.get("matchId", "")))):
        if not goal_log_is_complete(match):
            excluded_by_season[match.get("season", "unknown")] += 1
            continue

        season = match.get("season", "unknown")
        included_by_season[season] += 1
        home_id = str(match.get("homeTeamId") or match.get("homeTeam"))
        away_id = str(match.get("awayTeamId") or match.get("awayTeam"))
        elo_difference = (ratings[home_id] - ratings[away_id]) / 400.0
        result = outcome_index(match)
        changes = goal_diffs_by_minute(match)
        diff = 0

        for minute in range(1, MAX_MINUTE + 1):
            if minute > 1:
                diff += changes.get(minute - 1, 0)
            rows.append(
                {
                    "season": season,
                    "match_id": str(match.get("matchId")),
                    "minute": minute,
                    "diff": diff,
                    "outcome": result,
                    "features": feature_vector(minute, diff, elo_difference),
                }
            )

        # The current match cannot leak into its own pre-match strength feature.
        expected_home = 1 / (1 + 10 ** (-((ratings[home_id] + 50) - ratings[away_id]) / 400))
        actual_home = 1.0 if result == 2 else 0.5 if result == 1 else 0.0
        rating_change = 20 * (actual_home - expected_home)
        ratings[home_id] += rating_change
        ratings[away_id] -= rating_change

    return rows, {
        "included_by_season": dict(sorted(included_by_season.items())),
        "excluded_incomplete_goal_log_by_season": dict(sorted(excluded_by_season.items())),
        "included_matches": sum(included_by_season.values()),
        "excluded_matches": sum(excluded_by_season.values()),
    }


def calibrated_probabilities(logits: np.ndarray, temperature: float) -> np.ndarray:
    return softmax(logits / temperature, axis=1)


def multiclass_brier(probabilities: np.ndarray, outcomes: np.ndarray) -> float:
    return float(np.mean(np.sum((probabilities - np.eye(3)[outcomes]) ** 2, axis=1)))


def expected_calibration_error(probabilities: np.ndarray, outcomes: np.ndarray, bins: int = 10) -> float:
    values = probabilities.ravel()
    truth = np.eye(3)[outcomes].ravel()
    error = 0.0
    for index in range(bins):
        low, high = index / bins, (index + 1) / bins
        mask = (values >= low) & ((values < high) if high < 1 else (values <= high))
        if mask.any():
            error += float(mask.mean() * abs(values[mask].mean() - truth[mask].mean()))
    return error


def metric_bundle(probabilities: np.ndarray, outcomes: np.ndarray) -> dict:
    return {
        "log_loss": round(float(log_loss(outcomes, probabilities, labels=[0, 1, 2])), 4),
        "multiclass_brier": round(multiclass_brier(probabilities, outcomes), 4),
        "calibration_error_10_bins": round(expected_calibration_error(probabilities, outcomes), 4),
    }


def exact_grid_probabilities(
    train_minutes: np.ndarray,
    train_diffs: np.ndarray,
    train_outcomes: np.ndarray,
    test_minutes: np.ndarray,
    test_diffs: np.ndarray,
) -> np.ndarray:
    """Historical exact-cell benchmark, trained only on the training seasons."""
    counts = defaultdict(lambda: np.zeros(3, dtype=float))
    prior = np.bincount(train_outcomes, minlength=3).astype(float)
    prior /= prior.sum()
    for minute, diff, result in zip(train_minutes, train_diffs, train_outcomes):
        counts[(int(minute), max(-3, min(3, int(diff))))][result] += 1

    probabilities = []
    for minute, diff in zip(test_minutes, test_diffs):
        cell = counts[(int(minute), max(-3, min(3, int(diff))))]
        probabilities.append((cell + prior * 3) / (cell.sum() + 3))
    return np.asarray(probabilities)


def bootstrap_log_loss_improvement(
    smooth: np.ndarray,
    raw: np.ndarray,
    outcomes: np.ndarray,
    match_ids: np.ndarray,
) -> dict:
    smooth_losses = -np.log(smooth[np.arange(len(outcomes)), outcomes])
    raw_losses = -np.log(raw[np.arange(len(outcomes)), outcomes])
    per_match = np.asarray(
        [
            np.mean(raw_losses[match_ids == match_id] - smooth_losses[match_ids == match_id])
            for match_id in np.unique(match_ids)
        ]
    )
    rng = np.random.default_rng(42)
    draws = np.asarray(
        [rng.choice(per_match, size=len(per_match), replace=True).mean() for _ in range(5000)]
    )
    return {
        "raw_minus_calibrated": round(float(per_match.mean()), 4),
        "bootstrap_95pct_ci": [
            round(float(np.quantile(draws, 0.025)), 4),
            round(float(np.quantile(draws, 0.975)), 4),
        ],
        "bootstrap_draws": 5000,
        "resampling_unit": "match",
    }


def scenario_curves(model, temperature: float) -> dict:
    scenarios = {}
    for diff in [1, 2, 3, -1, -2, -3]:
        leader = "home" if diff > 0 else "away"
        key = f"{leader}_+{abs(diff)}"
        probabilities = []
        for minute in range(1, MAX_MINUTE + 1):
            features = np.asarray([feature_vector(minute, diff, 0.0)])
            prediction = calibrated_probabilities(model.decision_function(features), temperature)[0]
            probabilities.append(round(float(prediction[2] if diff > 0 else prediction[0]), 4))
        sustained = next(
            (
                minute
                for minute, probability in enumerate(probabilities, start=1)
                if probability >= 0.95 and all(later >= 0.95 for later in probabilities[minute - 1 :])
            ),
            None,
        )
        scenarios[key] = {
            "leader": leader,
            "goal_lead": abs(diff),
            "pre_match_elo_difference": 0,
            "sustained_95pct_from_minute": sustained,
            "probabilities_by_minute": probabilities,
            "snapshots": {
                str(minute): probabilities[minute - 1] for minute in EVALUATION_MINUTES + [90]
            },
        }
    return scenarios


def build_output(data: dict) -> dict:
    matches = [match for match in data["herr"]["matches"] if match.get("phase") == "regular"]
    rows, quality = build_rows(matches)
    features = np.asarray([row["features"] for row in rows])
    outcomes = np.asarray([row["outcome"] for row in rows])
    seasons = np.asarray([row["season"] for row in rows])
    minutes = np.asarray([row["minute"] for row in rows])
    diffs = np.asarray([row["diff"] for row in rows])
    match_ids = np.asarray([row["match_id"] for row in rows])

    fold_results = []
    smooth_parts, raw_parts, outcome_parts, match_id_parts = [], [], [], []
    final_model = None
    final_temperature = None

    for train_seasons, calibration_season, test_season in ROLLING_FOLDS:
        train = np.isin(seasons, train_seasons)
        calibration = seasons == calibration_season
        test = (seasons == test_season) & np.isin(minutes, EVALUATION_MINUTES)

        model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=3000, C=1.0))
        model.fit(features[train], outcomes[train])
        calibration_logits = model.decision_function(features[calibration])
        temperature_fit = minimize_scalar(
            lambda log_temperature: log_loss(
                outcomes[calibration],
                calibrated_probabilities(calibration_logits, np.exp(log_temperature)),
                labels=[0, 1, 2],
            ),
            bounds=(-2.3, 2.3),
            method="bounded",
        )
        temperature = float(np.exp(temperature_fit.x))
        smooth = calibrated_probabilities(model.decision_function(features[test]), temperature)
        raw = exact_grid_probabilities(
            minutes[train], diffs[train], outcomes[train], minutes[test], diffs[test]
        )
        test_outcomes = outcomes[test]
        test_match_ids = match_ids[test]

        fold_results.append(
            {
                "train_seasons": train_seasons,
                "calibration_season": calibration_season,
                "test_season": test_season,
                "train_matches": len(np.unique(match_ids[train])),
                "calibration_matches": len(np.unique(match_ids[calibration])),
                "test_matches": len(np.unique(test_match_ids)),
                "test_snapshots": int(test.sum()),
                "temperature": round(temperature, 4),
                "calibrated_model": metric_bundle(smooth, test_outcomes),
                "raw_exact_cell_grid": metric_bundle(raw, test_outcomes),
            }
        )
        smooth_parts.append(smooth)
        raw_parts.append(raw)
        outcome_parts.append(test_outcomes)
        match_id_parts.append(test_match_ids)

        if train_seasons == TRAIN_SEASONS and calibration_season == CALIBRATION_SEASON:
            final_model = model
            final_temperature = temperature

    smooth_all = np.vstack(smooth_parts)
    raw_all = np.vstack(raw_parts)
    outcomes_all = np.concatenate(outcome_parts)
    match_ids_all = np.concatenate(match_id_parts)

    return {
        "_meta": {
            "analysis": "chronologically calibrated multinomial win-probability model",
            "series": "Herr-Elitserien",
            "phase": "grundserie",
            "generated_from": str(DATA),
            "class_order": CLASS_NAMES,
            "state_definition": "score at start of raw minute; goals in minute m apply from m+1",
            "features": [
                "raw minute (polynomial through degree 4)",
                "signed and absolute score difference with time interactions",
                "pre-match Elo difference with time interactions",
            ],
            "elo_note": "Sequential pre-match rating; match updates rating only after its rows are created.",
            "model": "standardised multinomial logistic regression, C=1.0",
            "calibration": "one temperature per rolling fold, fitted only on the calibration season",
        },
        "data_quality": quality,
        "validation": {
            "protocol": "three rolling chronological train-calibrate-test folds",
            "evaluation_minutes": EVALUATION_MINUTES,
            "test_seasons": [fold[2] for fold in ROLLING_FOLDS],
            "test_matches": len(np.unique(match_ids_all)),
            "test_snapshots": len(outcomes_all),
            "folds": fold_results,
            "calibrated_model": metric_bundle(smooth_all, outcomes_all),
            "raw_exact_cell_grid": metric_bundle(raw_all, outcomes_all),
            "paired_log_loss_improvement": bootstrap_log_loss_improvement(
                smooth_all, raw_all, outcomes_all, match_ids_all
            ),
        },
        "published_model": {
            "train_seasons": TRAIN_SEASONS,
            "calibration_season": CALIBRATION_SEASON,
            "temperature": round(float(final_temperature), 4),
            "future_validation": "Repeat on the next complete season without changing the specification.",
        },
        "scenario_definition": {
            "team_strength": "equal pre-match Elo",
            "venue": "leader identified by signed home-away score difference",
            "scope": "model estimate, not an observed threshold or causal claim",
        },
        "scenarios": scenario_curves(final_model, final_temperature),
    }


def write_report(output: dict) -> None:
    validation = output["validation"]
    quality = output["data_quality"]
    scenarios = output["scenarios"]
    calibrated = validation["calibrated_model"]
    raw = validation["raw_exact_cell_grid"]
    improvement = validation["paired_log_loss_improvement"]
    lines = [
        "# Finding 060 — kalibrerad vinstsannolikhetsmodell",
        "",
        "## Datakvalitet",
        "",
        f"Tidslinjen använder {quality['included_matches']} herrmatcher vars mållogg återskapar "
        f"slutresultatet. {quality['excluded_matches']} matcher exkluderas på grund av ofullständig mållogg.",
        "",
        "## Rullande kronologisk validering",
        "",
        f"Tre testfoldar omfattar {validation['test_matches']} matcher och "
        f"{validation['test_snapshots']} matchlägen från säsongerna "
        f"{', '.join(validation['test_seasons'])}.",
        "",
        "| Testmått | Kalibrerad modell | Gammal cell-grid |",
        "|---|---:|---:|",
        f"| Log loss | {calibrated['log_loss']:.4f} | {raw['log_loss']:.4f} |",
        f"| Multiklass-Brier | {calibrated['multiclass_brier']:.4f} | {raw['multiclass_brier']:.4f} |",
        f"| Kalibreringsfel, 10 bin | {calibrated['calibration_error_10_bins']:.4f} | "
        f"{raw['calibration_error_10_bins']:.4f} |",
        "",
        f"Log-lossförbättring (rå minus kalibrerad): {improvement['raw_minus_calibrated']:.4f}; "
        f"95 % match-bootstrap [{improvement['bootstrap_95pct_ci'][0]:.4f}, "
        f"{improvement['bootstrap_95pct_ci'][1]:.4f}].",
        "",
        "## 95-procentströsklar för jämnstarka lag",
        "",
        "| Ledning | Hemmalag | Bortalag |",
        "|---|---:|---:|",
    ]
    for goals in [1, 2, 3]:
        home = scenarios[f"home_+{goals}"]["sustained_95pct_from_minute"]
        away = scenarios[f"away_+{goals}"]["sustained_95pct_from_minute"]
        lines.append(
            f"| +{goals} mål | {f'minut {home}' if home else 'når inte 95 %'} | "
            f"{f'minut {away}' if away else 'når inte 95 %'} |"
        )
    lines.extend(
        [
            "",
            "Trösklarna är modellskattningar för lag med samma Elo före match.",
            "",
            "## Begränsningar",
            "",
            "- Valideringen omfattar tre senare säsonger och sju fördefinierade matchminuter.",
            "- Modellformen har granskats mot befintliga säsonger; nästa kompletta säsong är den verkligt orörda kontrollen.",
            "- Elo fångar tidigare resultat, inte laguppställning, skador, is eller väder.",
            "- Modellen använder rå matchminut; minut 45 är inte alltid registrerad halvtid.",
            "- Damserien kräver en separat modell. Slutspel ingår inte.",
        ]
    )
    REPORT.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    output = build_output(json.loads(DATA.read_text(encoding="utf-8")))
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    write_report(output)
    validation = output["validation"]
    quality = output["data_quality"]
    print(f"Herr: {quality['included_matches']} fullständiga, {quality['excluded_matches']} exkluderade")
    print(
        f"Rullande test: log loss "
        f"{validation['calibrated_model']['log_loss']} mot rågrid "
        f"{validation['raw_exact_cell_grid']['log_loss']}"
    )
    print(f"→ {OUTPUT}")
    print(f"→ {REPORT}")


if __name__ == "__main__":
    main()
