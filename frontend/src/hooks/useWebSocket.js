import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { WS_URL } from '../utils/constants'

export function useWebSocket() {
  const clientRef = useRef(null)
  const callbacks = useRef(new Map())
  const subscriptions = useRef(new Map())
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)
  const wire = useCallback(topic => {
    const client = clientRef.current
    if (!client?.connected || subscriptions.current.has(topic)) return
    subscriptions.current.set(topic, client.subscribe(topic, message => {
      let payload
      try { payload = JSON.parse(message.body) } catch { return }
      callbacks.current.get(topic)?.forEach(callback => callback(payload))
    }))
  }, [])
  useEffect(() => {
    const activeSubscriptions = subscriptions.current
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL), reconnectDelay: 5000,
      heartbeatIncoming: 4000, heartbeatOutgoing: 4000,
      onConnect: () => {
        activeSubscriptions.clear()
        setConnected(true); setError(null)
        callbacks.current.forEach((_, topic) => wire(topic))
      },
      onDisconnect: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
      onStompError: () => { setConnected(false); setError('Live connection unavailable') },
      onWebSocketError: () => { setConnected(false); setError('Live connection unavailable') },
    })
    clientRef.current = client
    client.activate()
    return () => { activeSubscriptions.clear(); clientRef.current = null; void client.deactivate() }
  }, [wire])
  const subscribe = useCallback((topic, callback) => {
    if (!callbacks.current.has(topic)) callbacks.current.set(topic, new Set())
    callbacks.current.get(topic).add(callback)
    wire(topic)
    return () => {
      const listeners = callbacks.current.get(topic)
      listeners?.delete(callback)
      if (!listeners?.size) {
        callbacks.current.delete(topic)
        subscriptions.current.get(topic)?.unsubscribe()
        subscriptions.current.delete(topic)
      }
    }
  }, [wire])
  return useMemo(() => ({ connected, error, subscribe }), [connected, error, subscribe])
}
