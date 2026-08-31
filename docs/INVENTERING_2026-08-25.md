# ⛔ ERSATT AV `INVENTERING_2026-08-31.md` (via `INVENTERING_2026-08-26.md`) — BYGG INTE PÅ DENNA

---

# INVENTERING 2026-08-25 — allt öppet, ingenting parkerat (HISTORISK)

**Av:** Opus. Regel för den här filen: **varje post har en ägare och ett nästa steg.** Ingen rad får sluta i "senare".

`KVAR.md` är dödmarkerad sedan 2026-06-21 och ägs av `BACKLOG.md`. Fyra källor gäller: `SLUTTEST_KO.md`, `BACKLOG.md`, auditsviten `5c9a7a8`, och påståendesvepet.

---

## 1 · BLOCKERAR AUDITEN

| Post | Ägare | Nästa steg |
|---|---|---|
| **Licensvarningen** — kravet synligt, orten som spak | Code | Rapportera var varningen renderas och vilka fält den bär, sedan bygg |
| **Licensräknarens minneslöshet** — ackumulator i stället för nollställning | Code | Föreslå magnituder, Opus dömer, bygg efter varningen |
| **Återkopplingsslingan** — 100× större utfall än formeln förklarar | Code | Mät innan något balanseras |
| **Avstängningsmekaniken** — specad, obyggd. `SUSPENSION_INCIDENT_MULTI_LINES` fortfarande död | Code | Bygg enligt spec: tredje utvisningen = matchstraff, 10 min → 3 matcher, 5 min → 1 |
| **H5 sena ekonomin** — renommé klampar vid 100, taket nås säsong 5–6 | Code | Rapportera vad som händer efter taket, sedan Opus dömer |

---

## 2 · KÄNDA BUGGAR, INTE PÅBÖRJADE

| Post | Ägare | Nästa steg |
|---|---|---|
| `wageBudget` räknas aldrig om för någon klubb, men spärrar kontraktsbeslut | Code | Rapportera vad den gatar, sedan fixa |
| `Club.fanExpectation` — noll skrivställen någonsin | Code | Radera fältet, eller wira det. Rapportera vilket som är rätt |
| Sex okontrollerade `*Round`-fält | Code | Kontrollera skalan, samma svep som de fem redan fixade |
| `mostImproved` — kräver lagrad säsongsstart-trupp | Opus | Skriv om raden så den inte kräver fältet |
| **Illustrationerna** — bruksort-header, Slottsbron, Lesjöfors klara men aldrig lagda i `public/assets/` | Jacob | Lägg filerna, verifiera i appen |
| `cup` och `premiar` saknar bild → "illustration på väg" i produktion | Jacob | Beställ två bilder enligt stilbibeln |

---

## 3 · AUDITSVITEN — MEDIUM OCH LOW, STATUS OKÄND

`M1`–`M13` och `L1`–`L2` från `5c9a7a8`. Några är sannolikt byggda i förbifarten.

**Ägare: Code. Nästa steg: en rad per post — KLAR (sha), DELVIS, EJ.** Inget byggs innan listan finns; flera kan redan vara stängda och resten prioriteras mot auditen.

---

## 4 · OBYGGDA DOMAR

| Post | Ägare | Nästa steg |
|---|---|---|
| `O1` kandidat 3–6 — mecenatens krav, anläggningen som kostar orten, ungdomen, supporterbrevet | Code | Bygg kandidat 3 (mecenatens krav) direkt efter auditen. Mallen är bevisad två gånger |
| `O10` tillväxtslingan — kortet har en fråga, frågan en länk, länken startar en karriär från samma seed | Code | `worldSeed` finns sedan `K4` och saknar fortfarande konsument. Detta är den |
| `U8` bundle 2,1 MB · `U9` telemetri | Code | Efter auditen. `U9` behövs för `O2`:s val-entropi |
| `C-O1SP1` kontextuella sponsorer som rival | Code | Låg prioritet men äger en rad — bygg när sponsorkoden ändå rörs |

---

## 5 · PÅSTÅENDEGRINDEN — NIVÅ 3 OCH RESTEN AV TAGGNINGEN

Nivå 1 är byggd med 56 taggade funktioner av 85 påståendebärande. Nivå 3 är byggd för `resolvedChoices`.

**Ägare: Code. Nästa steg: tagga de återstående ~29** och rapportera hur många av svepets 25 fynd som fångas av nivå 1+2. Den siffran avgör om nivå 3 ska breddas.

---

## 6 · JACOBS BESLUT

| Fråga | Varför nu |
|---|---|
| **Ska auditen köras innan eller efter licensfixen?** | Fixen ändrar det första en Survive-spelare möter. Körs auditen före rapporteras `H4` igen |
| `M13` — formatet 12 lag/22 omgångar mot verklighetens 14/26 | Kanonfråga, påverkar allt som räknar omgångar |
| `O13` jobbmarknad efter avsked | Sista obeslutade produktposten från sluttestet |

---

## Vad som INTE står här

`SPÅR B` (byggd), `Överlämning 2` (stängd), `KVAR.md` (dödmarkerad), `E-STRESS1` / `E-GRIND0-1` / dubblettskriptet (byggda), `H4`-spåret utom de två licensfixarna.

**Om något saknas i den här filen är det för att det är stängt — eller för att jag missat det. Det andra har hänt fyra gånger den här veckan.**
