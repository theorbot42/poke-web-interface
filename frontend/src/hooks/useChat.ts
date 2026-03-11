import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/services/api';
import { useChatStore } from '@/stores/chatStore';
import { sendSocketMessage } from '@/services/socket';
import toast from 'react-hot-toast';
import type { ChatSession } from '@/types';

export function useSessions() {
  const { setSessions } = useChatStore();

  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data } = await chatApi.getSessions();
      setSessions(data.sessions);
      return data.sessions as ChatSession[];
    },
    staleTime: 1000 * 30,
  });
}

export function useMessages(sessionId: string | null) {
  const { setMessages } = useChatStore();

  return useQuery({
    queryKey: ['messages', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data } = await chatApi.getMessages(sessionId);
      setMessages(sessionId, data.messages);
      return data.messages;
    },
    enabled: !!sessionId,
    staleTime: 0,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  const { addSession, setActiveSession } = useChatStore();

  return useMutation({
    mutationFn: async (title?: string) => {
      const { data } = await chatApi.createSession(title);
      return data.session as ChatSession;
    },
    onSuccess: (session) => {
      addSession(session);
      setActiveSession(session.id);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: () => toast.error('Impossible de créer la session'),
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  const { removeSession } = useChatStore();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await chatApi.deleteSession(sessionId);
      return sessionId;
    },
    onSuccess: (sessionId) => {
      removeSession(sessionId);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session supprimée');
    },
    onError: () => toast.error('Impossible de supprimer la session'),
  });
}

export function useSendMessage(sessionId: string | null) {
  const { setTyping } = useChatStore();

  return useCallback(
    (content: string) => {
      if (!sessionId || !content.trim()) return;
      setTyping(true);
      sendSocketMessage(sessionId, content);
    },
    [sessionId, setTyping]
  );
}
