import { Bot } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 bg-poke-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
          <Bot size={32} className="text-white" />
        </div>
        <p className="text-gray-400 text-sm">Chargement...</p>
      </div>
    </div>
  );
}
