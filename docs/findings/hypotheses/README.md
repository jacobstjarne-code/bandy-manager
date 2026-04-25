# hypotheses — Öppna frågor

Hypotetiska facts som ännu inte är verifierade. Samma schema som
övriga facts, men `status: active` ersätts av `status: disputed`
eller ett eget hypotes-flöde.

**ID-namnrymd:** H001–H999 (separat från R/S/D/W)

**Livscykel:**
1. Skriv hypotesen med `status: active` och tydlig `claim`.
2. Lägg testkriterie i `notes:` — vad krävs för att verifiera?
3. När verifierad: flytta filen till rätt `facts/`-mapp, byt
   `category` och `fact_id` till rätt namnrymd, uppdatera `status`.
4. När motbevisad: sätt `status: deprecated`, behåll filen, notera
   vad som motbevisade den.

**Öppen fråga (SCHEMA.md punkt 4):** Ska H-facts ha egna fält som
`predicted_value` och `test_method`? Avvaktar tills första
hypotesen skrivs — lös in situ och uppdatera SCHEMA.md.

**Avgränsning mot findings:** En finding är en avslutad analys.
En hypotes är en öppen fråga. Om du skriver ner något du *tror*
men inte bevisat — det är en hypotes, inte en finding.
