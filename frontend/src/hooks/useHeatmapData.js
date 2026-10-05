import { useCallback, useEffect, useState } from 'react'
import { fetchHeatmapData } from '../api/threats'
import { REFRESH_INTERVALS } from '../utils/constants'
export function useHeatmapData(){const [data,setData]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(null);const load=useCallback(async()=>{try{const result=await fetchHeatmapData();setData(Array.isArray(result)?result:[]);setError(null)}catch{setError('Failed to load heatmap')}finally{setLoading(false)}},[]);useEffect(()=>{load();const timer=setInterval(load,REFRESH_INTERVALS.HEATMAP);return()=>clearInterval(timer)},[load]);return{data,loading,error,reload:load}}
