import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLiveThreats } from '../api/threats'
import { useSocket } from '../context/WebSocketContext'
export function useLiveThreats(maxItems=50) { const [threats,setThreats]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(null),[newIds,setNewIds]=useState(new Set()); const ids=useRef(new Set()); const socket=useSocket()
 const load=useCallback(async()=>{try {setLoading(true);const data=await fetchLiveThreats({page:0,size:maxItems});const list=data?.content || [];ids.current=new Set(list.map(x=>x.id));setThreats(list);setError(null)}catch{setError('Failed to load threats')}finally{setLoading(false)}},[maxItems])
 useEffect(()=>{load()},[load]); useEffect(()=>socket?.subscribe('/topic/threats',threat=>{if(!threat?.id || ids.current.has(threat.id))return;ids.current.add(threat.id);setThreats(prev=>[threat,...prev].slice(0,maxItems));setNewIds(prev=>new Set(prev).add(threat.id));setTimeout(()=>setNewIds(prev=>{const next=new Set(prev);next.delete(threat.id);return next}),3500)}),[socket,maxItems]); return {threats,loading,error,newIds,reload:load} }
