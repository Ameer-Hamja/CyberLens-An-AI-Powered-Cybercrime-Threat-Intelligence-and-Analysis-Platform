import { useCallback, useEffect, useState } from 'react'
import { fetchStats } from '../api/stats'
import { REFRESH_INTERVALS } from '../utils/constants'
import { useSocket } from '../context/WebSocketContext'
export function useStats(){const [stats,setStats]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(null),socket=useSocket();const load=useCallback(async()=>{try{const data=await fetchStats();setStats(data);setError(null)}catch{setError('Failed to load statistics')}finally{setLoading(false)}},[]);useEffect(()=>{load();const timer=setInterval(load,REFRESH_INTERVALS.STATS);return()=>clearInterval(timer)},[load]);useEffect(()=>socket?.subscribe('/topic/stats',data=>data&&setStats(previous=>({...previous,...data}))),[socket]);return{stats,loading,error,reload:load}}
