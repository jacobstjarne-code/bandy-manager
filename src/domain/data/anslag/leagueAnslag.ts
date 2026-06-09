import type { AnslagText } from './types'

export type LeagueAnslagKey =
  | 'league_start'
  | 'league_midwinter'
  | 'league_halfway'
  | 'playoff_qualification'
  | 'regular_done'
  | 'playoff_start'
  | 'season_done'

export const LEAGUE_ANSLAG: Record<LeagueAnslagKey, AnslagText> = {
  league_start: {
    chapter: '⬩ Helgen kommer ⬩',
    variants: [
      {
        body: `Ligan börjar i helgen. 22 omgångar framför oss.<br><br>Cupen är cupen. Ligan är något annat — det är det som mäts på riktigt, det är vad folk minns en klubb för.<br><br>Det blir mörkare nu. Tisdagsträningarna får lampor på. Det här är säsongens långa parti.`,
      },
      {
        body: `November. Frosten ligger på allvar nu. Ispremiären ligger bakom oss.<br><br>Ligan börjar i helgen. 22 omgångar — och med det själva poängen med en bandysäsong. Cupen var uppvärmning. Det här är arbetet.<br><br>Spelarna vet det. Klacken vet det. Nu kör vi.`,
      },
      {
        body: `22 omgångar. Lördagsmatcherna börjar. Annandagen och nyårsbandy någonstans i mitten. Sen slutspel om vi orkar dit.<br><br>Det är inte cupen. Det är inte en helg. Det är fyra månader.<br><br>Det börjar i helgen.`,
      },
    ],
  },
  league_midwinter: {
    chapter: '⬩ Januari ⬩',
    variants: [
      {
        body: `Det är mitten av januari. Halva ligan är kvar.<br><br>Ingen pratar om januari som om den var rolig — den är det inte. Mörkt över halva dagen, tisdagsträning i blöt vinter, helgmatcher där isen är mjuk i andra halvlek.<br><br>Det är ändå nu det avgörs. Inte när det är ljust och alla mår bra, utan när det är fyrtio dagar kvar till våren och ingen orkar längre. Bandy är bandy.`,
      },
      {
        body: `Januari är inte rolig. Det är det inget lag som påstår.<br><br>Bilar startar inte. Spelare tappar tändning. Halva ledarstaben funderar på det de skulle gjort istället. Sen kommer lördagen, då spelar man bandy igen — och det är ändå anledningen till att vi finns.<br><br>Halva ligan är kvar. Det är där vi bestämmer vad vi är.`,
      },
      {
        body: `Det är mitten av januari. Solen kommer upp efter morgonträningen och går ner under eftermiddagsmötet. Däremellan finns ingen tid och ändå ska allt göras.<br><br>Vi spelar bandy ändå. Det är vad vi kan.<br><br>Halva ligan är kvar. Säsongen ligger där den ligger.`,
      },
    ],
  },
  league_halfway: {
    chapter: '⬩ Halvvägs ⬩',
    variants: [
      {
        body: `Halva serien spelad. Lika många matcher kvar.<br><br>Tabellen börjar betyda något nu. I november var den en lista. Nu är det positionerna man räknar med, marginalerna man oroar sig över. Var det nere på sju poäng vi ville vara? Det var det.<br><br>Det är inte cupen. Det är inte slutspelet. Det är det här — den långa biten där man får det man förtjänar. Ungefär.`,
      },
      {
        body: `Halva ligan spelad. Träningskvällarna är nu vana, inte uppstart. Skadorna börjar märkas. Krångliga relationer mellan vissa spelare också.<br><br>Tabellen står där den står. Man kan inte gnälla över halva sträckan. Det är resultatet.<br><br>Halva vägen kvar. Resten är ospelad.`,
      },
      {
        body: `Det är inte längre en ny säsong, men inte heller slutet. Vi är där vi alltid hamnar — i bandyårets långa mitt.<br><br>Tabellen är realitet nu. Förra månaden hoppades vi. Nästa månad räknar vi.<br><br>Halva ligan kvar.`,
      },
    ],
  },
  playoff_qualification: {
    chapter: '⬩ Marginaler ⬩',
    variants: [
      {
        body: `Tre omgångar kvar. Tabellen är inte längre en lista — den är ett pussel.<br><br>De flesta vet redan om de är i eller ute. Några klubbar vet inte. De räknar varandras matcher, läser tabellen flera gånger om dagen, lyssnar på radio från andra orter. Vad mötte de? Vad behövde de?<br><br>Det är det här som är slutet på en grundserie. Marginaler.`,
      },
      {
        body: `Tre omgångar kvar. Spelarna räknar målskillnad i sömnen.<br><br>Det är ingen som spelar fritt nu. Det är spel där varje boll betyder något, varje förlorad sekund kostar. Tränaren skäller mer. Klacken klappar lite snabbare. Domarna är mer noggranna än vanligt.<br><br>Marginalsäsong. Det är nu det syns.`,
      },
      {
        body: `Vi vet vart vi är. De andra vet vart de är. Tabellen lämnar inget åt fantasin med tre omgångar kvar.<br><br>Antingen är vi nästan där eller också är vi nästan inte. Det är skillnad mellan en plats högre och en plats lägre. Det är skillnad mellan en god säsong och en mindre god.<br><br>Det avgörs inte i kvart. Det avgörs här.`,
      },
    ],
  },
  regular_done: {
    chapter: '⬩ Grundserien klar ⬩',
    variants: [
      {
        body: `Grundserien är spelad. 22 omgångar, och tabellen står som den står — den ändras inte mer.<br><br>Det är en egen sorts tystnad efter sista omgången. Ingen mer poängjakt, inga fler helger där allt kan flytta sig. Det som är gjort är gjort.<br><br>Sen ritas slutspelsträdet. Då börjar något annat.`,
      },
      {
        body: `Sista omgången är spelad. Grundserien är avgjord.<br><br>Fyra månader ligger bakom oss. Novembermörkret, januari som ingen tyckte om, marginalerna på upploppet. Allt det blev en tabell, och tabellen är klar.<br><br>Nu väntar slutspelet, eller sommaren, beroende på var vi hamnade. Snart vet vi.`,
      },
      {
        body: `Grundserien klar. Tabellen är inte längre rörlig — den är facit.<br><br>Det är nu man ser vad säsongen blev. Inte matcherna en och en, utan helheten: vart 22 omgångar förde oss.<br><br>Slutspelsträdet sätts härnäst. Sen är det noll igen för dem som tog sig dit.`,
      },
    ],
  },
  playoff_start: {
    chapter: '⬩ Slutspelet ⬩',
    variants: [
      {
        body: `Slutspelet är här. Allt från grundserien räknas inte längre.<br><br>22 omgångar har avgjort vilka som spelar. Sen är det noll igen. Du har matcher att vinna, och om du förlorar tillräckligt är du borta. Det enkla i bandy.<br><br>Klacken vet det. Spelarna vet det. Hela klubben skiftar takt. Det är annorlunda nu.`,
      },
      {
        body: `Mars. Solen står lite högre, dagarna är lite längre — men på isen är det fortfarande vinter.<br><br>Slutspelet börjar. Det är därför vi tränat hela hösten, varit ute hela vintern. Det är därför 22 omgångar inte var nog. Det här är hela poängen.<br><br>Vinst eller förlust. Inget mellanting.`,
      },
      {
        body: `Slutspel. Träningstiden krymper. Matcherna blir tätare. Allt fokus är på den som kommer.<br><br>Spelarna sover lite sämre. Tränarna tittar på film till sent. Klacken kommer fram tidigare till matcherna.<br><br>Det är därför vi finns. Bandyklubbar handlar om det här.`,
      },
    ],
  },
  season_done: {
    chapter: '⬩ Sommaren kommer ⬩',
    variants: [
      {
        body: `Säsongen är slut.<br><br>Det blev som det blev. Några matcher man minns, några man helst glömmer. Tabellen står som den står. Pokalen någonstans, eller inte.<br><br>Sen kommer sommaren. Spelarna åker hem. Träningskläder ska tvättas, kontrakt ska skrivas, någon ska säga upp och någon ny ska komma. I oktober är det igång igen.`,
      },
      {
        body: `Säsongen är slut. Sista matchen ligger bakom oss.<br><br>Klubbhuset är fortfarande öppet, men med färre spelare i, kortare möten, mindre brådska. Sen blir det stängt. Ungefär två veckor i april och så börjar planeringen för hösten igen.<br><br>Bandy är cykliskt. Det är därför man håller ut.`,
      },
      {
        body: `Det blev en säsong. Som alla andra och inte heller det.<br><br>En del gick bra. En del gick mindre bra. En del hade vi inte ens räknat med. Sånt som skedde mellan oss och som inte syns i tabellen.<br><br>I oktober är det igång igen. Tills dess.`,
      },
    ],
  },
}
