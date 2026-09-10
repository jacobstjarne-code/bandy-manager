# HANDOFF — Polish 2/5: Portalhierarki

**Från:** Design
**Till:** Code
**Pairas med mock:** `Polish-portalhierarki.dc.html`
**Grundfynd:** Grind 3 — Portalen översköljs (uppskjuten beslutskö växte till 44)
**Rör:** Portal-stackens vikt. **Ingen ny komponent, ingen ny mekanik** — bara viktstege.

---

## 0 · TL;DR

Portalen läses som en vägg när allt talar samtidigt. Polishen ändrar ingen komponent, bara **vikten mellan dem**: en tydlig stege från högst röst till tystast, så ögat landar på primärkortet först och resten recederar i ordning. Samma byggblock som README:s Portal-sektion (PortalBeat → Situation → Primary → Story → Secondary → Inkorg) — nu med explicit hierarki.

---

## 1 · Viktstegen

| Tier | Byggblock | Behandling | Röst |
|---|---|---|---|
| **T0** | PortalBeat + Situation | Kursiv, ingen ram, `--bg-portal-surface`. Ambient. | Tystast (sätter dagen) |
| **T1** | Primary-card | Gradient-fyllning, kopparbård, 22px Georgia-titel, **enda CTA**. | Högst — exakt en |
| **T2** | Story-slot | Färgstripe (`--warm`/`--cold`), tint-glow, **ingen CTA**. | Andra rösten — max en |
| **T3** | Secondaries | Uniforma: 2px stripe, samma form, `--bg-portal-surface`. | Recederar som grupp |
| **T4** | Inkorgs-rad | Dimmad footer, streckad topp. | Tystast (väg vidare, inte innehåll) |

---

## 2 · Reglerna som håller hierarkin

- **En primär per skärm** (DS §5): T1 är enda ytan med gradient + kopparbård + CTA. Kopplar till Taktik/beslutskort-domen — samma regel.
- **Story-slot är andra rösten, inte andra knappen**: färgstripe men aldrig CTA. Om story vill driva handling → den blir T1 den omgången, inte en andra knapp.
- **Secondaries delar exakt en form**: de tävlar inte inbördes eller med T1. Stripe-färgen kodar typ (`--accent` neutral · `--warm` varm · `--cold`/`--ice` kall), inte prioritet.
- **Inkorgen recederar**: notiskön syns som en dämpad rad, inte som staplade kort. Det är så överbelästningen släpps — kön blir en väg, inte en vägg.

---

## 3 · Token-noter (viktigt — undvik mina misstag)

- Story-slot / varm-ton: **`--warm`** (#8c6e3a "varm guld"). Det finns **inget** `--gold`-token.
- Kall-ton label: **`--ice`** (#7EB3D4) för läsbarhet på mörk botten; `--cold` (#4a6680) för stripen.
- Ljusare etikett-varianter: `color-mix(in srgb, var(--warm) 52%, var(--text-light))` — inga påhittade `-light`-tokens.
- Portal-bakgrunder: `--bg-portal` / `--bg-portal-surface` / `--bg-portal-elevated`, tonade per säsongsfas av `PortalScreen`.

---

## 4 · Frusna parametrar (mock)

November · routine primary · ingen signatur · journalist-relation neutral. **Variation:** byt primary → derby/deadline/smfinal skiftar T1-accentfärgen, inte hierarkin; aktivera signatur → PortalBeat byter copy + stripe; byt månad → bakgrunden tonar. Hierarkin (T0–T4) är konstant över alla kombinationer.

---

## 5 · Implementation

- Ingen ny komponent. Sätt tier-klasser på befintliga Portal-block; skillnaden är CSS-vikt (storlek, kontrast, stripe, CTA-närvaro).
- Enforce: högst en `.portal-primary` (T1) och högst en `.portal-story` (T2) renderas per omgång. Överskott degraderas till T3 eller inkorg.
- Inkorgen renderas som en rad, inte staplade kort, när kön > N.
- Estimat: ~1h (klasser + enforcering av T1/T2-unikhet).

---

— Design
