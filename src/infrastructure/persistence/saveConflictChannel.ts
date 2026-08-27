// M2 (audit 5c9a7a8, 2026-08-24): notifierar ANDRA flikar direkt när denna
// flik skrivit en ny revision av ett save. Kompletterar compare-and-swap i
// saveGameStorage.ts (som är den auktoritativa spärren mot dataförlust även
// utan BroadcastChannel-stöd) — utan den här kanalen märker en stale flik
// konflikten först vid sitt EGET nästa sparförsök, vilket kan ligga flera
// spelaråtgärder bort. BroadcastChannel levererar aldrig till avsändarens
// egen kontext (spec-garanti), så mottagaren vet alltid att meddelandet kom
// från en ANNAN flik.
const CHANNEL_NAME = 'bandy-save-sync'

export interface SaveWrittenMessage {
  saveId: string
  revision: number
}

let channel: BroadcastChannel | null = null
let channelInitAttempted = false

function getChannel(): BroadcastChannel | null {
  if (channelInitAttempted) return channel
  channelInitAttempted = true
  if (typeof BroadcastChannel === 'undefined') return null
  try {
    channel = new BroadcastChannel(CHANNEL_NAME)
  } catch {
    channel = null
  }
  return channel
}

export function broadcastSaveWritten(saveId: string, revision: number): void {
  getChannel()?.postMessage({ saveId, revision } satisfies SaveWrittenMessage)
}

/** Returns an unsubscribe function. No-op channel (unsupported browser) still returns a valid unsubscribe. */
export function subscribeToSaveWrites(onWrite: (msg: SaveWrittenMessage) => void): () => void {
  const ch = getChannel()
  if (!ch) return () => {}
  const handler = (e: MessageEvent<SaveWrittenMessage>) => onWrite(e.data)
  ch.addEventListener('message', handler)
  return () => ch.removeEventListener('message', handler)
}
