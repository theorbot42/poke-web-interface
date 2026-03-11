import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useChatStore } from '@/stores/chatStore';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isTyping } = useChatStore();

  const isDisabled = disabled || isTyping;

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed || isDisabled) return;
    onSend(trimmed);
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [content, isDisabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  };

  return (
    <div className="p-4 border-t border-gray-800">
      <div
        className={cn(
          'flex items-end gap-2 bg-gray-900 border rounded-2xl px-4 py-3 transition-colors',
          isDisabled ? 'border-gray-800' : 'border-gray-700 focus-within:border-poke-500'
        )}
      >
        <button
          className="text-gray-600 hover:text-gray-400 transition-colors mb-0.5 flex-shrink-0"
          title="Attacher un fichier (bientôt)"
          disabled
        >
          <Paperclip size={18} />
        </button>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => { setContent(e.target.value); handleInput(); }}
          onKeyDown={handleKeyDown}
          placeholder={isTyping ? 'Poke répond...' : 'Envoyer un message... (Shift+Entrée pour nouvelle ligne)'}
          disabled={isDisabled}
          rows={1}
          className={cn(
            'flex-1 bg-transparent text-sm text-white placeholder-gray-500 resize-none outline-none',
            'max-h-40 leading-relaxed',
            isDisabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{ minHeight: '24px' }}
        />

        <button
          onClick={handleSend}
          disabled={!content.trim() || isDisabled}
          className={cn(
            'p-1.5 rounded-lg transition-all flex-shrink-0 mb-0.5',
            content.trim() && !isDisabled
              ? 'bg-poke-600 hover:bg-poke-700 text-white'
              : 'text-gray-600 cursor-not-allowed'
          )}
        >
          <Send size={16} />
        </button>
      </div>
      <p className="text-xs text-gray-600 text-center mt-2">
        Poke peut faire des erreurs. Vérifiez les informations importantes.
      </p>
    </div>
  );
}
