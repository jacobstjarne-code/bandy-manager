# Template Backfill — 2026-04-26

## Sammanfattning

- Findings processade: 46
- Templatings möjliga (siffra nära ref, stämmer med fact): 45
- Inkonsistenser (siffra nära ref, stämmer INTE med fact): 0
- Siffror nära ref utan direkt fact-match (derived/okänd): 71

## Per finding

### Finding 001 — Halvtidsledning i bandy

Fact-refs i filen: S004, S008, S013, S016

**Templatings möjliga:**

- `50,2` → `{factGoals("S004")}` eller `{factPct("S004")}` (beroende på enhet)
  Kontext: `4")} class="fact-ref">S004</a>         (50,2%), inte i halvtidsledningsfrekvensen.`

- `78,1` → `{factGoals("S013")}` eller `{factPct("S013")}` (beroende på enhet)
  Kontext: `">S013</a></td>             <td><strong>78,1%</strong></td>             <td>907 matc`

- `46,6` → `{factGoals("S016")}` eller `{factPct("S016")}` (beroende på enhet)
  Kontext: `hemmalaget leder vid halvtid i 46,6% av matcherna         <a href={factHref`

**Siffror nära ref utan fact-match (derived/beräknade):**

- `2019` — `<li>           <strong>Bandygrytan 2019–2026</strong> —           <a href={fact`
- `2026` — `<li>           <strong>Bandygrytan 2019–2026</strong> —           <a href={factHref(`
- `907` — `")} class="fact-ref">S013</a>           907 Elitseriematcher med halvtidsresultat r`
- `124` — `med halvtidsresultat registrerat (av 1 124 totalt),           sex säsonger. Varje`
- `200` — `907 matcher innebär         det ungefär 200 matcher där halvtidsledningen gick förl`

---

### Finding 002 — Hörnornas värde i bandy

Fact-refs i filen: S001, S007, S008

**Templatings möjliga:**

- `9,12` → `{factGoals("S001")}` eller `{factPct("S001")}` (beroende på enhet)
  Kontext: `efär 3,9 mål från hörnlägen — av totalt 9,12 mål per match         <a href={factHref`

- `17,72` → `{factGoals("S007")}` eller `{factPct("S007")}` (beroende på enhet)
  Kontext: `")} class="fact-ref">S007</a>           17,72 hörnor spelas i snitt per match. Det är`

- `22,2` → `{factGoals("S008")}` eller `{factPct("S008")}` (beroende på enhet)
  Kontext: `")} class="fact-ref">S008</a>           22,2% av alla mål i Elitserien kommer direkt`

**Siffror nära ref utan fact-match (derived/beräknade):**

- `10` — `<td>~4%</td>             <td>~10</td>           </tr>         </tbody>`
- `3,9` — `rar en genomsnittsmatch         ungefär 3,9 mål från hörnlägen — av totalt 9,12 mål`

---

### Finding 003 — Hemmafördelen i bandy

Fact-refs i filen: S002, S003, S004, S005, S006

**Templatings möjliga:**

- `4,88` → `{factGoals("S002")}` eller `{factPct("S002")}` (beroende på enhet)
  Kontext: `istoria:         hemmalaget gör i snitt 4,88 mål         <a href={factHref("S002")}`

- `4,24` → `{factGoals("S003")}` eller `{factPct("S003")}` (beroende på enhet)
  Kontext: `-ref">S002</a>         mot bortallagets 4,24         <a href={factHref("S003")} clas`

- `50,2` → `{factGoals("S004")}` eller `{factPct("S004")}` (beroende på enhet)
  Kontext: `")} class="fact-ref">S004</a>           50,2% av matcherna vinns av hemmalaget.`

- `11,6` → `{factGoals("S005")}` eller `{factPct("S005")}` (beroende på enhet)
  Kontext: `")} class="fact-ref">S005</a>           11,6% slutar lika.         </li>         <li`

- `38,3` → `{factGoals("S006")}` eller `{factPct("S006")}` (beroende på enhet)
  Kontext: `")} class="fact-ref">S006</a>           38,3% vinns av bortalaget.         </li>`

**Siffror nära ref utan fact-match (derived/beräknade):**

- `2019` — `Bandygrytans 1 124 Elitseriematcher (2019–2026) ger ett tydligt underlag.`
- `2026` — `ndygrytans 1 124 Elitseriematcher (2019–2026) ger ett tydligt underlag.         Tre`
- `0,64` — `-ref">S003</a>         — en skillnad på 0,64 mål per match.       </p>     </div>`
- `45` — `(Premier League)</td>             <td>~45%</td>             <td>Publicerade studi`

---

### Finding 004 — Bandy och mål

Fact-refs i filen: S001, S012, S014, S015

**Templatings möjliga:**

- `9,12` → `{factGoals("S001")}` eller `{factPct("S001")}` (beroende på enhet)
  Kontext: `")} class="fact-ref">S001</a>           9,12 mål i snitt.         </li>         <li>`

