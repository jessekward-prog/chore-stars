import { motion } from 'framer-motion'

const POINTS = [
  { icon: '👧🧒', text: 'Each kid gets their own tab with chores to check off.' },
  { icon: '🌅🌙', text: 'Chores can be set for morning, evening, or all day.' },
  { icon: '🏆', text: 'Finish every chore all week to spin the prize wheel!' },
  { icon: '🔒', text: 'Give a kid a PIN so only they can switch to their own tab.' },
  { icon: '⚙️', text: 'Tap the lock icon to add kids, chores and prizes in Parent Settings.' },
]

export default function AppIntroModal({ onClose }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.65)' }}
    >
      <motion.div
        initial={{ scale: 0.85, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="rounded-3xl p-6 flex flex-col gap-4 w-full max-w-sm"
        style={{
          background: 'linear-gradient(160deg, #1a0a3d, #0d1a3d)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-white text-2xl text-center mb-1" style={{ fontFamily: "'Fredoka One', cursive" }}>
          ⭐ Welcome to Chore Stars!
        </div>
        <div className="flex flex-col gap-3">
          {POINTS.map((p, i) => (
            <motion.div key={i} className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}>
              <span className="text-2xl flex-shrink-0">{p.icon}</span>
              <span className="text-white/80 text-sm font-bold" style={{ fontFamily: "'Nunito', sans-serif" }}>{p.text}</span>
            </motion.div>
          ))}
        </div>
        <motion.button onClick={onClose}
          className="mt-2 w-full py-3 rounded-2xl text-white text-lg font-black"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', fontFamily: "'Fredoka One', cursive" }}
          whileTap={{ scale: 0.96 }}>
          Got it!
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
