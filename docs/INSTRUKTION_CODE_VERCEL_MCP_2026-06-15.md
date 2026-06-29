# INSTRUKTION → CODE: Vercel-MCP (deploy + loggar inför extern RC)

**Datum:** 2026-06-15 · **Av:** Opus · **Status:** Vercel redan konfigurerat (`vercel.json` i repo-roten med SPA-rewrite verifierad). Detta kopplar Code till Vercel-MCP så deploy + felsökning på distans blir ett verktyg, inte ett manuellt steg.

## Varför (kort)
Inför extern RC måste builden ut någonstans och testarnas fel måste gå att läsa på distans. Vercel-MCP ger Code tre saker filsystem-MCP inte kan: deploya, läsa build-loggar (byggde det grönt?), läsa runtime-loggar (vad kraschade hos testaren?). Det senare kopplar direkt till GAP-2 feedback-fångsten: testarrapport + runtime-logg = felsökningsunderlag utan att du sitter bredvid.

## Aktivering
Slå på Vercel-connectorn för Code:s session (samma connector-meny som filsystem-MCP). Bekräfta att rätt team/projekt är kopplat — `.vercel/project.json` ska finnas efter första länkningen; om inte, kör `list_teams` + länka projektet en gång.

## Vad Code ska använda den till

**1. Verifiera deploy efter push (löpande nu):**
- Efter en RC-relevant push: deploya till en preview-URL, läs build-loggen, bekräfta grön build. Rapportera preview-URL + build-status med hash.
- Detta fångar bygg-fel som `tsc` lokalt missar (miljöskillnader, PWA-precache-generering, asset-paths).

**2. Preview-URL för din verifiering (inför att du spelar mot deployad build):**
- En delningsbar preview-URL låter dig spela RC:n på telefonen, inte bara i dev. Det är närmare hur en extern testare möter spelet (PWA-install, service worker, riktig nätverkslatens).
- Code genererar URL:en och ger dig den.

**3. Runtime-loggar vid felsökning (när extern RC är ute):**
- När en testare rapporterar via GAP-2-knappen (build-hash + skärm + fritext): Code matchar hash mot deploy och läser runtime-loggen för den sessionen. Rapport + logg = rotorsak utan repro-gissning.

## Vad den INTE ska användas till
- Production-deploy av RC:n utan ditt go. Code deployar PREVIEW fritt; **production-deploy kräver Jacobs explicita ja** (en production-URL är vad externa testare får — det är ett releasebeslut, inte ett byggsteg).
- Domän-/projekt-inställningar i Vercel-dashboarden (account settings — ditt bord, inte Code:s).

## Konkret nästa steg
1. **Du:** slå på Vercel-connectorn för Code.
2. **Code:** bekräfta team/projekt-länk (`list_teams` vid behov), deploya nuvarande main till en preview-URL, läs build-loggen, rapportera URL + build-status + hash. Production rörs inte.
3. **Du:** öppna preview-URL:en på telefonen — då spelar du RC:n som en testare skulle möta den (PWA, service worker, latens), inte bara i dev.

— Opus, 2026-06-15
