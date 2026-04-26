# Findings — Vad simuleringarna lärt oss om bandy

Det här är ett biprodukt-projekt till Bandy Manager-utvecklingen. När
vi kalibrerar motorn mot Bandygrytans 420 Elitseriematcher (2024-26)
och kör stresstest med 10 seeds × 200 matcher upptäcker vi mönster i
bandy som varken är allmänt diskuterade eller väldokumenterade.

Det här är inte forskning i strikt mening — det är observationer från
en simuleringsmodell som är tillräckligt välkalibrerad för att vara
intressant. Begränsningarna ska tas på allvar (se nedan).

---

## SYFTE

Spara saker vi upptäcker som inte redan står i Bandygrytan eller på
svenskbandy.se. Bygga en samling över tid. Eventuellt publicera när
det finns 5-10 finds.

---

## STRUKTUR

Två parallella system i detta mappträd:

### Narrativa findings (denna fil)
En fil per find, numrering löpande. Analysrapporter om specifika fenomen.

Format per find:
1. **Frågan** — vad var det vi undrade?
2. **Datan** — Bandygrytan-matcher, stresstest-runs, eller annat
3. **Det vi fann** — siffror, mönster, fördelning
4. **Tolkning** — vad det säger om bandy
5. **Begränsningar** — varför det kanske inte stämmer

### Bandy-Brain (atomära facts)
Strukturerade YAML-facts om regler, statistik, designval och världs-kanon.
Schema: [SCHEMA.md](SCHEMA.md) — läs den innan du skapar eller ändrar facts.
Fakta: `facts/rules/` (R001–), `facts/stats/` (S001–), `facts/design_principles/` (D001–), `facts/world_canon/` (W001–)
Hypoteser: `hypotheses/` (H001–)
Senaste audit: [AUDIT_PASS_2_2026-04-25.md](AUDIT_PASS_2_2026-04-25.md)

---

## INDEX

| # | Datum | Titel | Status |
|---|-------|-------|--------|
| 001 | 2026-04-25 | Halvtidsledning vs verkligt utfall | Utkast — väntar på Sprint 25-HT-data |
| 005 | 2026-04-26 | Hörnmål-andelens fall genom slutspelsfaserna | Verifierad rådata-observation |

---

## METODISKA REGLER

1. **Bandygrytan är facit för verkligheten.** Motorn är hypotesen. Om
   de skiljer sig är det antingen motor-bugg eller dold faktor i bandy.
2. **Inga findings utan datastöd.** "Det känns som att..." räcker inte.
   Visa siffrorna eller stryk findet.
3. **Begränsningar ska skrivas före slutsatser.** Om motorn har en känd
   svaghet på området — säg det.
4. **En find = ett konstaterande.** Inte fem.
5. **Skriv som rapport, inte som blogg.** Ingen humor, ingen ironi.
   Datan är intressant nog.

---

## VAD DET HÄR INTE ÄR

- Det är inte forskning. Vi har ingen peer review, vi har simulering.
- Det är inte spelguide. Det är observationer om verkligt bandy.
- Det är inte autonomt. Findings skrivs när någon (Opus, Code, Jacob)
  hittar något och bestämmer sig för att skriva ner det.

---

## VAD DET KAN BLI

- En sektion i en framtida bandymanager-FAQ
- En artikel på r/bandy om motorns oväntade fynd
- Material för dialog med Bandygrytan om datakvalitet
- Bara ett kul arkiv för dig och Erik
