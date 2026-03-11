import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Settings, LogOut, Plus, Trash2, Bot } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { useSessions, useCreateSession, useDeleteSession } from '@/hooks/useChat';
import { cn } from '@/utils/cn';
import { formatDistanceToNow } from 'date-fns';

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { activeSessionId, setActiveSession } = useChatStore();
  const { data: sessions = [], isLoading } = useSessions();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();

  const handleNewSession = async () => {
    const session = await createSession.mutateAsync();
    navigate(`/chat/${session.id}`);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteSession.mutate(sessionId);
    if (activeSessionId === sessionId) navigate('/chat');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-poke-600 rounded-lg flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <span className="font-semibold text-white text-sm">Poke Interface</span>
        </div>
        <button
          onClick={handleNewSession}
          disabled={createSession.isPending}
          className="btn-primary w-full flex items-center gap-2 justify-center text-sm py-2"
        >
          <Plus size={16} />
          Nouvelle conversation
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-40" />
            <p>Aucune conversation</p>
            <p className="text-xs mt-1">Créez-en une !</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {sessions.map((session) => (
              <Link
                key={session.id}
                to={`/chat/${session.id}`}
                onClick={() => setActiveSession(session.id)}
                className={cn(
                  'flex items-start gap-2 p-2.5 rounded-lg cursor-pointer group transition-colors',
                  'hover:bg-gray-800',
                  activeSessionId === session.id ? 'bg-gray-800 border border-gray-700' : ''
                )}
              >
                <MessageSquare size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{session.title}</p>
                  <p className="text-xs text-gray-500">
                    {session.message_count ?? 0} msg
                    {session.last_message_at && ` · ${formatDistanceToNow(new Date(session.last_message_at), { addSuffix: true })}`}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-0.5 rounded flex-shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800 space-y-1">
        <Link
          to="/settings"
          className="flex items-center gap-2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm"
        >
          <Settings size={16} />
          Paramètres
        </Link>
        <div className="flex items-center gap-2 p-2">
          <div className="w-7 h-7 rounded-full bg-poke-700 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{user?.username}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-400 transition-colors p-1 rounded"
            title="Déconnexion"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
