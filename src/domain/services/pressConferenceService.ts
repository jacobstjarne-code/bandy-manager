import type { SaveGame } from '../entities/SaveGame'
import type { GameEvent } from '../entities/GameEvent'
import type { Fixture } from '../entities/Fixture'
import { getRivalry } from '../data/rivalries'

const JOURNALISTS = ['SVT Nyheter', 'Bandyplay', 'Lokaltidningen', 'Sportbladet', 'Bandypuls']

interface PressQuestion {
  question: string
  choices: PressChoiceData[]
}

interface PressChoiceData {
  id: string
  label: string
  moraleEffect: number
  mediaQuote: string
}

const QUESTIONS: Record<string, PressQuestion[]> = {
  bigWin: [
    {
      question: 'Imponerande seger. Var det ert bästa spel den här säsongen?',
      choices: [
        { id: 'confident', label: '"Vi visade vad vi kan."', moraleEffect: 5, mediaQuote: 'Tränaren var säker: "Vi visade vad vi kan."' },
        { id: 'humble', label: '"Bra dag, men vi har mer att ge."', moraleEffect: 3, mediaQuote: 'Tränaren var ödmjuk: "Bra dag, men vi har mer att ge."' },
        { id: 'deflect', label: '"Vi fokuserar redan på nästa match."', moraleEffect: 2, mediaQuote: 'Tränaren fokuserade framåt: "Vi tänker på nästa match."' },
      ],
    },
    {
      question: 'Laget spelade otroligt idag. Vad är hemligheten?',
      choices: [
        { id: 'confident', label: '"Träningen betalar sig."', moraleEffect: 5, mediaQuote: 'Tränaren: "Träningen betalar sig. Vi jobbar hårt varje dag."' },
        { id: 'humble', label: '"Laget förtjänar all cred."', moraleEffect: 4, mediaQuote: 'Tränaren hyllade truppen: "Laget förtjänar all cred."' },
        { id: 'deflect', label: '"Det är ett kollektivt projekt."', moraleEffect: 2, mediaQuote: 'Tränaren höll låg profil: "Det är ett kollektivt projekt."' },
      ],
    },
    {
      question: 'Tretalet idag — är det ett mönster eller en engångsgrej?',
      choices: [
        { id: 'confident', label: '"Det här är vi. Kom och se oss igen."', moraleEffect: 6, mediaQuote: 'Tränaren utmanade: "Det här är vi. Kom och se oss igen."' },
        { id: 'humble', label: '"Motståndarna hjälpte till med sina misstag."', moraleEffect: 2, mediaQuote: 'Tränaren var generös: "Motståndarna hjälpte till med sina misstag."' },
        { id: 'deflect', label: '"Varje match är sin egen."', moraleEffect: 2, mediaQuote: 'Tränaren: "Varje match är sin egen. Vi lever i nuet."' },
      ],
    },
  ],
  win: [
    {
      question: 'Seger — berätta om matchen.',
      choices: [
        { id: 'humble', label: '"Stark insats av hela laget."', moraleEffect: 4, mediaQuote: 'Tränaren var nöjd: "Stark insats av hela laget."' },
        { id: 'confident', label: '"Vi spelade precis som vi ville."', moraleEffect: 5, mediaQuote: 'Tränaren: "Vi spelade precis som vi ville."' },
        { id: 'deflect', label: '"Jobbet är inte klart."', moraleEffect: 2, mediaQuote: 'Tränaren höll fokus: "Jobbet är inte klart."' },
      ],
    },
    {
      question: 'Tre viktiga poäng. Hur påverkar det stämningen i laget?',
      choices: [
        { id: 'passionate', label: '"Det ger energi hela veckan!"', moraleEffect: 6, mediaQuote: 'Tränaren var entusiastisk: "Segrar ger energi hela veckan!"' },
        { id: 'humble', label: '"Vi jobbar poäng för poäng."', moraleEffect: 3, mediaQuote: 'Tränaren: "Vi jobbar poäng för poäng. Inga garantier."' },
        { id: 'deflect', label: '"Fokusen är alltid på nästa match."', moraleEffect: 2, mediaQuote: 'Tränaren: "Fokusen är alltid på nästa match."' },
      ],
    },
  ],
  loss: [
    {
      question: 'Tung förlust. Vad gick fel?',
      choices: [
        { id: 'humble', label: '"Vi var inte tillräckligt bra idag."', moraleEffect: 2, mediaQuote: 'Tränaren var självkritisk: "Vi var inte tillräckligt bra idag."' },
        { id: 'angry', label: '"Domsluten gick emot oss."', moraleEffect: -3, mediaQuote: 'Tränaren var bitter: "Domsluten gick emot oss."' },
        { id: 'deflect', label: '"Vi analyserar och kommer tillbaka starkare."', moraleEffect: 1, mediaQuote: 'Tränaren: "Vi analyserar och kommer tillbaka starkare."' },
      ],
    },
    {
      question: 'Laget såg trötta ut i andra halvlek. Kondition?',
      choices: [
        { id: 'humble', label: '"Vi tar på oss det och tränar hårdare."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi tar på oss det och tränar hårdare."' },
        { id: 'deflect', label: '"Det handlade mer om taktik."', moraleEffect: 1, mediaQuote: 'Tränaren: "Det handlade mer om taktik än kondition."' },
        { id: 'confident', label: '"Vi hade kontroll — resultatet visar inte bilden."', moraleEffect: 0, mediaQuote: 'Tränaren höll fast vid sin syn: "Resultatet visar inte hela bilden."' },
      ],
    },
    {
      question: 'Supportrarna är besvikna. Vad säger du till dem?',
      choices: [
        { id: 'passionate', label: '"Vi sviker er inte igen. Det lovar jag."', moraleEffect: 3, mediaQuote: 'Tränaren lovade fansen: "Vi sviker er inte igen."' },
        { id: 'humble', label: '"De har rätt att vara besvikna. Vi förtjänade inte mer."', moraleEffect: 2, mediaQuote: 'Tränaren: "Fansen har rätt att vara besvikna."' },
        { id: 'deflect', label: '"Vi måste titta på filmen och lära oss."', moraleEffect: 1, mediaQuote: 'Tränaren: "Vi måste titta på filmen och lära oss."' },
      ],
    },
  ],
  bigLoss: [
    {
      question: 'En mörk kväll. Hur tar ni er vidare?',
      choices: [
        { id: 'humble', label: '"Vi måste titta oss själva i spegeln."', moraleEffect: 3, mediaQuote: 'Tränaren var brutal: "Vi måste titta oss i spegeln."' },
        { id: 'passionate', label: '"Jag tar på mig ansvaret."', moraleEffect: 4, mediaQuote: 'Tränaren tog ansvar: "Det här är mitt ansvar. Jag tar det fullt ut."' },
        { id: 'angry', label: '"Det var inte acceptabelt."', moraleEffect: -2, mediaQuote: 'Tränaren var direkt: "Det var inte acceptabelt. Punkt."' },
      ],
    },
    {
      question: 'Är du orolig för lagets form?',
      choices: [
        { id: 'confident', label: '"Nej. Vi reser oss. Det vet jag."', moraleEffect: 3, mediaQuote: 'Tränaren visade ledarskap: "Vi reser oss. Det vet jag."' },
        { id: 'humble', label: '"Vi måste vara ärliga mot oss själva."', moraleEffect: 2, mediaQuote: 'Tränaren: "Vi måste vara ärliga mot oss själva."' },
        { id: 'deflect', label: '"Form är cyklisk. Det vänder."', moraleEffect: 1, mediaQuote: 'Tränaren: "Form är cyklisk. Det vänder."' },
      ],
    },
  ],
  draw: [
    {
      question: 'Oavgjort — nöjd eller besviken?',
      choices: [
        { id: 'humble', label: '"Vi tar en poäng och jobbar vidare."', moraleEffect: 2, mediaQuote: 'Tränaren nöjde sig: "En poäng och vidare."' },
        { id: 'confident', label: '"Vi borde ha vunnit."', moraleEffect: 1, mediaQuote: 'Tränaren var hungrig: "Vi borde ha vunnit den matchen."' },
        { id: 'deflect', label: '"Bra kamp av båda lagen."', moraleEffect: 2, mediaQuote: 'Tränaren var generös: "Bra kamp av båda lagen."' },
      ],
    },
    {
      question: 'Ni kvitterade sent. Vad säger det om lagets karaktär?',
      choices: [
        { id: 'passionate', label: '"Det säger allt om vår mentalitet."', moraleEffect: 5, mediaQuote: 'Tränaren var stolt: "Det säger allt om vår mentalitet."' },
        { id: 'humble', label: '"Vi ger oss aldrig. Det är vår styrka."', moraleEffect: 4, mediaQuote: 'Tränaren: "Vi ger oss aldrig. Det är vår styrka."' },
        { id: 'deflect', label: '"Vi borde ha gjort det enklare för oss."', moraleEffect: 1, mediaQuote: 'Tränaren: "Vi borde ha gjort det enklare för oss."' },
      ],
    },
  ],
  derbyWin: [
    {
      question: 'Derbyseger! Vad betyder det för laget?',
      choices: [
        { id: 'passionate', label: '"Det här är för fansen. De förtjänar det."', moraleEffect: 8, mediaQuote: 'Tränaren dedikerade segern: "Det här är för fansen. De förtjänar det."' },
        { id: 'deflect', label: '"Tre poäng, inget mer."', moraleEffect: 3, mediaQuote: 'Tränaren höll det kort: "Tre poäng, inget mer."' },
        { id: 'confident', label: '"Vi visade att vi är bättre."', moraleEffect: 5, mediaQuote: 'Tränaren tog ut svängarna: "Vi visade att vi är bättre."' },
      ],
    },
    {
      question: 'Vad gör en derbyseger med truppen?',
      choices: [
        { id: 'passionate', label: '"Det cementerar en identitet. Vi är ett lag."', moraleEffect: 8, mediaQuote: 'Tränaren: "Det cementerar vår identitet. Vi är ett lag."' },
        { id: 'humble', label: '"Vi är glada, men fokuserar snabbt på nästa match."', moraleEffect: 4, mediaQuote: 'Tränaren höll fokus: "Vi är glada, men tänker redan på nästa match."' },
        { id: 'confident', label: '"Det bekräftar att vi är på rätt väg."', moraleEffect: 5, mediaQuote: 'Tränaren: "Det bekräftar att vi är på rätt väg."' },
      ],
    },
  ],
  derbyLoss: [
    {
      question: 'Smärtsam förlust i derbyt. Kommentar?',
      choices: [
        { id: 'passionate', label: '"Vi kommer tillbaka. Det här glömmer vi inte."', moraleEffect: 3, mediaQuote: 'Tränaren lovade revansch: "Vi kommer tillbaka. Det glömmer vi inte."' },
        { id: 'humble', label: '"De var bättre idag, vi får ge dem det."', moraleEffect: 1, mediaQuote: 'Tränaren var generös: "De var bättre idag. Det får vi erkänna."' },
        { id: 'angry', label: '"Jag vill inte prata om derbyt."', moraleEffect: -2, mediaQuote: 'Tränaren vägrade kommentera: "Jag vill inte prata om det idag."' },
      ],
    },
    {
      question: 'Hur stänger man av derby-förlusten mentalt?',
      choices: [
        { id: 'passionate', label: '"Man stänger inte av. Man använder den."', moraleEffect: 4, mediaQuote: 'Tränaren: "Man stänger inte av en derbyförlust. Man använder den som bränsle."' },
        { id: 'deflect', label: '"Fokus på nästa match. Det är det enda."', moraleEffect: 2, mediaQuote: 'Tränaren: "Fokus på nästa match. Det är det enda som gäller."' },
        { id: 'humble', label: '"Det svider, men vi lär oss av det."', moraleEffect: 2, mediaQuote: 'Tränaren: "Det svider, men vi lär oss av det."' },
      ],
    },
  ],
}

