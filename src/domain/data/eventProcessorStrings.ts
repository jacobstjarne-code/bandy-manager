export const WAGE_OVERRUN_WARNING_TEXT = [
  {
    title: 'Licensnämnden: Formell varning',
    body: 'Licensnämnden har noterat att {KLUBB}s lönekostnader överstiger budgeten med mer än 20%. Detta är en formell varning. Om förhållandet kvarstår vid säsongsslut kommer åtgärder att övervägas.',
  },
  {
    title: 'Förbundets licensnämnd kräver plan',
    body: 'Förbundets licensnämnd skriver till klubben: "Vi har granskat {KLUBB}s ekonomiska redovisning för innevarande säsong. Lönebudgeten är överskriden. Vi förväntar oss en plan för återställning inom fyra veckor."',
  },
  {
    title: 'Licensnämnden: Krav på åtgärd',
    body: '"Det är inte en fråga om huruvida ni har råd just nu", står det i brevet från Licensnämnden. "Det är en fråga om hur ni planerar er verksamhet långsiktigt. Vi vill se en plan."',
  },
]

export const WAGE_OVERRUN_DEDUCTION_TEXT = [
  {
    title: 'Licensnämnden: −2 poäng nästa säsong',
    body: 'Licensnämnden har beslutat: {KLUBB} får ett avdrag på 2 poäng inför nästa säsong. Beslutet är slutgiltigt och kan inte överklagas. Lönebudgeten är fortsatt överskriden — fortsätter det blir det större.',
  },
  {
    title: 'Poängavdrag bekräftat — {KLUBB} −2',
    body: 'Två poäng dras inför nästa säsong. Det står i beslutet från Licensnämnden. "Klubben har inte följt sina egna ekonomiska planer", skriver de. "Detta är konsekvensen."',
  },
  {
    title: 'Licensnämnden verkställer: −2 poäng',
    body: 'Det blev konkret. Två poäng. Ordföranden samlar styrelsen för krismöte. "Vi måste bestämma vad som ska bort. För något ska bort."',
  },
]

export const RISKY_SPONSOR_OFFERS = [
  {
    name: 'Borgvik Bygg AB',
    category: 'Bygg & Fastighet',
    weeklyIncome: 550,
    title: 'Borgvik Bygg AB erbjuder marknadsavtal — 12 000/säsong',
    body: 'Borgvik Bygg AB erbjuder marknadsavtal med {KLUBB} på 12 000 per säsong i tre säsonger. VD:n nämner i samtal att företaget "går igenom en granskning från Skatteverket men det är rutin". Avtalet är klart att skriva på.',
    acceptLabel: 'Acceptera (12 000 kr/säsong)',
    risk: '⚠️ Risk: Skatteverket-granskning kan bli publik',
  },
  {
    name: 'Nordström Logistik AB',
    category: 'Logistik & Transport',
    weeklyIncome: 365,
    title: 'Nordström Logistik AB vill bli sponsor — 8 000/säsong',
    body: 'Nordström Logistik AB hör av sig genom sin nytillträdde VD. Företaget är okänt på orten men har god kontakt med tre andra klubbar i regionen. VD:n vill träffas snart. Hans bakgrund finns inte på företagets hemsida ännu.',
    acceptLabel: 'Acceptera (8 000 kr/säsong)',
    risk: '⚠️ Risk: Okänt bolag med oklar bakgrund',
  },
  {
    name: 'Hellström & Co',
    category: 'Konsult',
    weeklyIncome: 680,
    title: 'Hellström & Co — kontakt via gemensam vän — 15 000/säsong',
    body: '"Vi har gemensamma bekanta", står det i mejlet från Hellström & Co. Företaget vill betala 15 000 per säsong i marknadsavtal. När du frågar vilka bekanta blir svaret "det är en småstad". Det stämmer, men du har ingen aning om vem de menar.',
    acceptLabel: 'Acceptera (15 000 kr/säsong)',
    risk: '⚠️ Risk: Oklar koppling, inga referenser',
  },
  {
    name: 'Lindström Holdings',
    category: 'Holding',
    weeklyIncome: 910,
    title: 'Lindström Holdings: 20 000 i förskott — direkt avtal',
    body: 'Lindström Holdings erbjuder 20 000 i förskott för ett treårigt marknadsavtal. "Inga byråkratiska processer", skriver han, "vi vill bara stötta lokal idrott". Beloppet är osedvanligt högt. Bolaget registrerades för fyra månader sedan.',
    acceptLabel: 'Acceptera (20 000 kr/säsong)',
    risk: '⚠️ Risk: Nystartat bolag, osedvanligt högt belopp',
  },
]

export const MECENAT_WITHDRAWAL_TEXT: Record<string, { title: string; body: string }> = {
  kontrollfreak: {
    title: '{MECENAT} drar sig ur',
    body: '{MECENAT} ringer. Tonen är iskall.\n\n"Du har ignorerat mig tre gånger nu. Det är tydligt att klubben vill gå sin egen väg. Det är ert val. Men ni får göra det utan mig — och utan de pengar jag skjutit till. Det jag betalat är förbrukat. Det som var planerat dras tillbaka."\n\n{MECENAT} lämnar klubben permanent.',
  },
  filantropen: {
    title: '{MECENAT} avslutar samarbetet',
    body: '{MECENAT} ber om ett möte. Det är inte ilska i rösten, det är besvikelse — vilket är värre.\n\n"Jag har försökt förstå er. Men ni gör det inte enkelt. Jag drar mig ur det här samarbetet — det fungerar inte att ge när det inte tas emot. Jag önskar er lycka till."\n\n{MECENAT} lämnar permanent. Pengar som var öronmärkta för ungdomssatsningar dras tillbaka.',
  },
  nostalgiker: {
    title: '{MECENAT} tar farväl',
    body: '{MECENAT} sitter på sitt kontor och stirrar ut genom fönstret när du kommer in. Blicken är äldre än vanligt.\n\n"Jag växte upp med {KLUBB}. Min far gick på matcherna i femtiotalet. Jag har försökt ge tillbaka. Men det måste vara åt båda håll. Jag drar mig tillbaka. Det är inte mot dig. Det är åt mig själv."\n\n{MECENAT} lämnar. Det blir tyst på orten — gamla supportrar tar det här illa.',
  },
}

export const MECENAT_WITHDRAWAL_FALLBACK = [
  MECENAT_WITHDRAWAL_TEXT.kontrollfreak,
  MECENAT_WITHDRAWAL_TEXT.filantropen,
  MECENAT_WITHDRAWAL_TEXT.nostalgiker,
]
