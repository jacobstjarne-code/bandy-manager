// Bandy Brain — lösenordsgrind (Vercel Edge Middleware, plattformsnivå).
//
// Ligger på projektroten (Vercel Root Directory = bandy-brain/) och körs på Vercels
// edge FÖRE någon statisk fil serveras. Utan giltig cookie → serveras lösenordssidan
// i stället för det begärda innehållet, så en obehörig webbläsare aldrig får findings-
// HTML (även på /findings/061/ direkt). Sajten byggs som vanligt (output: 'static',
// ../docs/ läses vid byggtid) — grinden är helt frikopplad från Astro-bygget.
//
// Ersätter den tidigare Basic-Auth-PoC:n: nu en stillsam stylad lösenordssida (inte
// en rå browserprompt) + signerad cookie så Daniel loggar in en gång.
//
// Varför inte Astro-middleware/@astrojs/vercel edgeMiddleware: med output:'static'
// emitterar adaptern ingen edge-function (verifierat 2026-07 — helstatisk output ger
// inga functions), så Astro-middlewaren skulle aldrig köra på request. Vercel-native
// middleware körs oavsett output-läge, utan adapter.
//
// Env-vars sätts i Vercel-dashboarden, ALDRIG i repot:
//   SITE_PASSWORD  — lösenordet (byter ut gamla BANDY_BRAIN_USER/PASS)
//   COOKIE_SECRET  — HMAC-nyckel som signerar cookien så den inte kan förfalskas
// SVENSK TEXT i lösenordssidan = [Opus]-placeholders — Fable skriver den.

export const config = {
  // Grinda allt. (Assets kan undantas för perf senare — hela sajten är privat nu.)
  matcher: '/((?!_vercel|favicon.ico|favicon.svg).*)',
};

const COOKIE = 'bb_auth';
const ONE_YEAR = 60 * 60 * 24 * 365;
const PAYLOAD = 'ok'; // konstant nyttolast; HMAC-signaturen är skyddet

// Vitlista: paths som släpps igenom utan lösenord. Tom nu — hela sajten är sluten.
// Kurerad breddning senare (öppna '/' men stäng '/findings') = lägg till här.
export const PUBLIC_PATHS: string[] = [];

export function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function b64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return b64url(new Uint8Array(sig));
}

export async function makeToken(secret: string): Promise<string> {
  return `${PAYLOAD}.${await hmac(PAYLOAD, secret)}`;
}

export async function validToken(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false;
  const dot = token.lastIndexOf('.');
  if (dot < 1) return false;
  return token.slice(dot + 1) === (await hmac(token.slice(0, dot), secret));
}

// Jämför lösenord via HMAC (konstant-tid-ish; undviker early-exit i strängjämförelsen).
export async function passwordMatches(input: string, expected: string, secret: string): Promise<boolean> {
  if (!input || !expected) return false;
  return (await hmac(input, secret)) === (await hmac(expected, secret));
}

export function readCookie(cookieHeader: string | null, name: string): string | undefined {
  for (const part of (cookieHeader ?? '').split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return undefined;
}

export function sanitizeNext(nextPath: string): string {
  // Bara lokala paths — förhindra open-redirect.
  if (!nextPath.startsWith('/') || nextPath.startsWith('//')) return '/';
  return nextPath;
}

export function loginPage(opts: { error?: boolean; configError?: boolean; next?: string } = {}): Response {
  const nextPath = sanitizeNext(opts.next ?? '/');
  const errorLine = opts.configError
    ? `<p class="err">[Opus — konfigurationsfel]</p>`
    : opts.error
      ? `<p class="err">[Opus — fel lösenord]</p>`
      : '';
  const html = `<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Bandy Brain</title>
<style>
  :root { --bg:#fafaf8; --surface:#fff; --border:#e2e0d8; --text:#1a1a18; --muted:#6b6860; --accent:#1a4f8c; --accent-hover:#133b6a; }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body { background: var(--bg); color: var(--text); font-family: 'Georgia','Times New Roman',serif; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
  .card { width: 100%; max-width: 24rem; text-align: center; }
  .mark { font-family: system-ui,-apple-system,sans-serif; font-size: .7rem; letter-spacing: .18em; text-transform: uppercase; color: var(--muted); margin-bottom: 1.75rem; }
  h1 { font-size: 1.35rem; font-weight: 400; line-height: 1.4; margin: 0 0 1.75rem; }
  form { display: flex; gap: .5rem; }
  input { flex: 1; padding: .7rem .85rem; font-size: 1rem; font-family: system-ui,-apple-system,sans-serif; background: var(--surface); color: var(--text); border: 1px solid var(--border); border-radius: 6px; }
  input:focus { outline: none; border-color: var(--accent); }
  button { padding: .7rem 1.1rem; font-size: .95rem; font-family: system-ui,-apple-system,sans-serif; cursor: pointer; background: var(--accent); color: #fff; border: none; border-radius: 6px; }
  button:hover { background: var(--accent-hover); }
  .err { font-family: system-ui,-apple-system,sans-serif; font-size: .85rem; color: #9a3324; margin: 1rem 0 0; }
</style>
</head>
<body>
  <main class="card">
    <p class="mark">Bandy Brain</p>
    <h1>[Opus — en rad]</h1>
    <form method="POST" action="/">
      <input type="password" name="password" placeholder="[Opus]" autofocus autocomplete="current-password" aria-label="[Opus]" />
      <input type="hidden" name="next" value="${nextPath.replace(/"/g, '&quot;')}" />
      <button type="submit">[Opus]</button>
    </form>
    ${errorLine}
  </main>
</body>
</html>`;
  return new Response(html, {
    status: opts.error || opts.configError ? 401 : 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

// Ren, testbar kärna. Returnerar en Response för att korta av (grind/redirect),
// eller null för att släppa igenom (default-exporten översätter null → undefined).
export async function handle(
  request: Request,
  env: { SITE_PASSWORD?: string; COOKIE_SECRET?: string },
): Promise<Response | null> {
  const url = new URL(request.url);

  if (isPublic(url.pathname)) return null;

  const password = env.SITE_PASSWORD;
  const secret = env.COOKIE_SECRET;

  // Fail-closed: saknas konfigen är sajten låst, inte öppen.
  if (!password || !secret) return loginPage({ configError: true, next: url.pathname + url.search });

  if (request.method === 'POST') {
    let input = '';
    let nextPath = '/';
    try {
      const form = await request.formData();
      input = String(form.get('password') ?? '');
      nextPath = sanitizeNext(String(form.get('next') ?? '/'));
    } catch {
      return loginPage({ error: true });
    }
    if (await passwordMatches(input, password, secret)) {
      const token = await makeToken(secret);
      const headers = new Headers({ Location: nextPath });
      headers.append(
        'Set-Cookie',
        `${COOKIE}=${token}; Path=/; Max-Age=${ONE_YEAR}; HttpOnly; Secure; SameSite=Lax`,
      );
      return new Response(null, { status: 303, headers });
    }
    return loginPage({ error: true, next: nextPath });
  }

  if (await validToken(readCookie(request.headers.get('cookie'), COOKIE), secret)) return null;

  return loginPage({ next: url.pathname + url.search });
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
  const res = await handle(request, { SITE_PASSWORD: env.SITE_PASSWORD, COOKIE_SECRET: env.COOKIE_SECRET });
  return res ?? undefined; // undefined = släpp igenom till den statiska filen
}
