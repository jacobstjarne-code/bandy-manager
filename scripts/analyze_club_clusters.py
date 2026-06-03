#!/usr/bin/env python3
"""
Spelstilsklustring av klubbar — Elitserien herr
Bygger feature-vektorer per klubb-säsong, kör k-means-klustring,
producerar docs/data/klubb_kluster.json
"""

import json
import sys
from collections import defaultdict
import math

try:
    from sklearn.cluster import KMeans
    from sklearn.metrics import silhouette_score
    import numpy as np
except ImportError:
    print("scikit-learn not found. Run: pip3 install scikit-learn numpy")
    sys.exit(1)

DATA_PATH = "docs/data/bandygrytan_detailed.json"
OUTPUT_PATH = "docs/data/klubb_kluster.json"

# ──────────────────────────────────────────────────────────
# 1. Ladda data
# ──────────────────────────────────────────────────────────

with open(DATA_PATH) as f:
    data = json.load(f)

herr = data["herr"]["matches"]
all_matches = herr
print(f"Totalt antal herrmatchar: {len(all_matches)}")

# Filtrera: grundserie
regular_matches = [
    m for m in all_matches
    if m.get("phase") == "regular"
]
print(f"Regular-fase herr-matcher: {len(regular_matches)}")

# Kontrollera season-värden
seasons = sorted(set(m["season"] for m in regular_matches))
print(f"Säsonger: {seasons}")

# ──────────────────────────────────────────────────────────
# 2. Bygg rådata per (team, season)
# ──────────────────────────────────────────────────────────

# Struktur: raw[team][season] = lista av match-dicts
raw = defaultdict(lambda: defaultdict(list))

for m in regular_matches:
    home = m["homeTeam"]
    away = m["awayTeam"]
    season = m["season"]

    home_score = m.get("homeScore", 0) or 0
    away_score = m.get("awayScore", 0) or 0
    ht_home = m.get("halfTimeHome")
    ht_away = m.get("halfTimeAway")

    corners = m.get("corners") or {}
    home_corners = corners.get("home") if corners else None
    away_corners = corners.get("away") if corners else None

    # Mål per lag
    goals = m.get("goals") or []
    home_goals_list = [g for g in goals if g.get("team") == "home"]
    away_goals_list = [g for g in goals if g.get("team") == "away"]

    home_corner_goals = sum(1 for g in home_goals_list if g.get("type") == "corner")
    away_corner_goals = sum(1 for g in away_goals_list if g.get("type") == "corner")
    home_penalty_goals = sum(1 for g in home_goals_list if g.get("type") == "penalty")
    away_penalty_goals = sum(1 for g in away_goals_list if g.get("type") == "penalty")

    # Late goals (minute 75-90+)
    home_late_for = sum(1 for g in home_goals_list if g.get("minute", 0) >= 75)
    home_late_against = sum(1 for g in away_goals_list if g.get("minute", 0) >= 75)
    away_late_for = sum(1 for g in away_goals_list if g.get("minute", 0) >= 75)
    away_late_against = sum(1 for g in home_goals_list if g.get("minute", 0) >= 75)

    # Fouls
    fouls = m.get("fouls") or []
    home_fouls = sum(1 for f in fouls if f.get("team") == "home")
    away_fouls = sum(1 for f in fouls if f.get("team") == "away")

    # Halvtidsläge
    ht_valid = ht_home is not None and ht_away is not None

    # Hemmalag match-record
    raw[home][season].append({
        "goals_for": home_score,
        "goals_against": away_score,
        "corners_for": home_corners,
        "corner_goals": home_corner_goals,
        "penalty_goals": home_penalty_goals,
        "fouls": home_fouls,
        "ht_valid": ht_valid,
        "ht_lead": (ht_home > ht_away) if ht_valid else None,
        "ht_trail": (ht_home < ht_away) if ht_valid else None,
        "win": home_score > away_score,
        "is_home": True,
        "late_for": home_late_for,
        "late_against": home_late_against,
    })

    # Bortalag match-record
    raw[away][season].append({
        "goals_for": away_score,
        "goals_against": home_score,
        "corners_for": away_corners,
        "corner_goals": away_corner_goals,
        "penalty_goals": away_penalty_goals,
        "fouls": away_fouls,
        "ht_valid": ht_valid,
        "ht_lead": (ht_away > ht_home) if ht_valid else None,
        "ht_trail": (ht_away < ht_home) if ht_valid else None,
        "win": away_score > home_score,
        "is_home": False,
        "late_for": away_late_for,
        "late_against": away_late_against,
    })

