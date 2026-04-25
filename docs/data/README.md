# docs/data — Datalagret

Primärkällor och rådata som facts i `docs/findings/facts/` refererar till.
Filer här ändras inte i daglig drift — de uppdateras när källan uppdateras
(typiskt en gång per säsong eller vid ny datainsamling).

---

## Fyra typer av källor

| Typ | Filer | Besvarar |
|-----|-------|----------|
| Spelregler | `SvBF-Regelbok-*.pdf` | Vad som FÅR hända i bandy |
| Tävlingsbestämmelser | `SvBF-TB-*.pdf`, `SvBF-TB-Bilaga-9-*.pdf` | Hur bandy ADMINISTRERAS |
| Empirisk matchdata | `bandygrytan_detailed.json` | Vad som FAKTISKT händer |
| Kalibreringstargets | extraherat ur bandygrytan JSON | Motor-targets |

**Spelreglerna (Regelboken)** — fastställer hur bandy spelas. 17 numrerade
regler om plan, utrustning, spelare, matchtid, mål, offside, målvakt,
straffslag, utvisningar. Auktoritativ för alla spelmekaniska frågor.
Versioneras per säsong — gult markerar ändringar.

**Tävlingsbestämmelserna (TB)** — fastställer hur bandy administreras.
Poängsystem, licenser, lagstorlekar per serie, slutspelsstruktur, kvalspel,
disciplinära åtgärder. Auktoritativ för seriestruktur och tabellberäkning.

**TB-bilagor** — detaljreglering. Bilaga 9 innehåller säsongsspecifik
slutspelsstruktur (KVF best-of-5, SF best-of-5, Final en match, övertid
2×10 min sudden death). Auktoritativ för slutspelssimulering.

**Bandygrytan** — empirisk data från verkliga Elitserien-matcher 2019-26.
Inte regler, utan utfall. Auktoritativ för kalibrering av matchmotorn.

---

## Filer

| Fil | Typ | Senast verifierad | Säsong |
|-----|-----|-------------------|--------|
| `SvBF-Regelbok-2025-2026.pdf` | Spelregler | 2026-04-25 | 2025/2026 |
| `SvBF-TB-Bilaga-9-2025-2026.pdf` | Tävlingsbestämmelser bilaga 9 | 2026-04-25 | 2025/2026 |
| `bandygrytan_detailed.json` | Empirisk matchdata | 2026-04-14 | 2019-26 |

**Saknas (ej nedladdad):** `SvBF-TB-2025-2026.pdf` — TB-huvuddokumentet.
URL ej verifierad. Om behov uppstår: sök på `foreningsinfo.svenskbandy.se`
eller be Jacob ladda ned från SBF:s extranet.

---

## Hur facts citerar dessa källor

Via `source.type` och `source.doc:`-fältet i YAML-schemat (se SCHEMA.md):

```yaml
source:
  type: rulebook
  name: SvBF-Regelbok-2025-2026
  doc: "Regel 16.3, sida 43"
```

```yaml
source:
  type: dataset
  name: bandygrytan
  match_count: 1124
  seasons: ["2019-20", ...]
```

---

## Versionshantering

När säsong 2026/2027 börjar:

1. Ladda ned ny regelbok som `SvBF-Regelbok-2026-2027.pdf`. Behåll föregående.
2. Granska gult-markerade ändringar.
3. För varje berörd R-fact: uppdatera `verified_at`, ev. värde, lägg en
   `revisions:`-post om innehållet ändrats.
4. Uppdatera `source.doc:`-pekaren i berörda facts.
5. Uppdatera tabellen ovan med nytt verifieringsdatum.

Samma process för TB och Bilaga 9.
