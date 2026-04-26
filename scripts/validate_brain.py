#!/usr/bin/env python3
"""
Bandy-Brain Validator — Pass 3
Validates all YAML facts against declared invariants.

Usage:
  python3 scripts/validate_brain.py           # print report to stdout
  python3 scripts/validate_brain.py --report  # also write AUDIT_PASS_3_YYYY-MM-DD.md

Exit codes:
  0  All checks passed (or only manual items remain)
  1  One or more invariants failed
  2  Structural errors in YAML (missing fields, bad IDs, etc.)
"""

import sys
import re
import glob
import yaml
from pathlib import Path
from datetime import date as Date

REPO_ROOT = Path(__file__).resolve().parent.parent
FACTS_ROOT = REPO_ROOT / "docs/findings/facts"
HYPO_ROOT = REPO_ROOT / "docs/findings/hypotheses"
BRAIN_FINDINGS_DIR = REPO_ROOT / "bandy-brain" / "src" / "pages" / "findings"
SRC_ROOT = REPO_ROOT / "src"
AUDIT_DIR = REPO_ROOT / "docs/findings"

REQUIRED_FIELDS = ["fact_id", "category", "claim", "verified_at", "verified_by", "status"]
VALID_CATEGORIES = {"rules", "stats", "design_principles", "world_canon", "hypothesis", "questions"}
VALID_STATUSES = {"active", "deprecated", "disputed", "open", "answered", "closed"}
VALID_VERIFIED_BY = {"opus", "code", "jacob", "erik"}
FACT_ID_RE = re.compile(r"^[RSDWHQ]\d{3}$")

# Q-facts: obligatoriska fält utöver REQUIRED_FIELDS
Q_REQUIRED_FIELDS = ["spawned_by", "spawned_at"]
# Max dagar en Q-fact kan vara öppen innan varning
Q_OPEN_WARNING_DAYS = 90
CROSS_REF_RE = re.compile(r"\b([RSDWH]\d{3})\.value\b")

# Type-3 grep checks.
# mode "should_not_find": pattern found in src → violation
# mode "should_find":     pattern NOT found → violation
TYPE3_CHECKS = {
    "no_code_path_grants_3_points_for_win": {
        "desc": "Ingen kod ger 3 poäng för vinst",
        "patterns": [r"\bpoints\s*[+]=\s*3\b", r"\bpoints\s*=\s*3\b", r"winPoints.*[^0-9]3[^0-9]"],
        "mode": "should_not_find",
        "ext": [".ts", ".tsx"],
        "note": "Söker efter '+=3' eller '= 3' nära 'points'/'winPoints'",
    },
    "no_code_path_allows_more_than_11_outfield_plus_gk": {
        "desc": "Max 11 spelare på plan",
        "patterns": [r"onField\s*[>]=?\s*1[2-9]", r"maxOnPitch\s*=\s*1[2-9]"],
        "mode": "should_not_find",
        "ext": [".ts", ".tsx"],
        "note": "Söker efter explicita konstanter > 11 för spelare på plan",
    },
    "no_code_path_allows_elite_squad_larger_than_16": {
        "desc": "Elitserie-trupp ej > 16 spelare",
        "patterns": [r"squadLimit\s*=\s*1[7-9]", r"maxSquad\s*=\s*1[7-9]", r"MAX_SQUAD\s*=\s*1[7-9]"],
        "mode": "should_not_find",
        "ext": [".ts", ".tsx"],
        "note": "Söker efter explicita gränser > 16 för truppen",
    },
    "no_code_path_removes_offside_logic": {
        "desc": "Offside-logik finns i koden",
        "patterns": [r"offside", r"Offside"],
        "mode": "should_find",
        "ext": [".ts", ".tsx"],
        "note": "Verifierar att offside-kod existerar — inte att logiken är korrekt",
    },
    "no_code_path_simulates_match_duration_other_than_2x45": {
        "desc": "Matchlängd 2×45 min",
        "patterns": [r"\b45\b"],
        "mode": "should_find",
        "ext": [".ts"],
        "restrict": "src/domain/services",
        "note": "Verifierar att konstanten 45 finns i matchlogiken",
    },
}


# ── Ladda facts ─────────────────────────────────────────────────────────────

