# HANDOFF-BATCH-1 · Ändringar klara för implementation

**Status:** klara designbeslut, inte blockerade av FAS 1–6.
**Tid:** ~30–60 min arbete för Code.
**Mål:** få in de beslutade ändringarna i produktionskoden parallellt medan designsystemet arbetar vidare på ikonografi, karaktärer och klubbmärken.

---

## Så läser du detta dokument

Varje punkt har fyra delar:

1. **Vad** — konkret ändring
2. **Fil(er)** — var i produktionskoden
3. **Referens** — vilket preview-kort i designsystemet som visar det färdiga resultatet
4. **Acceptanskriterier** — hur vi vet att det är klart

För TODO-markeringarna: gör en enkel `grep` över kodbasen och stämpla kommentarer vid varje träff. Det gör att när vi senare levererar ikonerna/karaktärerna/klubbmärkena kan vi söka på `TODO(FAS N)` och hitta exakt var de ska in.

---

## DEL A · Konkreta designändringar (implementera nu)

### A1 · GameHeader redesign

**Vad:**
- Byt till 3-kolumns grid: `logo · klubbnamn · meta` (inte centrerad klump)
- Lyft subtext­färg från 55% vit till `#C9B89A` för läsbarhet på läderyta
- Georgia italic för undertexten (klubbens devis/krönika)
- Omgångsnumret som egen sigill-chip i meta-kolumnen (inte inklämd rad)
- Byt ut 🔔-emoji mot handritad SVG-kuvert-glyph i koppar, med separat notifikations­prick

**Fil(er):**
- `src/components/GameHeader.tsx` (eller motsv.)
- Ev. `src/components/HeaderNotification.tsx` för kuvert-SVG

**Referens:** `preview/components-header.html` i designsystemet

**Acceptanskriterier:**
- Header har tre tydliga kolumner, ingen central klump
- Undertext läsbar mot läder (`#C9B89A` eller ljusare)
- Kuvertet är SVG, inte emoji
- Notifikationsprick är en separat element som kan visas/döljas

---

### A2 · PhaseIndicator · stepper-logik

**Vad:**
- Tre states per steg: `done` (checkmark) → `current` (halo) → `upcoming` (tomt)
- Connectors (linjer mellan stegen) byter vikt baserat på vilket steg som är aktivt
- Endast aktivt steg i kopparfärg — inte alla tre samtidigt

**Fil(er):**
- `src/components/PhaseIndicator.tsx` (eller motsv.)

**Referens:** `preview/components-header.html` (nedre delen av kortet)

**Acceptanskriterier:**
- Varje steg renderar en av tre tydliga states
- Endast ett steg är koppar i taget
- Connector-vikten matchar stepper-logiken

---

### A3 · Logo-invertering på läderytor

**Vad:**
- Logon ska renderas i ljus/krämvit variant när den sitter på mörk läder­bakgrund
- Inte samma mörka logo som på papper

**Fil(er):**
- `src/assets/logo.svg` + ev. `src/assets/logo-inverted.svg`
- `src/components/Logo.tsx` — prop `variant: 'dark' | 'light'`

**Referens:** `preview/brand-logo.html`

**Acceptanskriterier:**
- Logon har två varianter (mörk/ljus)
- Komponenten väljer rätt variant baserat på bakgrunds­kontext

---

## DEL B · TODO-markeringar (skanna in i kodbasen nu)

Dessa är **inte** designändringar — de är kommentarer som markerar **var** framtida faser kommer att verka. När vi levererar t.ex. ikonerna i FAS 1 kan vi söka på `TODO(FAS 1)` och hitta alla förekomster direkt.

### B1 · Emoji-användning → FAS 1 (Ikonografi)

**Vad:** Skanna kodbasen efter alla emoji som används som kategori/funktions-markering. Lägg en kommentar ovanför varje:

```tsx
{/* TODO(FAS 1): byt mot piktogram · kategori "Match/spel" · se ICON-BRIEF.md */}
<span>🏒</span>
```

