import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { EkonomiTab, sponsorSearchFeedback } from '../EkonomiTab'

describe('EkonomiTab — spelarens siffror beskriver den kanoniska prognosen', () => {
  it('bevarar actionens riktiga kassafel i stället för att påstå otur och avdrag', () => {
    expect(sponsorSearchFeedback({ success: false, error: 'Inte tillräckligt med pengar (kräver 2,5 tkr)' })).toEqual({
      success: false,
      text: 'Inte tillräckligt med pengar (kräver 2,5 tkr)',
    })
  })

  it('inaktiverar sponsorsökning när klubben saknar sökkostnaden', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const game = {
      ...base,
      clubs: base.clubs.map(c => c.id === base.managedClubId ? { ...c, finances: -1 } : c),
    }
    const club = game.clubs.find(c => c.id === game.managedClubId)!
    const html = renderToStaticMarkup(
      <EkonomiTab
        club={club}
        game={game}
        seekSponsor={() => ({ success: false, error: 'Inte tillräckligt med pengar (kräver 2,5 tkr)' })}
        activateCommunity={() => ({ success: false })}
        setTransferBudget={() => {}}
        buyScoutRounds={() => {}}
      />,
    )

    expect(html).toMatch(/<button[^>]*disabled[^>]*>.*Ragga sponsor/s)
  })

  it('visar full nästa-omgångsprognos och inga gamla fasta aktivitetslöften', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const game = {
      ...base,
      communityActivities: {
        ...base.communityActivities!,
        kiosk: 'upgraded' as const,
        lottery: 'intensive' as const,
        bandySchoolBasic: true,
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
    expect(html).toContain('Ortens förtroende för klubben. Fyller läktaren och väger tungt när kommunen sätter bidraget.')
    expect(html).not.toContain('~8 500 netto/match')
    expect(html).not.toContain('~1 500/match')
    expect(html).not.toContain('~4 000 besparing/match')
    expect(html).toContain('Bandyplay')
    expect(html).toContain('sponsorerna får mer för pengarna')
  })

  it('visar BandyKuls lägre nettokostnad när klubben har en aktiv sponsor', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const game = {
      ...base,
      sponsors: [{
        id: 'bandykul_partner', name: 'Mätpartner', category: 'Test',
        weeklyIncome: 5000, contractRounds: 10, signedRound: 0,
      }],
      communityActivities: {
        ...base.communityActivities!,
        kiosk: 'none' as const,
        lottery: 'none' as const,
        bandySchoolBasic: true,
        bandyplay: false,
        functionaries: false,
        bandySchool: false,
        socialMedia: false,
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

    expect(html).toContain('Bandyskola för barn')
    // Första prognosen är hemmamatch: 375−750 match + 500−750 omgång = −625.
    expect(html).toContain('Nästa omg: −625 kr')
  })

  it('märker inaktiva aktiviteters ekonomi som en hypotes och skiljer akademisatsningen från barnverksamheten', () => {
    const game = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
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

    expect(html).toContain('Om du startar:')
    expect(html).toContain('Bandyskola → Akademi')
  })
})
