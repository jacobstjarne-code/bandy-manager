import { describe, it, expect } from 'vitest'
import { CONTENT_CONTRACT, getContentContractEntry, getWhyNowLine } from '../contentContract'
import { PORTAL_BEATS } from '../portalBeats'

/**
 * O11 (SLUTTEST_KO.md, 2026-08-20) — INNEHÅLLSKONTRAKTET. Detta testet låser
 * registrets STRUKTUR (fullständighet + intern konsistens), inte innehållets
 * korrekthet — att sextiofältet är rätt ifyllt kan bara verifieras genom att
 * läsa källkoden, inte genom en assertion. Se contentContract.ts:s
 * huvudkommentar för täckningsläget (97 rader, en delmängd `filled: true`).
 *
 * Sedan ursprungsläget har `burnoutRelief` och `burnoutCeiling` tillkommit;
 * båda lades direkt i det kanoniska registret. ArcType 8 → 7 när
 * 'ledare_crisis' togs bort (H1-uppföljning 2026-08-24).
 */
describe('CONTENT_CONTRACT — struktur', () => {
  it('har 97 rader — 51 GameEventType + 22 StorylineType + 7 ArcType + 17 PortalBeat', () => {
    expect(CONTENT_CONTRACT).toHaveLength(97)
    const bySource = CONTENT_CONTRACT.reduce((acc, e) => {
      acc[e.source] = (acc[e.source] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
    expect(bySource.GameEventType).toBe(51)
    expect(bySource.StorylineType).toBe(22)
    expect(bySource.ArcType).toBe(7)
    expect(bySource.PortalBeat).toBe(17)
  })

  // O11 enforcement (2026-08-23) — PortalBeat-halvan av täckningsgrinden.
  // GameEventType/StorylineType/ArcType täcks av TS-kompileringstids-
  // assertioner i contentContract.ts självt (ren string-literal-union, ingen
  // runtime-array att jämföra mot). PortalBeat är en objektinterface med en
  // RIKTIG runtime-array (PORTAL_BEATS) — här är ett vitest-test rätt verktyg.
  // contentContract.ts:s PORTAL_BEAT_IDS_ALL är MEDVETET inte importerad
  // från PORTAL_BEATS (samma fils egen kommentar — "avsiktlig, synlig lista,
  // inte en beräknad"), så det här testet läser PORTAL_BEATS separat för att
  // upptäcka drift, utan att göra källistan i contentContract.ts beräknad.
  it('PORTAL_BEAT_IDS_ALL täcker varje id i PORTAL_BEATS (portalBeats.ts) — ingen ny beat osynkad', () => {
    const contractIds = new Set(CONTENT_CONTRACT.filter(e => e.source === 'PortalBeat').map(e => e.id))
    const missing = PORTAL_BEATS.map(b => b.id).filter(id => !contractIds.has(id))
    expect(missing, `PortalBeat-id:n saknade ur contentContract.ts: ${missing.join(', ')}`).toEqual([])
  })

  it('inga dubbletter av (id, source) — samma id FÅR förekomma i flera källor (arc-upplösningar), men inte två gånger i SAMMA källa', () => {
    const seen = new Set<string>()
    for (const e of CONTENT_CONTRACT) {
      const key = `${e.source}::${e.id}`
      expect(seen.has(key), `dubblett: ${key}`).toBe(false)
      seen.add(key)
    }
  })

  it('filled:true-rader har alla sex obligatoriska fält ifyllda (trigger/stateEffect/systems/lifespan icke-tomma; semanticKey+recallSurface får vara explicit undefined/"ingen")', () => {
    const filled = CONTENT_CONTRACT.filter(e => e.filled)
    expect(filled.length).toBeGreaterThan(0)
    for (const e of filled) {
      expect(e.trigger, `${e.id}: trigger saknas trots filled:true`).toBeTruthy()
      expect(e.stateEffect, `${e.id}: stateEffect saknas trots filled:true`).toBeTruthy()
      expect(e.systems?.length, `${e.id}: systems saknas/tomt trots filled:true`).toBeGreaterThan(0)
      expect(e.lifespan, `${e.id}: lifespan saknas trots filled:true`).toBeTruthy()
      // Fält 5/6: 'ingen'/undefined är GILTIGA svar (ambient-regeln) — kravet
      // är att fältet MEDVETET satts, inte att det har ett icke-trivialt värde.
      // recallSurface ska alltid vara en explicit sträng (även 'ingen'), aldrig undefined.
      expect(e.recallSurface, `${e.id}: recallSurface måste vara explicit satt (även 'ingen'), inte undefined`).toBeTruthy()
    }
  })

  it('ingen filled:false-rad låtsas vara komplett (ingen av de sex är av misstag ifylld på en TODO-rad)', () => {
    const todo = CONTENT_CONTRACT.filter(e => !e.filled)
    for (const e of todo) {
      const anyFieldSet = e.trigger || e.stateEffect || (e.systems?.length ?? 0) > 0 || e.lifespan || e.semanticKey || e.recallSurface
      expect(anyFieldSet, `${e.id}: har fält ifyllda men filled:false — sätt filled:true om raden faktiskt är klar`).toBeFalsy()
    }
  })

  it('ingen filled:false-rad har whyNow-fält satta (D1 punkt 4 — inget gissat innan raden faktiskt spårats)', () => {
    const todo = CONTENT_CONTRACT.filter(e => !e.filled)
    for (const e of todo) {
      const anyWhyNowSet = e.deadlineLabel || e.whyNowPerson || e.wholeEventIrreversible || e.seasonDefining
      expect(anyWhyNowSet, `${e.id}: har whyNow-fält satta trots filled:false`).toBeFalsy()
    }
  })
})

/**
 * D1 punkt 4 (DOM_D1_EVENTVIKTNING_2026-08-19.md) — "därför nu"-raden.
 * Jacobs dom 2026-08-21: getWhyNowLine läser contentContract-raden, inte
 * event-instansen. Copy ordagrant låst i domen, testet låser bara
 * prioritetsordningen och null-fallet.
 */
describe('getWhyNowLine', () => {
  it('deadline vinner över allt annat om flera fält är satta', () => {
    expect(getWhyNowLine({ deadlineLabel: 'omgång 14', whyNowPerson: 'Anders', wholeEventIrreversible: true, seasonDefining: true }))
      .toBe('Svaret måste komma före omgång 14.')
  })

  it('person vinner över irreversibel och säsongsavgörande', () => {
    expect(getWhyNowLine({ whyNowPerson: 'Anders', wholeEventIrreversible: true, seasonDefining: true }))
      .toBe('Anders väntar på besked.')
  })

  it('irreversibel vinner över säsongsavgörande', () => {
    expect(getWhyNowLine({ wholeEventIrreversible: true, seasonDefining: true }))
      .toBe('Det här går inte att göra ogjort.')
  })

  it('säsongsavgörande är sista fallet', () => {
    expect(getWhyNowLine({ seasonDefining: true })).toBe('Det som bestäms här bär hela våren.')
  })

  it('inget fält satt ger null — domens signal att vikten ska sänkas', () => {
    expect(getWhyNowLine({})).toBeNull()
  })

  it('undefined-rad (ingen contentContract-träff) ger null', () => {
    expect(getWhyNowLine(undefined)).toBeNull()
  })
})

describe('getContentContractEntry', () => {
  it('hittar en känd rad', () => {
    expect(getContentContractEntry('GameEventType', 'hesitantPlayer')?.filled).toBe(true)
  })

  it('returnerar undefined för okänt (source, id)', () => {
    expect(getContentContractEntry('GameEventType', 'not_a_real_type')).toBeUndefined()
  })

  it('låser den verifierade transferbudsraden och dess medvetna avsaknad av cooldown', () => {
    const entry = getContentContractEntry('GameEventType', 'transferBidReceived')
    expect(entry).toMatchObject({
      filled: true,
      semanticKey: 'transferBidReceived',
      systems: expect.arrayContaining(['spelartrupp och kontrakt', 'klubbekonomi och transferbudget']),
    })
    expect(entry?.cooldownSeasons).toBeUndefined()
    expect(entry?.stateEffect).toContain("'accept': executeTransfer")
    expect(entry?.stateEffect).toContain("'reject': bid.status='rejected'")
    expect(entry?.stateEffect).toContain("'counter':")
  })

  it('låser contractRequest-raden och att avslag inte påstår en förlängning', () => {
    const entry = getContentContractEntry('GameEventType', 'contractRequest')
    expect(entry).toMatchObject({ filled: true, semanticKey: 'contractRequest' })
    expect(entry?.cooldownSeasons).toBeUndefined()
    expect(entry?.stateEffect).toContain("'reject': kontrakt/lön lämnas orörda")
    expect(entry?.stateEffect).toContain('handled-markeringen ger inte längre ett gratis extraår')
  })

  it('låser starPerformance-radens två nyckelroller utan påhittad säsongscooldown', () => {
    const entry = getContentContractEntry('GameEventType', 'starPerformance')
    expect(entry).toMatchObject({ filled: true })
    expect(entry?.semanticKey).toContain('starPerformance vid resolution')
    expect(entry?.semanticKey).toContain('star_performance_{playerId}')
    expect(entry?.cooldownSeasons).toBeUndefined()
    expect(entry?.stateEffect).toContain('boostMorale +5')
  })

  it('låser presskonferensens svarseffekter, minnesnycklar och relationsgränser', () => {
    const entry = getContentContractEntry('GameEventType', 'pressConference')
    expect(entry).toMatchObject({ filled: true })
    expect(entry?.semanticKey).toContain('press_q_{faktisk frågetext}')
    expect(entry?.semanticKey).toContain('press_response_{responseId}')
    expect(entry?.cooldownSeasons).toBeUndefined()
    expect(entry?.stateEffect).toContain('Båda journalistrelationerna klampas 0–100')
    expect(entry?.stateEffect).toContain('exakt tredje vägran')
  })

  it('låser dayJobConflict-varianternas verkliga vila, heltidssteg och deduplicering', () => {
    const entry = getContentContractEntry('GameEventType', 'dayJobConflict')
    expect(entry).toMatchObject({ filled: true, semanticKey: expect.stringContaining('dayJobConflict') })
    expect(entry?.cooldownSeasons).toBeUndefined()
    expect(entry?.trigger).toContain('en gång per spelare och säsong')
    expect(entry?.stateEffect).toContain('restGamesRemaining=1')
    expect(entry?.stateEffect).toContain('went_fulltime_pro-storyline')
    expect(entry?.stateEffect).toContain("'risk för skada' är borttagen")
  })

  it('låser bidWar till budändring nu och betalning först vid faktisk transfer', () => {
    const entry = getContentContractEntry('GameEventType', 'bidWar')
    expect(entry).toMatchObject({ filled: true, semanticKey: expect.stringContaining('bidWar') })
    expect(entry?.cooldownSeasons).toBeUndefined()
    expect(entry?.stateEffect).toContain('offerAmount till avrundat 1,3×')
    expect(entry?.stateEffect).toContain('klubbkassa och transferBudget ändras inte')
    expect(entry?.notes).toContain('garanterar inget utfall')
  })

  it('låser communityEvent-familjens kapten-, orts- och P19-effekter', () => {
    const entry = getContentContractEntry('GameEventType', 'communityEvent')
    expect(entry).toMatchObject({ filled: true, semanticKey: expect.stringContaining('communityEvent') })
    expect(entry?.cooldownSeasons).toBeUndefined()
    expect(entry?.stateEffect).toContain('captainPlayerId')
    expect(entry?.stateEffect).toContain('selectedPlayerIds')
    expect(entry?.stateEffect).toContain('fika +8')
    expect(entry?.notes).toContain('kunde gå under noll')
  })

  it('låser patronEvent till säsongsdeduplicering, gemensam relationseffekt och verklig bonus', () => {
    const entry = getContentContractEntry('GameEventType', 'patronEvent')
    expect(entry).toMatchObject({ filled: true, semanticKey: expect.stringContaining('patronEvent') })
    expect(entry?.cooldownSeasons).toBeUndefined()
    expect(entry?.trigger).toContain('communityStanding är minst 60')
    expect(entry?.stateEffect).toContain('20 000 kr')
    expect(entry?.stateEffect).toContain('+10 happiness')
    expect(entry?.lifespan).toContain('säsong+omgång-id:n')
    expect(entry?.notes).toContain('dubbelt intro')
  })

  it('låser politicianEvent till mandatdeduplicering och verkliga återkommande bidragsdeltan', () => {
    const entry = getContentContractEntry('GameEventType', 'politicianEvent')
    expect(entry).toMatchObject({ filled: true, semanticKey: expect.stringContaining('mandatExpires') })
    expect(entry?.cooldownSeasons).toBeUndefined()
    expect(entry?.stateEffect).toContain('kommunBidragModifier +5 000 kr')
    expect(entry?.stateEffect).toContain('kommunBidragModifier +6 000 kr/säsong')
    expect(entry?.lifespan).toContain('per politikermandat')
    expect(entry?.notes).toContain('skickades även efter avslag')
  })

  it('låser hallDebate som legacy-tombstone och pekar på den enda levande hallprocessen', () => {
    const entry = getContentContractEntry('GameEventType', 'hallDebate')
    expect(entry).toMatchObject({ filled: true })
    expect(entry?.cooldownSeasons).toBeUndefined()
    expect(entry?.trigger).toContain('Ingen levande trigger')
    expect(entry?.stateEffect).toContain('ingen hallDebate-specifik specialgren')
    expect(entry?.notes).toContain('nästa rad, hallProcess')
  })
})
