import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppState } from './hooks/useAppState.js'
import WelcomeScreen from './WelcomeScreen.jsx'
import LoginScreen from './LoginScreen.jsx'
import App from './App.jsx'
import ParentSettings from './ParentSettings.jsx'
import SwitchKidModal from './components/SwitchKidModal.jsx'
import AppIntroModal from './components/AppIntroModal.jsx'
import * as api from './api.js'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #0f0524 0%, #1a0a3d 40%, #0d1a3d 100%)' }}>
      <motion.div className="text-6xl"
        animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
        ⭐
      </motion.div>
      <div className="text-white/40 text-lg mt-4 font-bold" style={{ fontFamily: "'Nunito', sans-serif" }}>
        Loading...
      </div>
    </div>
  )
}

function ErrorScreen({ error, onRetry }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center"
      style={{ background: 'linear-gradient(160deg, #0f0524 0%, #1a0a3d 40%, #0d1a3d 100%)' }}>
      <div className="text-5xl mb-4">😵</div>
      <div className="text-white text-xl font-black mb-2" style={{ fontFamily: "'Fredoka One', cursive" }}>
        Couldn't connect to the server
      </div>
      <div className="text-white/40 text-sm mb-6 max-w-xs">{error}</div>
      <button onClick={onRetry}
        className="px-8 py-3 rounded-2xl text-white font-black"
        style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', fontFamily: "'Fredoka One', cursive" }}>
        Try Again
      </button>
    </div>
  )
}

export default function Root() {
  const [authLoading, setAuthLoading] = useState(true)
  const [auth, setAuth] = useState(null)
  const [showIntro, setShowIntro] = useState(false)

  const refreshAuth = useCallback(() => {
    return api.getAuthStatus().then(setAuth).catch(() => setAuth({ loggedIn: false }))
  }, [])

  useEffect(() => {
    refreshAuth().finally(() => setAuthLoading(false))
  }, [refreshAuth])

  useEffect(() => {
    if (auth?.loggedIn && !auth.introSeen) setShowIntro(true)
  }, [auth])

  const { state, loading, error, toggle, markDayComplete, markWheelSpun, refresh } = useAppState(!!auth?.loggedIn)
  const [screen, setScreen] = useState('welcome')
  const [screenBeforeParent, setScreenBeforeParent] = useState('welcome')
  const [isParent, setIsParent] = useState(false)
  const [showStartPin, setShowStartPin] = useState(false)
  const [startKidId, setStartKidId] = useState(null)

  const openParent = () => { setScreenBeforeParent(screen); setScreen('parent') }

  if (authLoading) return <LoadingScreen />

  if (!auth?.loggedIn) {
    return <LoginScreen onSuccess={() => refreshAuth().then(() => setScreen('welcome'))} />
  }

  const closeIntro = () => {
    setShowIntro(false)
    api.seenIntro().then(() => setAuth(a => ({ ...a, introSeen: true })))
  }

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen error={error} onRetry={refresh} />

  let screenEl
  if (screen === 'welcome') {
    const hasPins = state.kids.some(k => k.pin)
    const handleStart = () => {
      if (hasPins) { setShowStartPin(true) }
      else { setScreen('app') }
    }
    screenEl = (
      <>
        <WelcomeScreen kids={state.kids} onStart={handleStart} onOpenParent={openParent} />
        <AnimatePresence>
          {showStartPin && (
            <SwitchKidModal
              kids={state.kids}
              onSuccess={(kidId) => { setStartKidId(kidId); setShowStartPin(false); setScreen('app') }}
              onCancel={() => setShowStartPin(false)}
              canCancel
            />
          )}
        </AnimatePresence>
      </>
    )
  } else if (screen === 'parent') {
    screenEl = (
      <ParentSettings
        state={state}
        isParent={isParent}
        setIsParent={setIsParent}
        onClose={() => setScreen(screenBeforeParent)}
        onRefresh={refresh}
        onShowIntro={() => setShowIntro(true)}
        onLoggedOut={() => refreshAuth()}
      />
    )
  } else {
    screenEl = (
      <App
        state={state}
        toggle={toggle}
        markDayComplete={markDayComplete}
        markWheelSpun={markWheelSpun}
        refresh={refresh}
        onOpenParent={openParent}
        initialKidId={startKidId}
      />
    )
  }

  return (
    <>
      {screenEl}
      <AnimatePresence>
        {showIntro && <AppIntroModal onClose={closeIntro} />}
      </AnimatePresence>
    </>
  )
}
