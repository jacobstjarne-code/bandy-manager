# TEXTLEVERANS + smådomar (Opus) 2026-09-08 — upplåsning av gejtade rader

Fem Opus-gejtade MASTER-rader stängda: fyra låsta texter + en smal scope-dom. Code kopierar texten ordagrant och wirar; ingen ny mekanik utan vad som står. Varje rad blir Code-byggbar av det här.

---

## lobbypress-mekanik-spec — flavour-texten (Jacobs beslut: nedgradera till flavour nu)

Den gamla `LOBBY_PRESS.accepted`/`.declined` påstår en manager-handling ("Du ringde…") och får aldrig ytas automatiskt. Ersätts av en passiv journalistnotis: pressen noterar att spelaren är i uttagningssnacket, ingen spelarförfrågan, ingen manager-handling. Tokens `{spelare}`/`{klubb}`, `{paper}` ur befintliga uppsättningen (Lokaltidningen/Sportbladet/Bandypuls).

```
LOBBY_PRESS_FLAVOUR = [
  '"{spelare} nämns i uttagningssnacket" — {paper}',
  '"Det pratas landslag kring {spelare}" — kort i {paper}',
  '"{klubb}s {spelare} med i resonemanget inför uttagningen" — {paper}',
  '"Förbundskaptenen lär ha {spelare} på bevakning" — {paper}',
]
```

Wiring: droppa den interaktiva accepted/declined-vägen, rendera som passiv notis/flavour, ingen `choices`. Full uttagningsmekanik → POST_LAUNCH (Jacobs beslut).

---

## sluttest-o8-turneringslage — 5.3-luckan, turneringsläge mitt i serie

`getPlayoffSeriesContext()` bär `wins`/`losses`/`nextGame`. Raden saknas för läget MITT i en pågående bäst-av-fem. Tre grenar på seriens ställning (`{v}` = egna vinster, `{f}` = motståndarens):

```
- Matchboll (v === 2): "Serien står {v}–{f}. En vinst till, sedan är ni vidare."
- Utslagningshotad (f === 2): "Serien står {v}–{f}. Förlust ikväll och säsongen är slut."
- Jämnt/övrigt: "Serien står {v}–{f}. Det avgörs inte ikväll, men det väger."
```

Wiring: `deriveTurneringslageMode()` returnerar dessa i stället för `null` medan serien pågår, gren vald på `wins`/`losses`.

---

## minne-avsked-motsager-historik — licensnekad Game Over-rad

`licenseDenied`-avsked faller idag på generisk text. Den låsta raden anger det verkliga skälet (licens, inte sport):

```
Licensen drogs in. Det var aldrig resultaten — utan licens finns ingen klubb kvar att träna.
```

Wiring: Game Over läser denna gren när `boardTruth` är `licenseDenied`, i stället för den generiska. Implementation + test mekaniska därefter (Code).

---

## transfer-arsbok-minns-fel Del 2 — årsboksraden för transfer_target_missed

`DOM_K12_TRANSFER_TARGET_MISSED` sa att Opus skriver årsboksraden på begäran. Här är den. Säsongsminnesrad för en jagad-och-missad spelare (`{Namn}` = spelaren, `{Klubb}` = hans klubb ur posten):

```
Du jagade {Namn} i somras. Det blev {Klubb}, inte ni.
```

Wiring: `YEARBOOK_PERSON_TYPES`/årsbokens väljare läser den befintliga `transfer_target_missed`-typen, denna rad. Ingen ny mekanik (typen finns sedan `c71b4d3e`).

---

## stickiness-copy-roster B12-mönstret — smal scope-dom + låst rad

Code flaggade två Opus-frågor: (1) scope — smal namngiven detektor eller generell 13-faktors; (2) text.

**Scope-dom (Opus): SMAL först.** Bygg detektorn för det ENA verifierade namngivna mönstret — tre utvisningar (Suspension-event) under `formation_523`, tre omgångar i rad. Det är den kombination registret exemplifierar och `tacticalFactors` bekräftar. Den generella "samma kostnadsfaktor tre matcher i rad oavsett vilken av de 13" (kräver 13 låsta meningar) är POST_LAUNCH — samma en-skiva-först-disciplin som påstående-kontraktet. Jacob kan dra fram den generella senare; den smala är byggbar nu.

**Låst rad (den enda scopet kräver):**

```
Tre matcher i rad med utvisningar under 5-2-3. Mönstret är ditt, inte otur.
```

Wiring: detektorn matchar treomgångarsmönstret (Suspension + `formation_523`), renderar denna rad. En detektor, en mening.