- `4,19` → `{factGoals("S012")}` eller `{factPct("S012")}` (beroende på enhet)
  Kontext: `")} class="fact-ref">S012</a>           4,19 mål per match i första halvlek.`

- `54,2` → `{factGoals("S014")}` eller `{factPct("S014")}` (beroende på enhet)
  Kontext: `")} class="fact-ref">S014</a>           54,2% av alla mål faller i andra halvlek, al`

- `48,2` → `{factGoals("S015")}` eller `{factPct("S015")}` (beroende på enhet)
  Kontext: `")} class="fact-ref">S015</a>           48,2 — precis strax efter halvtid.         <`

**Siffror nära ref utan fact-match (derived/beräknade):**

- `124` — `an</p>       <p>         Bandygrytans 1 124 Elitseriematcher (2019–2026) ger fyra c`
- `2019` — `Bandygrytans 1 124 Elitseriematcher (2019–2026) ger fyra centrala mätvärden:`
- `2026` — `ndygrytans 1 124 Elitseriematcher (2019–2026) ger fyra centrala mätvärden:       </p`
- `4,93` — `faller i andra halvlek, alltså ungefär 4,93 per match.         </li>         <li>`
- `2,7` — `>S001</a></td>             <td>Fotboll ~2,7 · Ishockey ~5,5</td>           </tr>`
- `5,5` — `<td>Fotboll ~2,7 · Ishockey ~5,5</td>           </tr>           <tr>`
- `45,8` — `fact-ref">S012</a></td>             <td>45,8% av matchens mål</td>           </tr>`
- `90` — `t-ref">S015</a></td>             <td>Av 90 minuter total matchtid</td>           <`

---

### Finding 005 — Mål faller inte jämnt

Fact-refs i filen: S001

**Templatings möjliga:**

- `9,12` → `{factGoals("S001")}` eller `{factPct("S001")}` (beroende på enhet)
  Kontext: `ted); margin-left: 4px">Mål per match — 9,12 · Bandygrytan 1 124 matcher</span>`

**Siffror nära ref utan fact-match (derived/beräknade):**

- `124` — `on-label">Datan</p>       <p>         1 124 grundseriematcher i Herr-Elitserien (Ba`
- `2019` — `ematcher i Herr-Elitserien (Bandygrytan 2019–2026)         <a href={factHref("S001")`
- `2026` — `her i Herr-Elitserien (Bandygrytan 2019–2026)         <a href={factHref("S001")} cla`
- `10` — `inut.         Fördelningen analyseras i 10-minutersintervall.       </p>     </div`
- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 006 — Slutspelet: färre mål, starkare ledningar

Fact-refs i filen: S001, S013

**Templatings möjliga:**

- `9,12` → `{factGoals("S001")}` eller `{factPct("S001")}` (beroende på enhet)
  Kontext: `n-left: 4px">Mål per match grundserie — 9,12</span>       </p>     </div>    </div>`

- `78,1` → `{factGoals("S013")}` eller `{factPct("S013")}` (beroende på enhet)
  Kontext: `<td>9,12</td>             <td>78,1% <a href={factHref("S013")} class="fact`

**Siffror nära ref utan fact-match (derived/beräknade):**

- `124` — `<td>Grundserie</td>             <td>1 124</td>             <td>9,12</td>`
- `66` — `<td>Kval / playoff</td>             <td>66</td>             <td>9,33</td>`
- `9,33` — `<td>66</td>             <td>9,33</td>             <td>76,9%</td>`
- `76,9` — `<td>9,33</td>             <td>76,9%</td>           </tr>           <tr sty`
- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 007 — Dam vs herr: lika mål, men olika dynamik

Fact-refs i filen: S001

**Templatings möjliga:**

- `9,12` → `{factGoals("S001")}` eller `{factPct("S001")}` (beroende på enhet)
  Kontext: `d: 'S001', label: 'Mål per match herr — 9,12' },           { id: 'S008', label: 'Hör`

- `50,2` → `{factGoals("S004")}` eller `{factPct("S004")}` (beroende på enhet)
  Kontext: `{ id: 'S004', label: 'Hemmaseger herr — 50,2%' },         ].map((ref, i) => (`

- `22,2` → `{factGoals("S008")}` eller `{factPct("S008")}` (beroende på enhet)
  Kontext: `'S008', label: 'Hörnmålsprocent herr — 22,2%' },           { id: 'S013', label: 'ht`

- `78,1` → `{factGoals("S013")}` eller `{factPct("S013")}` (beroende på enhet)
  Kontext: `id: 'S013', label: 'htLeadWinPct herr — 78,1%' },           { id: 'S004', label: 'He`

**Siffror nära ref utan fact-match (derived/beräknade):**

- `376` — `tion-label">Datan</p>       <p>         376 grundseriematcher i Damserien (2019–202`
- `2019` — `376 grundseriematcher i Damserien (2019–2026) mot         1 124 i Herrserien`
- `2026` — `376 grundseriematcher i Damserien (2019–2026) mot         1 124 i Herrserien`
- `124` — `r i Damserien (2019–2026) mot         1 124 i Herrserien         <a href={factHref(`

