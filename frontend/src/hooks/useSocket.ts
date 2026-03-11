import { useEffect, useRef } from 'react';
import { connectSocket, disconnectSocket, joinSession, leaveSession } from '@/services/socket';
import { useAuthStore } from '@/stores/authStore';

export function useSocket() {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    } else {
      disconnectSocket();
    }
    return () => {};
  }, [isAuthenticated]);
}

export function useSessionSocket(sessionId: string | null) {
  const prevSessionId = useRef<string | null>(null);

  useEffect(() => {
    if (prevSessionId.current && prevSessionId.current !== sessionId) {
      leaveSession(prevSessionId.current);
    }
    if (sessionId) {
      joinSession(sessionId);
      prevSessionId.current = sessionId;
    }
    return () => {
      if (sessionId) leaveSession(sessionId);
    };
  }, [sessionId]);
}
