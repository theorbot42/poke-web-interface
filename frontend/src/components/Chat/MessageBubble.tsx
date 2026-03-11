import { cn } from '@/utils/cn';
import type { Message } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bot, User } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex items-end gap-2 animate-slide-up',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mb-0.5',
          isUser ? 'bg-poke-600' : 'bg-gray-700'
        )}
      >
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-poke-300" />}
      </div>

      {/* Bubble */}
      <div className={cn(isUser ? 'message-user' : 'message-assistant')}>
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </div>
        <div
          className={cn(
            'text-xs mt-1.5',
            isUser ? 'text-poke-200/70 text-right' : 'text-gray-500'
          )}
        >
          {format(new Date(message.created_at), 'HH:mm', { locale: fr })}
        </div>
      </div>
    </div>
  );
}
