import type { AnslagText } from './types'

export type CupAnslagKey =
  | 'cup_start'
  | 'cup_first_match'
  | 'cup_between'
  | 'cup_finalweekend_pre'
  | 'cup_final_pre'
  | 'cup_done'
  | 'cup_done_winner'

export const CUP_ANSLAG: Record<CupAnslagKey, AnslagText> = {
  cup_start: {
    chapter: '⬩ Anslaget ⬩',
    variants: [
      {
        body: `Säsongen närmar sig, men först bandyårets första delikatess. Svenska cupen är inte den finaste pokalen, men den är den första.<br><br>Isen är sällan vad den ska vara, spelarna är ännu inte i form, och formationen sitter inte. Just därför är det något särskilt. Här syns vem som hängt med under sommaren och vem som kommit tillbaka för tidigt.<br><br>Bandyårets första riktiga avläsning.`,
      },
      {
        body: `Cupen är på väg. Inte ligan, inte slutspelet — men det första. Det är något särskilt med första matcherna i oktober.<br><br>Lottningen finns där. Resultatet finns inte än. Just nu vet ingen mer än alla andra. Det kommer att ändras snart.<br><br>Bandyåret börjar nu.`,
      },
      {
        body: `Oktober. Lottningen är gjord och planerna är spolade. Det är fortfarande sommarljus i minnet, men inte här — här är det vinterns början som närmar sig.<br><br>Cupen är cupen. Den brukar inte avgöra något viktigt. Men den brukar avgöra mycket om vad som komma ska.<br><br>Vi får se.`,
      },
    ],
    bodyDirektkval: `<br><br><em>({clubName} väntar. Andras kamp först. Vår cup börjar i kvarten.)</em>`,
  },
  cup_first_match: {
    chapter: '⬩ Cupen börjar ⬩',
    variants: [
      {
        body: `<em>"Lottningen kunde varit värre."</em><br><br>Replik från klubbhuset. Ingen vet vem som sa det först.<br><br>{vsLabel} {motståndare}. Förstarundan brukar avgöras tidigt. Eller inte.<br><br>Vinst ger kvartsfinal. Förlust ger en söndag mer att träna. Ingen kommer minnas matchen — utom om ni förlorar.`,
      },
    ],
  },
  cup_between: {
    chapter: '⬩ Snålvinden ⬩',
    variants: [
      {
        body: `Det blåser snålt över bandyplanerna i östra Sverige den här veckan. Tre lag har redan åkt ur.<br><br>Ingen pratar om cupen som om den vore avgörande, men ingen ser ut att ta lätt på den heller. Det är så cupen brukar vara.<br><br>Man säger en sak och spelar en annan.`,
      },
      {
        body: `Oktober. Mörkret kommer för tidigt nu, frosten ligger om mornarna, och spelet är inte där det ska vara än.<br><br>Tre lag har åkt ur. Ingen sörjer dem särskilt mycket — men ingen vill vara nästa.<br><br>Cupen är cupen. Inget mer, inget mindre.`,
      },
      {
        body: `Mellan rundorna. Utvärderingar i klubbhus över hela landet. Vad gick bra. Vad gick mindre bra.<br><br>Tre lag är borta. För dem är cupen redan något att lägga bakom sig och inte tänka på. För resten är den fortfarande där, och det är fortfarande inte klart vad den ska bli.<br><br>Bandyhösten är ung.`,
      },
    ],
  },
  cup_finalweekend_pre: {
    chapter: '⬩ Helgen ⬩',
    variants: [
      {
        body: `Nu samlas det som finns kvar. Fyra lag, två dagar, en helg där bandysverige för första gången på året får se varandra på samma plats.<br><br>Det är inte ligan. Det är inte finalen. Men för dem som varit med länge är det här den helg där säsongen bestäms — inte i resultat, utan i självbild.`,
      },
      {
        body: `Bollnäs den här helgen. Sävstaås, fyrverkerier, glögg på läktaren. Det är så cup-finalhelgen brukar vara.<br><br>Två semifinaler på lördag, finalen på söndag. Fyra lag åker dit, ett åker hem som vinnare. Resten åker hem som vanligt.<br><br>Det är inte SM. Men ingen här tror något annat heller.`,
      },
      {
        body: `Sex omklädningsrum i Bollnäs. Fyra för spelarna, två för domarna. Allt är förberett.<br><br>Vi har rest hit för en match, och om det går bra för två. Vi vet inte än vilket. Det är poängen med slutspel.<br><br>Det är cup-finalhelg. Den brukar inte göra sig bättre än så.`,
      },
    ],
  },
  cup_final_pre: {
    chapter: '⬩ Cupfinalen ⬩',
    variants: [
      {
        body: `Cupfinal.<br><br>Två lag kvar. Inget omspel. {vsLabel} {motståndare}.<br><br>Det här är inget träningstillfälle. En match. Sen är det över.`,
      },
    ],
  },
  cup_done: {
    chapter: '⬩ Pokalen ⬩',
    variants: [
      {
        body: `Cupen är spelad. Pokalen står på en byrå någonstans.<br><br>Nu vidtar det som är längre, jämnare, och i längden viktigare. Ligan börjar nästa helg.<br><br>Det är dags att gå in i den med det man har lärt sig — och med vetskapen om att cupen, hur fin den än var, ändå bara är cupen.`,
      },
      {
        body: `Vår cup är slut. Tre matcher om vi var med långt, en om det inte gick.<br><br>Det är så cupen är. Den prövar lag innan ligan tar vid. Vad lärde vi oss? Mer än vi tror, mindre än vi ville.<br><br>Ligan väntar. Det är där det avgörs.`,
      },
      {
        body: `Cupen är avgjord. Spelarna kommer tillbaka till tisdagsträningarna. Magnus jobbar med dem som behöver formjustering. Resten är som vanligt.<br><br>Pokalen är någon annans. Det blev vad det blev.<br><br>Nu ligan. Då har vi 22 omgångar att visa vad vi gör med en hel säsong.`,
      },
    ],
  },
  cup_done_winner: {
    chapter: '⬩ Pokalen ⬩',
    variants: [
      {
        body: `<strong>Pokalen är vår.</strong><br><br>Den är inte den finaste pokalen i bandy. Men den är den första vi vunnit på länge — och det väger.<br><br>Ligan börjar nästa helg. Vi går in i den med pokalen i ena handen och en målbild i den andra.`,
      },
      {
        body: `<strong>Vi vann cupen.</strong><br><br>Det är inte SM. Men det är det första laget i Sverige har sett i år, och det var oss som tog hem den. Förra säsongen kom vi inte till finalen. Året innan kom vi inte ens till semi.<br><br>Sen är det ligan. Den är något annat. Men idag är pokalen vår.`,
      },
      {
        body: `<strong>Pokalen är på byrån i klubbhuset nu.</strong> Lite blank. Lite lätt.<br><br>Det var inte säsongens viktigaste match. Men ingen sa något om det när Bengt höjde den.<br><br>Ligan börjar nästa helg. Det här minns vi.`,
      },
    ],
  },
}