def load_all_facts():
    facts = {}
    file_map = {}
    for search_root in [FACTS_ROOT, HYPO_ROOT]:
        for yaml_file in sorted(Path(search_root).rglob("*.yaml")):
            with open(yaml_file, encoding="utf-8") as f:
                data = yaml.safe_load(f)
            if data and "fact_id" in data:
                fid = data["fact_id"]
                if fid in facts:
                    print(f"VARNING: Dubblett fact_id '{fid}' i {yaml_file}", file=sys.stderr)
                facts[fid] = data
                file_map[fid] = yaml_file
    return facts, file_map


def _grep_astro_for_answers(q_id: str) -> bool:
    """
    Check if any finding's index.astro contains <!-- answers: Q{NNN} -->.
    Simple grep-based two-way link check.
    """
    if not BRAIN_FINDINGS_DIR.exists():
        return False
    pattern = re.compile(rf"<!--\s*answers:\s*{re.escape(q_id)}\s*-->", re.IGNORECASE)
    for astro_file in BRAIN_FINDINGS_DIR.rglob("index.astro"):
        try:
            if pattern.search(astro_file.read_text(encoding="utf-8", errors="ignore")):
                return True
        except Exception:
            pass
    return False


# ── Strukturvalidering ───────────────────────────────────────────────────────

CLOSED_STATUSES = {"deprecated"}
OPEN_H_STATUSES = {"testable", "active"}


def validate_structure(fact):
    errors = []
    warnings = []
    fid = fact.get("fact_id", "MISSING")

    for field in REQUIRED_FIELDS:
        if field not in fact:
            errors.append(f"Saknar fält: '{field}'")

    if not FACT_ID_RE.match(str(fid)):
        errors.append(f"fact_id '{fid}' matchar inte [RSDWH]\\d{{3}}")

    cat = fact.get("category", "")
    if cat not in VALID_CATEGORIES:
        errors.append(f"Ogiltig category: '{cat}'")

    status = fact.get("status", "")
    if status not in VALID_STATUSES:
        errors.append(f"Ogiltig status: '{status}'")

    vby = fact.get("verified_by", "")
    if vby not in VALID_VERIFIED_BY:
        errors.append(f"Ogiltig verified_by: '{vby}'")

    # H-fact specific validation
    if cat == "hypothesis" or str(fid).startswith("H"):
        # Open hypotheses (testable/active) must have predicted_value and test_method
        if status in OPEN_H_STATUSES:
            if "predicted_value" not in fact:
                warnings.append(f"H-fact med status '{status}' saknar 'predicted_value' — hypotesen kan inte testas")
            if "test_method" not in fact:
                warnings.append(f"H-fact med status '{status}' saknar 'test_method' — hypotesen kan inte testas")

        # Closed hypotheses (deprecated) must have closed_at, closed_by, closed_with
        if status in CLOSED_STATUSES:
            for field in ("closed_at", "closed_by", "closed_with"):
                if field not in fact:
                    errors.append(f"Stängd H-fact saknar obligatoriskt fält: '{field}'")

    # Q-fact specific validation
    if cat == "questions" or str(fid).startswith("Q"):
        # Obligatoriska Q-fält
        for field in Q_REQUIRED_FIELDS:
            if field not in fact:
                errors.append(f"Q-fact saknar obligatoriskt fält: '{field}'")

        # Svarad Q måste ha answered_by
        if status == "answered" and "answered_by" not in fact:
            errors.append("Q-fact med status 'answered' saknar 'answered_by'")

        # Varning om Q är öppen längre än 90 dagar
        if status == "open":
            spawned_at = fact.get("spawned_at")
            if spawned_at:
                try:
                    from datetime import date as _date
                    if isinstance(spawned_at, str):
                        spawned_date = _date.fromisoformat(spawned_at)
                    else:
                        spawned_date = spawned_at  # already a date object from YAML
                    age_days = (_date.today() - spawned_date).days
                    if age_days > Q_OPEN_WARNING_DAYS:
                        warnings.append(
                            f"Q-fact har varit öppen i {age_days} dagar (>{Q_OPEN_WARNING_DAYS}) — "
                            f"överväg att besvara eller markera som deprecated"
                        )
                except (ValueError, TypeError):
                    pass

        # Tvåvägslänk-check: om answered, kontrollera att finding-sidan har <!-- answers: Q{id} -->
        if status == "answered":
            answered_by = fact.get("answered_by", "")
            # Extract finding number from "finding:NNN" or plain "NNN"
            m = re.match(r"(?:finding:)?(\d+)", str(answered_by))
            if m:
                finding_num = m.group(1).zfill(3)
                if not _grep_astro_for_answers(fid):
                    warnings.append(
                        f"Tvåvägslänk saknas: finding:{finding_num}/index.astro "
                        f"innehåller inte '<!-- answers: {fid} -->'"
                    )

        # Kontroll 1 — closed_reason obligatorisk vid status: closed
        if status == "closed" and not fact.get("closed_reason"):
            errors.append(f"status=closed saknar closed_reason")

        # Kontroll 3 — data_required obligatorisk vid data_unavailable
        if fact.get("closed_reason") == "data_unavailable" and not fact.get("data_required"):
            errors.append("closed_reason=data_unavailable saknar data_required")

    return errors, warnings


