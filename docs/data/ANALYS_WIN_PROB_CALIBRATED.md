# Finding 060 — kalibrerad vinstsannolikhetsmodell

## Datakvalitet

Tidslinjen använder 1066 herrmatcher vars mållogg återskapar slutresultatet. 58 matcher exkluderas på grund av ofullständig mållogg.

## Rullande kronologisk validering

Tre testfoldar omfattar 484 matcher och 3388 matchlägen från säsongerna 2022-23, 2024-25, 2025-26.

| Testmått | Kalibrerad modell | Gammal cell-grid |
|---|---:|---:|
| Log loss | 0.5646 | 0.5882 |
| Multiklass-Brier | 0.3179 | 0.3337 |
| Kalibreringsfel, 10 bin | 0.0131 | 0.0112 |

Log-lossförbättring (rå minus kalibrerad): 0.0236; 95 % match-bootstrap [0.0040, 0.0421].

## 95-procentströsklar för jämnstarka lag

| Ledning | Hemmalag | Bortalag |
|---|---:|---:|
| +1 mål | når inte 95 % | når inte 95 % |
| +2 mål | minut 76 | minut 81 |
| +3 mål | minut 47 | minut 64 |

Trösklarna är modellskattningar för lag med samma Elo före match.

## Begränsningar

- Valideringen omfattar tre senare säsonger och sju fördefinierade matchminuter.
- Modellformen har granskats mot befintliga säsonger; nästa kompletta säsong är den verkligt orörda kontrollen.
- Elo fångar tidigare resultat, inte laguppställning, skador, is eller väder.
- Modellen använder rå matchminut; minut 45 är inte alltid registrerad halvtid.
- Damserien kräver en separat modell. Slutspel ingår inte.