/**
 * BETATEST_TEXTDOM_2026-09-24 — riktade regressionstester för textdomen.
 * Tokens, historikvillkor, variation/dedupe och sanningsbuggen C5.1.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { commentary, fillTemplate } from '../matchCommentary'
import { ASSISTANT_FF_LINES, renderAssistantFFLine } from '../assistantFFStrings'
import { ledgerOccurrenceIndex, renderMomentViewFromLedger } from '../momentViewTemplates'
import { FIRST_CALLUP_MEMORY_LINES, CALLUP_NOTICE_LINES } from '../landslagText'
import { PROVNING_AMBIENT } from '../hallProvningData'
import { pickHallAmbientLine } from '../../services/coffeeRoomService'
import { generateBurnoutCeilingEvent } from '../../services/burnoutCeilingService'
import { generateBurnoutReliefEvent } from '../../services/burnoutReliefService'
import type { EventLedgerEntry } from '../../entities/Narrative'
import type { AssistantCoach } from '../../entities/AssistantCoach'

const coach = (name: string) => ({ name, age: 50, personality: 'calm', background: 'former_player', initials: 'XX' }) as unknown as AssistantCoach
const ffLines = Object.values(ASSISTANT_FF_LINES).flatMap(group => Object.values(group).flat()) as string[]

describe('C5.1 — ingen "ingen pipa" efter en registrerad utvisning', () => {
  it('den generösa domarens pool bekräftar kortet i stället för att förneka det', () => {
    const pool = (commentary as Record<string, string[]>).referee_lenient_after_suspension
    expect(pool.length).toBeGreaterThanOrEqual(3)
    for (const line of pool) {
      expect(line).not.toMatch(/ingen pipa|viftar vidare|låter (spelet|det)|fri duell/i)
    }
  })

  it('den gamla nyckeln finns inte kvar och matchCore dirigerar utvisningsslotten till den nya', () => {
    expect((commentary as Record<string, unknown>).referee_lenient).toBeUndefined()
    const core = readFileSync(resolve(__dirname, '../../services/matchCore.ts'), 'utf-8')
    const slot = core.slice(core.indexOf('// Referee line (after suspension)'))
    expect(slot.slice(0, 600)).toContain('commentary.referee_lenient_after_suspension')
  })
})

describe('C6 — namngiven assistent, korrekt genitiv och reserv', () => {
  it('snabbspolningsraderna har {coach} först i meningen så reservordet blir grammatiskt', () => {
    for (const line of ffLines) {
      for (const match of line.matchAll(/\{coach\}/g)) {
        const before = line.slice(0, match.index).trimEnd()
        expect(before === '' || /[.!?]$/.test(before)).toBe(true)
      }
      expect(line).not.toMatch(/assistent/i)
    }
  })

  it('efternamnet används, genitiven hanterar s-slut, reserven är Assistenten', () => {
    expect(renderAssistantFFLine('Långt ut mot bortre. {coach}s val.', coach('Sixten Holmgren'))).toBe('Långt ut mot bortre. Holmgrens val.')
    expect(renderAssistantFFLine('Långt ut mot bortre. {coach}s val.', coach('Per Mattias'))).toBe('Långt ut mot bortre. Mattias val.')
    expect(renderAssistantFFLine('Långt ut mot bortre. {coach}s val.', undefined)).toBe('Långt ut mot bortre. Assistentens val.')
    for (const line of ffLines) {
      expect(renderAssistantFFLine(line, coach('Sixten Holmgren'))).not.toMatch(/[{}]|\$/)
    }
  })

  it('burnout-korten bär namnet och renderar inga råa template-tokens', () => {
    const ceiling = generateBurnoutCeilingEvent(10, 2027, 'stepped_back', 'Sixten Holmgren')
    expect(ceiling.body).toContain('Sixten Holmgren säger samma sak')
    expect(ceiling.body).not.toContain('${')
    const fresh = generateBurnoutCeilingEvent(10, 2027, undefined, undefined)
    expect(fresh.body).toContain('Assistenten har sagt det rakt ut')
    expect(fresh.choices.map(c => c.subtitle ?? '').join(' ')).not.toContain('${')
    const relief = generateBurnoutReliefEvent(10, 2027, 'hog', false, 0, 'Sixten Holmgren')
    expect(relief.choices[0].label).toBe('Låt Sixten Holmgren ta pressen')
  })
})

function entry(type: EventLedgerEntry['type'], semanticKey: string, season: number, matchday: number): EventLedgerEntry {
  return { type, semanticKey, season, matchday, significance: 40 } as EventLedgerEntry
}

describe('C4.1–C4.3 — flera händelser av samma typ ger olika ekon', () => {
  const types = ['transfer_signed', 'transfer_sold', 'referee_feud', 'referee_trust', 'mecenat_withdrawal', 'patron_emerge', 'patron_withdrawal'] as const
  for (const type of types) {
    it(`${type}: de tre första posterna i karriären får tre olika texter`, () => {
      const ledger = [
        entry(type, `${type}:a`, 2026, 4),
        entry('derby_result', 'x', 2026, 5),
        entry(type, `${type}:b`, 2026, 9),
        entry(type, `${type}:a`, 2027, 3),
      ]
      const subjectKind = type.startsWith('transfer') ? 'player' : type.startsWith('referee') ? 'referee' : type.startsWith('mecenat') ? 'mecenat' : 'patron'
      const bodies = [ledger[0], ledger[2], ledger[3]].map(e => {
        const withSubject = { ...e, subject: { kind: subjectKind, id: 's' } } as EventLedgerEntry
        const text = renderMomentViewFromLedger(withSubject, {
          matchday: e.matchday, season: e.season, significance: 40, subjectName: 'Namn',
          occurrence: ledgerOccurrenceIndex(ledger, e),
        })
        return text?.body
      })
      expect(bodies.every(Boolean)).toBe(true)
      expect(new Set(bodies).size).toBe(3)
    })
  }

  it('förekomstindex räknar bara föregående poster av samma typ', () => {
    const ledger = [entry('transfer_sold', 'a', 1, 1), entry('transfer_signed', 'b', 1, 2), entry('transfer_sold', 'c', 1, 3)]
    expect(ledgerOccurrenceIndex(ledger, ledger[0])).toBe(0)
    expect(ledgerOccurrenceIndex(ledger, ledger[1])).toBe(0)
    expect(ledgerOccurrenceIndex(ledger, ledger[2])).toBe(1)
  })
})

describe('C4.4–C4.5 — landslaget', () => {
  it('minnesraderna löser genitiv korrekt och påstår "första" bara där posten är gated', () => {
    expect(fillTemplate(FIRST_CALLUP_MEMORY_LINES[0], { spelare: 'Holmgren' })).toMatch(/^Holmgrens första/)
    expect(fillTemplate(FIRST_CALLUP_MEMORY_LINES[0], { spelare: 'Nyberg-Fors' })).toMatch(/^Nyberg-Fors första/)
    expect(new Set(FIRST_CALLUP_MEMORY_LINES).size).toBe(FIRST_CALLUP_MEMORY_LINES.length)
    expect(FIRST_CALLUP_MEMORY_LINES.length).toBeGreaterThanOrEqual(3)
  })

  it('kallelseraderna finns i minst tre varianter per form', () => {
    expect(CALLUP_NOTICE_LINES.single.length).toBeGreaterThanOrEqual(3)
    expect(CALLUP_NOTICE_LINES.multi.length).toBeGreaterThanOrEqual(3)
  })

  it('valet nycklas inte längre enbart på säsongen', () => {
    const service = readFileSync(resolve(__dirname, '../../services/nationalTeamService.ts'), 'utf-8')
    expect(service).not.toContain('noticeTemplates[game.currentSeason % noticeTemplates.length]')
    const memory = readFileSync(resolve(__dirname, '../../services/clubMemoryService.ts'), 'utf-8')
    expect(memory).not.toContain('FIRST_CALLUP_MEMORY_LINES[entry.season %')
  })
})

describe('C4.6–C4.9 — högfrekventa pooler utökade', () => {
  it('cup_goalOpener har fyra rader, alla med {player} och {score}', () => {
    const pool = (commentary as Record<string, string[]>).cup_goalOpener
    expect(pool.length).toBe(4)
    for (const line of pool) {
      expect(line).toContain('{player}')
      expect(line).toContain('{score}')
    }
  })

  it('hallprövningens klackpooler har minst tre rader', () => {
    expect(PROVNING_AMBIENT.krav!.klack.length).toBeGreaterThanOrEqual(3)
    expect(PROVNING_AMBIENT.forhandling!.klack.length).toBeGreaterThanOrEqual(3)
  })

  it('hallprövningen visar aldrig samma rad två visade matchdagar i rad', () => {
    const pool = [...PROVNING_AMBIENT.krav!.kafferum, ...PROVNING_AMBIENT.krav!.klack]
    for (const season of [2026, 2027, 2031]) {
      let previous: string | null = null
      for (let md = 1; md <= 40; md++) {
        const line = pickHallAmbientLine(pool, md, season)
        if (line === null) continue
        expect(line).not.toBe(previous)
        previous = line
      }
    }
  })

  it('egenskapspoolerna har sex rader och ingen hockeytackling', () => {
    const src = readFileSync(resolve(__dirname, '../matchCommentary.ts'), 'utf-8')
    expect(src).not.toMatch(/\ben (onödig )?tackling\b/)
    for (const key of ['hungrig', 'joker', 'veteran', 'lokal']) {
      const goals = src.slice(src.indexOf('const traitGoals'), src.indexOf('const traitSuspensions'))
      const block = goals.slice(goals.indexOf(`${key}: [`), goals.indexOf('],', goals.indexOf(`${key}: [`)))
      expect(block.match(/`/g)!.length / 2).toBe(6)
    }
    const susp = src.slice(src.indexOf('const traitSuspensions'))
    for (const key of ['veteran', 'lokal', 'ledare']) {
      const block = susp.slice(susp.indexOf(`${key}: [`), susp.indexOf('],', susp.indexOf(`${key}: [`)))
      expect(block.match(/`/g)!.length / 2).toBe(6)
    }
  })
})
