import axios from 'axios'
import { API_BASE } from '../utils/constants'
const api = axios.create({ baseURL: API_BASE, timeout:15000, headers:{'Content-Type':'application/json'} })
api.interceptors.request.use(config => { const token=localStorage.getItem('crimelens_token'); if(token) config.headers.Authorization=`Bearer ${token}`; return config })
export default api
