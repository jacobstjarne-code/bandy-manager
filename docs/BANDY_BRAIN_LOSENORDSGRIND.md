# Bandy Brain — lösenordsgrind (aktiveringschecklista)

**Skapad:** 2026-06-08
**Status:** Grind förberedd i kod (`bandy-brain/middleware.ts`), EJ aktiv.

---

## Läget

Bandy Brain deployar i dag till **GitHub Pages** (`.github/workflows/bandy-brain-deploy.yml` → `actions/deploy-pages`). GitHub Pages är ren statisk hosting utan edge-/serverlager och har **ingen lösenordsfunktion** för publika repos. Den förberedda Basic Auth-middlewaren (`bandy-brain/middleware.ts`) kan därför **inte** köras där — så länge sajten ligger på Pages är den helt öppen.

PoC-bannern ("Preliminär version…") är däremot live på alla sidor oavsett host.

## Val: var ska grinden enforced?

### Alternativ 1 — Flytta bandy-brain till Vercel (matchar förberedd kod)

`bandy-brain/middleware.ts` fungerar exakt som den är när sajten hostas på Vercel.

Jacobs steg (Code rör inte dashboarden):
1. Skapa ett Vercel-projekt mot detta repo, **Root Directory = `bandy-brain`**, framework-preset Astro.
2. Vercel → Settings → Environment Variables: lägg `BANDY_BRAIN_USER` och `BANDY_BRAIN_PASS` (valfria värden — lösenordet hamnar bara här, aldrig i repot).
3. Justera `astro.config.mjs`: `site`/`base` är i dag satta för GitHub Pages (`base: '/bandy-manager'`). På Vercel-rot vill man ha `base: '/'` och `site` = Vercel-URL:en. (Säg till så gör Code den ändringen när hostingbeslutet är taget.)
4. Deploya. Verifiera: webbläsarens inloggningsruta ska dyka upp; rätt user/pass släpper in.
5. Slå av GitHub Pages-deployen (annars finns en oskyddad kopia kvar på Pages-URL:en).

### Alternativ 2 — Cloudflare Access framför nuvarande host

Ingen kodändring. Lägg sajten bakom en Cloudflare Access-policy (e-post-OTP eller lösenord). Fungerar oavsett om backend är Pages eller annat. Kräver att domänen går via Cloudflare.

### Alternativ 3 — Netlify

Flytta till Netlify och använd native Password Protection (Pro) eller Basic Auth via `_headers`/Edge Functions.

## Rekommendation

Alternativ 1 om bandy-brain ändå ska bo på Vercel framåt (då är koden redan klar). Alternativ 2 om sajten ska ligga kvar där den är och du bara vill ha en grind snabbt utan att flytta hosting.

## Säkerhetsnot

- Lösenordet finns aldrig i koden eller git — bara som env-variabel hos hostingleverantören.
- En klientsides-grind (lösenord i JS) vore värdelös för en statisk sajt: innehållet ligger redan i webbläsaren. Grinden måste vara edge-/server-enforced, vilket alla tre alternativen ovan är.
