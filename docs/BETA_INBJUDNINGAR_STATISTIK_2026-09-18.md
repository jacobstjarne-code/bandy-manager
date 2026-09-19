# Sluten beta: inbjudningar och diagnostisk statistik

Beslut 2026-09-18: enkla engångsinbjudningar, inga konton. Spelet och sparfilerna förblir lokala. Detta dokument beskriver den lokala implementationen; det är inte ett påstående om att betan är aktiverad i drift.

## Vad vyn besvarar

- Hur många installationer var aktiva de senaste 7/30 dagarna, och hur många återkom en annan dag?
- Hur långt kommer installationer: karriärstart, introduktion, första match, fem seriematcher, halva första serien, slut på första/tredje karriärsäsongen?
- Har träning, taktik, scouting, värvning och Orten åtminstone öppnats? Detta är **inte** en mätning av att deras kontroller använts.
- Hur många pass avslutades faktiskt, hur långa var de avslutade passen, och hur många renderings-/explicita sparfel rapporterades?
- Hur många koder utfärdades, användes och återkallades? Hur många inbjudna installationer startade karriär respektive spelade första matchen (bland installationer med statistik på)?

Varje spelmått räknar unika **installationer**, inte personer eller karriärer. En spelare med två enheter räknas två gånger; en installation med två karriärer en gång. Passlängd är osäker när `pagehide` inte levereras. Inbjudningsmått för start/match blir lägre när testare valt bort statistik. Äldre saves baslinas och får inte retroaktivt nya milstolpar. De äldre `season_completed`-försöken avvisades tidigare av servern eftersom kalenderåret 2026 överskred valideringens 1000-tak; dessa historiska händelser kan inte återskapas säkert.

## Åtkomst och drift

- Adminvyn är `/admin/beta`. Endast servern läser `BETA_ADMIN_SECRET`; nyckeln skrivs in tillfälligt i vyn och sparas inte i webbläsaren. API:t lämnar endast aggregat och koder i klartext **en gång vid skapandet**. Lagra/överför koden säkert innan nästa skapas.
- Adminnyckeln måste sättas som hemlighet på Render-API:t före bruk. Inga värden hör i Git eller Vite-variabler.
- Inbjudningsgrinden är **avstängd** om inte `VITE_BETA_INVITES_ENABLED=true` sätts för webbbygget. Att slå på den låser även befintliga installationer tills de fått kod. Beslut och kommunikation om aktivering krävs före deploy.
- Detta är en åtkomstgrind i en statisk webbapp, inte skydd för själva JavaScript-filerna. Den räcker för ett avgränsat test, men ska inte beskrivas som starkt säkerhetsskydd.
- En kod går till en installation, kan återkallas och är giltig 30 dagar för inlösen. Ny enhet kräver ny kod. Koden lagras bara som SHA-256 på servern; kopplingen mellan inbjudan och installations-id är mer identifierande än övrig pseudonym statistik. Håll namn/e-post utanför tabellen och informera testarna om kopplingen.
- `analytics_events` gallras efter 90 dygn; användaren kan välja bort statistiken. Inbjudningstabellen är åtkomstdata, inte del av opt-out-kanalen. Efter betan behövs beslut om när inbjudningstabellen raderas.
- Åtgärdat efter audit 2026-09-19: tystning av push raderar enbart notisdata, inte betaidentitet eller separat användningsstatistik. Äldre klienters helradering och inaktivitetsgallring får aldrig göra en redan använd kod återanvändbar. Admin-/utvecklingsvyer startar ingen speltelemetri. Spelstatistikens population omfattar även legitima spelare utan inbjudan; inbjudnas mått redovisas separat.

## Innan aktivering

1. Produktionsverifiera Render-API, `VITE_ATTENTION_API_BASE` och att ett nytt testinstallationsflöde faktiskt skriver events. Den lokala bygg-/testgrinden verifierar inte drift. Render Free kan ha lång kallstart.
2. Låt Fable granska den nya spelarvända inbjudningstexten innan grinden slås på. Adminvyns utilitaristiska etiketter kan granskas samtidigt.
3. Sätt stark `BETA_ADMIN_SECRET`, skapa en testkod, lös in den, verifiera `GET /api/beta/access`, återkalla och verifiera att nästa kontroll nekar.
4. Bestäm hur redan spelande testare får kod. Aktivera grinden i ett separat webbbygge; slå inte på den genom att bara merge:a koden.
5. Migrera/uppgradera Render Postgres före 2026-10-10; gratisdatabasen saknar backup och upphör då.

## Inte mätt i denna version

Ingen rå klickström, ingen fritext, inga spelarnamn eller sparfiler. Ingen per-val-telemetri: O12:s beslutskvitton finns lokalt i saven, inte i `analytics_events`. Inga detaljerade matchresultat eller matchbalansmått; kontrollera dem med den deterministiska kalibreringen. Generella handlingsfel mäts inte eftersom ett avvisat bud ofta är ett korrekt spelbeslut, inte ett tekniskt fel. Om betan visar att folk fastnar i ett specifikt moment bör det få en **egen, semantisk** mätpunkt och ett test, inte en bred `button_clicked`-ström.
