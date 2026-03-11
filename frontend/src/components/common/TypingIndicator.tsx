export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-poke-700 flex items-center justify-center text-xs font-medium text-white flex-shrink-0">
        P
      </div>
      <div className="message-assistant flex items-center gap-1 py-3 px-4">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}
