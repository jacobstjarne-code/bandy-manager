// Synthetic sound effects via Web Audio API — no audio files needed.
// All sounds are < 500ms and discrete.

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof AudioContext === 'undefined' && typeof (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext === 'undefined') return null
  if (!audioCtx) {
    audioCtx = new (AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return audioCtx
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
  delayMs = 0,
) {
  const ctx = getCtx()
  if (!ctx) return
  const start = ctx.currentTime + delayMs / 1000
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.01)
}

export const sounds = {
  goal: () => {
    // Rising three-note fanfare
    playTone(523, 0.15, 'square', 0.12, 0)
    playTone(659, 0.15, 'square', 0.12, 110)
    playTone(784, 0.35, 'square', 0.15, 220)
    playTone(1047, 0.4, 'square', 0.10, 420)
  },

  whistle: () => {
    // Short sharp whistle
    playTone(1100, 0.08, 'sine', 0.12, 0)
    playTone(1300, 0.25, 'sine', 0.10, 80)
  },

  card: () => {
    // Low thud
    playTone(180, 0.3, 'sawtooth', 0.07, 0)
  },

  save: () => {
    // Quick rising ping
    playTone(440, 0.08, 'triangle', 0.09, 0)
    playTone(520, 0.12, 'triangle', 0.08, 80)
  },

  corner: () => {
    // Short neutral beep
    playTone(660, 0.10, 'sine', 0.06, 0)
  },

  click: () => {
    // Subtle UI click
    playTone(900, 0.04, 'sine', 0.04, 0)
  },

  success: () => {
    // Three-note success chord
    playTone(440, 0.12, 'sine', 0.09, 0)
    playTone(554, 0.12, 'sine', 0.09, 90)
    playTone(659, 0.22, 'sine', 0.11, 170)
  },

  champagne: () => {
    // Sparkling celebration — random high tones
    for (let i = 0; i < 6; i++) {
      const freq = 600 + Math.random() * 900
      playTone(freq, 0.18, 'sine', 0.07, i * 90)
    }
  },

  penaltyScore: () => {
    playTone(622, 0.12, 'square', 0.10, 0)
    playTone(784, 0.25, 'square', 0.12, 110)
  },

  penaltyMiss: () => {
    playTone(220, 0.15, 'sawtooth', 0.08, 0)
    playTone(185, 0.3, 'sawtooth', 0.06, 150)
  },

  overtime: () => {
    // Dramatic low pulse
    playTone(110, 0.20, 'triangle', 0.10, 0)
    playTone(110, 0.20, 'triangle', 0.10, 300)
    playTone(165, 0.35, 'triangle', 0.12, 600)
  },
}

// Global mute (persisted in localStorage)
let _muted = typeof localStorage !== 'undefined'
  ? localStorage.getItem('bandy_muted') === 'true'
  : false

export function isMuted(): boolean {
  return _muted
}

export function toggleMute(): void {
  _muted = !_muted
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('bandy_muted', String(_muted))
  }
}

// Play a named sound, respecting mute and resuming suspended context
export function playSound(name: keyof typeof sounds): void {
  if (_muted) return
  const ctx = getCtx()
  if (ctx?.state === 'suspended') {
    ctx.resume().then(() => sounds[name]())
  } else {
    sounds[name]()
  }
}
