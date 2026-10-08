import { useCallback, useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { WS_URL } from "../utils/constants";
export function useWebSocket() {
  const clientRef = useRef(null),
    callbacks = useRef(new Map()),
    subscriptions = useRef(new Map());
  const [connected, setConnected] = useState(false),
    [error, setError] = useState(null);
  const wire = useCallback((topic) => {
    const client = clientRef.current;
    if (!client?.connected || subscriptions.current.has(topic)) return;
    subscriptions.current.set(
      topic,
      client.subscribe(topic, (message) => {
        let payload = message.body;
        try {
          payload = JSON.parse(message.body);
        } catch {
          /* Text frames are valid. */
        }
        callbacks.current.get(topic)?.forEach((callback) => callback(payload));
      }),
    );
  }, []);
  useEffect(() => {
    const activeSubscriptions = subscriptions.current;
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        activeSubscriptions.clear();
        setConnected(true);
        setError(null);
        callbacks.current.forEach((_, topic) => wire(topic));
      },
      onWebSocketClose: () => {
        activeSubscriptions.clear();
        setConnected(false);
      },
      onStompError: () => {
        setConnected(false);
        setError("Live connection interrupted");
      },
    });
    clientRef.current = client;
    client.activate();
    return () => {
      activeSubscriptions.clear();
      client.deactivate();
    };
  }, [wire]);
  const subscribe = useCallback(
    (topic, callback) => {
      if (!callbacks.current.has(topic))
        callbacks.current.set(topic, new Set());
      callbacks.current.get(topic).add(callback);
      wire(topic);
      return () => {
        const group = callbacks.current.get(topic);
        group?.delete(callback);
        if (!group?.size) {
          callbacks.current.delete(topic);
          subscriptions.current.get(topic)?.unsubscribe();
          subscriptions.current.delete(topic);
        }
      };
    },
    [wire],
  );
  return { connected, error, subscribe };
}
