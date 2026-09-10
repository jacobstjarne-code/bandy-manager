# HANDOFF — Transfers: liggarvokabulär i beslutsögonblicket

**Från:** Design
**Till:** Opus (skriver strängpoolerna), Code (wirar mot befintliga proxies)
**Pairas med mock:** `Transfers-liggarvokabular.dc.html`
**Kodgrundad mot:** `AUDIT-VISKONSEKVENS-DEL9-TRANSFERS`, `SPEC-SVAR-TRANSFER-RESPONSE-2026-05-20`
**Rör:** `BidModal` (Lägg bud) + kontraktsmodalen (Förläng). **Ingen ny mekanik** — bara minnet ytat.

---

## 0 · TL;DR

Klubbminnets **liggarvokabulär** (perforeringsräls, Georgia, daterade attribuerade rader) flyttar in i de två transfer-modalerna som en **spelarens liggare**. När du lägger bud eller förlänger ser du människan i liggaren, inte bara siffrorna — och du förstår sannolika svaret *innan* du binder budget.

Proxierna finns redan (SPEC-SVAR §7). Det nya är **formen**, inte datan.

---

## 1 · Spelarens liggare — proxy → rad

Tre rader max, varje rad = en familjestämpel (Klubbminnets fem) + kort mening + kursiv mono-källa (varför spelet vet det).

| Proxy (finns i koden) | Familj | Exempelrad (Opus copy) |
|---|---|---|
| `seasonsAtClub >= 3` | 🏟️ | "Sju säsonger i klubben. Har ratat två bud förr." |
| `birthRegion === club.region` | 👤 | "Uppvuxen i Värmland — samma bygd som klubben." |
| `dayJobIsLocal` | 🤝 | "Kör grävmaskin åt kommunen på vardagarna." |
| `blodslinje`-koppling (`getClubMemory`) | 👤 | "214 matcher. Fostrad av Ekström, fostrar Sjödin." |
| `significance`-topp (Triumf) | ⚔️ | "Nollade Skutskär i SM-finalen." → **kopparprick** |
| `transferPersonality: homebound` | 🤝 | "Aldrig krävt mer än laget tålde." |

**Kopparprick** på liggarraden bara när raden refererar en Triumf/guld — samma regel som Klubbminnet. Rader väljs av vilka proxies som träffar; ordna tyngst först.

---

## 2 · Domslutet (verdict-raden)

En Georgia-kursiv rad under liggaren som sammanfattar lutningen. Två toner:

- **Emot affären** (köp av hemmakär): `--warm`-stripe. "Hemmakär. Tre skäl att stanna, noll att flytta."
- **För affären** (förläng lojal egen): `--success`-stripe. "Vill stanna. Elva år i tröjan."

Copy ur Opus vägran-/godkänn-pooler. **Inga numeriska deltan** (SPEC §5b) — lutning i ord, inte siffror.

---

## 3 · Rivalvarning — i beslutsögonblicket, inte efteråt (SPEC §5c)

`getRivalry(ownClub, sellerClub)` träffar → tonad strip **ovanför CTA:n**, inte i Portal efteråt:

> ⚠️ **Slottsbron är vår rival.** "Slaget om Värmland." Klacken kommer inte att gilla det här.

- Diegetisk ⚠️ (officiell rivalry-flagga), inte chrome-emoji.
- Tonad strip (`--danger` 8% bg), **aldrig** röd banner. Bandysvensk understatement, ingen "VARNING".
- Bara på `BidModal` (köp). Kontraktsmodalen har ingen — egen spelare.
- Copy per rivalry ur Opus pool (§4), inte generisk.

---

## 4 · Opus-leverans — strängpooler (utökar SPEC §6)

- **Liggar-rader:** 3 per proxy-typ (seasonsAtClub / birthRegion / dayJob / blodslinje / significance / homebound) — korta, konkreta, mono-källan är kod-satt (inte copy).
- **Verdict emot** (köp hemmakär): 5 strängar.
- **Verdict för** (förläng lojal): 5 strängar.
- **Rivalvarning:** 3 per rivalry-intensitet (1–3), i kontext av varje derby-namn — inte generisk.
- Bandysvensk diction: ellipsis över utrop, konkret bild, ingen förklaring.

---

## 5 · Implementation (Code) — inga nya fält

- Bygg `buildPlayerLedger(player, contextClub)` → returnerar 1–3 `{familj, text, isTriumf}` ur befintliga proxies + `getClubMemory()`. Ingen ny state.
- `BidModal`: lägg liggare + verdict ovanför formfälten; rivalvarning-strip ovanför CTA (`getRivalry` styr synlighet). En `.btn-primary`.
- Kontraktsmodalen: samma liggare + verdict (grön ton), ingen rivalvarning, roll-segment (Lagkapten/Spelare). En `.btn-primary`.
- Tal-konvention (DS §11): bud/värde i hela tkr · lön tkr/mån · längd i år-segment.
- Modaler centrerade, `rgba(0,0,0,0.6)` backdrop, ingen blur, max 380px (DS §8).

---

## 6 · Tråden till Klubbminnet

Petter Holmberg i kontraktsmodalen **är** samma målvakt som blodslinjen i minne-fliken (Ekström → Holmberg → Sjödin). Liggaren är *en* sanning ytad på två ställen — Klubbminnet läser den bakåt (historik), transfers läser den framåt (beslut). Samma `getClubMemory()`, samma vokabulär. Håll dem synkade: en ny liggarrad-typ i endera ytan ska funka i båda.

---

— Design
