# Mecenat/patron — ommätning av seedad säsongsrullning

**Datum:** 2026-09-09
**Dom:** `DOM_MECENAT_PATRON_MODELLFORM_2026-09-08.md`
**Körning:** `scripts/mecenat-patron-sasongsrullning-matning-2026-09-09.ts`
**Omfattning:** 2 000 deterministiska saves per CS-nivå, tio säsonger per save.

## Metod

Samma isolerade modell som 2026-08-26 används: communityStanding hålls konstant och avhopp modelleras inte, så utfallet mäter ankomstmodellen och inget annat. Produktionskodens riktiga save+säsong-seed används. Varje stödsort får exakt en rullning per säsong, vid första serieomgången.

Startgenereringen i `setupManagedClub.ts` ingår inte; den äldre mätningen av den löpande ankomstvägen gjorde samma avgränsning. Patronkolumnen förutsätter att klubbens era redan lämnat `survival`, eftersom eragrinden är skyddad och separat från CS-rampen.

## Resultat

| CS | Mecenatchans/säsong | Mecenater/10 säsonger, medel | Mecenattak | Noll mecenater | Patronchans/säsong | Patron inom 10 säsonger | Medelankomst | Aldrig patron |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 40 | 14,0 % | 0,78 | 1 | 21,8 % | 9,4 % | 63,0 % | säsong 4,6 | 37,0 % |
| 60 | 20,0 % | 0,89 | 1 | 10,7 % | 13,6 % | 76,3 % | säsong 4,3 | 23,7 % |
| 80 | 26,0 % | 1,73 | 2 | 4,9 % | 17,8 % | 86,3 % | säsong 4,0 | 13,7 % |
| 100 | 32,0 % | 2,53 | 3 | 2,0 % | 22,0 % | 92,0 % | säsong 3,6 | 8,0 % |

## Domskontroll

- Kurvan lutar monotont på samtliga redovisade mått.
- Låg CS är aldrig en absolut vägg: både mecenat och patron har sannolikhet över noll.
- Hög CS ger både fler mecenater och tidigare/oftare patron.
- Det skyddade mecenattaket är oförändrat och överskrids aldrig.
- En missad rullning prövas inte om varje omgång; nästa chans kommer nästa säsong.
- Patronens befintliga era-, cooldown- och avhoppslogik samt mecenaternas avhoppslogik är orörda.

Den nästan platta 2026-08-26-tabellen är därmed borta. Modellformens godkänt-när är uppfyllt.
