# Bandy Brain — lösenordsgrind (aktiveringschecklista)

**Uppdaterad:** 2026-07-23. **Statusrad rättad 2026-09-01** (MASTER_OPPET.md `inv-1-losenordsgrind-stale`) — se not nedan.
**Status:** Grind byggd + logikverifierad (`bandy-brain/middleware.ts`). Committad till main men **inert på Pages** (Astro/Pages ignorerar root-`middleware.ts` — den aktiveras först på Vercel). Config-flippen (`bandybrain.se`/no-base) VAR planerad att göras vid cutovern — men `bandy-brain/astro.config.mjs` har redan `site: 'https://bandybrain.se'` och ingen `base:`-rad, committad i `9e76ad43`. Om detta redan bröt den live Pages-sajten (root-relativa asset-paths 404:ar på github.io/bandy-manager, per denna sidas egen varning) är overifierat härifrån — Vercel-cutoverns faktiska status (DNS, Pages-workflowen avstängd eller ej) är Jacobs bord, inte kodläsbart.

---

## Vad som byggts

En **stillsam stylad lösenordssida** (inte en rå browserprompt) + **signerad cookie** så Daniel loggar in en gång. Ersätter den tidigare Basic-Auth-PoC:n.

- **`bandy-brain/middleware.ts`** — Vercel Edge Middleware på plattformsnivå (projektrot). Körs på Vercels edge FÖRE någon statisk fil serveras. Utan giltig cookie → serveras lösenordssidan i stället för innehållet, även på `/findings/061/` direkt.
- Cookien (`bb_auth`) HMAC-signeras mot `COOKIE_SECRET` → kan inte förfalskas. HttpOnly, Secure, SameSite=Lax, 1 års livslängd.
- **Vitlista-förberedd:** `PUBLIC_PATHS` i middlewaren är tom nu (hela sajten sluten). Kurerad breddning senare (öppna `/` men stäng `/findings`) = lägg till paths där, ingen omskrivning.
- Svensk copy på sidan = `[Opus]`-placeholders. **Fable skriver texten** (heading/prompt/knapp/fel-rad).

## Arkitektur — varför just så (verifierat 2026-07)

- **`output: 'static'` behålls.** `../docs/`-läsningen (facts.ts, tree, questions, review) sker vid byggtid; testbyggt med och utan adapter — läsningen överlever. SSR (`output: 'server'`) skulle brutit den och förkastades.
- **Ingen `@astrojs/vercel`-adapter.** Testad: med helstatisk output emitterar adaptern med `edgeMiddleware:true` **ingen** edge-function (inga functions i `.vercel/output`), så Astro-middlewaren skulle aldrig köra på request. **Vercel-native `middleware.ts` körs oavsett output-läge** — enklare och robust.
- Ingen `base` (sajten på `bandybrain.se`-roten) → alla URL:er identiska efter flytten.
- Ingen byggkod läser `INTERNAL_`-filer → Vercel-bygget kraschar inte på deras frånvaro (de är gitignore:ade, finns inte i checkouten).

## Lokal verifiering (klar)

`middleware.ts`:s kärna (`handle`) körd mot mock-requests, 20/20 checkar gröna:
utan cookie → lösenordssida (ej innehåll); rätt lösenord → 303 + signerad cookie; giltig cookie → igenom; fel lösenord → 401; förfalskad cookie avvisad; fail-closed utan env; open-redirect-skydd. Det enda som inte går lokalt är "Vercel kör den på edge" — plattformsgaranti, bekräftas på preview-deployen.

## Jacobs steg (Code rör inte dashboarden)

1. **Vercel-projekt** mot detta repo: **Root Directory = `bandy-brain`**, framework-preset Astro.
2. **Env-vars** (Settings → Environment Variables), aldrig i repot:
   - `SITE_PASSWORD` — lösenordet Daniel får.
   - `COOKIE_SECRET` — en lång slumpsträng (t.ex. `openssl rand -hex 32`) som signerar cookien.
3. **Config-flippen** — REDAN COMMITTAD (`9e76ad43`, upptäckt stale 2026-09-01): `bandy-brain/astro.config.mjs` har redan `site: 'https://bandybrain.se'`, ingen `base:`-rad. Om Pages-sajten redan är trasig av detta (root-relativa asset-paths 404:ar) är overifierat — kontrollera github.io/bandy-manager-URL:en om Pages fortfarande ska vara live. `middleware.ts` är redan på main.
4. **Preview-deploy** och verifiera på preview-URL:en: `/findings/061/` direkt → lösenordssida; rätt lösenord → in, kvar vid omladdning; fel → tillbaka.
5. **DNS:** peka `bandybrain.se` på Vercel.
6. **Slå av Pages-deployen** — `.github/workflows/bandy-brain-deploy.yml`: lägg `if: false` på `build`-jobbet (workflowen kvar som `workflow_dispatch`). Annars finns en oskyddad + trasig kopia kvar på github.io-URL:en.

## Fables steg

Skriv lösenordssidans copy (ersätt `[Opus]`-placeholders i `middleware.ts` `loginPage()`): en rad, fältets placeholder/aria-label, knappen, fel-raden. Stillsam, Bandy Brain-ton.

## Säkerhetsnot

- Varken lösenord eller signeringsnyckel finns i koden/git — bara som Vercel-env-vars. Byter man `COOKIE_SECRET` loggas alla ut.
- Grinden är edge-enforced: obehörig webbläsare får aldrig findings-HTML. En klientsides-grind vore värdelös (innehållet ligger redan i webbläsaren).
- Hotbild: för tidig spridning, inte aktiva angripare. `SITE_PASSWORD` + signerad cookie räcker för den nivån.
