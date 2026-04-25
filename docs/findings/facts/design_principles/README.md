# facts/design_principles — Spelets designval

Facts i denna mapp är Jacobs (eller Eriks) medvetna val om hur spelet
ska fungera — ekonomiska parametrar, spelmekanik, balansbeslut.

**ID-namnrymd:** D001–D999

**Källtyp:** `design_decision`. Ange alltid `decided_by`. Om beslutet
dokumenterats i en kodfil, lägg sökvägen i `source.doc`.

**Relation till DECISIONS.md:** `docs/DECISIONS.md` dokumenterar
*varför* ett beslut togs och vilka alternativ övervägdes. Ett D-fact
dokumenterar *vad* som gäller just nu. De är komplement — ett D-fact
utan bakgrund i DECISIONS.md är svagare; ett DECISIONS-entry utan
motsvarande D-fact är svårare att slå upp automatiskt.

**Avgränsning mot R-facts:** R-facts är regler vi inte äger.
D-facts är regler vi äger och kan ändra. Vid osäkerhet: om beslutet
krävde ett samtal med Jacob är det ett D-fact.

**Invarianter:** D-facts med numeriska värden ska ha bounds-invarianter
som skyddar mot oavsiktliga magnitude-regressioner. Exempel:
`value[0] > 0`, `value < 10000`.
