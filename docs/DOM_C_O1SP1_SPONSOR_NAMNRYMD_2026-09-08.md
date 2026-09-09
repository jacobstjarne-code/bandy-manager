# DOM — c-o1sp1: sponsor/antagonist-namnrymden, id vs roll

**Datum:** 2026-09-08 · **Av:** Opus · **Grund:** `contextualSponsorService.ts`, `rivalries.ts` (kodläst), raden `c-o1sp1-kontextuella-sponsorer`. Domen som raden flaggade "pending grundad läsning".

## Diagnosen (bekräftad mot koden)

Kontextuella sponsorer HAR ett stabilt id: `contextual_top4_${season}`, `contextual_cs70_${season}`, `contextual_att1000_${season}`, med `name` + `category` ('Regional'/'Kommunalt'/'Catering'). Men rival/antagonist-systemet keyas UTESLUTANDE på klubb-id-par: `Rivalry.clubIds: [string, string]`, och varje uppslag (`getRivalry`/`getPrimaryRivalry`/`getRivalClubId`) tar och returnerar klubb-id. En rivalitet är alltid klubb↔klubb.

Så en kontextuell sponsor kan aldrig nå antagonist-rollen: sponsorn lever i sponsor-namnrymden (id + category), rivalen i klubb-id-namnrymden, och de skär inte varandra. Rollen (antagonist) är bunden till en NAMNRYMD (klubb-id), inte till en stabil entitet som kan HÅLLA roller. Det är precis radens fynd, och samma rot som R3/ålderskurva/beslutsbyggarna: identitet konflaterad med roll/kategori.

## Domen — riktning: stabilt id + roll-medlemskap

Målarkitekturen: en entitet (klubb, sponsor, mecenat) har ETT stabilt id och HÅLLER flera roller (sponsor OCH antagonist), där rollen är ett medlemskap, inte entitetens identitet. Då kan en kontextuell sponsor med sitt stabila id också adresseras som antagonist, utan en parallell klubb-id-identitet. Samma generalisering som redan gjorts för R3 och beslutsbyggarna.

## Scope — PARKERA post-launch (Opus rek)

Detta är en refaktor tvärs över namnrymder med bred blast radius: varje konsument av sponsor-, rival- och subjekt-identitet (rivalries, sponsorEvents, ledgerns polymorfa subject, reviewCallback, Krönikan) rörs. Raden säger själv "ej blockerad", och §10 (inga fler system före release) gäller. Att bygga en id-vs-roll-modell tvärs igenom nu är fel tidpunkt — det är arkitektur, inte en gap-täckare.

Så: riktningen domd, refaktorn parkerad post-launch. Inte längre "dom pending" — den är fälld, den väntar bara på rätt tidsfönster.

## Smal genväg — bara om O1 faktiskt behöver en sponsor-antagonist före dess

Om O1:s varsel-mall verkligen behöver en namngiven sponsor i antagonist-slotten före refaktorn: bygg INTE om namnrymderna — låt O1:s mall referera den kontextuella sponsorn via dess befintliga stabila id direkt, en riktad brygga i just den mallen, utan att förena namnrymderna. Billigt, ingen tväsnittsändring. Men raden antyder att O1 inte behöver det (parkerad), så default är att vänta på refaktorn.

## Ägarskap

Opus: denna dom. Jacob: om han vill dra fram refaktorn (eller den smala bryggan) före release — annars post-launch. Code: refaktorn (post-launch) eller den smala bryggan (om Jacob drar fram O1).
