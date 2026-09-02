/**
 * A-GRIND: verifierar att varje deklarerad mekanikhook fortfarande har sina
 * verkliga kodankare. Typen i Community.ts gör hook-mängden sluten; denna
 * bygggrind fångar när en ankare tas bort eller döps om utan att nodlöftena
 * uppdateras. Den försöker inte bevisa affärslogik semantiskt.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { FacilityMechanicalHook } from '../src/domain/entities/Community'
import { FACILITY_NODE_DEFS } from '../src/domain/data/facilityNodes'

const ROOT = resolve(import.meta.dirname, '..')

interface HookAnchor {
  file: string
  tokens: string[]
}

const HOOK_ANCHORS = {
  construction_cost: [
    { file: 'src/presentation/store/gameStore.ts', tokens: ['-chosen.clubCost', 'applyFinanceChange'] },
    { file: 'src/presentation/store/actions/gameFlowActions.ts', tokens: ['-def.cost', 'applyFinanceChange'] },
  ],
  capacity_bonus: [
    { file: 'src/domain/services/facilityService.ts', tokens: ['capacityBonus: def?.capacityBonus ?? 0'] },
    { file: 'src/application/useCases/roundProcessor.ts', tokens: ['arenaCapacity:', 'facilityCapacityBonus'] },
  ],
  facilities_training_bonus: [
    { file: 'src/domain/services/facilityService.ts', tokens: ['facilitiesBonus: def?.facilitiesBonus ?? 0'] },
    { file: 'src/application/useCases/roundProcessor.ts', tokens: ['facilities:', 'facilityBonusTotal'] },
    { file: 'src/domain/services/trainingService.ts', tokens: ['facilityMultiplier', 'facilities / 100'] },
  ],
  kiosk_sales_bonus: [
    { file: 'src/domain/services/economyService.ts', tokens: ['KIOSK_NODE_SALES_BONUS_MULT', "includes('kiosk')", 'kioskSalesMult'] },
  ],
} satisfies Record<FacilityMechanicalHook, HookAnchor[]>

const failures: string[] = []
const usedHooks = new Set<FacilityMechanicalHook>()

for (const def of FACILITY_NODE_DEFS) {
  for (const consequence of def.consequences) {
    if (consequence.kind === 'mechanical') usedHooks.add(consequence.hook)
  }
}

for (const hook of usedHooks) {
  for (const anchor of HOOK_ANCHORS[hook]) {
    const source = readFileSync(resolve(ROOT, anchor.file), 'utf8')
    for (const token of anchor.tokens) {
      if (!source.includes(token)) failures.push(`${hook}: "${token}" saknas i ${anchor.file}`)
    }
  }
}

if (failures.length > 0) {
  console.error('facility-consequence-guard: deklarerade mekanikhooks har tappat kodankare')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

const claimCount = FACILITY_NODE_DEFS.reduce((sum, def) => sum + def.consequences.length, 0)
console.log(`facility-consequence-guard: ${claimCount} klassificerade claims, ${usedHooks.size} verifierade mekanikhooks ✓`)
