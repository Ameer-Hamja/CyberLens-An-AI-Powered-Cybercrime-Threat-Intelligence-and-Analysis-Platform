export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'
export const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws'
export const THREAT_TYPES = ['PHISHING','UPI_FRAUD','KYC_SCAM','OTP_THEFT','SIM_SWAP','RANSOMWARE','VISHING','OTHER']
export const SEVERITY_LABELS = { 1:'Very Low',2:'Low',3:'Medium',4:'High',5:'Critical' }
export const SOURCE_LABELS = { CERT_IN:'CERT-In',CYBERCRIME_GOV:'Cybercrime.gov.in',TWITTER:'Social Media',MANUAL:'Manual' }
export const REFRESH_INTERVALS = { STATS:60000, HEATMAP:300000, TRENDS:600000 }
