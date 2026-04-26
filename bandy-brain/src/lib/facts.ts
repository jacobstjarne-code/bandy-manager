/**
 * facts.ts — Loads all YAML facts from docs/findings/facts/
 * Reads relative to the repo root so the Astro site can import
 * the same source-of-truth files without duplicating them.
 */

import { readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import yaml from 'js-yaml';

export interface FactSource {
  type: 'dataset' | 'rulebook' | 'design_decision' | 'observation' | 'derived';
  name?: string;
  match_count?: number;
  seasons?: string[];
  doc?: string;
  decided_by?: string;
}

export interface FactRevision {
  date: string;
  value: number | string;
  note: string;
}

export interface Fact {
  fact_id: string;
  category: 'rules' | 'stats' | 'design_principles' | 'world_canon' | 'hypothesis';
  claim: string;
  value?: number | string | number[];
  unit?: string;
  source?: FactSource;
  verified_at: string;
  verified_by: string;
  status: 'active' | 'deprecated' | 'disputed';
  invariants?: string[];
  related_facts?: string[];
  notes?: string;
  revisions?: FactRevision[];
}

// Resolve the facts directory.
// process.cwd() during Astro build = the bandy-brain/ project root.
// The facts live one level up in docs/findings/facts.
const FACTS_DIR = resolve(process.cwd(), '..', 'docs', 'findings', 'facts');
const BANDYGRYTAN_PATH = resolve(process.cwd(), '..', 'docs', 'data', 'bandygrytan_detailed.json');

export interface GoalDecile { range: string; count: number; pct: number; }
export interface TimeDistribution { label: string; total: number; avgMinute: number; median: number; byDecile: GoalDecile[]; }

let _bandygrytanCache: any = null;
function loadBandygrytan() {
  if (_bandygrytanCache) return _bandygrytanCache;
  _bandygrytanCache = JSON.parse(readFileSync(BANDYGRYTAN_PATH, 'utf-8'));
  return _bandygrytanCache;
}

export function getHerr(): any { return loadBandygrytan().herr; }
export function getDam(): any { return loadBandygrytan().dam; }
export function getGoalTimeDistribution(): TimeDistribution {
  return loadBandygrytan().herr.timeDistributions.goals;
}

const CATEGORIES = ['rules', 'stats', 'design_principles', 'world_canon'] as const;

let _factsCache: Fact[] | null = null;
let _factMapCache: Map<string, Fact> | null = null;

export function loadFacts(): Fact[] {
  if (_factsCache) return _factsCache;

  const facts: Fact[] = [];

  for (const category of CATEGORIES) {
    const dir = join(FACTS_DIR, category);
    let files: string[];
    try {
      files = readdirSync(dir).filter(f => f.endsWith('.yaml'));
    } catch {
      continue;
    }

    for (const file of files) {
      if (file === 'README.md') continue;
      const content = readFileSync(join(dir, file), 'utf-8');
      try {
        const raw = yaml.load(content) as Fact;
        if (raw && raw.fact_id && raw.status !== 'deprecated') {
          // js-yaml parses YAML dates as JS Date objects — normalize to ISO string
          if (raw.verified_at instanceof Date) {
            raw.verified_at = raw.verified_at.toISOString().slice(0, 10);
          }
          if (raw.revisions) {
            for (const rev of raw.revisions) {
              if ((rev.date as unknown) instanceof Date) {
                rev.date = (rev.date as unknown as Date).toISOString().slice(0, 10);
              }
            }
          }
          facts.push(raw);
        }
      } catch (e) {
        console.warn(`Failed to parse ${file}:`, e);
      }
    }
  }

  // Sort by fact_id
  facts.sort((a, b) => a.fact_id.localeCompare(b.fact_id));
  _factsCache = facts;
  return facts;
}

export function getFactMap(): Map<string, Fact> {
  if (_factMapCache) return _factMapCache;
  const map = new Map<string, Fact>();
  for (const fact of loadFacts()) {
    map.set(fact.fact_id, fact);
  }
  _factMapCache = map;
  return map;
}

export function getFactById(id: string): Fact | undefined {
  return getFactMap().get(id);
}

/**
 * Return the URL path for a fact's detail page.
 * R-facts → /bandy/rules/R014
 * S-facts → /bandy/stats/S008
 * D-facts → /spelet/design/D005
 * W-facts → /spelet/varlden/W001
 */
export function factHref(factId: string): string {
  const catChar = factId[0].toUpperCase();
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const domainMap: Record<string, string> = {
    R: 'bandy/rules',
    S: 'bandy/stats',
    D: 'spelet/design',
    W: 'spelet/varlden',
    H: 'spelet/design', // hypotheses fallback
  };
  const domainPath = domainMap[catChar] ?? 'sources';
  return `${base}/${domainPath}/${factId}`;
}

export function getFactsByCategory(category: string): Fact[] {
  return loadFacts().filter(f => f.category === category);
}

/**
 * Render a fact's value as a readable string.
 */
export function formatValue(fact: Fact): string {
  if (fact.value === undefined || fact.value === null) return '—';
  if (Array.isArray(fact.value)) {
    return fact.value.join(', ') + (fact.unit ? ` ${fact.unit}` : '');
  }
  return String(fact.value) + (fact.unit ? ` ${fact.unit}` : '');
}

/**
 * Extract all fact references (e.g. [S013]) from a markdown string.
 * Returns an array of unique fact_ids found.
 */
export function extractFactRefs(text: string): string[] {
  const matches = text.matchAll(/\[([RSDWH]\d{3})\]/g);
  const ids = new Set<string>();
  for (const m of matches) ids.add(m[1]);
  return [...ids];
}

/**
 * Replace [S013] patterns in text with HTML links to the fact detail page.
 */
export function linkifyFactRefs(text: string): string {
  return text.replace(
    /\[([RSDWH]\d{3})\]/g,
    (_, id) => `<a href="${factHref(id)}" class="fact-ref" title="Visa fact ${id}">${id}</a>`
  );
}

export type CategoryKey = typeof CATEGORIES[number];

export const CATEGORY_LABELS: Record<string, string> = {
  rules: 'Regler',
  stats: 'Statistik',
  design_principles: 'Designval',
  world_canon: 'Spelvärlden',
};