# ── Invariant-evaluering ─────────────────────────────────────────────────────

FLOAT_TOLERANCE = 0.015  # täcker avrundningsfel i rådata

def _safe_eval(expr):
    """Evaluate a pure math/comparison expression without builtins."""
    return eval(expr, {"__builtins__": {}}, {})  # noqa: S307


def eval_invariant(inv_str, fact, all_facts):
    """
    Returns (result, detail):
      True   → passed
      False  → failed
      None   → unimplemented / manual review
    """
    # Type 3
    if inv_str.startswith("no_code_path_"):
        return run_type3(inv_str)

    expr = inv_str
    own_value = fact.get("value")

    # Substitute cross-fact references: S002.value → repr(4.88)
    cross_ids = CROSS_REF_RE.findall(expr)
    for ref_id in cross_ids:
        if ref_id not in all_facts:
            return None, f"Okänd referens: {ref_id}"
        ref_val = all_facts[ref_id].get("value")
        if ref_val is None:
            return None, f"{ref_id} saknar value-fält"
        expr = expr.replace(f"{ref_id}.value", repr(ref_val))

    # Substitute own 'value'
    if re.search(r"\bvalue\b", expr):
        if own_value is None:
            return False, f"Invariant refererar 'value' men factet saknar value-fält"
        expr = re.sub(r"\bvalue\b", repr(own_value), expr)

    # Evaluate
    try:
        result = _safe_eval(expr)
        if result:
            return True, "OK"
        # Expression evaluated to False — check float tolerance before declaring failure
        if "==" in expr:
            parts = expr.split("==")
            if len(parts) == 2:
                try:
                    lhs = _safe_eval(parts[0].strip())
                    rhs = _safe_eval(parts[1].strip())
                    if isinstance(lhs, (int, float)) and isinstance(rhs, (int, float)):
                        diff = abs(lhs - rhs)
                        if diff < FLOAT_TOLERANCE:
                            return True, f"OK (float-tolerans, diff={diff:.6f})"
                        return False, f"FAILED: {lhs} ≠ {rhs} (diff={diff:.6f})"
                except Exception:
                    pass
        return False, f"FAILED: {inv_str}  →  {expr}  →  {result}"
    except Exception as exc:
        return None, f"EVAL-FEL: {exc}  |  uttryck: {expr}"


def run_type3(inv_str):
    check = TYPE3_CHECKS.get(inv_str)
    if not check:
        return None, f"Ej implementerad typ-3: {inv_str}"

    restrict = check.get("restrict")
    search_root = REPO_ROOT / restrict if restrict else SRC_ROOT
    extensions = check.get("ext", [".ts", ".tsx"])

    files = []
    for ext in extensions:
        files.extend(search_root.rglob(f"*{ext}"))

    matched = []
    for filepath in files:
        try:
            content = filepath.read_text(encoding="utf-8", errors="ignore")
            for pattern in check["patterns"]:
                if re.search(pattern, content, re.IGNORECASE):
                    matched.append(str(filepath.relative_to(REPO_ROOT)))
                    break
        except Exception:
            pass

    note = f"  [{check['note']}]" if check.get("note") else ""
    if check["mode"] == "should_not_find":
        if matched:
            return False, f"VIOLATION — mönster hittat i: {', '.join(matched[:3])}{note}"
        return True, f"OK — mönster ej funnet{note}"
    else:  # should_find
        if matched:
            return True, f"OK — mönster hittat i: {matched[0]}{note}"
        return False, f"VIOLATION — mönster saknas i {search_root.relative_to(REPO_ROOT)}{note}"


