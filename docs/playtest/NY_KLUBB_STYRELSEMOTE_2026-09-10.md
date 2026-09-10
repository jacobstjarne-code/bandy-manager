# Ny klubb — första styrelsemötet

## Utfall

Punkten `tranarmarknad-ny-klubb-andra-aret` är stängd i två skivor:

- `e7eeedd7`: nytt tillstånd N före A/B/C, låst N-pool och målmotiveringar, `manager_appointed` i liggaren samt regressioner för klubbyte kontra karriärstart.
- `829e7a56`: den låsta dynamiska övertaganderaden kopplas till både aktuell `manager_appointed`-post och `managerProfile.clubSpells`.

Raden kan uttrycka avsked, frivilligt byte och återkomst. En klausul visas bara när dess fakta finns; utan aktuell liggarpost visas ingen dynamisk rad. Företrädarklausulen lämnas tom eftersom modellen ännu inte bär någon föregångaridentitet eller placering — inget fabriceras.

## Verifiering

- Fokustester: 2 filer/16 tester gröna. De täcker N/A-separation, avsked, frivilligt byte, återkomst, saknat liggarbelägg samt `manager_appointed`/`manager_return`.
- `npx tsc --noEmit`: grönt.
- `npm run build`: grönt, inklusive TypeScript och samtliga fem grindar.
- Browser, 390 px, `/dev/scenes?scene=board-n&inspect=1&width=390`: nytt klubbmöte renderat med N-ton, raden ”Du kom hit efter att Bollnäs GoIF tackat för sig.”, kassa, transferbudget och nya mål. CTA:n hade först två pilar eftersom både etiketten och `.btn-scene-cta::after` ägde pilen; etikettens dubblett togs bort och återprovet visar exakt en pil.

Ingen baseline ändrades. Punkten flyttades till arkivet: 29→28 öppna, inga nya MASTER-poster.
