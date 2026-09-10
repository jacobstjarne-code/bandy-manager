# HANDOFF — Klubbminnet som säsongsliggare (protokollblock)

**Från:** Design
**Till:** Code (implementerar), Jacob (godkänner)
**Pairas med mock:** `Klubbminnet-protokollblock.dc.html`
**Rör:** Klubb → Minne-fliken. Enbart **säsongssektionernas form** byts. Innehåll, datalogik, legender, blodslinje och rekord är oförändrade.

---

## 0 · TL;DR

Minne-fliken byter form, inte innehåll. Varje säsong blir en **sida i ett 70-tals protokollblock**:

- **Perforeringsräls** i marginalen (hålslag längs vänsterkanten + streckad rivlinje).
- **Georgia-datum** per post (dag + månad), inte omg-taggar i brödtexten.
- **Kopparprick** på rälsen där en post är kind = Triumf/guld.
- **Ortens minne** överst på varje sida — säsongens post med högst `significance`, satt som liggarens rubrik i stor Georgia.

Satt på **ljust papper** (`--bg` / `--bg-surface`) — liggaren *är* papper. Se öppen fråga A.1.

Följer designsystemets Princip 3: *70-talsliggare, inte 1800-talssigill.* Kommunalhusets protokollblock, perforering i marginalen, offset-tryck — inte pergament eller lacksigill.

---

## 1 · De två axlarna

All klassificering bärs av två ortogonala axlar. Nyckel visas överst i fliken (semantisk färg kräver nyckel, DS-regel 13).

### Familj — kategoristämpel (VAD)

Emoji som stämpel framför posttexten. Fem familjer, stängd uppsättning:

| Stämpel | Familj |
|---|---|
| ⚔️ | Match |
| 🏟️ | Anläggning |
| 👤 | Personer |
| 🤝 | Relationer & pengar |
| 📋 | Beslut & epok |

(Emoji = domänkategori på översiktsyta — tillåtet per emoji-regeln. Inga nya emoji uppfinns.)

### Kind — färgaxel (TON)

Färg på postens vänsterstripe + rubrikton. Fyra kinds:

| Kind | Token | Betydelse |
|---|---|---|
| Triumf | `--accent` (koppar) | seger, guld, milstolpe → får **kopparprick** på rälsen |
| Ärr | `--danger` | förlust, skada, det som gör ont |
| Laddat | `--warm` | spänning, politik, pengar i kläm |
| Noterat | `--text-muted` | neutral notering, faktum |

Familj och kind är oberoende: en `⚔️ match` kan vara Triumf *eller* Ärr; ett `📋 beslut` kan vara Laddat *eller* Noterat.

---

## 2 · Protokollblockets anatomi (per säsong)

```
┌─ perf ─┬──────────────────────────────────────────┐
│  ◦     │  Säsong 3  2026/27      SILVER · 2:A      │  ← lhead: titel + placering + era
│  ◦     ├──────────────────────────────────────────┤
│  ◦     │ ⚔️ ORTENS MINNE          21 mars · omg 22 │  ← hero: säsongens högsta significance
│  ◦     │ SM-final mot Skutskär, 2–3. …            │     (stor Georgia, kind-färgad stripe)
│  ●◦    │ 11 · OKT │⚔️ Derby 4–1. Gagnef knäckta …  │  ← ● kopparprick (Triumf)
│  ◦     │  8 · NOV │🤝 Mecenat Sjögren dubblar …    │
│  ◦     │  6 · DEC │👤 Henrikssons proffsdebut. …   │
└────────┴──────────────────────────────────────────┘
```

- **Perforeringsräls:** absolut vänsterremsa, hålslag via `radial-gradient` med mjuk skugg-ring, streckad `--border-dark` rivlinje till höger.
- **Ortens minne (hero):** en per säsong = posten med högst `significance`. Rubrik i Georgia 15–16px, familjestämpel + datum i eyebrow, kind-färgad vänsterstripe. Kopparprick om hero är Triumf.
- **Post-rad:** grid `[38px datum | 1fr text]`. Datum = Georgia dag + versal månad. Texten inleds av familjestämpeln inline; kind-färgen ligger som 3px vänsterstripe. **Ingen** versal kind-etikett och **ingen** omg-tagg i raden — stripen + datumet räcker (avlastning efter granskning).
- **Kopparprick:** 9–11px fylld `--accent`-cirkel på rälsen, i höjd med Triumf-poster.

### Liggaren läses uppåt

Säsongerna staplas nyast överst; hela liggaren läses uppåt genom tiden (S1 i botten → nu i toppen). Markerat med `↑ läses uppåt` i sidhuvudet.

---

## 3 · Vad som är kvar (oförändrat innehåll)

Under säsongssidorna, satt på samma papper men i egna block:

- **Blodslinjen** — härstamningskedja (t.ex. målvaktsledet Ekström → Holmberg → Sjödin) med prick-och-linje-räls och *fostrade*-relationer i kursiv.
- **Klubbens legender** (⭐) — pensionerade nyckelspelare med meta, statistik och en Georgia-kursiv minnesrad.
- **Klubbens rekord** (📊) — 2×2-grid; bästa värden får kopparton (`.rec.gold`).

Ingen datalogik rörs här — bara paper-tokens i stället för de tidigare portal-mörka.

---

## 4 · Öppen fråga — A.1 (ej design, till Code)

Renderas Minne i **ljus Klubb-kontext** eller **mörk portal**? Mocken väljer ljust papper för att passa protokoll-metaforen. En mörk variant är en ren tokens-flip (`--bg-surface`/`--text-primary` → `--bg-portal-surface`/`--text-light`) — samma struktur, inga markup-ändringar. Bekräfta kontext innan implementation.

---

## 5 · Implementationsspår

- Återanvänd severity→kind-mappningen från audit-handoffen (`club-memory.css`): `scar`→Ärr, `legendary`/medalj→Triumf, `derby`/politik→Laddat, default→Noterat. Byt namn på klasserna till `k-triumf / k-arr / k-laddat / k-noterat` eller behåll — bara kartan mot `MemoryEventType` är det som spelar roll.
- **Familj** är ny klassificering ovanpå kind: mappa `MemoryEventType` → en av fem familjer för stämpeln. (Kartan är triviala om/else; levereras med copy.)
- **Ortens minne** = `max(events, by significance)` per säsong. Redan beräkningsbart ur befintlig `getClubMemory()`.
- Perforering, kopparprick och rälsen är ren CSS — inga nya komponenter, ingen ny data.

---

— Design
