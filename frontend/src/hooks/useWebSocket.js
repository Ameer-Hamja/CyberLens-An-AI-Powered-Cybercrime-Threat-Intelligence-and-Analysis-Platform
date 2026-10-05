import { useCallback, useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { WS_URL } from '../utils/constants'
export function useWebSocket() { const clientRef=useRef(null), callbacks=useRef(new Map()), subscriptions=useRef(new Map()); const [connected,setConnected]=useState(false),[error,setError]=useState(null)
  const wire = useCallback((topic,callback) => { const client=clientRef.current; if (!client?.connected) return; subscriptions.current.get(topic)?.unsubscribe(); subscriptions.current.set(topic,client.subscribe(topic,msg=>{ let payload=msg.body; try { payload=JSON.parse(msg.body) } catch { /* Keep non-JSON messages as text. */ } callback(payload) })) },[])
  useEffect(()=>{ const activeSubscriptions=subscriptions.current; const client=new Client({ webSocketFactory:()=>new SockJS(WS_URL), reconnectDelay:5000, heartbeatIncoming:4000, heartbeatOutgoing:4000, onConnect:()=>{setConnected(true);setError(null);callbacks.current.forEach((callback,topic)=>wire(topic,callback))}, onDisconnect:()=>setConnected(false), onWebSocketClose:()=>setConnected(false), onStompError:()=>{setConnected(false);setError('WebSocket connection failed')} }); clientRef.current=client; client.activate(); return ()=>{ activeSubscriptions.forEach(s=>s.unsubscribe()); activeSubscriptions.clear(); client.deactivate() } },[wire])
  const subscribe=useCallback((topic,callback)=>{ callbacks.current.set(topic,callback); wire(topic,callback); return ()=>{ callbacks.current.delete(topic); subscriptions.current.get(topic)?.unsubscribe(); subscriptions.current.delete(topic) } },[wire])
  return {connected,error,subscribe}
}
