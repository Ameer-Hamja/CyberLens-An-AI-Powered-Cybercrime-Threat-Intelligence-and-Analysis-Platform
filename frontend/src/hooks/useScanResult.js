import { useState, useCallback } from 'react'
import { scanText, scanImage } from '../api/scan'

export function useScanResult() {
  const [result,   setResult]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [scanType, setScanType] = useState(null)

  const scan = useCallback(async (type, payload) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setScanType(type)
    try {
      let data
      if (type === 'image') {
        data = await scanImage(payload)
      } else {
        data = await scanText(payload)
      }
      setResult(data)
    } catch (e) {
      const msg = e.response?.data?.error
               || e.response?.data?.message
               || 'Scan failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setScanType(null)
  }, [])

  return { result, loading, error, scanType, scan, reset }
}
