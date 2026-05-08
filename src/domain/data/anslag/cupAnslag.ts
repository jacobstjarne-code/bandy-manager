export type AnslagKey =
  | 'cup_start'
  | 'cup_between'
  | 'cup_finalweekend_pre'
  | 'cup_done'
  | 'cup_done_winner'

export interface AnslagText {
  chapter: string
  body: string
  bodyDirektkval?: string
}

export const CUP_ANSLAG: Record<AnslagKey, AnslagText> = {
  cup_start: {
    chapter: '⬩ Anslaget ⬩',
    body: `Säsongen närmar sig, men först bandyårets första delikatess. Svenska cupen är inte den finaste pokalen, men den är den första.<br><br>Isen är sällan vad den ska vara, spelarna är ännu inte i form, och formationen sitter inte. Just därför är det något särskilt. Här syns vem som hängt med under sommaren och vem som kommit tillbaka för tidigt.<br><br>Bandyårets första riktiga avläsning.`,
    bodyDirektkval: `<br><br><em>({clubName} väntar. Andras kamp först. Vår cup börjar i kvarten.)</em>`,
  },
  cup_between: {
    chapter: '⬩ Snålvinden ⬩',
    body: `Det blåser snålt över hallarna i östra Sverige den här veckan. Tre lag har redan åkt ur.<br><br>Ingen pratar om cupen som om den vore avgörande, men ingen ser ut att ta lätt på den heller. Det är så cupen brukar vara.<br><br>Man säger en sak och spelar en annan.`,
  },
  cup_finalweekend_pre: {
    chapter: '⬩ Helgen ⬩',
    body: `Nu samlas det som finns kvar. Fyra lag, två dagar, en helg där bandysverige för första gången på året får se varandra på samma plats.<br><br>Det är inte ligan. Det är inte finalen. Men för dem som varit med länge är det här den helg där säsongen bestäms — inte i resultat, utan i självbild.`,
  },
  cup_done: {
    chapter: '⬩ Pokalen ⬩',
    body: `Cupen är spelad. Pokalen står på en byrå någonstans.<br><br>Nu vidtar det som är längre, jämnare, och i längden viktigare. Ligan börjar nästa helg.<br><br>Det är dags att gå in i den med det man har lärt sig — och med vetskapen om att cupen, hur fin den än var, ändå bara är cupen.`,
  },
  cup_done_winner: {
    chapter: '⬩ Pokalen ⬩',
    body: `<strong>Pokalen är vår.</strong><br><br>Den är inte den finaste pokalen i bandy. Men den är den första vi vunnit på länge — och det väger.<br><br>Ligan börjar nästa helg. Vi går in i den med pokalen i ena handen och en målbild i den andra.`,
  },
}
