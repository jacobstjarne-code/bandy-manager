import { describe, it, expect } from 'vitest'
import { isGenericMatch, ALL_PRESS_TAGS } from '../pressConferenceService'

// M-refaktor (Jacob 2026-08-17): isGenericMatch bytte från en
// prefix-heuristik (tag.startsWith('win_'/'loss_'/'draw_')) till en
// explicit per-tagg-klassificering (TAG_DEFS i pressConferenceService.ts).
// Detta test låser beteendet EXAKT som det var innan refaktorn — och
// tvingar nästa person som lägger till en tagg att klassificera den
// medvetet, för utan en rad i tabellen nedan default:ar en ny tagg till
// 'none' (aldrig generic) i produktionskoden, men syns INTE i den här
// tabellen förrän den läggs till explicit (se "täckningstestet" sist).

type Outcome = 'won' | 'lost' | 'draw' | 'none'

function ctxFor(outcome: Outcome) {
  return {
    won: outcome === 'won',
    lost: outcome === 'lost',
    draw: outcome === 'draw',
  }
}

// Facit: för varje tagg i systemet, förväntat isGenericMatch-resultat under
// varje utfall. 'none' = matchen varken vanns, förlorades eller blev
// oavgjort (ett teoretiskt fjärde läge — funktionen ska fortfarande svara
// deterministiskt, aldrig krascha).
const EXPECTED: Record<string, Record<Outcome, boolean>> = {
  // ── win-bucket: generic-eligible endast när matchen vanns ──
  win_any:      { won: true,  lost: false, draw: false, none: false },
  win_big:      { won: true,  lost: false, draw: false, none: false },
  win_streak:   { won: true,  lost: false, draw: false, none: false },
  win_away:     { won: true,  lost: false, draw: false, none: false },
  win_top3:     { won: true,  lost: false, draw: false, none: false },
  win_comeback: { won: true,  lost: false, draw: false, none: false },
  playoff_win:  { won: true,  lost: false, draw: false, none: false },
  cup_win:      { won: true,  lost: false, draw: false, none: false },
  final_pre:    { won: true,  lost: false, draw: false, none: false },

  // ── loss-bucket: generic-eligible endast när matchen förlorades ──
  loss_any:     { won: false, lost: true, draw: false, none: false },
  loss_big:     { won: false, lost: true, draw: false, none: false },
  loss_streak:  { won: false, lost: true, draw: false, none: false },
  loss_home:    { won: false, lost: true, draw: false, none: false },
  loss_close:   { won: false, lost: true, draw: false, none: false },
  loss_referee: { won: false, lost: true, draw: false, none: false },

  // ── draw-bucket: generic-eligible endast vid oavgjort ──
  draw_any:      { won: false, lost: false, draw: true, none: false },
  draw_away_top: { won: false, lost: false, draw: true, none: false },
  draw_boring:   { won: false, lost: false, draw: true, none: false },

  // ── universal: alltid generic-eligible ──
  any: { won: true, lost: true, draw: true, none: true },

  // ── none-bucket: ALDRIG generic-eligible, oavsett utfall ──
  // M54(g): playoff_loss_not_final — cl25 ska inte slinka in som filler
  // när matchen var finalen. Medvetet uteslutet, inte ett prefix-missfall.
  playoff_loss_not_final: { won: false, lost: false, draw: false, none: false },
  // U2 (SLUTTEST_KO.md, 2026-08-17), symptom 5: win_derby/loss_derby låg
  // tidigare i 'win'/'loss'-bucketen — en icke-derbymatch som föll tillbaka
  // på generic-fallbacken kunde få ett derby-svar. Flyttade hit medvetet,
  // samma disciplin som playoff_loss_not_final ovan.
  win_derby:               { won: false, lost: false, draw: false, none: false },
  loss_derby:              { won: false, lost: false, draw: false, none: false },
  winter:                 { won: false, lost: false, draw: false, none: false },
  relegation:              { won: false, lost: false, draw: false, none: false },
  youngster:               { won: false, lost: false, draw: false, none: false },
  // 4.2 (SLUTTEST_KO, 2026-08-19): topic_*-svar hör till en specifik fråga
  // (nås via preferIds), aldrig till ett matchutfall — samma disciplin som
  // win_derby/loss_derby ovan.
  topic_person:            { won: false, lost: false, draw: false, none: false },
  topic_town:              { won: false, lost: false, draw: false, none: false },
  topic_doubt:             { won: false, lost: false, draw: false, none: false },
  topic_player:            { won: false, lost: false, draw: false, none: false },
}

describe('isGenericMatch — table-driven klassificering per tagg', () => {
  const outcomes: Outcome[] = ['won', 'lost', 'draw', 'none']

  for (const tag of Object.keys(EXPECTED)) {
    for (const outcome of outcomes) {
      const expected = EXPECTED[tag][outcome]
      it(`${tag} × outcome=${outcome} → ${expected}`, () => {
        const { won, lost, draw } = ctxFor(outcome)
        expect(isGenericMatch(tag, won, lost, draw)).toBe(expected)
      })
    }
  }

  it('täcker exakt samma taggmängd som produktionskoden (TAG_DEFS)', () => {
    // Om någon lägger till en ny tagg i TAG_DEFS utan att lägga till en
    // rad i EXPECTED ovan, ska det här testet faila — det är hela poängen
    // med tabelltestet: en ny tagg måste klassificeras medvetet.
    expect(new Set(Object.keys(EXPECTED))).toEqual(new Set(ALL_PRESS_TAGS))
  })

  it('okänd tagg (inte i TAG_DEFS) är aldrig generic-eligible', () => {
    expect(isGenericMatch('nagon_ny_tagg_som_inte_klassificerats', true, false, false)).toBe(false)
    expect(isGenericMatch('nagon_ny_tagg_som_inte_klassificerats', false, true, false)).toBe(false)
    expect(isGenericMatch('nagon_ny_tagg_som_inte_klassificerats', false, false, true)).toBe(false)
  })
})
