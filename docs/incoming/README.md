# docs/incoming — rå drop-zon

Jacob släpper nedladdade Design-artefakter (mockar, briefer, analyser) här **rått**. Syftet är att download-cruft inte ska läcka in i de kurerade katalogerna (det har hänt: `(1)`-dubbletter, mellanslagsnamn, orelaterade data-filer).

**Inget stannar här.** Code triagerar varje drop till dess riktiga hem **samma session** och tar bort cruft. incoming/ ska alltid vara tom mellan sessioner — är den inte det är triagen inte gjord.

## Triage-regler

| Typ | Hem |
|---|---|
| Mockar (`*_design_*.html`) | `docs/mockups/` |
| Beställningsbriefer (`BESTALLNINGSBRIEF*`) | `docs/mockups/` |
| Design-briefer (spec → mock) | `design-system/briefs/` |
| Analyser / flödesgenomgångar | `docs/` |
| Bild-assets | `public/assets/illustrations/` — **ALDRIG `src/`** |
| Cruft: download-dubbletter `(1)`, mellanslagsnamn, orelaterade data-filer | ta bort, committa inte |

Vid namn-/sökvägs-tvekan: fråga, gissa inte.
