"""Hanterar GitHub Issues med label review-flagged."""
import os
import re
from pathlib import Path
from datetime import date


def handle_review_flags(github_token: str, repo: str) -> int:
    """Hämtar öppna review-flagged issues och sparar dem i REVIEW_FLAGS.md.
    Returnerar antal nya flaggor."""
    import urllib.request, json

    url = f"https://api.github.com/repos/{repo}/issues?labels=review-flagged&state=open&per_page=50"
    req = urllib.request.Request(url, headers={
        'Authorization': f'token {github_token}',
        'Accept': 'application/vnd.github.v3+json'
    })
    try:
        with urllib.request.urlopen(req) as resp:
            issues = json.loads(resp.read())
    except Exception as e:
        print(f"  review_flags: kunde inte hämta issues: {e}")
        return 0

    if not issues:
        return 0

    flags_file = Path(__file__).resolve().parent.parent.parent / "docs/findings/REVIEW_FLAGS.md"

    existing = flags_file.read_text(encoding="utf-8") if flags_file.exists() else "# Review Flags\n\n"

    new_count = 0
    for issue in issues:
        issue_ref = f"issue-{issue['number']}"
        if issue_ref not in existing:
            entry = f"\n## {date.today()} — #{issue['number']}: {issue['title']}\n"
            entry += f"URL: {issue['html_url']}\n"
            entry += f"Body: {(issue.get('body') or '')[:500]}\n"
            entry += f"Status: flaggad, väntar på manuell granskning\n"
            existing += entry
            new_count += 1

    if new_count > 0:
        flags_file.write_text(existing, encoding="utf-8")

    return new_count
