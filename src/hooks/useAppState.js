import { useState, useEffect, useCallback } from 'react'
import * as api from '../api.js'

export function useAppState() {
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getState()
      const checkedMap = new Map()
      for (const [kidId, choreIds] of Object.entries(data.checked || {})) {
        checkedMap.set(Number(kidId), new Set(choreIds.map(Number)))
      }
      setState({
        ...data,
        checked: checkedMap,
        completedDays: new Set(data.completedDays),
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const toggle = useCallback((kidId, choreId) => {
    setState(prev => {
      if (!prev) return prev
      const newChecked = new Map(prev.checked)
      const kidSet = new Set(newChecked.get(kidId) || [])
      if (kidSet.has(choreId)) kidSet.delete(choreId)
      else kidSet.add(choreId)
      newChecked.set(kidId, kidSet)
      return { ...prev, checked: newChecked }
    })
    api.toggleChore(kidId, choreId).catch(console.error)
  }, [])

  const markDayComplete = useCallback((dayKey) => {
    setState(prev => {
      if (!prev) return prev
      const days = new Set(prev.completedDays)
      days.add(dayKey)
      return { ...prev, completedDays: days }
    })
    api.markDayComplete(dayKey).catch(console.error)
  }, [])

  const markWheelSpun = useCallback(() => {
    setState(prev => prev ? { ...prev, wheelSpun: true } : prev)
    api.markWheelSpun().catch(console.error)
  }, [])

  const refresh = useCallback(() => load(), [load])

  return { state, loading, error, toggle, markDayComplete, markWheelSpun, refresh }
}
