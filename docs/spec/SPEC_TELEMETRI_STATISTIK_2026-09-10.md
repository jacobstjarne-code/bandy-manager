# SPEC — statistik & tracing (tratt, retention, hur de spelar)

**Datum:** 2026-09-10 · **Av:** Opus · **Beställd av:** Jacob · **Grund:** `server/attention/postgresStore.js` (kodläst), `stickiness-drift-backend` (V1-backenden Codex bygger), `stickiness-dataskydd`. Jacobs beslut: opt-out i inställningarna, berättigat intresse, gallring inbyggd. Röret byggs i V1; läs-vyn är post-launch.

## Tre frågor det ska besvara

1. **Räckvidd** — hur många installerar och kommer tillbaka.
2. **Hur de spelar** — klubb, svårighetsgrad, val, passlängd.
3. **Var de stannar** — tratten: onboarding → första match → slut på säsong 1 → säsong 3. Den viktigaste: säsong-över-säsong-retention bekräftar eller falsifierar hela minnes-tesen.

## Vad som redan finns (kodläst)

`postgresStore.js` har: `attention_installations` (pseudonymt id + SHA-256-token + `preferences` jsonb + `metadata` inkl. timeZone), och en GENERISK `attention_events` (installation_id, type, payload, recorded_at). **Men** `attention_events` driver push-svarsprofilen (`buildResponseProfile` läser den för backoff/affinitet) — så statistik ska INTE dumpas där, den skulle grumla push-logiken.

## Tabell — egen `analytics_events`, barn till installationen

```sql
CREATE TABLE analytics_events (
  id bigserial PRIMARY KEY,
  installation_id varchar(128) REFERENCES attention_installations(id) ON DELETE CASCADE,
  event varchar(80) NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX analytics_events_install_idx ON analytics_events (installation_id, recorded_at);
CREATE INDEX analytics_events_event_idx ON analytics_events (event, recorded_at);
```

Barn till `attention_installations` → `ON DELETE CASCADE` betyder att avregistrering redan raderar all statistik för installationen, samma kontrakt som `stickiness-dataskydd` satte. Skild från `attention_events` → push-logiken rörs inte, och statistiken får egen gallring.

## Händelseuppsättningen (minimal — tratt + retention + hur de spelar)

- `install` — payload: appversion, plattform, locale (timeZone finns redan i metadata)
- `game_created` — payload: `{ club, difficulty }`
- `onboarding_done`
- `first_match`
- `season_completed` — payload: `{ season, placement }` (ETT event bär både "säsong 1 klar" och "nådde säsong N")
- `game_over` — payload: `{ reason: dismissed|license|bankruptcy, seasonsSurvived }` (det här är "var stannar de" — hoppar folk av efter att ha fått sparken?)
- `session_start` / `session_end` — passlängd + återkomstkadens

Ur det läses kohort-retention (D1/D7/D30 + säsong-över-säsong), tratt-avhopp, och fördelningar (svårighet/klubb). **Hur de VÄLJER** duplicerar vi inte — O12:s instanssanna beslutstelemetri fångar redan det; den läses i aggregat separat.

## Opt-out (Jacobs beslut: i inställningarna)

En flagga i den befintliga `preferences`-jsonb:en (`analytics: true` som default, opt-out tillgänglig). Klienten kollar den FÖRE sändning; servern släpper analytics-event för opt-out:ade installationer (försvar på djupet — klienten kan ha gammal kod). Toggeln bor i spelets Inställningar. Push är en separat sak och kräver aktivt samtycke oavsett (webbläsarens permission-modell).

## Gallring (berättigat intresse kräver kort lagring)

Schemalagt jobb raderar `analytics_events` äldre än 90 dygn på `recorded_at` — samma 90-dygnsinstinkt som redan ligger i V2 för push-datan. Vill man ha långsiktiga trender: rulla upp till dagliga aggregat INNAN radering (aggregatet är inte persondata och får sparas). Retention-kohorter kräver att man följer en installation över tid, så id↔event-länken behålls under gallringsfönstret, sedan aggregeras bort.

## Hållning: diagnostisk, inte engagemangs-maximerande

Minimala payloads, ingen fritext, ingen PII, aggregat-först. Statistiken ska mäta OM spelet funkar och var det tappar folk — aldrig driva streaks eller dark patterns. Samma textsanning-hållning som allt annat spelet står för.

## Inställningstext (Opus, utkast — låses på Jacobs nick)

Toggel-etikett: **Anonym användningsstatistik**

Förklaring: Spelet kan skicka anonym, sammanslagen statistik om hur det används — vilka lägen som spelas och var folk fastnar — så att det kan bli bättre. Inget namn, ingen e-post och ingen sparfil lämnar din enhet. Du kan stänga av det här när som helst.

## Ägarskap

Codex: `analytics_events`-tabellen + händelsesändaren (klient) + gallringsjobbet, i V1 medan backend-koden ändå är öppen. Opus: denna spec + inställningstexten (utkast ovan). Jacob: opt-out-beslutet givet; kvar är bara om röret byggs i V1 NU eller som eget pass efter V1. Läs-vyn/dashboarden är post-launch (behövs ingen retention-vy före spelare).
