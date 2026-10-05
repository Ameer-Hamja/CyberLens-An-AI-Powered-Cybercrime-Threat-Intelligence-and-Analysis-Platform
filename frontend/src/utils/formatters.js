import { formatDistanceToNow, format, parseISO } from 'date-fns'
const asDate = value => typeof value === 'string' ? parseISO(value) : new Date(value)
export const timeAgo = value => { try { return formatDistanceToNow(asDate(value), { addSuffix:true }) } catch { return 'Unknown time' } }
export const formatDate = (value, fmt='dd MMM yyyy') => { try { return format(asDate(value),fmt) } catch { return 'Unknown date' } }
export const formatNumber = value => { const num=Number(value)||0; return num>=1e6 ? `${(num/1e6).toFixed(1)}M` : num>=1e3 ? `${(num/1e3).toFixed(1)}K` : String(num) }
export const formatThreatType = type => ({ PHISHING:'Phishing',UPI_FRAUD:'UPI Fraud',KYC_SCAM:'KYC Scam',OTP_THEFT:'OTP Theft',SIM_SWAP:'SIM Swap',RANSOMWARE:'Ransomware',VISHING:'Vishing',OTHER:'Other' }[type] || type || 'Other')
export const formatConfidence = value => value == null ? 'N/A' : `${Math.round(value * 100)}%`
