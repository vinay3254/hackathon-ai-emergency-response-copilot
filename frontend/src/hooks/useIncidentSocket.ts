import { useEffect, useRef } from 'react';
import { useIncidentStore } from '../store/incidentStore';

export function useIncidentSocket() {
  const { setWsConnected, addOrUpdateIncident } = useIncidentStore();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    function connect() {
      try {
        const ws = new WebSocket('ws://127.0.0.1:8000/ws/incidents');
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setWsConnected(true);
          console.log('[WebSocket] Connected to RescueAI dispatch stream');
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'INCIDENT_CREATED' && data.incident) {
              addOrUpdateIncident(data.incident);
            } else if (data.type === 'INCIDENT_CLASSIFIED') {
              addOrUpdateIncident({
                id: data.incident_id,
                transcript: data.transcript,
                classification: data.classification,
                emergency_type: data.classification?.emergency_type || 'other',
                severity: data.classification?.severity || 3,
                lat: data.classification?.lat || 12.9784,
                lng: data.classification?.lng || 77.6408,
                summary: data.classification?.summary || '',
                status: 'reported',
                created_at: new Date().toISOString()
              });
            }
          } catch (e) {
            console.error('[WebSocket] Failed to parse message', e);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setWsConnected(false);
          // Try reconnecting after 4s
          reconnectTimeoutRef.current = window.setTimeout(connect, 4000);
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setWsConnected(false);
        };
      } catch (err) {
        setWsConnected(false);
        reconnectTimeoutRef.current = window.setTimeout(connect, 4000);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [setWsConnected, addOrUpdateIncident]);
}
