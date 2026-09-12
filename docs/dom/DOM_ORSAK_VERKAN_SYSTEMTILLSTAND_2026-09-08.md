# DOM (SCOPING) — orsak/verkan, den verkliga resten: systemtillstånds-VARFÖR

**Datum:** 2026-09-08 · **Av:** Opus · **Typ:** scopingdom · **Grund:** `orsakVerkanService.ts` (kodläst), `DOM_ORSAK_VERKAN_SCOPING_2026-09-01`, `MIGRATIONSPLAN_HANDELSELIGGAREN_2026-09-01`, raden `sluttest-audit-orsak-verkan` (Jacobs rättelse 2026-09-07: "Opus ville vifta bort en av projektets STARKASTE signaler — INTE avförd"). Denna dom viftar inte bort — den hittar vad som är byggt och specar det som verkligen återstår.

## Vad som redan ÄR byggt (raden säger "EJ PÅBÖRJAD" — fel)

Besluts-orsak/verkan är byggd och konsumerad:
- Scoping-domen finns sedan 2026-09-01 (`DOM_ORSAK_VERKAN_SCOPING`) — den "byggbara spec" raden ber Opus skriva EXISTERAR.
- Fas 1: `captureDecisionRipple` (orsakVerkanService.ts) diffar before/after vid beslutsresolution, bygger en liggarpost när ett andra-ordningens steg utlöses, trivial-brus-golvet hårt.
- Fas 4: `buildSystemRippleLedgerEntry` för de tre systemtriggarna (star_injured/big_derby_win/mecenat_left).
- Konsumenten sitter i Granska (`liggare-k4-orsak-verkan-yta`, 2026-09-03): "Det du valde i omgång N: …" + `describeRippleChainForGranska`.

Så raden är stale på "EJ PÅBÖRJAD" och på "Opus scoping-pass behövs" — bägge gjorda. Att stänga DEN halvan är inte att vifta bort signalen.

## Men signalen är bredare — den verkliga resten

Det byggda svarar på "ditt BESLUT satte igång de här spridningarna." Det svarar INTE på det GPT-testerna faktiskt återkommer till: **varför STYRELSEN tappade tålamodet över säsongen, varför EKONOMIN vände, varför en SPELARE vill bort** — VARFÖR för systemdrivna tillstånd spelaren inte direkt valde. Det är där felkänslan sitter i rapporterna (`minne-avsked-motsager-historik`: sparkad trots två slutspel, styrelsens missnöje "utan begriplig förklaring").

Delvis täckt: `boardTruth` (varför styrelsen sparkade) finns — men bara vid Game Over, som en terminal dom, inte som ett synligt VARFÖR medan tålamodet sjunker under säsongen. Ekonomins vändning och spelare-vill-bort har ingen VARFÖR-yta alls.

## Leveransen, definierad — systemtillstånds-VARFÖR

Gör de systemdrivna tillstånd testarna namnger begripliga MEDAN de utvecklas, spårade till sina orsaker — inte bara vid det terminala ögonblicket:
- **Styrelsens tålamod:** varför det sjunker (resultat under förväntan, ekonomi, brutna löften) synligt löpande, inte först på Game Over.
- **Ekonomins vändning:** varför kassan vände (publik, sponsor, löner, anläggning).
- **Spelare vill bort:** varför (speltid, moral, ambition, ett avslaget bud — k12 rör den sista).

Motorn finns delvis (`describeRippleChain`, `boardTruth`, orsaksraderna för consecutiveFailures/boardPatience/bankruptcy). Detta är att sträcka VARFÖR-synligheten från spelarbeslut till systemtillstånd, återanvända de orsaksrader som redan byggts.

## FORKEN (Jacob) — omfång

- **Smal:** bara styrelsens tålamod löpande (den starkaste klagomålet, `minne-avsked`), återanvänder `boardTruth`-orsakerna men surfar dem under säsongen i stället för vid Game Over.
- **Bred:** alla tre systemtillstånden (styrelse + ekonomi + spelare-vill-bort), var och en med sin VARFÖR-yta.

Opus rek: SMAL först — styrelsens tålamod löpande. Det är det entydigt starkaste klagomålet, orsakerna finns redan (boardTruth), och det är samma en-skiva-först-disciplin som påstående-kontraktet och B12. Ekonomi + spelare-vill-bort scopas separat efter att styrelse-VARFÖR landat. Var ytan sitter (Granska? Portal? styrelse-vyn?) är del av forken.

**→ JACOB/OPUS 2026-09-08: SMAL.** Jacob körde forken på Opus rek. Bygg bara styrelsens tålamod löpande — återanvänd `boardTruth`-orsakerna, surfa dem UNDER säsongen (inte först vid Game Over). Ekonomi + spelare-vill-bort är post-launch, egen scoping. Ytan: styrelse-/portal-vyn där tålamodet redan visas — Code väljer närmaste befintliga yta, ingen ny.

## Radreconciliation

`sluttest-audit-orsak-verkan`: besluts-orsak/verkan-halvan är byggd → den delen `stale`/klar. Raden reframas till systemtillstånds-resten (denna dom) i stället för att stängas helt — Jacobs 2026-09-07-rättelse gäller den bredare signalen, som fortfarande lever. Code/reconcile splittar raden: byggd besluts-del ut, systemtillstånds-VARFÖR-del kvar med denna dom som scope.

## ÄGARSKAP

Jacob: välj forken (smal/bred). Code (efter fork): sträck VARFÖR-ytan till valt systemtillstånd, återanvänd orsaksraderna, mät. Opus: denna scopingdom + ev. nya orsaks-etiketter om ett tillstånd rör fält motorn inte redan diffar. Inget byggs före forken.
