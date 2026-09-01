import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { EkonomiTab } from '../EkonomiTab'

describe('EkonomiTab — spelarens siffror beskriver den kanoniska prognosen', () => {
  it('visar full nästa-omgångsprognos och inga gamla fasta aktivitetslöften', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const game = {
      ...base,
      communityActivities: {
        ...base.communityActivities!,
        kiosk: 'upgraded' as const,
        lottery: 'intensive' as const,
        bandyplay: true,
        functionaries: true,
        bandySchool: true,
        socialMedia: true,
      },
    }
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const html = renderToStaticMarkup(
      <EkonomiTab
        club={club}
        game={game}
        seekSponsor={() => ({ success: false })}
        activateCommunity={() => ({ success: false })}
        setTransferBudget={() => {}}
        buyScoutRounds={() => {}}
      />,
    )

    expect(html).toContain('Beräknade intäkter nästa omg')
    expect(html).toContain('Beräknade kostnader nästa omg')
    expect(html).toContain('Netto nästa omg')
    expect(html).toContain('Starkare förankring kan ge större publik och bättre kommunbidrag.')
    expect(html).not.toContain('~8 500 netto/match')
    expect(html).not.toContain('~1 500/match')
    expect(html).not.toContain('~4 000 besparing/match')
  })
})
