import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { NavigateFunction } from 'react-router-dom'
import { createNewGame } from '../../../../application/useCases/createNewGame'
import { OrtenTab } from '../OrtenTab'

describe('OrtenTab — bandyskola och Bandyplay är separata verksamheter', () => {
  it('visar barnskolan, streaming och den avancerade skolan som tre egna rader', () => {
    const base = createNewGame({ managerName: 'Test', clubId: 'club_forsbacka', season: 2025, seed: 1 })
    const game = {
      ...base,
      communityActivities: {
        ...base.communityActivities!,
        bandySchoolBasic: true,
        bandyplay: false,
        bandySchool: true,
      },
    }
    const club = game.clubs.find(candidate => candidate.id === game.managedClubId)!
    const html = renderToStaticMarkup(
      <OrtenTab club={club} game={game} navigate={(() => {}) as NavigateFunction} onNavigateTab={() => {}} />,
    )

    expect(html).toContain('Bandyskola för barn')
    expect(html).toContain('Bandyplay')
    expect(html).toContain('Bandyskola avancerad')
  })
})
