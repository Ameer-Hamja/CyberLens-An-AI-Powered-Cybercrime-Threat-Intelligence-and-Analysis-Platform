import { createContext, useContext } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
const WebSocketContext = createContext(null)
export function WebSocketProvider({ children }) { const socket=useWebSocket(); return <WebSocketContext.Provider value={socket}>{children}</WebSocketContext.Provider> }
export const useSocket = () => useContext(WebSocketContext)
