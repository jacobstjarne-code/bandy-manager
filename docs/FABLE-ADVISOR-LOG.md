# FABLE-ADVISOR-LOG — är advisorn värd kostnaden?

**Status (2026-06-10): BEKRÄFTAT KÖRBAR via råa API:t på Jacobs nyckel.** Code probade direkt med curl: HTTP 200, giltigt svar från worker `claude-sonnet-4-6` med advisor-toolen (`advisor_20260301`, advisor `model: claude-opus-4-8`) accepterad i request. Beta-headern `advisor-tool-2026-03-01` + tool-typen kändes igen och validerades.

**Gotcha:** advisor-toolens egna `max_tokens` måste vara **≥ 1024**. Spec-exemplets 512 gav HTTP 400 (schema-valideringsfel på toolens fält) — INTE 404/beta-not-found, INTE auth. Att felet var schema-validering bevisar att betan är påslagen. Med 1024 → 200. Det yttre `max_tokens` kan vara lågt (16 funkade).

**Vad detta ändrar:**
- Förra sessionens "PARKAT — kan inte köras / contact account team" var fel om API-vägen. Betan ligger på kontot och svarar.
- Distinktionen står kvar: **råa API:t (funkar nu) ≠ Claude Code-dev-loopen (VS Code)**. Att Jacobs nyckel kan kalla advisorn säger inget om att Claude Code-produkten exponerar tool-wiringen. Men dev-loopen *behöver* den inte (se baslinjen — Code-på-Sonnet håller redan hög kvalitet, ribban för en advisor är att fånga *strukturella* fynd).
- **Rätt plats för experimentet är därför Jacobs API-direkta backends**, inte Bandy Manager-loopen. Det stämmer med förra sessionens slutsats: advisor-värdet ligger där det finns volym + en reell kvalitetsfråga.

**Kostnads-config (bekräftad):** worker Sonnet + advisor **Opus 4.8** = halva Fable-priset. "Inline-Opus-omdöme under Sonnet-körning." Fable-som-advisor sparas till hårda kompositionsproblem.

**Setup-noter för backends (från probe-körningen):**
- `ANTHROPIC_API_KEY` ligger i `konfliktrapporten/.env` (inte shell-env). Jobbagenten saknade `.env` på den kollade platsen.
- Python-SDK:n i `~/Library/Python/3.9` är arkitektur-trasig (x86_64 på arm64-mac). Antingen: kör advisorn via `requests`/HTTP rakt (ingen SDK krävs — probe gick via curl), eller ominstallera `anthropic` arm64-kompatibelt i en venv på homebrew-python.

**Två vägar:**
1. **API-direkt (ÖPPEN NU):** konfliktrapporten (semantisk matchning), jobbagenten (klassificering), ev. bandy-backend. Runtime-LLM-feature, inte spec-implementation.
2. **Claude Code-access:** status oförändrad/okänd, låg prio — dev-loopen behöver den inte.

---

## Baslinje — UTAN advisor (2026-06-09 → 10) · sparad, fortfarande nyttig

| Leverans | Nådde Opus-verifiering | Allvar | Bygge 1:a | Omarb. |
|---|---|---|---|---|
| Säsongsflöde S1/S2 | stale-read-nära-miss (process, ej defekt) | — | ja | 0 |
| Patron Fas 1 | inget | — | ja | 0 |
| Patron Fas 2 | emergence-prio (visade sig ok) + cooldown-timing | 2 mindre | ja | 1 (3 städ-items batchade) |
| Orten-redesign | mock-sökväg saknades (Opus spec-fel, Code föll tillbaka rätt) | spec-fel, ej Code | ja | 0 |
| TabBar | gammal TabBar fortf. importerad (TacticBoardCard) — ofullständig unifiering | **1 strukturellt** | ja | 1 |
| Klubb-finish | föräldralös `upgradeFacilities`-action (död kod) | 1 kosmetiskt | (ej bekräftat) | 0 |
| Scouting | inget | — | ja | 0 |

**Baslinje-summa:** ~7 leveranser · **1 reellt strukturellt fynd** (TabBar) · 3–4 mindre/kosmetiska · resten rena.
→ Code-på-Sonnet utan advisor håller redan hög kvalitet. Hög ribba i dev-loopen: en advisor måste fånga *strukturella* saker för att förtjäna sin kostnad — annars gör Opus-verifieringen redan jobbet. Därför flyttar experimentet till backends, där frågan är en annan (matchnings-/klassificeringskvalitet, inte kodstruktur).

---

## Med advisor — backends (fyll i per experiment)
_(tomt — körbar nu via API. Första testet: välj EN backend-yta, kör advisor-pass på ett sample, mät mot nuvarande utdata. Kandidat: konfliktrapportens semantiska matcher — där finns en reell kvalitetsribba.)_

— Opus, uppdaterad 2026-06-10
