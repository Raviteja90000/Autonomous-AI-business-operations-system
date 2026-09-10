import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

type WebSocketEventHandler = (eventData: any) => void;

interface WebSocketContextType {
  isConnected: boolean;
  lastEvent: any;
  subscribe: (eventType: string, handler: WebSocketEventHandler) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const subscribersRef = useRef<Map<string, Set<WebSocketEventHandler>>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimeout: any;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/events`;
      
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (msg) => {
          try {
            const parsed = JSON.parse(msg.data);
            setLastEvent(parsed);
            
            // Trigger subscribers
            const handlers = subscribersRef.current.get(parsed.type);
            if (handlers) {
              handlers.forEach((h) => h(parsed.data));
            }
            const allHandlers = subscribersRef.current.get('*');
            if (allHandlers) {
              allHandlers.forEach((h) => h(parsed));
            }
          } catch (e) {
            // ignore malformed
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (e) {
        reconnectTimeout = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const subscribe = (eventType: string, handler: WebSocketEventHandler) => {
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, new Set());
    }
    subscribersRef.current.get(eventType)!.add(handler);

    return () => {
      const handlers = subscribersRef.current.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, lastEvent, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
