import api from './axios'
const data = promise => promise.then(response => response.data.data)
export const fetchLiveThreats = (params={}) => data(api.get('/api/threats/live',{params}))
export const fetchHeatmapData = () => data(api.get('/api/threats/heatmap'))
export const fetchTrends = (days=30) => data(api.get('/api/threats/trends',{params:{days}}))
export const fetchSummary = () => data(api.get('/api/threats/summary'))
export const searchThreats = (q,params={}) => data(api.get('/api/threats/search',{params:{q,...params}}))
export const fetchThreatById = id => data(api.get(`/api/threats/${id}`))
export const subscribe = payload => api.post('/api/threats/subscribe',payload).then(r=>r.data)
