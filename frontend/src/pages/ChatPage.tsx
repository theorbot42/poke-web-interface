import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useMessages, useCreateSession, useDeleteSession } from '@/hooks/useChat';
import { useSessionSocket } from '@/hooks/useSocket';
import { useSendMessage } from '@/hooks/useChat';
import MessageList from '@/components/Chat/MessageList';
import ChatInput from '@/components/Chat/ChatInput';
import ChatHeader from '@/components/Chat/ChatHeader';
import EmptyState from '@/components/common/EmptyState';

export default function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { messages, setActiveSession } = useChatStore();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();

  const { data: sessions } = useMessages(sessionId ?? null);
  const sessionMessages = sessionId ? (messages[sessionId] ?? []) : [];
  const sendMessage = useSendMessage(sessionId ?? null);

  useSessionSocket(sessionId ?? null);

  useEffect(() => {
    if (sessionId) setActiveSession(sessionId);
    else setActiveSession(null);
  }, [sessionId]);

  const handleNewSession = async () => {
    const session = await createSession.mutateAsync();
    navigate(`/chat/${session.id}`);
  };

  const handleDeleteSession = () => {
    if (sessionId) {
      deleteSession.mutate(sessionId);
      navigate('/chat');
    }
  };

  if (!sessionId) {
    return <EmptyState onNewSession={handleNewSession} />;
  }

  const session = useChatStore.getState().sessions.find(s => s.id === sessionId);

  return (
    <div className="flex flex-col h-full">
      {session && (
        <ChatHeader session={session} onDelete={handleDeleteSession} />
      )}
      <MessageList messages={sessionMessages} sessionId={sessionId} />
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