export function generatePressConference(
  fixture: Fixture,
  game: SaveGame,
  rand: () => number,
): GameEvent | null {
  const isHome = fixture.homeClubId === game.managedClubId
  const myScore = isHome ? (fixture.homeScore ?? 0) : (fixture.awayScore ?? 0)
  const theirScore = isHome ? (fixture.awayScore ?? 0) : (fixture.homeScore ?? 0)
  const rivalry = getRivalry(fixture.homeClubId, fixture.awayClubId)

  let context: string
  if (rivalry && myScore > theirScore) context = 'derbyWin'
  else if (rivalry && myScore < theirScore) context = 'derbyLoss'
  else if (myScore >= theirScore + 3) context = 'bigWin'
  else if (myScore > theirScore) context = 'win'
  else if (theirScore >= myScore + 3) context = 'bigLoss'
  else if (myScore < theirScore) context = 'loss'
  else context = 'draw'

  const questions = QUESTIONS[context]
  if (!questions || questions.length === 0) return null

  const question = questions[Math.floor(rand() * questions.length)]
  const journalist = JOURNALISTS[Math.floor(rand() * JOURNALISTS.length)]

  const choices = question.choices.map(c => ({
    id: c.id,
    label: c.label,
    effect: {
      type: 'pressResponse' as const,
      value: c.moraleEffect,
      mediaQuote: `📰 ${journalist}: ${c.mediaQuote}`,
    },
  }))

  return {
    id: `event_press_r${fixture.roundNumber ?? 0}_${game.currentSeason}`,
    type: 'pressConference' as const,
    title: `🎤 Presskonferens — ${journalist}`,
    body: `"${question.question}"`,
    choices,
    resolved: false,
  }
}
