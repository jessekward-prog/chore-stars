import { motion } from 'framer-motion'

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
]

export default function WeekTracker({ completedDays, todayKey, animateToday = false, size = 'lg' }) {
  const lg = size === 'lg'
  const circleClass = lg ? 'w-14 h-14' : 'w-10 h-10'
  const iconClass = lg ? 'text-2xl' : 'text-base'
  const labelClass = lg ? 'text-sm' : 'text-xs'
  const gapClass = lg ? 'gap-3' : 'gap-2'

  return (
    <div className={`flex ${gapClass} justify-center items-end`}>
      {DAYS.map(({ key, label }, i) => {
        const done = completedDays.has(key)
        const isToday = key === todayKey
        const isNewlyDone = done && isToday && animateToday

        return (
          <div key={key} className="flex flex-col items-center gap-1">
            <motion.div
              className={`
                ${circleClass} rounded-full flex items-center justify-center border-4 relative
                ${done
                  ? 'bg-green-400 border-green-300'
                  : isToday
                    ? 'bg-white/20 border-yellow-400'
                    : 'bg-white/10 border-white/20'
                }
              `}
              animate={
                isNewlyDone
                  ? {
                      scale: [1, 2.2, 1.5, 1.6],
                      boxShadow: [
                        '0 0 0px rgba(74,222,128,0)',
                        '0 0 60px rgba(74,222,128,1)',
                        '0 0 30px rgba(74,222,128,0.7)',
                      ],
                    }
                  : {}
              }
              transition={{ duration: 0.75, delay: 0.25 }}
            >
              {done ? (
                <motion.span
                  className={`${iconClass} text-white font-black leading-none`}
                  initial={isNewlyDone ? { scale: 0, rotate: -120 } : false}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 450, delay: isNewlyDone ? 0.55 : 0 }}
                >
                  ✓
                </motion.span>
              ) : isToday ? (
                <motion.span
                  className={iconClass}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ⭐
                </motion.span>
              ) : (
                <span className={`${iconClass} text-white/20`}>·</span>
              )}
            </motion.div>
            <span
              className={`${labelClass} font-black ${
                done ? 'text-green-300' : isToday ? 'text-yellow-300' : 'text-white/30'
              }`}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
