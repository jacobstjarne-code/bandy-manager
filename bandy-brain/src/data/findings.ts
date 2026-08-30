// Findings-index — enda sanningskälla, laddad från findings.yaml vid bygget.
// findings/index.astro och pages/index.astro renderar från denna; inga hårdkodade
// titlar i sidorna.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';

export type FindingStatus = 'active' | 'superseded' | 'corrected';

export interface Finding {
  num: string;
  title: string;
  date: string;
  status: FindingStatus;
  superseded_by?: string | null;
  excerpt?: string;
  verified_by?: string | null;
  verified_at?: string | null;
}

// process.cwd() vid Astro-bygget = bandy-brain/-roten (samma mönster som lib/facts.ts).
const yamlPath = resolve(process.cwd(), 'src/data/findings.yaml');
const raw = yaml.load(readFileSync(yamlPath, 'utf8')) as Finding[];

// Sortera fallande på num (nyast först) — oberoende av ordning i YAML-filen.
export const findings: Finding[] = [...raw].sort((a, b) => b.num.localeCompare(a.num));

// Senaste finding (nyast, oavsett status).
export const latestFinding: Finding = findings[0];

// Badge-etikett per status (null för active → ingen badge).
export function statusBadge(status: FindingStatus): string | null {
  if (status === 'superseded') return 'Ersatt';
  if (status === 'corrected') return 'Korrigerad';
  return null;
}
