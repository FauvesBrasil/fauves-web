import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { ensureApiBase } from '@/lib/apiBase';

export type TicketRealtimeUpdate = {
  ticketId: string;
  eventId: string | null;
  status: string | null;
  used: boolean;
  usedAt: string | null;
};

type UseTicketRealtimeOptions = {
  enabled: boolean;
  onUpdate: (update: TicketRealtimeUpdate) => void;
  onReconnect?: () => void;
};

export function useTicketRealtime({
  enabled,
  onUpdate,
  onReconnect,
}: UseTicketRealtimeOptions) {
  const updateRef = useRef(onUpdate);
  const reconnectRef = useRef(onReconnect);

  useEffect(() => {
    updateRef.current = onUpdate;
    reconnectRef.current = onReconnect;
  }, [onUpdate, onReconnect]);

  useEffect(() => {
    if (!enabled) return;

    const token = window.localStorage.getItem('AUTH_TOKEN_V1');
    if (!token) return;

    let cancelled = false;
    let connectedOnce = false;
    let socket: Socket | null = null;

    const connect = async () => {
      const apiBase = await ensureApiBase();
      if (cancelled) return;

      socket = io(`${apiBase.replace(/\/$/, '')}/tickets`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnectionDelay: 1_000,
        reconnectionDelayMax: 15_000,
        timeout: 8_000,
      });

      socket.on('ticket:updated', (update: TicketRealtimeUpdate) => {
        updateRef.current(update);
      });

      socket.on('connect', () => {
        if (connectedOnce) reconnectRef.current?.();
        connectedOnce = true;
      });
    };

    void connect();

    return () => {
      cancelled = true;
      socket?.removeAllListeners();
      socket?.disconnect();
    };
  }, [enabled]);
}
