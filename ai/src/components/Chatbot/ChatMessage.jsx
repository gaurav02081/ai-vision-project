import React from 'react';

const ChatMessage = ({ message, isUser, timestamp }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
        isUser 
          ? 'bg-blue-600 text-white rounded-br-none' 
          : 'bg-gray-700 text-white rounded-bl-none'
      }`}>
        <div className="text-base whitespace-pre-wrap break-words">
          {message}
        </div>
        {timestamp && (
          <div className={`text-sm mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-400'
          }`}>
            {formatTime(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
