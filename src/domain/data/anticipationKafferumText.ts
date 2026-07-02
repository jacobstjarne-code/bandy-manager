// Förväntans-ramp mot kalenderankare (§11.2). Opus levererar — CLAUDE.md SVENSK TEXT.
// Kafferummet ANAR ett kommande ankare, dagar/veckor i förväg. Retrospektiva grenar
// i coffeeRoomService läser det som HÄNT; detta är den enda framåtblickande rösten.
// Ton: gubbar vid kaffekokaren som vet vad som är på väg. Ingen hype — vardagen
// som redan börjat luta mot dagen. Format: [talareA, textA, talareB, textB],
// utan citationstecken (komponenten lägger på dem, som getCoffeeRoomScene).

type Exchange = [string, string, string, string]

export const ANTICIPATION_KAFFERUM: Record<
  'annandag' | 'nyar' | 'cupfinalhelg' | 'derby',
  Record<'snart' | 'nara', Exchange[]>
> = {
  annandag: {
    snart: [
      ['Kioskvakten', 'Det börjar bli dags att beställa extra korv.', 'Kassören', 'Annandagen. Ja. Folk kommer oavsett väder.'],
      ['Vaktmästaren', 'Jag har börjat titta på prognosen redan.', 'Materialaren', 'Annandan brukar hålla. Kallt men klart.'],
      ['Kassören', 'Släkten hör av sig om biljetter. Som varje år.', 'Ordföranden', 'Det är den matchen alla kommer hem till.'],
    ],
    nara: [
      ['Kioskvakten', 'Dubbel bemanning i kiosken på annandan. Jag har ringt in folk.', 'Vaktmästaren', 'Bra. Det blir fullt.'],
      ['Materialaren', 'Tröjorna är tvättade och hängda. Inför annandan.', 'Kassören', 'Det är den dagen man vill se snygga ut.'],
      ['Vaktmästaren', 'Jag spolar extra kvällen före. Isen ska vara perfekt.', 'Materialaren', 'Annandan förtjänar det.'],
    ],
  },
  nyar: {
    snart: [
      ['Kassören', 'Nyårsbandyn närmar sig. Folk planerar redan.', 'Ordföranden', 'Någon kommer med raketer. Det gör de varje år.'],
      ['Kioskvakten', 'Glögg eller kaffe till nyårsmatchen?', 'Vaktmästaren', 'Båda. Det är kallt då.'],
    ],
    nara: [
      ['Vaktmästaren', 'Nyårsbandyn i övermorgon. Jag har skottat läktaren redan.', 'Materialaren', 'Det kommer folk direkt från middagen.'],
      ['Kioskvakten', 'Termosarna är fyllda inför nyår. Extra allt.', 'Kassören', 'Det blir sent och kallt. Precis som det ska.'],
    ],
  },
  cupfinalhelg: {
    snart: [
      ['Ordföranden', 'Cupfinalhelgen om ett par veckor. Det märks i stan.', 'Kassören', 'Folk pratar redan. Det är länge sen sist.'],
      ['Materialaren', 'Grabbarna vet vad som väntar. De tränar hårdare.', 'Vaktmästaren', 'Det gör de alltid inför den helgen.'],
    ],
    nara: [
      ['Kioskvakten', 'Cupfinalhelgen nu. Hela orten kommer att stå här.', 'Ordföranden', 'Då ser vi till att det finns kaffe åt alla.'],
      ['Vaktmästaren', 'Jag har fixat extra parkering. Det blir tryck.', 'Materialaren', 'Det är den helgen man minns efteråt.'],
    ],
  },
  derby: {
    snart: [
      ['Kioskvakten', 'Derbyt börjar krypa närmare.', 'Vaktmästaren', 'Man känner det redan i väggarna.'],
      ['Materialaren', 'Grabbarna säger inget om derbyt. Men de vet.', 'Kassören', 'Det är den matchen de haft i huvudet hela hösten.'],
      ['Kassören', 'Bortasupportrarna har hört av sig om biljetter.', 'Ordföranden', 'Släpp in dem. Det är ett derby, inte ett krig.'],
    ],
    nara: [
      ['Vaktmästaren', 'Derby på lördag. Jag sover dåligt redan.', 'Materialaren', 'Det gör vi alla den här veckan.'],
      ['Kioskvakten', 'Folk frågar om det blir fullt. Det blir fullt.', 'Kassören', 'Det är derby. Det är alltid fullt.'],
      ['Materialaren', 'Tröjorna är extra noga tvättade inför derbyt.', 'Vaktmästaren', 'Man vill inte förlora ett derby illa klädd heller.'],
    ],
  },
}
