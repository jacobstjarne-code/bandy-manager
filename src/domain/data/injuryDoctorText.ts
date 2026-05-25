/**
 * C-N1 (skade-narrativet) — Henriks röst: lagdoktorn.
 *
 * Fyra allvarlighetsgrader, rehab-citat per stadie, och eftersnacket
 * när {spelare} pressas tillbaka för tidigt. {spelare} interpoleras av Code.
 *
 * Ton: professionell, lite torr, 20 år i bruksortsbandy. Navigerar trycket
 * från tränarbänken utan att ge efter mer än nödvändigt. Inget melodrama.
 * Diagnosen är det den är — inte värre, inte bättre.
 */

// ── Namnpool ────────────────────────────────────────────────────────────────

export const DOCTOR_FIRST_NAMES: string[] = [
  'Henrik', 'Lars-Erik', 'Björn', 'Mats', 'Gunnar',
  'Stig', 'Rolf', 'Christer', 'Anders', 'Per-Olof',
  'Lennart', 'Thomas', 'Mikael', 'Göran', 'Stefan',
]

export const DOCTOR_LAST_NAMES: string[] = [
  'Lindqvist', 'Bergström', 'Holm', 'Sandberg', 'Ekström',
  'Nyström', 'Wallin', 'Lundgren', 'Åsberg', 'Hedlund',
  'Nordin', 'Söderberg', 'Forsberg', 'Carlsson', 'Wikström',
]

// ── Diagnosrader per allvarlighetsgrad ──────────────────────────────────────

export type InjurySeverity = 'mild' | 'moderate' | 'serious' | 'severe'

export const DIAGNOSIS_TEXT: Record<InjurySeverity, string[]> = {
  mild: [
    '{spelare} är stukat. Inget brutet, inget sönder — kroppen protesterar men håller ihop. En, möjligen två omgångar.',
    'Kontusionen ser värre ut än den är. {spelare} ska inte spela men det är inget vi behöver oroa oss över på längre sikt.',
    'Lättare muskelsträckning. Det händer i det här spelet. {spelare} är tillbaka så fort vävnaden lugnar sig.',
  ],
  moderate: [
    'Muskelskada på {spelare} — fibern är drabbad. Det tar den tid det tar, och den brukar ta fyra till sex omgångar. Det går inte att pressa.',
    '{spelare}s ligament är sträckt, inte sönder. Skillnaden är stor på röntgen men liten i vardag — rehab ändå, ordentligt.',
    'Stukningsskada av det medelsvåra slaget. {spelare} är ur ett tag. Jag säger fyra till sju omgångar beroende på hur rehabben löper.',
  ],
  serious: [
    'Det är allvarligare än vi hoppades. {spelare} är borta i åtta till tolv omgångar. Operationsfrågan utreds. Jag ger er besked så snart vi vet mer.',
    'Stressfraktur på {spelare}. Kroppen har signalerat ett tag — vi missade det. Nu är det stopp, och det går inte att förhandla med läkningstid.',
    '{spelare}s ledband är skadat på ett sätt som kräver strukturerad rehab och tid. Vi pratar månader, inte veckor. Jag vet att det inte är vad ni ville höra.',
  ],
  severe: [
    'Det är en svår skada. {spelare} är borta länge — jag pratar inte omgångar utan månader. Vi gör det rätt från start, annars riskerar vi att han aldrig kommer tillbaka fullt ut.',
    '{spelare}s knä är allvarligt skadat. Operationen är nödvändig. Rehabperioden är lång. Jag vill inte ge ett datum ännu — det finns inga genvägar den här gången.',
    'Benbrottet är av det slag som kräver immobilisering och tid. {spelare} spelar inte mer den här säsongen. Fokus nu är att han kommer tillbaka nästa.',
  ],
}

// ── Rehab-citat per stadie ───────────────────────────────────────────────────

export type RehabStage = 'vila' | 'lätt' | 'full' | 'match'

