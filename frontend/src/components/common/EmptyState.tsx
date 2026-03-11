import { Bot, Zap } from 'lucide-react';

interface EmptyStateProps {
  onNewSession: () => void;
}

export default function EmptyState({ onNewSession }: EmptyStateProps) {
  const suggestions = [
    'Explique-moi les bases de MCP',
    'Comment configurer Poke ?',
    'Quelles sont tes capacités ?',
    'Aide-moi avec mon projet',
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 animate-fade-in">
      <div className="w-20 h-20 bg-poke-600/20 border border-poke-500/30 rounded-3xl flex items-center justify-center mb-6">
        <Bot size={40} className="text-poke-400" />
      </div>
      <h2 className="text-2xl font-semibold text-white mb-2">Bienvenue sur Poke Interface</h2>
      <p className="text-gray-400 text-center max-w-md mb-8">
        Démarrez une conversation avec Poke, votre assistant MCP.
      </p>
      <div className="grid grid-cols-2 gap-3 max-w-lg w-full mb-8">
        {suggestions.map((text) => (
          <button
            key={text}
            onClick={onNewSession}
            className="text-left p-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl text-sm text-gray-300 transition-all group"
          >
            <Zap size={12} className="text-poke-400 mb-1.5 group-hover:text-poke-300" />
            {text}
          </button>
        ))}
      </div>
      <button onClick={onNewSession} className="btn-primary px-6">
        Nouvelle conversation
      </button>
    </div>
  );
}