# ── Rapport ──────────────────────────────────────────────────────────────────

def run_validation(facts, file_map):
    results = {}  # fact_id → {struct_errors, struct_warnings, invariant_results}

    for fid, fact in sorted(facts.items()):
        struct_errors, struct_warnings = validate_structure(fact)
        inv_results = []

        # Kör invarianter bara för aktiva facts (inte Q-facts, de har inga invarianter)
        is_q = fact.get("category") == "questions" or str(fid).startswith("Q")
        if fact.get("status") == "active" and not is_q:
            for inv in fact.get("invariants", []):
                result, detail = eval_invariant(inv, fact, facts)
                inv_results.append((inv, result, detail))

        results[fid] = {
            "fact": fact,
            "file": file_map.get(fid),
            "struct_errors": struct_errors,
            "struct_warnings": struct_warnings,
            "inv_results": inv_results,
        }

    return results


def summarize(results):
    total = len(results)
    struct_ok = sum(1 for r in results.values() if not r["struct_errors"])
    struct_warn = sum(len(r.get("struct_warnings", [])) for r in results.values())
    inv_pass = inv_fail = inv_manual = inv_skip = 0

    for r in results.values():
        is_q = r["fact"].get("category") == "questions" or str(r["fact"].get("fact_id", "")).startswith("Q")
        if r["fact"].get("status") != "active" or is_q:
            inv_skip += 1
            continue
        for _, res, _ in r["inv_results"]:
            if res is True:
                inv_pass += 1
            elif res is False:
                inv_fail += 1
            else:
                inv_manual += 1

    return {
        "total": total,
        "struct_ok": struct_ok,
        "struct_fail": total - struct_ok,
        "struct_warn": struct_warn,
        "inv_pass": inv_pass,
        "inv_fail": inv_fail,
        "inv_manual": inv_manual,
        "inv_skip": inv_skip,
    }


