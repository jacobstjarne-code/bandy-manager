"""
analysis_helpers.py

Gemensam statistisk hjälpmodul för Bandy Brain-analyser.
Återanvänds av analyze_comeback.py och liknande skript.
"""

import math
import random
from typing import Callable, List, Optional, Tuple

try:
    from scipy import stats as scipy_stats
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False


def bootstrap_ci(
    values: List[float],
    n: int = 1000,
    seed: int = 42,
    alpha: float = 0.05,
) -> Tuple[float, float]:
    """
    Bootstrap konfidensintervall (alpha/2, 1-alpha/2) för medelvärdet av values.
    Returnerar (lower, upper). Om listan är tom returneras (nan, nan).
    """
    if not values:
        return (float("nan"), float("nan"))
    rng = random.Random(seed)
    k = len(values)
    means = sorted(
        sum(rng.choices(values, k=k)) / k for _ in range(n)
    )
    lo = means[int(alpha / 2 * n)]
    hi = means[min(int((1 - alpha / 2) * n), len(means) - 1)]
    return (lo, hi)


def wilson_ci(p: float, n: int, alpha: float = 0.05) -> Tuple[float, float]:
    """
    Wilson score interval för andel p med n observationer.
    Returnerar (lower, upper). z baseras på alpha.
    """
    if n == 0:
        return (0.0, 1.0)
    z = _z_for_alpha(alpha)
    denom = 1 + z * z / n
    center = (p + z * z / (2 * n)) / denom
    margin = (z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / denom
    return (max(0.0, center - margin), min(1.0, center + margin))


def cohens_d(sample_vals: List[float], pop_vals: List[float]) -> Optional[float]:
    """
    Cohens d: (mean_sample - mean_pop) / pooled_std.
    Positiv = sample har högre medelvärde.
    """
    if len(sample_vals) < 2 or len(pop_vals) < 2:
        return None
    m1 = _mean(sample_vals)
    m2 = _mean(pop_vals)
    n1, n2 = len(sample_vals), len(pop_vals)
    var1 = _var(sample_vals)
    var2 = _var(pop_vals)
    pooled_std = math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2))
    if pooled_std == 0:
        return 0.0
    return (m1 - m2) / pooled_std


def cohens_h(p1: float, p2: float) -> float:
    """
    Cohens h: effektstorlek för jämförelse av två andelar.
    h = 2 * arcsin(sqrt(p1)) - 2 * arcsin(sqrt(p2))
    """
    return 2 * math.asin(math.sqrt(max(0.0, min(1.0, p1)))) - 2 * math.asin(
        math.sqrt(max(0.0, min(1.0, p2)))
    )


def bonferroni_p(p_raw: float, n_tests: int) -> float:
    """
    Bonferroni-korrigerat p-värde. Cappas vid 1.0.
    """
    return min(1.0, p_raw * n_tests)


def binom_p(k: int, n: int, p: float) -> Optional[float]:
    """
    Exakt tvåsidigt binomialtest (kräver scipy). Returnerar p-värde eller None.
    """
    if not HAS_SCIPY or n == 0:
        return None
    result = scipy_stats.binomtest(k, n, p, alternative="two-sided")
    return result.pvalue


def matchmix_adjust(
    matches_for_subject: list,
    all_matches: list,
    metric_fn: Callable,
    baseline_fn: Callable,
) -> Optional[float]:
    """
    Enkel matchmix-justering: returnerar (subject_metric - subject_baseline) / subject_baseline
    som relativ avvikelse mot matchmix-justerat baseline.

    metric_fn(matches) -> float
    baseline_fn(matches) -> float  (vad baseline är för just dessa matcher)
    """
    if not matches_for_subject:
        return None
    subject_metric = metric_fn(matches_for_subject)
    subject_baseline = baseline_fn(matches_for_subject)
    if subject_baseline == 0:
        return None
    return (subject_metric - subject_baseline) / subject_baseline


# ── Interna hjälpfunktioner ───────────────────────────────────────────────────

def _mean(values: List[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _var(values: List[float]) -> float:
    if len(values) < 2:
        return 0.0
    m = _mean(values)
    return sum((x - m) ** 2 for x in values) / (len(values) - 1)


def _z_for_alpha(alpha: float) -> float:
    """Approximation av z-värde för tvåsidigt CI. Stöder alpha=0.05 och 0.01."""
    table = {0.05: 1.96, 0.01: 2.576, 0.10: 1.645}
    return table.get(alpha, 1.96)
