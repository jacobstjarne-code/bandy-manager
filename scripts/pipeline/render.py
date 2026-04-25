"""
Renders a finding dict to an Astro page file.
"""

from datetime import date
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
FINDINGS_DIR = REPO_ROOT / "bandy-brain" / "src" / "pages" / "findings"


def next_finding_number() -> int:
    existing = [
        int(d.name)
        for d in FINDINGS_DIR.iterdir()
        if d.is_dir() and d.name.isdigit()
    ]
    return max(existing, default=0) + 1


def render_finding(finding: dict, num: int) -> str:
    """Return Astro file content for a finding."""
    num_str = str(num).zfill(3)
    today = date.today()
    date_sv = _sv_date(today)

    title1 = finding.get("title", "Ny finding")
    title2 = finding.get("title_line2")
    description = finding.get("description", "")
    fragan = finding.get("fragan", "")
    datan = finding.get("datan", "")
    fynd = finding.get("fynd", "")
    tolkning_raw = finding.get("tolkning", "")
    begransningar = finding.get("begransningar", [])
    vidare = finding.get("vidare_fragor", [])
    key_numbers = finding.get("key_numbers", [])
    source_facts = finding.get("source_facts", [])

    # Tolkning: split on \n\n into <p> blocks
    tolkning_paras = "\n".join(
        f"      <p>{p.strip()}</p>"
        for p in tolkning_raw.split("\n\n")
        if p.strip()
    )

    begr_items = "\n".join(f"        <li>{b}</li>" for b in begransningar)
    vidare_items = "\n".join(f"        <li>{v}</li>" for v in vidare)

    # Key numbers block
    key_numbers_block = ""
    if key_numbers:
        def _kn_note(kn):
            return f'<span class="key-number__note">{kn["note"]}</span>' if kn.get("note") else ""
        items = "\n".join(
            f'          <div class="key-number"><span class="key-number__value">{kn["value"]}</span>'
            f'<span class="key-number__label">{kn["label"]}</span>'
            f'{_kn_note(kn)}'
            f"</div>"
            for kn in key_numbers
        )
        key_numbers_block = f"""
    <div class="key-numbers">
{items}
    </div>

    <hr class="finding-divider" />
"""

    # Sources
    if source_facts:
        source_links = "\n        ".join(
            f'<a href={{factHref("{fid}")}} class="fact-ref">{fid}</a>'
            for fid in source_facts
        )
        sources_block = f"""
    <div class="finding-sources-list">
      <p style="font-family: var(--font-ui); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">
        Källor i denna finding
      </p>
      <p>
        {source_links}
      </p>
    </div>
"""
    else:
        sources_block = ""

    title_h1 = f"{title1}<br>{title2}" if title2 else title1

    return f"""---
import Base from '../../../layouts/Base.astro';
import {{ factHref }} from '../../../lib/facts';
const base = import.meta.env.BASE_URL.replace(/\\/$/, '');
---

<Base
  title="Finding {num_str} — {title1}"
  description="{description}"
>
  <div class="finding-layout">

    <a href={{`${{base}}/findings/`}} class="back-link">← Alla findings</a>

    <p class="finding-meta">Finding {num_str} · {date_sv}</p>
    <h1 class="finding-title">{title_h1}</h1>

    <hr class="finding-divider" />
{key_numbers_block}
    <div class="finding-section prose">
      <p class="finding-section-label">Frågan</p>
      <p>{fragan}</p>
    </div>

    <hr class="finding-divider" />

    <div class="finding-section prose">
      <p class="finding-section-label">Datan</p>
      {datan}
    </div>

    <hr class="finding-divider" />

    <div class="finding-section prose">
      <p class="finding-section-label">Vad vi fann</p>
      {fynd}
    </div>

    <hr class="finding-divider" />

    <div class="finding-section prose">
      <p class="finding-section-label">Tolkning</p>
{tolkning_paras}
    </div>

    <hr class="finding-divider" />

    <div class="finding-section prose">
      <p class="finding-section-label">Begränsningar</p>
      <ul>
{begr_items}
      </ul>
    </div>

    <hr class="finding-divider" />

    <div class="finding-section prose">
      <p class="finding-section-label">Vidare frågor</p>
      <ul>
{vidare_items}
      </ul>
    </div>
{sources_block}
    <div class="finding-feedback">
      <a
        href={{`https://github.com/jacobstjarne-code/bandy-manager/issues/new?labels=finding-feedback&title=Finding+{num_str}:+%F0%9F%91%8D&body=Bra+finding!`}}
        class="feedback-btn feedback-btn--up"
        target="_blank"
        rel="noopener"
      >👍</a>
      <a
        href={{`https://github.com/jacobstjarne-code/bandy-manager/issues/new?labels=finding-feedback&title=Finding+{num_str}:+%F0%9F%91%8E&body=Vad+stämmer+inte?`}}
        class="feedback-btn feedback-btn--down"
        target="_blank"
        rel="noopener"
      >👎</a>
    </div>

  </div>
</Base>
"""


def write_finding(finding: dict, num: int) -> Path:
    num_str = str(num).zfill(3)
    out_dir = FINDINGS_DIR / num_str
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / "index.astro"
    out_path.write_text(render_finding(finding, num), encoding="utf-8")
    return out_path


def update_findings_index(findings_meta: list[dict]) -> None:
    """Rewrite the findings index page with all findings."""
    index_path = FINDINGS_DIR / "index.astro"
    def _esc(s):
        return s.replace("'", "\\'")
    items = "\n".join(
        f"      {{ num: '{f['num']}', date: '{f['date']}', title: '{_esc(f['title'])}', excerpt: '{_esc(f['excerpt'])}' }},"
        for f in findings_meta
    )
    content = f"""---
import Base from '../../layouts/Base.astro';
const base = import.meta.env.BASE_URL.replace(/\\/$/, '');

const findings = [
{items}
];
---

<Base title="Findings">
  <div class="page-container">
    <h1 style="font-family: var(--font-ui); font-size: 1.5rem; font-weight: 700; margin-bottom: 2rem;">
      Findings
    </h1>
    <p style="max-width: 560px; color: var(--color-muted); font-size: 0.95rem; margin-bottom: 2.5rem; font-family: var(--font-ui);">
      En finding är en rapport om ett specifikt fenomen i bandy — baserad på
      Bandygrytans verkliga matchdata och Bandy Managers simuleringsmotor.
    </p>

    <ul class="findings-list">
      {{findings.map(f => (
        <li>
          <div class="finding-card">
            <p class="finding-card__number">Finding {{f.num}} · {{f.date}}</p>
            <h2 class="finding-card__title">
              <a href={{`${{base}}/findings/${{f.num}}/`}}>{{f.title}}</a>
            </h2>
            <p class="finding-card__excerpt">{{f.excerpt}}</p>
          </div>
        </li>
      ))}}
    </ul>
  </div>
</Base>
"""
    index_path.write_text(content, encoding="utf-8")


def _sv_date(d: date) -> str:
    months = ["januari","februari","mars","april","maj","juni",
              "juli","augusti","september","oktober","november","december"]
    return f"{d.day} {months[d.month-1]} {d.year}"
