import { useCallback, useEffect, useState } from 'react'
import { fetchTrends } from '../api/threats'
export function useTrends(days=30){const [data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState(null);const load=useCallback(async()=>{try{setLoading(true);setData(await fetchTrends(days));setError(null)}catch{setError('Failed to load trends')}finally{setLoading(false)}},[days]);useEffect(()=>{load()},[load]);return{data,loading,error,reload:load}}