# ──────────────────────────────────────────────────────────
# 3. Beräkna features per (team, season)
# ──────────────────────────────────────────────────────────

MIN_MATCHES = 10
MIN_SEASONS = 3

def safe_div(a, b, default=0.0):
    return a / b if b > 0 else default

def compute_features(matches):
    n = len(matches)
    if n < MIN_MATCHES:
        return None

    avg_goals_for = sum(m["goals_for"] for m in matches) / n
    avg_goals_against = sum(m["goals_against"] for m in matches) / n
    goal_diff = avg_goals_for - avg_goals_against

    # Hörnor — bara matcher där hörndata finns
    corner_matches = [m for m in matches if m["corners_for"] is not None]
    avg_corners = safe_div(sum(m["corners_for"] for m in corner_matches), len(corner_matches))

    total_goals_for = sum(m["goals_for"] for m in matches)
    total_corner_goals = sum(m["corner_goals"] for m in matches)
    total_penalty_goals = sum(m["penalty_goals"] for m in matches)
    corner_goal_pct = safe_div(total_corner_goals, total_goals_for)
    penalty_goal_pct = safe_div(total_penalty_goals, total_goals_for)

    avg_fouls = sum(m["fouls"] for m in matches) / n

    # Halvtidsstatistik
    ht_matches = [m for m in matches if m["ht_valid"]]
    lead_matches = [m for m in ht_matches if m["ht_lead"]]
    trail_matches = [m for m in ht_matches if m["ht_trail"]]

    ht_lead_freq = safe_div(len(lead_matches), len(ht_matches))

    # Vinst % när man leder vid HT (n>=3)
    if len(lead_matches) >= 3:
        ht_lead_win_pct = safe_div(sum(1 for m in lead_matches if m["win"]), len(lead_matches))
    else:
        ht_lead_win_pct = None

    # Comeback freq (vinna givet HT-underläge, n>=3)
    if len(trail_matches) >= 3:
        comeback_freq = safe_div(sum(1 for m in trail_matches if m["win"]), len(trail_matches))
    else:
        comeback_freq = None

    # Hemma vs borta vinst
    home_matches = [m for m in matches if m["is_home"]]
    away_matches = [m for m in matches if not m["is_home"]]
    home_win_freq = safe_div(sum(1 for m in home_matches if m["win"]), len(home_matches))
    away_win_freq = safe_div(sum(1 for m in away_matches if m["win"]), len(away_matches))
    home_minus_away_win = home_win_freq - away_win_freq

    # Sena mål (75-90+) per match
    late_goal_diff = (sum(m["late_for"] for m in matches) - sum(m["late_against"] for m in matches)) / n

    return {
        "avg_goals_for": avg_goals_for,
        "avg_goals_against": avg_goals_against,
        "goal_diff": goal_diff,
        "avg_corners": avg_corners,
        "corner_goal_pct": corner_goal_pct,
        "avg_fouls": avg_fouls,
        "penalty_goal_pct": penalty_goal_pct,
        "ht_lead_freq": ht_lead_freq,
        "ht_lead_win_pct": ht_lead_win_pct,
        "home_minus_away_win": home_minus_away_win,
        "comeback_freq": comeback_freq,
        "late_goal_diff": late_goal_diff,
        "n_matches": n,
    }

# Beräkna features
club_season_features = {}
for team, seasons_data in raw.items():
    for season, matches in seasons_data.items():
        feats = compute_features(matches)
        if feats:
            club_season_features[(team, season)] = feats

# Filtrera: ta bara med klubbar som har ≥3 säsonger
club_season_counts = defaultdict(int)
for (team, season) in club_season_features:
    club_season_counts[team] += 1

valid_clubs = {team for team, cnt in club_season_counts.items() if cnt >= MIN_SEASONS}
club_season_features = {
    (team, season): feats
    for (team, season), feats in club_season_features.items()
    if team in valid_clubs
}

print(f"\nKlubbar med ≥{MIN_SEASONS} säsonger: {len(valid_clubs)}")
print(f"Klubb-säsonger med ≥{MIN_MATCHES} matcher: {len(club_season_features)}")
print("\nKlubbar:")
for club in sorted(valid_clubs):
    n_seasons = club_season_counts[club]
    print(f"  {club}: {n_seasons} säsonger")

# ──────────────────────────────────────────────────────────
# 4. Hantera None-värden: impute med säsongsmedel
# ──────────────────────────────────────────────────────────

