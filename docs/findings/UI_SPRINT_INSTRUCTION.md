# UI_SPRINT_INSTRUCTION — Publiceringsplattform för Bandy-Brain

**Skapad:** 2026-04-25 (omskriven efter klargörande från Jacob)
**Förutsätter:** Pass 1-3 klara
**Levereras till:** Code (implementation), Jacob (deploy)

---

## VAD DET HÄR ÄR

En publik sajt där bandy-insikter genererade ur Bandy Manager läggs ut.

Bakgrunden: Elitserien spelar ungefär 1500 matcher på 10 år. Bandy
Manager simulerar 10 000 matcher på ett dygn. Det är en epistemisk
asymmetri — simulerade säsonger besvarar frågor som verklig serie
aldrig hinner samla data för. Hörnornas värde, comeback-frekvens,
halvtidsledningens stabilitet, hemmaplansfördelens storlek under
olika omständigheter.

Sajten är där dessa insikter når bandy-folk. Erik först. Bandy-Twitter,
r/bandy, kanske bandyforum.se senare. Eventuellt journalistik.

---

## FÖRSTASIDAN ÄR FINDINGS, INTE FACTS

Distinktionen är central:

- **Findings** är *rapporter* skrivna för läsare som vill veta något
  om bandy. `001_halvtidsledning.md` är prototypen: fråga, data, vad
  vi fann, tolkning, begränsningar. ~3 sidor, läsbar i ett sittande.

- **Facts** är *källor* som findings bygger på. R014, S013, etc.
  Klickbara från findings, inte primärt innehåll.

Sajten ska kännas som en analyspublikation, inte en
projektdokumentation. Tonen i 001_halvtidsledning är rätt — saklig,
erkänner begränsningar, presenterar siffror utan dramatik. Den tonen
ska prägla hela sajten.

---

## STRUKTUR

```
/                          Förstasida — senaste finding prominent + lista
/findings/                 Alla findings, sorterat senast först
/findings/001              Detaljvy med refererade facts klickbara
/about/                    Vad Bandy-Brain är, hur datan genereras,
                           begränsningar i metoden
/sources/                  Bakgrund — facts grupperat per kategori
/sources/rules/R014        Detaljvy för fact (för dem som vill djupdyka)
/data/                     Länkar till regelboken, TB, bilaga 9 (PDFer)
```

`/findings/` är *huvudet*. `/sources/` är *footnoter*. UIet ska
spegla det visuellt — findings får utrymme och rytm, sources är
kompakt referens.

---

## EXEMPEL — HUR 001_HALVTIDSLEDNING SKULLE SE UT

```
─────────────────────────────────────────
FINDING 001 · 25 april 2026

Halvtidsledning i bandy är starkare
än i fotboll
─────────────────────────────────────────

Frågan
Hur ofta vinner ett bandylag som leder vid halvtid? 60%? 80%?
Bandy har 2×45 minuter med fri substitution och hörnan som
högvärdig offensiv resurs. Är comebacks vanligare här än i andra
sporter?

Datan
Bandygrytans 1124 matcher i Elitserien herr 2019-2026 [S013]
plus 10 seeds × 200 simulerade matcher från Bandy Manager.

Vad vi fann
| Källa                              | htLeadWinPct  |
| Bandygrytan (verklig data) [S013]  | 78.1%         |
| Bandy Manager (simulerad)          | 77%           |
| Fotbolls-EM/AL (referens)          | ~80%          |

Tolkning
[prosa, ~200 ord]

Begränsningar
[lista, kort]

Källor i denna finding: S013, S004, S002, R014
─────────────────────────────────────────
[Diskutera denna finding] [Ladda ner PDF]
```

`[S013]` är klickbar och tar läsaren till `/sources/stats/S013` med
fact-detaljerna. Tillbaka-knapp för att fortsätta läsa findingen.

---

## TEKNIKVAL

**MkDocs Material** med custom theme-justeringar för att göra
findings-vyn läsbar (begränsad textbredd, generös typografi, citat-
stil för slutsatser).

