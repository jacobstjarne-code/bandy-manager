import type { SeasonPhase } from './seasonPhases'

export interface FunctionaryTemplate {
  role: string
  roleDescription: string
  namePool: string[]
  quotesByPhase: Partial<Record<SeasonPhase, string[]>>
  quotesByCondition?: {
    afterWin?: string[]
    afterLoss?: string[]
    lowFinances?: string[]
    derby?: string[]
  }
}

export const FUNCTIONARY_TEMPLATES: FunctionaryTemplate[] = [
  {
    role: 'Kioskansvarig',
    roleDescription: 'Har skött kiosken i 14 år',
    namePool: ['Rolf', 'Kurt', 'Lennart', 'Göran', 'Börje', 'Arne', 'Stig', 'Benny'],
    quotesByPhase: {
      höststart: [
        'Håller tummar. Är beställt extra korv i år.',
        'Alla är redo. Kiosken med. Nytt kylskåp äntligen.',
        'I år kör vi hårt. Jag har sett truppen. Det kan bli bra.',
        'Föreningens bästa tillgång är folket bakom kiosken. Det vet ni.',
      ],
      höst: [
        'Rutinen är inne nu. Det är bra. Rutinen vinner matcher.',
        'November. Mörkt och kallt. Exakt som det ska vara.',
        'Lagen börjar visa vad dom går för nu. Det är dags.',
        'Hört att grannklubben värvat. Spelar ingen roll. Vi har våra.',
      ],
      annandagen: [
        'Annandagsbandyn är årets viktigaste match. Det är bara sant.',
        'Fullt på läktaren imorgon. Har tänkt på det sen i somras.',
        'Folk ringer och frågar om biljetter. Det händer inte varje år.',
        'Mamma Britta hjälper till i kiosken annandagen. Tradition.',
      ],
      vinter: [
        'Kylan biter. Men vi är kvar. Det är det som räknas.',
        'Folk pratar mer om hockeyn nu. Det irriterar mig.',
        'Glöggrekord i år. Positivt. Annars är det tungt.',
        'Det är omgång tolv. Halvleken. Nu börjar det på riktigt.',
      ],
      vinterkris: [
        'Jag säger ingenting. Men jag har sett sämre lag vända.',
        'Tabellen är vad den är. Men vi ger oss inte.',
        'Försäljningen i kiosken är ner. Stämningen märks.',
        'Kurt sa att vi är klara. Jag sa åt Kurt att hålla käften.',
      ],
      våroffensiv: [
        'Februari. Nu avgörs det. Folk på läktaren vet det.',
        'Sju omgångar kvar. Varje poäng väger dubbelt nu.',
        'Isen är bäst nu. Kall och fast. Perfekt bandyis.',
        'Kan lukta slutspel. Har luktat det förut. Smakar bättre när man vinner.',
      ],
      slutspurt: [
        'Tre omgångar kvar. Det är som en finale varje gång nu.',
        'Hela orten pratar om det. Det har inte hänt på länge.',
        'Har jobbat kiosken i fjorton år. Har aldrig känt såhär.',
        'Nu eller aldrig. Det är bandyns natur.',
      ],
    },
    quotesByCondition: {
      afterWin: [
        'En seger är en seger. Mer korv såldes. Bra kväll.',
        'Publiken var glad. Kiosken var tom. Perfekt.',
        'Hörde folk sjunga på väg hem. Det sker inte varje vecka.',
      ],
      afterLoss: [
        'Det är tyst i omklädningsrummet. Jag lämnar kaffet utanför dörren.',
        'Folk köper ingenting när vi förlorar. Det är ett faktum.',
        'Tappar vi nu tappar vi allt. Det vet spelarna.',
      ],
      derby: [
        'Derbyt är inte en match. Det är ett krig med regler.',
        'Förra gången vi mötte dom gick det inte bra. Säger inget mer.',
        'Hela byn är på läktaren. Hela byn.',
      ],
      lowFinances: [
        'Kassören ringde. Jag förstod. Korvpriserna hålls.',
        'Det är tufft. Men vi har alltid hittat en väg.',
        'Folk donerar mer när det är svårt. Märkligt men sant.',
      ],
    },
  },
  {
    role: 'Ungdomsledare',
    roleDescription: 'Tränar P17-laget sedan sex år tillbaka',
    namePool: ['Annika', 'Birgitta', 'Susanne', 'Kristina', 'Margareta', 'Eva-Lena', 'Ingrid', 'Mona'],
    quotesByPhase: {
      höststart: [
        'P17 ser bra ut i år. Tre pojkar som kan bli något på sikt.',
        'Ny säsong. Ny chans. Ungdomarna vet inte om tabellen. De spelar ändå.',
        'Har sett träningarna. Det börjar likna ett lag.',
      ],
      höst: [
        'P17 hittar rytmen. Det tar tre matcher. Nu är vi där.',
        'Bra träningar i veckan. Ungdomarna är hungriga.',
        'En av killarna frågade om han kan komma upp och träna med er. Snart.',
      ],
      annandagen: [
        'Ungdomarna älskar annandagsbandyn. De springer runt och säljer lotter.',
        'Fick in tre nya spelare till P17. Julklappar, kalla dom.',
        'Julpausen är bra. Spelarna vilar. Sen kör vi hårt.',
      ],
      vinter: [
        'Minus sexton på träningen igår. Fem dök upp. Dom fem är laget.',
        'Säsongen för ungdomarna är i sin bästa del nu. De har hittat varann.',
        'Håller ögonen på en av pojkarna. Kan bli bra för er på sikt.',
      ],
      våroffensiv: [
        'P17-säsongen går mot sitt slut. Pojkarna har vuxit enormt.',
        'Tre av mina spelare tittar på era matcher nu. Dom vill dit.',
        'Sista pushen för ungdomarna. Precis som för er.',
      ],
      slutspurt: [
        'Pojkarna i P17 tittar på varje match nu. Dom vill upp.',
        'Har tre som är redo snart. Men det är ert beslut.',
        'Avslutning för P17 om två veckor. Men vi följer med er in i slutet.',
      ],
    },
    quotesByCondition: {
      afterWin: [
        'Ungdomarna firade med oss. Det är därför vi gör det här.',
        'P17 vann också igår. Bra dag för klubben.',
      ],
      afterLoss: [
        'Håller ungdomarna borta från löparsniack. Det hjälper ingen.',
        'Pojkarna frågar mig varför. Jag säger: det händer. Fortsätt träna.',
      ],
    },
  },
  {
    role: 'Styrelseordförande',
    roleDescription: 'Leder föreningen sedan tre år',
    namePool: ['Hans', 'Ulf', 'Jan-Erik', 'Bengt', 'Lars-Åke', 'Sven', 'Gunnar', 'Mattias'],
    quotesByPhase: {
      höststart: [
        'Styrelsen tror på det här. Fullt ut.',
        'Kommunen ringde. Positiva signaler. Mer säger jag inte.',
        'Budgeten är satt. Förutsättningarna finns. Nu är det er tur.',
      ],
      höst: [
        'Styrelsen är nöjd med starten. Håll kursen.',
        'Sponsorerna hör av sig med positiva signaler. Bra.',
        'Tidigt att säga vart det bär. Men riktningen är rätt.',
      ],
      vinter: [
        'Halvtid. Styrelsen bedömer läget löpande.',
        'Ekonomin är stabil. Det är mer än vi vågades hoppas i somras.',
        'Hör vad folk säger i butiken. Förväntningarna är höga.',
      ],
      vinterkris: [
        'Styrelsen har sett sämre. Vi ger oss inte.',
        'Licensnämnden är nöjd. Det är det viktigaste just nu.',
        'Föreningen är inte bara tabellen. Men tabellen hjälper.',
      ],
      våroffensiv: [
        'Nu ser styrelsen vad vi jobbar mot. Det är viktigt.',
        'Kommunen följer slutspurten. Deras intresse är ett gott tecken.',
        'Styrelsen samlas inför varje match nu. Vi vill vara med.',
      ],
      slutspurt: [
        'Det är nu. Styrelsen är enad. Kör.',
        'Kommunen ringer mer nu. Det är ett gott tecken.',
        'Tre omgångar kvar. Allt är möjligt. Styrelsen tror det.',
      ],
    },
    quotesByCondition: {
      lowFinances: [
        'Ekonomin är ansträngd. Vi hanterar det. Men det är tajt.',
        'Styrelsen tittar på alternativen. Håll ut.',
      ],
      afterWin: [
        'Bra. Styrelsen är nöjd. Fortsätt.',
        'Kommunen hörde av sig med gratulationer. Det händer sällan.',
      ],
      derby: [
        'Det är ett derby. Styrelsen sitter på läktaren. Alla av dem.',
        'Orten vaknar till liv inför derbyt. Det är värt mer än poäng.',
      ],
    },
  },
]
