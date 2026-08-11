// ── Sonidos del juego: cantos en voz alta ────────────────────────
// Usa la Web Speech API del navegador (sin archivos de audio) para
// decir los cantos en español: "¡Envido!", "¡Truco!", "¡Quiero!", etc.
// Se apaga/enciende desde el toggle de sonido de la mesa.

let soundEnabled = true

export function setSoundsEnabled(enabled: boolean) {
  soundEnabled = enabled
  if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try { window.speechSynthesis.cancel() } catch { /* noop */ }
  }
}

export function isSoundEnabled() {
  return soundEnabled
}

let esVoice: SpeechSynthesisVoice | null | undefined

function pickSpanishVoice() {
  if (esVoice !== undefined) return esVoice
  const voices = typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis.getVoices()
    : []
  esVoice = voices.find((v) => /^es[-_]AR/i.test(v.lang))
    || voices.find((v) => /^es/i.test(v.lang))
    || null
  return esVoice
}

export function sayCall(text: string, opts: { excited?: boolean } = {}) {
  if (!soundEnabled) return
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'es-AR'
    u.rate = opts.excited ? 1.05 : 0.92
    u.pitch = opts.excited ? 1.15 : 1.0
    const v = pickSpanishVoice()
    if (v) u.voice = v
    // Corta el canto anterior para que no se pisen
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch { /* noop */ }
}
