/**
 * content-contract-guard.ts — O11:s grind (ratchet, samma mönster som ds-guard.mjs).
 *
 * DOM_INNEHALLSKONTRAKTET_2026-08-17.md, "Godkänd när": "En ny berättelsetext
 * kan inte nå produktion utan att de sex fälten är ifyllda... Kontraktet är
 * inte ett dokument någon ska minnas. Det är en fil som failar bygget."
 *
 * 96 rader i CONTENT_CONTRACT (contentContract.ts), en delmängd `filled: true`
 * (sex fält verifierade mot koden), resten `filled: false` — ärlig, accepterad
 * TODO-skuld under avarbetning. Att faila på VARJE TODO-rad hade failat dagens
 * bygge (87 av 96) och blockerat all annan utveckling — inte grinden domen bad
 * om. Grinden failar istället om TODO-antalet ÖKAR mot en sparad baslinje: en
 * ny narrativ typ som läggs till (AssertNoMissingIds i contentContract.ts
 * tvingar redan fram en rad — se den filens ENFORCEMENT-kommentar) men lämnas
 * `filled: false`, eller en tidigare ifylld rad som töms, höjer TODO-antalet
 * och failar bygget HÄR. Att fylla i fler rader sänker antalet — informativt,
 * ratchet kan då dras åt (samma "ratchet kan sänkas"-mönster som ds-guard.mjs).
 *
 * Körs av `npm run lint:content-contract`, kedjad i `npm run build`.
 * Baslinje: scripts/content-contract-guard-baseline.json.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CONTENT_CONTRACT } from '../src/domain/data/contentContract'

const ROOT = resolve(import.meta.dirname, '..')
const BASELINE_PATH = resolve(ROOT, 'scripts', 'content-contract-guard-baseline.json')

const todoRows = CONTENT_CONTRACT.filter(e => !e.filled)
const filledRows = CONTENT_CONTRACT.filter(e => e.filled)
const todoCount = todoRows.length

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
const baseTodo = baseline.todo

console.log(`content-contract-guard: ${CONTENT_CONTRACT.length} rader, ${filledRows.length} ifyllda, ${todoCount} TODO (baslinje ${baseTodo})`)

if (todoCount > baseTodo) {
  const baseIds = new Set(baseline.todoIds ?? [])
  const newTodoIds = todoRows.map(e => `${e.source}:${e.id}`).filter(id => !baseIds.has(id))
  console.log('')
  console.log(`[ERROR] TODO-antalet ökade: baslinje ${baseTodo} → nu ${todoCount} (+${todoCount - baseTodo})`)
  console.log('        Ny(a) ofylld(a) rad(er) sedan baslinjen (eller en tidigare ifylld rad har tömts):')
  for (const id of newTodoIds) console.log(`        ${id}`)
  console.log('')
  console.log('        Fyll raden (alla sex fält, eller ett medvetet "ingen"-svar för fält 2/6)')
  console.log('        innan merge — det var hela poängen med kontraktet. Se DOM_INNEHALLSKONTRAKTET_2026-08-17.md.')
  process.exit(1)
} else if (todoCount < baseTodo) {
  console.log(`[info]  TODO sjönk till ${todoCount} — baslinjen kan skärpas (uppdatera content-contract-guard-baseline.json).`)
} else {
  console.log('content-contract-guard: på baslinje ✓')
}

process.exit(0)