export const REHAB_TEXT: Record<RehabStage, string[]> = {
  vila: [
    '{spelare} vilar. Det är inte passivitet — det är behandling. Kroppen lagar sig när den får arbeta ostörd.',
    'Vi är i vilostadie. {spelare} träffar fysion varje dag men är inte på isen. Inga undantag den här veckan.',
    '{spelare} är borta från banan tillsvidare. Inflammationen måste ner innan vi ens börjar prata om träning.',
    'Vilostadiet är längst men kortast om vi gör det rätt. {spelare} vet vad det handlar om.',
  ],
  lätt: [
    '{spelare} är i lätt träning. Ingen kontakt, ingen belastning utöver vad fysion godkänner. Framsteg, men steg för steg.',
    'Vi har börjat lätta träningspass med {spelare}. Rörelsen är tillbaka, styrkan kommer. Det är inte bråttom längre.',
    '{spelare} cyklar, stretchar och gör de övningar vi kommit överens om. Kroppen svarar bra — det brukar vara ett gott tecken.',
    'Lätt träning pågår. {spelare} pressar inte gränsen och det är rätt. Det är nu det är lätt att ta ett steg för mycket.',
  ],
  full: [
    '{spelare} tränar med laget nu. Full belastning, normal intensitet. Matchen är nästa steg, men inte förrän jag ser att kroppen håller.',
    'Vi är i fullträning med {spelare}. Jag vill se en vecka till innan jag ger grönt ljus. Hittills ser det bra ut.',
    '{spelare} är med på allt. Kroppen svarar som den ska. Vi pratar matchläge snart — men jag sätter inte datum i förväg.',
    'Fullträning avklarad utan problem. {spelare} är nästan där. En match på bänken som buffer är aldrig fel efter en sådan här period.',
  ],
  match: [
    '{spelare} är spelklar. Jag har gjort mina tester, kroppen är redo. Ta det varsamt med belastningstiden de första matcherna.',
    'Grönt ljus på {spelare}. Vi har jobbat oss fram hit ordentligt — det är bättre än att skynda sig och sitta här igen om tre veckor.',
    '{spelare} spelar. Jag har inga invändningar. Om han känner något under matchen är det bara att komma av direkt — stolthet läker inte.',
    'Spelklar. {spelare} har gjort rehabben utan genvägar, och det syns i hur han rör sig. Han är redo.',
  ],
}

// ── Eftersnacket: för tidig återkomst ───────────────────────────────────────

/** Fem varianter där det gick illa, en där spelet gick hem. */
export const EARLY_RETURN_BACKFIRE: string[] = [
  // 1 — Omedelbar återskada på isen
  'Det är det vi ville undvika. {spelare} gick tillbaka för tidigt och kroppen betalade priset direkt. Nu är vi i ett sämre läge än om vi hade väntat.',
  // 2 — Värre skada än ursprunglig
  'Jag är inte förvånad, men det hjälper inte. En sträckning som hade krävt tre veckor är nu en allvarligare skada. {spelare} är borta längre nu än han hade behövt vara.',
  // 3 — Kompensationsskada på annat ställe
  'Det som hände med {spelare} är vanligare än folk tror. Han skyddade den skadade kroppsdelen omedvetet och belastad något annat för hårt. Nu har vi två problem istället för ett.',
  // 4 — Spelade, höll ihop, kraschade i träning veckan efter
  'Matchen gick. Träningen veckan efter inte. Kroppen klarade intensiteten men inte återhämtningen. {spelare} är borta igen och det är längre nu.',
  // 5 — Psykologiskt skadat förtroende
  '{spelare} kom tillbaka för tidigt och det märks i hur han spelar nu. Han litar inte riktigt på kroppen längre. Det tar tid att bygga bort, och det är svårare att mäta än ett ledband.',
]

export const EARLY_RETURN_WORKED: string[] = [
  // 1 — Den enda gången det gick hem
  '{spelare} höll ihop. Jag hade mina tvivel och de var befogade — men kroppen svarade bättre än testresultaten antydde. Tur är inte en metod, men den här gången var det tillräckligt.',
]
