# DOM — PEPTALK FÅR EN YTA: förbered-fasen, inte ambient portal

**Datum:** 2026-09-02 · **Av:** Opus + Jacob · **Utlöst av:** `peptalk-portalbeat-beslut` (BACKLOG:175) — `pepTalkService.getPepTalk` (21 låsta repliker, fem kategorier) dödmarkerad 2026-08-27, noll konsumenter sedan Dashboard→Portal-bytet (`4a417895`). Behåll-eller-radera + vilken yta.

## Beslut 1 — BEHÅLL (radera aldrig)
21 låsta, kvalitativa repliker (Opus-verifierat: bandysvensk understatement, tränarröst, konkreta) + smart mekanik (fem kategorier vinst/förlust/oavgjort/kris/topp, deterministiskt round-seedad, akt-suffix i slutspurten). Det är HEMVISTEN som saknas, inte innehållet. d0d4d923-läxan: radera aldrig auditerad låst text på "ingen konsument".

## Beslut 2 — YTAN: förbered-fasen som tränar-reflektion (INTE ambient PortalBeat)
Kodläst: replikerna är alla efter-match-reflektioner som blickar framåt ("Tillbaka på isen imorgon", "Minns det i mars", "Nu jobbar vi"). De är omklädningsrums-tal, inte hälsningar/press. Den ursprungliga hemvisten (Dashboard efter varje omgång) var rätt SORTS ögonblick.

**Dom: wira getPepTalk till förbered-fasen** (`phase="forbered"`) som en tränar-reflektion INFÖR nästa match — där tränaren faktiskt talar till laget. En bro mellan matcher, precis vad replikerna skrevs för.

**AVVISAT: den gamla anteckningens "PortalBeat på D1 ambient-nivå".** Ambient är bakgrundsbrus; dessa repliker är för bra och för specifika för bakgrund. En peptalk som svarar på din senaste förlust ska MÖTA dig inför nästa match, inte ligga som en ambient-rad du scrollar förbi. Reaktiv och specifik text hör vid ett ögonblick, inte i bakgrunden.

## Beslut 3 — cooldown via narrativeBeatLog
Nuvarande round-seed är deterministisk men kan upprepa samma replik. Lägg narrativeBeatLog-cooldown (semanticKey per kategori, `rotateSubject`/`isOnCooldown`) så samma peptalk inte kommer två matcher i rad. RÄTT lager per `DOM_LIGGARE_COOLDOWN_GRANS` — "har vi visat denna nyligen" ÄR cooldown, inte kanon.

## Texträttelse (Jacob 2026-09-02)
PEP_WIN-repliken "Bra matcher vinner man med fötterna" → "med SKRIDSKORNA". Fötter är fotbolls-idiom; det är bandy. Rättad i `pepTalkService.ts`.

## ÄGARSKAP
Code: wira `getPepTalk` till förbered-fasens flöde (en tränar-reflektions-rad inför matchen), lägg narrativeBeatLog-cooldown på replikvalet. Ingen ny text (21 repliker finns, skridsko-rättelsen gjord). Opus: inget kvar. Jacob: beslut fattat (behåll, förbered-fasen, cooldown).
