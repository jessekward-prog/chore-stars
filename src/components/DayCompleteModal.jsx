import { useEffect } from 'react'
import { motion } from 'framer-motion'
import WeekTracker from './WeekTracker'
import { fireAllDoneConfetti, startConfettiRain } from '../utils/confetti'

const DAY_LABELS = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday',
}

const LINES = {
  mon: '1 down, 4 to go! 🚀',
  tue: '2 done! Halfway through! 💪',
  wed: 'Midweek heroes! ⚡',
  thu: 'Last stretch tomorrow! 🏁',
  fri: 'THE WHOLE WEEK! Spin time! 🎰',
}

export default function DayCompleteModal({ todayKey, completedDays, onClose, onSpinWheel }) {
  const allWeekDone = completedDays.size === 5

  useEffect(() => {
    const t = setTimeout(() => fireAllDoneConfetti(), 250)
    const stop = startConfettiRain()
    return () => { clearTimeout(t); stop() }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        background: 'radial-gradient(ellipse at center, #059669 0%, #1d4ed8 55%, #0f0524 100%)',
      }}
    >
      {/* Floating decorations */}
      {['⭐', '🌟', '✨', '💫', '🎉'].map((e, i) => (
        <motion.span
          key={i}
          className="fixed text-3xl pointer-events-none"
          style={{ left: `${8 + i * 20}%`, top: `${5 + (i % 3) * 12}%` }}
          animate={{ y: [0, -15, 0], rotate: [0, 20, -20, 0] }}
          transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
        >
          {e}
        </motion.span>
      ))}

      <motion.div
        className="text-8xl mb-3"
        animate={{ scale: [1, 1.15, 1], rotate: [-5, 5, -5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {allWeekDone ? '🏆' : '✅'}
      </motion.div>

      <motion.div
        className="text-white text-4xl text-center mb-1"
        style={{ fontFamily: "'Fredoka One', cursive", textShadow: '0 0 24px rgba(255,255,255,0.5)' }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        👧 Team Complete! 👦
      </motion.div>

      <motion.div
        className="text-yellow-300 text-xl font-black mb-1"
        style={{ fontFamily: "'Nunito', sans-serif", textShadow: '0 0 10px rgba(255,213,0,0.7)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {DAY_LABELS[todayKey]} is done! 🎉
      </motion.div>

      <motion.div
        className="text-white/60 text-base font-bold mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {LINES[todayKey]}
      </motion.div>

      {/* Week tracker — big, animated */}
      <motion.div
        className="mb-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
      >
        <WeekTracker
          completedDays={completedDays}
          todayKey={todayKey}
          animateToday
          size="lg"
        />
      </motion.div>

      {allWeekDone ? (
        <motion.button
          onClick={onSpinWheel}
          className="px-10 py-4 rounded-full text-white text-2xl shadow-2xl"
          style={{
            fontFamily: "'Fredoka One', cursive",
            background: 'linear-gradient(135deg, #FFD700, #FF6347)',
          }}
          animate={{
            boxShadow: [
              '0 0 15px rgba(255,200,0,0.4)',
              '0 0 45px rgba(255,200,0,1.0)',
              '0 0 15px rgba(255,200,0,0.4)',
            ],
          }}
          transition={{ duration: 1.2, repeat: Infinity }}
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0, opacity: 0 }}
          // need to override initial with animate:
        >
          🎰 SPIN THE WHEEL!
        </motion.button>
      ) : (
        <motion.button
          onClick={onClose}
          className="bg-white text-purple-700 px-10 py-4 rounded-full text-2xl shadow-2xl"
          style={{ fontFamily: "'Fredoka One', cursive", boxShadow: '0 0 20px rgba(255,255,255,0.3)' }}
          whileTap={{ scale: 0.92 }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9, type: 'spring' }}
        >
          {5 - completedDays.size} day{5 - completedDays.size !== 1 ? 's' : ''} to go! 💪
        </motion.button>
      )}
    </motion.div>
  )
}
