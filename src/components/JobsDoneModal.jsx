import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { fireKidDoneConfetti } from '../utils/confetti'

export default function JobsDoneModal({ kid, onClose }) {
  useEffect(() => {
    fireKidDoneConfetti()
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.55)' }}
    >
      <motion.div
        initial={{ scale: 0.5, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.5, y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 26 }}
        className="rounded-3xl p-8 flex flex-col items-center gap-3 w-full max-w-xs"
        style={{
          background: kid.accent_color || '#8b5cf6',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <motion.div
          className="text-7xl"
          animate={{ scale: [1, 1.25, 1], rotate: [-8, 8, -8] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          🏆
        </motion.div>

        <div
          className="text-white text-5xl text-center"
          style={{ fontFamily: "'Fredoka One', cursive", textShadow: '0 2px 16px rgba(0,0,0,0.35)' }}
        >
          JOBS DONE!
        </div>

        <div className="text-white/80 text-lg font-bold text-center">
          {kid.name} smashed all their chores! 🌟
        </div>

        <motion.div
          className="text-white/40 text-sm mt-1"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        >
          tap to close
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