---

### Finding 008 — Klustret 40–50 är jämnt fördelat

Fact-refs i filen: F005

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 009 — Mål faller tidigare i jämna matcher

Fact-refs i filen: F005

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 010 — Hörnmål toppar mitten, öppet spel slutet

Fact-refs i filen: F005

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 011 — Halvledning förutsäger seger — men olika starkt

Fact-refs i filen: F006

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 012 — Damserien omvandlar hörnor till mål mer sällan

Fact-refs i filen: F007

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 013 — Dam och herr visar likartad målminutsfördelning

Fact-refs i filen: F007

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 014 — Bortalagets hörnor konverteras lika ofta

Fact-refs i filen: F002

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 015 — Större halvtidsledning ger dramatiskt högre vinst

Fact-refs i filen: S001

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 016 — Hemmaled vid halvtid vinner oftare

Fact-refs i filen: S001

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 017 — Comebacks startar tidigare i andra halvlek

Fact-refs i filen: F004

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 018 — VSK och Nässjö: hörnamål jämfört

Fact-refs i filen: (inga)

_(Inga hårdkodade siffror identifierade nära fact-refs)_

---

### Finding 019 — Målen klustrar tydligt i herrbandy

Fact-refs i filen: S008

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 020 — Dammatchdata saknas för jämförelse

Fact-refs i filen: F009

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 021 — Mellankategorin: måldistribution vid 2–3 måls marginal

Fact-refs i filen: (inga)

_(Inga hårdkodade siffror identifierade nära fact-refs)_

---

### Finding 022 — Hörnmål slås in lika ofta hemma som borta

Fact-refs i filen: F010

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 023 — Damernas målfördelning saknar tillräcklig data

Fact-refs i filen: (inga)

_(Inga hårdkodade siffror identifierade nära fact-refs)_

---

### Finding 024 — Vändningar sker i 16 % av matcher

Fact-refs i filen: F011

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 025 — Halvtidsledning avgör mindre i semifinal

Fact-refs i filen: S011

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 026 — Hemmafördel stärker halvtidsledningens prediktiva kraft

Fact-refs i filen: S011

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 027 — Data saknas för taktisk hörnanalys

Fact-refs i filen: (inga)

_(Inga hårdkodade siffror identifierade nära fact-refs)_

---

### Finding 028 — Hörneffektivitet damserie: data saknas

Fact-refs i filen: (inga)

_(Inga hårdkodade siffror identifierade nära fact-refs)_

---

### Finding 029 — Mållagens ursprung utanför hörnor i damserien

Fact-refs i filen: (inga)

_(Inga hårdkodade siffror identifierade nära fact-refs)_

---

### Finding 030 — Hörneffektivitet och matchläge: data saknas

Fact-refs i filen: (inga)

_(Inga hårdkodade siffror identifierade nära fact-refs)_

---

### Finding 031 — Slutminutstopp: täta resultat eller serienivå?

Fact-refs i filen: S013, S014

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 032 — Målminutsfördelning per division: ingen data tillgänglig

Fact-refs i filen: S013

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 033 — Hörnmål fördelas jämnt — bortaeffekt syns i konvertering

Fact-refs i filen: S014

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 034 — Bortalagets hörneffektivitet marginellt lägre

Fact-refs i filen: S001, S013

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 035 — Hörnkonvertering skiljer knappt mellan hemma och borta

Fact-refs i filen: S014

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 036 — Hemmaledning håller oftare än bortaledning

Fact-refs i filen: S015

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 037 — Vändningar sällsynta efter 1–0 i halvtid

Fact-refs i filen: F015

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 038 — Större halvtidsledning ger markant högre vinstchans

Fact-refs i filen: F016

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 039 — Hemmafördelen håller bättre vid halvtidsledning

Fact-refs i filen: F016

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 040 — Hemmafördel håller — men bortaledningar är stabila

Fact-refs i filen: S016

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 041 — Comebacks sker tidigare än övriga reduceringar

Fact-refs i filen: F017

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 042 — Comeback-andelen 96–100 min avviker inte från slumpen

Fact-refs i filen: S017

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 043 — Tidiga 2H-comeback: lag och spelarstilar

Fact-refs i filen: S017

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 044 — Bortalag gör fler mål på hörnor

Fact-refs i filen: F018

**Siffror nära ref utan fact-match (derived/beräknade):**

- `700` — `em; margin-bottom: 0.5rem; font-weight: 700; color: var(--color-muted);">         K`

---

### Finding 045 — VSK och Vetlanda nära ligasnittet i hörnakonvertering

Fact-refs i filen: (inga)

_(Inga hårdkodade siffror identifierade nära fact-refs)_

---

### Finding 046 — Hörnmålsandelen faller stadigt mot final

Fact-refs i filen: (inga)

_(Inga hårdkodade siffror identifierade nära fact-refs)_

---