FEATURE_NAMES = [
    "avg_goals_for", "avg_goals_against", "goal_diff",
    "avg_corners", "corner_goal_pct", "avg_fouls",
    "penalty_goal_pct", "ht_lead_freq", "ht_lead_win_pct",
    "home_minus_away_win", "comeback_freq", "late_goal_diff",
]

# Impute None med globalt median per feature
feature_values = defaultdict(list)
for feats in club_season_features.values():
    for fname in FEATURE_NAMES:
        val = feats.get(fname)
        if val is not None:
            feature_values[fname].append(val)

feature_medians = {}
for fname in FEATURE_NAMES:
    vals = sorted(feature_values[fname])
    n = len(vals)
    feature_medians[fname] = vals[n // 2] if n > 0 else 0.0

# ──────────────────────────────────────────────────────────
# 5. Z-score normalisering PER SÄSONG
# ──────────────────────────────────────────────────────────

# Samla features per säsong
season_feature_data = defaultdict(list)
for (team, season), feats in club_season_features.items():
    row = []
    for fname in FEATURE_NAMES:
        val = feats.get(fname)
        if val is None:
            val = feature_medians[fname]
        row.append(val)
    season_feature_data[season].append((team, row))

# Beräkna säsongsmedel + std per feature
season_stats = {}
for season, entries in season_feature_data.items():
    matrix = [row for _, row in entries]
    means = [sum(col[i] for col in matrix) / len(matrix) for i in range(len(FEATURE_NAMES))]
    stds = []
    for i in range(len(FEATURE_NAMES)):
        variance = sum((col[i] - means[i]) ** 2 for col in matrix) / len(matrix)
        stds.append(math.sqrt(variance) if variance > 0 else 1.0)
    season_stats[season] = {"means": means, "stds": stds}

# Bygg z-score matrix
keys = list(club_season_features.keys())
raw_vectors = []
for (team, season) in keys:
    feats = club_season_features[(team, season)]
    row = []
    for fname in FEATURE_NAMES:
        val = feats.get(fname)
        if val is None:
            val = feature_medians[fname]
        row.append(val)
    raw_vectors.append(row)

z_vectors = []
for i, (team, season) in enumerate(keys):
    raw_row = raw_vectors[i]
    stats = season_stats[season]
    z_row = [(raw_row[j] - stats["means"][j]) / stats["stds"][j] for j in range(len(FEATURE_NAMES))]
    z_vectors.append(z_row)

X = np.array(z_vectors)
print(f"\nFeature matrix shape: {X.shape}")

# ──────────────────────────────────────────────────────────
# 6. K-means för k ∈ {3, 4, 5, 6}
# ──────────────────────────────────────────────────────────

print("\n--- K-means silhouette scores ---")
silhouette_scores = {}
kmeans_models = {}
for k in [3, 4, 5, 6]:
    km = KMeans(n_clusters=k, random_state=42, n_init=20)
    labels = km.fit_predict(X)
    sil = silhouette_score(X, labels)
    silhouette_scores[k] = sil
    kmeans_models[k] = (km, labels)
    print(f"  k={k}: silhouette={sil:.4f}")

# Val av k — höst silhouette + tolkbarhet
best_k = max(silhouette_scores, key=silhouette_scores.get)
best_sil = silhouette_scores[best_k]

# Kontrollera om det finns ett k med liknande score men bättre tolkbarhet
# Om skillnaden är <0.03 från näst bästa, välj det med mer kluster (4) för distinktion
chosen_k = best_k
rationale = f"k={chosen_k} ger högst silhouette score ({best_sil:.4f})."

# Om k=3 och k=4 är nära — välj k=4 för mer granularitet
if best_k == 3:
    sil_4 = silhouette_scores[4]
    if best_sil - sil_4 < 0.03:
        chosen_k = 4
        rationale = (f"k=3 och k=4 skiljer <0.03 i silhouette ({silhouette_scores[3]:.4f} vs {sil_4:.4f}). "
                     f"k=4 valdes för bättre tolkbarhet — ger mer distinkta spelstilstyper.")

print(f"\nValt k={chosen_k}. Motivering: {rationale}")

km_chosen, labels_chosen = kmeans_models[chosen_k]

# ──────────────────────────────────────────────────────────
# 7. Karaktärisera klustren
# ──────────────────────────────────────────────────────────

cluster_members = defaultdict(list)
for i, (team, season) in enumerate(keys):
    cluster_members[labels_chosen[i]].append((team, season))

# Centroider i z-space
centroids = km_chosen.cluster_centers_

# Back-transform till originalskala (global medel + global std per feature)
# Vi använder global medel och std (inte per säsong) för tolkbara raw-värden
global_means = [sum(feature_values[fn]) / len(feature_values[fn]) for fn in FEATURE_NAMES]
global_stds = []
for fn in FEATURE_NAMES:
    vals = feature_values[fn]
    mean = global_means[FEATURE_NAMES.index(fn)]
    var = sum((v - mean) ** 2 for v in vals) / len(vals)
    global_stds.append(math.sqrt(var) if var > 0 else 1.0)

def describe_cluster(cluster_id, members, centroid):
    """Generera ett beskrivande namn baserat på z-score-profil."""
    profile = dict(zip(FEATURE_NAMES, centroid))

    signals = []
    if profile["avg_goals_for"] > 0.4:
        signals.append("offensivt produktiv")
    elif profile["avg_goals_for"] < -0.4:
        signals.append("låg offensiv output")

    if profile["avg_goals_against"] > 0.4:
        signals.append("öppet defensivt")
    elif profile["avg_goals_against"] < -0.4:
        signals.append("defensivt stabilt")

    if profile["avg_corners"] > 0.4:
        signals.append("hög hörnfrekvens")
    elif profile["avg_corners"] < -0.4:
        signals.append("låg hörnfrekvens")

    if profile["corner_goal_pct"] > 0.4:
        signals.append("hörnberoende")
    elif profile["corner_goal_pct"] < -0.4:
        signals.append("öppet-spel-orienterat")

    if profile["avg_fouls"] > 0.4:
        signals.append("hög utvisningstakt")
    elif profile["avg_fouls"] < -0.4:
        signals.append("disciplinerat")

    if profile["home_minus_away_win"] > 0.4:
        signals.append("stark hemmafördel")
    elif profile["home_minus_away_win"] < -0.4:
        signals.append("bortastark")

    if profile["comeback_freq"] is not None and profile["comeback_freq"] > 0.4:
        signals.append("comeback-benäget")
    if profile["late_goal_diff"] > 0.4:
        signals.append("sent avgörande")

    if not signals:
        signals.append("medelmåttigt allround")

    return ", ".join(signals[:3])

# Dominant clubs (≥60% av säsonger i detta kluster)
def find_dominant_clubs(members_by_cluster):
    """Hitta klubbar som ≥60% av sina säsonger hamnar i samma kluster."""
    club_cluster_count = defaultdict(lambda: defaultdict(int))
    club_total = defaultdict(int)
    for cid, members in members_by_cluster.items():
        for (team, season) in members:
            club_cluster_count[team][cid] += 1
            club_total[team] += 1

    dominant = defaultdict(list)
    for team, cluster_counts in club_cluster_count.items():
        total = club_total[team]
        for cid, cnt in cluster_counts.items():
            if cnt / total >= 0.60:
                dominant[cid].append(team)
    return dominant

dominant_clubs = find_dominant_clubs(cluster_members)

# Visa kluster-summary
print("\n--- Kluster-summary ---")
for cid in range(chosen_k):
    members = cluster_members[cid]
    centroid = centroids[cid]
    profile = dict(zip(FEATURE_NAMES, centroid))
    dom_clubs = dominant_clubs.get(cid, [])
    desc = describe_cluster(cid, members, centroid)

    print(f"\nKluster {cid} ({len(members)} klubb-säsonger): {desc}")
    print(f"  Dominerande klubbar (≥60%): {', '.join(sorted(dom_clubs)) if dom_clubs else 'ingen'}")
    print(f"  Profil (z-scores > |0.3|):")
    for fn, z in profile.items():
        if abs(z) > 0.25:
            raw_val = global_means[FEATURE_NAMES.index(fn)] + z * global_stds[FEATURE_NAMES.index(fn)]
            print(f"    {fn}: z={z:+.2f} (raw≈{raw_val:.3f})")

# ──────────────────────────────────────────────────────────
# 8. Namnge klustren
# ──────────────────────────────────────────────────────────

def name_cluster(cid, centroid):
    """Ge klustret ett kort, beskrivande namn baserat på huvudprofilen."""
    p = dict(zip(FEATURE_NAMES, centroid))

    # Primärdimensioner i prioritetsordning
    if p["goal_diff"] > 0.5 and p["avg_goals_for"] > 0.4:
        if p["corner_goal_pct"] > 0.3:
            return "Hörnstarka vinnare"
        return "Offensiva topplag"
    if p["goal_diff"] < -0.5 and p["avg_goals_against"] > 0.4:
        return "Öppna bottenlag"
    if p["avg_fouls"] > 0.4 and p["avg_corners"] > 0.3:
        return "Aggressiva pressande"
    if p["home_minus_away_win"] > 0.4:
        return "Hemmaplansstarka"
    if p["avg_fouls"] < -0.3 and p["avg_goals_against"] < -0.2:
        return "Disciplinerade defensiva"
    if p["corner_goal_pct"] > 0.4:
        return "Hörnberoende"
    if p["comeback_freq"] is not None and p["comeback_freq"] > 0.4:
        return "Comeback-lag"
    if p["late_goal_diff"] > 0.4:
        return "Sent avgörande"
    if p["avg_goals_for"] < -0.3 and p["avg_corners"] < -0.2:
        return "Lågt tempo, taktiskt"
    return "Allroundat mittfält"

cluster_names = {cid: name_cluster(cid, centroids[cid]) for cid in range(chosen_k)}
print("\n--- Klusternamn ---")
for cid, name in cluster_names.items():
    print(f"  Kluster {cid}: {name}")

# ──────────────────────────────────────────────────────────
# 9. Bygg output JSON
# ──────────────────────────────────────────────────────────

def back_transform(z_centroid):
    """Backtransform centroid från z-space till råskala med globala stats."""
    return {
        FEATURE_NAMES[i]: round(global_means[i] + z_centroid[i] * global_stds[i], 4)
        for i in range(len(FEATURE_NAMES))
    }

def z_profile(centroid):
    return {FEATURE_NAMES[i]: round(float(centroid[i]), 4) for i in range(len(FEATURE_NAMES))}

clusters_out = []
for cid in range(chosen_k):
    members = cluster_members[cid]
    centroid = centroids[cid]
    dom_clubs = sorted(dominant_clubs.get(cid, []))

    clusters_out.append({
        "id": cid,
        "name": cluster_names[cid],
        "n_club_seasons": len(members),
        "mean_profile": z_profile(centroid),
        "mean_profile_raw": back_transform(centroid),
        "dominant_clubs": dom_clubs,
        "club_seasons": [{"team": t, "season": s} for t, s in sorted(members)],
    })

# all_club_seasons
all_cs = []
for i, (team, season) in enumerate(keys):
    feats = club_season_features[(team, season)]
    all_cs.append({
        "team": team,
        "season": season,
        "cluster": int(labels_chosen[i]),
        "features": {fn: round(feats.get(fn) or feature_medians[fn], 4) for fn in FEATURE_NAMES},
    })
all_cs.sort(key=lambda x: (x["team"], x["season"]))

output = {
    "_meta": {
        "description": "Spelstilsklustring av klubbar, Elitserien herr 2019-2026",
        "n_club_seasons": len(keys),
        "n_clubs": len(valid_clubs),
        "chosen_k": chosen_k,
        "k_selection_rationale": rationale,
        "silhouette_scores": {str(k): round(v, 4) for k, v in silhouette_scores.items()},
        "features": FEATURE_NAMES,
        "min_matches_per_club_season": MIN_MATCHES,
        "min_seasons_per_club": MIN_SEASONS,
    },
    "clusters": clusters_out,
    "all_club_seasons": all_cs,
}

with open(OUTPUT_PATH, "w") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n✓ Skrivet: {OUTPUT_PATH}")

# ──────────────────────────────────────────────────────────
# 10. Konsistensstats — klubbar i samma kluster ≥80% av tid
# ──────────────────────────────────────────────────────────

print("\n--- Konsistenta klubbar (≥80% i samma kluster) ---")
club_cluster_count = defaultdict(lambda: defaultdict(int))
club_total = defaultdict(int)
for i, (team, season) in enumerate(keys):
    cid = int(labels_chosen[i])
    club_cluster_count[team][cid] += 1
    club_total[team] += 1

consistent = []
for team, counts in club_cluster_count.items():
    total = club_total[team]
    best_cid = max(counts, key=counts.get)
    best_cnt = counts[best_cid]
    pct = best_cnt / total
    if pct >= 0.80:
        consistent.append((pct, team, best_cid, best_cnt, total))

consistent.sort(reverse=True)
for pct, team, cid, cnt, total in consistent:
    print(f"  {team}: {cnt}/{total} säsonger i kluster {cid} ({cluster_names[cid]}) — {pct:.0%}")

print(f"\nSilhouette-scores: {silhouette_scores}")
print(f"Valt k: {chosen_k}, silhouette: {silhouette_scores[chosen_k]:.4f}")
