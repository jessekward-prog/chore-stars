import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChoreItem from './components/ChoreItem'
import WeekTracker from './components/WeekTracker'
import DayCompleteModal from './components/DayCompleteModal'
import AllDoneModal from './components/AllDoneModal'
import { playAllDone } from './utils/sounds'

const CHORES = [
  {
    id: 'wake',
    emoji: '🌞',
    label: 'Wake Up & Stretch',
    bg: 'bg-gradient-to-r from-yellow-400 to-orange-400',
    checkedBg: 'bg-gradient-to-r from-yellow-600 to-orange-600',
    checkColor: '#ea580c',
  },
  {
    id: 'dress',
    emoji: '👕',
    label: 'Get Dressed',
    bg: 'bg-gradient-to-r from-violet-400 to-fuchsia-500',
    checkedBg: 'bg-gradient-to-r from-violet-700 to-fuchsia-700',
    checkColor: '#7c3aed',
  },
  {
    id: 'breakfast',
    emoji: '🥣',
    label: 'Eat Breakfast',
    bg: 'bg-gradient-to-r from-emerald-400 to-teal-400',
    checkedBg: 'bg-gradient-to-r from-emerald-700 to-teal-700',
    checkColor: '#047857',
  },
  {
    id: 'teeth',
    emoji: '🦷',
    label: 'Brush Teeth',
    bg: 'bg-gradient-to-r from-sky-400 to-cyan-400',
    checkedBg: 'bg-gradient-to-r from-sky-700 to-cyan-700',
    checkColor: '#0369a1',
  },
  {
    id: 'bed',
    emoji: '🛏️',
    label: 'Make Your Bed',
    bg: 'bg-gradient-to-r from-pink-400 to-rose-400',
    checkedBg: 'bg-gradient-to-r from-pink-700 to-rose-700',
    checkColor: '#be185d',
  },
  {
    id: 'bag',
    emoji: '🎒',
    label: 'Pack Your Bag',
    bg: 'bg-gradient-to-r from-orange-400 to-red-500',
    checkedBg: 'bg-gradient-to-r from-orange-700 to-red-700',
    checkColor: '#b91c1c',
  },
]

const KIDS = [
  { id: 'peyton', name: 'Peyton', avatar: '👧', color: 'from-pink-500 to-purple-600', tab: 'from-fuchsia-500 to-purple-600' },
  { id: 'jude',   name: 'Jude',   avatar: '👦', color: 'from-blue-500 to-cyan-500',   tab: 'from-blue-500 to-cyan-500'   },
]

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri']
const STORAGE_KEY = 'chore-chart-v3'

function getWeekStart() {
  const d = new Date()
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  mon.setHours(0, 0, 0, 0)
  return mon.toDateString()
}

function getTodayKey() {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()]
}

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    const today = new Date().toDateString()
    const thisWeek = getWeekStart()
    return {
      peyton: s.date === today ? (s.peyton || []) : [],
      jude:   s.date === today ? (s.jude   || []) : [],
      completedDays: s.weekStart === thisWeek ? new Set(s.completedDays || []) : new Set(),
      wheelSpun:     s.weekStart === thisWeek ? (s.wheelSpun || false) : false,
    }
  } catch {
    return { peyton: [], jude: [], completedDays: new Set(), wheelSpun: false }
  }
}

