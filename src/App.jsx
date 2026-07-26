import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ChoreItem from './components/ChoreItem'
import WeekTracker from './components/WeekTracker'
import DayCompleteModal from './components/DayCompleteModal'
import AllDoneModal from './components/AllDoneModal'
import JobsDoneModal from './components/JobsDoneModal'
import PinModal from './components/PinModal'
import SwitchKidModal from './components/SwitchKidModal'
import MorningBackground from './components/MorningBackground'
import { playAllDone } from './utils/sounds'
import { haptics } from './utils/haptics.js'
import * as api from './api.js'

const NIGHT_BG = 'linear-gradient(160deg, #0f0524 0%, #1a0a3d 40%, #0d1a3d 100%)'

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri']

function getTodayKey() {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][new Date().getDay()]
}

function getTimeSlot() {
  return new Date().getHours() < 12 ? 'morning' : 'evening'
}

export default function App({ state, toggle, markDayComplete, markWheelSpun, refresh, onOpenParent, initialKidId }) {
  const { kids, chores, prizes, checked, completedDays, wheelSpun } = state

  const [activeKidId, setActiveKidId] = useState(initialKidId ?? kids[0]?.id ?? null)
  const [showDayModal, setShowDayModal] = useState(false)
  const [showWheelModal, setShowWheelModal] = useState(false)
  const [showJobsDoneModal, setShowJobsDoneModal] = useState(false)
  const [jobsDoneKidId, setJobsDoneKidId] = useState(null)
  const [pinTargetKidId, setPinTargetKidId] = useState(null)
  const [showSwitchModal, setShowSwitchModal] = useState(false)
  const [direction, setDirection] = useState(1)

  const todayKey = getTodayKey()
  const isWeekday = WEEKDAYS.includes(todayKey)
  const canSpin = completedDays.size === 5 && !wheelSpun

  const timeSlot = getTimeSlot()
  const activeChores = chores.filter(c => c.time_of_day === timeSlot || c.time_of_day === 'both')
  const hasTimedChores = chores.some(c => c.time_of_day !== 'both')

  const kidActiveCount = (kidId) => {
    const s = checked.get(kidId) || new Set()
    return activeChores.filter(c => s.has(c.id)).length
  }

  const handleToggle = (kidId, choreId) => {
    const chore = activeChores.find(c => c.id === choreId)
    const checkSlot = chore?.time_of_day || 'both'
    const currentSet = checked.get(kidId) || new Set()
    const willCheck = !currentSet.has(choreId)
    haptics.tap()

    if (willCheck && chore) {
      const currentDone = activeChores.filter(c => currentSet.has(c.id)).length
      const willBeDone = currentDone + 1 === activeChores.length

      if (willBeDone && activeChores.length > 0) {
        const wouldAllDone = kids.every(k => {
          if (k.id === kidId) return true
          return kidActiveCount(k.id) === activeChores.length
        })

        toggle(kidId, choreId, checkSlot)

        if (wouldAllDone && isWeekday && !completedDays.has(todayKey)) {
          markDayComplete(todayKey)
          setTimeout(() => { playAllDone(); haptics.success(); setShowDayModal(true) }, 400)
        } else {
          setTimeout(() => { setJobsDoneKidId(kidId); setShowJobsDoneModal(true) }, 400)
        }
        return
      }
    }

    toggle(kidId, choreId, checkSlot)
  }

  const resetDay = async () => {
    await api.resetDay()
    refresh()
  }

  const switchKid = (kidId) => {
    if (kidId === activeKidId) return
    const targetKid = kids.find(k => k.id === kidId)
    if (targetKid?.pin) {
      setPinTargetKidId(kidId)
      return
    }
    doSwitch(kidId)
  }

  const doSwitch = (kidId) => {
    const ci = kids.findIndex(k => k.id === activeKidId)
    const ni = kids.findIndex(k => k.id === kidId)
    setDirection(ni > ci ? 1 : -1)
    setActiveKidId(kidId)
  }

  if (!kids.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center"
        style={{ background: 'linear-gradient(160deg, #0f0524 0%, #1a0a3d 40%, #0d1a3d 100%)', fontFamily: "'Nunito', sans-serif" }}>
        <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
        <div className="text-white text-xl font-black mb-4" style={{ fontFamily: "'Fredoka One', cursive" }}>
          No kids added yet
        </div>
        <button onClick={onOpenParent}
          className="px-8 py-3 rounded-2xl text-white font-black"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', fontFamily: "'Fredoka One', cursive" }}>
          Open Parent Settings
        </button>
      </div>
    )
  }

  const kid = kids.find(k => k.id === activeKidId) || kids[0]
  const kidChecked = checked.get(kid.id) || new Set()
  const progress = activeChores.filter(c => kidChecked.has(c.id)).length
  const total = activeChores.length
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const jobsDoneKid = jobsDoneKidId ? kids.find(k => k.id === jobsDoneKidId) : null
  const showMorningScene = hasTimedChores && timeSlot === 'morning'

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: showMorningScene ? 'transparent' : NIGHT_BG, fontFamily: "'Nunito', sans-serif" }}
    >
      {showMorningScene ? (
        <MorningBackground />
      ) : (
        /* Twinkling stars */
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div key={i} className="absolute rounded-full bg-white"
              style={{ width: (i % 3) + 1, height: (i % 3) + 1, left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, opacity: 0.3 }}
              animate={{ opacity: [0.1, 0.7, 0.1] }}
              transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: (i * 0.3) % 3 }}
            />
          ))}
        </div>
      )}

      {/* Kid's accent colour tint */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: kid.accent_color || '#8b5cf6', opacity: 0.14, transition: 'background 0.5s ease', zIndex: 1 }} />

      {/* Header */}
      <div className="relative z-10 text-center pt-6 pb-1 px-4">
        <div className="flex items-center justify-center relative">
          <motion.div
            className="text-white text-4xl tracking-wide"
            style={{ fontFamily: "'Fredoka One', cursive", textShadow: '0 0 24px rgba(200,100,255,0.7)' }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ⭐ Chore Stars ⭐
          </motion.div>
          <button onClick={onOpenParent}
            className="absolute right-0 text-white/30 hover:text-white/70 text-xl transition-colors"
            style={{ lineHeight: 1 }}>
            🔒
          </button>
        </div>
        <div className="text-white/50 text-sm mt-1 font-bold">{today}</div>
      </div>

      {/* Week tracker strip */}
      <div className="relative z-10 px-4 pt-3 pb-1">
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: 'rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.12)', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }}
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

        {canSpin && (
          <motion.button
            onClick={() => setShowWheelModal(true)}
            className="w-full mt-2 py-3 rounded-2xl text-white text-xl"
            style={{ fontFamily: "'Fredoka One', cursive", background: 'linear-gradient(135deg, #FFD700, #FF6347)' }}
            animate={{ boxShadow: ['0 0 12px rgba(255,200,0,0.4)', '0 0 32px rgba(255,200,0,0.9)', '0 0 12px rgba(255,200,0,0.4)'] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            whileTap={{ scale: 0.96 }}
          >
            🎰 SPIN THE WHEEL!
          </motion.button>
        )}
      </div>

      {/* Kid tabs */}
      <div className="relative z-10 flex gap-3 px-4 pt-3 pb-1">
        {kids.some(k => k.pin) && (
          <motion.button
            onClick={() => setShowSwitchModal(true)}
            className="flex items-center justify-center rounded-2xl text-2xl flex-shrink-0"
            style={{
              width: 56, height: 56,
              background: 'rgba(0,0,0,0.25)',
              border: '2px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
            whileTap={{ scale: 0.9 }}
            animate={{ boxShadow: ['0 4px 16px rgba(139,92,246,0.2)', '0 4px 24px rgba(139,92,246,0.6)', '0 4px 16px rgba(139,92,246,0.2)'] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            🔒
          </motion.button>
        )}
        {kids.map((k) => {
          const isActive = k.id === activeKidId
          const kidDone = activeChores.length > 0 && kidActiveCount(k.id) === activeChores.length
          return (
            <motion.button
              key={k.id}
              onClick={() => switchKid(k.id)}
              className="flex-1 py-3 rounded-2xl text-xl flex items-center justify-center gap-2"
              style={isActive
                ? { background: `linear-gradient(to right, ${k.tab_from}, ${k.tab_to})`, color: 'white', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }
                : { background: 'rgba(0,0,0,0.15)', color: 'rgba(255,255,255,0.65)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
              }
              whileTap={{ scale: 0.95 }}
            >
              <KidAvatar kid={k} size={28} />
              <span style={{ fontFamily: "'Fredoka One', cursive" }}>{k.name}</span>
              {kidDone && (
                <motion.span
                  animate={{ scale: [1, 1.35, 1], rotate: [-5, 5, -5] }}
                  transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.8 }}
                >
                  🏆
                </motion.span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 px-4 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={kid.id}
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          >
            {/* Kid header card */}
            <div
              className="rounded-3xl p-4 mb-4 mt-2"
              style={{ background: `linear-gradient(135deg, ${kid.color_from}, ${kid.color_to})`, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            >
              <div className="flex items-center gap-3 mb-3">
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                  <KidAvatar kid={kid} size={52} />
                </motion.div>
                <div>
                  <div className="text-white text-2xl" style={{ fontFamily: "'Fredoka One', cursive" }}>
                    {kid.name}'s Chores
                  </div>
                  <div className="text-white/70 text-sm font-bold">
                    {progress} of {total} done{progress === total && total > 0 ? ' 🎉' : ''}
                  </div>
                </div>
                <div className="ml-auto flex gap-1 flex-wrap justify-end" style={{ maxWidth: 80 }}>
                  {activeChores.map((_, i) => (
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
              {hasTimedChores && (
                <ChoreSection label={timeSlot === 'morning' ? '🌅 Morning Chores' : '🌙 Evening Chores'} />
              )}
              {activeChores.map((chore, i) => (
                <ChoreRow key={chore.id} chore={chore} i={i} kidChecked={kidChecked} kidId={kid.id} handleToggle={handleToggle} />
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
        {showSwitchModal && (
          <SwitchKidModal
            key="switch"
            kids={kids}
            onSuccess={(kidId) => { setShowSwitchModal(false); doSwitch(kidId) }}
            onCancel={() => setShowSwitchModal(false)}
          />
        )}
        {pinTargetKidId && (
          <PinModal
            key="pin"
            kid={kids.find(k => k.id === pinTargetKidId)}
            onSuccess={() => { const id = pinTargetKidId; setPinTargetKidId(null); doSwitch(id) }}
            onCancel={() => setPinTargetKidId(null)}
          />
        )}
        {showJobsDoneModal && jobsDoneKid && (
          <JobsDoneModal
            key="jobs-done"
            kid={jobsDoneKid}
            onClose={() => { setShowJobsDoneModal(false); setJobsDoneKidId(null) }}
          />
        )}
        {showDayModal && (
          <DayCompleteModal
            key="day"
            todayKey={todayKey}
            completedDays={completedDays}
            kids={kids}
            onClose={() => setShowDayModal(false)}
            onSpinWheel={() => { setShowDayModal(false); setTimeout(() => setShowWheelModal(true), 300) }}
          />
        )}
        {showWheelModal && (
          <AllDoneModal
            key="wheel"
            sections={prizes}
            kids={kids}
            onClose={() => { setShowWheelModal(false); markWheelSpun() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ChoreSection({ label }) {
  return (
    <div className="flex items-center gap-3 mt-2 mb-1">
      <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.15)' }} />
      <span className="text-white/50 text-xs font-black uppercase tracking-widest">{label}</span>
      <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.15)' }} />
    </div>
  )
}

function ChoreRow({ chore, i, kidChecked, kidId, handleToggle }) {
  return (
    <motion.div
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: i * 0.05, type: 'spring', stiffness: 400 }}
    >
      <ChoreItem
        chore={chore}
        checked={kidChecked.has(chore.id)}
        onToggle={() => handleToggle(kidId, chore.id)}
      />
    </motion.div>
  )
}

function KidAvatar({ kid, size }) {
  const style = {
    width: size,
    height: size,
    borderRadius: size * 0.3,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.55,
    fontWeight: 900,
    color: 'white',
    flexShrink: 0,
  }
  if (kid.avatar_url) {
    return <div style={style}><img src={kid.avatar_url} alt={kid.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
  }
  return <div style={{ ...style, background: kid.accent_color || '#8b5cf6' }}>{kid.name[0]}</div>
}
