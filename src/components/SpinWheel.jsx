import { useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { playWheelTick } from '../utils/sounds'

function scheduleTicks(durationMs) {
  let elapsed = 0
  let interval = 38
  const doTick = () => {
    playWheelTick()
    interval = Math.min(interval * 1.068, 650)
    elapsed += interval
    if (elapsed < durationMs - 350) setTimeout(doTick, interval)
  }
  doTick()
}

const toRad = (d) => (d * Math.PI) / 180

function sectorPath(cx, cy, r, start, end) {
  const x1 = cx + r * Math.sin(toRad(start))
  const y1 = cy - r * Math.cos(toRad(start))
  const x2 = cx + r * Math.sin(toRad(end))
  const y2 = cy - r * Math.cos(toRad(end))
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`
}

export default function SpinWheel({ sections, onResult }) {
  const [cumulative, setCumulative] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState(null)
  const controls = useAnimation()

  const NUM = sections.length
  const SLICE = NUM > 0 ? 360 / NUM : 360

  const handleSpin = async () => {
    if (spinning || winner !== null || NUM === 0) return
    setSpinning(true)

    const extraSpins = 7 + Math.floor(Math.random() * 5)
    const extraAngle = Math.floor(Math.random() * 360)
    const target = cumulative + extraSpins * 360 + extraAngle
    const duration = 4.5 + Math.random() * 1.5

    scheduleTicks(duration * 1000)

    await controls.start({
      rotate: target,
      transition: { duration, ease: [0.0, 0.0, 0.2, 1.0] },
    })

    const normalized = ((target % 360) + 360) % 360
    const pointedAt = (360 - normalized) % 360
    const idx = Math.floor(pointedAt / SLICE) % NUM

    setCumulative(target)
    setWinner(idx)
    setSpinning(false)
    onResult(idx)
  }

  const cx = 140, cy = 140, r = 124

  return (
    <div className="flex flex-col items-center">
      <motion.div className="z-10" style={{ marginBottom: -10 }}
        animate={spinning ? { y: [0, 4, 0] } : { y: 0 }}
        transition={{ duration: 0.3, repeat: spinning ? Infinity : 0 }}>
        <svg width={32} height={26}>
          <polygon points="16,26 0,0 32,0" fill="#FFD700"
            style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }} />
        </svg>
      </motion.div>

      <div style={{ borderRadius: '50%', boxShadow: '0 0 0 5px rgba(255,255,255,0.15), 0 12px 40px rgba(0,0,0,0.5)' }}>
        <motion.svg width={280} height={280} animate={controls}
          style={{ display: 'block', originX: '50%', originY: '50%' }}>
          {sections.map((sec, i) => {
            const start = i * SLICE
            const end = (i + 1) * SLICE
            const mid = start + SLICE / 2
            const tr = r * 0.63
            const tx = cx + tr * Math.sin(toRad(mid))
            const ty = cy - tr * Math.cos(toRad(mid))
            const isWin = winner === i
            return (
              <g key={sec.id ?? i}>
                <path d={sectorPath(cx, cy, r, start, end)}
                  fill={isWin ? sec.dark_color : sec.color}
                  stroke="white" strokeWidth={3} />
                <g transform={`translate(${tx},${ty}) rotate(${mid})`}>
                  <text textAnchor="middle" dominantBaseline="middle" fontSize={18} fontWeight="bold"
                    fontFamily="'Fredoka One', cursive" fill="white"
                    style={{ userSelect: 'none', pointerEvents: 'none' }}>
                    {sec.label}
                  </text>
                </g>
              </g>
            )
          })}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeWidth={4} />
          <circle cx={cx} cy={cy} r={20} fill="white" stroke="rgba(0,0,0,0.1)" strokeWidth={2} />
          <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={18}>⭐</text>
        </motion.svg>
      </div>

      {winner === null && (
        <motion.button onClick={handleSpin} disabled={spinning}
          className="mt-6 px-12 py-4 rounded-full text-2xl text-white shadow-2xl"
          style={{
            fontFamily: "'Fredoka One', cursive",
            background: spinning ? '#555' : 'linear-gradient(135deg, #FFD700 0%, #FF6347 100%)',
            cursor: spinning ? 'not-allowed' : 'pointer',
          }}
          whileTap={!spinning ? { scale: 0.9 } : {}}
          animate={!spinning ? { boxShadow: ['0 0 16px rgba(255,200,0,0.4)', '0 0 40px rgba(255,200,0,1.0)', '0 0 16px rgba(255,200,0,0.4)'] } : { boxShadow: '0 0 0px rgba(0,0,0,0)' }}
          transition={{ duration: 1.2, repeat: Infinity }}>
          {spinning ? '🌀 Spinning...' : '🎰 SPIN TO WIN!'}
        </motion.button>
      )}

      {winner !== null && (
        <motion.div className="mt-5 text-center"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, delay: 0.15 }}>
          <div className="text-white text-2xl mb-1" style={{ fontFamily: "'Fredoka One', cursive" }}>
            🎯 You landed on...
          </div>
          <motion.div className="text-5xl font-black"
            style={{ color: sections[winner].color, fontFamily: "'Fredoka One', cursive", textShadow: `0 0 24px ${sections[winner].color}` }}
            animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 0.5, delay: 0.35 }}>
            {sections[winner].label}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
