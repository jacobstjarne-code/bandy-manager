import type {
  ResolvedChoiceOutcomeDelta,
  SaveGame,
} from '../entities/SaveGame'

function pushDelta(
  rows: ResolvedChoiceOutcomeDelta[],
  resource: ResolvedChoiceOutcomeDelta['resource'],
  before: number | undefined,
  after: number | undefined,
  subjectName?: string,
): void {
  if (before === undefined || after === undefined) return
  const delta = after - before
  if (delta !== 0) rows.push({ resource, delta, ...(subjectName ? { subjectName } : {}) })
}

/**
 * O12 §2 — fångar bara den applicerade sanningen. Funktionen diffar state
 * före/efter resolveEvent; den läser aldrig choice.subtitle eller deklarerade
 * effektbelopp. Därmed blir clamps, uteblivna mål och specialresolvers sanna i
 * kvittot. De medvetet dolda developmentRate-/discipline-motvikterna finns
 * inte i resursmängden och kan därför inte börja läcka genom eftervyn.
 */
export function captureResolvedChoiceOutcome(
  before: SaveGame,
  after: SaveGame,
): ResolvedChoiceOutcomeDelta[] {
  const rows: ResolvedChoiceOutcomeDelta[] = []
  const beforeClub = before.clubs.find(club => club.id === before.managedClubId)
  const afterClub = after.clubs.find(club => club.id === after.managedClubId)

  pushDelta(rows, 'finances', beforeClub?.finances, afterClub?.finances)
  pushDelta(rows, 'reputation', beforeClub?.reputation, afterClub?.reputation)
  pushDelta(rows, 'fanMood', before.fanMood ?? 50, after.fanMood ?? 50)
  pushDelta(rows, 'communityStanding', before.communityStanding ?? 50, after.communityStanding ?? 50)
  pushDelta(rows, 'boardPatience', before.boardPatience ?? 70, after.boardPatience ?? 70)
  pushDelta(rows, 'supporterMood', before.supporterGroup?.mood, after.supporterGroup?.mood)
  pushDelta(
    rows,
    'journalistRelationship',
    before.journalist?.relationship ?? before.journalistRelationship ?? 50,
    after.journalist?.relationship ?? after.journalistRelationship ?? 50,
    after.journalist?.name ?? before.journalist?.name,
  )
  pushDelta(
    rows,
    'politicianRelationship',
    before.localPolitician?.relationship,
    after.localPolitician?.relationship,
    after.localPolitician?.name ?? before.localPolitician?.name,
  )
  pushDelta(
    rows,
    'patronHappiness',
    before.patron?.happiness,
    after.patron?.happiness,
    after.patron?.name ?? before.patron?.name,
  )
  pushDelta(
    rows,
    'patronInfluence',
    before.patron?.influence,
    after.patron?.influence,
    after.patron?.name ?? before.patron?.name,
  )

  const beforePlayers = new Map(before.players.map(player => [player.id, player]))
  const moraleGroups = new Map<number, string[]>()
  const fitnessGroups = new Map<number, string[]>()
  const cornerSkillGroups = new Map<number, string[]>()
  const cornerRecoveryGroups = new Map<number, string[]>()
  for (const player of after.players) {
    const old = beforePlayers.get(player.id)
    if (!old) continue
    const name = `${player.firstName} ${player.lastName}`
    if (old.morale !== player.morale) {
      const delta = player.morale - old.morale
      moraleGroups.set(delta, [...(moraleGroups.get(delta) ?? []), name])
    }
    if (old.fitness !== player.fitness) {
      const delta = player.fitness - old.fitness
      fitnessGroups.set(delta, [...(fitnessGroups.get(delta) ?? []), name])
    }
    // Optional chaining: en del testfixturer castar minimala Player-objekt
    // utan `attributes` (t.ex. `{ id, firstName, lastName } as Player`) —
    // riktiga spelare har alltid attributes, men diffen får inte krascha på
    // dem som saknar det.
    if (old.attributes?.cornerSkill !== player.attributes?.cornerSkill) {
      const oldValue = old.attributes?.cornerSkill
      const newValue = player.attributes?.cornerSkill
      if (oldValue !== undefined && newValue !== undefined) {
        const delta = newValue - oldValue
        cornerSkillGroups.set(delta, [...(cornerSkillGroups.get(delta) ?? []), name])
      }
    }
    if ((old.attributes?.cornerRecovery ?? 50) !== (player.attributes?.cornerRecovery ?? 50)) {
      const delta = (player.attributes?.cornerRecovery ?? 50) - (old.attributes?.cornerRecovery ?? 50)
      cornerRecoveryGroups.set(delta, [...(cornerRecoveryGroups.get(delta) ?? []), name])
    }
  }
  for (const [resource, groups] of [
    ['morale', moraleGroups],
    ['fitness', fitnessGroups],
    ['cornerSkill', cornerSkillGroups],
    ['cornerRecovery', cornerRecoveryGroups],
  ] as const) {
    for (const [delta, names] of groups) {
      rows.push({
        resource,
        delta,
        subjectName: names.length === 1 ? names[0] : `Truppen (${names.length} spelare)`,
      })
    }
  }

  const beforeMecenater = new Map((before.mecenater ?? []).map(mecenat => [mecenat.id, mecenat]))
  for (const mecenat of after.mecenater ?? []) {
    const old = beforeMecenater.get(mecenat.id)
    pushDelta(rows, 'mecenatHappiness', old?.happiness, mecenat.happiness, mecenat.name)
  }

  const beforeReferees = new Map((before.refereeRelations ?? []).map(relation => [relation.refereeId, relation]))
  for (const relation of after.refereeRelations ?? []) {
    const old = beforeReferees.get(relation.refereeId)
    const referee = after.referees?.find(candidate => candidate.id === relation.refereeId)
      ?? before.referees?.find(candidate => candidate.id === relation.refereeId)
    const refereeName = referee ? `${referee.firstName} ${referee.lastName}` : undefined
    pushDelta(rows, 'refereeRelationship', old?.clubReaction, relation.clubReaction, refereeName)
  }

  return rows
}

