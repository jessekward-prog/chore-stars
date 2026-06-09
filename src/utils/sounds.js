let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}

export function playCheck() {
  const ac = getCtx()
  const notes = [523.25, 659.25, 783.99]
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    const t = ac.currentTime + i * 0.08
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.25, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
    osc.start(t)
    osc.stop(t + 0.4)
  })
}

export function playAllDone() {
  const ac = getCtx()
  const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5]
  melody.forEach((freq, i) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    const t = ac.currentTime + i * 0.12
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.2, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
    osc.start(t)
    osc.stop(t + 0.35)
  })
}

export function playWheelTick() {
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.type = 'square'
  osc.frequency.value = 1100
  const t = ac.currentTime
  gain.gain.setValueAtTime(0.07, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.028)
  osc.start(t)
  osc.stop(t + 0.03)
}

export function playWin() {
  const ac = getCtx()
  // Triumphant fanfare: ascending chord + high shimmer
  const layers = [
    { freq: 523.25, delay: 0.00, dur: 0.7, type: 'triangle' },
    { freq: 659.25, delay: 0.08, dur: 0.7, type: 'triangle' },
    { freq: 783.99, delay: 0.16, dur: 0.7, type: 'triangle' },
    { freq: 1046.5, delay: 0.24, dur: 0.8, type: 'sine' },
    { freq: 1318.5, delay: 0.35, dur: 0.9, type: 'sine' },
    { freq: 1568.0, delay: 0.46, dur: 1.0, type: 'sine' },
    { freq: 2093.0, delay: 0.58, dur: 1.2, type: 'sine' },
  ]
  layers.forEach(({ freq, delay, dur, type }) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = type
    osc.frequency.value = freq
    const t = ac.currentTime + delay
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.22, t + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  })
}

export function playUncheck() {
  const ac = getCtx()
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(400, ac.currentTime)
  osc.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.15)
  gain.gain.setValueAtTime(0.1, ac.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + 0.2)
}
