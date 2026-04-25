# Sprint 25h Addendum — audit (Revision 2 + Småskandal)

## Punkter i spec

### Revision 2 (TEXT_SCANDAL_LAYER1_2026-04-25.md)
- [x] municipal_scandal tillagd som 7:e arketyp i ScandalType
- [x] municipal_scandal kan träffa managed club (includeManaged = true i pickAffectedClub)
- [x] variant: 'positive' | 'negative' på Scandal-interfacet — sätts vid trigger (50/50)
- [x] Positiv variant: +kommunBidrag*0.2 engångseffekt
- [x] Negativ variant: −kommunBidrag*0.3 engångseffekt
- [x] {POLITIKER} och {PARTI} löses via game.localPolitician (managed) eller POLITICIAN_PROFILES (AI)
- [x] fillTemplate utökat med {POLITIKER}/{PARTI} + dual-token-stöd ({KLUBB}/{club}, {ANDRA_KLUBB}/{secondaryClub})
- [x] sponsor_collapse: −30k engångs (var −400k)
- [x] coach_meltdown: revision 2-text med subtil ton och "assisterande tränare"
- [x] "assistenttränare" → "assisterande tränare" globalt i scandalService

### Addendum small_absurdity (SPEC_25H_ADDENDUM_SMASKANDAL.md)
- [x] small_absurdity tillagd som 8:e arketyp
- [x] Ingen inbox-item, ingen mekanisk effekt, omedelbar resolution
- [x] 6 absurditeter i src/domain/data/smallAbsurditiesData.ts med SmallAbsurdity-interface
- [x] Vikter uppdaterade för 8 arketyper (summa 100): municipal 21, small_absurdity 15, treasurer 15, sponsor 13, phantom 11, club_to_club 10, fundraiser 9, coach 6

## Avvikelser från spec

- **−3k/v sponsorIncome-reduktion**: Specen säger "−3k/v reduktion av sponsorIncome resterande säsong" utöver −30k engångs. Inte implementerat — ingen per-rund effektmekanism finns för AI-klubbars sponsorer. −30k engångs är implementerat. Kan läggas till senare via `activeScandal` med per-rund callback.
- **Media-integrering för small_absurdity**: Specen säger tidningsrubrik + kafferum via media-pipeline. Inte implementerat — `smallAbsurditiesData.ts` finns som datakälla, men mediaProcessor känner inte till den än. Data är klar; integrering är separat task.
- **positive municipal_scandal-text**: Spec nämner positiv variant men anger ingen färdig text för den. Implementerat med tre titlar + tre bodies genererade i revision 2-andan.

## Verifiering

```
npm run build → ✓ built in 10.95s
npm test      → 1895/1895 passed (24 scandal-tester varav 6 nya)
npm run stress -- --seeds=3 --seasons=2 → 0 kraschar, 0 invariantbrott
```

Test verifierar:
- "assisterande tränare" i coach_meltdown-body (case-insensitive)
- small_absurdity: 0 inbox-items, 0 finans-delta, 0 poängavdrag
- municipal_scandal negativ: finances < startfinances
- municipal_scandal positiv: finances > startfinances
- municipal_scandal kan träffa managed club

## Commit

`c1297a5` — feat: scandal lager 1 — revision 2 + småskandal-arketyp (addendum)