const LABEL: Record<ResolvedChoiceOutcomeDelta['resource'], string> = {
  fanMood: 'Stämningen på läktaren',
  supporterMood: 'Klackens stämning',
  reputation: 'Klubbens rykte',
  communityStanding: 'Orten',
  morale: 'Moral',
  journalistRelationship: 'Pressrelation',
  patronHappiness: 'Patronens tålamod',
  patronInfluence: 'Patronens inflytande',
  mecenatHappiness: 'Mecenatens tålamod',
  boardPatience: 'Styrelsens tålamod',
  politicianRelationship: 'Kommunrelation',
  refereeRelationship: 'Domarrelation',
  finances: 'Kassan',
  fitness: 'Kondition',
  cornerSkill: 'Hörnskicklighet',
  cornerRecovery: 'Hörnförsvar',
}

function signed(value: number): string {
  const absolute = Math.abs(value).toLocaleString('sv-SE')
  return `${value > 0 ? '+' : '−'}${absolute}`
}

/** Ren presentation av ett redan strukturerat kvitto; ingen effekthärledning. */
export function formatResolvedChoiceOutcome(rows: ResolvedChoiceOutcomeDelta[] | undefined): string | undefined {
  if (!rows?.length) return undefined
  return rows.map(row => {
    const label = row.resource === 'morale' && row.subjectName
      ? `${row.subjectName}: moral`
      : row.subjectName
        ? `${LABEL[row.resource]} (${row.subjectName})`
        : LABEL[row.resource]
    const unit = row.resource === 'finances' ? ' kr' : ''
    return `${label} ${signed(row.delta)}${unit}`
  }).join(' · ')
}
