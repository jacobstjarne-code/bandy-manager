import type { AnslagText } from './types'

export type BoardAnslagKey = 'season_kickoff'

export const BOARD_ANSLAG: Record<BoardAnslagKey, AnslagText> = {
  season_kickoff: {
    chapter: '⬩ Styrelsemötet ⬩',
    variants: [
      {
        body: `Kaffe i {clubhouse}. {chairmanFirstName} {chairmanLastName} hälsar.<br><br><em>"Då kör vi. Välkommen."</em><br><br><strong>{treasurerFirstName} {treasurerLastName}, kassör:</strong><br><em>"{reportText}<br><br>Mer har vi inte."</em><br><br><strong>{chairmanFirstName} {chairmanLastName}, ordförande:</strong><br><em>"Plats fem till åtta. Inget kvalspel.<br><br>Och håll bygden med oss. Tomma läktare är dåligt för bandyn och dåligt för budgeten."</em><br><br><strong>{memberFirstName} {memberLastName}, ledamot:</strong><br><em>"För många här är det här säsongens enda samling. Glöm inte det."</em>`,
      },
    ],
  },
}
