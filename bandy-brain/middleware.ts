// Bandy Brain — Basic Auth-grind (Vercel Edge Middleware).
//
// ⚠️ KÖRS ENDAST PÅ VERCEL. Sajten deployar i dag till GitHub Pages
// (.github/workflows/bandy-brain-deploy.yml → actions/deploy-pages), som är
// ren statisk hosting UTAN edge-/serverlager. Den här filen ignoreras helt av
// GitHub Pages — så länge sajten ligger på Pages är den INTE lösenordsskyddad.
//
// Grinden aktiveras först när bandy-brain hostas på Vercel. Se
// docs/BANDY_BRAIN_LOSENORDSGRIND.md för flytt-checklistan.
//
// Lösenordet läggs ALDRIG här eller i repot — middlewaren läser bara
// env-variablerna BANDY_BRAIN_USER / BANDY_BRAIN_PASS som sätts i Vercel.

export const config = {
  matcher: '/((?!_vercel|favicon.ico).*)',
};

export default function middleware(request: Request): Response | undefined {
  const expectedUser = process.env.BANDY_BRAIN_USER;
  const expectedPass = process.env.BANDY_BRAIN_PASS;

  const header = request.headers.get('authorization');
  if (header?.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6));
      const sep = decoded.indexOf(':');
      const user = decoded.slice(0, sep);
      const pass = decoded.slice(sep + 1);
      if (user === expectedUser && pass === expectedPass) {
        return; // korrekt — släpp igenom
      }
    } catch { /* trasig header → 401 nedan */ }
  }

  return new Response('Autentisering krävs.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Bandy Brain — preliminär version", charset="UTF-8"',
    },
  });
}
