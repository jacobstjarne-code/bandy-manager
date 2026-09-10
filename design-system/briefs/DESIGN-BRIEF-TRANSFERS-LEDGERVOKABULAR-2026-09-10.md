# DESIGN-BRIEF — Transfers: liggarvokabulär i bud- och förlängningsmodalerna

**Datum:** 2026-09-10
**Ägare:** Design (mock) → Opus (copy) → Code (wiring)
**Rad:** `transfers-modaler-ledgervokabular` (MASTER_OPPET)
**Beslut:** Jacob 2026-09-10 — "överväger att bygga, skriv spec till design". Kodläst `BidModal.tsx` och `RenewContractModal.tsx`.

## Problemet

Båda modalerna är rent transaktionella. BidModal visar budsumma, erbjuden lön, kontraktslängd, kontraktstermer och en rivalitetsvarning. RenewContractModal visar nuvarande lön/kontrakt, ny lön, antal år och termer. Ingen av dem rör liggaren eller minnet som nu definierar spelet. Att lägga bud på klackens favorit, värva tillbaka en akademiprodukt eller förlänga en som bär en `transfer_story` läser exakt som att köpa en anonym mittfältare. Siffrorna finns, vikten saknas.

## Vad briefen inte är

Ingen ny mekanik, ingen ny skärm, inga fält som ändrar affären. Transaktionen är oförändrad. Det här är en yta — en rad, en stämpel, en ton — som ytar det spelaren redan vet om personen i själva beslutsögonblicket. Samma princip som Klubbminnet: rå sanning i liggaren, all mening i ytan.

## Signalerna (finns redan i state, per spelare)

Design ritar mot dessa. Code bekräftar den exakta uppslagsvägen före wiring (sannolikt en per-spelare-filtrering av `eventLedger` plus `supporterGroup.favoritePlayerId` plus akademiflagga). Kandidater i fallande tyngd:

- **Klackens favorit** — `supporterGroup.favoritePlayerId`. Den enskilt starkaste. Att sälja eller förlänga honom är inte en transaktion, det är ett besked till läktaren.
- **Bär en `transfer_story`** — hur spelaren kom till klubben (liggarens `transfer_signed`/`transfer_story`). Att återförlänga någon med en ankomstberättelse stänger en båge.
- **Akademiprodukt / hemmaodlad** — kom via akademin (`academy_promotion`). "Din egen" väger annorlunda än en inköpt.
- **Milstolpe- eller legendspår** — `player_milestone`, landslagsuttagning, kaptensroll. Bär en historik i klubben.

Ingen signal = ingen rad. En anonym spelare ska läsa som idag, rent transaktionellt. Vikten fabriceras aldrig.

## Var det ytar

- **RenewContractModal** (starkast case): en tyst minnesrad under "Nuvarande"-boxen — vad ni delat, inte bara vad kontraktet kostar. En förlängning är ett löfte om fler år; ytan bär det när personen betyder något.
- **BidModal, friagent-/förlängningsläge på en egen tidigare spelare:** samma rad när den värvade bär ett minne (en återvändare).
- **BidModal, bud på annan klubbs spelare:** svagast — minnet är oftast tunt, han är inte er ännu. Håll det till en klack-/rivalitetston om han är någons favorit, annars ingen rad.

## Vad Design bestämmer i mocken

1. Formen: en tyst kursiv rad, en kategoristämpel (samma familjespråk som Klubbminnet, ⚔️/👤/🤝), eller ett kopparprick-eko för de tyngsta minnena. Rekommendation: en rad, inte en badge-svärm — modalen är liten (maxWidth 430).
2. Placeringen per modal. Under info-boxen känns rätt, men det är din.
3. Registret på copyn. Opus skriver den faktiska svenskan efter att formen är låst; mocken behöver bara platshållartext som visar tonen.

## Efter mocken

Opus granskar mot briefen och skriver copy-registret (svensk text per signaltyp). Code bekräftar uppslagsvägen och wirar. Ingen baseline rörs förrän formen är dömd.
