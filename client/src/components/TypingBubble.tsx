const TypingBubble = () => {
  return (
<div className="p-10">
  <div className="flex items-center space-x-3 text-gray-600 text-sm">
    <div className="flex h-full items-center space-x-1">
      <div className="h-5 animate-bounce  animation-delay-200">
        <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
      </div>
      <div className="h-5 animate-bounce animation-delay-300">
        <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
      </div>
      <div className="h-5 animate-bounce animation-delay-400">
        <div className="h-1.5 w-1.5 rounded-full bg-gray-400"></div>
      </div>
    </div>
    <p className="mb-4">Thinking...</p>
  </div>
</div>
  );
};

export default TypingBubble;