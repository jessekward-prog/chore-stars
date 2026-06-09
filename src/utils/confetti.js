import confetti from 'canvas-confetti'

const COLORS = ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#7B68EE', '#98FB98', '#FF8C00']

export function fireChoreConfetti(x, y) {
  const origin = {
    x: x / window.innerWidth,
    y: y / window.innerHeight,
  }
  confetti({
    particleCount: 60,
    spread: 80,
    origin,
    colors: COLORS,
    shapes: ['star', 'circle'],
    gravity: 0.9,
    scalar: 1.4,
    drift: 0,
  })
}

export function fireAllDoneConfetti() {
  // Big burst from both sides
  confetti({ particleCount: 100, angle: 60,  spread: 65, origin: { x: 0, y: 0.55 }, colors: COLORS, shapes: ['star','circle'], gravity: 0.85, scalar: 1.6 })
  confetti({ particleCount: 100, angle: 120, spread: 65, origin: { x: 1, y: 0.55 }, colors: COLORS, shapes: ['star','circle'], gravity: 0.85, scalar: 1.6 })
}

// Gentle background rain — call once, returns a stop function
export function startConfettiRain() {
  let running = true

  const drip = () => {
    if (!running) return
    // A handful of particles trickling down from the top
    confetti({
      particleCount: 6,
      angle: 90,
      spread: 120,
      origin: { x: Math.random(), y: -0.05 },
      colors: COLORS,
      shapes: ['star', 'circle'],
      gravity: 0.5,
      scalar: 1.1,
      drift: (Math.random() - 0.5) * 0.4,
      ticks: 220,
    })
    setTimeout(drip, 280)
  }

  drip()
  return () => { running = false }
}
