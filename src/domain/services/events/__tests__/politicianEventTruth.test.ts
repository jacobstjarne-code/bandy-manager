import { describe, expect, it } from 'vitest'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { CLUB_TEMPLATES } from '../../worldGenerator'
import { calculateKommunBidrag } from '../../politicianService'
import { getDefaultRolloverChoice, getRolloverPolicy } from '../../deferredRolloverService'
import { generatePoliticianEvents } from '../politicianEvents'
import { resolveEvent } from '../eventResolver'

function makeGame(agenda: 'youth' | 'inclusion' | 'prestige' | 'savings' | 'infrastructure') {
  const base = createNewGame({ managerName: 'Test', clubId: CLUB_TEMPLATES[0].id, seed: 1 })
  return {
    ...base,
    currentSeason: 2026,
    communityStanding: 50,
    fanMood: 50,
    localPolitician: {
      ...base.localPolitician!,
      name: 'Anna Testsson',
      agenda,
      relationship: 50,
      kommunBidrag: 30000,
      kommunBidragModifier: 0,
      mandatExpires: 2030,
    },
  }
}

describe('politicianEvent — text, state och livscykel håller ihop', () => {
  it('agendakort dedupliceras per mandat, inte för alltid per agendatyp', () => {
    const game = {
      ...makeGame('savings'),
      currentSeason: 2030,
      localPolitician: { ...makeGame('savings').localPolitician, mandatExpires: 2034 },
    }
    const events = generatePoliticianEvents(game, 6, new Set(['politician_savings_2030']), () => 0)

    expect(events.some(event => event.id === 'politician_savings_2034')).toBe(true)
  })

  it('sparplanen ger exakt +8 relation och ett verkligt +5 000 kr årsdelta', () => {
    const base = makeGame('savings')
    const event = generatePoliticianEvents(base, 6, new Set(), () => 0)
      .find(candidate => candidate.id === 'politician_savings_2030')!
    const club = base.clubs.find(candidate => candidate.id === base.managedClubId)!
    const beforeAnnual = calculateKommunBidrag(base.localPolitician, club, base.communityStanding, base)

    const result = resolveEvent({ ...base, pendingEvents: [event] }, event.id, 'comply', undefined, true)
    const afterAnnual = calculateKommunBidrag(result.localPolitician!, club, result.communityStanding!, result)

    expect(result.localPolitician?.relationship).toBe(58)
    expect(result.localPolitician?.kommunBidrag).toBe(35000)
    expect(result.localPolitician?.kommunBidragModifier).toBe(5000)
    expect(afterAnnual - beforeAnnual).toBe(5000)
  })

  it('inkluderingsprogrammets årsdelta består i beräkningen och eftertexten skapas bara vid ja', () => {
    const base = makeGame('inclusion')
    const event = generatePoliticianEvents(base, 5, new Set(), () => 0)
      .find(candidate => candidate.id === 'politician_inclusion_2030')!
    const club = base.clubs.find(candidate => candidate.id === base.managedClubId)!
    const beforeAnnual = calculateKommunBidrag(base.localPolitician, club, base.communityStanding, base)

    const accepted = resolveEvent({ ...base, pendingEvents: [event] }, event.id, 'start_program', () => 0, true)
    const declined = resolveEvent({ ...base, pendingEvents: [event] }, event.id, 'already_open', () => 0, true)
    const acceptedAnnual = calculateKommunBidrag(accepted.localPolitician!, club, base.communityStanding, accepted)

    expect(accepted.localPolitician?.kommunBidragModifier).toBe(6000)
    expect(acceptedAnnual - beforeAnnual).toBe(6000)
    expect(accepted.fanMood).toBe(55)
    expect(accepted.communityStanding).toBe(53)
    expect(accepted.pendingFollowUps).toHaveLength(1)
    expect(declined.pendingFollowUps ?? []).toHaveLength(0)
  })

  it('ungdomssvaret beskriver den omedelbara hållningen utan ett ospårat framtidslöfte', () => {
    const base = makeGame('youth')
    const event = generatePoliticianEvents(base, 4, new Set(), () => 0)
      .find(candidate => candidate.id === 'politician_youth_2030')!

    expect(event.choices.find(choice => choice.id === 'promise')?.label).toBe('Lyft fram juniorverksamheten')
    expect(event.choices.find(choice => choice.id === 'promise')?.effect).toMatchObject({
      type: 'politicianRelationship',
      amount: 10,
    })
  })

  it('varningskortets styrelsekontakt ger båda deklarerade state-effekterna', () => {
    const base = { ...makeGame('prestige'), localPolitician: { ...makeGame('prestige').localPolitician, relationship: 20 } }
    const event = generatePoliticianEvents(base, 10, new Set(), () => 0)
      .find(candidate => candidate.id === 'politician_warning_2026')!
    const choice = event.choices.find(candidate => candidate.id === 'board_contact')!

    const result = resolveEvent({ ...base, pendingEvents: [event] }, event.id, 'board_contact', undefined, true)

    expect(choice).toMatchObject({
      consequenceLevel: 'costly',
      costLabel: 'Kostar relationen till Anna Testsson',
    })
    expect(result.boardPatience).toBe((base.boardPatience ?? 70) + 2)
    expect(result.localPolitician?.relationship).toBe(17)
  })
})

