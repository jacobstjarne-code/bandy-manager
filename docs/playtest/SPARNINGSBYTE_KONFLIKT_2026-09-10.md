# Sparningsbyte — konflikt och migration

## Rotorsak

`switchToSave` sparade den utgående karriären direkt via `saveSaveGame`. Vid revisionskonflikt visades bara `lastSaveError`; den gemensamma sparvägens `saveConflict` sattes inte. Därmed öppnades inte den befintliga globala `SaveConflictModal`. Vanlig browser-reload kunde läsa tillbaka samma inaktuella Zustand-cache, medan dialogens `resolveSaveConflict` uttryckligen läser den auktoritativa CAS-skyddade sparningen.

Fix: karriärbytet återanvänder `persistGameSnapshot`. Ingen bypass, force-write, ny migreringsmotor eller Grindtest-specialregel. Misslyckad sparning stoppar fortfarande bytet. Kvot-/lagringsfel behåller sin felhantering; revisionskonflikt får den redan byggda återhämtningsvägen.

## Formatversion är inte sparningsrevision

Hypotesen om saknad formatmigration verifierades separat. `loadSaveGame` gör redan snapshot före `migrateSaveGame`; Zustand har också en migreringsväg. Nya regressionstester lägger format `0.1.0` respektive `0.3.11` direkt i lagringen och öppnar dem genom produktionsfunktionen: båda blir aktuell `CURRENT_SAVE_VERSION`, behåller identitet/spelare/säsong och revision 7, och kan därefter sparas till revision 8. Dessa tester var gröna före produktfixen. Ingen versionsbump eller ny migration behövdes för det reproducerade felet. Testerna täcker dessa gamla versionsstämplar; de bevisar inte att varje tänkbar historiskt skadad sparning går att reparera.

## Regression och browser

- Nytt två-flikar-test: B försöker byta från en stale karriär; bytet avvisas och måste sätta konfliktflaggan. Testet var rött på just den flaggan före fix. Efter explicit återhämtning läses A:s senaste fanMood 73, bytet går igenom, målsparningen var orörd under avvisningen och A:s framsteg finns kvar.
- Browser 2026-09-10, port 5173: Mina karriärer → Grindtest 2 öppnade nu konfliktdialogen. Dess **Ladda om** → nytt val av Grindtest 2 → `/game/dashboard` med **Västanfors, Grindtest 2, 2030/31, SEMIFINAL · MATCH 1**, kvartsfinalsammanfattning väntar. Ingen import eller tvångsskrivning användes. Byggfoten var serverstartens `8a348696`; aktuell ändring nådde sidan via HMR, så foten används inte som ensam versionsidentifiering.
- Tidiga testförsök slog i 5-sekundersgränsen under tunga dynamiska modulimporter. Fokustester körs om seriellt med 30 sekunder; samma assertions, ingen global testkonfiguration ändras.
- Kodcommit: `e1c8776f`. Fokussvit GRÖN: 4 filer/48 tester (saveGameStorage, saveConflictTwoTabs, multiSlotSwitch och onboardingResumeAfterSwitch), seriellt med 30 sekunders testgräns. `npm run build` GRÖNT, inklusive TypeScript och samtliga fem grindar. Fullsvit GRÖN: 552 filer/5 014 tester, exit 0, 581,78 sekunder (`npm test -- --testTimeout=30000`). Punkten arkiverad, 32→31 öppna, inga nya fynd.

Grind 2/3 är åter öppningsbara men inte godkända: detta prov spelade inte fler säsonger. Nästa prioritet efter denna fix är taktik 1a enligt Jacobs ordning, därefter nya-klubb-mötet.
