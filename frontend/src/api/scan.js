import api from './axios'

export const scanText = (inputText) =>
  api.post('/api/scan', { inputText })
     .then(r => r.data.data)

export const scanImage = (file) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/api/scan/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000
  }).then(r => {
    const data = r.data.data
    return {
      ...data,
      riskScore: data.risk_score,
      isDangerous: data.is_dangerous,
      ocrText: data.ocr_text,
      scanTextAnalysis: data.scam_text_analysis,
      processingTimeMs: data.processing_time_ms
    }
  })
}

export const fetchScanHistory = () =>
  api.get('/api/scan/history')
     .then(r => r.data.data)
