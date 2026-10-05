import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLiveThreats } from '../api/threats'
import { useSocket } from '../context/WebSocketContext'
export function useLiveThreats(maxItems = 50) {
  const [threats, setThreats] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(null), [newIds, setNewIds] = useState(new Set())
  const socket = useSocket()
  const timers = useRef(new Set())
  const mounted = useRef(false)
  const latestEvent = useRef(0)
  const load = useCallback(async () => {
    const snapshot = latestEvent.current
    try {
      const data = await fetchLiveThreats({ page: 0, size: maxItems })
      if (!mounted.current) return
      if (snapshot === latestEvent.current) setThreats(data?.content || [])
      setError(null)
    } catch { if (mounted.current) setError('Failed to load threats') }
    finally { if (mounted.current) setLoading(false) }
  }, [maxItems])
  useEffect(() => {
    mounted.current = true
    const activeTimers = timers.current
    load()
    const poll = setInterval(load, 30000)
    return () => { mounted.current = false; clearInterval(poll); activeTimers.forEach(clearTimeout); activeTimers.clear() }
  }, [load])
  useEffect(() => socket?.subscribe('/topic/threats', threat => {
    if (!threat?.id) return
    latestEvent.current++
    setThreats(previous => previous.some(item => item.id === threat.id) ? previous : [threat, ...previous].slice(0, maxItems))
    setNewIds(previous => new Set(previous).add(threat.id))
    const timer = setTimeout(() => { timers.current.delete(timer); setNewIds(previous => { const next = new Set(previous); next.delete(threat.id); return next }) }, 3500)
    timers.current.add(timer)
  }), [socket, maxItems])
  return { threats, loading, error, newIds, reload: load }
}
