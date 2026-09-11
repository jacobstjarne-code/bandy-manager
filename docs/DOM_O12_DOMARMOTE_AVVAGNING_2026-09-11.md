# DOM — O12 domarmötets avvägning

**Status:** ratificerad av Jacob 2026-09-11.

Domarmötet ska vara ett verkligt val mellan två relationer, inte tre steg på samma skala:

- `respect`: domarrelation `+1`, klackens stämning `−2`.
- `neutral`: ingen state-effekt.
- `protest`: domarrelation `−1`, klackens stämning `+2`.

Klackens stämning är det befintliga canonical-fältet `supporterGroup.mood`. `fanMood` används inte som ersättning och inget nytt relationsfält införs. Båda deltan appliceras genom den gemensamma `multiEffect`-motorn och O12:s efterkvitto ska visa de faktiskt applicerade, clampade utfallen.

Förhandstexterna är låsta ordagrant:

- Respektera: “Du skakar hand. Klacken buar.”
- Neutral: “Du rycker på axlarna och går.”
- Protestera: “Du säger vad du tycker. Domaren minns namn.”

Domarmötets befintliga trigger, utgångspolicy, domarhistorik, tröskelkorsningar och liggarposter ändras inte.
