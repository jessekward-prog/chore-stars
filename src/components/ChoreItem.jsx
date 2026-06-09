import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playCheck, playUncheck } from '../utils/sounds'
import { fireChoreConfetti } from '../utils/confetti'

const STARS = ['⭐', '✨', '🌟', '💫']

export default function ChoreItem({ chore, checked, onToggle }) {
  const [particles, setParticles] = useState([])
  const btnRef = useRef(null)

  const handleClick = () => {
    if (!checked) {
      playCheck()
      const rect = btnRef.current?.getBoundingClientRect()
      if (rect) {
        fireChoreConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2)
      }
      const newParticles = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        symbol: STARS[Math.floor(Math.random() * STARS.length)],
        x: Math.random() * 80 - 40,
      }))
      setParticles(newParticles)
      setTimeout(() => setParticles([]), 1000)
    } else {
      playUncheck()
    }
    onToggle()
  }

  return (
    <div className="relative">
      <motion.button
        ref={btnRef}
        onClick={handleClick}
        className={`
          w-full flex items-center gap-4 px-5 py-4 rounded-3xl font-nunito font-black text-xl
          shadow-lg border-4 transition-all duration-200 relative overflow-hidden
          ${checked
            ? `${chore.checkedBg} border-white/40 opacity-80`
            : `${chore.bg} border-white/60 hover:border-white`
          }
        `}
        whileTap={{ scale: 0.93 }}
        animate={checked ? { scale: [1, 1.08, 1] } : {}}
        transition={{ duration: 0.25, type: 'spring', stiffness: 400 }}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {/* Shimmer on unchecked */}
        {!checked && (
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-3xl"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
          />
        )}

        {/* Emoji */}
        <motion.span
          className="text-4xl relative z-10 flex-shrink-0"
          animate={checked ? { rotate: [0, -10, 10, 0], scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.4 }}
        >
          {chore.emoji}
        </motion.span>

        {/* Label */}
        <span className="flex-1 text-left text-white drop-shadow-md relative z-10 tracking-wide">
          {chore.label}
        </span>

        {/* Check circle */}
        <div className={`
          w-10 h-10 rounded-full border-4 flex items-center justify-center flex-shrink-0 relative z-10
          ${checked ? 'bg-white border-white' : 'border-white/60 bg-white/10'}
        `}>
          <AnimatePresence>
            {checked && (
              <motion.span
                key="check"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className="text-lg leading-none"
                style={{ color: chore.checkColor }}
              >
                ✓
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.button>

      {/* Floating star particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute text-2xl pointer-events-none"
            style={{ bottom: '50%', left: `calc(50% + ${p.x}px)` }}
            initial={{ y: 0, opacity: 1, scale: 0.5 }}
            animate={{ y: -90, opacity: 0, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            {p.symbol}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}
