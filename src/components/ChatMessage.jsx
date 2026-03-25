import React from 'react';

const ChatMessage = ({ message }) => (
  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[85%] p-4 rounded-organic transition-all duration-200 ${
      message.role === 'user'
        ? 'bg-leaf-700 text-white rounded-tr-sm shadow-leaf'
        : 'bg-white/90 backdrop-blur-sm border border-organic-100 text-organic-800 rounded-tl-sm shadow-organic-sm'
    }`}>
      {message.content}
    </div>
  </div>
);

export default ChatMessage;
