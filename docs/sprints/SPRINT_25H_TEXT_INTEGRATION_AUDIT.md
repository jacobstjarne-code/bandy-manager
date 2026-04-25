# Sprint 25h — Textintegrations-audit (Lager 2 + Lager 3)

**Källa:** docs/textgranskning/TEXT_SCANDAL_LAYER2_LAYER3_2026-04-25.md
**Commit:** `1062093`

## Punkter i spec

### Lager 3 — licenseService.ts
- [x] 2 cleared-varianter med {KLUBB}-token
- [x] 3 first_warning-varianter med {KLUBB}-token
- [x] 3 point_deduction-varianter med {KLUBB}-token
- [x] 3 license_denied-varianter med {KLUBB}-token
- [x] fillTokens() löser {KLUBB} → managedClub.name i checkLicenseStatus

### Lager 2A — eventProcessor.ts
- [x] 3 Licensnämnden-varnings-varianter (efter 5 ronders överskridande)
- [x] 3 Poängavdrag-varianter (efter 10 ronders överskridande)
- [x] Variant väljs via season-seed (deterministiskt per säsong)
- [ ] Ordförande-varning FÖRE köpbekräftelse — EJ IMPLEMENTERAD
  Orsak: kräver UI-ändringar i TransferScreen/ContractScreen (backendtracking
  gjordes i Pass 2, UI-lagret är separat task)

### Lager 2B — eventProcessor.ts + roundProcessor.ts
- [x] 4 sponsor-erbjudande-varianter med realistiska belopp (8-20 tkr/säsong)
  - Borgvik Bygg AB: 12 000 kr/säsong (550 kr/rnd)
  - Nordström Logistik AB: 8 000 kr/säsong (365 kr/rnd)
  - Hellström & Co: 15 000 kr/säsong (680 kr/rnd)
  - Lindström Holdings: 20 000 kr/säsong (910 kr/rnd)
- [x] Roterar via (currentSeason + nextMatchday)-seed
- [x] {KLUBB} och {SPONSOR} löses i offer-body
- [x] 3 konsekvens-varianter (Skatteverket, konkurs, lokaltidning)
- [x] Sponsornamn löst från game.sponsors vid konsekvens-trigger

### Lager 2C — eventProcessor.ts
- [x] kontrollfreak → variant 1 (iskallt telefonsamtal)
- [x] filantropen → variant 2 (besviken möte)
- [x] nostalgiker → variant 3 (fönsterscen + {KLUBB}-token)
- [x] Övriga personalities (tyst_kraft, showman, kalkylator) → seed-pick
- [x] {MECENAT} och {KLUBB} löses i titel och body
- [x] Penaltytexten bifogas som sista rad (inte inbakad i variant-text)

## Avvikelser från spec

- **2A ordförande-varning**: Inte implementerad — kräver UI-lager (TransferScreen).
  Beaktas i nästa sprint som innehåller UI-arbete.
- **{ORDFORANDE}-token**: Inte implementerad — namedCharacters har ingen
  ordförande-roll indexerad. Texterna undviker token och skriver implicit.
- **2B konsekvens reputation/communityStanding**: Specen nämner "Reputation -5,
  communityStanding -10" för alla tre varianter. Inte implementerat — community-
  och reputation-effekter vid konsekvens hanteras separat via scandalService
  och communityService, inte via inbox-text.

## Verifiering

```
npm run build → ✓ built in 5.95s
npm test      → 1895/1895 passed
npm run stress -- --seeds=3 --seasons=2 → 0 kraschar, 0 invariantbrott
```