**Emoji att söka efter:**
- 🏒 🥅 ⚽ 🎯 🏋️ 🛡️ 🧠 💪 🧤 📐 ⚡ (match/träning)
- 💰 👥 📊 📈 📉 🔔 ⚙️ (UI-funktioner)
- ☀️ ❄️ ☁️ 🌧️ ❄ (väder)
- 🔥 💎 ⭐ 🏆 (achievements)

**Regel för kommentaren:**
`TODO(FAS 1): byt mot piktogram · <kategori> · se ICON-BRIEF.md`

**Viktigt:** detta är bara kommentars­markering. **Ändra inte koden.** Vi behåller emoji tills ikon­biblioteket levereras i FAS 1.

**Referens:** `briefs/ICON-BRIEF.md` + `preview/icons-pilot.html`

---

### B2 · BottomNav-ikoner → FAS 1

**Vad:** Hitta BottomNav-komponenten. Lägg en kommentar ovanför varje ikon:

```tsx
{/* TODO(FAS 1): byt mot BottomNav-ikon "Hem" (klubbhus) · se ICON-BRIEF.md */}
<HomeIcon />
```

**Fil(er):**
- `src/components/BottomNav.tsx` (eller motsv.)

**De 6 navflikarna:**
Hem · Trupp · Match · Tabell · Transfer · Ekonomi *(eller vilken din app har — markera det som finns)*

**Referens:** `briefs/ICON-BRIEF.md` sektion "Nav-ikoner"

---

### B3 · Klubbmärken → FAS 4

**Vad:** Hitta ClubBadge-komponenten + alla ställen där klubbmärken renderas. Lägg kommentarer:

```tsx
{/* TODO(FAS 4): byt mot riktig klubblogga · se CLUB-BRIEF.md */}
<ClubBadge club={club} />
```

**Fil(er):**
- `src/components/ClubBadge.tsx`
- Alla ställen där SVG:erna är hårdkodade (leta efter `<path d="..."` inuti klubb­kontexten)

**Referens:** `briefs/CLUB-BRIEF.md` + `preview/components-club-badges.html`

---

### B4 · Karaktärsbilder → FAS 5

**Vad:** Hitta alla ställen där avatarer/porträtt visas — coach, patron, spelare, journalist. Lägg kommentar:

```tsx
{/* TODO(FAS 5): byt mot riktig karaktärsillustration · se CHARACTER-BRIEF.md */}
<Avatar initials="PL" />
```

**Fil(er):**
- `src/components/CoachAvatar.tsx`
- `src/components/PatronPortrait.tsx`
- `src/components/PlayerCard.tsx`
- Ev. `src/components/Journalist.tsx`

**Referens:** `briefs/CHARACTER-BRIEF.md`

---

## DEL C · Körordning för Code

1. **Läs** `README.md` i designsystemet för designfilosofin (3 principer)
2. **Läs** brieferna i `briefs/` för att förstå scope på FAS 1/4/5
3. **Kör Del A** (header, PhaseIndicator, logo) — verifiera mot preview-korten
4. **Kör Del B** (TODO-markeringar) — en grupp i taget, commit per grupp
5. **Verifiera** att inget existerande beteende är trasigt (ingen emoji borttagen, inga klubb­märken borttagna)

**Ingen ändring i kolorpaletter, typografi eller spacing-tokens** — de är redan godkända och ligger i produktion.

---

## Kvittens

När Batch 1 är klar, skriv en kort status här:

- [ ] A1 GameHeader klar
- [ ] A2 PhaseIndicator klar
- [ ] A3 Logo-variant klar
- [ ] B1 Emoji TODO-markeringar inskannade (antal: __)
- [ ] B2 BottomNav TODO-markeringar inskannade
- [ ] B3 Klubbmärke TODO-markeringar inskannade
- [ ] B4 Karaktärs-TODO-markeringar inskannade

**Nästa handoff:** HANDOFF-BATCH-2 kommer efter FAS 1 (ikonerna levererade).
