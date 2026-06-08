# HANDOFF — Motorkänsla: MomentumBar + MatchLive-helhet

**Från:** Design-Claude · **Datum:** 2026-06-07
**Mock:** `docs/mockups/2026-06-07_design_motorkansla.html`
**Svarar på:** `DESIGN-BRIEF-MOTORKANSLA-2026-06-07.md`

## Kritiskt fynd — befintlig bar bryter ärlighetsprincipen redan idag

`MomentumBar.tsx` läser **inte** motortillstånd. Den proxar:
```ts
homeActions = currentMatchStep.shotsHome + currentMatchStep.cornersHome
homePercent = homeActions / total
```
Det är action-räkning, inte `momentum`/`postBreakUrgency`/`lateFactor`. Den *ser* ut som momentum men hänger inte ihop med vad som avgör matchen — exakt §2:s "dekorativa lögn", redan live. Redesignen är alltså en **korrigering**, inte bara en uppfräschning.

## De tre tvingande beteendena (§4.1) — var och en taggad

| Visuell rörelse | Motorvariabel | Beteende |
|---|---|---|
| Glidning mot jagande lag, svällning mot 60' | `postBreakUrgency` | Riktning, ej blink |
| Nål rycker till målskytt & **stannar** | `postEqualizerMomentum` | Ingen 50/50-nollning |
| Volatilitetsband **vidgas** sent | `lateFactor` | Volatilitet upp, ej mot mitt |
| Nålens nuläge + decay-takt | `momentum` | Motorns kadens, ej glättad |

Två spår löser ärlig-vs-läsbar: nål i motorns decay-takt + historik-sparkline för struktur + annoterade brytpunkter (onboarding, krymper efter ~3 exponeringar).

## Spakar

- **A · Paussnack** — modulerar `postBreakUrgency`. Synlig förutsägbar riktning på baren i 2H (mini-preview). Loop: val → konsekvens.
- **B · Sent matchnings-val** (NY, behålls per Jacob) — tänds via `lateFactor`-gate i jämnt sent läge. *Gå på vinsten / stäng igen.* Koncept, ej färdig integration.
- **C · Taktik-läsbarhet** — beskrivna rytm-konsekvenser, ej namnlösa reglage. Efter Codes stilkalibrering.

## Kvitterings-momentum — perceptuellt, ingen låtsasspak

Saknar naturlig spak mitt i halvlek → **förstärks inte**. Bandet växer inte extra där, ingen knapp. Kännbar, ej uppblåst (§5).

## Öppna frågor till Opus (Jacobs tre svar)

1. **Volatilitetsbandet** — exponerar motorn en swing-range / momentum-varians, eller härleder Design den från senaste N ticks? Jacob: behåll helst. **Om ingen variabel finns: stryk bandet hellre än fejka det** (§2).
2. **Spak B** — bekräftad behållas. Öppet: fristående tänd-knapp, eller snabbval i befintlig in-match-yta (controls-raden)? Påverkar MatchLive-komposition.
3. **Decay-takt** — Design behöver motorns faktiska decay-konstant så nålens animation matchar simuleringen. Opus/Code-fråga.

## MatchLive-helhet (nästa mock)

Baren bor i `MatchControls`, mellan pause/ff/sub/taktik-knappar och `StatsFooter`, under `ScoreboardStalvallen`, över `CommentaryFeedStalvallen`. Den rikare baren + Spak B måste komponeras **in i** den stacken, inte ovanpå. Helhetsgenomgång: scoreboard → MomentumBar (ny) → controls → Spak B-läge → stats → commentary — en sammanhållen mörk match-vy, Stålvallen-vokabulär. Levereras separat.

— Design-Claude, 2026-06-07
