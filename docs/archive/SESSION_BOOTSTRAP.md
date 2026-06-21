# SESSION BOOTSTRAP — Klistras in vid varje ny Opus-session

**Syfte:** Ge ny Opus all kontext på 30 sekunder, så du slipper börja om varje gång.

**Användning:** Klistra in innehållet nedan som första meddelande i ny chat. Opus läser, bekräftar, och du kan börja jobba.

---

## KOPIERA ALLT NEDANFÖR DENNA RAD

---

Innan du svarar något: läs dessa filer i ordning från `/Users/jacobstjarne/Desktop/code_projects/bandy-manager/`.

**Kärnkontext (alltid):**
1. `CLAUDE.md` — designprinciper, samarbetsregler, INGA FEATURE FLAGS, mock-driven design
2. `docs/KVAR.md` — vad som är aktivt just nu, parkerat, väntande
3. Senaste `docs/HANDOVER_*.md` — sortera filnamn fallande, läs den nyaste (just nu: `HANDOVER_2026-04-30b.md`)
4. `docs/DECISIONS.md` — arkitekturbeslut (skumma de 3 senaste posts)
5. `docs/LESSONS.md` — buggmönster

**Vid spec-arbete eller kod-frågor (om relevant):**
6. `docs/SPEC_BESLUTSEKONOMI.md` + `_STEG_2.md` + `_STEG_3.md` — pågående arbete
7. `docs/CODE_REVIEW_2026-04-30.md` — pågående buggfixar
8. Aktuell sprint-fil i `docs/sprints/`
9. `docs/THE_BOMB_V2_2026-04-27.md` — vision

**Vid visuellt arbete:**
10. `docs/DESIGN_SYSTEM.md`
11. `docs/mockups/` — relevant mock om existerande

**Vid namn/ton/text-arbete:**
12. `docs/KLUBBFAKTA.md` — single source of truth för klubbar
13. `docs/textgranskning/` — etablerade ton-exempel

---

**Bekräfta sen genom att svara med exakt detta format, inget mer:**

```
Läst. Datum: <fyll i från web_search per CLAUDE.md>.
Mitt-i: <vad är pågående arbete just nu, en mening>
Nästa: <vad väntar härnäst, en mening>
Spelets själ: <en mening om vad som skiljer Bandy Manager från andra spel>
Redo.
```

Skriv inget mer förrän jag säger något. Inga sammanfattningar av handovers. Inga frågor om vad jag vill jobba med. Inga "låt mig hjälpa dig"-fraser. Bara bekräftelsen ovan.

---

## KOPIERA ALLT OVANFÖR DENNA RAD

---

## NÄR DU UPPDATERAR DENNA FIL

Två saker som ska underhållas:

1. **Filnamnet på senaste HANDOVER** i punkt 3 ovan. Uppdatera när du skriver ny HANDOVER vid sessionsslut.
2. **Aktuella spec-filnamn** i punkterna 6-7 om de byter namn eller om något arbete avslutats.

Resten är stabilt.

---

## VARFÖR FORMATET ÄR SÅ STRIKT

Ny Opus tenderar att antingen (a) hoppa direkt in och börja gissa, eller (b) skriva en lång sammanfattning av vad hen läst. Båda är slöseri med kvot. Det strikta bekräftelseformatet tvingar fram att hen *faktiskt* internaliserat de tre sakerna som spelar roll: var vi är, vad som väntar, vad spelets själ är.

Om Opus svarar med något annat än formatet — säg "läs igen, svara enligt formatet". Det är OK att vara skarp.
