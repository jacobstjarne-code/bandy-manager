import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Low 2 (Skutskär-auditen, 2026-08-22): "Den första öppna tabben låg kvar på
 * a0df4c1, trots att ny nätverksladdning gav 5200967." `registerType:
 * 'autoUpdate'` (vite.config.ts) uppdaterar en redan öppen flik i tysthet —
 * ingen synlig signal, särskilt kritiskt under en begränsad release när
 * buggrapporter (FeedbackButton) måste knytas till rätt build-hash.
 *
 * vite.config.ts bytte till `registerType: 'prompt'` i samma commit — utan
 * den bytt hade Workbox redan hunnit aktivera/kasta bort den väntande
 * service workern innan `needRefresh` ens hann bli true, och banner hade
 * aldrig kunnat visas.
 */

declare const __GIT_HASH__: string

function activeBuildHash(): string {
  return typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : 'dev'
}

export function PwaUpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(url, registration) {
      console.info(`[PWA] Aktiv build: ${activeBuildHash()} (SW ${url}, scope ${registration?.scope ?? '?'})`)
    },
    onNeedRefresh() {
      console.info(`[PWA] Ny version väntar — aktiv build är fortfarande ${activeBuildHash()} tills "Ladda om" trycks.`)
    },
  })

  useEffect(() => {
    if (needRefresh) {
      console.info('[PWA] needRefresh=true — en ny service worker väntar på att ta över.')
    }
  }, [needRefresh])

  if (!needRefresh) return null

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '10px 14px',
        background: 'var(--bg-dark)',
        color: 'var(--text-light)',
        borderTop: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
        fontSize: 12.5,
      }}
    >
      <span>Ny version finns.</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="btn btn-outline"
        style={{ fontSize: 12, padding: '4px 10px' }}
      >
        Ladda om
      </button>
    </div>
  )
}
