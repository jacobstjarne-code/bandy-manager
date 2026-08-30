// Findings-index — enda sanningskälla, laddad från findings.yaml vid bygget.
// findings/index.astro och pages/index.astro renderar från denna; inga hårdkodade
// titlar i sidorna.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import { editorialReview } from './editorial-review';

export type FindingStatus = 'active' | 'superseded' | 'corrected';
export type EditorialStatus = 'core' | 'support' | 'open_thread' | 'superseded' | 'manager_lab';

export interface Finding {
  num: string;
  title: string;
  date: string;
  status: FindingStatus;
  editorial_status: EditorialStatus;
  canonical_finding?: string | null;
  correction_required?: boolean;
  superseded_by?: string | null;
  excerpt?: string;
  verified_by?: string | null;
  verified_at?: string | null;
}

// process.cwd() vid Astro-bygget = bandy-brain/-roten (samma mönster som lib/facts.ts).
const yamlPath = resolve(process.cwd(), 'src/data/findings.yaml');
const raw = yaml.load(readFileSync(yamlPath, 'utf8')) as Omit<Finding, 'editorial_status'>[];

// Sortera fallande på num (nyast först) — oberoende av ordning i YAML-filen.
export const findings: Finding[] = raw
  .map((finding) => {
    const review = editorialReview[finding.num];
    if (!review) throw new Error(`Redaktionell bedömning saknas för finding ${finding.num}`);
    return {
      ...finding,
      editorial_status: review.status,
      canonical_finding: review.canonicalFinding,
      correction_required: review.correctionRequired,
    };
  })
  .sort((a, b) => b.num.localeCompare(a.num));

// Senaste finding (nyast, oavsett status).
export const latestFinding: Finding = findings[0];

// Badge-etikett per status (null för active → ingen badge).
export function statusBadge(status: FindingStatus): string | null {
  if (status === 'superseded') return 'Ersatt';
  if (status === 'corrected') return 'Korrigerad';
  return null;
}

export function editorialStatusLabel(status: EditorialStatus): string {
  const labels: Record<EditorialStatus, string> = {
    core: 'Kärna',
    support: 'Stöd',
    open_thread: 'Öppet spår',
    superseded: 'Ersatt',
    manager_lab: 'Bandy Manager Lab',
  };
  return labels[status];
}
