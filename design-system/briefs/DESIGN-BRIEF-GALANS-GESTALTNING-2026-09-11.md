# DESIGN-BRIEF — Galans gestaltning

**Datum:** 2026-09-11
**Ägare:** Design (mock) → Opus (copy) → Code (wiring)
**Grund:** nykarriärprovets Spår B ("galan kändes tunn som enbart textval") + `DOM_GRIND2_ATERPROV_2026-09-11`. Post-launch, inte release-blockerande — den sista designbiten innan grinden är helt stängd.

## Problemet

Bandygalan är i dag ett naket textval vid säsongsskiftet. Den löser sig tekniskt en gång (det är verifierat och rätt), men den bär ingen vikt. Ett säsongsslut förtjänar en scen, inte en meny. Att ett event slutar upprepas och samtidigt förblir tamt är exakt regressionen Spår B fångade.

## Vad briefen INTE är

Inga nya belöningar, ingen balansändring, ingen ny mekanik. Samma event, samma val, samma resolution. Det här är gestaltning — att iscensätta det befintliga galaögonblicket som en scen. Domen och åtgärdspasset är båda hårda på den gränsen.

## Scenen — tre beats (förspel → val → landning)

Ceremoni-registret, samma familj som brytpunkts-scenen och SM-final-skarven: Georgia, guld som ACCENT (aldrig en andra fylld yta, per gold-disciplinen), lädertextur, dämpat. Inte Portalens vardagston.

1. **Förspel.** Rummet innan valet: en blygsam sal, säsongens namn läses upp, lokaltidnings-/bygden-rösten. Kort, ingen mekanik — bara att spelaren *anländer* till ett ögonblick.
2. **Val.** Det befintliga galavalet, men ramat med vikt: vad valet säger om managern och klubben (nåd, ambition, lojalitet), knutet till säsongens berättelse. Samma val som i dag, iscensatt.
3. **Landning.** Rummets reaktion + en rad som landar säsongen, och som ytas i liggaren/årsboken som ett minne (Klubbminnes-logiken). Landningen är det som gör scenen minnesvärd i stället för avklarad.

## Dynamisk vikt — galan läser olika efter säsong

Ögonblicket ska inte vara samma varje år. Förspelets och landningens ton skiftar med säsongens utfall, läst ur state (samma princip som säsongslandningarna och styrelsemötets N-tillstånd):

- **Triumfår** (guld, dubbel): galan bär stolthet, rummet är med dig.
- **Mellanår:** artig, avmätt, en säsong som passerade.
- **Kris-/avskedsår:** galan blir bittersöt — du är där men rummet vet.

Ett triumfvals landning och ett avskedsårs landning får aldrig läsa lika. Det är vad som gör galan till en scen i en karriär, inte en årlig knapp.

## Ägare

- **Design:** scenens form i mock — de tre beatsen i ceremoni-registret, hur guld-accenten sitter, övergångarna (SceneSeam finns redan).
- **Opus:** all svensk copy — förspel/val/landning per säsongston (triumf/mellan/kris), i galans register.
- **Code:** bekräftar det befintliga `event_gala_*`-eventets data, val och state-krokar (säsongsutfall) INNAN wiring — scenen byggs på det verkliga eventet, inget hittas på. Ingen belöning eller balans rörs.

## Gräns

Post-launch. Ändrar inget kalibrerings- eller belöningsvärde. Ren gestaltning av ett ögonblick som redan finns.
