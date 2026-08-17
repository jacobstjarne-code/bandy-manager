#!/usr/bin/env node
// ETAPP 1.3 (Skutskär-auditen / TOTALORDER, 2026-08-17): "det ska gå att se
// på en rad om live och main är i synk. GPT fick reda ut det manuellt mitt
// i en audit." Detta ersätter den manuella grävningen med en körning.
//
// Kräver VERCEL_TOKEN i miljön (skapa på vercel.com/account/tokens — scope
// "Full Account" räcker inte behövas, ett läs-scopat token för teamet
// jacobstjarne-codes-projects är nog). Utan token: skriptet säger det
// tydligt och avslutar med felkod, gissar inget.
//
// Körs: node scripts/check-deploy-sync.mjs  (eller: npm run check:deploy-sync)

import { execSync } from 'node:child_process'

const PROJECT_ID = 'prj_QdAoeho4UuqaV75wMaEDBzFPBnGo'
const TEAM_ID = 'team_MOjN3KmhlUduEfFfBFK1bOKZ'

function gitHash(ref) {
  try {
    return execSync(`git rev-parse ${ref}`, { encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

async function main() {
  const token = process.env.VERCEL_TOKEN
  if (!token) {
    console.error('check-deploy-sync: VERCEL_TOKEN saknas i miljön.')
    console.error('Skapa ett på vercel.com/account/tokens och kör igen:')
    console.error('  VERCEL_TOKEN=xxx node scripts/check-deploy-sync.mjs')
    process.exit(2)
  }

  // main = lokal origin/main om den finns (vad som FAKTISKT är pushat),
  // annars lokal HEAD (bättre än inget om ingen remote är konfigurerad).
  const mainHash = gitHash('origin/main') ?? gitHash('HEAD')
  if (!mainHash) {
    console.error('check-deploy-sync: kunde inte läsa git-hash för main.')
    process.exit(2)
  }

  const url = new URL('https://api.vercel.com/v6/deployments')
  url.searchParams.set('projectId', PROJECT_ID)
  url.searchParams.set('teamId', TEAM_ID)
  url.searchParams.set('target', 'production')
  url.searchParams.set('state', 'READY')
  url.searchParams.set('limit', '1')

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    console.error(`check-deploy-sync: Vercel API svarade ${res.status} ${res.statusText}`)
    process.exit(2)
  }
  const data = await res.json()
  const latest = data.deployments?.[0]
  if (!latest) {
    console.error('check-deploy-sync: inga READY production-deployments hittades.')
    process.exit(2)
  }

  const liveHash = latest.meta?.githubCommitSha ?? null
  const mainShort = mainHash.slice(0, 8)
  const liveShort = liveHash ? liveHash.slice(0, 8) : '(okänd)'
  const synced = liveHash === mainHash

  console.log(`main=${mainShort}  live=${liveShort}  ${synced ? '✓ SYNKAD' : '✗ OSYNKAD'}`)
  if (!synced) {
    console.log(`  live-deploy skapad: ${new Date(latest.created).toISOString()}`)
    console.log(`  live-commit:        ${latest.meta?.githubCommitMessage?.split('\n')[0] ?? '(okänt meddelande)'}`)
    process.exit(1)
  }
}

main()
