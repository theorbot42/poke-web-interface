import { create } from 'zustand';
import type { ChatSession, Message } from '@/types';

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: Record<string, Message[]>;
  isTyping: boolean;
  setSessions: (sessions: ChatSession[]) => void;
  addSession: (session: ChatSession) => void;
  removeSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  setActiveSession: (sessionId: string | null) => void;
  setMessages: (sessionId: string, messages: Message[]) => void;
  addMessage: (sessionId: string, message: Message) => void;
  setTyping: (typing: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [],
  activeSessionId: null,
  messages: {},
  isTyping: false,

  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((state) => ({ sessions: [session, ...state.sessions] })),
  removeSession: (sessionId) => set((state) => ({
    sessions: state.sessions.filter((s) => s.id !== sessionId),
    activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
  })),
  updateSession: (sessionId, updates) => set((state) => ({
    sessions: state.sessions.map((s) => s.id === sessionId ? { ...s, ...updates } : s),
  })),
  setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),
  setMessages: (sessionId, messages) => set((state) => ({
    messages: { ...state.messages, [sessionId]: messages },
  })),
  addMessage: (sessionId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [sessionId]: [...(state.messages[sessionId] || []), message],
    },
  })),
  setTyping: (isTyping) => set({ isTyping }),
}));