def format_report(results, summary, as_markdown=False):
    lines = []
    H1 = "# " if as_markdown else "═══ "
    H2 = "## " if as_markdown else "─── "
    TICK = "✅" if as_markdown else "[OK]  "
    CROSS = "❌" if as_markdown else "[FAIL]"
    QUEST = "⚠️ " if as_markdown else "[MAN] "

    today = Date.today().isoformat()
    lines.append(f"{H1}Bandy-Brain Validator — {today}")
    lines.append("")

    # Sammanfattning
    s = summary
    lines.append(f"{H2}Sammanfattning")
    lines.append("")
    lines.append(f"Facts totalt:        {s['total']}")
    lines.append(f"Struktur OK:         {s['struct_ok']}/{s['total']}")
    if s['struct_fail']:
        lines.append(f"Struktur FAILED:     {s['struct_fail']}  ← ÅTGÄRDA")
    if s.get('struct_warn', 0):
        lines.append(f"Struktur VARNINGAR:  {s['struct_warn']}  ← granska")
    lines.append(f"Invarianter OK:      {s['inv_pass']}")
    lines.append(f"Invarianter FAILED:  {s['inv_fail']}" + ("  ← ÅTGÄRDA" if s['inv_fail'] else ""))
    lines.append(f"Manuell granskning:  {s['inv_manual']}")
    lines.append(f"Hoppade (deprecated):{s['inv_skip']}")
    lines.append("")

    overall = "RENT" if s['struct_fail'] == 0 and s['inv_fail'] == 0 else "PROBLEM HITTADE"
    lines.append(f"STATUS: **{overall}**" if as_markdown else f"STATUS: {overall}")
    lines.append("")

    # Fel-sektion (om det finns)
    failures = {
        fid: r for fid, r in results.items()
        if r["struct_errors"] or any(res is False for _, res, _ in r["inv_results"])
    }
    if failures:
        lines.append(f"{H2}Fel")
        lines.append("")
        for fid, r in sorted(failures.items()):
            lines.append(f"**{fid}** — {r['fact'].get('claim', '')[:60]}" if as_markdown
                         else f"  {fid}  {r['fact'].get('claim', '')[:60]}")
            for err in r["struct_errors"]:
                lines.append(f"  {CROSS} [STRUKTUR] {err}")
            for inv, res, detail in r["inv_results"]:
                if res is False:
                    lines.append(f"  {CROSS} {inv}")
                    lines.append(f"         → {detail}")
            lines.append("")

    # Varnings-sektion (H-fact saknar predicted_value / test_method)
    warned = {
        fid: r for fid, r in results.items()
        if r.get("struct_warnings")
    }
    if warned:
        lines.append(f"{H2}Varningar (H-facts)")
        lines.append("")
        for fid, r in sorted(warned.items()):
            lines.append(f"**{fid}** — {r['fact'].get('claim', '')[:60]}" if as_markdown
                         else f"  {fid}  {r['fact'].get('claim', '')[:60]}")
            for warn in r["struct_warnings"]:
                lines.append(f"  {QUEST} [VARNING] {warn}")
            lines.append("")

    # Manuella facts
    manuals = {
        fid: r for fid, r in results.items()
        if any(res is None for _, res, _ in r["inv_results"])
    }
    if manuals:
        lines.append(f"{H2}Manuell granskning krävs")
        lines.append("")
        for fid, r in sorted(manuals.items()):
            for inv, res, detail in r["inv_results"]:
                if res is None:
                    lines.append(f"  {QUEST} {fid}: {inv}")
                    lines.append(f"         → {detail}")
        lines.append("")

    # Alla aktiva facts — kompakt lista
    lines.append(f"{H2}Alla aktiva facts")
    lines.append("")
    if as_markdown:
        lines.append("| ID | Claim | Invarianter | Status |")
        lines.append("|----|-----------------------------------------|-------------|--------|")
    for fid, r in sorted(results.items()):
        fact = r["fact"]
        status = fact.get("status", "?")
        if status == "deprecated":
            continue
        claim = fact.get("claim", "")[:55]
        inv_count = len(r["inv_results"])
        inv_ok = sum(1 for _, res, _ in r["inv_results"] if res is True)
        inv_bad = sum(1 for _, res, _ in r["inv_results"] if res is False)
        inv_man = sum(1 for _, res, _ in r["inv_results"] if res is None)
        struct_tag = "" if not r["struct_errors"] else " ⚠STRUCT"
        warn_tag = " ⚠WARN" if r.get("struct_warnings") else ""

        if as_markdown:
            inv_summary = f"{inv_ok}✅" + (f" {inv_bad}❌" if inv_bad else "") + (f" {inv_man}⚠️" if inv_man else "")
            lines.append(f"| {fid} | {claim} | {inv_summary or '—'} | {status}{struct_tag}{warn_tag} |")
        else:
            inv_summary = f"{inv_ok}/{inv_count}" + (f" FAIL:{inv_bad}" if inv_bad else "") + (f" MAN:{inv_man}" if inv_man else "")
            lines.append(f"  {fid:5}  {claim:<55}  inv:{inv_summary}{struct_tag}{warn_tag}")

    lines.append("")
    return "\n".join(lines)


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    write_report = "--report" in sys.argv

    print("Laddar facts...", file=sys.stderr)
    facts, file_map = load_all_facts()
    print(f"  {len(facts)} facts laddade.", file=sys.stderr)

    print("Validerar...", file=sys.stderr)
    results = run_validation(facts, file_map)
    summary = summarize(results)

    # Stdout
    print(format_report(results, summary, as_markdown=False))

    # Markdown-fil
    if write_report:
        today = Date.today().isoformat()
        out_path = AUDIT_DIR / f"AUDIT_PASS_3_{today}.md"
        md = format_report(results, summary, as_markdown=True)
        out_path.write_text(md, encoding="utf-8")
        print(f"\nRapport skriven: {out_path.relative_to(REPO_ROOT)}", file=sys.stderr)

    # Exit-kod
    if summary["struct_fail"] > 0:
        sys.exit(2)
    if summary["inv_fail"] > 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