Eller — om Code bedömer att MkDocs är för dokumentations-konnoterat
för det här syftet — **Astro** med MDX. Astro ger bättre kontroll
över förstasida och finding-detaljvy samtidigt som det fortfarande
är statiskt.

**Beslut:** Code väljer mellan MkDocs Material och Astro baserat på
hur mycket layout-anpassning som behövs. Båda är acceptabla. Inga
backend-baserade alternativ (Next.js SSR, Strapi, etc.) — sajten
ska vara statisk.

---

## INNEHÅLLSARBETET

Sajten är tom utan innehåll. Tre saker måste hända parallellt med
implementationen:

1. **001_halvtidsledning skrivs klart.** Den har varit utkast sedan
   april. När Code's Sprint 25-HT-analys är klar finns datan.
   Opus skriver klart finding-rapporten innan sajten lanseras.

2. **Mall för framtida findings.** Standardstruktur (Frågan/Datan/
   Vad vi fann/Tolkning/Begränsningar) ska ligga som
   `docs/findings/_TEMPLATE.md`. Varje ny finding följer mallen.

3. **About-sidan.** Förklarar för en utomstående bandymänniska:
   vad Bandy Manager är, hur findings genereras, varför 10 000
   simulerade matcher är användbart, och vilka begränsningar
   metoden har. Skrivs av Jacob (eller Opus efter Jacobs notat).

Utan dessa tre är sajten en tom hylsa. Med dem är den värdefull
från dag 1.

---

## DEPLOY OCH PUBLIK

GitHub Pages, custom domän förslagsvis `bandy-brain.bury-fen.se`
om Erik kan peka DNS.

**Sekretess:** Sajten är publik från start, men ingen aktiv
marknadsföring förrän det finns minst 3 färdiga findings.
Erik får URL först. Bandy-Twitter och r/bandy senare när
basen är robust.

`<meta name="robots" content="noindex">` tas bort när första
publika lanseringen är beslutad — fram till dess är den
oavsiktligt-hittbar men inte sökmotor-indexerad.

---

## STOP-CRITERIA

- [ ] Sajt deployad och åtkomlig
- [ ] Förstasida visar senaste finding prominent
- [ ] Minst 1 färdig finding renderad (001_halvtidsledning)
- [ ] About-sida förklarar metoden
- [ ] Cross-references från finding till facts fungerar
- [ ] PDF-nedladdning per finding fungerar (eller utskriftsvänlig
      print-CSS)
- [ ] Erik har fått URL och bekräftat att han kan läsa

---

## VAD SOM INTE INGÅR (parkerat)

**Findings-generator** — ett verktyg som tar Bandygrytan + simulator-
output och hjälper till att producera nya findings. Det här är
egentligen där den största epistemiska vinsten ligger (10 000-
simuleringar-på-ett-dygn-asymmetrin), men det kräver att rådata är
queryable och att simulatorn har ett interface för att ställa nya
frågor. Stort separat projekt. Tas separat när UIet finns och
Jacob/Erik har använt det ett tag.

**Erik-kommentarer** — interaktivitet kräver backend. Erik mailar
eller Slackar feedback i v1, Jacob/Opus uppdaterar findings.

**Multi-author** — om flera bandyfolk vill bidra med findings senare,
sajten kan utvidgas. Inte v1-problem.

---

## SAMARBETSFÖRDELNING

**Code:**
- Teknikval och setup (MkDocs vs Astro)
- Build-pipeline från YAML/MD till statisk sajt
- Cross-reference-rendering
- Deploy

**Opus:**
- 001_halvtidsledning skrivs färdig när data finns
- _TEMPLATE.md för framtida findings
- About-sidan (efter Jacobs notat)
- Kvalitetsgranskning av finding-prosa

**Jacob:**
- About-notat (vad ska sägas till bandyfolk om metoden)
- Beslut om DNS och deploy-tid
- Erik-kontakt
