import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import type { Message } from '@/types';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  if (socket?.connected) return socket;

  const token = useAuthStore.getState().token;

  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('WebSocket connection error:', err.message);
  });

  socket.on('message:saved', (message: Message) => {
    useChatStore.getState().addMessage(message.session_id, message);
  });

  socket.on('poke:response', (message: Message) => {
    useChatStore.getState().addMessage(message.session_id, message);
    useChatStore.getState().setTyping(false);
  });

  socket.on('poke:typing', () => {
    useChatStore.getState().setTyping(true);
  });

  socket.on('poke:typing:stop', () => {
    useChatStore.getState().setTyping(false);
  });

  socket.on('poke:message', (message: Message) => {
    useChatStore.getState().addMessage(message.session_id, message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;

export const joinSession = (sessionId: string) => {
  socket?.emit('join:session', sessionId);
};

export const leaveSession = (sessionId: string) => {
  socket?.emit('leave:session', sessionId);
};

export const sendSocketMessage = (sessionId: string, content: string) => {
  socket?.emit('chat:message', { sessionId, content });
};
