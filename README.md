# Bandy Manager

Ett managerspel om svensk bandy i bruksorterna. Tolv fiktiva klubbar på riktiga
orter, en säsong med cup, serie och slutspel, en styrelse som minns, en klack
som har åsikter. Mobil-first PWA, spelas i webbläsaren, sparas lokalt.

Text och ton är spelets kärna: bandysvensk understatement, inga generiska
sportfraser. Matchmotorn är kalibrerad mot 1 124 verkliga Elitseriematcher.

## Stack

TypeScript · React 19 · Vite · Zustand · IndexedDB (idb-keyval) · vite-plugin-pwa.
Frivillig backend för notiser/statistik i `server.js` (Express + Postgres, Render).

## Köra

```
npm ci
npm run dev        # http://localhost:5173
npm test           # vitest, hela sviten
npm run build      # tsc + vite + fem lint-grindar
```

## Var saker bor

- `src/domain/` — spelvärld, motor, services, all svensk speltext (`data/`)
- `src/application/useCases/` — omgångs- och säsongsprocessorer
- `src/presentation/` — skärmar, komponenter, store
- `src/infrastructure/persistence/` — sparning, migrering, snapshots
- `docs/` — beslut, lärdomar, domar, handovers. Startpunkt: `CLAUDE.md`
  (arbetssätt) och `docs/MASTER_OPPET.md` (öppna poster).
- `bandy-brain/` — separat analyssajt (Astro) på samma data

## Status

Pre-release. Releasedefinitionen står i `docs/RELEASE_DEFINITION_MJUKLANSERING.md`.
Deploy till produktion är ett manuellt steg (`vercel --prod`), aldrig auto på push.

Klubbnamnen sammanfaller med orter där verkliga föreningar finns. Allt runt
namnen — arenor, klackar, färger, märken, personer, historia — är påhittat och
har ingen koppling till verkliga klubbar.
