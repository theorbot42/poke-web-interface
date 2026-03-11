import { type ChatSession } from '@/types';
import { Edit2, MoreVertical, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { chatApi } from '@/services/api';
import { useChatStore } from '@/stores/chatStore';
import toast from 'react-hot-toast';

interface ChatHeaderProps {
  session: ChatSession;
  onDelete: () => void;
}

export default function ChatHeader({ session, onDelete }: ChatHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(session.title);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateSession } = useChatStore();

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const handleRename = async () => {
    if (!title.trim() || title === session.title) {
      setTitle(session.title);
      setIsEditing(false);
      return;
    }
    try {
      await chatApi.updateSessionTitle(session.id, title.trim());
      updateSession(session.id, { title: title.trim() });
      setIsEditing(false);
      toast.success('Renommée');
    } catch {
      toast.error('Erreur lors du renommage');
      setTitle(session.title);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {isEditing ? (
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') { setTitle(session.title); setIsEditing(false); } }}
            className="bg-gray-800 border border-gray-600 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:border-poke-500 max-w-xs"
          />
        ) : (
          <h2 className="text-sm font-medium text-white truncate">{session.title}</h2>
        )}
      </div>
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-gray-500 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <MoreVertical size={16} />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-10 py-1 min-w-[150px] animate-fade-in">
            <button
              onClick={() => { setIsEditing(true); setShowMenu(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <Edit2 size={13} /> Renommer
            </button>
            <button
              onClick={() => { onDelete(); setShowMenu(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
            >
              <Trash2 size={13} /> Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
