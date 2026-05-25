# HANDOFF — C-K1 Landslagsuttagning

**Från:** Design-Claude
**Datum:** 2026-05-23
**Mock:** `docs/mockups/2026-05-23_design_landslag.html`

## TL;DR

Landslag finns inte idag. När en bruksortsspelare blir uttagen är det säsongens guldkorn — spelet missar det. Fyra UI-moment: Modal vid uttagning, Sekundär under frånvaro, Retur-scen med synlig boost, Icke-uttagen-scen med synlig träff.

## Komponenter

- **UttagningsModal** — 1× per säsong, VM-fönstret sent januari (se Timing nedan)
- **LandslagsFrånvaroSecondary** — under uppehållet (1 omg, inte 3)
- **LandslagsReturScen** — kafferum + form +4 / mood +6 (synligt)
- **IckeUttagenScen** — kandidat förbigås, form −3 / mood −5 (synligt)
- **MemoryEvent** sig 60 för första-gång-uttagning per spelare

## Timing — VM-fönstret (LÅST Jacob 2026-05-23)

VM ligger **sent januari**, mitt i grundserien (runt R14–R15 i
`scheduleGenerator.ts`, `ROUND_WINDOWS`: R14 = Jan 14–22, R15 = Jan 19–27).
Detta är realistiskt (riktiga bandy-VM är sent jan) och avsättningen mitt i en
tät serieperiod är själva poängen.

**Ett uppehåll på ~en vecka. Serien går vidare** — den pausas INTE. De uttagna
spelarna missar den serieomgång som krockar med VM. Det är truppfrånvarons hela
poäng: du tappar dina bästa i en omgång medan VM pågår, inte under ett dött
uppehåll.

**KALENDER-ÄNDRING (hör till C-K1:s datalager):** den befintliga
`isLandslagsuppehall`-flaggan sitter hårdkodad på `round === 7` (nov/dec, ~10
dagar) i `scheduleGenerator.ts`. Den ska **flyttas till R14 (el. R15) och kortas
till ~7 dagar**. Serien skjuts INTE framåt — uppehållet är bara frånvaro-fönstret
för de uttagna; övriga spelar omgången som vanligt. Verifiera mot säsongens
hårda deadline (R22 ≤ 1 mars) att inget skjuts över.

**Rapportering — lätt och synlig:** vid uttagning en kort notis ("Salonen och
Holmqvist uttagna till VM"). Vid retur, om VM-guld: "Grattis till VM-guldet". Inga
tunga scener för själva uttagningen — modal + notis räcker. Retur-scenen (kafferum,
synlig boost) är där tyngden ligger.

## Datakrav

- `Player.nationalTeamCallups: number`
- `Player.lastNationalTeamCallup?: number`
- `game.activeNationalTeamCamp?: { startRound, endRound, playerIds }`
- `game.lastNationalSnub?: { playerId, season, round }`

## Uttagnings-logik

`selectNationalTeam(game)`: topp-20/position × CA × form, tabelltopp-boost, 1-2 udda val, 3-5 spelare totalt.

## Designval LÅSTA av Jacob 2026-05-23

| Q | Beslut |
|---|---|
| Q1 uttagningsfrekvens | **VM-fönstret, sent januari, 1× per säsong** (det finns inget EM i bandy). Ett uppehåll på ~en vecka, serien går vidare, uttagna missar den krockande omgången. Kalender-ändring krävs (flytta `isLandslagsuppehall` från R7 till R14). Se Timing-sektionen. |
| Q2 spelarens inflytande | **Lobby/tjat byggs i v1.** Spelare som tjatar sig till uttagning eller surar över att bli förbigångna är friktionen som ger spåret liv. Inte spår 2. |
| Q3 ekonomi-bonus | Föreslag: +5 tkr/uttagen, synligt narrativt. Bekräfta. |
| Q4 visa hela landslagstruppen | Föreslag: bara dina i Portal, andra i Inbox. Bekräfta. |

## Designval öppna

Två nya komponenter att täcka in i v1 (Q2):
- **LobbyPress-decision** — spelare som vill tjata till uttagning genererar en weekly-decision-typ ("Henriksson ber dig prata med Anders Wikström") som spelaren kan ta eller neka. Påverkar uttagningschans.
- **IckeUttagenSurScen** — redan i mocken (spalt 04). Konsekvensen är synlig form/mood-träff. Tjänar samtidigt v1 av "sura sig"-flow.

## Princip-koppling (Jacob 2026-05-23)

Alla effekter synliga. Form-träff vid icke-uttagen visas i player-card med text ("snubblade förbi"). Inga dolda straff. Konsekvent.

## Estimat

~6h Code + ~30 Opus-strängar. Återanvänder PhaseMark-anatomi (gold-tonad), SyncDecisionBudget för modal-timing.

— Design-Claude, 2026-05-23
