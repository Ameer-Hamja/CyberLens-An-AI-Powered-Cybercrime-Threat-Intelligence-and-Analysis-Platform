import api from './axios'
const data = promise => promise.then(response => response.data.data)
export const fetchStats = () => data(api.get('/api/stats'))
export const fetchStatsByType = () => data(api.get('/api/stats/by-type'))