export default function App() {
  const [activeKid, setActiveKid] = useState('peyton')
  const initial = loadState()
  const [checked, setChecked] = useState({
    peyton: new Set(initial.peyton),
    jude:   new Set(initial.jude),
  })
  const [completedDays, setCompletedDays] = useState(initial.completedDays)
  const [wheelSpun, setWheelSpun] = useState(initial.wheelSpun)
  const [showDayModal, setShowDayModal] = useState(false)
  const [showWheelModal, setShowWheelModal] = useState(false)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      date: new Date().toDateString(),
      weekStart: getWeekStart(),
      peyton: [...checked.peyton],
      jude:   [...checked.jude],
      completedDays: [...completedDays],
      wheelSpun,
    }))
  }, [checked, completedDays, wheelSpun])

  const todayKey = getTodayKey()
  const isWeekday = WEEKDAYS.includes(todayKey)
  const canSpin = completedDays.size === 5 && !wheelSpun

  const toggle = (kid, choreId) => {
    const newSet = new Set(checked[kid])
    if (newSet.has(choreId)) {
      newSet.delete(choreId)
      setChecked({ ...checked, [kid]: newSet })
    } else {
      newSet.add(choreId)
      const other = kid === 'peyton' ? 'jude' : 'peyton'
      const bothDone = newSet.size === CHORES.length && checked[other].size === CHORES.length
      if (bothDone && isWeekday && !completedDays.has(todayKey)) {
        const newDays = new Set(completedDays)
        newDays.add(todayKey)
        setCompletedDays(newDays)
        setChecked({ ...checked, [kid]: newSet })
        setTimeout(() => { playAllDone(); setShowDayModal(true) }, 400)
      } else {
        setChecked({ ...checked, [kid]: newSet })
      }
    }
  }

  const resetDay = () => setChecked({ peyton: new Set(), jude: new Set() })

  const switchKid = (kidId) => {
    const ci = KIDS.findIndex(k => k.id === activeKid)
    const ni = KIDS.findIndex(k => k.id === kidId)
    setDirection(ni > ci ? 1 : -1)
    setActiveKid(kidId)
  }

  const kid = KIDS.find(k => k.id === activeKid)
  const kidChecked = checked[activeKid]
  const progress = kidChecked.size
  const total = CHORES.length
  const pct = Math.round((progress / total) * 100)
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0f0524 0%, #1a0a3d 40%, #0d1a3d 100%)', fontFamily: "'Nunito', sans-serif" }}
    >
      {/* Twinkling stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div key={i} className="absolute rounded-full bg-white"
            style={{ width: (i % 3) + 1, height: (i % 3) + 1, left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, opacity: 0.3 }}
            animate={{ opacity: [0.1, 0.7, 0.1] }}
            transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: (i * 0.3) % 3 }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 text-center pt-6 pb-1 px-4">
        <motion.div
          className="text-white text-4xl tracking-wide"
          style={{ fontFamily: "'Fredoka One', cursive", textShadow: '0 0 24px rgba(200,100,255,0.7)' }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          ⭐ Chore Stars ⭐
        </motion.div>
        <div className="text-white/50 text-sm mt-1 font-bold">{today}</div>
      </div>

      {/* Week tracker strip */}
      <div className="relative z-10 px-4 pt-3 pb-1">
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="text-white/40 text-xs font-black text-center mb-2 tracking-widest uppercase">
            This Week
          </div>
          <WeekTracker
            completedDays={completedDays}
            todayKey={isWeekday ? todayKey : null}
            animateToday={false}
            size="sm"
          />
        </div>

        {/* Spin button if unlocked */}
        {canSpin && (
          <motion.button
            onClick={() => setShowWheelModal(true)}
            className="w-full mt-2 py-3 rounded-2xl text-white text-xl"
            style={{
              fontFamily: "'Fredoka One', cursive",
              background: 'linear-gradient(135deg, #FFD700, #FF6347)',
            }}
            animate={{
              boxShadow: [
                '0 0 12px rgba(255,200,0,0.4)',
                '0 0 32px rgba(255,200,0,0.9)',
                '0 0 12px rgba(255,200,0,0.4)',
              ],
            }}
            transition={{ duration: 1.2, repeat: Infinity }}
            whileTap={{ scale: 0.96 }}
          >
            🎰 SPIN THE WHEEL!
          </motion.button>
        )}
      </div>

      {/* Kid tabs */}
      <div className="relative z-10 flex gap-3 px-4 pt-3 pb-1">
        {KIDS.map((k) => {
          const isActive = k.id === activeKid
          const kidDone = checked[k.id].size === CHORES.length
          return (
            <motion.button
              key={k.id}
              onClick={() => switchKid(k.id)}
              className={`flex-1 py-3 rounded-2xl text-xl flex items-center justify-center gap-2 ${
                isActive ? `bg-gradient-to-r ${k.tab} text-white shadow-lg` : 'bg-white/10 text-white/50'
              }`}
              whileTap={{ scale: 0.95 }}
              style={{ fontFamily: "'Fredoka One', cursive" }}
            >
              <span className="text-2xl">{kidDone ? '🏆' : k.avatar}</span>
              {k.name}
              {kidDone && (
                <motion.span
                  animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                  className="text-yellow-300"
                >✓</motion.span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 px-4 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeKid}
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          >
            {/* Kid header card */}
            <div className={`rounded-3xl bg-gradient-to-br ${kid.color} p-4 mb-4 mt-2`}
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <div className="flex items-center gap-3 mb-3">
                <motion.span className="text-5xl"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                  {kid.avatar}
                </motion.span>
                <div>
                  <div className="text-white text-2xl" style={{ fontFamily: "'Fredoka One', cursive" }}>
                    {kid.name}'s Chores
                  </div>
                  <div className="text-white/70 text-sm font-bold">
                    {progress} of {total} done{progress === total ? ' 🎉' : ''}
                  </div>
                </div>
                <div className="ml-auto flex gap-1 flex-wrap justify-end" style={{ maxWidth: 80 }}>
                  {CHORES.map((_, i) => (
                    <motion.div key={i}
                      className={`w-3 h-3 rounded-full ${i < progress ? 'bg-yellow-300' : 'bg-white/25'}`}
                      animate={i < progress ? { scale: [1, 1.4, 1] } : {}}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    />
                  ))}
                </div>
              </div>
              <div className="h-5 bg-black/25 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-yellow-300 rounded-full relative"
                  animate={{ width: `${pct}%` }}
                  transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                  style={{ boxShadow: '0 0 14px rgba(255,213,0,0.9)', minWidth: pct > 0 ? 16 : 0 }}
                >
                  {pct > 10 && (
                    <span className="absolute right-2 top-0 bottom-0 flex items-center text-xs font-black text-yellow-900">
                      {pct}%
                    </span>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Chore list */}
            <div className="flex flex-col gap-3">
              {CHORES.map((chore, i) => (
                <motion.div key={chore.id}
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 400 }}
                >
                  <ChoreItem
                    chore={chore}
                    checked={kidChecked.has(chore.id)}
                    onToggle={() => toggle(activeKid, chore.id)}
                  />
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={resetDay}
              className="w-full mt-5 py-3 rounded-2xl bg-white/10 text-white/50 font-bold text-sm"
              whileTap={{ scale: 0.96 }}
            >
              🌅 New Day — Reset Chores
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showDayModal && (
          <DayCompleteModal
            key="day"
            todayKey={todayKey}
            completedDays={completedDays}
            onClose={() => setShowDayModal(false)}
            onSpinWheel={() => { setShowDayModal(false); setTimeout(() => setShowWheelModal(true), 300) }}
          />
        )}
        {showWheelModal && (
          <AllDoneModal
            key="wheel"
            onClose={() => { setShowWheelModal(false); setWheelSpun(true) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
