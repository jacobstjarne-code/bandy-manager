# Bandy Brain

Datadriven bandyanalys. Bandy Brain letar systematiskt efter mönster i Elitseriens verkliga matchdata — comeback-fönster, domarreformer, hemmaplansfördel, spelstil — och kompletterar med Bandy Managers simuleringsmotor där verklig data tar slut.

Sajten är ett proof of concept. Ingen finding är verifierad mot bandykunskap ännu; de är råmaterial för en bandykunnig att bedöma. Vilka är värda att gräva i, vilka är brus, vilka säger något vi inte visste?

## Data

Grunden är matchdata från [Bandygrytan](https://bandygrytan.se): Elitserien herr och dam, säsongerna 2019–20 till 2025–26 (2023–24 saknas i datasetet). Herrarnas grundserie omfattar 1 124 matcher med mål, minuter, hörnor, utvisningar och straffar. Simuleringsdata genereras av Bandy Managers matchmotor, som är kalibrerad mot samma dataset (se Finding 047–050 för kalibreringsarbetet).

En känd fallgrop i rådatan är minutkonventionen: mål i andra halvlek registreras som rådata-minut + 45, så "minut 96" betyder sex minuter in i andra halvlek — inte matchens slutskede. Flera tidiga findings feltolkade detta och har reviderats (se nedan).

## Findings

Varje finding är en hypotes som datan väckt, publicerad under `src/pages/findings/NNN/`. Strukturen är konsekvent: Frågan, Datan, Vad vi fann, Tolkning, Begränsningar, Vidare frågor, Källor.

Findings revideras när metoden förbättras. En ersatt finding tas inte bort utan får en supersession-markering som förklarar vad som föll, vad som står sig och vilken finding som ersätter den. Exempel: Finding 017, 041, 042 och 043 byggde på den feltolkade minutkonventionen och ersattes av Finding 051, som räknade om med halvleksflagga och uppdaterad baslinje. Att findings revideras är inte en svaghet i ansatsen — det är hur den ska fungera.

Null-resultat ("data saknas") behålls också som findings. Att veta var datan tar slut är en del av kartan.

## Facts

Findings refererar strukturerade facts — enskilda, verifierbara påståenden i YAML under `../docs/findings/facts/`, delade med Bandy Manager-repot som single source of truth. Kategorier:

- `R` — regler ur SvBF:s regelbok (`rules/`)
- `S` — statistiska parametrar kalibrerade mot Bandygrytan (`stats/`)
- `D` — designval i Bandy Manager (`design_principles/`)
- `W` — spelvärldens kanon (`world_canon/`)

Referenser i löptext skrivs `[S013]` och länkas automatiskt till factens detaljsida. Frågor som findings väcker sparas i `facts/questions/` och renderas som träd på `/tree/` — varje besvarad fråga pekar på den finding som besvarade den.

## Köra sajten

Byggd med [Astro](https://astro.build). Kräver att repot ligger bredvid `docs/` i bandy-manager-strukturen, eftersom facts och Bandygrytan-datan läses därifrån vid build.

```sh
npm install
npm run dev      # dev-server på localhost:4321
npm run build    # statisk build till ./dist/
```

`middleware.ts` innehåller Basic Auth för skyddad deploy.

## Status

Aktivt utvecklad. Senaste finding: 056 (dam/herr-strukturjämförelse). Feedback per finding går via GitHub-issues — tumme upp/ner-knapparna längst ner på varje finding-sida.
