# SPRINTS 17–21 — INDEX & ORDNING

**Datum:** 18 april 2026
**Sammanhang:** Stor designsession som resulterade i AssistantCoach-entitet, komponentbibliotek, nya skärmar (Omklädningsrummet, Taktiktavlan, Granska), match-interaktionsuppgradering och tekniska fallbacks.

## Ordning

Kör i denna ordning — varje sprint bygger på föregående.

### Sprint 17 — Design-komponenter & kosmetik
**Tid:** 4–6h
Grundblock: 5 primitiva komponenter, font tokens, knappstil-verifikation, arena-suffix, portrait-fix, klack-badge-leather-bar.

### Sprint 18 — Assistenttränare
**Tid:** 5–7h
**Beroende:** 17
AssistantCoach-entitet + service med 5 personligheter × 4 bakgrunder. 6 use cases byggs men bara inbox-meddelande wiras till UI initialt.

### Sprint 19 — Nya skärmar & flöden
**Tid:** 10–14h
**Beroende:** 17, 18
Stor sprint. Auto-simulate abandoned matches, Omklädningsrummet (list-vy), Taktiktavlan (3 flikar), Förväntan & Profil, Granska-skärmen (guided step flow).

### Sprint 20 — Match-interaktionsuppgradering
**Tid:** 6–8h
**Beroende:** 18
C + D + E + G förbättringar på alla fem match-interaktioner (hörna, straff, kontring, frispark, slutspurt). Utfall-animation, svårighet %, tränartips, klickbara zoner.

### Sprint 21 — Tekniska fallbacks & audit-fixar
**Tid:** 4–5h
**Beroende:** Inget strikt — kan köras parallellt med 17–20
Stabilitetsfixar från flödes-audit: null-guards, timer cleanup, dubbelnavigering, idempotens.

**Total tid:** 29–40h

## Playtest mellan sprintar

Efter varje sprint: playtest minst en säsong för att fånga regressioner. Speciellt viktigt efter:
- Sprint 19 (stor UI-refaktor — Granska ersätter fördjupad matchvy)
- Sprint 20 (ny interaktions-shell gäller alla fem typerna)

## Säkerhetsaudit

Redan körd 18 april 2026 — alla fixar implementerade:
- CSP (`unsafe-inline` borttaget från scripts)
- Helmet (hsts, frameguard: deny, strict-origin-when-cross-origin)
- CORS (trimmade origins, warning vid saknad ALLOWED_ORIGINS)
- JSON-import-validering via `isValidSaveGameStructure()`
- Namnfält-whitelist (`^[a-zA-ZåäöÅÄÖ0-9\s\-']*$`, maxLength 40)

1412/1412 pass. Ingen åtgärd krävs i sprint 17–21.

## Designsession-referenser

Mockupsessionen 18 april täckte:
- Komponentbibliotek (InfoRow B, StatBadge, PageSection, PositionTag, OverlayBackdrop)
- Knappstil variant B (gradient + highlight + copper shadow)
- AssistantCoach: 5 personligheter (calm/sharp/jovial/grumpy/philosophical) + 4 bakgrunder + 6 use cases
- Omklädningsrummet: list-vy med 3 sektioner (Inre krets / Stammen / Vid dörren)
- Taktiktavlan: 3 flikar (Formation / Kemi / Anteckningar)
- Taktiktavlan Anteckningar: citat indenterade under namn (x=86), 5–7 spelare per omgång, tags TRÖTT/GLÖDANDE/MISSNÖJD/SKOTTFORM/VILL MER/SVIKTANDE
- Förväntan & Profil-kortet i mobilbredd (380px)
- Granska-skärmen: guided step flow med 5 icon-buttons (62×62px) ovanför stor CTA, utspridda med space-between, inga top-headers
- Match-interaktioner: C (utfall-animation) + D (svårighet %) + E (tränartips) + G (zoner som klickbara regioner)

## Skipped från denna session

- Historisk kontext i interaktioner (H) — eventuellt senare sprint
- Timer på interaktion (A) — implementeras men bara 5s default, inga rika varianter
- Supporter-känsla i interaktion (B) — skippas nu, kan läggas till senare
- Kedja av beslut (F) — skippas nu, komplex, senare sprint
