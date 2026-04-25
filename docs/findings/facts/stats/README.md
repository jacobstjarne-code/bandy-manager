# facts/stats — Bandygrytan-fakta

Facts i denna mapp är statistiska påståenden räknade ur Bandygrytans
matchdata (2019-26, 1124+ matcher) eller ur stresstest-output.

**ID-namnrymd:** S001–S999

**Källtyp:** `dataset`. Ange alltid `match_count` och `seasons`.

**Precision:** Skriv värdet med den precision datakällan motiverar.
Undvik att runda mer än nödvändigt — hellre `78.1` än `78`.

**Stresstest-stats:** Om värdet kommer från motorns stresstest
(inte verklig data), sätt `source.name: stresstest` och ange
antal seeds + säsonger i `notes:`. Stresstest-fakta är motorhypoteser,
inte bandyrealitet.

**Avgränsning mot findings:** En finding är en *analys* av ett mönster.
Ett S-fact är ett *enskilt mätvärde* som analysen bygger på. Om
`001_halvtidsledning.md` citerar ett tal — det talet är ett S-fact.