describe('kommunMote — text, state och livscykel håller ihop', () => {
  it('alla agendor använder valtext som motsvarar den omedelbara state-effekten', () => {
    const agendas = ['savings', 'youth', 'prestige', 'inclusion', 'infrastructure'] as const
    const events = agendas.map(agenda => generatePoliticianEvents(makeGame(agenda), 3, new Set(), () => 0)
      .find(candidate => candidate.type === 'kommunMote')!)

    expect(events.every(Boolean)).toBe(true)
    expect(events.flatMap(event => event.choices.map(choice => choice.label)).join(' '))
      .not.toMatch(/lova|planerar|starta ett inkluderingsprogram|vi investerar/i)
    expect(events[0].choices[0].effect)
      .toMatchObject({ type: 'politicianRelationship', amount: 10 })
    expect(events[3].choices[0].effect)
      .toMatchObject({ type: 'communityStanding', amount: 5 })
  })

  it('ett svar sätter den befintliga once-per-politician-markören och startar kommunens cooldown', () => {
    const base = makeGame('infrastructure')
    const event = generatePoliticianEvents(base, 3, new Set(), () => 0)
      .find(candidate => candidate.type === 'kommunMote')!

    const result = resolveEvent({ ...base, pendingEvents: [event] }, event.id, 'confirm', undefined, true)

    expect(result.localPolitician?.relationship).toBe(60)
    expect(result.localPolitician?.demandsMet).toBe(true)
    expect(result.sourceCooldowns?.kommunen).toEqual({ roundsLeft: 8, totalRounds: 8 })
    expect(generatePoliticianEvents(result, 3, new Set(), () => 0).some(candidate => candidate.type === 'kommunMote')).toBe(false)
  })

  it('ungdomsvalet läser den befintliga bandyskolan i stället för att lova en ospårad framtida', () => {
    const withoutSchool = generatePoliticianEvents(makeGame('youth'), 3, new Set(), () => 0)
      .find(candidate => candidate.type === 'kommunMote')!
    const withSchoolGame = {
      ...makeGame('youth'),
      communityActivities: { ...makeGame('youth').communityActivities, bandySchool: { level: 1 } },
    } as ReturnType<typeof makeGame>
    const withSchool = generatePoliticianEvents(withSchoolGame, 3, new Set(), () => 0)
      .find(candidate => candidate.type === 'kommunMote')!

    expect(withoutSchool.choices[0]).toMatchObject({
      label: 'Bandyskola ryms inte i årets budget',
      effect: { type: 'politicianRelationship', amount: -5 },
    })
    expect(withSchool.choices[0]).toMatchObject({
      label: 'Visa upp bandyskolan',
      effect: { type: 'politicianRelationship', amount: 15 },
    })
  })

  it('rinner ut vid rollover eftersom inget neutralt noOp-val finns', () => {
    const event = generatePoliticianEvents(makeGame('prestige'), 3, new Set(), () => 0)
      .find(candidate => candidate.type === 'kommunMote')!

    expect(getRolloverPolicy('kommunMote')).toBe('expire')
    expect(getDefaultRolloverChoice(event)).toBeNull()
  })
})

describe('gentjanst — text, state och livscykel håller ihop', () => {
  it('är mandatbunden och respekterar äldre säsongsbundna id:n', () => {
    const base = {
      ...makeGame('prestige'),
      localPolitician: { ...makeGame('prestige').localPolitician!, corruption: 80 },
    }
    const first = generatePoliticianEvents(base, 2, new Set(), () => 0)
      .find(candidate => candidate.type === 'gentjanst')!

    expect(first.id).toBe('gentjanst_2030')
    expect(generatePoliticianEvents(base, 2, new Set([first.id]), () => 0)).toHaveLength(0)
    expect(generatePoliticianEvents(base, 2, new Set(['gentjanst_2030_2026']), () => 0)).toHaveLength(0)
  })

  it('beskriver en kontaktväg och ändrar bara de deklarerade mätarna', () => {
    const base = {
      ...makeGame('prestige'),
      localPolitician: { ...makeGame('prestige').localPolitician!, corruption: 80 },
    }
    const event = generatePoliticianEvents(base, 2, new Set(), () => 0)
      .find(candidate => candidate.type === 'gentjanst')!
    const playerIds = base.players.map(player => player.id)
    const youthIds = base.youthTeam?.players.map(player => player.id)

    expect(event.body).not.toMatch(/komma och träna med truppen/i)
    expect(event.choices[0].label).toBe('Skicka kontaktvägen till öppna provträningar')
    const accepted = resolveEvent({ ...base, pendingEvents: [event] }, event.id, 'yes', undefined, true)

    expect(accepted.localPolitician?.relationship).toBe(70)
    expect(accepted.players.map(player => player.id)).toEqual(playerIds)
    expect(accepted.youthTeam?.players.map(player => player.id)).toEqual(youthIds)
    expect(accepted.sourceCooldowns?.kommunen).toEqual({ roundsLeft: 8, totalRounds: 8 })
  })

  it('nej-valets verkliga relationskostnad använder den gemensamma konsekvensmarkören', () => {
    const base = {
      ...makeGame('prestige'),
      localPolitician: { ...makeGame('prestige').localPolitician!, corruption: 80 },
    }
    const event = generatePoliticianEvents(base, 2, new Set(), () => 0)
      .find(candidate => candidate.type === 'gentjanst')!

    expect(event.choices.find(choice => choice.id === 'no')).toMatchObject({
      consequenceLevel: 'costly',
      costLabel: 'Kostar relationen till Anna Testsson',
    })
  })

  it('rinner ut vid rollover eftersom inget neutralt noOp-val finns', () => {
    const base = {
      ...makeGame('prestige'),
      localPolitician: { ...makeGame('prestige').localPolitician!, corruption: 80 },
    }
    const event = generatePoliticianEvents(base, 2, new Set(), () => 0)
      .find(candidate => candidate.type === 'gentjanst')!

    expect(getRolloverPolicy('gentjanst')).toBe('expire')
    expect(getDefaultRolloverChoice(event)).toBeNull()
  })
})
