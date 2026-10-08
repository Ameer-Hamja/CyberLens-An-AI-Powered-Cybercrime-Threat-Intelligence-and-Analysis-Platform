import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchAllIncidents } from "../api/incidents";
import { useResource } from "../hooks/useResource";
import { useSocket } from "./WebSocketContext";
const IntelligenceContext = createContext(null);
export function IntelligenceProvider({ children }) {
  const resource = useResource(fetchAllIncidents);
  const { setData } = resource;
  const { subscribe } = useSocket();
  const [alerts, setAlerts] = useState([]),
    [unread, setUnread] = useState(0);
  useEffect(
    () =>
      subscribe("/topic/threats", (incident) => {
        if (!incident?.id) return;
        setData((previous) =>
          previous
            ? [incident, ...previous.filter((item) => item.id !== incident.id)]
            : [incident],
        );
        setAlerts((previous) =>
          [
            incident,
            ...previous.filter((item) => item.id !== incident.id),
          ].slice(0, 20),
        );
        setUnread((previous) => previous + 1);
      }),
    [subscribe, setData],
  );
  const markRead = useCallback(() => setUnread(0), []);
  const value = useMemo(
    () => ({
      ...resource,
      incidents: resource.data || [],
      alerts,
      unread,
      markRead,
    }),
    [resource, alerts, unread, markRead],
  );
  return (
    <IntelligenceContext.Provider value={value}>
      {children}
    </IntelligenceContext.Provider>
  );
}
export const useIntelligence = () => useContext(IntelligenceContext);
