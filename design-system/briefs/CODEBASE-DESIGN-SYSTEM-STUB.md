# Stub — gammal designsystem-fil i codebasen

**Den här texten är till Code (utvecklare).** När du jobbar i `bandy-manager`-codebasen och hittar `docs/DESIGN_SYSTEM.md`:

## Filen är arkiverad

Allt designsystem-innehåll bor numera i **detta projekt** (det Claude Open läser). Inte i codebasen.

## Vad du ska göra

Ersätt hela innehållet i `bandy-manager/docs/DESIGN_SYSTEM.md` med detta:

```markdown
# Design System — ARKIVERAD

⚠️ Den här filen är **arkiverad och får inte användas**.

Bandy Managers designsystem bor i ett separat projekt:

- Tokens: `colors_and_type.css`
- Beslut: `DESIGN-DECISIONS.md`
- Komponenter: `preview/components-*.html`
- Skärmar: `ui_kits/`
- Implementations-specs: `briefs/`
- Code-changes: `HANDOFF.md`
- Filosofi & regler: `README.md`

Vid UI-ändringar: läs designsystem-projektet först. Aldrig denna fil. Aldrig från minnet.

Vid konflikt: designsystem-projektet vinner.
```

## Varför

Två sources of truth → drift. Knappar, färger och regler hamnar i otakt. **En källa, inga kopior.**

Filen kan tas bort helt om Code:s rutiner tillåter det. Stuben ovan är säkrare alternativet — den fångar upp gamla länkar och pekar dem rätt.
