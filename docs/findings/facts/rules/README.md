# facts/rules — Bandyregler

Facts i denna mapp beskriver regler fastställda av Svenska Bandyförbundet
eller internationellt organ (FIB). De är inte designval — de är sanningar
utifrån.

**ID-namnrymd:** R001–R999

**Källtyp:** alltid `rulebook`. Om regeln är tolkad eller anpassad
för spelet, lägg det under `notes:` och sätt `source.type: design_decision`
istället — det är då ett D-fact, inte ett R-fact.

**Invarianter:** R-facts lämpar sig för code-cross-reference-invarianter
(`no_code_path_grants_3_points_for_win`). Dessa är ännu inte exekverade
automatiskt — se SCHEMA.md öppna frågor, punkt 2.

**Avgränsning mot D-facts:** En regel som *finns i regelverket* är ett
R-fact. En regel som vi *valt att tolka eller förenkla* för spelets skull
är ett D-fact med `source.type: design_decision`.
