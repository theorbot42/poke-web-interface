import { useEffect, useRef } from 'react';
import type { Message } from '@/types';
import MessageBubble from './MessageBubble';
import TypingIndicator from '@/components/common/TypingIndicator';
import { useChatStore } from '@/stores/chatStore';

interface MessageListProps {
  messages: Message[];
  sessionId: string;
}

export default function MessageList({ messages, sessionId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { isTyping } = useChatStore();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">Démarrez la conversation !</p>
        </div>
      )}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
